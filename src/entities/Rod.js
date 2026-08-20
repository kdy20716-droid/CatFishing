/**
 * Fishing Rod, Multi-Hook Rig Physics, Rocket Booster, Depth Bomb, and Tension Mechanics
 */
import { Vector2 } from '../engine/Vector.js';

export class Rod {
  constructor(economy, soundEngine) {
    this.economy = economy;
    this.sound = soundEngine;

    // States: 'READY', 'CHARGING', 'FLYING', 'FISHING', 'REELING_IN'
    this.state = 'READY';

    // Positions & Velocities
    this.hookPos = new Vector2(0, 0);
    this.hookVel = new Vector2(0, 0);
    this.bobberPos = new Vector2(0, 0);

    // Casting
    this.castCharge = 0; // 0.0 ~ 1.0
    this.chargeSpeed = 1.1;

    // Multi-Hook Tackle Rig (1, 2, or 3 hooks)
    this.hookCount = 1;
    this.hooks = [];
    this.initHooks();

    // Hook properties
    this.isSubmerged = false;
    this.currentBaitId = 'bread';
    this.hookedFish = null; // Primary or first hooked fish
    this.isLiveBait = false;
    this.liveBaitFish = null;

    // Rocket booster & Explosion particle effects
    this.isRocketPowered = false;
    this.rocketParticles = [];
    this.explosionEffects = [];
    this.waterParticles = [];

    // Tension
    this.tension = 0; // 0 ~ 100
    this.tensionSnapTimer = 0;
    this.isSnapped = false;

    // Line segments for physics rendering
    this.linePoints = [];
    this.waterY = 0;

    // Attraction radius bonus from perks
    this.attractionBonus = 1.0;

    // Movement & jiggle states for bait-twitching mechanics
    this.isReeling = false;
    this.isJiggling = false;
    this.jiggleTimer = 0;
  }

  initHooks() {
    this.hookCount = this.economy ? (this.economy.hookCount || 1) : 1;
    this.hooks = [];
    for (let i = 0; i < this.hookCount; i++) {
      this.hooks.push({
        index: i,
        offsetY: i * 36,
        offsetX: (i % 2 === 1 ? -12 : 12) * (i > 0 ? 1 : 0),
        pos: new Vector2(0, 0),
        hookedFish: null
      });
    }
  }

  get pos() {
    return this.hookPos;
  }

  get allHookedFishes() {
    const list = [];
    this.hooks.forEach(h => {
      if (h.hookedFish && !list.includes(h.hookedFish)) {
        list.push(h.hookedFish);
      }
    });
    return list;
  }

  startCharging() {
    if (this.state === 'READY') {
      this.state = 'CHARGING';
      this.castCharge = 0;
    }
  }

  cast(cat) {
    if (this.state !== 'CHARGING') return;

    this.state = 'FLYING';
    const rodTip = cat.getRodTipPos();
    this.hookPos.copy(rodTip);
    this.bobberPos.copy(rodTip);

    this.initHooks();

    const rod = this.economy.getCurrentRod();
    const facing = cat.facing;
    let power = Math.max(0.25, this.castCharge) * rod.castPower;

    // Check Rocket Booster
    if (this.economy.useRocket && this.economy.spendRocket()) {
      this.isRocketPowered = true;
      power *= 2.35; // Massive distance booster!
      this.sound.playRocket();
    } else {
      this.isRocketPowered = false;
    }

    // Calculate throw trajectory vector
    this.hookVel.set(facing * power * 0.9, -power * 0.75);

    this.isSubmerged = false;
    this.hookedFish = null;
    this.isLiveBait = false;
    this.liveBaitFish = null;
    this.tension = 0;
    this.tensionSnapTimer = 0;
    this.isSnapped = false;

    // Consume 1 unit of selected bait from inventory (falls back to bread if depleted)
    this.currentBaitId = this.economy.consumeBait();

    // Sound
    if (!this.isRocketPowered) {
      this.sound.playCast();
    }
  }

