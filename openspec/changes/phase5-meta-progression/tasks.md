## 1. Data Files

- [ ] 1.1 Create src/data/upgrades.js with 6 upgrade definitions (id, name, stat, maxLevel, costs[], values[])
- [ ] 1.2 Create src/data/characters.js with 3 character definitions (warrior, mage, paladin)
- [ ] 1.3 Write tests for upgrade/character data (definitions valid, costs/values arrays match maxLevel)

## 2. Meta Persistence

- [ ] 2.1 Create src/meta.js with loadMeta(), saveMeta(), resetMeta() using localStorage key crazygaga_meta
- [ ] 2.2 Implement purchaseUpgrade(upgradeId), unlockCharacter(characterId), selectCharacter(characterId)
- [ ] 2.3 Implement getUpgradeBonus(stat) to calculate total bonus from purchased upgrades
- [ ] 2.4 Write tests/meta.test.js: load/save/reset, purchase, unlock, insufficient gold, max level

## 3. Game Integration

- [ ] 3.1 Add gold tracking to game.js: runGold counter, increment on enemy death
- [ ] 3.2 Save run gold to meta on game over
- [ ] 3.3 Apply permanent upgrades and character stats at game start
- [ ] 3.4 Add shop/characters states to game state machine
- [ ] 3.5 Add handleClick logic for shop (purchase upgrades, back) and characters (unlock, select, back)
- [ ] 3.6 Add menu buttons for "商店" and "角色"

## 4. Renderer

- [ ] 4.1 Add gold display to HUD (during gameplay) and game over screen
- [ ] 4.2 Add "商店" and "角色" buttons to drawMenu(), show selected character name
- [ ] 4.3 Implement drawShopPage(): title, gold total, upgrade rows with level/cost/buy button, back
- [ ] 4.4 Implement drawCharacterSelect(): character cards with stats, lock/unlock state, select, back

## 5. Integration & Testing

- [ ] 5.1 Wire shop/characters state rendering in index.html
- [ ] 5.2 Run all tests, verify 201+ tests pass
- [ ] 5.3 Commit and push
