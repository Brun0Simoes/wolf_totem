/**
 * Totem-mask glyphs for the spirit animals, drawn in a 100 × 100 box.
 * The same path data feeds inline SVG in the interface and Path2D on the Phaser canvases.
 */
export interface GlyphPart { d: string; tone: 'body' | 'light' | 'dark' | 'line' }
export type AnimalId =
  | 'wolf' | 'bear' | 'owl' | 'eagle' | 'raven' | 'serpent' | 'jaguar' | 'spider' | 'elephant' | 'crocodile' | 'deer' | 'gorilla'
  | 'boar' | 'jackal' | 'monkey' | 'frog' | 'turtle' | 'mantis' | 'bat' | 'buffalo' | 'scorpion' | 'otter' | 'beetle' | 'hippo' | 'rhino' | 'ray' | 'anteater';

const mirror = (d: string): string => d.replace(/(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)/g, (_, x: string, y: string) => `${100 - Number(x)} ${y}`);
const circle = (x: number, y: number, r: number): string => `M${x - r} ${y} A${r} ${r} 0 1 0 ${x + r} ${y} A${r} ${r} 0 1 0 ${x - r} ${y} Z`;
const both = (d: string, tone: GlyphPart['tone']): GlyphPart[] => [{ d, tone }, { d: mirror(d), tone }];

