import {START_MISSION} from './mission_templates.mjs';

/** Authored captions for the opening slice. Keep mechanics in sync with its baked circuit. */
export function authorOpeningDialogue(content) {
    const mission = START_MISSION;
    const puzzle = 'puzzle:wammigmig:distribution';
    const met = 'dialogue:wammigmig:marn:met';
    const state = value => ({missionState: [mission, value]});
    const node = (captions, choices, knowledge = 'testimony') => ({captions, choices, knowledge});
    const leave = {text: 'Until next time.'};
    const back = {text: 'Back', next: 'greeting'};
    const actor = name => content.actors.find(actor => actor.name === name);
    const definition = name => content.dialogues.find(d => d.id === actor(name).dialogueId);

    const marn = definition('Marn Even-Tally');
    const originalChoices = marn.nodes.greeting.choices;
    const accept = originalChoices.find(c => c.actions?.some(a => a.op === 'accept'));
    const report = originalChoices.find(c => c.actions?.some(a => a.op === 'turnIn'));
    const commitments = originalChoices.filter(c => c.actions?.some(a => a.op === 'commitment'));
    const choices = [
        {...accept, actions: [...accept.actions, {op:'flag', id:met, value:true}], next:'accepted'},
        {...report, next:'handoff'},
        ...commitments.map(choice => ({
            ...choice,
            when: {all: [choice.when, {not: state('completed')}]},
            next: 'promise',
        })),
        {text:'Review: A Fair Share of Light', when:state('active'), next:'hint:'+mission},
        {text:'What do you mean by a fair share?', next:'fairness'},
        {text:'Where should I begin?', next:'directions'},
        {text:'Until next time.', actions:[{op:'flag', id:met, value:true}]},
    ];
    marn.entries = [
        {when:state('completed'), nodeId:'completed'},
        {when:state('ready-to-turn-in'), nodeId:'ready'},
        {when:state('active'), nodeId:'progress'},
        {when:{flag:[met,true]}, nodeId:'repeat'},
    ];
    marn.nodes = {
        greeting: node([
            'Welcome to Wammigmig. I am Marn. If you have come to trade, there is still stock in the yard.',
            'If you have come for a warm room, I cannot promise one. Our lamps dim while the storage line keeps its full share.',
            'The current has not vanished. We have been deciding where it goes, and I have treated the goods in my ledger as the first claim on it.',
            'Pella says my account leaves out the people who keep those goods moving. I want someone to check the readings before either of us calls our answer fair.',
            'Will you help us put the relay back in order? I call the work A Fair Share of Light.',
        ], choices),
        repeat: node([
            'Back again? The readings are still there to be checked. You need not take my account on trust.',
        ], choices),
        accepted: node([
            'Thank you. Begin at the dim shrine west of the place where you arrived. Touch it and listen to its answer.',
            'Then read the storage marker, the hut ledger, and the household marker here in Wammigmig. They record different parts of the same supply.',
            'Pella will tell you what the households need. Orro, near the shrine, can show you how the conductors work.',
            'Return when the circuit holds. I will also ask what obligation you are willing to keep after the repair.',
        ], [leave]),
        progress: node([
            'How does the work look from outside my ledger?',
            'The journal keeps track of the shrine, the three readings, the circuit, and the promise we still need to record.',
        ], choices),
        ['hint:'+mission]: node([
            'The shrine is west of your arrival point. The three readings are here: storage, the hut ledger, and the households.',
            'The measured loads are Storage 2, Homes 3, Street 1. Inspect each conductor first; further touches cycle its setting.',
            'Once those settings match, repeat the shrine’s order: Homes, Storage, Street. Orro can explain the reset stone if the rhythm slips.',
            'When the circuit holds, tell me which obligation should guide its use. A repair is not the end of our responsibility.',
        ], [back], 'inference'),
        fairness: node([
            'If the stores spoil, tomorrow’s market suffers. That part of my argument is real.',
            'But I made a rule from it: storage first, every time. A rule can balance a ledger while leaving a household in darkness.',
            'Pella counts needs my accounts do not name. Measure the loads, listen to her, and tell me what we must make visible.',
        ], [back]),
        directions: node([
            'The relay shrine stands west of where you arrived, at about 782, 903. Wammigmig lies east of it.',
            'Look for the reading markers by the storage yard, the owner’s hut, and the homes. The three conductors and reset stone are nearby.',
            'Your journal and map can point you toward the next unfinished part of the work.',
        ], [back]),
        promise: node([
            'I have recorded your words beside the readings. Other people will be able to judge our account against what actually reaches them.',
            'If the shrine, readings, and circuit are all ready, report the work to me. Then we can send this account farther than Wammigmig.',
        ], [back]),
        ready: node([
            'The relay holds, and the readings and your commitment are recorded.',
            'I can sign the account now. Shall we report A Fair Share of Light complete?',
        ], choices),
        handoff: node([
            'The storage, homes, and shared street answer together. I can see a fairer account than the one I began with.',
            'I have written a letter of account for Garrum Open-Ledger in Awshowam, the Boarman capital. The shrine route is lit toward him.',
            'Follow the relay frontier westward. Garrum keeps larger books than mine; I suspect they leave things out too.',
            'There was another answer, delayed, from the cave south of here. You may investigate it, but you do not need to enter the cave to reach Awshowam.',
        ], [leave]),
        completed: node([
            'Your account is still on the ledger. We are keeping the households and shared relay in view alongside the stores.',
            'Garrum is in Awshowam. Follow the lit shrine route when you are ready; the wider network has its own arguments waiting.',
        ], [{text:'Remind me about Awshowam.',next:'handoff'}, leave]),
    };

    const pella = definition('Pella Sharekeeper');
    pella.entries = [{when:{puzzle},nodeId:'restored'}];
    pella.nodes = {
        greeting: node([
            'Marn can tell you what every crate is worth. Ask him how much light it takes to mend a coat after the market closes.',
            'I am Pella. I keep the household readings. They are not a rival set of accounts; they are the part our public account has been missing.',
            'The homes need three units. Storage needs two, and the shared street relay one. Those are measured loads.',
            'I believe a household should not be the last thing we notice. That is my judgment. You can test the readings without having to agree with everything I believe.',
        ], [{text:'Show me how the readings differ.',next:'readings'}, {text:'What should I promise Marn?',next:'promise'}, leave]),
        readings: node([
            'Read the marker by the homes, then compare the storage marker and the hut ledger. The ledger records six units of supply.',
            'Three for homes, two for storage, one for the street: all six have a place. Keeping the street relay alive is how our local repair can help someone beyond the village.',
        ], [back], 'fact'),
        promise: node([
            'Promise something another person can check. Say whose needs the account must include, or how trade will answer for its social costs.',
            'You do not need to repeat my words. You do need to return when those words meet a harder case.',
        ], [back]),
        restored: node([
            'The household lamps hold steady now. Thank you for checking the readings instead of treating our need as a rumor.',
            'We still need the stores, and the street still carries our work outward. Keep that whole circuit in mind when you speak to Marn.',
        ], [{text:'What should I promise Marn?',next:'promise'},leave]),
    };

    const orro = definition('Orro Coil-Tender');
    orro.entries = [{when:{puzzle},nodeId:'restored'}];
    orro.nodes = {
        greeting: node([
            'Stand here a moment. The shrine’s pulse is easier to hear when you are not trying to make it say something.',
            'I am Orro. I tend coils along this road. The current has a pattern; what the pattern means is a larger question.',
            'Touch the shrine. Its answer gives the order we need: Homes, Storage, Street.',
        ], [{text:'How do I set the conductors?',next:'settings'}, {text:'What if I get the pattern wrong?',next:'reset'}, leave]),
        settings: node([
            'First inspect each of the three conductors. That shows you its measured demand.',
            'Further touches cycle its number. Set Storage to two, Homes to three, and Street to one.',
            'When all three match, the same touch becomes a pulse. Touch Homes, then Storage, then Street.',
            'The reset stone and Intuition can help you read the circuit. No tool or weapon is required.',
        ], [back], 'fact'),
        reset: node([
            'A wrong pulse restarts the rhythm. It does not take your equipment or close a passage.',
            'If you want to begin again, touch the reset stone. Inspect the conductors again, set the three loads, and repeat Homes, Storage, Street.',
        ], [back], 'fact'),
        restored: node([
            'There. The circuit holds. You checked the quantities and gave the current a repeatable path.',
            'The cave south of Wammigmig answered after a delay. That is something we heard; why it answered is something we have yet to learn.',
        ], [{text:'Remind me how the conductors work.',next:'settings'},leave]),
    };
}
