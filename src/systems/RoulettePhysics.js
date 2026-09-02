/**
 * 🎲 European Roulette Wheel Physics Engine
 * Simulates realistic metallic ball centrifugal track motion, 
 * fret deflector collisions, pocket bouncing, and wheel rotation.
 */

export const ROULETTE_NUMBERS = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 
  5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26
];

export const RED_NUMBERS = new Set([
  1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36
]);

export function getNumberColor(num) {
  if (num === 0) return 'green';
  return RED_NUMBERS.has(num) ? 'red' : 'black';
}

export class RoulettePhysics {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas ? canvas.getContext('2d') : null;

    // Wheel dimensions
    this.cx = 175;
    this.cy = 175;
    this.radius = 160;
    this.trackRadius = 142;
    this.pocketRadius = 112;
    this.innerRadius = 75;
    this.centerConeRadius = 38;

    // Wheel state
    this.wheelAngle = 0;
    this.wheelSpeed = 0.5; // Constant clockwise rotation

    // Ball state
    this.ballState = 'IDLE'; // 'IDLE', 'SPINNING_TRACK', 'FALLING', 'BOUNCING', 'SETTLED'
    this.ballAngle = 0;
    this.ballRadius = this.trackRadius;
    this.ballSpeed = 0; // Angular velocity (rad/s, counter-clockwise is negative)
    this.ballRadialSpeed = 0;
    this.ballSize = 5.5;

    // Target pocket index (0 to 36)
    this.settledPocketIndex = -1;
    this.settledOffsetAngle = 0; // relative angle to wheel

    // Callbacks
    this.onBallFretHit = null; // (velocity) => void (play metallic click)
    this.onSettled = null;      // (result) => void

    this.numPockets = ROULETTE_NUMBERS.length; // 37
    this.pocketAngleStep = (Math.PI * 2) / this.numPockets;

