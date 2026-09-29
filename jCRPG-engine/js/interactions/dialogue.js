import {puzzleHint,initialPuzzle} from './puzzles.js';
/** Caption progression is transient; only explicit choices commit gameplay actions. */
export function dialogueStart(definition, matches) {
    return definition.entries?.find(entry => matches(entry.when))?.nodeId ?? definition.start;
}

export function reviewMission(choice) {
    return choice.next?.startsWith('hint:mission:') ? choice.next.slice(5) : null;
}

export function dialogueView(engine, matches) {
    const panel = engine.panel;
    if (panel?.kind !== 'dialogue') throw Error('No conversation is open');
    const actor = engine.maps.actors[panel.actorId];
    const definition = engine.maps.dialogues[actor.dialogueId];
    const node = definition.nodes[panel.nodeId];
    if (!node) throw Error('Unknown dialogue node');

    let captions = panel.repeat && node.repeatText ? [node.repeatText] : node.captions ?? [node.text];
    const regionIds=definition.regionalMissionIds??[];
    const completed=regionIds.filter(id=>engine.missionState(id)==='completed');
    const next=regionIds.find(id=>engine.missionState(id)!=='completed');
    const keeper=engine.maps.actors[engine.maps.missions[next]?.giverActorId];
    const variables={completedCount:completed.length,nextMissionId:next,nextKeeperName:keeper?.name,nextTownName:engine.maps.settlements[keeper?.townId]?.name};
    const format=text=>text.replace(/\{(completedCount|nextMissionId|nextKeeperName|nextTownName)\}/g,(_,key)=>variables[key]??'');
    if(node.reportCaptions){const lines=node.reportCaptions.filter(c=>matches(c.when)).slice(-2).map(c=>c.text);captions=lines.length?lines:[node.text];}
    const reviewId=node.reviewMissionId;
    if(reviewId){
        const mission=engine.maps.missions[reviewId];
        const objective=mission.objectives.find(o=>engine.objectiveSources(o,engine.save.data).length<(o.required??o.targetIds.length));
        captions=[objective?objective.text:node.readyText??'The work holds. Tell me what you observed.'];
        if(objective?.kind==='puzzle'){const puzzle=engine.maps.puzzles[objective.targetIds[0]];captions.push(puzzleHint(puzzle,engine.save.data.puzzles[puzzle.id]??initialPuzzle(puzzle)));}
    }
    if(node.puzzleHintId){const p=engine.maps.puzzles[node.puzzleHintId];captions=[puzzleHint(p,engine.save.data.puzzles[p.id]??initialPuzzle(p))];}

    // Legacy reactions belong to greetings, never to hints or subsequent nodes.
    if (!definition.entries && panel.nodeId === definition.start) {
        const balance = engine.save.data.settlements[actor.townId]?.balanceState;
        const reaction = balance === 'integrated' ? actor.integratedText
            : balance === 'stable' ? actor.stableText : null;
        if (reaction) captions = [reaction];
    }
    if (panel.reviewMissionId && !definition.authoredStates) {
        const review = definition.nodes['hint:' + panel.reviewMissionId];
        if (review) captions = review.captions ?? [review.text];
    }
    const captionIndex = Math.min(panel.captionIndex ?? 0, captions.length - 1);
    const caption = captions[captionIndex];
    const canAdvance = captionIndex < captions.length - 1;
    const choices = canAdvance ? [] : (node.choices ?? []).filter(choice => matches(choice.when) && (!reviewMission(choice)||definition.authoredStates))
        .map(choice => !definition.authoredStates && panel.acceptedMissionId && !choice.next && !(choice.actions?.length)
            ? {...choice, text: 'Got it.'} : {...choice,text:format(choice.text),...(choice.trackMissionId?{trackMissionId:format(choice.trackMissionId)}:{})});
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
        text: format(typeof caption === 'string' ? caption : caption.text),
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
