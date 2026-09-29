// Live — the one behavior everything shares.
//
// A live value holds state and tells its watchers when it changes.
// Whatever is showing it updates itself; nobody redraws from the top,
// so there is no rebuild to do and no listener left to leak.

export function live(initial) {
  let value = initial;
  const watchers = new Set();

  return {
    get: () => value,

    set(next) {
      value = next;
      for (const fn of watchers) fn(value);
    },

    // Paint once now, then on every change. Returns an unwatch — call it
    // when the view goes away and the watcher is gone for good.
    watch(fn) {
      watchers.add(fn);
      fn(value);
      return () => watchers.delete(fn);
    },
  };
}
