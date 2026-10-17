let storyPromise;
export function loadOpeningStory() {
    return storyPromise ??= fetch(new URL('../json/opening_story.json', import.meta.url)).then(response => {
        if (!response.ok) throw new Error('The opening story could not load.');
        return response.json();
    });
}

/** Offer the introduction only during the session that starts a new game. */
export class OpeningStoryOffer {
    constructor(flags, newGame = false) {
        this.newGame = newGame;
        this.getFlags = typeof flags === 'function' ? flags : () => flags;
        if (newGame) {
            this.flags['opening-story-pending'] = true;
            this.flags['reading-mode-pending'] = true;
        }
    }
    get flags() { return this.getFlags(); }
    available() { return this.newGame && this.flags['opening-story-pending'] === true; }
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

/** Older saves without the flag qualify only if no world actions were recorded. */
export function readingModeOfferAvailable(save) {
    return save.flags['reading-mode-pending'] ?? save.lastTransaction === 0;
}
