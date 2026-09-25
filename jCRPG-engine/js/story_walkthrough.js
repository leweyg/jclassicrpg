// Native details keep the story readable and collapsible without JavaScript.
function revealChapter() {
  const chapter = [...document.querySelectorAll('.story-panel')].find(panel => `#${panel.id}` === location.hash);
  if (!chapter) return;
  for (let parent = chapter; parent; parent = parent.parentElement) {
    if (parent.tagName === 'DETAILS') parent.open = true;
  }
  chapter.scrollIntoView({ block: 'nearest' });
}
revealChapter();
addEventListener('hashchange', revealChapter);
