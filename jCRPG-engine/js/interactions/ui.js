import {TERRAIN_NAMES} from '../frozen_world.js';
import { revealReadDialogue } from '../map_discovery.js';

/** Accessible bounded panels; world movement pauses while a panel owns focus. */
export class InteractionUI {
    constructor(state, renderer, log) {
        this.state = state;
        this.renderer = renderer;
        this.log = log;
        this.returnFocus = null;

        this.dialog = document.createElement('dialog');
        this.dialog.id = 'interaction-panel';
        this.dialog.setAttribute('aria-labelledby', 'interaction-title');
        this.dialog.innerHTML = '<header><h2 id="interaction-title"></h2>'
            + '<button type="button" aria-label="Close interaction">Close</button>'
            + '</header><div id="interaction-body"></div>';
        document.body.append(this.dialog);
        this.body = this.dialog.querySelector('#interaction-body');
        this.title = this.dialog.querySelector('h2');
        this.closeButton = this.dialog.querySelector('header button');

        this.primaryButton = null;
        this.backdropButtons = new Set();
        this.backdropPress = null;
        this.bindEvents();
    }

    bindEvents() {
        const handlers = {
            pointerdown: 'handlePointerDown',
            pointermove: 'handlePointerMove',
            pointercancel: 'handlePointerCancel',
            pointerup: 'handlePointerUp',
            cancel: 'handleCancel',
            keydown: 'handleKeyDown',
        };
        for (const [event, method] of Object.entries(handlers)) {
            this.dialog.addEventListener(event, value => this[method](value));
        }
        this.closeButton.onclick = () => this.close();
    }

    isBackdrop(event) {
        const rect = this.dialog.getBoundingClientRect();
        return event.target === this.dialog && (
            event.clientX < rect.left || event.clientX > rect.right
            || event.clientY < rect.top || event.clientY > rect.bottom
        );
    }

    advanceArea(event) {
        if (this.isBackdrop(event)) return 'backdrop';
        if (this.dialog.dataset.kind === 'dialogue'
            && this.dialog.contains(event.target)
            && ![...this.dialog.querySelectorAll('button')].some(button => button.contains(event.target))) {
            return 'dialogue';
        }
        return null;
    }

    handlePointerDown(event) {
        const area = this.advanceArea(event);
        this.backdropPress = event.button === 0 && area
            ? { id: event.pointerId, x: event.clientX, y: event.clientY, area }
            : null;
    }

    handlePointerMove(event) {
        const press = this.backdropPress;
        if (press && Math.hypot(event.clientX - press.x, event.clientY - press.y) >= 8) {
            this.backdropPress = null;
        }
    }

    handlePointerCancel() {
        this.backdropPress = null;
    }

    handlePointerUp(event) {
        const press = this.backdropPress;
        this.backdropPress = null;
        if (
            press && press.id === event.pointerId && this.advanceArea(event) === press.area
            && Math.hypot(event.clientX - press.x, event.clientY - press.y) < 8
        ) {
            if (press.area === 'dialogue') this.primaryButton?.click();
            else this.advanceFromBackdrop();
        }
    }

    handleCancel(event) {
        event.preventDefault();
        this.close();
    }

    handleKeyDown(event) {
        if (event.repeat) return;

        if (event.key.toLowerCase() === 'e') {
            event.preventDefault();
            const active = document.activeElement;
            const button = this.dialog.contains(active) && active.tagName === 'BUTTON'
                ? active
                : this.primaryButton;
            button?.click();
        }

        if (['ArrowDown', 'ArrowUp', 'w', 's'].includes(event.key)) {
            event.preventDefault();
            const buttons = [...this.body.querySelectorAll('button')];
            const index = buttons.indexOf(document.activeElement);
            const direction = ['ArrowUp', 'w'].includes(event.key) ? -1 : 1;
            buttons[(index + direction + buttons.length) % buttons.length]?.focus();
        }
    }

    advanceFromBackdrop() {
        const active = document.activeElement;
        const button = this.backdropButtons.has(active) ? active : this.primaryButton;
        if (this.backdropButtons.has(button)) button.click();
    }

    text(tag, value, parent = this.body) {
        const element = document.createElement(tag);
        element.textContent = value;
        parent.append(element);
        return element;
    }

