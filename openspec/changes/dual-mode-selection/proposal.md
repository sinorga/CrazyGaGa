# Proposal: dual-mode-selection

## What
Add a game mode selection screen so players can choose between two fully playable modes:

1. **Archero Mode** (新版地城) — the new room-based dungeon (current v2.0.0 default)
2. **Survivor Mode** (生存模式) — the original Vampire Survivors-style open-world horde survival

The selection appears at game start (main menu or a dedicated mode screen) and persists for the run.

## Why
The Archero conversion in v2.0.0 completely replaced the original gameplay, removing an experience that was fully working and enjoyed. Many players may prefer the open-world horde survival style. Supporting both modes:

- Preserves the original gameplay for players who liked it
- Lets players compare both styles
- Reduces risk of alienating existing players with the architecture change
- Makes the game more replayable with two distinct experiences

## Modes

### Archero Mode (v2.0.0 behavior)
- Screen-sized room arena with walls
- RoomManager: chapters, rooms, door-clear progression
- Ability selection between rooms (archero skill pool)
- HP hearts and chests
- Camera fixed; player clamped to room walls

### Survivor Mode (pre-v2.0.0 behavior)
- Open 3000×3000 map with scrolling camera
- WaveSpawner: continuous enemy spawning, escalating difficulty
- Ability selection on level-up (levelup skill pool)
- Kill 500 enemies to win
- Boss spawns at kill thresholds (every 100 kills)

## Success Criteria
- Main menu shows two mode buttons (地城模式 / 生存模式)
- Each mode launches a complete, bug-free run
- All existing meta progression (gold, shop, character select) works in both modes
- All existing tests continue to pass