  attachFish(fish, targetSlot = null) {
    let slot = targetSlot;
    if (!slot) {
      slot = this.hooks.find(h => !h.hookedFish);
    }
    if (!slot) return; // No empty hook

    slot.hookedFish = fish;
    this.hookedFish = fish;
    this.sound.playBite();

    // Check if fish is small and can become live bait on slot 0
    if (slot.index === 0 && fish.data.baitSize === 'small' && !this.isLiveBait) {
      this.isLiveBait = true;
      this.liveBaitFish = fish;
    }
  }

  triggerBomb(oceanFishList, onFishEliminated) {
    if (this.state !== 'FISHING' || !this.isSubmerged) return false;
    if (!this.economy.spendBomb()) return false;

    this.sound.playBombExplosion();

    // Spawn shockwave ring & water explosion particles
    const blastX = this.hookPos.x;
    const blastY = this.hookPos.y;
    const blastRadius = 180;

    this.explosionEffects.push({
      x: blastX,
      y: blastY,
      radius: 5,
      maxRadius: blastRadius,
      alpha: 1.0,
      timer: 0.55
    });

    for (let i = 0; i < 35; i++) {
      const ang = Math.random() * Math.PI * 2;
      const spd = 60 + Math.random() * 180;
      this.waterParticles.push({
        x: blastX,
        y: blastY,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd,
        size: 4 + Math.random() * 8,
        alpha: 1.0,
        color: Math.random() > 0.4 ? '#ffbe0b' : '#caf0f8'
      });
    }

    // Eliminate all unwanted fish inside blast radius
    const eliminated = [];
    oceanFishList.forEach(fish => {
      if (fish.pos.dist(this.hookPos) <= blastRadius) {
        eliminated.push(fish);
      }
    });

    eliminated.forEach(fish => {
      // Detach from hook if attached
      this.hooks.forEach(h => {
        if (h.hookedFish === fish) h.hookedFish = null;
      });
      if (this.hookedFish === fish) this.hookedFish = null;
      if (onFishEliminated) onFishEliminated(fish);
    });

    return true;
  }

  reset(cat) {
    this.state = 'READY';
    this.castCharge = 0;
    const rodTip = cat.getRodTipPos();
    this.hookPos.copy(rodTip);
    this.bobberPos.copy(rodTip);
    this.hookVel.set(0, 0);
    this.isSubmerged = false;
    this.hookedFish = null;
    this.isLiveBait = false;
    this.liveBaitFish = null;
    this.isRocketPowered = false;
    this.hooks.forEach(h => h.hookedFish = null);
    this.tension = 0;
    this.tensionSnapTimer = 0;
    this.isSnapped = false;
  }

