/**
 * Authentic Stardew Valley-Style Fishing Mini-game Controller
 * - Vertical water tube with physics-based controllable Green Catch Bar
 * - AI-controlled Fish that darts, sinks, or hovers based on Fish Rarity & Boss stats
 * - Green Bar height and stability scale with Fishing Rod Tiers & Upgrades
 * - Progress Meter fills when Fish is inside the Green Bar, drains when outside
 */

export class StardewFishingMinigame {
  constructor() {
    this.isActive = false;
    this.tankHeight = 240; // px
    
    // Player Bar
    this.barY = 20; // 0 to (tankHeight - barHeight)
    this.barVel = 0;
    this.barHeight = 48; // scales with rod tier
    
    // Fish State
    this.fishY = 80;
    this.fishTargetY = 100;
    this.fishTimer = 0;
    this.fishSpeed = 80;
    this.fishData = null;
    this.fishRarity = 'common';
    this.isBoss = false;
    this.isShiny = false;

    // Mini-game Progress
    this.progress = 0.35; // 0.0 ~ 1.0 (starts at 35%)
    this.isFishInside = false;
    this.isPerfect = true; // Lost if fish ever escapes the bar
    this.soundTimer = 0;

    // DOM Elements Cache
    this.containerEl = null;
    this.catchBarEl = null;
    this.targetFishEl = null;
    this.fishIconEl = null;
    this.fishSparkEl = null;
    this.meterFillEl = null;
    this.meterPctEl = null;
    this.perfectToastEl = null;
  }

  initDom() {
    this.containerEl = document.getElementById('stardew-minigame-container');
    this.catchBarEl = document.getElementById('stardew-catch-bar');
    this.targetFishEl = document.getElementById('stardew-target-fish');
    this.fishIconEl = document.getElementById('stardew-fish-icon');
    this.fishSparkEl = document.getElementById('stardew-fish-spark');
    this.meterFillEl = document.getElementById('stardew-meter-fill');
    this.meterPctEl = document.getElementById('stardew-meter-pct');
    this.perfectToastEl = document.getElementById('stardew-perfect-toast');
  }

  start(fishInstance, economy) {
    if (!this.containerEl) this.initDom();
    if (!this.containerEl) return false;

    this.fishData = fishInstance;
    this.isBoss = !!fishInstance.isBoss;
    this.isShiny = !!fishInstance.isShiny;
    this.fishRarity = fishInstance.data?.rarity || 'common';

    // 🎣 1. Calculate Player Green Bar Height based on Rod Tier and Upgrades
    let rodTier = 1;
    if (economy && typeof economy.getCurrentRod === 'function') {
      const currentRod = economy.getCurrentRod();
      rodTier = currentRod?.tier || 1;
    }

    const reelMotorLevel = economy?.upgradeLevels?.reel_motor || 0;
    const hatPerkBonus = economy?.currentHatId === 'hat_sailor' ? 12 : 0;

    // Base formula: Tier 1 (38px) -> Tier 10 (125px)
    this.barHeight = Math.min(130, Math.max(36, 36 + (rodTier - 1) * 9 + reelMotorLevel * 2 + hatPerkBonus));

    // 🐟 2. Calculate Fish Difficulty & Swim Behavior
    // Difficulty ranking: Common=1, Uncommon=2, Rare=3, Epic=4, Legendary=5, Mythic/Boss=6+
    const raritySpeeds = {
      common: { speed: 65, minWait: 1.0, maxWait: 1.8 },
      uncommon: { speed: 90, minWait: 0.7, maxWait: 1.4 },
      rare: { speed: 120, minWait: 0.5, maxWait: 1.1 },
      epic: { speed: 160, minWait: 0.35, maxWait: 0.8 },
      legendary: { speed: 200, minWait: 0.25, maxWait: 0.6 },
      mythic: { speed: 240, minWait: 0.18, maxWait: 0.45 }
    };

    const behavior = raritySpeeds[this.fishRarity] || raritySpeeds.common;
    this.baseSpeed = behavior.speed * (this.isBoss ? 1.25 : (this.isShiny ? 1.15 : 1.0));
    this.minWait = behavior.minWait * (this.isBoss ? 0.7 : 1.0);
    this.maxWait = behavior.maxWait * (this.isBoss ? 0.7 : 1.0);

    // Initial Positions
    this.barY = 20;
    this.barVel = 0;
    this.fishY = 70;
    this.fishTargetY = 90;
    this.fishTimer = 0.5;
    this.progress = 0.35; // Start at 35%
    this.isFishInside = false;
    this.isPerfect = true;
    this.soundTimer = 0;
    this.isActive = true;

    // Update Visuals
    if (this.fishIconEl) {
      if (this.isBoss) this.fishIconEl.innerText = '👑';
      else if (this.isShiny) this.fishIconEl.innerText = '✨';
      else this.fishIconEl.innerText = '🐟';
    }

    if (this.fishSparkEl) {
      this.fishSparkEl.style.display = (this.isShiny || this.isBoss) ? 'block' : 'none';
    }

    if (this.catchBarEl) {
      this.catchBarEl.style.height = `${this.barHeight}px`;
      this.catchBarEl.style.bottom = `${this.barY}px`;
      this.catchBarEl.classList.remove('in-zone');
    }

    if (this.meterFillEl) {
      this.meterFillEl.style.height = `${Math.round(this.progress * 100)}%`;
      this.meterFillEl.classList.remove('draining');
    }

    if (this.perfectToastEl) {
      this.perfectToastEl.classList.remove('show');
    }

    // Show Container
    this.containerEl.classList.add('visible');
    this.containerEl.style.display = 'flex';
    this.containerEl.style.opacity = '1';
    this.containerEl.style.pointerEvents = 'auto';
    return true;
  }

