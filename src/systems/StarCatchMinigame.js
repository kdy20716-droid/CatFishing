/**
 * 🌟 MapleStory-style Star Catch Fishing Mini-game System (Tug-of-War Edition)
 * - Screen-space Canvas Overlay (100% visible on all screens)
 * - Depth-based Star Speed Scaling (Shallow = slow & relaxing, Deep = fast & intense)
 * - Rod Tier Target Zone Scaling (High-tier rods have huge target zones)
 * - Tug-of-War Gameplay:
 *   - HIT: Instantly boosts hook towards boat (+130px upward reel) & stuns fish!
 *   - MISS: Risk! Fish rages & drags line downwards (-120px deeper)!
 *   - Multiple misses (4 max) causes fish to escape!
 *   - Reaching boat/surface completes the catch!
 */

export class StarCatchMinigame {
  constructor() {
    this.isActive = false;
    this.fish = null;
    this.economy = null;
    this.waterY = 300;

    // Track & Zone parameters (Normalized 0.0 ~ 1.0)
    this.starPos = 0.0;
    this.starDir = 1;
    this.starSpeed = 1.0;

    this.zoneStart = 0.35;
    this.zoneEnd = 0.65;
    this.zoneWidth = 0.30;

    // Tug-of-War Stats
    this.combo = 0;
    this.successHits = 0;
    this.missCount = 0;
    this.maxMisses = 4;

    // Visual feedback
    this.feedbackText = null;
    this.feedbackColor = '#ffd166';
    this.feedbackTimer = 0;
    this.particles = [];
    this.animTime = 0;

    // Input Trigger Flag
    this.pendingTrigger = false;
    this.initDirectListeners();
  }

  initDirectListeners() {
    window.addEventListener('keydown', (e) => {
      if (!this.isActive) return;
      if (e.code === 'Space' || e.key === ' ' || e.code === 'KeyW' || e.code === 'ArrowUp') {
        this.pendingTrigger = true;
      }
    });

    window.addEventListener('pointerdown', (e) => {
      if (!this.isActive) return;
      // Only main clicks
      if (e.button === 0) {
        this.pendingTrigger = true;
      }
    });
  }

  start(fishInstance, economy, waterY = 300) {
    this.fish = fishInstance;
    this.economy = economy;
    this.waterY = waterY;
    this.isActive = true;
    this.combo = 0;
    this.successHits = 0;
    this.missCount = 0;
    this.maxMisses = 4;
    this.feedbackText = null;
    this.particles = [];
    this.animTime = 0;
    this.pendingTrigger = false;

    // 1. Calculate Target Zone Width based on Fishing Rod Tier & Upgrades
    let rodTier = 1;
    if (economy && typeof economy.getCurrentRod === 'function') {
      const rod = economy.getCurrentRod();
      rodTier = rod?.tier || 1;
    }

    const reelMotorLv = economy?.upgradeLevels?.reel_motor || 0;
    const hatBonus = (economy?.currentHatId === 'hat_sailor') ? 0.08 : 0;

    // Zone width: Base 0.22 (22%) up to 0.80 (80%)
    this.zoneWidth = Math.min(0.82, Math.max(0.20, 0.20 + (rodTier - 1) * 0.065 + reelMotorLv * 0.012 + hatBonus));
    this.randomizeZone();

    // 2. 🌊 Depth-based Star Speed Scaling (Shallow fish move slowly, deep/boss fish move faster!)
    const currentFishY = fishInstance?.pos?.y || (waterY + 100);
    const depthMeters = Math.max(0, (currentFishY - waterY) / 20);

    let baseSpeed = 0.85; // Very comfortable base speed for shallow water (< 30m)
    if (depthMeters < 30) {
      // 0m ~ 30m (Shallow / Surface): Slow & gentle
      baseSpeed = 0.70 + (depthMeters / 30) * 0.25; // 0.70 ~ 0.95
    } else if (depthMeters < 120) {
      // 30m ~ 120m (Mid-depth): Moderate
      baseSpeed = 0.95 + ((depthMeters - 30) / 90) * 0.40; // 0.95 ~ 1.35
    } else if (depthMeters < 350) {
      // 120m ~ 350m (Deep-sea): Fast
      baseSpeed = 1.35 + ((depthMeters - 120) / 230) * 0.50; // 1.35 ~ 1.85
    } else {
      // 350m+ ~ 750m (Abyss / Trenches): High-speed
      baseSpeed = 1.85 + Math.min(0.55, ((depthMeters - 350) / 400) * 0.55); // 1.85 ~ 2.40
    }

    const isBoss = !!fishInstance?.isBoss;
    const isShiny = !!fishInstance?.isShiny;
    if (isBoss) baseSpeed *= 1.25;
    if (isShiny) baseSpeed *= 1.15;

    this.starSpeed = baseSpeed;
    this.starPos = 0.05;
    this.starDir = 1;

    return true;
  }

