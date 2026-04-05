// Input handling - keyboard + virtual joystick
import { CONFIG } from './config.js';

export class Input {
  constructor(canvas) {
    this.canvas = canvas;
    this.keys = {};
    this.direction = { x: 0, y: 0 };
    this.isMoving = false;

    // Virtual joystick state
    this.joystick = {
      active: false,
      startX: 0,
      startY: 0,
      currentX: 0,
      currentY: 0,
      touchId: null,
    };

    // Detect touch device
    this.isTouchDevice = 'ontouchstart' in window;

    this._setupKeyboard();
    this._setupTouch();
  }

  _setupKeyboard() {
    window.addEventListener('keydown', (e) => {
      this.keys[e.key.toLowerCase()] = true;
      // Prevent scrolling with arrow keys / space
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(e.key.toLowerCase())) {
        e.preventDefault();
      }
    });
    window.addEventListener('keyup', (e) => {
      this.keys[e.key.toLowerCase()] = false;
    });
  }

  _setupTouch() {
    this.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      if (this.joystick.active) return;
      if (this.enabled === false) return; // skip joystick when UI is active
      const touch = e.changedTouches[0];
      const rect = this.canvas.getBoundingClientRect();
      this.joystick.active = true;
      this.joystick.touchId = touch.identifier;
      this.joystick.startX = touch.clientX - rect.left;
      this.joystick.startY = touch.clientY - rect.top;
      this.joystick.currentX = this.joystick.startX;
      this.joystick.currentY = this.joystick.startY;
    }, { passive: false });

    this.canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      for (const touch of e.changedTouches) {
        if (touch.identifier === this.joystick.touchId) {
          const rect = this.canvas.getBoundingClientRect();
          this.joystick.currentX = touch.clientX - rect.left;
          this.joystick.currentY = touch.clientY - rect.top;
        }
      }
    }, { passive: false });

    const endTouch = (e) => {
      for (const touch of e.changedTouches) {
        if (touch.identifier === this.joystick.touchId) {
          this.joystick.active = false;
          this.joystick.touchId = null;
        }
      }
    };
    this.canvas.addEventListener('touchend', endTouch);
    this.canvas.addEventListener('touchcancel', endTouch);
  }

  update() {
    let dx = 0, dy = 0;

    // Keyboard input
    if (this.keys['w'] || this.keys['arrowup']) dy -= 1;
    if (this.keys['s'] || this.keys['arrowdown']) dy += 1;
    if (this.keys['a'] || this.keys['arrowleft']) dx -= 1;
    if (this.keys['d'] || this.keys['arrowright']) dx += 1;

    // Touch joystick input
    if (this.joystick.active) {
      const jdx = this.joystick.currentX - this.joystick.startX;
      const jdy = this.joystick.currentY - this.joystick.startY;
      const dist = Math.sqrt(jdx * jdx + jdy * jdy);
      const deadzone = 8;
      if (dist > deadzone) {
        const maxDist = CONFIG.ui.joystickRadius;
        const norm = Math.min(dist, maxDist) / maxDist;
        dx = (jdx / dist) * norm;
        dy = (jdy / dist) * norm;
      }
    }

    // Normalize
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len > 0) {
      this.direction.x = dx / Math.max(len, 1);
      this.direction.y = dy / Math.max(len, 1);
      this.isMoving = true;
    } else {
      this.direction.x = 0;
      this.direction.y = 0;
      this.isMoving = false;
    }
  }

  // Get joystick position for rendering (in screen coords)
  getJoystickRenderData() {
    if (!this.joystick.active) return null;
    const r = CONFIG.ui.joystickRadius;
    const dx = this.joystick.currentX - this.joystick.startX;
    const dy = this.joystick.currentY - this.joystick.startY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const clampedDist = Math.min(dist, r);
    const angle = Math.atan2(dy, dx);
    return {
      baseX: this.joystick.startX,
      baseY: this.joystick.startY,
      knobX: this.joystick.startX + Math.cos(angle) * clampedDist,
      knobY: this.joystick.startY + Math.sin(angle) * clampedDist,
      radius: r,
    };
  }
}
