// The bus — how modules speak without touching each other.
//
// A word committed anywhere is announced here; any module may listen.
// Kept tiny on purpose: this is the whole nervous system.

const channels = new Map();

export function on(type, fn) {
  if (!channels.has(type)) channels.set(type, new Set());
  channels.get(type).add(fn);
  return () => channels.get(type)?.delete(fn);
}

export function emit(type, detail) {
  channels.get(type)?.forEach((fn) => fn(detail));
}
