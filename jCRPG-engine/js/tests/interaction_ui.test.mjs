import test from 'node:test';
import assert from 'node:assert/strict';
import { InteractionUI } from '../interactions/ui.js';
import { SaveDeltas } from '../world/save_deltas.js';

// Minimal DOM for exercising the real panel lifecycle and registered handlers.
function fixture(t) {
    const oldDocument = globalThis.document;
    t.after(() => { globalThis.document = oldDocument; });
    class Element {
        constructor(tag) {
            this.tagName = tag.toUpperCase();
            this.children = [];
            this.dataset = {};
            this.listeners = {};
            this.textContent = '';
        }
        append(child) { this.children.push(child); }
        replaceChildren() { this.children = []; }
        setAttribute(name, value) { this[name] = value; }
        contains(child) { return this === child || this.children.some(c => c.contains(child)); }
        querySelectorAll(selector) {
            return this.children.flatMap(child => [
                ...(child.tagName.toLowerCase() === selector || '#' + child.id === selector ? [child] : []),
                ...child.querySelectorAll(selector),
            ]);
        }
        querySelector(selector) {
            if (selector === 'header button') return this.querySelector('header').querySelector('button');
            return this.querySelectorAll(selector)[0] ?? null;
        }
        set innerHTML(value) {
            const header = new Element('header'), title = new Element('h2');
            const close = new Element('button'), body = new Element('div');
            body.id = 'interaction-body';
            header.append(title); header.append(close);
            this.append(header); this.append(body);
        }
        addEventListener(type, listener) { this.listeners[type] = listener; }
        emit(type, event = {}) {
            this.listeners[type]?.({ target: this, preventDefault() {}, ...event });
        }
        getBoundingClientRect() { return { left: 20, right: 200, top: 20, bottom: 200 }; }
        showModal() { this.open = true; }
        close() { this.open = false; }
        focus() { document.activeElement = this; }
        click() { this.onclick?.(); }
    }
    globalThis.document = { body: new Element('body'), createElement: tag => new Element(tag) };
    const origin = new Element('button'); origin.focus();
    const calls = [], save = new SaveDeltas();
    save.persist = () => calls.push('save');
    const mission = {
        id: 'quest', title: 'A quest', state: 'active', summary: 'Help a friend.',
        turnInActorId: 'guide', progress: [],
    };
    const engine = {
        panel: null, content: { actors: [] },
        maps: { actors: { guide: { name: 'Guide' } }, itemTypes: { coin: { name: 'Coin' } } },
        intuition: () => ({ name: 'Guide', summary: 'A careful listener.' }),
        journal: () => [mission], navigationGoal: () => null,
        setNavigationGoal: id => calls.push(id),
        choose: index => { calls.push(index); engine.panel = null; return {}; },
    };
    const state = { interactions: engine, saveDeltas: save, party: { position: {} }, realm: 'surface' };
    const renderer = {
        setInputEnabled: enabled => calls.push(enabled ? 'resume' : 'pause'),
        requestRender: () => calls.push('render'),
    };
    const ui = new InteractionUI(state, renderer, message => calls.push(message));
    return { ui, engine, calls, origin, save };
}

test('intuition primary action survives label changes; closing restores input and focus', t => {
    const { ui, calls, origin } = fixture(t);
    ui.openIntuition({});
    assert.equal(ui.dialog.dataset.kind, 'intuition');
    assert.equal(ui.closeButton.hidden, true);
    assert.equal(document.activeElement, ui.primaryButton);
    ui.primaryButton.textContent = 'Return';
    ui.dialog.emit('pointerdown', { button: 0, pointerId: 1, clientX: 5, clientY: 5 });
    ui.dialog.emit('pointerup', { pointerId: 1, clientX: 5, clientY: 5 });
    assert.equal(ui.dialog.open, false);
    assert.equal(document.activeElement, origin);
    assert.deepEqual(calls, ['pause', 'resume', 'render']);
    assert.equal(ui.primaryButton, null);
    assert.equal(ui.backdropButtons.size, 0);
});

