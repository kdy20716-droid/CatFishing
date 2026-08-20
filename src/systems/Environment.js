/**
 * Dynamic Environment, Sky, Day/Sunset/Night Cycles, Ocean Shaders, and Seabed
 */

export class Environment {
  constructor() {
    this.timeOfDay = 'day'; // 'day', 'sunset', 'night'
    this.timeProgress = 0.15; // 0.0 to 1.0 (Day: 0.0~0.4, Sunset: 0.4~0.65, Night: 0.65~1.0)
    this.cycleSpeed = 0.001; // Smooth natural cycle (~16.6 minutes for full day/night cycle)

    this.waterSurfaceY = 0;
    this.animTime = 0;

    // Ambient Particles
    this.bubbles = [];
    this.plankton = [];
    this.shootingStars = [];
    this.clouds = [];

    this.initClouds();
    this.initPlankton();
  }

  initClouds() {
    for (let i = 0; i < 8; i++) {
      this.clouds.push({
        x: (Math.random() - 0.3) * 3000,
        y: -180 - Math.random() * 150,
        speed: 10 + Math.random() * 15,
        width: 120 + Math.random() * 140,
        height: 40 + Math.random() * 30
      });
    }
  }

  initPlankton() {
    for (let i = 0; i < 45; i++) {
      this.plankton.push({
        x: (Math.random() - 0.2) * 3200,
        y: 50 + Math.random() * 2200,
        size: 1.5 + Math.random() * 2.5,
        alpha: 0.3 + Math.random() * 0.5,
        pulseSpeed: 1 + Math.random() * 2,
        driftSpeedX: (Math.random() - 0.5) * 10,
        driftSpeedY: -5 - Math.random() * 15
      });
    }
  }

  getTimeInfo() {
    let phase = '낮 ☀️';
    let icon = '☀️';
    if (this.timeProgress >= 0.38 && this.timeProgress < 0.65) {
      phase = '노을 🌅';
      icon = '🌅';
    } else if (this.timeProgress >= 0.65 || this.timeProgress < 0.08) {
      phase = '밤 🌌';
      icon = '🌌';
    }
    return {
      progress: this.timeProgress,
      timeOfDay: this.timeOfDay,
      phase,
      icon
    };
  }