export const GLYPHS: Record<AnimalId, GlyphPart[]> = {
  wolf: [
    { d: 'M50 90 L36 72 L24 60 L17 32 L15 7 L34 23 L50 19 L66 23 L85 7 L83 32 L76 60 L64 72 Z', tone: 'body' },
    { d: 'M50 25 L57 40 L50 50 L43 40 Z', tone: 'light' },
    ...both('M30 44 L44 48 L33 52 Z', 'dark'),
    { d: 'M40 62 L60 62 L56 74 L50 82 L44 74 Z', tone: 'light' },
    { d: 'M45 70 L55 70 L50 76 Z', tone: 'dark' },
    ...both('M22 14 L31 26 L25 30 Z', 'dark'),
  ],
  bear: [
    { d: 'M50 88 C30 88 17 74 17 56 C17 45 21 37 27 32 C20 28 19 17 27 13 C35 9 41 15 42 21 C47 20 53 20 58 21 C59 15 65 9 73 13 C81 17 80 28 73 32 C79 37 83 45 83 56 C83 74 70 88 50 88 Z', tone: 'body' },
    { d: 'M38 64 C38 54 62 54 62 64 C62 74 56 79 50 79 C44 79 38 74 38 64 Z', tone: 'light' },
    { d: circle(37, 47, 3.6), tone: 'dark' }, { d: circle(63, 47, 3.6), tone: 'dark' },
    { d: 'M45 61 L55 61 L50 67 Z', tone: 'dark' },
    { d: 'M29 21 C31 18 35 18 36 22 Z', tone: 'light' }, { d: 'M71 21 C69 18 65 18 64 22 Z', tone: 'light' },
  ],
  owl: [
    { d: 'M50 92 C28 92 15 76 15 53 C15 36 21 24 25 12 L38 25 C43 23 57 23 62 25 L75 12 C79 24 85 36 85 53 C85 76 72 92 50 92 Z', tone: 'body' },
    { d: circle(35, 47, 12.5), tone: 'light' }, { d: circle(65, 47, 12.5), tone: 'light' },
    { d: circle(35, 47, 5.5), tone: 'dark' }, { d: circle(65, 47, 5.5), tone: 'dark' },
    { d: 'M45 57 L55 57 L50 70 Z', tone: 'dark' },
    { d: 'M34 76 L42 80 L50 76 L58 80 L66 76 L66 79 L58 83 L50 79 L42 83 L34 79 Z', tone: 'light' },
  ],
  eagle: [
    { d: 'M18 90 C16 62 20 41 33 28 C44 17 60 13 72 17 C83 21 89 30 91 38 C93 47 87 53 80 51 C82 57 80 63 73 61 L69 55 C63 55 57 57 53 63 C47 71 45 81 45 92 Z', tone: 'body' },
    { d: 'M72 17 C83 21 89 30 91 38 C93 47 87 53 80 51 C80 44 76 38 70 36 C74 30 74 22 72 17 Z', tone: 'light' },
    { d: circle(64, 32, 4.4), tone: 'dark' },
    { d: 'M52 26 L76 23 L74 27 L54 30 Z', tone: 'dark' },
    { d: 'M26 66 L40 58 L32 72 L44 66 L36 80 Z', tone: 'light' },
  ],
  raven: [
    { d: 'M10 64 C22 50 40 43 56 45 L69 34 C76 29 84 29 89 34 L99 39 L87 44 C85 53 78 59 70 61 C60 68 49 72 37 72 L19 85 L24 71 Z', tone: 'body' },
    { d: 'M87 44 L99 39 L89 34 C92 37 92 41 87 44 Z', tone: 'light' },
    { d: circle(80, 38, 2.6), tone: 'light' },
    { d: 'M36 52 C46 56 56 58 67 55 C58 62 46 63 36 58 Z', tone: 'dark' },
    { d: 'M26 66 L36 62 L30 70 L40 66 L34 74 Z', tone: 'dark' },
  ],
  serpent: [
    { d: 'M50 10 C64 10 82 22 83 40 C84 54 70 60 58 63 L57 72 C71 74 82 80 82 86 C82 93 67 95 50 95 C33 95 18 93 18 86 C18 80 29 74 43 72 L42 63 C30 60 16 54 17 40 C18 22 36 10 50 10 Z', tone: 'body' },
    { d: 'M38 46 C44 40 56 40 62 46 C56 53 44 53 38 46 Z', tone: 'light' },
    ...both('M27 34 C30 46 36 54 42 58', 'line'),
    ...both('M39 28 L47 31 L40 34 Z', 'dark'),
    { d: 'M48 56 L52 56 L52 64 L56 69 L54 70 L50 66 L46 70 L44 69 L48 64 Z', tone: 'dark' },
    { d: 'M28 86 C38 82 62 82 72 86 C62 89 38 89 28 86 Z', tone: 'light' },
  ],
  jaguar: [
    { d: 'M50 89 C32 89 19 77 17 61 C15 48 19 38 23 32 L21 12 L36 23 C40 21 46 20 50 20 C54 20 60 21 64 23 L79 12 L77 32 C81 38 85 48 83 61 C81 77 68 89 50 89 Z', tone: 'body' },
    ...both('M30 47 C35 40 42 42 45 47 C40 52 35 52 30 47 Z', 'light'),
    ...both('M36 45 L39 45 L39 50 L36 50 Z', 'dark'),
    { d: 'M44 62 L56 62 L50 69 Z', tone: 'dark' },
    { d: 'M50 69 L50 74 M41 76 C46 79 54 79 59 76', tone: 'line' },
    { d: circle(29, 66, 2.6), tone: 'dark' }, { d: circle(71, 66, 2.6), tone: 'dark' },
    { d: circle(38, 30, 2.2), tone: 'dark' }, { d: circle(62, 30, 2.2), tone: 'dark' }, { d: circle(50, 33, 2.4), tone: 'dark' },
  ],
  spider: [
    ...both('M44 44 L27 29 L13 40 M42 50 L22 46 L8 57 M43 58 L24 65 L15 80 M45 64 L33 81 L29 95', 'line'),
    { d: circle(50, 68, 17), tone: 'body' },
    { d: circle(50, 45, 11), tone: 'body' },
    { d: 'M44 62 L50 56 L56 62 L50 78 Z', tone: 'light' },
    { d: circle(46, 42, 2.2), tone: 'light' }, { d: circle(54, 42, 2.2), tone: 'light' },
    { d: circle(43, 38, 1.5), tone: 'light' }, { d: circle(57, 38, 1.5), tone: 'light' },
  ],
  elephant: [
    ...both('M34 38 C17 27 5 39 7 58 C9 73 22 80 34 71 Z', 'body'),
    { d: 'M50 80 C38 80 31 69 31 56 C31 40 39 27 50 27 C61 27 69 40 69 56 C69 69 62 80 50 80 Z', tone: 'body' },
    { d: 'M45 70 C45 83 43 90 36 95 C42 98 51 93 53 84 L55 70 Z', tone: 'body' },
    ...both('M41 72 C37 80 32 84 25 84 C32 87 41 85 46 77 Z', 'light'),
    { d: circle(42, 52, 2.6), tone: 'dark' }, { d: circle(58, 52, 2.6), tone: 'dark' },
    ...both('M18 47 C14 52 15 62 22 66', 'line'),
  ],
  crocodile: [
    { d: 'M6 50 L58 37 C70 33 82 33 92 39 L95 46 L58 50 Z', tone: 'body' },
    { d: 'M6 55 L58 56 L90 60 C84 67 70 69 57 65 Z', tone: 'body' },
    { d: 'M18 50 L22 55 L26 50 L30 55 L34 50 L38 55 L42 50 L46 55 L50 50 L54 55 L58 50 Z', tone: 'light' },
    { d: 'M68 34 C70 26 80 26 82 34 Z', tone: 'light' }, { d: circle(75, 31, 1.8), tone: 'dark' },
    { d: 'M18 46 L22 41 L26 46 Z M32 43 L36 38 L40 43 Z M46 40 L50 35 L54 40 Z', tone: 'dark' },
  ],
  deer: [
    { d: 'M50 88 C44 88 40 82 40 73 L36 52 C36 45 42 41 50 41 C58 41 64 45 64 52 L60 73 C60 82 56 88 50 88 Z', tone: 'body' },
    ...both('M37 48 L20 39 L33 55 Z', 'body'),
    ...both('M44 41 L37 26 L27 19 M37 26 L35 11 M37 26 L45 16 M31 22 L24 26', 'line'),
    { d: circle(44, 57, 2.3), tone: 'dark' }, { d: circle(56, 57, 2.3), tone: 'dark' },
    { d: 'M45 80 L55 80 L50 86 Z', tone: 'dark' },
    { d: 'M46 64 L54 64 L52 74 L48 74 Z', tone: 'light' },
  ],
  gorilla: [
    { d: 'M50 89 C30 89 19 77 19 61 C19 51 23 44 27 40 C25 30 31 19 50 17 C69 19 75 30 73 40 C77 44 81 51 81 61 C81 77 70 89 50 89 Z', tone: 'body' },
    { d: 'M33 51 C33 45 67 45 67 51 C69 67 61 81 50 81 C39 81 31 67 33 51 Z', tone: 'light' },
    { d: 'M28 47 C38 40 62 40 72 47 C62 49 38 49 28 47 Z', tone: 'dark' },
    { d: circle(41, 51, 2.4), tone: 'dark' }, { d: circle(59, 51, 2.4), tone: 'dark' },
    { d: 'M44 64 C44 60 56 60 56 64 Z', tone: 'dark' },
    { d: 'M41 73 C46 76 54 76 59 73', tone: 'line' },
  ],
  boar: [
    { d: 'M50 86 C36 86 26 76 26 61 L22 40 L17 21 L34 31 C40 29 60 29 66 31 L83 21 L78 40 L74 61 C74 76 64 86 50 86 Z', tone: 'body' },
    { d: 'M38 72 C38 64 62 64 62 72 C62 80 56 84 50 84 C44 84 38 80 38 72 Z', tone: 'light' },
    { d: circle(45, 73, 2.2), tone: 'dark' }, { d: circle(55, 73, 2.2), tone: 'dark' },
    ...both('M36 76 C28 74 24 66 26 58 C29 66 33 70 39 70 Z', 'light'),
    ...both('M33 50 L43 52 L35 55 Z', 'dark'),
    { d: 'M44 33 L50 26 L56 33 L50 44 Z', tone: 'dark' },
  ],
  jackal: [
    { d: 'M50 90 L38 74 L30 60 L28 40 L20 6 L38 30 L50 27 L62 30 L80 6 L72 40 L70 60 L62 74 Z', tone: 'body' },
    ...both('M25 15 L35 31 L30 34 Z', 'dark'),
    ...both('M34 48 L45 50 L36 54 Z', 'light'),
    { d: 'M44 66 L56 66 L50 80 Z', tone: 'light' }, { d: 'M46 72 L54 72 L50 78 Z', tone: 'dark' },
    { d: 'M50 34 L53 44 L50 52 L47 44 Z', tone: 'light' },
  ],
  monkey: [
    ...both('M30 42 C16 36 8 46 12 56 C16 64 26 64 32 58 Z', 'body'),
    { d: 'M50 88 C34 88 24 76 24 58 C24 38 35 22 50 22 C65 22 76 38 76 58 C76 76 66 88 50 88 Z', tone: 'body' },
    { d: 'M50 84 C38 84 32 74 33 62 C34 52 40 48 46 50 C48 51 52 51 54 50 C60 48 66 52 67 62 C68 74 62 84 50 84 Z', tone: 'light' },
    ...both('M37 52 C40 47 46 48 46 53 C43 56 39 56 37 52 Z', 'dark'),
    { d: 'M47 64 L53 64 L50 67 Z', tone: 'dark' },
    { d: 'M42 73 C47 77 53 77 58 73', tone: 'line' },
    ...both('M16 48 C18 52 22 54 26 52', 'line'),
  ],
  frog: [
    { d: 'M50 84 C26 84 10 72 10 56 C10 46 16 40 22 37 C20 26 26 18 34 18 C40 18 44 22 46 28 C48 27 52 27 54 28 C56 22 60 18 66 18 C74 18 80 26 78 37 C84 40 90 46 90 56 C90 72 74 84 50 84 Z', tone: 'body' },
    { d: circle(34, 29, 7), tone: 'light' }, { d: circle(66, 29, 7), tone: 'light' },
    { d: 'M30 29 L38 29 L38 31 L30 31 Z', tone: 'dark' }, { d: 'M62 29 L70 29 L70 31 L62 31 Z', tone: 'dark' },
    { d: 'M22 58 C36 68 64 68 78 58 C64 64 36 64 22 58 Z', tone: 'dark' },
    { d: 'M34 72 C44 78 56 78 66 72 C56 76 44 76 34 72 Z', tone: 'light' },
  ],
  turtle: [
    { d: 'M50 22 C70 22 86 38 86 56 C86 70 72 80 50 80 C28 80 14 70 14 56 C14 38 30 22 50 22 Z', tone: 'body' },
    { d: 'M50 32 L64 42 L60 58 L40 58 L36 42 Z', tone: 'light' },
    { d: 'M50 32 L50 22 M64 42 L80 36 M60 58 L74 72 M40 58 L26 72 M36 42 L20 36', tone: 'line' },
    { d: 'M42 80 C42 88 58 88 58 80 Z', tone: 'body' },
    ...both('M18 62 L6 70 L16 74 Z', 'body'),
    { d: circle(47, 84, 1.4), tone: 'dark' }, { d: circle(53, 84, 1.4), tone: 'dark' },
  ],
  mantis: [
    { d: 'M50 26 L66 34 L58 46 L50 50 L42 46 L34 34 Z', tone: 'body' },
    { d: circle(38, 33, 6), tone: 'light' }, { d: circle(62, 33, 6), tone: 'light' },
    { d: 'M46 50 L54 50 L56 92 L44 92 Z', tone: 'body' },
    ...both('M44 56 L26 48 L18 30 L22 28 L28 42 L44 52 Z', 'body'),
    ...both('M22 28 L14 18 M19 34 L12 30', 'line'),
    ...both('M45 30 L40 8', 'line'),
    ...both('M46 70 L26 84 M46 80 L32 96', 'line'),
  ],
  bat: [
    { d: 'M50 70 L36 56 L26 66 L18 52 L4 54 L10 36 C20 30 34 32 42 40 L44 30 L48 36 L52 36 L56 30 L58 40 C66 32 80 30 90 36 L96 54 L82 52 L74 66 L64 56 Z', tone: 'body' },
    { d: circle(46, 44, 1.8), tone: 'light' }, { d: circle(54, 44, 1.8), tone: 'light' },
    { d: 'M47 50 L49 54 L51 54 L53 50 Z', tone: 'light' },
    ...both('M14 42 L26 48 M22 38 L32 46', 'line'),
  ],
  buffalo: [
    ...both('M34 30 C22 30 10 24 6 12 C14 18 22 20 30 20 L38 24 Z', 'light'),
    { d: 'M50 88 C40 88 34 80 32 70 L26 44 C26 32 36 24 50 24 C64 24 74 32 74 44 L68 70 C66 80 60 88 50 88 Z', tone: 'body' },
    { d: 'M30 34 C40 26 60 26 70 34 C62 38 38 38 30 34 Z', tone: 'dark' },
    ...both('M32 50 L42 52 L34 56 Z', 'light'),
    { d: 'M40 74 C40 68 60 68 60 74 C60 82 40 82 40 74 Z', tone: 'light' },
    { d: circle(45, 75, 2), tone: 'dark' }, { d: circle(55, 75, 2), tone: 'dark' },
  ],
  scorpion: [
    { d: 'M50 40 C60 40 64 50 64 60 C64 72 58 80 50 80 C42 80 36 72 36 60 C36 50 40 40 50 40 Z', tone: 'body' },
    { d: 'M50 40 C52 30 60 20 70 16 C78 14 84 20 82 28 L76 24 C74 20 70 20 66 24 C60 30 56 36 54 42 Z', tone: 'body' },
    { d: 'M82 28 L90 30 L84 36 Z', tone: 'light' },
    ...both('M38 46 C28 40 20 34 18 24 L12 20 L16 30 L10 32 C16 38 26 46 36 52 Z', 'body'),
    ...both('M38 62 L22 66 M38 70 L24 78 M40 76 L30 88', 'line'),
    { d: 'M44 52 L56 52 M42 60 L58 60 M44 68 L56 68', tone: 'line' },
  ],
  otter: [
    { d: 'M50 88 C32 88 20 76 20 60 C20 44 30 30 50 30 C70 30 80 44 80 60 C80 76 68 88 50 88 Z', tone: 'body' },
    ...both('M26 36 C22 28 30 24 34 32 Z', 'body'),
    { d: 'M36 66 C36 56 64 56 64 66 C64 78 36 78 36 66 Z', tone: 'light' },
    { d: circle(38, 50, 3), tone: 'dark' }, { d: circle(62, 50, 3), tone: 'dark' },
    { d: 'M45 61 L55 61 L50 66 Z', tone: 'dark' },
    ...both('M38 66 L20 62 M38 70 L22 72', 'line'),
  ],
  beetle: [
    { d: 'M50 30 C70 30 80 46 80 62 C80 80 66 92 50 92 C34 92 20 80 20 62 C20 46 30 30 50 30 Z', tone: 'body' },
    { d: 'M50 34 L50 92', tone: 'line' },
    { d: 'M36 30 C40 20 60 20 64 30 C58 34 42 34 36 30 Z', tone: 'dark' },
    { d: 'M48 22 L46 6 L50 12 L54 6 L52 22 Z', tone: 'light' },
    ...both('M22 50 L8 44 M20 64 L6 66 M24 78 L12 88', 'line'),
    ...both('M30 44 C34 40 42 40 46 44 C42 52 34 54 30 44 Z', 'light'),
  ],
  hippo: [
    { d: 'M50 90 C28 90 16 80 16 66 C16 56 22 50 28 48 L28 36 C28 24 38 18 50 18 C62 18 72 24 72 36 L72 48 C78 50 84 56 84 66 C84 80 72 90 50 90 Z', tone: 'body' },
    ...both('M30 24 C26 16 34 12 38 20 Z', 'body'),
    { d: 'M24 66 C24 54 76 54 76 66 C76 78 24 78 24 66 Z', tone: 'light' },
    { d: circle(38, 62, 3), tone: 'dark' }, { d: circle(62, 62, 3), tone: 'dark' },
    { d: circle(39, 36, 3), tone: 'dark' }, { d: circle(61, 36, 3), tone: 'dark' },
    ...both('M36 76 L38 86 L42 76 Z', 'light'),
  ],
  rhino: [
    { d: 'M50 90 C36 90 28 80 28 66 L26 44 C26 32 36 26 50 26 C64 26 74 32 74 44 L72 66 C72 80 64 90 50 90 Z', tone: 'body' },
    { d: 'M44 62 C42 44 46 26 50 6 C54 26 58 44 56 62 Z', tone: 'light' },
    { d: 'M46 40 C46 32 50 24 50 24 C50 24 54 32 54 40 Z', tone: 'light' },
    ...both('M28 34 C22 26 26 20 32 26 Z', 'body'),
    ...both('M32 52 L40 54 L33 57 Z', 'dark'),
    { d: 'M40 80 C44 84 56 84 60 80', tone: 'line' },
  ],
  ray: [
    { d: 'M50 22 C62 30 80 38 96 44 C80 52 64 60 54 74 L50 96 L46 74 C36 60 20 52 4 44 C20 38 38 30 50 22 Z', tone: 'body' },
    { d: 'M50 30 C58 38 66 44 76 46 C66 50 58 56 50 66 C42 56 34 50 24 46 C34 44 42 38 50 30 Z', tone: 'light' },
    { d: circle(44, 40, 2), tone: 'dark' }, { d: circle(56, 40, 2), tone: 'dark' },
    { d: 'M50 74 L50 96', tone: 'line' },
  ],
  anteater: [
    { d: 'M14 62 C14 48 28 40 44 40 C56 40 66 44 72 50 L96 58 L72 62 C64 70 50 74 36 74 C24 74 14 70 14 62 Z', tone: 'body' },
    { d: 'M24 46 C22 36 30 32 34 40 Z', tone: 'body' },
    { d: circle(62, 52, 2.4), tone: 'dark' },
    { d: 'M96 58 C99 62 99 68 94 70', tone: 'line' },
    { d: 'M20 66 C32 70 50 70 66 62', tone: 'line' },
  ],
};

