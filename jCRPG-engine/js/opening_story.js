let storyPromise;
export function loadOpeningStory() {
    return storyPromise ??= fetch(new URL('../json/opening_story.json', import.meta.url)).then(response => {
        if (!response.ok) throw new Error('The opening story could not load.');
        return response.json();
    });
}

/** The introductory offer ends permanently after reading or finding a real interaction. */
export class OpeningStoryOffer {
    constructor(flags, newGame = false) {
        this.getFlags = typeof flags === 'function' ? flags : () => flags;
        if (newGame) this.flags['opening-story-pending'] = true;
    }
    get flags() { return this.getFlags(); }
    available() { return this.flags['opening-story-pending'] === true; }
    dismiss() {
        if (!this.available()) return false;
        this.flags['opening-story-pending'] = false;
        return true;
    }
}

export function sliceSummary(missions, actors, party) {
    const count = kind => missions.filter(m => m.kind === kind).length;
    return `This game is currently a vertical slice: ${count('main')} story quests, ${count('side')} side quests, and ${actors.length + party.length} total characters (${actors.length} world characters and ${party.length} party members), plus ${count('mini')} mini quest${count('mini') === 1 ? '' : 's'}.`;
}
