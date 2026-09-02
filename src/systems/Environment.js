/**
 * Dynamic Environment, Sky, Day/Sunset/Night Cycles, Ocean Shaders, and Seabed
 */

export class Environment {
  constructor() {
        this.timeOfDay = 'day'; // 'day', 'sunset', 'night'
    this.timeProgress = 0.0; // 0.0 to 1.0 (4 quadrants: 0~0.25 아침, 0.25~0.5 점심, 0.5~0.75 노을, 0.75~1.0 새벽)
    this.cycleSpeed = 1.0 / 720; // 12 minutes full cycle (3 minutes per phase / 90 degrees)

    // Season system (120 minutes full annual cycle: 30 minutes per season / 90 degrees)
    this.seasonProgress = 0.0; // 0~1 maps to spring→summer→autumn→winter
    this.season = 'spring';
    this.seasonSpeed = 1.0 / 7200; // 120 minutes full cycle (30 minutes per season) // Approx 1hr+ per full season cycle

    this.waterSurfaceY = 0;
    this.animTime = 0;
    this.saveTimer = 0;

    // Ambient Particles
    this.bubbles = [];
    this.plankton = [];
    this.shootingStars = [];
    this.clouds = [];
    this.smokeParticles = [];
    this.stars = [];

    // Load persisted time progress
    this.loadTimeState();

    this.initClouds();
    this.initPlankton();
    this.initStars();

    // Auto-save on page unload/refresh
    window.addEventListener('beforeunload', () => {
      this.saveTimeState();
    });
  }

  loadTimeState() {
    try {
      const saved = localStorage.getItem('cozy_cat_environment_time_v1');
      if (saved) {
        const data = JSON.parse(saved);
        if (typeof data.timeProgress === 'number' && !isNaN(data.timeProgress)) {
          this.timeProgress = Math.max(0, Math.min(1, data.timeProgress));
          if (this.timeProgress < 0.38) this.timeOfDay = 'day';
          else if (this.timeProgress < 0.65) this.timeOfDay = 'sunset';
          else this.timeOfDay = 'night';
        }
        if (typeof data.seasonProgress === 'number' && !isNaN(data.seasonProgress)) {
          this.seasonProgress = Math.max(0, Math.min(1, data.seasonProgress));
          this._updateSeason();
        }
      }
    } catch (e) {
      console.warn("Failed to load environment time state:", e);
    }
  }

  saveTimeState() {
    try {
      const data = {
        timeProgress: this.timeProgress,
        timeOfDay: this.timeOfDay,
        seasonProgress: this.seasonProgress,
        season: this.season
      };
      localStorage.setItem('cozy_cat_environment_time_v1', JSON.stringify(data));
    } catch (e) {}
  }

  /** Sync environment time, day/night cycle, and season from multiplayer room host */
  syncEnvironmentState(data, soundEngine = null) {
    if (!data) return;

    if (typeof data.timeProgress === 'number' && !isNaN(data.timeProgress)) {
      const targetProgress = (data.timeProgress + 1.0) % 1.0;
      const diff = Math.abs(this.timeProgress - targetProgress);
      // If large difference (initial join), snap immediately; otherwise smooth lerp
      if (diff > 0.08 && diff < 0.92) {
        this.timeProgress = targetProgress;
      } else {
        this.timeProgress += (targetProgress - this.timeProgress) * 0.25;
      }
      this.timeProgress = (this.timeProgress + 1.0) % 1.0;

      if (this.timeProgress < 0.38) this.timeOfDay = 'day';
      else if (this.timeProgress < 0.65) this.timeOfDay = 'sunset';
      else this.timeOfDay = 'night';
    }

    if (data.timeOfDay && data.timeOfDay !== this.timeOfDay) {
      this.timeOfDay = data.timeOfDay;
    }

    if (typeof data.seasonProgress === 'number' && !isNaN(data.seasonProgress)) {
      this.seasonProgress = (data.seasonProgress + 1.0) % 1.0;
      this._updateSeason();
    }

    if (data.season && data.season !== this.season) {
      this.season = data.season;
    }

    if (soundEngine && typeof soundEngine.setTimeOfDay === 'function') {
      soundEngine.setTimeOfDay(this.timeOfDay);
    }
  }

    /** Sync this.season from this.seasonProgress (30min / 90deg per season) */
  _updateSeason() {
    if (this.seasonProgress < 0.25) this.season = 'spring';
    else if (this.seasonProgress < 0.5) this.season = 'summer';
    else if (this.seasonProgress < 0.75) this.season = 'autumn';
    else this.season = 'winter';
  }

  /** Returns season display info */
  getSeasonInfo() {
    const icons = { spring: '🌸', summer: '☀️', autumn: '🍂', winter: '❄️' };
    const labels = { spring: '봄', summer: '여름', autumn: '가을', winter: '겨울' };
    const colors = { spring: '#34d399', summer: '#fb923c', autumn: '#d97706', winter: '#60a5fa' };
    return {
      season: this.season,
      icon: icons[this.season] || '🌸',
      label: labels[this.season] || '봄',
      color: colors[this.season] || '#34d399',
      progress: this.seasonProgress
    };
  }

