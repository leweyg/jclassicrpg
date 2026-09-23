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

        // Modal backdrops receive pointer events instead of the covered game canvas.
        let backdropPress = null;
        const outside = event => {
            const rect = this.dialog.getBoundingClientRect();
            return event.target === this.dialog && (
                event.clientX < rect.left || event.clientX > rect.right
                || event.clientY < rect.top || event.clientY > rect.bottom
            );
        };

        this.dialog.addEventListener('pointerdown', event => {
            backdropPress = event.button === 0 && outside(event)
                ? { id: event.pointerId, x: event.clientX, y: event.clientY }
                : null;
        });
        this.dialog.addEventListener('pointermove', event => {
            if (backdropPress && Math.hypot(
                event.clientX - backdropPress.x,
                event.clientY - backdropPress.y
            ) >= 8) {
                backdropPress = null;
            }
        });
        this.dialog.addEventListener('pointercancel', () => {
            backdropPress = null;
        });
        this.dialog.addEventListener('pointerup', event => {
            const press = backdropPress;
            backdropPress = null;
            if (
                press && press.id === event.pointerId && outside(event)
                && Math.hypot(event.clientX - press.x, event.clientY - press.y) < 8
            ) {
                this.advanceFromBackdrop();
            }
        });

        this.closeButton.onclick = () => this.close();
        this.dialog.addEventListener('cancel', event => {
            event.preventDefault();
            this.close();
        });
        this.dialog.addEventListener('keydown', event => {
            if (event.repeat) return;

            if (event.key.toLowerCase() === 'e') {
                event.preventDefault();
                const active = document.activeElement;
                const button = this.dialog.contains(active) && active.tagName === 'BUTTON'
                    ? active
                    : this.body.querySelector('button');
                button?.click();
            }

            if (['ArrowDown', 'ArrowUp', 'w', 's'].includes(event.key)) {
                event.preventDefault();
                const buttons = [...this.body.querySelectorAll('button')];
                const index = buttons.indexOf(document.activeElement);
                const direction = ['ArrowUp', 'w'].includes(event.key) ? -1 : 1;
                buttons[(index + direction + buttons.length) % buttons.length]?.focus();
            }
        });
    }

    advanceFromBackdrop() {
        const buttons = [...this.body.querySelectorAll('button')];
        if (
            this.state.interactions.panel?.kind !== 'dialogue'
            && !(buttons.length === 1
                && ['Continue', 'Continue exploring'].includes(buttons[0].textContent))
        ) {
            return;
        }
        const active = document.activeElement;
        (buttons.includes(active) ? active : buttons[0])?.click();
    }

    text(tag, value, parent = this.body) {
        const element = document.createElement(tag);
        element.textContent = value;
        parent.append(element);
        return element;
    }

    button(label, action, parent = this.body) {
        const button = this.text('button', label, parent);
        button.type = 'button';
        button.onclick = () => {
            try {
                action();
            } catch (error) {
                this.log(error.message);
            }
        };
        return button;
    }

    open(title, kind = '') {
        this.title.textContent = title;
        this.body.replaceChildren();
        const conversation = kind === 'dialogue';
        this.dialog.classList.toggle('conversation', conversation);
        this.dialog.classList.toggle('intuition', kind === 'intuition');
        this.dialog.classList.toggle('journal', kind === 'journal');
        this.dialog.classList.toggle('inventory', kind === 'inventory');
        this.closeButton.hidden = conversation || kind === 'intuition';

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
        const target = this.body.querySelector('button')
            ?? (this.closeButton.hidden ? this.dialog : this.closeButton);
        target.focus();
    }

    close() {
        this.state.interactions.panel = null;
        this.dialog.close();
        this.renderer.setInputEnabled(true);
        this.returnFocus?.focus();
        this.renderer.requestRender();
    }

    commit(actions) {
        const result = this.state.interactions.transact(actions);
        this.state.saveDeltas.persist(this.state.party.position, this.state.realm);
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
            const dialogue = engine.dialogue();
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
                this.state.saveDeltas.persist(this.state.party.position, this.state.realm);
                this.renderer.requestRender();
            }

            for (let i = 0; i < dialogue.choices.length; i++) {
                this.button(dialogue.choices[i].text, () => {
                    const result = engine.choose(i);
                    this.state.saveDeltas.persist(this.state.party.position, this.state.realm);
                    if (result.message) this.log(result.message);
                    this.show();
                    this.renderer.requestRender();
                });
            }
        } else {
            const container = engine.maps.containers[panel.id];
            const taken = this.state.saveDeltas.data.containers[container.id]?.takenItemIds ?? [];
            this.open(container.name);
            const items = container.items.filter(item => !taken.includes(item.id));
            if (!items.length) {
                this.text('p', 'This container is empty. Its contents are in your party inventory.');
            }
            for (const item of items) {
                this.button('Take ' + engine.maps.itemTypes[item.typeId].name, () => {
                    this.commit([{ op: 'take', id: container.id, itemIds: [item.id] }]);
                    this.show();
                });
            }
            if (items.length) {
                this.button('Take All', () => {
                    this.commit([{ op: 'take', id: container.id }]);
                    this.show();
                });
            }
            this.button('Continue exploring', () => this.close());
        }
        this.focus();
    }

    openIntuition(anchor) {
        const info = this.state.interactions.intuition(anchor);
        if (!info?.summary) return;

        this.open('Intuition · ' + info.name, 'intuition');
        this.text('p', info.summary);
        this.button('Continue', () => this.close());
        this.focus();
    }

    openJournal() {
        this.open('Journal', 'journal');
        const engine = this.state.interactions;
        const save = this.state.saveDeltas.data;
        let count = 0;
        for (const category of [
            'active', 'ready-to-turn-in', 'available', 'completed', 'failed', 'archived'
        ]) {
            const entries = engine.journal()
                .filter(mission => (
                    (mission.id === save.navMissionId ? 'active' : mission.state) === category
                    && (category !== 'available'
                        || save.actors[mission.giverActorId]?.talked
                        || mission.id === 'mission:wammigmig:fair-share')
                ))
                .sort((a, b) => (
                    Number(b.id === save.navMissionId) - Number(a.id === save.navMissionId)
                ));
            if (!entries.length) continue;

            this.text('h3', category.replaceAll('-', ' '));
            for (const mission of entries) {
                const button = this.button(
                    (mission.id === save.navMissionId ? '◆ ' : '') + mission.title,
                    () => this.openQuest(mission.id)
                );
                button.className = 'quest-row';
                count++;
            }
        }
        if (!count) {
            this.text('p', 'No quests yet. Speak to people nearby to learn more.');
        }
        this.focus();
        this.dialog.scrollTop = 0;
    }

    openQuest(id) {
        const engine = this.state.interactions;
        const mission = engine.journal().find(mission => mission.id === id);
        if (!mission) return this.openJournal();

        this.open(mission.title, 'journal');
        const back = this.closeButton;
        back.textContent = 'Back';
        back.setAttribute('aria-label', 'Back to journal');
        back.onclick = () => this.openJournal();

        this.text('small', mission.state.replaceAll('-', ' '));
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
                this.state.saveDeltas.persist(this.state.party.position, this.state.realm);
                this.close();
                this.onShowQuestMap?.(goal, mission);
            });
        }
        this.focus();
        this.dialog.scrollTop = 0;
    }

    openInventory() {
        this.open('Party inventory', 'inventory');
        const engine = this.state.interactions;
        const inventory = this.state.saveDeltas.data.inventory;
        for (const id of inventory.order) {
            const item = inventory.items[id];
            const type = engine.maps.itemTypes[item.typeId];
            this.text('h4', type.name);
            this.text('p', type.note);
        }
        this.button('Continue exploring', () => this.close());
        this.focus();
    }
}
