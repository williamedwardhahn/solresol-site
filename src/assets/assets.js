// Artwork, by note. In the modular app these are files next to this one;
// the single-file build swaps this module for the same names holding
// inline data: URIs, so solresol.html still travels alone.

const NOTE_ORDER = ['do', 're', 'mi', 'fa', 'sol', 'la', 'si'];
const art = (prefix) => Object.fromEntries(
  NOTE_ORDER.map((n) => [n, new URL(`./hands/${prefix}${n}.webp`, import.meta.url).href])
);

// Curwen's engraved hand signs (19th-century tonic sol-fa plates):
// HAND_ART is the hand alone, square, for small cells; HAND_PLATES is the
// whole plate with its caption ("doh — the strong or firm tone").
export const HAND_ART = art('');
export const HAND_PLATES = art('plate-');