test('panel transitions reset primary actions, styles and Close/Back behavior', t => {
    const { ui } = fixture(t);
    ui.openIntuition({}); const oldButton = ui.primaryButton;
    ui.openJournal();
    assert.equal(ui.dialog.dataset.kind, 'journal');
    assert.equal(ui.closeButton.hidden, false);
    assert.equal(ui.backdropButtons.has(oldButton), false);
    ui.advanceFromBackdrop(); assert.equal(ui.title.textContent, 'Journal');
    ui.primaryButton.click(); assert.equal(ui.title.textContent, 'A quest');
    assert.equal(ui.closeButton.textContent, 'Back');
    ui.closeButton.click(); assert.equal(ui.title.textContent, 'Journal');
    ui.openInventory();
    assert.equal(ui.dialog.dataset.kind, 'inventory');
    assert.equal(ui.closeButton.textContent, 'Close');
    ui.primaryButton.textContent = 'Done'; ui.advanceFromBackdrop();
    assert.equal(ui.dialog.open, false);
});

test('dialogue keyboard selection and backdrop use the selected response; E has an explicit default', t => {
    const { ui, engine, calls } = fixture(t);
    const dialogue = { actor: { name: 'Guide' }, text: 'Welcome.', choices: [{ text: 'First' }, { text: 'Second' }] };
    engine.panel = { kind: 'dialogue' }; engine.dialogue = () => dialogue;
    ui.show();
    assert.equal(ui.dialog.dataset.kind, 'dialogue');
    assert.equal(ui.primaryButton.dataset.primary, 'true');
    ui.dialog.emit('keydown', { key: 'ArrowDown' });
    assert.equal(document.activeElement.textContent, 'Second');
    ui.advanceFromBackdrop(); assert.ok(calls.includes(1));
    assert.equal(ui.dialog.open, false); assert.ok(calls.includes('save'));
    engine.panel = { kind: 'dialogue' }; ui.show(); document.activeElement = document.body;
    ui.dialog.emit('keydown', { key: 'e', repeat: true }); assert.equal(ui.dialog.open, true);
    ui.dialog.emit('keydown', { key: 'e' }); assert.ok(calls.includes(0));
    assert.equal(ui.dialog.open, false);
});

test('container actions never activate from a backdrop tap; empty-container dismissal opts in', t => {
    const { ui, save } = fixture(t);
    const container = { id: 'chest', name: 'Chest', items: [{ id: 'coin1', typeId: 'coin' }] };
    ui.showContainer(container); ui.focus();
    assert.equal(ui.primaryButton.textContent, 'Take Coin');
    ui.advanceFromBackdrop(); assert.equal(ui.dialog.open, true);
    assert.equal(ui.backdropButtons.size, 0);
    save.data.containers.chest = { takenItemIds: ['coin1'] };
    ui.showContainer(container); ui.focus(); ui.primaryButton.textContent = 'Leave';
    ui.advanceFromBackdrop(); assert.equal(ui.dialog.open, false);
});

test('dragged and cancelled backdrop presses do not activate; Escape still dismisses', t => {
    const { ui } = fixture(t);
    ui.openIntuition({});
    const down = { button: 0, pointerId: 1, clientX: 5, clientY: 5 };
    ui.dialog.emit('pointerdown', down);
    ui.dialog.emit('pointermove', { ...down, clientX: 16 });
    ui.dialog.emit('pointerup', down); assert.equal(ui.dialog.open, true);
    ui.dialog.emit('pointerdown', down); ui.dialog.emit('pointercancel');
    ui.dialog.emit('pointerup', down); assert.equal(ui.dialog.open, true);
    ui.dialog.emit('cancel'); assert.equal(ui.dialog.open, false);
});
