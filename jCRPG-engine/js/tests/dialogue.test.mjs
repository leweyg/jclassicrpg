import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {InteractionRuntime} from '../interactions/runtime.js';
import {SaveDeltas} from '../world/save_deltas.js';
import {validateDialogue} from '../interactions/dialogue.js';
import {solvePuzzle} from '../interactions/puzzles.js';
import {authorOpeningDialogue} from '../../../scripts/opening_dialogue.mjs';
import {revealReadDialogue} from '../map_discovery.js';

const base = new URL('../../worlds/seed0/v2/', import.meta.url);
const read = file => JSON.parse(fs.readFileSync(new URL(file, base)));
const manifest = read('interactions/manifest.json');
const content = Object.fromEntries(Object.entries(manifest.catalogs).map(([key, desc]) => [key, read(desc.url)]));
authorOpeningDialogue(content);
const missionId = 'mission:wammigmig:fair-share';
function fixture() {
    return new InteractionRuntime(structuredClone(content), new SaveDeltas());
}
function talk(engine, name = 'Marn Even-Tally') {
    const actor = engine.content.actors.find(actor => actor.name === name);
    engine.interact({kind:'actor', targetId:actor.id});
    return actor;
}
function readToChoices(engine) {
    let count = 0;
    while (engine.dialogue().canAdvance) {
        assert.ok(count++ < 64);
        engine.advanceDialogue();
    }
    return engine.dialogue();
}
function choose(engine, label) {
    const dialogue = readToChoices(engine);
    const index = dialogue.choices.findIndex(choice => choice.text === label);
    assert.ok(index >= 0, 'Missing response: ' + label);
    return engine.choose(index);
}

test('authored captions gate choices without committing transactions, and entry states react to acceptance', () => {
    const engine = fixture();
    talk(engine);
    const before = engine.save.export();
    assert.ok(engine.dialogue().captionCount > 1);
    assert.deepEqual(engine.dialogue().choices, []);
    assert.throws(() => engine.choose(0), /Finish reading/);
    const offered = readToChoices(engine);
    assert.equal(offered.choices[offered.defaultChoiceIndex].text, 'Accept: A Fair Share of Light');
    assert.equal(engine.save.export(), before);
    choose(engine, 'Accept: A Fair Share of Light');
    assert.equal(engine.missionState(missionId), 'active');
    assert.equal(engine.panel.nodeId, 'accepted');
    assert.equal(engine.dialogue().captionIndex, 0);
    assert.ok(engine.dialogue().canAdvance);
    choose(engine, 'Until next time.');
    assert.equal(engine.panel, null);
    talk(engine);
    assert.equal(engine.panel.nodeId, 'progress');
    const progress = readToChoices(engine);
    assert.equal(progress.choices[progress.defaultChoiceIndex].text, 'Until next time.');
    choose(engine, 'Review: A Fair Share of Light');
    assert.match(readToChoices(engine).text, /responsibility/);
});

test('opening slice completes through dialogue, preserves rewards once, and retains handoff on reload', () => {
    const engine = fixture(); talk(engine); choose(engine, 'Accept: A Fair Share of Light');
    choose(engine, 'Until next time.');
    const mission = engine.maps.missions[missionId];
    for (const objective of mission.objectives) for (const id of objective.targetIds) {
        if (objective.kind === 'shrine') engine.transact([{op:'shrine',id}]);
        if (objective.kind === 'evidence') engine.transact([{op:'evidence',id}]);
        if (objective.kind === 'puzzle') {
            for (const input of solvePuzzle(engine.maps.puzzles[id]).inputs) engine.transact([{op:'puzzle',id,input}]);
        }
    }
    talk(engine); choose(engine, 'Fairness must include households and the shared relay.');
    choose(engine, 'Back');
    assert.equal(engine.panel.nodeId, 'ready');
    assert.equal(engine.dialogue().canAdvance, false, 'Back goes straight to the current mission choices');
    const token = engine.save.data.lastTransaction + 1;
    const ready = readToChoices(engine);
    const reportIndex = ready.choices.findIndex(c => c.text === 'Report: A Fair Share of Light');
    assert.equal(ready.defaultChoiceIndex, reportIndex);
    const report = engine.choose(reportIndex, token);
    assert.deepEqual(report.completedMissions, [{id:missionId,title:mission.title}]);
    assert.match(report.message, /Completed: A Fair Share of Light/);
    assert.equal(engine.panel.nodeId, 'handoff');
    assert.equal(engine.missionState(missionId), 'completed');
    assert.ok(engine.save.data.shrineRoutes['route:wammigmig:awshowam']);
    assert.equal(engine.save.data.flags['letter:garrum'], true);
    readToChoices(engine);
    const snapshot = engine.save.export();
    assert.equal(engine.choose(0, token).duplicate, true);
    assert.equal(engine.panel.nodeId, 'handoff');
    assert.equal(engine.save.export(), snapshot);
    const restored = fixture(); restored.save.import(snapshot); restored.initialize(); talk(restored);
    assert.equal(restored.panel.nodeId, 'completed');
    assert.ok(!readToChoices(restored).choices.some(c => c.text.startsWith('Report:')));
    const completed = restored.dialogue();
    assert.equal(completed.choices[completed.defaultChoiceIndex].text, 'Until next time.');
});

