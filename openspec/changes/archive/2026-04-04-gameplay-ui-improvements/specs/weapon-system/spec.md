# Weapon System Changes (Delta)

## Modified: Magic Orb Count Scaling
- MUST scale orb count as `baseCount + (level - 1)` (one extra orb per level)
- Previous formula was `baseCount + floor((level - 1) / 3)`
- At level 5: warrior gets 5 orbs total (base 1 + 4)

## New: Orb vs Enemy Projectile Collision
- MUST check orb positions against enemy projectiles each frame in collision loop
- When orb circle overlaps enemy projectile circle, destroy the enemy projectile
- Orbs are NOT consumed — they persist and continue orbiting
- MUST emit small particle effect (3-4 particles) at destruction point
- Color: use orb's color for particles
