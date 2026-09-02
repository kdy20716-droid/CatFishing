/**
 * 🏴‍☠️ Gambler Pirate Fishing Boat & Cat NPC Entity
 * Appears periodically in the near ocean (100m ~ 500m from dock pier)
 */
import { Vector2 } from '../engine/Vector.js?v=5.0.0';

export class GamblerBoat {
  constructor() {
    this.pos = new Vector2(3200, 0); // Default spawn location (~150m from dock)
    this.isActive = false;
    this.remainingTime = 0;
    this.maxDuration = 360; // 6 minutes stay
    this.animTime = 0;
    this.facing = -1; // Facing left towards dock
    this.lanternParticles = [];

    // Interaction radius
    this.interactRadius = 140;
    this.isPlayerNear = false;
  }

  spawn(x = null, durationSeconds = 360) {
    // Spawn between 100m (2,000px) and 450m (9,000px) from dock
    const spawnX = (typeof x === 'number' && !isNaN(x)) 
      ? x 
      : 2200 + Math.floor(Math.random() * 6400);

    this.pos.x = spawnX;
    this.isActive = true;
    this.remainingTime = durationSeconds;
    this.maxDuration = durationSeconds;
    this.animTime = 0;
  }

  despawn() {
    this.isActive = false;
    this.remainingTime = 0;
  }

  update(dt, waterSurfaceY, playerCatPos) {
    if (!this.isActive) return;

    this.animTime += dt;
    this.remainingTime -= dt;

    if (this.remainingTime <= 0) {
      this.despawn();
      return;
    }

    // Gentle wave floating bobbing
    const waveFreq = 1.4;
    const bobOffset = Math.sin(this.animTime * waveFreq + this.pos.x * 0.01) * 5;
    this.pos.y = waterSurfaceY + bobOffset;

    // Check player proximity
    if (playerCatPos) {
      const dist = Math.abs(playerCatPos.x - this.pos.x);
      this.isPlayerNear = (dist <= this.interactRadius);
    } else {
      this.isPlayerNear = false;
    }

    // 🏮 Lantern and Stardust Particle Emissions
    if (Math.random() < 0.25) {
      this.lanternParticles.push({
        x: this.pos.x + (Math.random() - 0.5) * 70,
        y: this.pos.y - 45 - Math.random() * 30,
        vx: (Math.random() - 0.5) * 15,
        vy: -15 - Math.random() * 20,
        size: 3 + Math.random() * 5,
        alpha: 1.0,
        symbol: Math.random() > 0.4 ? '🪙' : '✨'
      });
    }

    for (let i = this.lanternParticles.length - 1; i >= 0; i--) {
      const p = this.lanternParticles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.alpha -= dt * 1.2;
      if (p.alpha <= 0) {
        this.lanternParticles.splice(i, 1);
      }
    }
  }

  draw(ctx) {
    if (!this.isActive) return;

    ctx.save();
    ctx.translate(this.pos.x, this.pos.y);

    // 1. Water Red & Gold Underglow
    const glowGrad = ctx.createRadialGradient(0, 10, 10, 0, 10, 90);
    glowGrad.addColorStop(0, 'rgba(239, 68, 68, 0.45)');
    glowGrad.addColorStop(0.5, 'rgba(245, 158, 11, 0.25)');
    glowGrad.addColorStop(1, 'rgba(239, 68, 68, 0)');
    ctx.fillStyle = glowGrad;
    ctx.beginPath();
    ctx.ellipse(0, 12, 85, 24, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. Pirate Wooden Hull (Dark Crimson & Mahogany)
    ctx.fillStyle = '#450a0a';
    ctx.beginPath();
    ctx.moveTo(-55, -2);
    ctx.lineTo(55, -2);
    ctx.lineTo(44, 20);
    ctx.quadraticCurveTo(0, 26, -44, 20);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#7f1d1d';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Hull Gold Trim & Planks
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-50, 4);
    ctx.lineTo(50, 4);
    ctx.moveTo(-44, 12);
    ctx.lineTo(44, 12);
    ctx.stroke();

    // Skull & Dice Emblem on Hull
    ctx.font = '13px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🎲', 0, 12);

    // 3. Main Mast & Pirate Sail
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(10, 0);
    ctx.lineTo(10, -65);
    ctx.stroke();

    // Cross beam
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(-20, -56);
    ctx.lineTo(38, -56);
    ctx.stroke();

    // Tattered Black & Crimson Pirate Sail
    ctx.fillStyle = '#18181b';
    ctx.beginPath();
    ctx.moveTo(-18, -54);
    ctx.quadraticCurveTo(8, -48, 36, -54);
    ctx.lineTo(30, -22);
    ctx.quadraticCurveTo(8, -16, -12, -22);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#dc2626';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Sail Emblem
    ctx.fillStyle = '#fef08a';
    ctx.font = 'bold 12px "Pretendard", Arial';
    ctx.fillText('🎰', 10, -36);