/** The animal each hero manifests in auras, avatars and portraits. */
export const CHARACTER_ANIMAL: Record<number, AnimalId> = {
  1: 'wolf', 2: 'spider', 3: 'boar', 4: 'serpent', 5: 'monkey', 6: 'frog', 7: 'jackal', 8: 'owl', 9: 'turtle', 10: 'mantis', 11: 'eagle', 12: 'deer', 13: 'bat',
  14: 'jaguar', 15: 'gorilla', 16: 'eagle', 17: 'crocodile', 18: 'raven', 19: 'buffalo', 20: 'scorpion', 21: 'otter', 22: 'serpent', 23: 'jaguar', 24: 'beetle', 25: 'deer', 26: 'jackal',
  27: 'jaguar', 28: 'elephant', 29: 'monkey', 30: 'beetle', 31: 'serpent', 32: 'hippo', 33: 'raven', 34: 'rhino', 35: 'ray', 36: 'jaguar', 37: 'anteater', 38: 'owl',
  39: 'wolf', 40: 'gorilla', 41: 'crocodile', 42: 'jaguar', 43: 'elephant', 44: 'spider', 45: 'monkey', 46: 'serpent', 47: 'eagle', 48: 'buffalo',
  49: 'bear', 50: 'jaguar', 51: 'elephant', 52: 'owl', 53: 'serpent', 54: 'wolf', 55: 'crocodile',
};

