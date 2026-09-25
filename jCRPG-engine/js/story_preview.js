/** Read the compiler's story and mission catalogs without initializing a game/save. */
export async function loadStoryPreview(base, fetcher = fetch) {
  const read = async path => {
    const response = await fetcher(new URL(path, base));
    if (!response.ok) throw new Error(`Story content unavailable: ${path}`);
    return response.json();
  };
  const manifest = await read('interactions/manifest.json');
  const [stories, missions, actors, dialogues] = await Promise.all(
    ['stories', 'missions', 'actors', 'dialogues'].map(key => read(manifest.catalogs[key].url))
  );
  const missionById = new Map(missions.map(m => [m.id, m]));
  const actorById = new Map(actors.map(a => [a.id, a]));
  const dialogueById = new Map(dialogues.map(d => [d.id, d]));
  return stories.map(story => ({
    ...story,
    chapters: story.chapterIds.map(id => {
      const chapter = story.chapters.find(c => c.id === id);
      if (!chapter) throw new Error(`Missing story chapter: ${id}`);
      const mission = missionById.get(chapter.missionId);
      if (chapter.missionId && !mission) throw new Error(`Missing story mission: ${chapter.missionId}`);
      const castIds = mission ? [...new Set([
        ...mission.objectives.filter(o => o.kind === 'actor').flatMap(o => o.targetIds),
        mission.giverActorId, mission.turnInActorId,
      ].filter(Boolean))] : [];
      const cast = castIds.map(id => {
        const actor = actorById.get(id);
        if (!actor) throw new Error(`Missing story actor: ${id}`);
        const dialogue = dialogueById.get(actor.dialogueId);
        const greeting = dialogue?.nodes[dialogue.start];
        return {...actor, captions: greeting?.captions ?? (greeting?.text ? [greeting.text] : [])};
      });
      return {...chapter, mission, cast};
    }),
  }));
}
