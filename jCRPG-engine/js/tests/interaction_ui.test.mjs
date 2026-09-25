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
    assert.equal(ui.body.querySelector('button'), null);
    ui.closeButton.click();
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

test('dialogue focuses the farewell default and uses it for E and backdrop activation', t => {
    const { ui, engine, calls } = fixture(t);
    engine.dialogue = () => ({
        actor: { name: 'Guide' }, text: 'How is the work going?',
        choices: [{ text: 'Review the mission', next: 'hint' }, { text: 'Until next time.' }],
        defaultChoiceIndex: 1,
    });
    for (const activate of [() => ui.dialog.emit('keydown', { key: 'e' }), () => ui.advanceFromBackdrop()]) {
        engine.panel = { kind: 'dialogue' };
        ui.show();
        assert.equal(document.activeElement.textContent, 'Until next time.');
        assert.equal(ui.primaryButton, document.activeElement);
        activate();
        assert.equal(ui.dialog.open, false);
    }
    assert.deepEqual(calls.filter(call => typeof call === 'number'), [1, 1]);
});

test('dialogue text and panel taps activate the default; buttons and drags do not', t => {
    const { ui, engine, calls } = fixture(t);
    engine.panel = { kind: 'dialogue' };
    engine.dialogue = () => ({
        actor: { name: 'Guide' }, text: 'Welcome.',
        choices: [{ text: 'Review', next: 'hint' }, { text: 'Until next time.' }],
        defaultChoiceIndex: 1,
    });
    const pointer = target => ({target, button: 0, pointerId: 1, clientX: 50, clientY: 50});
    for (const targetOf of [() => ui.body.querySelector('span'), () => ui.body, () => ui.dialog, () => ui.title]) {
        engine.panel = { kind: 'dialogue' };
        ui.show();
        ui.body.querySelector('button').focus();
        const event = pointer(targetOf());
        ui.dialog.emit('pointerdown', event);
        ui.dialog.emit('pointerup', event);
        assert.equal(ui.dialog.open, false);
    }
    assert.deepEqual(calls.filter(call => typeof call === 'number'), [1, 1, 1, 1]);
    engine.panel = { kind: 'dialogue' };
    ui.show();
    const button = ui.body.querySelector('button');
    ui.dialog.emit('pointerdown', pointer(button));
    ui.dialog.emit('pointerup', pointer(button));
    assert.equal(ui.dialog.open, true);
    const text = pointer(ui.body.querySelector('span'));
    ui.dialog.emit('pointerdown', text);
    ui.dialog.emit('pointermove', {...text, clientX: 70});
    ui.dialog.emit('pointerup', text);
    assert.equal(ui.dialog.open, true);
    button.click();
    assert.equal(calls.filter(call => typeof call === 'number').at(-1), 0);
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

test('inventory table shows stack counts and item details return through Back', t => {
    const {ui,save,engine} = fixture(t);
    engine.maps.itemTypes.coin.note = 'An old silver coin.';
    save.data.inventory = {version:2,order:['coins'],items:{coins:{id:'coins',typeId:'coin',quantity:3,sourceIds:['a','b','c']}}};
    ui.openInventory();
    const table=ui.body.querySelector('table');
    assert.ok(table);assert.deepEqual(table.querySelectorAll('th').map(e=>e.textContent),['','Item','Count']);
    assert.equal(table.querySelector('tbody').querySelectorAll('tr').length,1);
    assert.equal(table.querySelectorAll('td')[2].textContent,'3');
    table.querySelector('button').click();
    assert.equal(ui.title.textContent,'Coin');assert.equal(ui.closeButton.textContent,'Back');
    assert.deepEqual(ui.body.querySelectorAll('p').map(e=>e.textContent),['Count: 3','An old silver coin.','No tags.']);
    ui.closeButton.click();assert.equal(ui.title.textContent,'Inventory');
    const row=ui.body.querySelector('tbody').querySelector('tr');
    row.emit('click',{target:row.querySelectorAll('td')[2]});assert.equal(ui.title.textContent,'Coin');
    assert.equal(ui.backdropButtons.size,0,'item details do not activate unrelated actions');
});

test('successful Take and Take All close the container; failed transfers keep it open', t => {
    const {ui,engine,calls} = fixture(t);
    const container = {id:'chest',name:'Chest',items:[{id:'one',typeId:'coin'},{id:'two',typeId:'coin'}]};
    engine.transact = () => ({message:'Taken'});
    for (const label of ['Take Coin','Take All']) {
        ui.showContainer(container);
        ui.body.querySelectorAll('button').find(button=>button.textContent===label).click();
        assert.equal(ui.dialog.open,false);
        assert.equal(engine.panel,null);
        assert.equal(calls.at(-2),'resume');
    }
    ui.showContainer(container);
    engine.transact = () => {throw Error('Transfer failed');};
    ui.primaryButton.click();
    assert.equal(ui.dialog.open,true);
    assert.equal(calls.at(-1),'Transfer failed');
});

test('container intuition displays the remaining quantity including zero', t => {
    const {ui,engine} = fixture(t);
    for (const count of [0,1,3]) {
        engine.intuition = () => ({name:'Chest',summary:'A wooden chest.',itemCount:count});
        ui.openIntuition({});
        assert.equal(ui.body.querySelectorAll('p')[1].textContent,`${count} ${count===1?'item':'items'} remaining.`);
    }
});

test('dialogue Continue uses click, E and backdrop to advance captions before offering choices', t => {
    const {ui,engine,calls} = fixture(t);
    let caption = 0;
    engine.panel = {kind:'dialogue'};
    engine.dialogue = () => ({actor:{name:'Guide'},text:['One.','Two.','Three.'][caption],canAdvance:caption<2,choices:caption<2?[]:[{text:'Accept'}]});
    engine.advanceDialogue = () => { caption++; };
    ui.show();
    assert.deepEqual(ui.body.querySelectorAll('button').map(b=>b.textContent), ['...']);
    ui.dialog.emit('keydown', {key:'e'}); assert.equal(caption,1);
    ui.advanceFromBackdrop(); assert.equal(caption,2);
    assert.deepEqual(ui.body.querySelectorAll('button').map(b=>b.textContent), ['Accept']);
    assert.ok(!calls.includes('save'), 'reading alone does not commit an interaction');
    ui.primaryButton.click(); assert.ok(calls.includes('save'));
});

test('region intuition links tracked side and next main missions without changing tracking', async t => {
 const {ui,engine,save}=fixture(t);
 const main={id:'main',kind:'main',title:'Restore the road',state:'active',summary:'Main details',progress:[],turnInActorId:'guide'};
 const side={id:'side',kind:'side',title:'Help the keeper',state:'active',summary:'Side details',progress:[],turnInActorId:'guide'};
 engine.intuition=()=>null;ui.regionIntuition=()=>({name:'Forest',summary:'Trees surround you.'});
 engine.journal=()=>[side,main];engine.currentStoryChapter=()=>({missionId:'main'});
 engine.navigationGoal=()=>({name:'Speak to the keeper'});engine.mainNavigationGoal=()=>({name:'Wake the shrine'});
 save.data.navMissionId='side';
 ui.openIntuition(null);
 const links=ui.body.children.filter(e=>e.className==='intuition-mission-link');
 assert.equal(links.length,4);
 assert.ok(ui.body.children.some(e=>e.textContent==='Next: Speak to the keeper'));
 assert.ok(ui.body.children.some(e=>e.textContent==='Next: Wake the shrine'));
 assert.deepEqual(links.map(link=>link.textContent),['Current: Help the keeper','Next: Speak to the keeper','Main story: Restore the road','Next: Wake the shrine']);
 assert.equal(ui.primaryButton,ui.closeButton);
 assert.equal(ui.closeButton.hidden,false);
 assert.equal(ui.body.children.some(e=>e.textContent==='Continue'),false);
 await links[1].onclick();assert.equal(ui.title.textContent,'Help the keeper');
 ui.openIntuition(null);await ui.body.children.find(e=>e.className==='intuition-mission-link'&&e.textContent==='Next: Wake the shrine').onclick();
 assert.equal(ui.title.textContent,'Restore the road');assert.equal(save.data.navMissionId,'side');
 save.data.navMissionId='main';ui.openIntuition(null);
 assert.equal(ui.body.children.filter(e=>e.className==='intuition-mission-link').length,2);
 save.data.navMissionId=null;ui.openIntuition(null);
 assert.equal(ui.body.children.filter(e=>e.className==='intuition-mission-link').length,2);
 main.state='completed';side.state='completed';ui.openIntuition(null);
 assert.equal(ui.body.children.filter(e=>e.className==='intuition-mission-link').length,0);
 assert.ok(ui.body.children.some(e=>e.textContent.startsWith('No next mission')));
});

test('mission actions are ordered and set a waypoint, travel, or show the map',async t=>{
 const {ui,engine,calls}=fixture(t);
 const goal={id:'target',name:'Target',position:[12,42,30],realm:'cave'};
 engine.navigationGoal=()=>goal;
 let travelled,shown;
 ui.onTravelQuest=async destination=>{travelled=destination;};
 ui.onShowQuestMap=destination=>{shown=destination;};
 await ui.openQuest('quest');
 const actions=()=>ui.body.children.filter(e=>e.tagName==='BUTTON');
 assert.deepEqual(actions().map(b=>b.textContent),['Set waypoint','Travel here','Show on map']);
 actions()[0].click();assert.ok(calls.includes('quest'));assert.equal(ui.dialog.open,false);assert.equal(travelled,undefined);
 await ui.openQuest('quest');await actions()[1].onclick();assert.equal(travelled,goal);assert.equal(ui.dialog.open,false);
 await ui.openQuest('quest');actions()[2].click();assert.equal(shown,goal);
 await ui.openQuest('quest');ui.onTravelQuest=async()=>{throw Error('No walkable floor');};
 await actions()[1].onclick();assert.equal(ui.dialog.open,true);assert.equal(actions()[1].disabled,false);
 assert.ok(ui.body.children.some(e=>e.textContent==='Could not travel: No walkable floor'));
});

test('report completion is displayed without quotes before continuing or closing', t => {
    const {ui,engine,calls} = fixture(t);
    for (const hasFollowup of [false,true]) {
        engine.panel = {kind:'dialogue'};
        engine.dialogue = () => ({actor:{name:'Guide'},text:'The road is open.',choices:[{text:'Report'}]});
        engine.choose = () => {
            engine.panel = hasFollowup ? {kind:'dialogue'} : null;
            return {message:'The relay answers. Completed: Restore the road',completedMissions:[{id:'road',title:'Restore the road'}]};
        };
        ui.show(); ui.primaryButton.click();
        assert.equal(ui.dialog.open,true);
        assert.equal(ui.title.textContent,'Mission completed');
        assert.equal(ui.body.querySelector('p').textContent,'The relay answers. Completed: Restore the road');
        assert.equal(ui.body.querySelectorAll('span').length,0);
        assert.ok(calls.includes('The relay answers. Completed: Restore the road'));
        ui.primaryButton.click();
        assert.equal(ui.dialog.open,hasFollowup);
        if(hasFollowup) assert.equal(ui.title.textContent,'Guide');
        ui.close();
    }
});

test('item-use result shows unquoted text and Continue restores game controls', t => {
    const {ui,engine,calls}=fixture(t);
    engine.panel={kind:'result',title:'Item used',message:'The coil settles into the socket. The road relay answers.'};
    ui.show();
    assert.equal(ui.title.textContent,'Item used');
    assert.equal(ui.body.querySelector('p').textContent,engine.panel.message);
    assert.equal(ui.body.querySelectorAll('span').length,0);
    ui.primaryButton.click();
    assert.equal(engine.panel,null);
    assert.equal(ui.dialog.open,false);
    assert.ok(calls.includes('resume'));
});