  update(dt, cat, isReelingInput, waterSurfaceY, onCatchCallback) {
    this.waterY = waterSurfaceY;
    this.attractionBonus = this.economy.getAttractionRadiusBonus();
    this.isReeling = isReelingInput;

    if (isReelingInput) {
      this.jiggleTimer = 0.4;
      this.isJiggling = true;
    } else if (this.jiggleTimer > 0) {
      this.jiggleTimer -= dt;
      this.isJiggling = true;
    } else {
      this.isJiggling = false;
    }

    const rodTip = cat.getRodTipPos();

    // Update Explosion Effects & Particles
    for (let i = this.explosionEffects.length - 1; i >= 0; i--) {
      const exp = this.explosionEffects[i];
      exp.timer -= dt;
      exp.radius += (exp.maxRadius - exp.radius) * 12 * dt;
      exp.alpha = Math.max(0, exp.timer / 0.55);
      if (exp.timer <= 0) this.explosionEffects.splice(i, 1);
    }

    for (let i = this.waterParticles.length - 1; i >= 0; i--) {
      const p = this.waterParticles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.94;
      p.vy *= 0.94;
      p.alpha -= dt * 1.6;
      if (p.alpha <= 0) this.waterParticles.splice(i, 1);
    }

    for (let i = this.rocketParticles.length - 1; i >= 0; i--) {
      const p = this.rocketParticles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.alpha -= dt * 2.2;
      p.size = Math.max(1, p.size - dt * 6);
      if (p.alpha <= 0) this.rocketParticles.splice(i, 1);
    }

    if (this.state === 'READY') {
      this.hookPos.copy(rodTip);
      this.bobberPos.copy(rodTip);
      this.updateHookSlots();
      return;
    }

    if (this.state === 'CHARGING') {
      this.castCharge = Math.min(1.0, this.castCharge + this.chargeSpeed * dt);
      this.hookPos.copy(rodTip);
      this.bobberPos.copy(rodTip);
      this.updateHookSlots();
      return;
    }

    if (this.state === 'FLYING') {
      // Drag hook with boat movement if any
      const boatDx = cat.deltaX || 0;
      this.hookPos.x += boatDx;
      this.bobberPos.x += boatDx;

      // Rocket Booster particle emitter
      if (this.isRocketPowered) {
        for (let i = 0; i < 3; i++) {
          this.rocketParticles.push({
            x: this.hookPos.x - Math.sign(this.hookVel.x) * 10,
            y: this.hookPos.y + 4,
            vx: -this.hookVel.x * 0.3 + (Math.random() - 0.5) * 40,
            vy: -this.hookVel.y * 0.3 + (Math.random() - 0.5) * 40,
            size: 6 + Math.random() * 4,
            alpha: 1.0,
            color: Math.random() > 0.5 ? '#ffd166' : '#ff0054'
          });
        }
      }

      // In-air parabolic flight
      const gravity = 700;
      this.hookVel.y += gravity * dt;
      this.hookPos.add(Vector2.mult(this.hookVel, dt));
      this.bobberPos.copy(this.hookPos);

      // Check for water surface hit
      if (this.hookPos.y >= this.waterY) {
        this.state = 'FISHING';
        this.isSubmerged = true;
        this.isRocketPowered = false;
        this.hookVel.y = 30; // Reduce vertical speed on water entry
        this.sound.playSplash(0.85);
      }
      this.updateHookSlots();
      return;
    }

    if (this.state === 'FISHING') {
      const rod = this.economy.getCurrentRod();
      const maxDepthLimit = rod.maxLineLength;
      const sinkSpeedMultiplier = this.economy.getEffectiveSinkSpeed();

      // Drag submerged hook & line with boat horizontal movement
      const boatDx = cat.deltaX || 0;
      if (boatDx !== 0) {
        this.hookPos.x += boatDx * 0.95;
        this.bobberPos.x += boatDx * 0.95;
        this.linePoints.forEach(p => p.x += boatDx * 0.95);
        this.hooks.forEach(h => {
          if (h.hookedFish) h.hookedFish.pos.x += boatDx * 0.95;
        });
      }

      const hookedList = this.allHookedFishes;

      // Underwater Sinking & Reeling Physics
      if (hookedList.length > 0) {
        // Combined struggle force of all hooked fish
        let totalFishPull = 0;
        let avgFacing = 0;
        let maxRage = 0;

        hookedList.forEach(fish => {
          let pull = fish.data.strength;
          if (fish.hasStruggleGauge) {
            const rageRatio = (fish.rage || 0) / 100;
            pull *= (1.0 + rageRatio * 1.3);
            maxRage = Math.max(maxRage, fish.rage || 0);
          }
          totalFishPull += pull;
          avgFacing += fish.facing;
        });
        avgFacing = Math.sign(avgFacing) || 1;

        if (isReelingInput) {
          // Reeling battle!
          const reelPower = this.economy.getEffectiveReelSpeed();
          const toCat = Vector2.sub(rodTip, this.hookPos).normalize();
          
          this.hookVel.set(
            toCat.x * reelPower * 0.8 + avgFacing * totalFishPull * 0.35,
            toCat.y * reelPower * 0.8 + totalFishPull * 0.55
          );

          // Build tension with fish rage multiplier
          const effectiveMaxTension = this.economy.getEffectiveTensionMax();
          let tensionRate = (totalFishPull / effectiveMaxTension) * 52;

          if (maxRage > 0) {
            const rageMultiplier = 1.0 + (maxRage / 100) * 2.2;
            tensionRate *= rageMultiplier;
          }

          this.tension = Math.min(100, this.tension + tensionRate * dt);
          this.sound.playReelClick();

          // Check if reeled all the way in to boat
          const distToCat = this.hookPos.dist(rodTip);
          if (distToCat < 48) {
            // All caught fish landed!
            const caughtFishes = [...hookedList];
            this.reset(cat);
            if (onCatchCallback) {
              caughtFishes.forEach(f => onCatchCallback(f));
            }
            return;
          }
        } else {
          // Releasing reel relaxes tension faster
          this.tension = Math.max(0, this.tension - 50 * dt);
          this.hookVel.set(avgFacing * totalFishPull * 0.7, totalFishPull * 0.5);
        }

        // Tension Overload & Snap check
        if (this.tension >= 95) {
          this.tensionSnapTimer += dt;
          if (this.tensionSnapTimer >= 1.5) {
            // Line Snapped!
            this.isSnapped = true;
            hookedList.forEach(fish => {
              fish.state = 'FLEE';
            });
            this.reset(cat);
            return;
          }
        } else {
          this.tensionSnapTimer = Math.max(0, this.tensionSnapTimer - dt * 2);
        }

      } else {
        // Empty Hook sinking
        const sinkRate = 45 * sinkSpeedMultiplier;
        
        if (isReelingInput) {
          // Reeling hook back up
          const reelPower = this.economy.getEffectiveReelSpeed();
          const toCat = Vector2.sub(rodTip, this.hookPos).normalize();
          this.hookVel.set(toCat.x * reelPower, toCat.y * reelPower);
          this.sound.playReelClick();

          // Return to boat
          if (this.hookPos.dist(rodTip) < 35) {
            this.reset(cat);
            return;
          }
        } else {
          // Sinking downwards
          this.hookVel.set(0, sinkRate);
          if (this.hookPos.y - this.waterY >= maxDepthLimit) {
            this.hookVel.y = 0; // Hit maximum line depth
          }
        }
      }

      this.hookPos.add(Vector2.mult(this.hookVel, dt));

      // Bobber stays floating on water surface directly above hook
      this.bobberPos.x += (this.hookPos.x - this.bobberPos.x) * 0.1;
      this.bobberPos.y = this.waterY + Math.sin(cat.animTime * 3) * 2;

      this.updateHookSlots();
    }
  }