  randomizeZone() {
    const minMargin = 0.08;
    const maxStart = 1.0 - this.zoneWidth - minMargin;
    this.zoneStart = minMargin + Math.random() * Math.max(0, maxStart - minMargin);
    this.zoneEnd = this.zoneStart + this.zoneWidth;
  }

  update(dt, input, soundEngine, rod, cat, waterY = 300) {
    if (!this.isActive) return null;

    this.animTime += dt;

    // 1. Move Star Indicator back and forth
    this.starPos += this.starDir * this.starSpeed * dt;
    if (this.starPos >= 1.0) {
      this.starPos = 1.0;
      this.starDir = -1;
    } else if (this.starPos <= 0.0) {
      this.starPos = 0.0;
      this.starDir = 1;
    }

    // 2. Update Feedback & Particles
    if (this.feedbackTimer > 0) {
      this.feedbackTimer -= dt;
    }

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 180 * dt;
      p.alpha -= dt * 1.5;
      p.size = Math.max(0, p.size - dt * 4);
      if (p.alpha <= 0) {
        this.particles.splice(i, 1);
      }
    }

    // 3. Process Input Trigger (Space key or Click)
    const isTriggered = this.pendingTrigger || (input && (input.isKeyJustPressed('Space') || input.mouseJustPressed));
    this.pendingTrigger = false; // Reset trigger flag

    if (isTriggered) {
      const isInside = (this.starPos >= this.zoneStart && this.starPos <= this.zoneEnd);

      if (isInside) {
        // 🎯 SUCCESS HIT! PULL BOOST (+위로 팍 당김!)
        this.combo++;
        this.successHits++;
        
        // Upward Boost to Rod Hook
        if (rod) {
          const pullDistance = 120 + this.combo * 20; // 140px ~ 220px upward pull!
          rod.hookPos.y = Math.max(waterY + 15, rod.hookPos.y - pullDistance);
          rod.hookVel.y = -220; // lingering upward momentum
        }

        // Stun fish
        if (this.fish) {
          this.fish.isExhausted = true;
          this.fish.exhaustedTimer = 1.6;
        }

        // Audio
        if (soundEngine && typeof soundEngine.playCatch === 'function') {
          soundEngine.playCatch('rare');
        }
        if (soundEngine && typeof soundEngine.playCoin === 'function') {
          soundEngine.playCoin();
        }

        this.spawnSuccessParticles();
        this.feedbackText = this.combo > 1 
          ? `✨ 냥냥 릴링 파워 부스트! (${this.combo} COMBO!) ✨`
          : '✨ 릴링 파워 부스트! (+위로 쑥 당김!) ✨';
        this.feedbackColor = '#ffd166';
        this.feedbackTimer = 0.85;

        // Shift zone slightly for next rhythm challenge
        this.randomizeZone();

      } else {
        // 💨 MISS! RISK ACTIVATION (물고기가 아래로 낚아채며 도망침)
        this.missCount++;
        this.combo = 0;

        // Downward drag to Rod Hook
        if (rod) {
          rod.hookPos.y += 115; // Plunges 115px deeper!
          rod.hookVel.y = 180;
        }

        // Fish enrages
        if (this.fish) {
          this.fish.rage = 100;
          this.fish.isExhausted = false;
        }

        // Audio
        if (soundEngine && typeof soundEngine.playSplash === 'function') {
          soundEngine.playSplash(0.8);
        }

        this.spawnMissParticles();
        this.feedbackText = `🔻 MISS! 물고기가 아래로 도망친다냥! (${this.missCount}/${this.maxMisses})`;
        this.feedbackColor = '#ef4444';
        this.feedbackTimer = 0.85;

        // Check if exceeded max misses
        if (this.missCount >= this.maxMisses) {
          this.isActive = false;
          return {
            status: 'ESCAPED',
            fish: this.fish
          };
        }
      }
    }

