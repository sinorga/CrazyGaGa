## Context

CrazyGaGa has a complete single-run gameplay loop (Phase 4 done). CONFIG already has `meta.goldPerKill: 0.2`. The settings page pattern (Canvas-rendered UI with localStorage) is established and can be reused for shop/character select screens. Game state machine supports custom states (menu, settings, playing, levelup, gameover).

## Goals / Non-Goals

**Goals:**
- Gold drops from enemies, accumulated across runs in localStorage
- Permanent upgrades buyable from a shop (6 types, multi-level)
- 3 characters with different starting weapons/stats, unlockable with gold
- All meta persisted in localStorage under `crazygaga_meta`

**Non-Goals:**
- Achievements or challenges
- Cosmetic unlocks
- Prestige/reset systems
- Leaderboards

## Decisions

### 1. Meta storage: Single localStorage key
Store all meta data (gold, upgrade levels, unlocked characters, selected character) in one JSON object under `crazygaga_meta`. Simpler than multiple keys.

### 2. Gold as fractional accumulator
`goldPerKill` is 0.2, so track fractional gold internally and display as integer. Gold drops are visual-only (auto-collected, no pickup entity needed).

### 3. Upgrade definitions in data file
Each upgrade: id, name, description, stat, maxLevel, costs[] (array of gold cost per level), values[] (array of bonus per level). Applied additively to player stats at game start.

### 4. Character definitions in data file
Each character: id, name, description, startingWeapon, baseStats overrides (hp, speed, damage, etc.), unlockCost (0 = free starter). Applied by overriding CONFIG values at game start.

### 5. UI flow
```
Menu → 商店 (Shop) → back → Menu
Menu → 角色 (Characters) → select/unlock → back → Menu  
Menu → 開始 (Start) → Playing (with selected character + upgrades applied)
```

### 6. Upgrade types and scaling
| Upgrade | Stat | Levels | Cost Pattern | Value Pattern |
|---------|------|--------|-------------|---------------|
| 生命強化 | maxHp | 5 | 100,200,400,800,1600 | +50,+50,+50,+50,+50 |
| 攻擊強化 | damage | 5 | 100,200,400,800,1600 | +10%,+10%,+10%,+10%,+10% |
| 速度強化 | speed | 5 | 80,160,320,640,1280 | +15,+15,+15,+15,+15 |
| 護甲強化 | armor | 5 | 120,240,480,960,1920 | +2,+2,+2,+2,+2 |
| 金幣加成 | goldRate | 5 | 150,300,600,1200,2400 | +20%,+20%,+20%,+20%,+20% |
| 經驗加成 | expBonus | 5 | 150,300,600,1200,2400 | +10%,+10%,+10%,+10%,+10% |

### 7. Characters
| Character | Starting Weapon | HP | Speed | Unlock |
|-----------|----------------|-----|-------|--------|
| 戰士 (Warrior) | arrow | 500 | 180 | Free |
| 法師 (Mage) | magic_orb | 350 | 200 | 500 gold |
| 聖騎士 (Paladin) | holy_sword | 700 | 150 | 1000 gold |

## Risks / Trade-offs

- **[Risk] Gold inflation** → Exponential upgrade costs provide natural sink
- **[Risk] localStorage full** → Meta data is tiny (<1KB), not a real concern
- **[Trade-off] No gold pickup entity** → Simpler implementation, gold auto-collected on kill. Visual feedback via particle effect + HUD counter.
