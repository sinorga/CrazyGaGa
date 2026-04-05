# Progression Changes (Delta)

## Modified: Weapon Skill Max Level
- MUST set all weapon skill maxLevel to 5 (was 8)
- Passive skills retain their existing maxLevel values (3 or 5)
- No logic changes needed — `getRandomSkillChoices()` already excludes maxed skills
