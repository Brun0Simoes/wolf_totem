/**
 * The hexagonal battle board: four columns and six rows of pointy-top hexes in offset rows.
 * Rows 0–2 belong to the enemy (row 2 is their front), rows 3–5 to the tribe (row 3 is the front).
 * Columns sit one unit apart and rows one unit deep, so ranges and areas keep the meaning they had
 * on the square field; the hexes are slightly tall in board units and the camera's foreshortening
 * flattens them back on screen.
 */
export const COLUMNS = 4;
export const ROWS = 6;
export const ROW_HEIGHT = 1;
export const HEX_RADIUS = 1 / Math.sqrt(3);
/** Vertical stretch that makes the offset rows tile exactly. */
const HEX_STRETCH = ROW_HEIGHT / (1.5 * HEX_RADIUS);
export const BOARD = { maxX: COLUMNS - 0.5, maxY: (ROWS - 1) * ROW_HEIGHT };
export const BOARD_CENTER = { x: BOARD.maxX / 2, y: BOARD.maxY / 2 };
/** Where the two halves meet, between the enemy front (row 2) and the tribe front (row 3). */
export const MIDLINE = 2.5 * ROW_HEIGHT;

export function cellCenter(col: number, row: number): { x: number; y: number } {
  return { x: col + (row % 2 ? 0.5 : 0), y: row * ROW_HEIGHT };
}
/** Formation slots 0–11: four per row, front row first. */
export const allySlotCenter = (slot: number) => cellCenter(slot % COLUMNS, 3 + Math.floor(slot / COLUMNS));
export const enemySlotCenter = (slot: number) => cellCenter(slot % COLUMNS, 2 - Math.floor(slot / COLUMNS));
/** Where the n-th enemy of an expedition stands: the two front centre cells first, then the flanks and the back. */
export const ENEMY_SLOTS = [1, 2, 5, 6, 0, 3, 8, 11];
/** The six corners of a hex, in board units, clockwise from the lower right. */
export function hexCorners(center: { x: number; y: number }, scale = 1): { x: number; y: number }[] {
  return Array.from({ length: 6 }, (_, i) => {
    const angle = Math.PI / 6 + i * Math.PI / 3;
    return { x: center.x + Math.cos(angle) * HEX_RADIUS * scale, y: center.y + Math.sin(angle) * HEX_RADIUS * HEX_STRETCH * scale };
  });
}
export const clampX = (x: number) => Math.max(0, Math.min(BOARD.maxX, x));
export const clampY = (y: number) => Math.max(0, Math.min(BOARD.maxY, y));