    /** Explicitly opt actions into keyboard defaults and backdrop activation. */
    button(label, action, { parent = this.body, primary = false, backdrop = false } = {}) {
        const button = this.text('button', label, parent);
        button.type = 'button';
        button.onclick = () => {
            try {
                action();
            } catch (error) {
                this.log(error.message);
            }
        };
        if (primary) {
            this.primaryButton = button;
            button.dataset.primary = 'true';
        }
        if (backdrop) this.backdropButtons.add(button);
        return button;
    }

    open(title, kind = '') {
        this.title.textContent = title;
        this.body.replaceChildren();
        this.dialog.dataset.kind = kind;
        this.closeButton.hidden = ['dialogue', 'intuition', 'container'].includes(kind);
        this.primaryButton = null;
        this.backdropButtons.clear();
        this.backdropPress = null;

        const button = this.closeButton;
        button.textContent = 'Close';
        button.setAttribute('aria-label', 'Close interaction');
        button.onclick = () => this.close();
        if (!this.dialog.open) {
            this.returnFocus = document.activeElement;
            this.renderer.setInputEnabled(false);
            this.dialog.showModal();
        }
    }

    focus() {
        const target = this.primaryButton ?? this.body.querySelector('button')
            ?? (this.closeButton.hidden ? this.dialog : this.closeButton);
        target.focus();
    }

    close() {
        this.state.interactions.panel = null;
        this.primaryButton = null;
        this.backdropButtons.clear();
        this.backdropPress = null;
        this.dialog.close();
        this.renderer.setInputEnabled(true);
        this.returnFocus?.focus();
        this.renderer.requestRender();
    }

    persist() {
        this.state.saveDeltas.persist(this.state.party.position, this.state.realm);
    }

    saveAndRefresh() {
        this.persist();
        this.renderer.requestRender();
    }

    commit(actions) {
        const result = this.state.interactions.transact(actions);
        this.persist();
        this.log(result.message);
        this.renderer.requestRender();
        return result;
    }

    show() {
        const engine = this.state.interactions;
        const panel = engine.panel;
        if (!panel) {
            if (this.dialog.open) this.close();
            return;
        }

        if (panel.kind === 'dialogue') {
            this.showDialogue(engine.dialogue());
        } else {
            this.showContainer(engine.maps.containers[panel.id]);
        }
        this.focus();
    }

    showDialogue(dialogue) {
        const engine = this.state.interactions;
        this.open(dialogue.actor.name, 'dialogue');
        const speech = this.text('p', '');
        this.text('span', '"', speech);
        this.text('span', dialogue.text + '"', speech);

        if (revealReadDialogue(
            this.state.saveDeltas,
            this.state.mapMarkers ?? [],
            dialogue,
            engine.content.actors
        )) {
            this.saveAndRefresh();
        }

        if (dialogue.canAdvance || !dialogue.choices.length) {
            const button = this.button('...', () => {
                if (dialogue.canAdvance) {
                    engine.advanceDialogue();
                    this.show();
                } else {
                    this.close();
                }
            }, { primary: true, backdrop: true });
            button.className = 'dialogue-continue';
            button.setAttribute('aria-label', 'Continue');
            return;
        }

        for (let i = 0; i < dialogue.choices.length; i++) {
            this.button(dialogue.choices[i].text, () => {
                const result = engine.choose(i);
                this.persist();
                if (result.message) this.log(result.message);
                this.show();
                this.renderer.requestRender();
            }, { primary: i === (dialogue.defaultChoiceIndex ?? 0), backdrop: true });
        }
    }

    showContainer(container) {
        const engine = this.state.interactions;
        const taken = this.state.saveDeltas.data.containers[container.id]?.takenItemIds ?? [];
        this.open(container.name, 'container');
        const items = container.items.filter(item => !taken.includes(item.id));
        if (!items.length) {
            this.text('p', 'This container is empty. Its contents are in your party inventory.');
        }
        for (const [index, item] of items.entries()) {
            this.button('Take ' + engine.maps.itemTypes[item.typeId].name, () => {
                this.commit([{ op: 'take', id: container.id, itemIds: [item.id] }]);
                this.close();
            }, { primary: index === 0 });
        }
        if (items.length > 1) {
            this.button('Take All', () => {
                this.commit([{ op: 'take', id: container.id }]);
                this.close();
            });
        }
        const continueButton = this.button('Continue', () => this.close(), {
            primary: !items.length,
            backdrop: !items.length,
        });
        continueButton.className = 'container-continue';
    }

