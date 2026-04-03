# CrazyGaGa

**Roguelite Horde Survival Game** — HTML5 2D browser game combining Archero-style controls with Vampire Survivors-style horde gameplay.

## Play Now

**[https://sinorga.github.io/CrazyGaGa/](https://sinorga.github.io/CrazyGaGa/)**

Works on desktop and mobile browsers. No installation required.

## Gameplay

- Move with **WASD / Arrow Keys** (desktop) or **Virtual Joystick** (mobile)
- Character **auto-attacks when stationary** (Archero-style)
- Survive waves of enemies that spawn from all directions
- Collect **EXP gems** to level up and choose new skills
- Mix **weapons** and **passive upgrades** to build powerful combos

## Features

### Weapons (6 types)
| Weapon | Pattern | Description |
|--------|---------|-------------|
| Bow & Arrow | Projectile | Straight shots with pierce |
| Magic Orb | Orbit | Rotating orbs around player |
| Lightning | Chain | Bouncing electric strikes |
| Fire Circle | Area | Ground-based burn zones |
| Boomerang | Boomerang | Returns on path, hits both ways |
| Holy Swords | Area | Raining swords from above |

### Enemies (10 types)
- **Chargers** — rush straight at you
- **Shooters** — keep distance and fire projectiles
- **Tanks** — slow but extremely durable
- **Exploders** — explode on death dealing area damage
- **Summoners** — spawn minions
- **Bosses** — unique attack patterns every 3 minutes

### Progression
- 14 skills (6 weapon + 8 passive upgrades)
- Level-up presents 3 random skill choices
- Weapons scale across 8 upgrade levels
- Passive stats: HP, speed, damage, cooldown, armor, regen, pickup range, EXP bonus

## Tech Stack

- **Vanilla JavaScript** (ES Modules, no build step)
- **HTML5 Canvas 2D** rendering
- **Spatial Hash Grid** for collision detection
- **Vitest** + **Stryker** for TDD and mutation testing
- **OpenSpec** for spec-driven development
- **GitHub Actions** CI/CD with GitHub Pages deployment

## Development

```bash
# Install dependencies
npm install

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run mutation tests
npm run test:mutate

# Start local server (for ES modules)
npx serve .
```

## Architecture

```
index.html              Entry point
src/
  config.js             All tunable game values
  data/
    enemies.js          Enemy type definitions (extensible)
    weapons.js          Weapon definitions (extensible)
    skills.js           Skill/passive definitions (extensible)
  player.js             Player entity
  enemy.js              Enemy entity + AI behaviors
  spawner.js            Wave spawner
  projectile.js         Projectile entity
  pickup.js             EXP gem entity
  weapons.js            Weapon manager + attack patterns
  game.js               Game loop + state machine
  collision.js          Spatial hash grid
  particles.js          Particle effects
  input.js              Keyboard + touch input
  renderer.js           Canvas rendering
```

### Extending the Game

Add new content by editing data files only — no code changes needed:

- **New enemy type**: Add entry to `src/data/enemies.js`
- **New weapon**: Add entry to `src/data/weapons.js`
- **New skill**: Add entry to `src/data/skills.js`
- **Tune values**: Edit `src/config.js`

## License

ISC
