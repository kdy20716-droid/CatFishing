/**
 * Unified Input Manager (Mouse, Touch, Keyboard)
 */
import { Vector2 } from './Vector.js';

export class Input {
  constructor(canvas, camera) {
    this.canvas = canvas;
    this.camera = camera;

    this.mouseScreen = new Vector2(0, 0);
    this.mouseWorld = new Vector2(0, 0);
    this.isMouseDown = false;
    this.mouseHoldTime = 0;
    this.mouseJustPressed = false;
    this.mouseJustReleased = false;

    this.keys = {};
    this.keysJustPressed = {};

    // Touch support
    this.touchId = null;

    // Movement axes
    this.horizontalAxis = 0; // -1 (left), +1 (right)

    // Callbacks
    this.listeners = new Map();

    this.initListeners();
  }

  isTypingInInput(target) {
    const active = target || document.activeElement;
    if (!active) return false;
    const tag = active.tagName ? active.tagName.toLowerCase() : '';
    return tag === 'input' || tag === 'textarea' || active.isContentEditable;
  }

  initListeners() {
    window.addEventListener('keydown', (e) => {
      // If typing in any input field or textarea, ignore game controls & shortcuts!
      if (this.isTypingInInput(e.target)) {
        return;
      }

      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        e.preventDefault();
      }
      if (!this.keys[e.code]) {
        this.keysJustPressed[e.code] = true;
      }
      this.keys[e.code] = true;
      this.emit('keydown', e.code);
    });

    window.addEventListener('keyup', (e) => {
      if (this.isTypingInInput(e.target)) {
        return;
      }

      this.keys[e.code] = false;
      this.emit('keyup', e.code);
    });

    this.canvas.addEventListener('mousedown', (e) => {
      if (e.button === 0) {
        this.isMouseDown = true;
        this.mouseJustPressed = true;
        this.mouseHoldTime = 0;
        this.updateMousePos(e.clientX, e.clientY);
        this.emit('pointerdown', this.mouseWorld);
      }
    });

    window.addEventListener('mousemove', (e) => {
      this.updateMousePos(e.clientX, e.clientY);
    });

    window.addEventListener('mouseup', (e) => {
      if (e.button === 0 && this.isMouseDown) {
        this.isMouseDown = false;
        this.mouseJustReleased = true;
        this.emit('pointerup', { world: this.mouseWorld, holdTime: this.mouseHoldTime });
      }
    });

    this.canvas.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      this.updateMousePos(e.clientX, e.clientY);
      this.emit('rightclick', { world: this.mouseWorld });
    });

    // Touch events for mobile/tablet
    this.canvas.addEventListener('touchstart', (e) => {
      if (e.touches.length > 0) {
        const touch = e.touches[0];
        this.touchId = touch.identifier;
        this.isMouseDown = true;
        this.mouseJustPressed = true;
        this.mouseHoldTime = 0;
        this.updateMousePos(touch.clientX, touch.clientY);
        this.emit('pointerdown', this.mouseWorld);
      }
    }, { passive: false });

    window.addEventListener('touchmove', (e) => {
      for (let i = 0; i < e.touches.length; i++) {
        if (e.touches[i].identifier === this.touchId) {
          this.updateMousePos(e.touches[i].clientX, e.touches[i].clientY);
          break;
        }
      }
    }, { passive: true });

    window.addEventListener('touchend', (e) => {
      if (this.isMouseDown) {
        this.isMouseDown = false;
        this.mouseJustReleased = true;
        this.emit('pointerup', { world: this.mouseWorld, holdTime: this.mouseHoldTime });
      }
    });
  }

  updateMousePos(clientX, clientY) {
    const rect = this.canvas.getBoundingClientRect();
    this.mouseScreen.set(clientX - rect.left, clientY - rect.top);
    if (this.camera) {
      const world = this.camera.screenToWorld(this.mouseScreen.x, this.mouseScreen.y);
      this.mouseWorld.copy(world);
    }
  }

  update(dt) {
    if (this.isMouseDown || this.keys['Space']) {
      this.mouseHoldTime += dt;
    } else {
      this.mouseHoldTime = 0;
    }

    // Update horizontal movement
    let h = 0;
    if (this.keys['KeyA'] || this.keys['ArrowLeft']) h -= 1;
    if (this.keys['KeyD'] || this.keys['ArrowRight']) h += 1;
    this.horizontalAxis = h;

    // Reset frame-specific triggers
    this.mouseJustPressed = false;
    this.mouseJustReleased = false;
    this.keysJustPressed = {};
  }

  isReeling() {
    return this.isMouseDown || this.keys['Space'] || this.keys['KeyW'] || this.keys['ArrowUp'];
  }

  isKeyJustPressed(code) {
    return !!this.keysJustPressed[code];
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(cb => cb(data));
    }
  }
}