const TONES = (color: string): Record<GlyphPart['tone'], { fill?: string; stroke?: string; opacity: number }> => ({
  body: { fill: color, opacity: 0.9 },
  light: { fill: '#fff7e2', opacity: 0.55 },
  dark: { fill: '#1b1712', opacity: 0.72 },
  line: { stroke: color, opacity: 0.95 },
});

export function glyphSVG(animal: AnimalId, color: string, label = ''): string {
  const tones = TONES(color);
  const parts = GLYPHS[animal].map(part => {
    const tone = tones[part.tone];
    return tone.stroke
      ? `<path d="${part.d}" fill="none" stroke="${tone.stroke}" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round" opacity="${tone.opacity}"/>`
      : `<path d="${part.d}" fill="${tone.fill}" opacity="${tone.opacity}"/>`;
  }).join('');
  return `<svg class="glyph" viewBox="0 0 100 100" ${label ? `role="img" aria-label="${label}"` : 'aria-hidden="true"'}>${parts}</svg>`;
}

/** Paints a glyph onto a 2D canvas centered at (x, y) with the given size. */
export function paintGlyph(context: CanvasRenderingContext2D, animal: AnimalId, x: number, y: number, size: number, color: string, alpha = 1, outline?: string): void {
  const tones = TONES(color);
  context.save();
  context.translate(x - size / 2, y - size / 2);
  context.scale(size / 100, size / 100);
  for (const part of GLYPHS[animal]) {
    const tone = tones[part.tone];
    const path = new Path2D(part.d);
    context.globalAlpha = alpha * tone.opacity;
    if (tone.stroke) { context.strokeStyle = tone.stroke; context.lineWidth = 3.2; context.lineCap = 'round'; context.lineJoin = 'round'; context.stroke(path); }
    else {
      context.fillStyle = tone.fill!; context.fill(path);
      if (outline && part.tone === 'body') { context.strokeStyle = outline; context.lineWidth = 2; context.stroke(path); }
    }
  }
  context.restore();
}