    // Top Pirate Flag (Waving in wind)
    const waveSin = Math.sin(this.animTime * 5) * 3;
    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.moveTo(10, -65);
    ctx.lineTo(-12, -62 + waveSin);
    ctx.lineTo(10, -59);
    ctx.closePath();
    ctx.fill();

    // 4. Glowing Red & Amber Hanging Paper Lanterns
    const drawLantern = (lx, ly) => {
      // String
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(lx, ly - 8);
      ctx.lineTo(lx, ly);
      ctx.stroke();

      // Glow
      const lGrad = ctx.createRadialGradient(lx, ly + 5, 2, lx, ly + 5, 22);
      lGrad.addColorStop(0, 'rgba(239, 68, 68, 0.9)');
      lGrad.addColorStop(0.6, 'rgba(245, 158, 11, 0.4)');
      lGrad.addColorStop(1, 'rgba(239, 68, 68, 0)');
      ctx.fillStyle = lGrad;
      ctx.beginPath();
      ctx.arc(lx, ly + 5, 22, 0, Math.PI * 2);
      ctx.fill();

      // Lantern Body
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.roundRect(lx - 5, ly, 10, 12, 3);
      ctx.fill();
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(lx - 4, ly + 4, 8, 4);
    };

    drawLantern(-46, -14);
    drawLantern(46, -14);

    // 5. 🐱 Gambler Pirate Cat NPC (Standing at bow)
    const catX = -24;
    const catY = -2;

    // Cat Body (Charcoal Black Coat with Gold Buttons)
    ctx.fillStyle = '#27272a';
    ctx.beginPath();
    ctx.ellipse(catX, catY - 14, 9, 14, 0, 0, Math.PI * 2);
    ctx.fill();

    // Pirate Cape / Coat
    ctx.fillStyle = '#991b1b';
    ctx.beginPath();
    ctx.moveTo(catX - 8, catY - 22);
    ctx.lineTo(catX + 8, catY - 22);
    ctx.lineTo(catX + 11, catY - 2);
    ctx.lineTo(catX - 11, catY - 2);
    ctx.closePath();
    ctx.fill();

    // Cat Head
    ctx.fillStyle = '#3f3f46';
    ctx.beginPath();
    ctx.arc(catX, catY - 28, 11, 0, Math.PI * 2);
    ctx.fill();

    // Cat Ears
    ctx.beginPath();
    ctx.moveTo(catX - 9, catY - 34);
    ctx.lineTo(catX - 3, catY - 42);
    ctx.lineTo(catX + 1, catY - 36);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(catX + 3, catY - 36);
    ctx.lineTo(catX + 7, catY - 42);
    ctx.lineTo(catX + 11, catY - 34);
    ctx.fill();

    // Eye Patch (Left) & Gleaming Gold Eye (Right)
    ctx.fillStyle = '#09090b';
    ctx.beginPath();
    ctx.arc(catX - 4, catY - 28, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#18181b';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(catX - 11, catY - 31);
    ctx.lineTo(catX + 4, catY - 25);
    ctx.stroke();

    // Golden Sparkling Eye
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.arc(catX + 4, catY - 28, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(catX + 4, catY - 28, 1.2, 0, Math.PI * 2);
    ctx.fill();

    // Snout & Whiskers
    ctx.fillStyle = '#f43f5e';
    ctx.beginPath();
    ctx.arc(catX, catY - 24, 1.8, 0, Math.PI * 2);
    ctx.fill();

    // Pirate Captain Tricorn Hat
    ctx.fillStyle = '#18181b';
    ctx.beginPath();
    ctx.moveTo(catX - 16, catY - 36);
    ctx.lineTo(catX + 16, catY - 36);
    ctx.lineTo(catX + 12, catY - 46);
    ctx.quadraticCurveTo(catX, catY - 50, catX - 12, catY - 46);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Golden Feather on Hat
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(catX + 8, catY - 44);
    ctx.quadraticCurveTo(catX + 18, catY - 56, catX + 14, catY - 60);
    ctx.stroke();

    // 6. Draw Particles
    this.lanternParticles.forEach(p => {
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.font = `${p.size * 2}px Arial`;
      ctx.fillText(p.symbol, p.x - this.pos.x, p.y - this.pos.y);
      ctx.restore();
    });

    // 7. Interactive UI Badge when Player is Near
    if (this.isPlayerNear) {
      const badgeY = -90 + Math.sin(this.animTime * 6) * 4;

      ctx.font = 'bold 12px "Pretendard", "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      const label = '🎲 [G] 도박판 벌이기';
      const tw = ctx.measureText(label).width;

      // Glowing Badge Background
      ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
      ctx.beginPath();
      ctx.roundRect(- (tw + 26) / 2, badgeY - 14, tw + 26, 26, 13);
      ctx.fill();
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Pulsing Indicator Dot
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(- (tw / 2) - 4, badgeY - 1, 4, 0, Math.PI * 2);
      ctx.fill();

      // Text
      ctx.fillStyle = '#fef08a';
      ctx.fillText(label, 4, badgeY + 3);
    }

    ctx.restore();
  }
}
