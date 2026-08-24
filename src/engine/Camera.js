/**
 * Smooth Smart Camera for tracking Boat, Line, Hook and Fish
 */
import { Vector2 } from './Vector.js?v=5.0.0';

export class Camera {
  constructor(viewportWidth, viewportHeight) {
    this.width = viewportWidth;
    this.height = viewportHeight;
    this.pos = new Vector2(0, 0);
    this.target = new Vector2(0, 0);
    this.zoom = 1.0;
    this.targetZoom = 1.0;
    this.lerpSpeed = 0.08;
    
    // Bounds in world coordinates (dock shop at left edge -130px, 32,000px ocean width, 750m depth)
    this.minX = -130;
    this.maxX = 32000;
    this.minY = -500; // Above water (sky)
    this.maxY = 16500; // Deep 750m+ seabed floor

    // Screen Shake
    this.shakeDuration = 0;
    this.shakeIntensity = 0;
    this.shakeOffset = new Vector2(0, 0);
  }

  resize(w, h) {
    this.width = w;
    this.height = h;
  }

  setTarget(x, y, zoom = null) {
    this.target.set(x, y);
    if (zoom !== null) {
      this.targetZoom = zoom;
    }
  }

  shake(intensity = 8, duration = 0.3) {
    this.shakeIntensity = intensity;
    this.shakeDuration = duration;
  }

  update(dt) {
    // Smooth position interpolation
    this.pos.lerp(this.target, this.lerpSpeed);

    // Smooth zoom interpolation
    this.zoom += (this.targetZoom - this.zoom) * this.lerpSpeed;

    // Handle screen shake
    if (this.shakeDuration > 0) {
      this.shakeDuration -= dt;
      const factor = Math.max(0, this.shakeDuration);
      this.shakeOffset.set(
        (Math.random() - 0.5) * 2 * this.shakeIntensity * factor,
        (Math.random() - 0.5) * 2 * this.shakeIntensity * factor
      );
    } else {
      this.shakeOffset.set(0, 0);
    }

    // Clamp camera within ocean bounds
    const halfW = (this.width / 2) / this.zoom;
    const halfH = (this.height / 2) / this.zoom;
    this.pos.x = Math.max(this.minX + halfW, Math.min(this.maxX - halfW, this.pos.x));
    this.pos.y = Math.max(this.minY + halfH, Math.min(this.maxY - halfH, this.pos.y));
  }

  apply(ctx) {
    ctx.save();
    ctx.translate(this.width / 2 + this.shakeOffset.x, this.height / 2 + this.shakeOffset.y);
    ctx.scale(this.zoom, this.zoom);
    ctx.translate(-this.pos.x, -this.pos.y);
  }

  restore(ctx) {
    ctx.restore();
  }

  screenToWorld(screenX, screenY) {
    const centeredX = screenX - (this.width / 2 + this.shakeOffset.x);
    const centeredY = screenY - (this.height / 2 + this.shakeOffset.y);
    const unscaledX = centeredX / this.zoom;
    const unscaledY = centeredY / this.zoom;
    return new Vector2(unscaledX + this.pos.x, unscaledY + this.pos.y);
  }

  worldToScreen(worldX, worldY) {
    const relativeX = (worldX - this.pos.x) * this.zoom;
    const relativeY = (worldY - this.pos.y) * this.zoom;
    return new Vector2(
      relativeX + (this.width / 2 + this.shakeOffset.x),
      relativeY + (this.height / 2 + this.shakeOffset.y)
    );
  }

  getVisibleWorldBounds() {
    const halfW = (this.width / 2) / this.zoom;
    const halfH = (this.height / 2) / this.zoom;
    return {
      left: this.pos.x - halfW,
      right: this.pos.x + halfW,
      top: this.pos.y - halfH,
      bottom: this.pos.y + halfH
    };
  }
}
