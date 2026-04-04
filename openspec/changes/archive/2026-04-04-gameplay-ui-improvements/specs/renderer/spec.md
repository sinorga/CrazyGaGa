# Renderer Changes (Delta)

## New: Pause Overlay
- MUST render semi-transparent black overlay when game state is 'paused'
- MUST render "遊戲暫停" title centered
- MUST render two buttons: "繼續遊戲" and "離開遊戲" vertically stacked

## New: Pause Button
- MUST render ⏸ icon button at top-right corner during 'playing' state
- Button size ~40x40px with visible background

## Modified: Skill Level HUD
- MUST display acquired skills below level indicator (top-left area)
- Show icon + "Lv.N" for each skill the player has
- Compact horizontal row, max ~6 visible

## Modified: Level-Up Panel
- MUST render skill choices horizontally (side-by-side cards) instead of vertically
- Panel positioned at top ~35% of screen height to avoid joystick zone
- Each card shows icon, name, and description
- Card width scales with canvas width: `(canvasWidth - gaps) / choiceCount`
