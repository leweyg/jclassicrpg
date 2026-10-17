/** Fit the compact navigation labels beside the compass; Interact stays below it. */
export function bindHudLayout() {
  const nav = document.getElementById('hud-nav');
  const compass = document.getElementById('hud-compass');
  const location = document.getElementById('hud-location');
  const intuition = document.getElementById('world-intuition');
  const interact = document.getElementById('world-interact');
  const reading = document.getElementById('world-reading-mode');
  let frame;
  const layout = () => {
    frame = null;
    const compassRect = compass.getBoundingClientRect();
    const right = nav.getBoundingClientRect().right;
    const width = Math.max(location.getBoundingClientRect().width, intuition.hidden ? 0 : intuition.getBoundingClientRect().width);
    const fits = right - width >= compassRect.right + 8;
    nav.classList.toggle('beside-compass', fits);
    interact.style.marginTop = '0px';
    if (reading) reading.style.marginTop = '0px';
    const firstAction = interact.hidden ? reading : interact;
    if (fits && firstAction && !firstAction.hidden) {
      firstAction.style.marginTop = `${Math.max(0, compassRect.bottom + 8 - firstAction.getBoundingClientRect().top)}px`;
    }
  };
  const schedule = () => { if (frame == null) frame = requestAnimationFrame(layout); };
  const observer = new ResizeObserver(schedule);
  for (const element of [location, intuition, interact, compass, reading].filter(Boolean)) observer.observe(element);
  window.addEventListener('resize', schedule);
  schedule();
}
