// Character definitions — unlockable with gold
//
// Properties:
//   id             - unique identifier
//   name           - display name (繁體中文)
//   description    - short description
//   startingWeapon - weapon id to start with
//   color          - player color override
//   baseStats      - stat overrides applied at game start
//   unlockCost     - gold to unlock (0 = free starter)

export const CHARACTER_DEFINITIONS = [
  {
    id: 'warrior',
    name: '戰士',
    icon: '🗡️',
    description: '均衡的初始角色',
    startingWeapon: 'arrow',
    color: '#00d4ff',
    baseStats: {
      maxHp: 500,
      speed: 180,
    },
    unlockCost: 0,
  },
  {
    id: 'mage',
    name: '法師',
    icon: '🔮',
    description: '速度快但血量低，起始武器為魔法球',
    startingWeapon: 'magic_orb',
    color: '#aa66ff',
    baseStats: {
      maxHp: 350,
      speed: 200,
    },
    unlockCost: 500,
  },
  {
    id: 'paladin',
    name: '聖騎士',
    icon: '🛡️',
    description: '血量高但速度慢，起始武器為聖劍雨',
    startingWeapon: 'holy_sword',
    color: '#ffdd44',
    baseStats: {
      maxHp: 700,
      speed: 150,
    },
    unlockCost: 1000,
  },
];

export function getCharacterDefinition(id) {
  return CHARACTER_DEFINITIONS.find(c => c.id === id) || null;
}
