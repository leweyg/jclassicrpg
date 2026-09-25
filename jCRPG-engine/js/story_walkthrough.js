// Optional landing-page preview. Without JS all five articles remain readable.
const root = document.getElementById('story-walkthrough');
if (root) {
  const panels = [...root.querySelectorAll('.story-panel')];
  const steps = [...root.querySelectorAll('[data-story-step]')];
  const controls = root.querySelector('.story-controls');
  const previous = root.querySelector('#story-prev');
  const next = root.querySelector('#story-next');
  const progress = root.querySelector('#story-progress');
  steps.forEach((button, i) => button.setAttribute('aria-controls', panels[i].id));

  function show(index, { focus = false, saveHash = true } = {}) {
    const selected = Math.max(0, Math.min(index, panels.length - 1));
    panels.forEach((panel, i) => { panel.hidden = i !== selected; });
    steps.forEach((button, i) => {
      if (i === selected) button.setAttribute('aria-current', 'step');
      else button.removeAttribute('aria-current');
    });
    previous.disabled = selected === 0;
    next.disabled = selected === panels.length - 1;
    progress.textContent = `Moment ${selected + 1} of ${panels.length}`;
    if (focus) panels[selected].querySelector('h3')?.setAttribute('tabindex', '-1');
    if (focus) panels[selected].querySelector('h3')?.focus();
    if (saveHash) history.replaceState(null, '', `#${panels[selected].id}`);
    return selected;
  }

  root.classList.add('is-interactive');
  controls.hidden = false;
  let current = show(Math.max(0, panels.findIndex(panel => `#${panel.id}` === location.hash)), { saveHash: false });
  steps.forEach((button, i) => button.addEventListener('click', () => { current = show(i, { focus: true }); }));
  previous.addEventListener('click', () => { current = show(current - 1, { focus: true }); });
  next.addEventListener('click', () => { current = show(current + 1, { focus: true }); });
  addEventListener('hashchange', () => {
    const index = panels.findIndex(panel => `#${panel.id}` === location.hash);
    if (index >= 0) current = show(index, { saveHash: false });
  });
}
