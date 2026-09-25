import {loadStoryPreview} from './story_preview.js';

const root = document.getElementById('story-content');
const base = new URL('../worlds/seed0/v2/', import.meta.url);
const element = (tag, text, parent, className) => {
  const node = document.createElement(tag);
  if (text) node.textContent = text;
  if (className) node.className = className;
  parent.append(node);
  return node;
};
function revealChapter() {
  const chapter = [...document.querySelectorAll('.story-panel')].find(panel => `#${panel.id}` === location.hash || `#${panel.dataset.chapter}` === location.hash);
  if (!chapter) return;
  for (let parent = chapter; parent; parent = parent.parentElement) {
    if (parent.tagName === 'DETAILS') parent.open = true;
  }
  chapter.scrollIntoView({block: 'nearest'});
}
async function renderStory() {
  try {
    const stories = await loadStoryPreview(base);
    if (!stories.length) throw new Error('No main story available');
    const fragment = document.createDocumentFragment();
    let step = 0;
    for (const story of stories) {
      const tree = element('details', '', fragment, 'reference-tree'); tree.open = true;
      element('summary', story.title, tree);
      element('p', story.premise, tree);
      const actions = element('div', '', tree, 'story-actions');
      element('a', 'Begin a new game', actions).href = 'play.html?new=1';
      for (const chapter of story.chapters) {
        const panel = element('details', '', tree, 'story-panel tree-branch');
        panel.id = `story-step-${++step}`; panel.dataset.chapter = chapter.id;
        element('summary', chapter.title, panel);
        element('p', chapter.status === 'playable' ? 'Playable' : 'Planned', panel, 'story-label');
        if (chapter.mission) {
          element('p', chapter.mission.summary, panel);
          const objectives = element('ol', '', panel);
          for (const objective of chapter.mission.objectives) element('li', objective.text, objectives);
          for (const actor of chapter.cast) {
            const branch = element('details', '', panel, 'tree-branch');
            element('summary', actor.name, branch);
            for (const caption of actor.captions) element('p', caption, branch);
            const links = element('div', '', branch, 'story-actions');
            const destination = `map:${actor.position.join(',')},${actor.realm || 'surface'}`;
            element('a', 'Travel here', links).href = `play.html?${new URLSearchParams({location: destination})}`;
          }
        } else {
          element('p', chapter.summary || story.nextChapterFallback, panel);
        }
      }
      element('p', 'Travel links preserve your saved progress. A new game starts from the beginning.', tree, 'story-note');
    }
    root.replaceChildren(fragment);
    revealChapter();
  } catch (error) {
    root.replaceChildren();
    element('p', 'The main story could not load. Please try again.', root);
    const retry = element('button', 'Retry', root); retry.type = 'button';
    retry.addEventListener('click', () => { root.textContent = 'Loading main story…'; renderStory(); });
    console.error(error);
  }
}
if (root) renderStory();
addEventListener('hashchange', revealChapter);
