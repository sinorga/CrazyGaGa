# Tasks: Gameplay UI Improvements

## Group 1: Pause Menu
- [x] 1.1 Add 'paused' state to game state machine, pause button handler in handleClick, resume/exit handlers
- [x] 1.2 Render pause button (⏸) in HUD during playing state
- [x] 1.3 Render pause overlay with "遊戲暫停" title, "繼續遊戲" and "離開遊戲" buttons
- [x] 1.4 Wire pause state in index.html (skip updatePlaying when paused, render overlay)

## Group 2: Skill UI Overhaul
- [x] 2.1 Add skill level display to HUD (row of icons + level below Lv indicator)
- [x] 2.2 Rewrite drawLevelUpPanel to horizontal layout, positioned at top ~35% of screen
- [x] 2.3 Update handleClick levelup hit detection to match new horizontal card positions

## Group 3: Skill Max Level
- [x] 3.1 Change weapon skill maxLevel from 8 to 5 in skills.js
- [x] 3.2 Update any tests that reference weapon skill maxLevel of 8

## Group 4: Magic Orb Enhancements
- [x] 4.1 Change orb count formula in _updateOrbit to +1 per level
- [x] 4.2 Add orb-vs-enemyProjectile collision in _processCollisions with particle effect

## Group 5: Integration & Deploy
- [x] 5.1 Run all tests, verify passing
- [x] 5.2 Commit and push
