# Pause Menu

## Requirements

- MUST show a pause button (⏸) in the top-right corner during gameplay state
- MUST transition game to 'paused' state when pause button is tapped
- MUST stop game updates (updatePlaying not called) while paused
- MUST render a pause overlay with semi-transparent background
- MUST show "繼續遊戲" button that resumes gameplay (returns to 'playing')
- MUST show "離開遊戲" button that exits to main menu (returns to 'menu')
- MUST NOT save run gold when exiting via pause menu (run abandoned)
- Pause button hit area: ~40x40px, positioned at top-right with margin