  update(dt, soundEngine) {
    this.animTime += dt;

    // Peaceful natural continuous time passage
    this.timeProgress = (this.timeProgress + this.cycleSpeed * dt) % 1.0;
    if (this.timeProgress < 0.38) this.timeOfDay = 'day';
    else if (this.timeProgress < 0.65) this.timeOfDay = 'sunset';
    else this.timeOfDay = 'night';

    if (soundEngine) {
      soundEngine.setTimeOfDay(this.timeOfDay);
    }

    // Update Clouds
    this.clouds.forEach(c => {
      c.x += c.speed * dt;
      if (c.x > 3500) c.x = -800;
    });

    // Update Plankton & Dust
    this.plankton.forEach(p => {
      p.x += p.driftSpeedX * dt;
      p.y += p.driftSpeedY * dt;
      if (p.y < 30) p.y = 2200;
      if (p.x < -400) p.x = 3400;
      if (p.x > 3400) p.x = -400;
    });

    // Spawn Bubble occasionally
    if (Math.random() < 0.35) {
      this.bubbles.push({
        x: (Math.random() - 0.2) * 3000,
        y: 200 + Math.random() * 2000,
        size: 2 + Math.random() * 4,
        vy: -40 - Math.random() * 50,
        vx: (Math.random() - 0.5) * 10
      });
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

    // Shooting Stars at night
    if (this.timeOfDay === 'night' && Math.random() < 0.012) {
      this.shootingStars.push({
        x: Math.random() * 2000,
        y: -350 - Math.random() * 50,
        vx: 400 + Math.random() * 200,
        vy: 200 + Math.random() * 100,
        life: 0.8
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
      // Twinkling Stars & Crescent Moon
      // Twinkling stars
      for (let i = 0; i < 40; i++) {
        const starX = bounds.left + ((i * 137.5) % (bounds.right - bounds.left));
        const starY = skyTop + ((i * 83.2) % (skyBottom - skyTop - 80));
        const twinkle = 0.5 + Math.sin(this.animTime * 4 + i) * 0.4;
        ctx.fillStyle = `rgba(255, 255, 255, ${twinkle})`;
        ctx.beginPath();
        ctx.arc(starX, starY, 1.5 + (i % 3) * 0.8, 0, Math.PI * 2);
        ctx.fill();
      }

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

  drawOcean(ctx, bounds) {
    const oceanTop = this.waterSurfaceY;
    const oceanBottom = 10600; // 500m+ depth (1m = 20px -> 500m = 10000px)

    // Multi-Zone Underwater Depth Gradient (0m ~ 500m+)
    const oceanGrad = ctx.createLinearGradient(0, oceanTop, 0, oceanBottom);

    if (this.timeOfDay === 'night') {
      oceanGrad.addColorStop(0, '#001845');      // Surface (0m)
      oceanGrad.addColorStop(0.08, '#023e8a');   // Shallow (30m)
      oceanGrad.addColorStop(0.22, '#03045e');   // Mid (100m)
      oceanGrad.addColorStop(0.5, '#10002b');    // Deep (250m)
      oceanGrad.addColorStop(0.78, '#240046');   // Abyss (400m)
      oceanGrad.addColorStop(1.0, '#030108');    // Hadal (500m+)
    } else if (this.timeOfDay === 'sunset') {
      oceanGrad.addColorStop(0, '#3a86ff');
      oceanGrad.addColorStop(0.08, '#0077b6');
      oceanGrad.addColorStop(0.22, '#023e8a');
      oceanGrad.addColorStop(0.5, '#240046');
      oceanGrad.addColorStop(0.78, '#3c096c');
      oceanGrad.addColorStop(1.0, '#0b090a');
    } else {
      // Day
      oceanGrad.addColorStop(0, '#48cae4');      // Sparkling Turquoise (0m)
      oceanGrad.addColorStop(0.08, '#0096c7');   // Aquamarine (30m)
      oceanGrad.addColorStop(0.22, '#0077b6');   // Sapphire Blue (100m)
      oceanGrad.addColorStop(0.5, '#03045e');    // Deep Midnight Indigo (250m)
      oceanGrad.addColorStop(0.78, '#10002b');   // Hadal Cosmic Purple (400m)
      oceanGrad.addColorStop(1.0, '#020005');    // Outer Abyss Void (500m+)
    }

    ctx.fillStyle = oceanGrad;
    ctx.fillRect(bounds.left - 400, oceanTop, bounds.right - bounds.left + 800, oceanBottom - oceanTop);

    // Underwater Sun Rays (God Rays) near surface (0 ~ 800px)
    if (this.timeOfDay !== 'night') {
      ctx.save();
      const rayCount = 8;
      for (let i = 0; i < rayCount; i++) {
        const rx = 300 + i * 350 + Math.sin(this.animTime * 0.8 + i) * 80;
        const rayGrad = ctx.createLinearGradient(rx, oceanTop, rx + 180, oceanTop + 800);
        rayGrad.addColorStop(0, 'rgba(255, 255, 255, 0.20)');
        rayGrad.addColorStop(0.6, 'rgba(255, 255, 255, 0.05)');
        rayGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');

        ctx.fillStyle = rayGrad;
        ctx.beginPath();
        ctx.moveTo(rx - 40, oceanTop);
        ctx.lineTo(rx + 90, oceanTop);
        ctx.lineTo(rx + 260, oceanTop + 800);
        ctx.lineTo(rx + 50, oceanTop + 800);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    }

    // Depth Markers & Zone Headers across 0m ~ 500m
    ctx.save();
    const zoneHeaders = [
      { depth: 5, title: '🌊 [표층 바다 / Shallow Zone 0~30m]', color: '#a0c4ff' },
      { depth: 32, title: '🌅 [중층 바다 / Twilight Zone 30~100m]', color: '#80ffdb' },
      { depth: 105, title: '🌌 [심해 어둠층 / Midnight Zone 100~250m]', color: '#c77dff' },
      { depth: 255, title: '🪐 [심연의 해구 / Abyssal Trench 250~400m]', color: '#ffd166' },
      { depth: 405, title: '👑 [미지의 초심연 / Hadal Realm 400~500m+]', color: '#ff007f' }
    ];

    zoneHeaders.forEach(zh => {
      const zy = zh.depth * 20;
      ctx.fillStyle = zh.color;
      ctx.font = 'bold 15px sans-serif';
      ctx.fillText(zh.title, bounds.left + 30, zy);
    });

    for (let d = 25; d <= 500; d += 25) {
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

    // Plankton / Deep Bioluminescent Stardust
    ctx.save();
    this.plankton.forEach(p => {
      const pulse = Math.abs(Math.sin(this.animTime * p.pulseSpeed));
      ctx.fillStyle = this.timeOfDay === 'night' 
        ? `rgba(76, 201, 240, ${pulse})` 
        : `rgba(255, 255, 255, ${pulse})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();

    // Seabed Landscape (Reefs, Corals, Sunken Ruins at 500m)
    this.drawSeabed(ctx, bounds);

    // Water Surface Waves
    this.drawWaterSurface(ctx, bounds);
  }

  drawSeabed(ctx, bounds) {
    const seabedY = 10150; // 500m seabed floor
    ctx.save();

    // Sandy/Rocky bottom
    ctx.fillStyle = '#0a0908';
    ctx.beginPath();
    ctx.moveTo(bounds.left - 200, seabedY);
    for (let x = bounds.left - 200; x <= bounds.right + 200; x += 150) {
      const cy = seabedY + Math.sin(x * 0.005) * 40;
      ctx.lineTo(x, cy);
    }
    ctx.lineTo(bounds.right + 200, 10700);
    ctx.lineTo(bounds.left - 200, 10700);
    ctx.closePath();
    ctx.fill();

    // Ancient Sunken Atlantis Temple Columns
    const templeX = 2200;
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

    // Glowing Bioluminescent Crystals on Seabed
    for (let i = 0; i < 35; i++) {
      const cx = bounds.left + i * 220 + 80;
      const cy = seabedY + 5;
      const glow = ctx.createRadialGradient(cx, cy - 25, 2, cx, cy - 25, 45);
      glow.addColorStop(0, i % 2 === 0 ? 'rgba(0, 245, 212, 0.8)' : 'rgba(255, 0, 127, 0.8)');
      glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(cx, cy - 25, 45, 0, Math.PI * 2);
      ctx.fill();

      // Crystal Polygon
      ctx.fillStyle = i % 2 === 0 ? '#00f5d4' : '#ff007f';
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
