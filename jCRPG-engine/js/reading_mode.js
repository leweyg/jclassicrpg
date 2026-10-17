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

export function startReadingMode({state, renderer, ui, travel, story, log}) {
    let active = true, busy = false;
    const bar = document.getElementById('reading-mode');
    const exit = document.createElement('button');
    exit.type = 'button';
    exit.textContent = '×';
    exit.setAttribute('aria-label', 'Exit reading mode');
    ui.dialog.querySelector('header').append(exit);
    bar.hidden = false;
    const stop = () => {
        active = false;
        bar.hidden = true;
        exit.remove();
        ui.dialog.removeEventListener('close', advance);
        const url = new URL(location.href);
        url.searchParams.delete('read');
        history.replaceState(null, '', url);
        ui.close();
        log('Reading mode closed. Continue exploring from here.');
    };
    exit.onclick = stop;
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
    ui.openStory(story);
}
