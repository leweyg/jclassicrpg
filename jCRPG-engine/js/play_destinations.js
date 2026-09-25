// Curated stops in the opening vertical slice; land beside the relevant landmark.
export const PLAY_DESTINATIONS = {
	start: { name: 'Saved starting point', position: [800, 41, 907] },
	shrine: { name: 'Wammigmig relay shrine', position: [784, 40, 906] },
	wammigmig: { name: 'Wammigmig · Marn Even-Tally', position: [831.5, 40, 906.5], settlementId: 'town:populationBoarmanTribe#381' },
	cave: { name: 'Nearby cave entrance', position: [786.5, 44.075, 928.5] },
	major: { name: 'Wamwammigtraawsho · the three branches', position: [860.5, 40.24, 940.5], settlementId: 'town:populationBoarmanTribe#423' },
	oasis: { name: 'Migbushoprahshotra · the Measured Oasis', position: [780.5, 40, 1100.5], settlementId: 'town:populationAnatipionCatchers#390' },
	awshowam: { name: 'Awshowam · Garrum Open-Ledger', position: [30.5, 39, 891.5], settlementId: 'town:populationBoarmanTribe#23' },
};

export async function visitPlayDestination(state, id) {
	if (typeof id === 'string' && id.startsWith('map:')) {
		const parts = id.slice(4).split(',');
		const [x, y, z] = parts.slice(0, 3).map(Number);
		const realm = parts[3];
		if (parts.length !== 4 || parts.slice(0, 3).some(part => !part.trim()) ||
			![x, y, z].every(Number.isFinite) || !['surface', 'cave'].includes(realm)) {
			throw new Error('Invalid map destination. Choose a location on the homepage.');
		}
		await state.teleport(x, z, y, realm);
		return `map location ${Math.round(x)}, ${Math.round(z)}`;
	}
	if (!Object.hasOwn(PLAY_DESTINATIONS, id)) throw new Error('Unknown destination. Choose a location on the homepage.');
	const destination = PLAY_DESTINATIONS[id];
	const [x, y, z] = destination.position;
	await state.teleport(x, z, y, 'surface');
	return destination.name;
}
