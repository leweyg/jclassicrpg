/** Caption progression is transient; only explicit choices commit gameplay actions. */
export function dialogueStart(definition, matches) {
    return definition.entries?.find(entry => matches(entry.when))?.nodeId ?? definition.start;
}

export function dialogueView(engine, matches) {
    const panel = engine.panel;
    if (panel?.kind !== 'dialogue') throw Error('No conversation is open');
    const actor = engine.maps.actors[panel.actorId];
    const definition = engine.maps.dialogues[actor.dialogueId];
    const node = definition.nodes[panel.nodeId];
    if (!node) throw Error('Unknown dialogue node');

    let captions = node.captions ?? [node.text];
    // Legacy reactions belong to greetings, never to hints or subsequent nodes.
    if (!definition.entries && panel.nodeId === definition.start) {
        const balance = engine.save.data.settlements[actor.townId]?.balanceState;
        const reaction = balance === 'integrated' ? actor.integratedText
            : balance === 'stable' ? actor.stableText : null;
        if (reaction) captions = [reaction];
    }
    const captionIndex = Math.min(panel.captionIndex ?? 0, captions.length - 1);
    const caption = captions[captionIndex];
    const canAdvance = captionIndex < captions.length - 1;
    const choices = canAdvance ? [] : (node.choices ?? []).filter(choice => matches(choice.when));
    const hasAcceptedMission = (actor.missionIds ?? []).some(id =>
        ['active', 'ready-to-turn-in', 'completed'].includes(engine.missionState(id))
    );
    const missionActionIndex = choices.findIndex(choice =>
        choice.actions?.some(action => ['accept', 'turnIn'].includes(action.op))
    );
    // Farewells end the conversation, sometimes recording that the actor was met.
    const farewellIndex = choices.findIndex(choice =>
        !choice.next && (choice.actions ?? []).every(action => action.op === 'flag')
    );
    const defaultChoiceIndex = hasAcceptedMission || panel.returnedToGreeting
        ? (missionActionIndex >= 0 ? missionActionIndex : Math.max(0, farewellIndex))
        : 0;
    return {
        actor,
        text: typeof caption === 'string' ? caption : caption.text,
        knowledge: (typeof caption === 'object' ? caption.knowledge : null)
            ?? node.knowledge ?? 'testimony',
        captionIndex,
        captionCount: captions.length,
        canAdvance,
        choices,
        defaultChoiceIndex,
    };
}

export function validateDialogue(definition) {
    if (!definition.nodes?.[definition.start]) throw Error('Missing dialogue start');
    for (const entry of definition.entries ?? []) {
        if (!definition.nodes[entry.nodeId]) throw Error('Dangling dialogue entry');
    }
    for (const node of Object.values(definition.nodes)) {
        const captions = node.captions ?? [node.text];
        if (!Array.isArray(captions) || !captions.length || captions.length > 64) {
            throw Error('Invalid dialogue captions');
        }
        for (const caption of captions) {
            const text = typeof caption === 'string' ? caption : caption?.text;
            if (typeof text !== 'string' || !text.trim()) throw Error('Empty dialogue caption');
        }
        for (const choice of node.choices ?? []) {
            if (typeof choice.text !== 'string' || !choice.text.trim()) throw Error('Invalid dialogue choice');
            if (choice.next && !definition.nodes[choice.next]) throw Error('Dangling dialogue node');
        }
    }
}