test('only the visible caption reveals named places; unread later captions remain hidden', () => {
    const engine = fixture(); talk(engine);
    choose(engine, 'Where should I begin?');
    const definition = engine.maps.dialogues[engine.dialogue().actor.dialogueId];
    definition.nodes.directions.captions = ['A local reading.', 'The secret is at Hidden Hollow.'];
    const markers = [{id:'hidden', name:'Hidden Hollow'}];
    assert.equal(revealReadDialogue(engine.save, markers, engine.dialogue()), false);
    engine.advanceDialogue();
    assert.equal(revealReadDialogue(engine.save, markers, engine.dialogue()), true);
});

test('Pella and Orro retain their specific topics after the circuit is restored', () => {
    const engine = fixture();
    const puzzle = engine.maps.puzzles['puzzle:wammigmig:distribution'];
    for (const input of solvePuzzle(puzzle).inputs) engine.transact([{op:'puzzle',id:puzzle.id,input}]);
    talk(engine, 'Orro Coil-Tender'); assert.equal(engine.panel.nodeId, 'restored');
    choose(engine, 'Remind me how the conductors work.');
    const text = [];
    do { text.push(engine.dialogue().text); if (!engine.dialogue().canAdvance) break; engine.advanceDialogue(); } while (true);
    assert.match(text.join(' '), /Storage to two, Homes to three, and Street to one/);
    talk(engine, 'Pella Sharekeeper'); assert.equal(engine.panel.nodeId, 'restored');
    choose(engine, 'What should I promise Marn?');
    assert.match(engine.dialogue().text, /another person can check/);
});

test('Pella defaults to farewell after returning from readings instead of repeating the topic', () => {
    for (const accepted of [false, true]) {
        const engine = fixture();
        if (accepted) {
            talk(engine);
            choose(engine, 'Accept: A Fair Share of Light');
            choose(engine, 'Until next time.');
        }
        talk(engine, 'Pella Sharekeeper');
        let dialogue = readToChoices(engine);
        assert.equal(dialogue.choices[dialogue.defaultChoiceIndex].text, 'Show me how the readings differ.');
        engine.choose(dialogue.defaultChoiceIndex);
        choose(engine, 'Back');
        dialogue = engine.dialogue();
        assert.equal(dialogue.canAdvance, false);
        assert.equal(dialogue.captionIndex, dialogue.captionCount - 1);
        assert.equal(dialogue.choices[dialogue.defaultChoiceIndex].text, 'Until next time.');
        assert.ok(dialogue.choices.some(choice => choice.text === 'Show me how the readings differ.'));
        engine.choose(dialogue.defaultChoiceIndex);
        assert.equal(engine.panel, null);
        talk(engine, 'Pella Sharekeeper');
        assert.equal(engine.dialogue().canAdvance, false, 'Returning goes straight to conversation choices');
        assert.equal(engine.dialogue().captionIndex, engine.dialogue().captionCount - 1);
        const restored = fixture(); restored.save.import(engine.save.export()); restored.initialize();
        talk(restored, 'Pella Sharekeeper');
        assert.equal(restored.dialogue().canAdvance, false, 'Remember introductions across reloads');
    }
});

test('caption validation catches empty passages and dangling entries', () => {
    assert.throws(() => validateDialogue({start:'a',nodes:{a:{captions:[]}}}), /captions/);
    assert.throws(() => validateDialogue({start:'a',nodes:{a:{captions:['']}}}), /caption/);
    assert.throws(() => validateDialogue({start:'a',entries:[{nodeId:'missing'}],nodes:{a:{text:'Hello'}}}), /entry/);
    validateDialogue({start:'a',nodes:{a:{captions:[{text:'Measured.',knowledge:'fact'}],choices:[]}}});
});