  initClouds() {
    for (let i = 0; i < 40; i++) {
      this.clouds.push({
        x: -800 + Math.random() * 32800,
        y: -180 - Math.random() * 150,
        speed: 10 + Math.random() * 18,
        width: 120 + Math.random() * 160,
        height: 40 + Math.random() * 35
      });
    }
  }

  initStars() {
    this.stars = [];
    for (let i = 0; i < 80; i++) {
      this.stars.push({
        x: -1200 + Math.random() * 34000,
        y: -400 + Math.random() * 320,
        size: 1.0 + Math.random() * 1.8,
        twinkleSpeed: 1.5 + Math.random() * 2.5,
        phase: Math.random() * Math.PI * 2
      });
    }
  }

  initPlankton() {
    for (let i = 0; i < 350; i++) {
      this.plankton.push({
        x: -800 + Math.random() * 32800,
        y: 50 + Math.random() * 15200,
        size: 1.5 + Math.random() * 3.0,
        alpha: 0.3 + Math.random() * 0.6,
        pulseSpeed: 1 + Math.random() * 2,
        driftSpeedX: (Math.random() - 0.5) * 12,
        driftSpeedY: -5 - Math.random() * 18
      });
    }
  }

    getTimeInfo() {
    // 4 Quadrants: 0~0.25 (0~3min) 아침, 0.25~0.5 (3~6min) 점심, 0.5~0.75 (6~9min) 노을, 0.75~1.0 (9~12min) 새벽
    let phase, icon, color;
    if (this.timeProgress < 0.25) {
      phase = '아침'; icon = '☀️'; color = '#fbbf24'; this.timeOfDay = 'day';
    } else if (this.timeProgress < 0.50) {
      phase = '점심'; icon = '🌤️'; color = '#38bdf8'; this.timeOfDay = 'day';
    } else if (this.timeProgress < 0.75) {
      phase = '노을'; icon = '🌅'; color = '#f97316'; this.timeOfDay = 'sunset';
    } else {
      phase = '새벽'; icon = '🌙'; color = '#818cf8'; this.timeOfDay = 'night';
    }
    return {
      progress: this.timeProgress,
      timeOfDay: this.timeOfDay,
      phase,
      icon,
      color
    };
  }

  update(dt, soundEngine) {
    this.animTime += dt;

    // Peaceful natural continuous time passage
    this.timeProgress = (this.timeProgress + this.cycleSpeed * dt) % 1.0;
    if (this.timeProgress < 0.38) this.timeOfDay = 'day';
    else if (this.timeProgress < 0.65) this.timeOfDay = 'sunset';
    else this.timeOfDay = 'night';

    // Season progress (much slower)
    this.seasonProgress = (this.seasonProgress + this.seasonSpeed * dt) % 1.0;
    this._updateSeason();

    if (soundEngine) {
      soundEngine.setTimeOfDay(this.timeOfDay);
    }

    // Save time progress state periodically (every 2 seconds)
    this.saveTimer += dt;
    if (this.saveTimer >= 2.0) {
      this.saveTimer = 0;
      this.saveTimeState();
    }

    // Update Clouds across 32,000px sky
    this.clouds.forEach(c => {
      c.x += c.speed * dt;
      if (c.x > 32000) c.x = -800;
    });

    // Update Plankton & Deep Stardust Dust (0m ~ 750m depth)
    this.plankton.forEach(p => {
      p.x += p.driftSpeedX * dt;
      p.y += p.driftSpeedY * dt;
      if (p.y < 30) p.y = 15200;
      if (p.x < -800) p.x = 32000;
      if (p.x > 32000) p.x = -800;
    });

    // 🫧 Spawn Bubbles across entire wide ocean (-600 ~ 32000px, 0 ~ 750m depth)
    if (Math.random() < 0.75) {
      const bubbleCount = 1 + Math.floor(Math.random() * 3);
      for (let k = 0; k < bubbleCount; k++) {
        this.bubbles.push({
          x: -600 + Math.random() * 32600,
          y: 150 + Math.random() * 15000,
          size: 2 + Math.random() * 4.5,
          vy: -40 - Math.random() * 60,
          vx: (Math.random() - 0.5) * 12
        });
      }
    }

    // Update Bubbles
    for (let i = this.bubbles.length - 1; i >= 0; i--) {
      const b = this.bubbles[i];
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      if (b.y <= this.waterSurfaceY) {
        this.bubbles.splice(i, 1);
      }
    }

    // Shooting Stars at night across entire sky
    if (this.timeOfDay === 'night' && Math.random() < 0.02) {
      this.shootingStars.push({
        x: Math.random() * 31000,
        y: -350 - Math.random() * 80,
        vx: 400 + Math.random() * 250,
        vy: 200 + Math.random() * 120,
        life: 0.85
      });
    }

    for (let i = this.shootingStars.length - 1; i >= 0; i--) {
      const s = this.shootingStars[i];
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.life -= dt;
      if (s.life <= 0) {
        this.shootingStars.splice(i, 1);
      }
    }

    // Cabin Chimney Smoke Puff Generation
    if (Math.random() < 0.18) {
      this.smokeParticles.push({
        x: 68 + (Math.random() - 0.5) * 6,
        y: -190,
        vx: 12 + Math.random() * 8,
        vy: -22 - Math.random() * 18,
        size: 6 + Math.random() * 4,
        alpha: 0.6,
        maxLife: 2.2,
        life: 2.2
      });
    }

    // Update Smoke Particles
    for (let i = this.smokeParticles.length - 1; i >= 0; i--) {
      const sp = this.smokeParticles[i];
      sp.x += sp.vx * dt;
      sp.y += sp.vy * dt;
      sp.size += dt * 6;
      sp.life -= dt;
      sp.alpha = Math.max(0, (sp.life / sp.maxLife) * 0.55);
      if (sp.life <= 0) {
        this.smokeParticles.splice(i, 1);
      }
    }
  }

