# CrazyGaGa

**Two games in one** — pick your playstyle from the main menu and dive in. No installation. Works on desktop and mobile.

**[▶ Play Now → sinorga.github.io/CrazyGaGa](https://sinorga.github.io/CrazyGaGa/)**

---

## Game Modes

### 🏹 Dungeon Mode (地城模式)
Archero-style room-based dungeon crawler. Clear waves of enemies to open the exit door, then choose a powerful ability between rooms. Three chapters, 13 rooms each, with a boss guarding the final room.

### ⚔️ Survivor Mode (生存模式)
Vampire Survivors-style horde survival. Enemies pour in from all directions on an open map. Level up, stack upgrades, and survive to 500 kills.

---

## Controls

| Platform | Move | Attack |
|----------|------|--------|
| Desktop | WASD / Arrow Keys | Auto (stand still) |
| Mobile | Virtual Joystick | Auto (stand still) |

---

## Features

### Weapons (6 types)
| Weapon | Style | Description |
|--------|-------|-------------|
| Bow & Arrow | Projectile | Straight shots; can pierce and bounce off walls |
| Magic Orb | Orbit | Rotating orbs that destroy enemy projectiles |
| Lightning | Chain | Bouncing strikes that jump between enemies |
| Fire Circle | Area | Burn zones on the ground |
| Boomerang | Boomerang | Returns on path, hits twice |
| Holy Swords | Area | Raining swords from above |

### Archero Skills (Dungeon Mode)
Earned between rooms — weapon modifiers that change how you play:
- **Diagonal Shot** / **Side Shot** / **Back Shot** — extra projectile directions
- **Multishot** — fire a spread of projectiles
- **Wall Bounce** — projectiles ricochet off room walls
- **Ricochet** — projectiles redirect to the nearest enemy on bounce
- **Freeze / Poison** — status effects on hit
- **Thorns / Vampire / Heal on Kill** — passive combat stats

### Passive Upgrades (Level-Up)
Earned on level-up in both modes: HP, speed, damage, cooldown reduction, armor, regen, pickup range, EXP bonus.

### Weapon Evolution
Max out a weapon alongside specific passive stats to unlock an evolved form with a unique attack pattern.

### Enemies (13+ types)
Slimes, bats, trolls, shooters, exploders, summoners, shielders (block frontal hits), healers (regen nearby allies), dashers (teleport), and chapter bosses with two-phase behavior.

### Meta Progression
Gold collected per run is banked permanently. Spend it in the shop on upgrades that persist across all runs: max HP, speed, damage, armor, EXP rate, gold rate.

### Characters
Unlock alternate characters with different starting stats, weapons, and colors.

---

## Tech Stack

- **Vanilla JavaScript** (ES Modules, no build step)
- **HTML5 Canvas 2D** rendering
- **Spatial Hash Grid** for O(1) collision detection
- **Vitest** unit tests (278 passing)
- **OpenSpec** spec-driven development workflow
- **GitHub Actions** CI/CD → GitHub Pages

---

## Development

```bash
npm install        # install dependencies
npm test           # run tests (Vitest)
npm run test:watch # watch mode
npx serve .        # local dev server (needed for ES modules)
```

---

## Architecture

```
index.html              Entry point + version cache-bust
src/
  config.js             All tunable values + VERSION constant
  gameConfig.js         Runtime config layer (localStorage overrides)
  game.js               State machine + game loop
  main.js               RAF loop + render routing
  renderer.js           Canvas rendering
  input.js              WASD + virtual joystick
  collision.js          Spatial hash grid
  particles.js          Particle system
  player.js             Player entity
  enemy.js              Enemy entity + AI (12 behavior types)
  weapons.js            Weapon manager + 6 attack patterns
  projectile.js         Projectile + wall bounce
  pickup.js             EXP gems + HP hearts
  chest.js              Treasure chest rewards
  barrel.js             Destructible obstacle
  boss.js               Boss AI
  roomManager.js        Dungeon room state machine (Dungeon Mode)
  spawner.js            Wave spawner (Survivor Mode)
  meta.js               Persistent gold + upgrades
  settings.js           User settings
  configEditor.js       In-game config editor
  data/
    enemies.js          Enemy type definitions
    weapons.js          Weapon definitions
    skills.js           Skill + passive definitions (pooled by mode)
    chapters.js         Chapter definitions (Dungeon Mode)
    rooms.js            Room templates (Dungeon Mode)
    characters.js       Playable character roster
    upgrades.js         Shop upgrade definitions
    evolutions.js       Weapon evolution recipes
openspec/               Spec-driven change history
tests/                  Vitest unit tests
```

### Adding Content

New content is data-only — no core code changes required:

- **New enemy**: add to `src/data/enemies.js`
- **New weapon**: add to `src/data/weapons.js`
- **New skill**: add to `src/data/skills.js` (set `pool: 'archero'` or `pool: 'levelup'`)
- **New room**: add to `src/data/rooms.js`
- **New character**: add to `src/data/characters.js`
- **Tune values**: edit `src/config.js`

---

## License

ISC
