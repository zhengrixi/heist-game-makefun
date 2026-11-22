// VELVET VAULT — keyboard and mouse state.
// The game polls this each frame: held keys for movement, and a queue of
// clicks (starting screens, throwing coins) with their canvas positions.

export function createInput(canvas) {
  const input = {
    keys: new Set(),
    clicks: [],
    mouse: { x: 0, y: 0 },
    anyKey: false,
  };

  window.addEventListener('keydown', (e) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) e.preventDefault();
    input.keys.add(e.key.toLowerCase());
    input.anyKey = true;
  });
  window.addEventListener('keyup', (e) => input.keys.delete(e.key.toLowerCase()));

  canvas.addEventListener('mousemove', (e) => {
    const r = canvas.getBoundingClientRect();
    input.mouse.x = ((e.clientX - r.left) / r.width) * canvas.width;
    input.mouse.y = ((e.clientY - r.top) / r.height) * canvas.height;
  });
  canvas.addEventListener('mousedown', (e) => {
    const r = canvas.getBoundingClientRect();
    input.clicks.push({
      x: ((e.clientX - r.left) / r.width) * canvas.width,
      y: ((e.clientY - r.top) / r.height) * canvas.height,
    });
  });

  input.held = (...names) => names.some((n) => input.keys.has(n));
  input.takeClicks = () => input.clicks.splice(0, input.clicks.length);
  return input;
}
