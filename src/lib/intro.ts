// One-shot "intro finished" signal.
// The Preloader fires it when its curtain lifts; the hero (copy + 3D camera)
// listens so their entrance animations start at exactly the right moment.

const EVENT = "intro:done";
let done = false;

export function markIntroDone() {
  done = true;
  window.dispatchEvent(new Event(EVENT));
}

/** Runs `cb` once the intro has finished (immediately if it already has). Returns an unsubscribe. */
export function onIntroDone(cb: () => void) {
  if (done) {
    cb();
    return () => {};
  }
  window.addEventListener(EVENT, cb, { once: true });
  return () => window.removeEventListener(EVENT, cb);
}