  updateHookSlots() {
    this.hooks.forEach(h => {
      h.pos.x = this.hookPos.x + h.offsetX;
      h.pos.y = this.hookPos.y + h.offsetY;
      if (h.hookedFish) {
        h.hookedFish.pos.copy(h.pos);
      }
    });
  }

  draw(ctx, cat) {
    if (this.state === 'READY') return;

    const rodTip = cat.getRodTipPos();

    // 1. Draw Explosions & Underwater Particles
    if (this.explosionEffects.length > 0) {
      this.explosionEffects.forEach(exp => {
        ctx.save();
        ctx.strokeStyle = `rgba(255, 209, 102, ${exp.alpha})`;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(exp.x, exp.y, exp.radius, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = `rgba(255, 77, 109, ${exp.alpha * 0.3})`;
        ctx.beginPath();
        ctx.arc(exp.x, exp.y, exp.radius * 0.7, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });
    }

    if (this.waterParticles.length > 0) {
      ctx.save();
      this.waterParticles.forEach(p => {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.restore();
    }

    if (this.rocketParticles.length > 0) {
      ctx.save();
      this.rocketParticles.forEach(p => {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.restore();
    }

    // 2. Draw Fishing Line
    ctx.save();
    ctx.strokeStyle = this.tension > 80 ? '#ff0054' : 'rgba(240, 240, 255, 0.75)';
    ctx.lineWidth = this.tension > 80 ? 2 : 1.2;

    ctx.beginPath();
    ctx.moveTo(rodTip.x, rodTip.y);

    if (this.state === 'FLYING') {
      ctx.lineTo(this.hookPos.x, this.hookPos.y);
    } else {
      const midSurfaceX = (rodTip.x + this.bobberPos.x) / 2;
      const sagY = Math.max(rodTip.y, this.bobberPos.y) + (100 - this.tension) * 0.15;
      
      ctx.quadraticCurveTo(midSurfaceX, sagY, this.bobberPos.x, this.bobberPos.y);
      ctx.lineTo(this.hookPos.x, this.hookPos.y);
    }
    ctx.stroke();
    ctx.restore();

    // 3. Draw Bobber (Float)
    if (this.state === 'FISHING') {
      ctx.save();
      ctx.translate(this.bobberPos.x, this.bobberPos.y);

      ctx.fillStyle = '#e63946';
      ctx.beginPath();
      ctx.arc(0, -3, 6, Math.PI, 0, false);
      ctx.fill();

      ctx.fillStyle = '#f8f9fa';
      ctx.beginPath();
      ctx.arc(0, -3, 6, 0, Math.PI, false);
      ctx.fill();

      ctx.strokeStyle = '#212529';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, -9);
      ctx.lineTo(0, -3);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(0, 0, 10, 3, 0, 0, Math.PI * 2);
      ctx.stroke();

      ctx.restore();
    }

    // 4. Draw Multi-Hook Rig & Baits
    this.hooks.forEach((hookSlot, idx) => {
      ctx.save();
      ctx.translate(hookSlot.pos.x, hookSlot.pos.y);

      // Branch line connecting to main hook position if multi-hook
      if (idx > 0) {
        ctx.strokeStyle = 'rgba(200, 220, 255, 0.6)';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-hookSlot.offsetX, -hookSlot.offsetY);
        ctx.stroke();
      }

      // Hook Metal
      ctx.strokeStyle = '#adb5bd';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, -6);
      ctx.lineTo(0, 2);
      ctx.arc(-3, 2, 3, 0, Math.PI, false);
      ctx.lineTo(-6, -1);
      ctx.stroke();

      // Bait graphics if slot is free
      if (!hookSlot.hookedFish) {
        this.drawBaitAtHook(ctx);
      }

      ctx.restore();
    });

    // 5. Draw Rocket Graphic if flying with booster
    if (this.state === 'FLYING' && this.isRocketPowered) {
      ctx.save();
      ctx.translate(this.hookPos.x, this.hookPos.y);
      const angle = Math.atan2(this.hookVel.y, this.hookVel.x);
      ctx.rotate(angle);

      // Mini rocket fuselage
      ctx.fillStyle = '#ff4d6d';
      ctx.fillRect(-14, -4, 18, 8);
      ctx.fillStyle = '#ffd166';
      ctx.beginPath();
      ctx.moveTo(4, -4);
      ctx.lineTo(10, 0);
      ctx.lineTo(4, 4);
      ctx.closePath();
      ctx.fill();

      ctx.restore();
    }
  }

  drawBaitAtHook(ctx) {
    if (this.currentBaitId === 'bread') {
      ctx.fillStyle = '#faedcd';
      ctx.beginPath();
      ctx.arc(0, 4, 3.5, 0, Math.PI * 2);
      ctx.fill();
    } else if (this.currentBaitId === 'worm') {
      ctx.strokeStyle = '#d62828';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(-4, 2);
      ctx.quadraticCurveTo(0, 8, 4, 3);
      ctx.stroke();
    } else if (this.currentBaitId === 'shrimp') {
      ctx.fillStyle = '#ff758f';
      ctx.beginPath();
      ctx.ellipse(0, 4, 5, 3, Math.PI / 4, 0, Math.PI * 2);
      ctx.fill();
    } else if (this.currentBaitId === 'lure') {
      const lureGlow = ctx.createRadialGradient(0, 4, 1, 0, 4, 14);
      lureGlow.addColorStop(0, 'rgba(0, 245, 212, 1.0)');
      lureGlow.addColorStop(1, 'rgba(0, 245, 212, 0)');
      ctx.fillStyle = lureGlow;
      ctx.beginPath();
      ctx.arc(0, 4, 14, 0, Math.PI * 2);
      ctx.fill();
    } else if (this.currentBaitId === 'golden') {
      const goldGlow = ctx.createRadialGradient(0, 4, 1, 0, 4, 16);
      goldGlow.addColorStop(0, 'rgba(255, 209, 102, 1.0)');
      goldGlow.addColorStop(1, 'rgba(255, 209, 102, 0)');
      ctx.fillStyle = goldGlow;
      ctx.beginPath();
      ctx.arc(0, 4, 16, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}
