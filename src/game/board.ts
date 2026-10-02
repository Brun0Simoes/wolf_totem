/**
 * The hexagonal battle board, as in the auto battlers that inspired it: seven columns and eight rows
 * of pointy-top hexes in offset rows. Rows 0–3 belong to the enemy (row 3 is their front), rows 4–7 to
 * the tribe (row 4 is the front).
 * Columns sit one unit apart and rows one unit deep, so ranges and areas keep the meaning they had
 * on the square field; the hexes are slightly tall in board units and the camera's foreshortening
 * flattens them back on screen.
 */
export const COLUMNS = 7;
export const ROWS = 8;
export const SIDE_ROWS = ROWS / 2;
/** Formation cells on each half. */
export const FORMATION_SLOTS = COLUMNS * SIDE_ROWS;
export const ROW_HEIGHT = 1;
export const HEX_RADIUS = 1 / Math.sqrt(3);
/** Vertical stretch that makes the offset rows tile exactly. */
const HEX_STRETCH = ROW_HEIGHT / (1.5 * HEX_RADIUS);
export const BOARD = { maxX: COLUMNS - 0.5, maxY: (ROWS - 1) * ROW_HEIGHT };
export const BOARD_CENTER = { x: BOARD.maxX / 2, y: BOARD.maxY / 2 };
/** Where the two halves meet, between the enemy front and the tribe front. */
export const MIDLINE = (SIDE_ROWS - 0.5) * ROW_HEIGHT;

export function cellCenter(col: number, row: number): { x: number; y: number } {
  return { x: col + (row % 2 ? 0.5 : 0), y: row * ROW_HEIGHT };
}
/** Formation slots: seven per row, front row first. */
export const allySlotCenter = (slot: number) => cellCenter(slot % COLUMNS, SIDE_ROWS + Math.floor(slot / COLUMNS));
export const enemySlotCenter = (slot: number) => cellCenter(slot % COLUMNS, SIDE_ROWS - 1 - Math.floor(slot / COLUMNS));

/** Columns of a row from the centre outwards. */
const CENTRE_OUT = [3, 2, 4, 1, 5, 0, 6];
const rowSlots = (row: number) => CENTRE_OUT.map(col => row * COLUMNS + col);
/**
 * Enemies stand by role: melee fighters fill the front row from the centre out, ranged ones the
 * rows behind; either spills over when its rows are full.
 */
export function enemyFormation(ranged: boolean[]): number[] {
  const melee = [...rowSlots(0), ...rowSlots(1), ...rowSlots(2), ...rowSlots(3)];
  const back = [...rowSlots(1), ...rowSlots(2), ...rowSlots(0), ...rowSlots(3)];
  const taken = new Set<number>();
  return ranged.map(isRanged => {
    const slot = (isRanged ? back : melee).find(candidate => !taken.has(candidate))!;
    taken.add(slot);
    return slot;
  });
}
/** Saves before 1.3 used a 4 × 3 formation; old cells keep their row and land in the middle columns. */
export const migrateSlot = (old: number) => Math.floor(old / 4) * COLUMNS + (old % 4) + 2;

/** The six corners of a hex, in board units, clockwise from the lower right. */
export function hexCorners(center: { x: number; y: number }, scale = 1): { x: number; y: number }[] {
  return Array.from({ length: 6 }, (_, i) => {
    const angle = Math.PI / 6 + i * Math.PI / 3;
    return { x: center.x + Math.cos(angle) * HEX_RADIUS * scale, y: center.y + Math.sin(angle) * HEX_RADIUS * HEX_STRETCH * scale };
  });
}
export const clampX = (x: number) => Math.max(0, Math.min(BOARD.maxX, x));
export const clampY = (y: number) => Math.max(0, Math.min(BOARD.maxY, y));
