# Proposal: archero-full-conversion

## What
Transform CrazyGaGa from a Vampire Survivors-style open-world horde survivor into a full Archero (弓箭傳說) clone. The core game loop changes from "survive infinite waves on an open map" to "clear discrete rooms across chapters, choose abilities between rooms, and fight a boss to complete each chapter."

## Why
The game already has the right feel in its controls (stop-to-shoot joystick) and progression DNA (weapon evolution, skill choices, meta upgrades). However its macro structure — open 3000×3000 map, continuous wave spawner, kill-500-to-win — is closer to Vampire Survivors than Archero. Closing the gap requires five coordinated changes that together recreate what makes Archero compelling: tension in enclosed rooms, the anticipation of door-opening after a tough fight, meaningful ability selection between rooms, and a chapter-based sense of progress.

## Target Experience
Player opens the game → taps Play → enters Room 1 of Chapter 1 → enemies spawn from the walls → player dodges and shoots (stop-to-shoot) → last enemy dies → exit door glows and opens → player chooses one of 3 abilities → walks through door → Room 2 → … → Room 12 → Boss Room → defeats boss → Chapter 1 complete → Chapter 2 begins with harder enemies.

## Phases

### Phase 1 — Room-Based Structure (Architecture)
Replace the open map and wave spawner with a `RoomManager` that owns the dungeon state. Each room is a screen-sized enclosed arena. Enemies for that room are defined in room templates stored in `src/data/rooms.js`. Room state machine: `entering → fighting → cleared → transitioning`. When all enemies are dead, an exit door appears. The camera no longer scrolls; the player is always within the visible canvas.

A `src/data/chapters.js` file defines each chapter as an ordered list of room template IDs, with the final room always being a boss room. Start with Chapters 1–3.

### Phase 2 — Archero-Specific Skills & Wall Bounce
Two mechanical additions that make Archero's combat feel distinct:

1. **Arrow wall bouncing**: Projectiles reflect off room walls up to N times (default 0; a skill grants bounces). This creates strategic positioning and room-clearing chain shots.
2. **Archero ability set**: New skills that map 1:1 to classic Archero abilities — diagonal arrows, side arrows, front+back arrows, multishot fan, freeze on hit, poison DoT, stun, heal on kill, thorns (contact damage reflection), vampire (lifesteal). These are selected between rooms (Phase 4).

### Phase 3 — HP Pickups & Chests
Add health recovery to give players a survival lifeline:
- **HP hearts** (💗): ~5% drop chance from normal enemies; boss always drops a large potion.
- **Chest system**: Treasure rooms (1 per chapter) contain a chest that opens on touch and grants a random reward (HP, gold, or an ability scroll).

### Phase 4 — Between-Room Ability Selection
After clearing each room, the game enters `roomclear` state and presents 3 ability cards (reusing the existing level-up panel UI). The player picks one before proceeding. This replaces the current on-level-up ability grant for Archero-style active abilities; the existing EXP/level-up system is repurposed for passive hero stat upgrades only (HP, damage, speed, armor).

### Phase 5 — Polish & Content
- Obstacle/barrel system: some rooms have destructible barrels that block movement and projectiles.
- HUD updates: Chapter X / Room Y counter, room progress dots, door open animation, room-clear celebration particle burst.
- More enemy types: Shielder (blocks frontal projectiles), Healer (restores HP to nearby enemies), Dasher (dash-pause pattern).
- More bosses: Chapter 3 and Chapter 4 bosses, each with phase transitions at 50% HP.

## Out of Scope
- Equipment/gear system (weapons as equippable items with rarity tiers)
- Energy system (stamina-gated play sessions)
- Online leaderboards or cloud saves
- Real-time multiplayer
- Animated sprite sheets (emoji icons remain)

## Success Criteria
- Player can complete a full Chapter 1 run (12 rooms + boss) without hitting the old "kill 500 to win" condition.
- Ability choices appear after every room clear.
- Arrows with the Bounce skill visibly reflect off room walls and hit enemies.
- HP hearts drop and restore health.
- All existing meta progression (gold, shop, character select) continues to work.
