// Curated stops in the opening vertical slice; land beside the relevant landmark.
export const PLAY_DESTINATIONS = {
	start: { name: 'Saved starting point', position: [800, 41, 907] },
	shrine: { name: 'Wammigmig relay shrine', position: [784, 40, 906] },
	wammigmig: { name: 'Wammigmig · Marn Even-Tally', position: [831.5, 40, 906.5], settlementId: 'town:populationBoarmanTribe#381' },
	cave: { name: 'Nearby cave entrance', position: [786.5, 44.075, 928.5] },
	awshowam: { name: 'Awshowam · Garrum Open-Ledger', position: [30.5, 39, 891.5], settlementId: 'town:populationBoarmanTribe#23' },
};

export async function visitPlayDestination(state, id) {
	if (!Object.hasOwn(PLAY_DESTINATIONS, id)) throw new Error('Unknown destination. Choose a location on the homepage.');
	const destination = PLAY_DESTINATIONS[id];
	const [x, y, z] = destination.position;
	await state.teleport(x, z, y, 'surface');
	return destination.name;
}
