// Room templates — define enemy waves and obstacles for each room
// type: 'normal' | 'elite' | 'treasure' | 'boss'
// waves: [{ enemies: [{ typeId, count }], delay }]
// obstacles: [{ x, y }] as fractions of arena width/height

export const ROOM_TEMPLATES = [
  // ─── CHAPTER 1 — 幽暗森林 ───────────────────────────────────────────────
  {
    id: 'ch1_r1',
    type: 'normal',
    waves: [{ enemies: [{ typeId: 'slime', count: 6 }], delay: 0 }],
    obstacles: [],
  },
  {
    id: 'ch1_r2',
    type: 'normal',
    waves: [
      { enemies: [{ typeId: 'slime', count: 4 }, { typeId: 'fast_bat', count: 3 }], delay: 0 },
    ],
    obstacles: [],
  },
  {
    id: 'ch1_r3',
    type: 'normal',
    waves: [
      { enemies: [{ typeId: 'slime', count: 4 }, { typeId: 'fast_bat', count: 4 }], delay: 0 },
      { enemies: [{ typeId: 'skeleton', count: 3 }], delay: 8 },
    ],
    obstacles: [{ x: 0.3, y: 0.4 }, { x: 0.7, y: 0.6 }],
  },
  {
    id: 'ch1_r4',
    type: 'normal',
    waves: [
      { enemies: [{ typeId: 'fast_bat', count: 6 }], delay: 0 },
      { enemies: [{ typeId: 'mage', count: 2 }], delay: 5 },
    ],
    obstacles: [],
  },
  {
    id: 'ch1_r5',
    type: 'normal',
    waves: [
      { enemies: [{ typeId: 'slime', count: 5 }, { typeId: 'skeleton', count: 3 }], delay: 0 },
    ],
    obstacles: [{ x: 0.5, y: 0.3 }],
  },
  {
    id: 'ch1_r6',
    type: 'elite',
    waves: [
      { enemies: [{ typeId: 'golem', count: 1 }, { typeId: 'slime', count: 4 }], delay: 0 },
    ],
    obstacles: [{ x: 0.25, y: 0.5 }, { x: 0.75, y: 0.5 }],
  },
  {
    id: 'ch1_r7',
    type: 'normal',
    waves: [
      { enemies: [{ typeId: 'archer', count: 3 }], delay: 0 },
      { enemies: [{ typeId: 'fast_bat', count: 5 }], delay: 6 },
    ],
    obstacles: [],
  },
  {
    id: 'ch1_r8',
    type: 'normal',
    waves: [
      { enemies: [{ typeId: 'skeleton', count: 5 }, { typeId: 'mage', count: 2 }], delay: 0 },
    ],
    obstacles: [{ x: 0.4, y: 0.6 }, { x: 0.6, y: 0.4 }],
  },
  {
    id: 'ch1_r9',
    type: 'normal',
    waves: [
      { enemies: [{ typeId: 'slime', count: 3 }, { typeId: 'bomb_bug', count: 3 }], delay: 0 },
      { enemies: [{ typeId: 'skeleton', count: 4 }], delay: 7 },
    ],
    obstacles: [],
  },
  {
    id: 'ch1_r10',
    type: 'elite',
    waves: [
      { enemies: [{ typeId: 'necromancer', count: 1 }, { typeId: 'fast_bat', count: 4 }], delay: 0 },
    ],
    obstacles: [{ x: 0.3, y: 0.35 }, { x: 0.7, y: 0.35 }, { x: 0.5, y: 0.65 }],
  },
  {
    id: 'ch1_r11',
    type: 'normal',
    waves: [
      { enemies: [{ typeId: 'mage', count: 3 }, { typeId: 'archer', count: 2 }], delay: 0 },
      { enemies: [{ typeId: 'slime', count: 6 }], delay: 8 },
    ],
    obstacles: [],
  },
  {
    id: 'ch1_treasure',
    type: 'treasure',
    waves: [],
    obstacles: [],
  },
  {
    id: 'ch1_boss',
    type: 'boss',
    waves: [{ enemies: [{ typeId: 'boss_demon', count: 1 }], delay: 0 }],
    obstacles: [],
  },

  // ─── CHAPTER 2 — 熔岩洞窟 ───────────────────────────────────────────────
  {
    id: 'ch2_r1',
    type: 'normal',
    waves: [
      { enemies: [{ typeId: 'skeleton', count: 5 }, { typeId: 'slime', count: 3 }], delay: 0 },
    ],
    obstacles: [],
  },
  {
    id: 'ch2_r2',
    type: 'normal',
    waves: [
      { enemies: [{ typeId: 'mage', count: 3 }, { typeId: 'fast_bat', count: 4 }], delay: 0 },
    ],
    obstacles: [{ x: 0.3, y: 0.5 }, { x: 0.7, y: 0.5 }],
  },
  {
    id: 'ch2_r3',
    type: 'normal',
    waves: [
      { enemies: [{ typeId: 'bomb_bug', count: 4 }, { typeId: 'skeleton', count: 4 }], delay: 0 },
      { enemies: [{ typeId: 'archer', count: 3 }], delay: 7 },
    ],
    obstacles: [],
  },
  {
    id: 'ch2_r4',
    type: 'normal',
    waves: [
      { enemies: [{ typeId: 'shielder', count: 2 }, { typeId: 'slime', count: 5 }], delay: 0 },
    ],
    obstacles: [{ x: 0.4, y: 0.4 }, { x: 0.6, y: 0.6 }],
  },
  {
    id: 'ch2_r5',
    type: 'elite',
    waves: [
      { enemies: [{ typeId: 'golem', count: 2 }], delay: 0 },
      { enemies: [{ typeId: 'mage', count: 3 }], delay: 8 },
    ],
    obstacles: [],
  },
  {
    id: 'ch2_r6',
    type: 'normal',
    waves: [
      { enemies: [{ typeId: 'healer', count: 1 }, { typeId: 'skeleton', count: 6 }], delay: 0 },
    ],
    obstacles: [{ x: 0.25, y: 0.4 }, { x: 0.75, y: 0.4 }, { x: 0.5, y: 0.7 }],
  },
  {
    id: 'ch2_r7',
    type: 'normal',
    waves: [
      { enemies: [{ typeId: 'dasher', count: 3 }, { typeId: 'fast_bat', count: 4 }], delay: 0 },
    ],
    obstacles: [],
  },
  {
    id: 'ch2_r8',
    type: 'normal',
    waves: [
      { enemies: [{ typeId: 'archer', count: 4 }, { typeId: 'mage', count: 2 }], delay: 0 },
      { enemies: [{ typeId: 'bomb_bug', count: 4 }], delay: 8 },
    ],
    obstacles: [{ x: 0.5, y: 0.4 }],
  },
  {
    id: 'ch2_r9',
    type: 'elite',
    waves: [
      { enemies: [{ typeId: 'necromancer', count: 2 }, { typeId: 'shielder', count: 2 }], delay: 0 },
    ],
    obstacles: [],
  },
  {
    id: 'ch2_r10',
    type: 'normal',
    waves: [
      { enemies: [{ typeId: 'healer', count: 2 }, { typeId: 'dasher', count: 3 }], delay: 0 },
    ],
    obstacles: [{ x: 0.3, y: 0.6 }, { x: 0.7, y: 0.6 }],
  },
  {
    id: 'ch2_r11',
    type: 'normal',
    waves: [
      { enemies: [{ typeId: 'shielder', count: 3 }, { typeId: 'mage', count: 3 }, { typeId: 'fast_bat', count: 3 }], delay: 0 },
    ],
    obstacles: [{ x: 0.4, y: 0.35 }, { x: 0.6, y: 0.35 }, { x: 0.5, y: 0.65 }],
  },
  {
    id: 'ch2_treasure',
    type: 'treasure',
    waves: [],
    obstacles: [],
  },
  {
    id: 'ch2_boss',
    type: 'boss',
    waves: [{ enemies: [{ typeId: 'boss_lich', count: 1 }], delay: 0 }],
    obstacles: [],
  },

  // ─── CHAPTER 3 — 冰封神殿 ───────────────────────────────────────────────
  {
    id: 'ch3_r1',
    type: 'normal',
    waves: [
      { enemies: [{ typeId: 'dasher', count: 4 }, { typeId: 'shielder', count: 2 }], delay: 0 },
    ],
    obstacles: [],
  },
  {
    id: 'ch3_r2',
    type: 'normal',
    waves: [
      { enemies: [{ typeId: 'healer', count: 2 }, { typeId: 'skeleton', count: 6 }], delay: 0 },
      { enemies: [{ typeId: 'mage', count: 3 }], delay: 8 },
    ],
    obstacles: [{ x: 0.3, y: 0.4 }, { x: 0.7, y: 0.4 }],
  },
  {
    id: 'ch3_r3',
    type: 'elite',
    waves: [
      { enemies: [{ typeId: 'golem', count: 2 }, { typeId: 'healer', count: 1 }], delay: 0 },
    ],
    obstacles: [{ x: 0.5, y: 0.3 }, { x: 0.3, y: 0.6 }, { x: 0.7, y: 0.6 }],
  },
  {
    id: 'ch3_r4',
    type: 'normal',
    waves: [
      { enemies: [{ typeId: 'archer', count: 5 }, { typeId: 'dasher', count: 3 }], delay: 0 },
    ],
    obstacles: [],
  },
  {
    id: 'ch3_r5',
    type: 'normal',
    waves: [
      { enemies: [{ typeId: 'necromancer', count: 2 }, { typeId: 'shielder', count: 3 }], delay: 0 },
    ],
    obstacles: [{ x: 0.4, y: 0.5 }, { x: 0.6, y: 0.5 }],
  },
  {
    id: 'ch3_r6',
    type: 'elite',
    waves: [
      { enemies: [{ typeId: 'healer', count: 2 }, { typeId: 'dasher', count: 4 }, { typeId: 'bomb_bug', count: 3 }], delay: 0 },
    ],
    obstacles: [],
  },
  {
    id: 'ch3_r7',
    type: 'normal',
    waves: [
      { enemies: [{ typeId: 'mage', count: 4 }, { typeId: 'archer', count: 4 }], delay: 0 },
      { enemies: [{ typeId: 'shielder', count: 3 }], delay: 9 },
    ],
    obstacles: [{ x: 0.25, y: 0.5 }, { x: 0.5, y: 0.5 }, { x: 0.75, y: 0.5 }],
  },
  {
    id: 'ch3_r8',
    type: 'normal',
    waves: [
      { enemies: [{ typeId: 'golem', count: 2 }, { typeId: 'dasher', count: 4 }], delay: 0 },
    ],
    obstacles: [],
  },
  {
    id: 'ch3_r9',
    type: 'elite',
    waves: [
      { enemies: [{ typeId: 'necromancer', count: 2 }, { typeId: 'healer', count: 2 }, { typeId: 'shielder', count: 2 }], delay: 0 },
    ],
    obstacles: [{ x: 0.3, y: 0.4 }, { x: 0.7, y: 0.4 }, { x: 0.3, y: 0.65 }, { x: 0.7, y: 0.65 }],
  },
  {
    id: 'ch3_r10',
    type: 'normal',
    waves: [
      { enemies: [{ typeId: 'dasher', count: 5 }, { typeId: 'bomb_bug', count: 4 }], delay: 0 },
      { enemies: [{ typeId: 'archer', count: 4 }], delay: 8 },
    ],
    obstacles: [],
  },
  {
    id: 'ch3_r11',
    type: 'elite',
    waves: [
      { enemies: [{ typeId: 'healer', count: 2 }, { typeId: 'shielder', count: 3 }, { typeId: 'mage', count: 3 }, { typeId: 'dasher', count: 3 }], delay: 0 },
    ],
    obstacles: [{ x: 0.4, y: 0.4 }, { x: 0.6, y: 0.4 }, { x: 0.4, y: 0.65 }, { x: 0.6, y: 0.65 }],
  },
  {
    id: 'ch3_treasure',
    type: 'treasure',
    waves: [],
    obstacles: [],
  },
  {
    id: 'ch3_boss',
    type: 'boss',
    waves: [{ enemies: [{ typeId: 'boss_dragon', count: 1 }], delay: 0 }],
    obstacles: [],
  },
];

// Helper: get room template by id
export function getRoomTemplate(id) {
  return ROOM_TEMPLATES.find(r => r.id === id);
}