    regionIntuition() {
        const {exploration, party, realm} = this.state;
        const p = party.position, world = exploration.world;
        const cell = exploration.cellAt?.(p.x, p.y, p.z, realm);
        const landmark = world.landmarkAt(p.x, p.z);
        const maze = cell?.structure?.kind === 'SimpleDungeonPart';
        const name = realm === 'cave' ? 'Natural cave' : maze ? 'Labyrinth' : landmark?.name || TERRAIN_NAMES[world.typeAt(p.x,p.z)];
        const setting = realm === 'cave' ? 'You are underground. Follow the exit marker to return to the surface.' : maze ? 'You are inside a labyrinth. The map marks its exits and guides you toward your local objective or a way outside.' : `You are exploring ${TERRAIN_NAMES[world.typeAt(p.x,p.z)].toLowerCase()}${landmark ? ' near ' + landmark.name : ''}.`;
        return {name, summary: `${setting} Your position is ${Math.floor(p.x)}, ${Math.floor(p.z)}.`};
    }

    openIntuition(anchor) {
        const info = this.state.interactions.intuition(anchor) || this.regionIntuition();
        if (!info?.summary) return;

        this.open('Intuition · ' + info.name, 'intuition');
        this.text('p', info.summary);
        if (info.itemCount !== undefined) {
            this.text('p', `${info.itemCount} ${info.itemCount === 1 ? 'item' : 'items'} remaining.`);
        }
        this.button('Continue', () => this.close(), { primary: true, backdrop: true });
        this.focus();
    }

    openJournal() {
        this.open('Journal', 'journal');
        const engine = this.state.interactions;
        const save = this.state.saveDeltas.data;
        const story = engine.content.stories?.[0];
        if (story) {
            this.text('h3', '★ Main story · ' + story.title);
            const chapter = engine.currentStoryChapter();
            this.text('p', chapter ? chapter.title : story.nextChapterFallback);
            this.text('p', story.chapters.map(c => (c.missionId && engine.missionState(c.missionId) === 'completed' ? '✓ ' : '') + c.title + (c.status === 'planned' ? ' (planned)' : '')).join(' → '));
            if (engine.mainNavigationGoal()) {
                this.text('p', 'Next: ' + engine.mainNavigationGoal().name);
                this.button('Continue main story', () => { engine.continueMainStory(); this.persist(); this.openJournal(); }, {primary:true});
            }
        }
        let count = 0;
        for (const [kind, label] of [['main','★ Main story'],['side','◇ Side quests'],['mini','• Mini quests']]) {
            const entries = engine.journal().filter(m => (m.kind ?? 'side') === kind && (m.state !== 'available' || save.actors[m.giverActorId]?.talked));
            if (!entries.length) continue;
            this.text('h3', label);
            let completed;
            for (const mission of entries) {
                let parent;
                if (mission.state === 'completed') {
                    if (!completed) { completed = this.text('details', ''); this.text('summary', 'Completed', completed); }
                    parent = completed;
                }
                const button = this.button((mission.id === save.navMissionId ? '◆ ' : '') + mission.title + ' · ' + mission.state.replaceAll('-', ' '), () => this.openQuest(mission.id), {primary:count === 0 && !story});
                if (parent) parent.appendChild(button);
                button.className = 'quest-row';
                count++;
            }
        }
        if (!count) this.text('p', 'Speak to people nearby to learn more.');
        this.focus();
        this.dialog.scrollTop = 0;
    }

    async openQuest(id) {
        const engine = this.state.interactions;
        if(engine.loadRecord)await engine.loadRecord('missions',id);
        const mission = engine.journal().find(mission => mission.id === id);
        if (!mission) return this.openJournal();

        this.open(mission.title, 'journal');
        const back = this.closeButton;
        back.textContent = 'Back';
        back.setAttribute('aria-label', 'Back to journal');
        back.onclick = () => this.openJournal();

        this.text('small', (mission.kind ?? 'side') + ' · ' + mission.state.replaceAll('-', ' '));
        this.text('p', mission.summary);
        for (const objective of mission.progress) {
            this.text(
                'p',
                `${objective.count}/${objective.required ?? objective.targetIds.length} — ${objective.text}`
            );
        }
        const actor = engine.maps.actors[mission.turnInActorId];
        this.text('p', 'Return to ' + actor.name + '.');

        const goal = engine.navigationGoal();
        const selected = this.state.saveDeltas.data.navMissionId === id;
        if (selected && goal) this.text('p', 'Navigation: ' + goal.name);
        if (['available', 'active', 'ready-to-turn-in'].includes(mission.state)) {
            this.button('Show on map', () => {
                engine.setNavigationGoal(id);
                const goal = engine.navigationGoal();
                this.persist();
                this.close();
                this.onShowQuestMap?.(goal, mission);
            }, { primary: true });
        }
        this.focus();
        this.dialog.scrollTop = 0;
    }