    // 4. Check if Hook & Fish reached Boat / Surface (Catch Completion!)
    if (rod && cat) {
      const rodTip = (typeof cat.getRodTipPos === 'function') ? cat.getRodTipPos() : cat.pos;
      const distToCat = rod.hookPos ? rod.hookPos.dist(rodTip) : 999;
      const distToBoat = rod.hookPos ? Math.hypot(rod.hookPos.x - cat.pos.x, rod.hookPos.y - waterY) : 999;

      if (distToBoat < 75 || distToCat < 80 || (rod.hookPos && rod.hookPos.y <= waterY + 25)) {
        this.isActive = false;
        return {
          status: 'CAUGHT',
          fish: this.fish,
          isPerfect: (this.missCount === 0 && this.successHits > 0)
        };
      }
    }

    return {
      status: 'IN_PROGRESS',
      combo: this.combo,
      missCount: this.missCount,
      starPos: this.starPos
    };
  }

  spawnSuccessParticles() {
    const cx = window.innerWidth ? window.innerWidth / 2 : 400;
    const cy = window.innerHeight ? window.innerHeight - 150 : 400;
    for (let i = 0; i < 30; i++) {
      const ang = Math.random() * Math.PI * 2;
      const spd = 70 + Math.random() * 220;
      this.particles.push({
        x: cx,
        y: cy,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd - 50,
        size: 5 + Math.random() * 7,
        alpha: 1.0,
        color: Math.random() > 0.5 ? '#ffd166' : (Math.random() > 0.5 ? '#06d6a0' : '#ffffff')
      });
    }
  }

  spawnMissParticles() {
    const cx = window.innerWidth ? window.innerWidth / 2 : 400;
    const cy = window.innerHeight ? window.innerHeight - 150 : 400;
    for (let i = 0; i < 18; i++) {
      const ang = Math.random() * Math.PI * 2;
      const spd = 50 + Math.random() * 140;
      this.particles.push({
        x: cx,
        y: cy,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd + 40,
        size: 4 + Math.random() * 6,
        alpha: 1.0,
        color: '#ef4444'
      });
    }
  }

  stop() {
    this.isActive = false;
    this.particles = [];
    this.pendingTrigger = false;
  }

  /**
   * 🎨 Draw Star Catch Mini-Game directly on Canvas in Screen Space
   */
  draw(ctx, canvasWidth, canvasHeight, rod, waterY = 300) {
    if (!this.isActive) return;

    ctx.save();

    // Box dimensions
    const boxW = Math.min(480, canvasWidth - 40);
    const boxH = 145;
    const boxX = (canvasWidth - boxW) / 2;
    const boxY = canvasHeight - boxH - 70;

    // 1. Semi-transparent backdrop
    ctx.fillStyle = 'rgba(10, 15, 30, 0.90)';
    ctx.beginPath();
    ctx.roundRect(boxX, boxY, boxW, boxH, 22);
    ctx.fill();

    // Glowing Border
    ctx.lineWidth = 3.5;
    ctx.strokeStyle = this.combo > 1 ? '#06d6a0' : '#ffd166';
    ctx.shadowColor = this.combo > 1 ? 'rgba(6, 214, 160, 0.6)' : 'rgba(255, 209, 102, 0.6)';
    ctx.shadowBlur = 16;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // 2. Title & Fish Info Header
    ctx.font = 'bold 15px "Nanum Gothic", sans-serif';
    ctx.fillStyle = '#ffd166';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    const fishName = this.fish?.data?.name || '물고기';
    const isBoss = this.fish?.isBoss;
    const isShiny = this.fish?.isShiny;
    const titleText = isBoss 
      ? `👑 [보스] ${fishName} 줄다리기 스타캐치!` 
      : (isShiny ? `✨ [이로치] ${fishName} 줄다리기 스타캐치!` : `🎣 ${fishName} 줄다리기 스타캐치!`);
    ctx.fillText(titleText, canvasWidth / 2, boxY + 12);

    // Current Remaining Depth Indicator
    if (rod) {
      const remainingMeters = Math.max(0, ((rod.hookPos.y - waterY) / 20)).toFixed(1);
      ctx.font = 'bold 12px "Nanum Gothic", sans-serif';
      ctx.fillStyle = '#38bdf8';
      ctx.fillText(`⚓ 남은 수심: ${remainingMeters}m`, canvasWidth / 2, boxY + 32);
    }

    // Miss Chance Dots (Total 4)
    const dotStartX = boxX + boxW - 80;
    for (let i = 0; i < this.maxMisses; i++) {
      ctx.beginPath();
      ctx.arc(dotStartX + i * 16, boxY + 22, 5.5, 0, Math.PI * 2);
      ctx.fillStyle = i < (this.maxMisses - this.missCount) ? '#22c55e' : '#ef4444';
      ctx.fill();
    }

    // 3. Track Bar Frame
    const trackX = boxX + 24;
    const trackY = boxY + 54;
    const trackW = boxW - 48;
    const trackH = 34;

    // Track Background
    ctx.fillStyle = '#090d16';
    ctx.beginPath();
    ctx.roundRect(trackX, trackY, trackW, trackH, 12);
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.stroke();

    // 4. Target Sweet-Spot Zone
    const zoneX = trackX + this.zoneStart * trackW;
    const zoneW = this.zoneWidth * trackW;
    
    // Glowing Target Zone
    const zoneGrad = ctx.createLinearGradient(zoneX, trackY, zoneX + zoneW, trackY);
    zoneGrad.addColorStop(0, 'rgba(245, 158, 11, 0.45)');
    zoneGrad.addColorStop(0.5, 'rgba(254, 240, 138, 0.90)');
    zoneGrad.addColorStop(1, 'rgba(245, 158, 11, 0.45)');
    
    ctx.fillStyle = zoneGrad;
    ctx.beginPath();
    ctx.roundRect(zoneX, trackY + 2, zoneW, trackH - 4, 8);
    ctx.fill();

    // Target Zone Border
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#fde047';
    ctx.shadowColor = '#ffd166';
    ctx.shadowBlur = 10;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Target Text
    ctx.font = 'bold 11px "Nanum Gothic", sans-serif';
    ctx.fillStyle = '#78350f';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('⭐ PULL ZONE ⭐', zoneX + zoneW / 2, trackY + trackH / 2);

    // 5. Moving Star Indicator (⭐)
    const starScreenX = trackX + this.starPos * trackW;
    const starScreenY = trackY + trackH / 2;

    const isInside = (this.starPos >= this.zoneStart && this.starPos <= this.zoneEnd);
    ctx.shadowColor = isInside ? '#22c55e' : '#ffd166';
    ctx.shadowBlur = 18;

    ctx.font = '24px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('⭐', starScreenX, starScreenY);
    ctx.shadowBlur = 0;

    // 6. Instructions & Feedback Message
    if (this.feedbackText && this.feedbackTimer > 0) {
      ctx.font = 'bold 14px "Nanum Gothic", sans-serif';
      ctx.fillStyle = this.feedbackColor;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText(this.feedbackText, canvasWidth / 2, boxY + boxH - 12);
    } else {
      ctx.font = 'bold 12.5px "Nanum Gothic", sans-serif';
      const promptPulse = Math.sin(this.animTime * 8) > 0 ? '#ffd166' : '#ffffff';
      ctx.fillStyle = promptPulse;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText('🎯 [SPACE] 또는 [클릭] 으로 당김 부스트! (실패 시 아래로 내려감)', canvasWidth / 2, boxY + boxH - 12);
    }

    // 7. Draw Sparkling Particles
    this.particles.forEach(p => {
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    ctx.restore();
  }
}
