// Artwork, by note. In the modular app these are files next to this one;
// the single-file build swaps this module for the same names holding
// inline data: URIs, so solresol.html still travels alone.

const NOTE_ORDER = ['do', 're', 'mi', 'fa', 'sol', 'la', 'si'];
const art = (prefix) => Object.fromEntries(
  NOTE_ORDER.map((n) => [n, new URL(`./hands/${prefix}${n}.webp`, import.meta.url).href])
);

// Curwen's engraved hand signs (19th-century tonic sol-fa plates) as pure
// line art — the ink as transparency, no paper — so the page can draw each
// hand in any colour through a CSS mask. HAND_LINES is the hand alone,
// square, for small cells; PLATE_LINES is the whole plate with its caption
// ("doh — the strong or firm tone"). Made from archive/legacy/images/1–7.png.
export const HAND_LINES = art('line-');
export const PLATE_LINES = art('line-plate-');
