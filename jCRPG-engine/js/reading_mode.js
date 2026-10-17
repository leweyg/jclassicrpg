/** Travel follows real quest state; every conversation and action stays reader-paced. */
export function readingGoal(engine) {
    return engine.mainNavigationGoal() ?? engine.navigationGoal();
}

export function goalAction(state, goal) {
    return state.exploration.nearby(state.party.position, state.realm, 1.8, {
        eligible: action => {
            if (action.kind === 'portal') return action.targetId === goal.id;
            if (goal.id === 'goal:' + action.id) return true;
            if (action.kind === 'container' && goal.targetId?.startsWith('item:')) {
                return state.interactions.maps.containers[action.targetId]?.items.some(item => item.id === goal.targetId);
            }
            if (action.kind === 'puzzle') {
                return action.targetId === goal.targetId && action.position.every((n, i) => Math.abs(n - goal.position[i]) < 0.1);
            }
            return action.targetId === (goal.targetId ?? goal.id);
        },
    });
}

// Modal dialogs make controls outside them inert, regardless of z-index.
// Keep the fixed control inside the most recently opened modal's top layer.
export function keepReadingControlAccessible(bar) {
    let dialogs = [...document.querySelectorAll('dialog[open]')];
    const sync = records => {
        for (const {target} of records) {
            if (target.tagName !== 'DIALOG') continue;
            dialogs = dialogs.filter(dialog => dialog !== target);
            if (target.open) dialogs.push(target);
        }
        dialogs = dialogs.filter(dialog => dialog.isConnected && dialog.open);
        const host = dialogs.filter(dialog => dialog.matches(':modal')).at(-1) ?? document.body;
        if (bar.parentElement !== host) host.append(bar);
    };
    const observer = new MutationObserver(sync);
    observer.observe(document.body, {subtree:true, attributes:true, attributeFilter:['open']});
    const stopPropagation = event => event.stopPropagation();
    const events = ['pointerdown', 'pointerup', 'keydown'];
    for (const event of events) bar.addEventListener(event, stopPropagation);
    sync([]);
    return () => {
        observer.disconnect();
        for (const event of events) bar.removeEventListener(event, stopPropagation);
        document.body.append(bar);
    };
}

export function startReadingMode({state, renderer, ui, travel, log}) {
    if (ui.readingModeActive) return;
    ui.readingModeActive = true;
    const url = new URL(location.href);
    url.searchParams.set('read', '1');
    history.replaceState(null, '', url);
    let active = true, busy = false;
    const bar = document.getElementById('reading-mode');
    bar.hidden = false;
    const releaseControl = keepReadingControlAccessible(bar);
    const stop = () => {
        active = false;
        ui.readingModeActive = false;
        bar.hidden = true;
        releaseControl();
        ui.dialog.removeEventListener('close', advance);
        const url = new URL(location.href);
        url.searchParams.delete('read');
        history.replaceState(null, '', url);
        ui.close();
        log('Reading mode closed. Continue exploring from here.');
    };
    document.getElementById('reading-close').onclick = stop;
    async function advance() {
        if (!active || busy || ui.dialog.open) return;
        busy = true;
        renderer.setInputEnabled(false);
        try {
            const goal = readingGoal(state.interactions);
            if (!goal) {
                ui.open('Reading complete', 'reading');
                ui.text('p', 'You have reached the end of the available story. You can return to exploring at any time.');
                ui.button('Return to game', stop, {primary: true});
            } else {
                await travel(goal);
                if (!active) return;
                ui.open('Continue reading', 'reading');
                ui.text('p', goal.name);
                ui.button('Continue', async () => {
                    if (busy || !active) return;
                    busy = true;
                    try {
                        const action = goalAction(state, goal);
                        if (!action) throw Error('This destination is not available yet. Close reading mode to explore, or try again.');
                        const message = await state.interact(action);
                        if (!active) return;
                        if (state.interactions.panel) ui.show();
                        else ui.showResult(goal.name, message, () => ui.close());
                        renderer.worldView.sync();
                        renderer._syncCamera();
                        renderer.requestRender();
                    } catch (error) {
                        if (active) ui.showResult('Unable to continue', error.message, () => ui.close());
                    } finally { busy = false; }
                }, {primary: true});
            }
            ui.focus();
        } catch (error) {
            if (active) {
                ui.showResult('Travel interrupted', error.message, () => ui.close());
            }
        } finally {
            busy = false;
            if (!active) renderer.setInputEnabled(true);
        }
    }
    ui.dialog.addEventListener('close', advance);
    void advance();
}