  drawSky(ctx, bounds) {
    const skyHeight = 600;
    const skyTop = bounds.top - 100;
    const skyBottom = this.waterSurfaceY;

    // Sky Gradient based on Time of Day
    const skyGrad = ctx.createLinearGradient(0, skyTop, 0, skyBottom);

    if (this.timeOfDay === 'day') {
      skyGrad.addColorStop(0, '#8ecae6');
      skyGrad.addColorStop(0.6, '#bde0fe');
      skyGrad.addColorStop(1, '#ffcad4');
    } else if (this.timeOfDay === 'sunset') {
      skyGrad.addColorStop(0, '#5e548e');
      skyGrad.addColorStop(0.4, '#e07a5f');
      skyGrad.addColorStop(0.8, '#f4a261');
      skyGrad.addColorStop(1, '#ffd166');
    } else {
      // Night
      skyGrad.addColorStop(0, '#03071e');
      skyGrad.addColorStop(0.5, '#0d1b2a');
      skyGrad.addColorStop(1, '#1b263b');
    }

    ctx.fillStyle = skyGrad;
    ctx.fillRect(bounds.left - 200, skyTop, bounds.right - bounds.left + 400, skyBottom - skyTop + 50);

    // Sun / Moon / Celestial Bodies
    ctx.save();
    if (this.timeOfDay === 'day') {
      // Warm Glowing Sun
      const sunX = 800;
      const sunY = -220;
      const sunGlow = ctx.createRadialGradient(sunX, sunY, 10, sunX, sunY, 90);
      sunGlow.addColorStop(0, 'rgba(255, 243, 176, 0.9)');
      sunGlow.addColorStop(1, 'rgba(255, 243, 176, 0)');
      ctx.fillStyle = sunGlow;
      ctx.beginPath();
      ctx.arc(sunX, sunY, 90, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#fff3b0';
      ctx.beginPath();
      ctx.arc(sunX, sunY, 26, 0, Math.PI * 2);
      ctx.fill();

    } else if (this.timeOfDay === 'sunset') {
      // Blazing Golden Setting Sun on Horizon
      const sunX = 700;
      const sunY = -30;
      const sunGlow = ctx.createRadialGradient(sunX, sunY, 15, sunX, sunY, 160);
      sunGlow.addColorStop(0, 'rgba(255, 183, 3, 0.95)');
      sunGlow.addColorStop(0.6, 'rgba(247, 127, 0, 0.4)');
      sunGlow.addColorStop(1, 'rgba(247, 127, 0, 0)');
      ctx.fillStyle = sunGlow;
      ctx.beginPath();
      ctx.arc(sunX, sunY, 160, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffbe0b';
      ctx.beginPath();
      ctx.arc(sunX, sunY, 32, 0, Math.PI * 2);
      ctx.fill();

    } else {
      // Natural Twinkling Stars (Soft, Organic Distribution)
      this.stars.forEach(s => {
        if (s.x >= bounds.left - 50 && s.x <= bounds.right + 50) {
          const twinkle = 0.35 + 0.45 * Math.sin(this.animTime * s.twinkleSpeed + s.phase);
          ctx.fillStyle = `rgba(255, 255, 255, ${twinkle})`;
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      // Aurora Borealis Ribbon
      ctx.save();
      const auroraGrad = ctx.createLinearGradient(bounds.left, -250, bounds.right, -150);
      auroraGrad.addColorStop(0, 'rgba(6, 214, 160, 0)');
      auroraGrad.addColorStop(0.5, 'rgba(6, 214, 160, 0.25)');
      auroraGrad.addColorStop(0.8, 'rgba(17, 138, 178, 0.2)');
      auroraGrad.addColorStop(1, 'rgba(114, 9, 183, 0)');

      ctx.fillStyle = auroraGrad;
      ctx.beginPath();
      ctx.moveTo(bounds.left, -220);
      for (let x = bounds.left; x <= bounds.right; x += 100) {
        const ay = -240 + Math.sin(this.animTime * 0.8 + x * 0.005) * 35;
        ctx.lineTo(x, ay);
      }
      ctx.lineTo(bounds.right, -120);
      ctx.lineTo(bounds.left, -120);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // Crescent Moon
      const moonX = 900;
      const moonY = -240;
      ctx.fillStyle = '#ffeedd';
      ctx.beginPath();
      ctx.arc(moonX, moonY, 22, 0, Math.PI * 2);
      ctx.fill();
      // Cutout for crescent
      ctx.fillStyle = '#0a192f';
      ctx.beginPath();
      ctx.arc(moonX + 9, moonY - 4, 19, 0, Math.PI * 2);
      ctx.fill();

      // Shooting Stars
      this.shootingStars.forEach(s => {
        ctx.strokeStyle = `rgba(255, 255, 255, ${s.life})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(s.x - s.vx * 0.06, s.y - s.vy * 0.06);
        ctx.stroke();
      });
    }

    // Clouds
    this.clouds.forEach(c => {
      ctx.fillStyle = this.timeOfDay === 'night' 
        ? 'rgba(30, 41, 59, 0.4)' 
        : this.timeOfDay === 'sunset' 
        ? 'rgba(255, 200, 180, 0.55)' 
        : 'rgba(255, 255, 255, 0.65)';

      ctx.beginPath();
      ctx.roundRect(c.x, c.y, c.width, c.height, 20);
      ctx.fill();
    });

    // Distant Mountains & Islands (Parallax)
    ctx.fillStyle = this.timeOfDay === 'night' 
      ? '#0d1b2a' 
      : this.timeOfDay === 'sunset' 
      ? '#6d4c41' 
      : '#90be6d';

    ctx.beginPath();
    ctx.moveTo(bounds.left - 100, this.waterSurfaceY);
    ctx.quadraticCurveTo(300, -80, 700, this.waterSurfaceY);
    ctx.quadraticCurveTo(1200, -110, 1800, this.waterSurfaceY);
    ctx.quadraticCurveTo(2400, -70, bounds.right + 100, this.waterSurfaceY);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  drawPierAndCabin(ctx, bounds, playerX = 9999) {
    ctx.save();

    // 1. Chimney Smoke Particles
    this.smokeParticles.forEach(sp => {
      ctx.fillStyle = `rgba(226, 232, 240, ${sp.alpha})`;
      ctx.beginPath();
      ctx.arc(sp.x, sp.y, sp.size, 0, Math.PI * 2);
      ctx.fill();
    });

    // 2. Wooden Pier Pilings (Stilts extending into water)
    const pilings = [-160, -100, -40, 20, 80, 140, 200, 235];
    pilings.forEach(px => {
      // Main wooden post
      ctx.fillStyle = '#4a2810';
      ctx.fillRect(px - 6, -18, 12, 65);
      // Wood shading
      ctx.fillStyle = '#2c1810';
      ctx.fillRect(px + 1, -18, 5, 65);
      // Barnacles / moss near water line
      ctx.fillStyle = '#2d6a4f';
      ctx.fillRect(px - 7, -6, 14, 12);
    });

    // 3. Pier Wooden Deck (Planks)
    ctx.fillStyle = '#6f4e37';
    ctx.beginPath();
    ctx.roundRect(-260, -22, 510, 18, [4, 4, 0, 0]);
    ctx.fill();
    ctx.strokeStyle = '#3e2723';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Wooden Plank Grooves
    ctx.strokeStyle = '#4e342e';
    ctx.lineWidth = 1.5;
    for (let x = -250; x <= 240; x += 18) {
      ctx.beginPath();
      ctx.moveTo(x, -22);
      ctx.lineTo(x, -4);
      ctx.stroke();
    }

    // Mooring Bollards (Bitts) on Pier Edge
    ctx.fillStyle = '#212529';
    ctx.beginPath();
    ctx.roundRect(238, -30, 8, 12, 2);
    ctx.fill();
    // Tied Rope
    ctx.strokeStyle = '#d4a373';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(242, -24, 5, 0, Math.PI * 2);
    ctx.stroke();

    // 4. Cozy Wooden Cabin / Tackle Shop
    const cabinX = 20;
    const cabinY = -22;

    // Cabin Wall Body
    ctx.fillStyle = '#8b5a2b';
    ctx.fillRect(cabinX - 110, cabinY - 140, 200, 140);
    ctx.strokeStyle = '#4a2810';
    ctx.lineWidth = 3.5;
    ctx.strokeRect(cabinX - 110, cabinY - 140, 200, 140);

    // Horizontal Timber Wall Planks
    ctx.strokeStyle = '#6f4e37';
    ctx.lineWidth = 1.5;
    for (let y = cabinY - 125; y <= cabinY - 10; y += 16) {
      ctx.beginPath();
      ctx.moveTo(cabinX - 110, y);
      ctx.lineTo(cabinX + 90, y);
      ctx.stroke();
    }

    // Door
    ctx.fillStyle = '#5c3a21';
    ctx.beginPath();
    ctx.roundRect(cabinX - 95, cabinY - 95, 45, 95, [6, 6, 0, 0]);
    ctx.fill();
    ctx.strokeStyle = '#3e2723';
    ctx.lineWidth = 2;
    ctx.stroke();
    // Brass Door Knob
    ctx.fillStyle = '#ffd166';
    ctx.beginPath();
    ctx.arc(cabinX - 58, cabinY - 45, 3.5, 0, Math.PI * 2);
    ctx.fill();

    // Warm Cozy Glowing Window
    const isNightOrSunset = this.timeOfDay === 'night' || this.timeOfDay === 'sunset';
    ctx.fillStyle = isNightOrSunset ? '#ffbe0b' : '#ffea00';
    ctx.shadowColor = '#fbbf24';
    ctx.shadowBlur = isNightOrSunset ? 24 : 8;
    ctx.beginPath();
    ctx.roundRect(cabinX - 25, cabinY - 100, 55, 50, 6);
    ctx.fill();
    ctx.shadowBlur = 0; // reset shadow

    // Window Frame & Cross
    ctx.strokeStyle = '#4a2810';
    ctx.lineWidth = 3;
    ctx.strokeRect(cabinX - 25, cabinY - 100, 55, 50);
    ctx.beginPath();
    ctx.moveTo(cabinX + 2.5, cabinY - 100);
    ctx.lineTo(cabinX + 2.5, cabinY - 50);
    ctx.moveTo(cabinX - 25, cabinY - 75);
    ctx.lineTo(cabinX + 30, cabinY - 75);
    ctx.stroke();

    // Brick Chimney
    ctx.fillStyle = '#9d0208';
    ctx.fillRect(cabinX + 55, cabinY - 190, 26, 65);
    ctx.strokeStyle = '#6a040f';
    ctx.lineWidth = 2;
    ctx.strokeRect(cabinX + 55, cabinY - 190, 26, 65);
    // Chimney Rim
    ctx.fillStyle = '#6a040f';
    ctx.fillRect(cabinX + 51, cabinY - 196, 34, 8);

    // Gabled Cozy Roof (Warm Terracotta Slates)
    ctx.fillStyle = '#c1121f';
    ctx.beginPath();
    ctx.moveTo(cabinX - 130, cabinY - 130);
    ctx.lineTo(cabinX - 10, cabinY - 215);
    ctx.lineTo(cabinX + 110, cabinY - 130);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#780000';
    ctx.lineWidth = 4;
    ctx.stroke();

    // Roof Trim Slates
    ctx.strokeStyle = '#9d0208';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cabinX - 130, cabinY - 130);
    ctx.lineTo(cabinX + 110, cabinY - 130);
    ctx.stroke();

    // Shop Wooden Hanging Signboard
    ctx.fillStyle = '#ffeedd';
    ctx.beginPath();
    ctx.roundRect(cabinX - 65, cabinY - 138, 120, 25, 6);
    ctx.fill();
    ctx.strokeStyle = '#8d5a2b';
    ctx.lineWidth = 2;
    ctx.stroke();
    // Sign Text
    ctx.font = 'bold 12px "Pretendard", "Segoe UI", sans-serif';
    ctx.fillStyle = '#780000';
    ctx.textAlign = 'center';
    ctx.fillText('🏪 냥이 부두 상점', cabinX - 5, cabinY - 121);

    // Hanging Lantern
    const lanternX = cabinX + 75;
    const lanternY = cabinY - 75;
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(lanternX, cabinY - 100);
    ctx.lineTo(lanternX, lanternY);
    ctx.stroke();
    // Lantern Glow
    ctx.shadowColor = '#f59e0b';
    ctx.shadowBlur = 18;
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.arc(lanternX, lanternY + 6, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Fish Drying Rack (대롱대롱 매달린 물고기 소품)
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(130, -50);
    ctx.lineTo(165, -50);
    ctx.lineTo(165, -22);
    ctx.moveTo(130, -50);
    ctx.lineTo(130, -22);
    ctx.stroke();
    // Hanging Fish 1 & 2
    ctx.fillStyle = '#93c5fd';
    ctx.beginPath();
    ctx.ellipse(142, -40, 4, 8, 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fca5a5';
    ctx.beginPath();
    ctx.ellipse(155, -38, 4, 7, -0.2, 0, Math.PI * 2);
    ctx.fill();

    // 5. 🐱 Merchant Cat NPC ('골골 상인 냥이')
    const npcX = 195;
    const npcY = -22;
    const isPlayerNear = (playerX <= 320);
    this.drawMerchantCat(ctx, npcX, npcY, isPlayerNear);

    ctx.restore();
  }

  drawMerchantCat(ctx, x, y, isPlayerNear = false) {
    ctx.save();
    ctx.translate(x, y);

    const tailWiggle = Math.sin(this.animTime * 3.5) * 0.25;

    // Tail (Swaying)
    ctx.strokeStyle = '#e76f51';
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-10, -10);
    ctx.quadraticCurveTo(-22 + tailWiggle * 8, -20, -24, -30);
    ctx.stroke();

    // Body (Cheese Tabby Plump Merchant)
    ctx.fillStyle = '#f4a261';
    ctx.beginPath();
    ctx.ellipse(0, -15, 14, 12, 0, 0, Math.PI * 2);
    ctx.fill();

    // Green Merchant Apron
    ctx.fillStyle = '#2a9d8f';
    ctx.beginPath();
    ctx.roundRect(-8, -20, 16, 16, 3);
    ctx.fill();
    ctx.strokeStyle = '#264653';
    ctx.lineWidth = 1;
    ctx.stroke();
    // Apron Pocket & Coin icon
    ctx.fillStyle = '#ffd166';
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('💰', 0, -8);

    // Head
    ctx.fillStyle = '#f4a261';
    ctx.beginPath();
    ctx.arc(0, -28, 12, 0, Math.PI * 2);
    ctx.fill();

    // Ears
    ctx.beginPath();
    ctx.moveTo(-8, -36);
    ctx.lineTo(-12, -46);
    ctx.lineTo(-3, -39);
    ctx.closePath();
    ctx.moveTo(3, -39);
    ctx.lineTo(12, -46);
    ctx.lineTo(8, -36);
    ctx.closePath();
    ctx.fill();

    // Straw Merchant Hat
    ctx.fillStyle = '#ffeaa7';
    ctx.strokeStyle = '#d4a373';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(0, -37, 18, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.roundRect(-8, -46, 16, 10, 3);
    ctx.fill();
    ctx.stroke();
    // Red Ribbon on Hat
    ctx.fillStyle = '#e63946';
    ctx.fillRect(-8, -39, 16, 3);

    // Happy Eyes `^‿^`
    ctx.strokeStyle = '#264653';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(-4, -28, 2.5, Math.PI, 0, false);
    ctx.arc(4, -28, 2.5, Math.PI, 0, false);
    ctx.stroke();

    // Pink Nose & Cheeks
    ctx.fillStyle = 'rgba(255, 143, 163, 0.55)';
    ctx.beginPath();
    ctx.arc(-6, -24, 2.5, 0, Math.PI * 2);
    ctx.arc(6, -24, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffafcc';
    ctx.beginPath();
    ctx.arc(0, -26, 1.8, 0, Math.PI * 2);
    ctx.fill();

    // Waving Right Paw
    const waveHand = Math.sin(this.animTime * 5) * 4;
    ctx.fillStyle = '#fefae0';
    ctx.beginPath();
    ctx.arc(14, -22 + waveHand, 3.5, 0, Math.PI * 2);
    ctx.fill();

    // Floating Overhead NPC Badge
    const bounce = Math.sin(this.animTime * 4) * 3;
    const badgeY = -58 + bounce;

    if (isPlayerNear) {
      // ✨ Glowing Gold [R] Key Interact Prompt Badge
      ctx.shadowColor = '#f59e0b';
      ctx.shadowBlur = 10;
      ctx.fillStyle = '#fbbf24';
      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(-52, badgeY - 14, 104, 26, 13);
      ctx.fill();
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Key [R] Pill
      ctx.fillStyle = '#78350f';
      ctx.beginPath();
      ctx.roundRect(-46, badgeY - 9, 20, 16, 4);
      ctx.fill();

      ctx.font = 'bold 11px sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.fillText('R', -36, badgeY + 3);

      ctx.font = 'bold 12px "Pretendard", "Segoe UI", sans-serif';
      ctx.fillStyle = '#78350f';
      ctx.textAlign = 'center';
      ctx.fillText('상점 대화', 12, badgeY + 3);
    } else {
      // Normal Overhead Badge
      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(-42, badgeY - 10, 84, 20, 10);
      ctx.fill();
      ctx.stroke();

      ctx.font = 'bold 11px "Pretendard", "Segoe UI", sans-serif';
      ctx.fillStyle = '#fef08a';
      ctx.textAlign = 'center';
      ctx.fillText('🏪 냥이 상인', 0, badgeY + 4);
    }

    ctx.restore();
  }

  drawOcean(ctx, bounds) {
    const oceanTop = this.waterSurfaceY;
    const oceanBottom = 15600; // 750m+ depth (1m = 20px -> 750m = 15000px)

    // Multi-Zone Underwater Depth Gradient (0m ~ 750m+)
    const oceanGrad = ctx.createLinearGradient(0, oceanTop, 0, oceanBottom);

    if (this.timeOfDay === 'night') {
      oceanGrad.addColorStop(0, '#001845');      // Surface (0m)
      oceanGrad.addColorStop(0.06, '#023e8a');   // Shallow (30m)
      oceanGrad.addColorStop(0.16, '#03045e');   // Mid (100m)
      oceanGrad.addColorStop(0.35, '#10002b');   // Deep (250m)
      oceanGrad.addColorStop(0.55, '#240046');   // Abyss (400m)
      oceanGrad.addColorStop(0.80, '#030108');   // Hadal (600m)
      oceanGrad.addColorStop(1.0, '#000002');    // Cosmic Seabed (750m+)
    } else if (this.timeOfDay === 'sunset') {
      oceanGrad.addColorStop(0, '#3a86ff');
      oceanGrad.addColorStop(0.06, '#0077b6');
      oceanGrad.addColorStop(0.16, '#023e8a');
      oceanGrad.addColorStop(0.35, '#240046');
      oceanGrad.addColorStop(0.55, '#3c096c');
      oceanGrad.addColorStop(0.80, '#0b090a');
      oceanGrad.addColorStop(1.0, '#020005');
    } else {
      // Day
      oceanGrad.addColorStop(0, '#48cae4');      // Sparkling Turquoise (0m)
      oceanGrad.addColorStop(0.06, '#0096c7');   // Aquamarine (30m)
      oceanGrad.addColorStop(0.16, '#0077b6');   // Sapphire Blue (100m)
      oceanGrad.addColorStop(0.35, '#03045e');   // Deep Midnight Indigo (250m)
      oceanGrad.addColorStop(0.55, '#10002b');   // Hadal Cosmic Purple (400m)
      oceanGrad.addColorStop(0.80, '#020005');   // Outer Abyss Void (600m)
      oceanGrad.addColorStop(1.0, '#000002');    // Cosmic Nebula Void (750m+)
    }

    ctx.fillStyle = oceanGrad;
    ctx.fillRect(bounds.left - 400, oceanTop, bounds.right - bounds.left + 800, oceanBottom - oceanTop);

    // Underwater Sun Rays (God Rays) near surface (0 ~ 800px)
    if (this.timeOfDay !== 'night') {
      ctx.save();
      const raySpacing = 360;
      const startRayX = Math.floor((bounds.left - 200) / raySpacing) * raySpacing;
      const endRayX = bounds.right + 200;

      for (let rx = startRayX; rx <= endRayX; rx += raySpacing) {
        const animX = rx + Math.sin(this.animTime * 0.8 + rx * 0.005) * 60;
        const rayGrad = ctx.createLinearGradient(animX, oceanTop, animX + 180, oceanTop + 800);
        rayGrad.addColorStop(0, 'rgba(255, 255, 255, 0.18)');
        rayGrad.addColorStop(0.6, 'rgba(255, 255, 255, 0.04)');
        rayGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');

        ctx.fillStyle = rayGrad;
        ctx.beginPath();
        ctx.moveTo(animX - 40, oceanTop);
        ctx.lineTo(animX + 90, oceanTop);
        ctx.lineTo(animX + 260, oceanTop + 800);
        ctx.lineTo(animX + 50, oceanTop + 800);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    }

    // Depth Markers & Zone Headers across 0m ~ 750m
    ctx.save();
    const zoneHeaders = [
      { depth: 5, title: '🌊 [표층 바다 / Shallow Zone 0~30m]', color: '#a0c4ff' },
      { depth: 32, title: '🌅 [중층 바다 / Twilight Zone 30~100m]', color: '#80ffdb' },
      { depth: 105, title: '🌌 [심해 어둠층 / Midnight Zone 100~250m]', color: '#c77dff' },
      { depth: 255, title: '🪐 [심연의 해구 / Abyssal Trench 250~400m]', color: '#ffd166' },
      { depth: 405, title: '👑 [미지의 초심연 / Hadal Realm 400~600m]', color: '#ff007f' },
      { depth: 605, title: '✨ [코스믹 네뷸라 해저 지대 / Cosmic Void 600~750m+]', color: '#70e000' }
    ];

    zoneHeaders.forEach(zh => {
      const zy = zh.depth * 20;
      ctx.fillStyle = zh.color;
      ctx.font = 'bold 15px sans-serif';
      ctx.fillText(zh.title, bounds.left + 30, zy);
    });

    for (let d = 25; d <= 750; d += 25) {
      const y = d * 20;
      ctx.strokeStyle = (d % 100 === 0) ? 'rgba(255, 255, 255, 0.25)' : 'rgba(255, 255, 255, 0.09)';
      ctx.lineWidth = (d % 100 === 0) ? 2 : 1;
      ctx.beginPath();
      ctx.moveTo(bounds.left, y);
      ctx.lineTo(bounds.right, y);
      ctx.stroke();

      ctx.fillStyle = (d % 100 === 0) ? '#ffd166' : 'rgba(255, 255, 255, 0.45)';
      ctx.font = (d % 100 === 0) ? 'bold 13px sans-serif' : '11px sans-serif';
      ctx.fillText(`── ${d}m ──`, bounds.left + 35, y - 4);
    }
    ctx.restore();

    // Floating Bubbles
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1;
    this.bubbles.forEach(b => {
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    });
    ctx.restore();

    // Plankton / Deep Bioluminescent Stardust (Soft & Only in Deep Sea)
    ctx.save();
    this.plankton.forEach(p => {
      // Avoid surface clutter (only in deep water y > 350)
      if (p.y > 350 && p.x >= bounds.left - 100 && p.x <= bounds.right + 100 && p.y >= bounds.top - 50 && p.y <= bounds.bottom + 50) {
        const pulse = 0.2 + 0.35 * Math.abs(Math.sin(this.animTime * p.pulseSpeed));
        ctx.fillStyle = this.timeOfDay === 'night' 
          ? `rgba(76, 201, 240, ${pulse})` 
          : `rgba(255, 255, 255, ${pulse * 0.7})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 0.8, 0, Math.PI * 2);
        ctx.fill();
      }
    });
    ctx.restore();

    // Seabed Landscape (Reefs, Corals, Sunken Ruins at 750m)
    this.drawSeabed(ctx, bounds);

    // Water Surface Waves
    this.drawWaterSurface(ctx, bounds);
  }

  drawSeabed(ctx, bounds) {
    const seabedY = 15150; // 750m+ seabed floor (1m = 20px -> 750m = 15000px)
    ctx.save();

    // Sandy/Rocky bottom
    ctx.fillStyle = '#050508';
    ctx.beginPath();
    ctx.moveTo(bounds.left - 200, seabedY);
    for (let x = bounds.left - 200; x <= bounds.right + 200; x += 150) {
      const cy = seabedY + Math.sin(x * 0.005) * 40;
      ctx.lineTo(x, cy);
    }
    ctx.lineTo(bounds.right + 200, 16000);
    ctx.lineTo(bounds.left - 200, 16000);
    ctx.closePath();
    ctx.fill();

    // Ancient Sunken Atlantis Temple Columns & Ruins across seabed
    [2500, 7500, 14000, 21000, 28000].forEach(templeX => {
      const templeY = seabedY - 40;
      ctx.fillStyle = '#1e1b18';
      ctx.strokeStyle = '#ffd166';
      ctx.lineWidth = 2;
      for (let col = -3; col <= 3; col++) {
        const cx = templeX + col * 75;
        ctx.fillRect(cx, templeY - 120, 24, 130);
        ctx.strokeRect(cx, templeY - 120, 24, 130);
      }
      // Temple Arch
      ctx.fillStyle = '#ffd166';
      ctx.fillRect(templeX - 250, templeY - 145, 520, 25);
    });

    // Glowing Bioluminescent Crystals on Seabed (Full Bounds Width)
    const crystalSpacing = 200;
    const startCrystalX = Math.floor(bounds.left / crystalSpacing) * crystalSpacing + 60;
    const endCrystalX = bounds.right + 100;

    let cIdx = 0;
    for (let cx = startCrystalX; cx <= endCrystalX; cx += crystalSpacing) {
      cIdx++;
      const cy = seabedY + 5;
      const glow = ctx.createRadialGradient(cx, cy - 25, 2, cx, cy - 25, 45);
      glow.addColorStop(0, cIdx % 2 === 0 ? 'rgba(0, 245, 212, 0.8)' : 'rgba(255, 0, 127, 0.8)');
      glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(cx, cy - 25, 45, 0, Math.PI * 2);
      ctx.fill();

      // Crystal Polygon
      ctx.fillStyle = cIdx % 2 === 0 ? '#00f5d4' : '#ff007f';
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx - 8, cy - 35);
      ctx.lineTo(cx, cy - 50);
      ctx.lineTo(cx + 8, cy - 35);
      ctx.closePath();
      ctx.fill();
    }

    ctx.restore();
  }

  drawWaterSurface(ctx, bounds) {
    ctx.save();

    // Multi-Harmonic Wave Surface
    const t = this.animTime;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.lineWidth = 3;

    ctx.beginPath();
    ctx.moveTo(bounds.left - 50, this.waterSurfaceY);
    for (let x = bounds.left - 50; x <= bounds.right + 50; x += 15) {
      const wy = this.waterSurfaceY 
        + Math.sin(x * 0.015 + t * 2.5) * 4 
        + Math.cos(x * 0.03 - t * 1.8) * 2;
      ctx.lineTo(x, wy);
    }
    ctx.stroke();

    // Foam highlights on crests
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    for (let x = bounds.left; x <= bounds.right; x += 80) {
      const wy = this.waterSurfaceY + Math.sin(x * 0.015 + t * 2.5) * 4;
      ctx.beginPath();
      ctx.arc(x, wy, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}