    inventoryIcon(item, type, parent, large = false) {
        const icon = item.icon ?? type.icon;
        if (!icon) return;
        const image = this.text('img', '', parent);
        image.className = large ? 'inventory-icon inventory-icon-detail' : 'inventory-icon';
        image.src = 'media/textures/icons/objects/' + icon;
        image.alt = '';
        image.width = image.height = large ? 80 : 36;
        image.addEventListener('error', () => { image.hidden = true; });
    }

    inventoryTags(item, type) {
        const tags = [...(type.tags ?? []), ...(item.tags ?? [])];
        const category = (item.icon ?? type.icon)?.split('/')[0];
        const categories = {
            weapon: 'Weapon', armor: 'Armor', potion: 'Potion',
            ammo: 'Ammo', music: 'Instrument',
        };
        if (categories[category]) tags.push(categories[category]);
        if (item.equipped) tags.push('Equipped');
        if (item.attached) tags.push('Attached');
        if (type.usable) tags.push('Usable');
        const labels = tags
            .filter(tag => typeof tag === 'string' && tag.trim())
            .map(tag => tag.trim());
        return [...new Set(labels)];
    }

    openInventory() {
        this.open('Inventory', 'inventory');
        const engine = this.state.interactions;
        const inventory = this.state.saveDeltas.data.inventory;
        if (!inventory.order.length) {
            this.text('p', 'Your party inventory is empty.');
        } else {
            const table = this.text('table', '');
            table.className = 'inventory-table';
            table.setAttribute('aria-label', 'Inventory');
            const header = this.text('tr', '', this.text('thead', '', table));
            const iconHeading = this.text('th', '', header);
            iconHeading.scope = 'col';
            iconHeading.setAttribute('aria-label', 'Icon');
            this.text('th', 'Item', header).scope = 'col';
            this.text('th', 'Count', header).scope = 'col';
            const rows = this.text('tbody', '', table);
            for (const id of inventory.order) {
                const item = inventory.items[id];
                const type = engine.maps.itemTypes[item.typeId];
                const row = this.text('tr', '', rows);
                this.inventoryIcon(item, type, this.text('td', '', row));
                const name = this.text('td', '', row);
                const button = this.button(type.name, () => this.openInventoryItem(id), { parent: name });
                this.text('td', String(item.quantity), row);
                // The button provides keyboard access; the rest of the row is tappable too.
                row.addEventListener('click', event => {
                    if (!button.contains(event.target)) {
                        this.openInventoryItem(id);
                    }
                });
            }
        }
        this.focus();
        this.dialog.scrollTop = 0;
    }

    openInventoryItem(id) {
        const item = this.state.saveDeltas.data.inventory.items[id];
        if (!item) return this.openInventory();
        const type = this.state.interactions.maps.itemTypes[item.typeId];
        this.open(type.name, 'inventory');
        this.closeButton.textContent = 'Back';
        this.closeButton.setAttribute('aria-label', 'Back to inventory');
        this.closeButton.onclick = () => this.openInventory();
        this.inventoryIcon(item, type, this.body, true);
        this.text('p', 'Count: ' + item.quantity);
        if (type.note) this.text('p', type.note);
        const tags = this.inventoryTags(item, type);
        this.text('h3', 'Tags');
        if (tags.length) {
            const list = this.text('ul', '');
            list.className = 'inventory-tags';
            for (const tag of tags) this.text('li', tag, list);
        } else {
            this.text('p', 'No tags.');
        }
        if (item.uses) this.text('p', 'Uses: ' + item.uses);
        this.focus();
        this.dialog.scrollTop = 0;
    }
}