  update(dt, isInputActive, soundEngine) {
    if (!this.isActive) return null;
    if (!this.containerEl) this.initDom();
    if (this.containerEl && this.containerEl.style.display !== 'flex') {
      this.containerEl.style.display = 'flex';
      this.containerEl.classList.add('visible');
    }

    // 1. 🎛️ Green Catch Bar Physics (Player controls)
    const liftAccel = 680; // px/s^2 upwards when holding Space / Mouse
    const gravity = 540;   // px/s^2 downwards when released
    const maxUpVel = 350;
    const maxDownVel = -350;

    if (isInputActive) {
      this.barVel = Math.min(maxUpVel, this.barVel + liftAccel * dt);
    } else {
      this.barVel = Math.max(maxDownVel, this.barVel - gravity * dt);
    }

    this.barY += this.barVel * dt;

    // Bottom collision with realistic soft bounce
    if (this.barY <= 0) {
      this.barY = 0;
      this.barVel = Math.abs(this.barVel) * 0.28;
    }

    // Top ceiling collision
    const maxBarY = this.tankHeight - this.barHeight;
    if (this.barY >= maxBarY) {
      this.barY = maxBarY;
      this.barVel = 0;
    }

    // 2. 🐟 Fish AI Movement & Erratic Swim Pattern
    this.fishTimer -= dt;
    if (this.fishTimer <= 0) {
      // Pick new target location inside the water column
      const margin = 16;
      this.fishTargetY = margin + Math.random() * (this.tankHeight - margin * 2);
      this.fishTimer = this.minWait + Math.random() * (this.maxWait - this.minWait);
    }

    const distToTarget = this.fishTargetY - this.fishY;
    const moveStep = Math.sign(distToTarget) * Math.min(Math.abs(distToTarget), this.baseSpeed * dt);
    this.fishY += moveStep;

    // Clamp fish within tank
    this.fishY = Math.max(8, Math.min(this.tankHeight - 16, this.fishY));

    // 3. 🎯 Overlap Detection: Is Fish inside Green Catch Bar?
    const fishBottom = this.fishY - 6;
    const fishTop = this.fishY + 6;
    const barBottom = this.barY;
    const barTop = this.barY + this.barHeight;

    const isInside = (fishTop >= barBottom && fishBottom <= barTop);
    this.isFishInside = isInside;

    // 4. 📈 Progress Meter Update
    const fillRate = 0.24; // +24% per second when inside
    const drainRate = 0.16; // -16% per second when outside

    if (isInside) {
      this.progress += fillRate * dt;
      this.soundTimer += dt;
      if (this.soundTimer >= 0.16) {
        this.soundTimer = 0;
        if (soundEngine && typeof soundEngine.playReelClick === 'function') {
          soundEngine.playReelClick();
        }
      }
    } else {
      this.progress -= drainRate * dt;
      this.isPerfect = false; // Player let the fish escape the bar!
    }

    this.progress = Math.max(0.0, Math.min(1.0, this.progress));

    // 5. 🎨 Update DOM Rendering
    if (this.catchBarEl) {
      this.catchBarEl.style.bottom = `${Math.round(this.barY)}px`;
      this.catchBarEl.classList.toggle('in-zone', isInside);
    }

    if (this.targetFishEl) {
      this.targetFishEl.style.bottom = `${Math.round(this.fishY)}px`;
    }

    if (this.meterFillEl) {
      const pct = Math.round(this.progress * 100);
      this.meterFillEl.style.height = `${pct}%`;
      this.meterFillEl.classList.toggle('draining', !isInside);
    }

    if (this.meterPctEl) {
      this.meterPctEl.innerText = `${Math.round(this.progress * 100)}%`;
    }

    // 6. 🏆 Check Victory or Loss
    if (this.progress >= 1.0) {
      // Caught!
      const perfectCaught = this.isPerfect;
      if (perfectCaught && this.perfectToastEl) {
        this.perfectToastEl.classList.add('show');
      }
      this.stop();
      return {
        status: 'CAUGHT',
        fish: this.fishData,
        isPerfect: perfectCaught
      };
    }

    if (this.progress <= 0.0) {
      // Escaped!
      this.stop();
      return {
        status: 'ESCAPED',
        fish: this.fishData
      };
    }

    return {
      status: 'IN_PROGRESS',
      progress: this.progress,
      isInside
    };
  }

  stop() {
    this.isActive = false;
    if (this.containerEl) {
      this.containerEl.classList.remove('visible');
      this.containerEl.style.display = 'none';
      this.containerEl.style.opacity = '0';
      this.containerEl.style.pointerEvents = 'none';
    }
  }
}