    // Bounce physics parameters
    this.frictionTrack = 0.988;
    this.frictionSlope = 0.965;
    this.lastTickTime = 0;
  }

  resize(width, height) {
    if (!this.canvas) return;
    this.canvas.width = width;
    this.canvas.height = height;
    this.cx = width / 2;
    this.cy = height / 2;
    this.radius = Math.min(width, height) * 0.46;
    this.trackRadius = this.radius * 0.89;
    this.pocketRadius = this.radius * 0.70;
    this.innerRadius = this.radius * 0.46;
    this.centerConeRadius = this.radius * 0.24;
  }

  /**
   * Launch ball into wheel track
   * @param {number|null} predeterminedSlot - Optional predetermined winning number, or null for true physical randomness
   */
  spin(predeterminedSlot = null) {
    this.ballState = 'SPINNING_TRACK';
    this.ballAngle = Math.random() * Math.PI * 2;
    this.ballRadius = this.trackRadius;
    // Launch speed: High negative velocity (counter-clockwise against clockwise wheel)
    this.ballSpeed = -(14.0 + Math.random() * 4.0);
    this.ballRadialSpeed = 0;
    this.settledPocketIndex = -1;
    this.predeterminedSlot = predeterminedSlot;
    this.fretHitCount = 0;
  }

  update(dt) {
    // Wheel constantly rotates slowly in clockwise direction
    this.wheelAngle = (this.wheelAngle + this.wheelSpeed * dt) % (Math.PI * 2);

    if (this.ballState === 'IDLE') {
      return;
    }

    if (this.ballState === 'SETTLED') {
      // Ball stays locked in the settled pocket and moves with wheel
      this.ballAngle = (this.wheelAngle + this.settledOffsetAngle) % (Math.PI * 2);
      this.ballRadius = this.pocketRadius;
      return;
    }

    // 1. Ball on outer track
    if (this.ballState === 'SPINNING_TRACK') {
      this.ballAngle = (this.ballAngle + this.ballSpeed * dt) % (Math.PI * 2);
      this.ballSpeed *= Math.pow(this.frictionTrack, dt * 60);

      // Centrifugal drop threshold
      if (Math.abs(this.ballSpeed) < 4.8) {
        this.ballState = 'FALLING';
        this.ballRadialSpeed = -18; // Start sliding toward center
      }

      // Track rolling vibration
      if (Math.random() < 0.25 && this.onBallFretHit) {
        this.onBallFretHit(0.2);
      }
    }
    // 2. Ball falling down slope into pocket ring
    else if (this.ballState === 'FALLING') {
      this.ballAngle = (this.ballAngle + this.ballSpeed * dt) % (Math.PI * 2);
      this.ballRadius += this.ballRadialSpeed * dt;
      this.ballSpeed *= Math.pow(this.frictionSlope, dt * 60);
      this.ballRadialSpeed -= 40 * dt; // Gravity pull down slope

      if (this.ballRadius <= this.pocketRadius) {
        this.ballRadius = this.pocketRadius;
        this.ballState = 'BOUNCING';
        this.ballRadialSpeed = 12 + Math.random() * 8; // Bounce back up slope slightly
        if (this.onBallFretHit) this.onBallFretHit(0.8);
      }
    }
    // 3. Ball bouncing across frets and deflectors
    else if (this.ballState === 'BOUNCING') {
      this.ballAngle = (this.ballAngle + this.ballSpeed * dt) % (Math.PI * 2);
      this.ballRadius += this.ballRadialSpeed * dt;
      this.ballRadialSpeed -= 90 * dt;

      // Restitution clamp
      if (this.ballRadius < this.innerRadius + 4) {
        this.ballRadius = this.innerRadius + 4;
        this.ballRadialSpeed = Math.abs(this.ballRadialSpeed) * 0.4;
      } else if (this.ballRadius > this.pocketRadius + 12) {
        this.ballRadius = this.pocketRadius + 12;
        this.ballRadialSpeed = -Math.abs(this.ballRadialSpeed) * 0.5;
      }

      // Decelerate angular speed toward wheel speed
      const speedDiff = this.wheelSpeed - this.ballSpeed;
      this.ballSpeed += speedDiff * 2.2 * dt;

      // Check fret hits
      const relAngle = ((this.ballAngle - this.wheelAngle) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
      const fretIndex = Math.floor(relAngle / this.pocketAngleStep);

      this.fretHitCount = (this.fretHitCount || 0) + 1;
      if (this.onBallFretHit && Math.random() < 0.35) {
        this.onBallFretHit(Math.min(1.0, Math.abs(speedDiff) * 0.3));
      }

      // Settling condition: speed synchronized with wheel and radial velocity low
      if (Math.abs(speedDiff) < 0.65 && Math.abs(this.ballRadialSpeed) < 6) {
        this.ballState = 'SETTLED';
        this.settledPocketIndex = fretIndex % this.numPockets;
        this.settledOffsetAngle = (this.settledPocketIndex + 0.5) * this.pocketAngleStep;
        this.ballRadius = this.pocketRadius;

        const winningNumber = ROULETTE_NUMBERS[this.settledPocketIndex];
        const winningColor = getNumberColor(winningNumber);

        if (this.onBallFretHit) this.onBallFretHit(1.0); // Final snap click

        if (typeof this.onSettled === 'function') {
          this.onSettled({
            number: winningNumber,
            color: winningColor,
            pocketIndex: this.settledPocketIndex
          });
        }
      }
    }
  }

  draw() {
    if (!this.ctx || !this.canvas) return;
    const ctx = this.ctx;
    const cx = this.cx;
    const cy = this.cy;

    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    ctx.save();
    ctx.translate(cx, cy);

    // 1. Outer Mahogany Wooden Rim
    const rimGrad = ctx.createRadialGradient(0, 0, this.radius * 0.85, 0, 0, this.radius);
    rimGrad.addColorStop(0, '#3e1a0b');
    rimGrad.addColorStop(0.7, '#6b2d0e');
    rimGrad.addColorStop(1, '#2b1005');
    ctx.fillStyle = rimGrad;
    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
    ctx.fill();

    // 2. Brass Track Bezel
    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.arc(0, 0, this.trackRadius + 4, 0, Math.PI * 2);
    ctx.stroke();

    // 3. Ball Track Groove
    const trackGrad = ctx.createRadialGradient(0, 0, this.pocketRadius, 0, 0, this.trackRadius + 4);
    trackGrad.addColorStop(0, '#1c1917');
    trackGrad.addColorStop(0.8, '#292524');
    trackGrad.addColorStop(1, '#0c0a09');
    ctx.fillStyle = trackGrad;
    ctx.beginPath();
    ctx.arc(0, 0, this.trackRadius + 2, 0, Math.PI * 2);
    ctx.fill();

    // 4. Rotating Pocket Wheel
    ctx.save();
    ctx.rotate(this.wheelAngle);

    // Draw Pockets
    for (let i = 0; i < this.numPockets; i++) {
      const num = ROULETTE_NUMBERS[i];
      const color = getNumberColor(num);
      const startAngle = i * this.pocketAngleStep;
      const endAngle = (i + 1) * this.pocketAngleStep;
      const midAngle = startAngle + this.pocketAngleStep / 2;

      // Pocket Wedge Background
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, this.pocketRadius, startAngle, endAngle);
      ctx.closePath();

      if (color === 'green') {
        ctx.fillStyle = '#059669';
      } else if (color === 'red') {
        ctx.fillStyle = '#dc2626';
      } else {
        ctx.fillStyle = '#18181b';
      }
      ctx.fill();

      // Brass Divider Frets
      ctx.strokeStyle = '#eab308';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(Math.cos(startAngle) * this.innerRadius, Math.sin(startAngle) * this.innerRadius);
      ctx.lineTo(Math.cos(startAngle) * this.pocketRadius, Math.sin(startAngle) * this.pocketRadius);
      ctx.stroke();

      // Number Text
      ctx.save();
      ctx.rotate(midAngle);
      ctx.translate(this.pocketRadius * 0.84, 0);
      ctx.rotate(Math.PI / 2);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 9px "Pretendard", Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(num.toString(), 0, 0);
      ctx.restore();
    }

    // 5. Inner Golden Bezel & Deflectors
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(0, 0, this.innerRadius, 0, Math.PI * 2);
    ctx.stroke();

    // 8 Rhombus Deflector Pins (Diamond deflectors)
    for (let d = 0; d < 8; d++) {
      const defAngle = (d / 8) * Math.PI * 2;
      const dx = Math.cos(defAngle) * (this.pocketRadius + 14);
      const dy = Math.sin(defAngle) * (this.pocketRadius + 14);
      ctx.save();
      ctx.translate(dx, dy);
      ctx.rotate(defAngle);
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.moveTo(0, -4);
      ctx.lineTo(3, 0);
      ctx.lineTo(0, 4);
      ctx.lineTo(-3, 0);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    // 6. Central Turret & Polished Golden Cone
    const coneGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, this.centerConeRadius);
    coneGrad.addColorStop(0, '#fef08a');
    coneGrad.addColorStop(0.5, '#eab308');
    coneGrad.addColorStop(1, '#713f12');
    ctx.fillStyle = coneGrad;
    ctx.beginPath();
    ctx.arc(0, 0, this.centerConeRadius, 0, Math.PI * 2);
    ctx.fill();

    // Brass Turret Cross Handles
    ctx.strokeStyle = '#fef08a';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-this.centerConeRadius * 0.7, 0);
    ctx.lineTo(this.centerConeRadius * 0.7, 0);
    ctx.moveTo(0, -this.centerConeRadius * 0.7);
    ctx.lineTo(0, this.centerConeRadius * 0.7);
    ctx.stroke();

    // Central Pin
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, 0, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore(); // Restore wheel rotation

    // 7. Metallic Ball Simulation Draw
    if (this.ballState !== 'IDLE') {
      const bx = Math.cos(this.ballAngle) * this.ballRadius;
      const by = Math.sin(this.ballAngle) * this.ballRadius;

      // Ball Shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
      ctx.beginPath();
      ctx.arc(bx + 2, by + 2, this.ballSize, 0, Math.PI * 2);
      ctx.fill();

      // Shiny Chrome Metallic Ball Gradient
      const ballGrad = ctx.createRadialGradient(
        bx - this.ballSize * 0.35, 
        by - this.ballSize * 0.35, 
        1, 
        bx, 
        by, 
        this.ballSize
      );
      ballGrad.addColorStop(0, '#ffffff');
      ballGrad.addColorStop(0.3, '#f1f5f9');
      ballGrad.addColorStop(0.7, '#94a3b8');
      ballGrad.addColorStop(1, '#334155');

      ctx.fillStyle = ballGrad;
      ctx.beginPath();
      ctx.arc(bx, by, this.ballSize, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}
