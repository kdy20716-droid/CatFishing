/**
 * Cat Character & Boat Rendering & Animation Entity
 */
import { Vector2 } from '../engine/Vector.js?v=5.0.0';

export class Cat {
  constructor(economy) {
    this.economy = economy;
    this.pos = new Vector2(240, 0); // World coordinates at Dock Pier
    this.state = 'IDLE'; // 'IDLE', 'CHARGE', 'CAST', 'WAITING', 'NIBBLE', 'REELING', 'CATCH'
    
    // Animation timers
    this.animTime = 0;
    this.blinkTimer = 2.0;
    this.isBlinking = false;
    this.celebrateTimer = 0;
    this.exclamationTimer = 0;
    this.saveTimer = 0;

    // 🎭 Radial Mood Emote System
    this.currentEmote = null; // 'joy', 'sad', 'angry', 'excited', 'tease'
    this.emoteTimer = 0;
    this.emoteIcon = '';
    this.emoteLabel = '';
    this.emoteParticles = [];
    
    // Facing direction: 1 (right) or -1 (left)
    this.facing = 1;

    // Water bobbing
    this.waterY = 0;
    this.bobOffset = 0;
    this.bobAngle = 0;

    // Movement speed
    this.velX = 0;

    // Load persisted position
    this.loadPosition();

    // Auto-save on page unload/refresh
    window.addEventListener('beforeunload', () => {
      this.savePosition();
    });
  }

  loadPosition() {
    try {
      const saved = localStorage.getItem('cozy_cat_player_pos_v1');
      if (saved) {
        const data = JSON.parse(saved);
        if (typeof data.x === 'number' && !isNaN(data.x)) {
          // Clamp to valid zone
          const currentBoat = this.economy ? this.economy.getCurrentBoat() : null;
          const maxX = currentBoat ? (currentBoat.maxTravelX || 2000) : 2000;
          this.pos.x = Math.max(230, Math.min(maxX, data.x));
        }
        if (data.facing === 1 || data.facing === -1) {
          this.facing = data.facing;
        }
      }
    } catch (e) {
      console.warn("Failed to load cat position:", e);
    }
  }

  savePosition() {
    try {
      const data = {
        x: this.pos.x,
        facing: this.facing
      };
      localStorage.setItem('cozy_cat_player_pos_v1', JSON.stringify(data));
    } catch (e) {}
  }

  update(dt, waterSurfaceY, boatInputAxis = 0) {
    this.animTime += dt;
    this.waterY = waterSurfaceY;

    // Boat movement
    const prevX = this.pos.x;
    const currentBoat = this.economy.getCurrentBoat();
    const speed = currentBoat.speed;
    const targetVelX = boatInputAxis * speed;
    this.velX += (targetVelX - this.velX) * 0.1;
    this.pos.x += this.velX * dt;

    // Periodic position save
    this.saveTimer += dt;
    if (this.saveTimer >= 1.5) {
      this.saveTimer = 0;
      this.savePosition();
    }

    // Clamp boat position to allowed zone (minX is right beside the wooden dock pier)
    const minX = 230;
    const maxX = currentBoat.maxTravelX || 2000;
    this.pos.x = Math.max(minX, Math.min(maxX, this.pos.x));
    this.deltaX = this.pos.x - prevX;

    if (boatInputAxis !== 0) {
      this.facing = boatInputAxis > 0 ? 1 : -1;
    }

    // Gentle wave floating physics
    const waveFreq = 1.8;
    let extraBob = 0;    // 🎭 Emote-specific body bobs & wobbles
    if (this.currentEmote === 'joy' && this.emoteTimer > 0) {
      extraBob = Math.sin(this.animTime * 14) * 6; // Happy hopping!
    } else if ((this.currentEmote === 'clap' || this.currentEmote === 'excited') && this.emoteTimer > 0) {
      extraBob = Math.abs(Math.sin(this.animTime * 16)) * 4; // Rhythmic clapping bounce!
    } else if (this.currentEmote === 'sad' && this.emoteTimer > 0) {
      extraBob = 3; // Slouching down
    }

    this.bobOffset = Math.sin(this.animTime * waveFreq + this.pos.x * 0.01) * 4 + extraBob;
    this.bobAngle = Math.cos(this.animTime * waveFreq + this.pos.x * 0.01) * 0.04;
    this.pos.y = this.waterY + this.bobOffset;

    // Eye blinking
    this.blinkTimer -= dt;
    if (this.blinkTimer <= 0) {
      this.isBlinking = true;
      if (this.blinkTimer <= -0.15) {
        this.isBlinking = false;
        this.blinkTimer = 2.5 + Math.random() * 3.0;
      }
    }

    // State timers
    if (this.celebrateTimer > 0) {
      this.celebrateTimer -= dt;
      if (this.celebrateTimer <= 0) {
        this.state = 'IDLE';
      }
    }

    if (this.exclamationTimer > 0) {
      this.exclamationTimer -= dt;
    }

    // 🎭 Update Emote Timer & Particles
    if (this.emoteTimer > 0) {
      this.emoteTimer -= dt;
      if (this.emoteTimer <= 0) {
        this.currentEmote = null;
      }

      // Continuous particle emissions
      if (Math.random() < 0.35) {
        if (this.currentEmote === 'joy') {
          this.emoteParticles.push({
            x: (Math.random() - 0.5) * 35,
            y: -50 - Math.random() * 20,
            vx: (Math.random() - 0.5) * 25,
            vy: -20 - Math.random() * 25,
            symbol: Math.random() > 0.4 ? '✨' : '💛',
            size: 14 + Math.random() * 6,
            alpha: 1.0,
            fadeSpeed: 1.2
          });
        } else if (this.currentEmote === 'sad') {
          this.emoteParticles.push({
            x: (Math.random() - 0.5) * 20 + 8 * this.facing,
            y: -30,
            vx: (Math.random() - 0.5) * 15,
            vy: 25 + Math.random() * 35,
            symbol: Math.random() > 0.5 ? '💧' : '🫧',
            size: 14 + Math.random() * 4,
            alpha: 1.0,
            fadeSpeed: 1.4
          });
        } else if (this.currentEmote === 'angry') {
          this.emoteParticles.push({
            x: (Math.random() - 0.5) * 30,
            y: -55 - Math.random() * 15,
            vx: (Math.random() - 0.5) * 20,
            vy: -25 - Math.random() * 25,
            symbol: Math.random() > 0.4 ? '💢' : '💨',
            size: 15 + Math.random() * 6,
            alpha: 1.0,
            fadeSpeed: 1.5
          });
        } else if (this.currentEmote === 'clap' || this.currentEmote === 'excited') {
          this.emoteParticles.push({
            x: (Math.random() - 0.5) * 35,
            y: -45 - Math.random() * 20,
            vx: (Math.random() - 0.5) * 30,
            vy: -25 - Math.random() * 30,
            symbol: ['👏', '✨', '🎵', '🌟'][Math.floor(Math.random() * 4)],
            size: 15 + Math.random() * 6,
            alpha: 1.0,
            fadeSpeed: 1.1
          });
        } else if (this.currentEmote === 'tease') {
          this.emoteParticles.push({
            x: (Math.random() - 0.5) * 30,
            y: -45 - Math.random() * 20,
            vx: (Math.random() - 0.5) * 25,
            vy: -15 - Math.random() * 25,
            symbol: Math.random() > 0.4 ? '🐾' : '💖',
            size: 14 + Math.random() * 6,
            alpha: 1.0,
            fadeSpeed: 1.2
          });
        }
      }
    }

    // Update emote particles
    for (let i = this.emoteParticles.length - 1; i >= 0; i--) {
      const p = this.emoteParticles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.alpha -= dt * (p.fadeSpeed || 1.2);
      if (p.alpha <= 0) this.emoteParticles.splice(i, 1);
    }
  }

  triggerEmote(emoteId) {
    this.currentEmote = emoteId;
    this.emoteTimer = 4.0;

    const emoteMap = {
      joy: { icon: '😊', label: '기쁨' },
      clap: { icon: '👏', label: '박수' },
      excited: { icon: '👏', label: '박수' },
      tease: { icon: '😜', label: '조롱' },
      sad: { icon: '😭', label: '슬픔' },
      angry: { icon: '😡', label: '분노' }
    };

    const info = emoteMap[emoteId] || { icon: '🐾', label: '이모션' };
    this.emoteIcon = info.icon;
    this.emoteLabel = info.label;

    // Burst initial particles
    for (let i = 0; i < 5; i++) {
      this.emoteParticles.push({
        x: (Math.random() - 0.5) * 30,
        y: -45 - Math.random() * 20,
        vx: (Math.random() - 0.5) * 45,
        vy: -25 - Math.random() * 35,
        symbol: info.icon,
        size: 16 + Math.random() * 6,
        alpha: 1.0,
        fadeSpeed: 1.0
      });
    }
  }

  triggerNibble() {
    this.exclamationTimer = 1.2;
    this.state = 'NIBBLE';
  }

  triggerCatch() {
    this.celebrateTimer = 2.2;
    this.state = 'CATCH';
  }

  getRodTipPos() {
    // Returns world coordinate where the fishing line starts from rod tip
    const rodLength = 48;
    let angle = -Math.PI / 4; // 45 deg upwards to the right

    if (this.state === 'CHARGE') {
      angle = -Math.PI * 0.65; // Pulled back
    } else if (this.state === 'CAST') {
      angle = -Math.PI * 0.15; // Whipped forward
    } else if (this.state === 'REELING') {
      angle = -Math.PI / 3 + Math.sin(this.animTime * 15) * 0.08; // Straining
    }

    const catHandX = this.pos.x + 14 * this.facing;
    const catHandY = this.pos.y - 20;

    const tipX = catHandX + Math.cos(angle) * rodLength * this.facing;
    const tipY = catHandY + Math.sin(angle) * rodLength;

    return new Vector2(tipX, tipY);
  }

  draw(ctx, customName = null) {
    ctx.save();
    ctx.translate(this.pos.x, this.pos.y);
    ctx.rotate(this.bobAngle);

    // Draw Boat first (under cat)
    this.drawBoat(ctx);

    // Draw Cat
    this.drawCatBody(ctx);

    // Draw Hat
    this.drawHat(ctx);

    // Draw Fishing Rod in hands
    this.drawFishingRod(ctx);

    // Draw Exclamation / Emotion Popups
    this.drawEmotions(ctx);

    ctx.restore();

    // Draw Player Name Tag above Cat
    if (customName) {
      this.drawNameTag(ctx, customName);
    }
  }

  drawNameTag(ctx, name) {
    if (!name) return;
    ctx.save();
    const tagX = this.pos.x;
    const tagY = this.pos.y - 65;

    ctx.font = 'bold 12px "Pretendard", "Gaegu", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const textWidth = ctx.measureText(name).width;
    const tagWidth = textWidth + 22;
    const tagHeight = 20;

    // Background Shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.25)';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetY = 2;

    // Background Pill
    ctx.fillStyle = 'rgba(255, 255, 255, 0.94)';
    ctx.beginPath();
    ctx.roundRect(tagX - tagWidth / 2, tagY - tagHeight / 2, tagWidth, tagHeight, 10);
    ctx.fill();

    // Reset shadow for crisp border
    ctx.shadowColor = 'transparent';
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Online Green / Gold Dot
    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.arc(tagX - textWidth / 2 - 2, tagY, 3, 0, Math.PI * 2);
    ctx.fill();

    // Text
    ctx.fillStyle = '#1e293b';
    ctx.fillText(name, tagX + 4, tagY + 0.5);

    ctx.restore();
  }

  drawBoat(ctx) {
    if (!this.economy || typeof this.economy.getCurrentBoat !== 'function') return;
    const boat = this.economy.getCurrentBoat();
    if (!boat) return;
    const type = boat.drawType || 'rowboat';

    ctx.save();
    ctx.scale(this.facing, 1);

    if (type === 'raft') {
      // 🪵 1. Wooden Raft (통나무 뗏목)
      ctx.fillStyle = '#8b5a2b';
      ctx.strokeStyle = '#582f0e';
      ctx.lineWidth = 2.5;

      // 5 Heavy Wooden Logs
      for (let i = -2; i <= 2; i++) {
        ctx.beginPath();
        ctx.roundRect(i * 18 - 8, -2, 16, 15, 6);
        ctx.fill();
        ctx.stroke();
      }

      // Strong Hemp Binding Ropes
      ctx.strokeStyle = '#fef08a';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(-46, 2);
      ctx.lineTo(46, 2);
      ctx.moveTo(-46, 8);
      ctx.lineTo(46, 8);
      ctx.stroke();

      // Small wooden flag post at stern
      ctx.strokeStyle = '#6f4e37';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-36, 0);
      ctx.lineTo(-36, -24);
      ctx.stroke();

      // Cozy Triangular Cloth Flag
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.moveTo(-36, -24);
      ctx.lineTo(-18, -18);
      ctx.lineTo(-36, -12);
      ctx.closePath();
      ctx.fill();

    } else if (type === 'duck') {
      // 🦆 2. Cozy Yellow Duck Pedal Boat (포근 오리 페달보트)
      ctx.fillStyle = '#f59e0b';
      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 3;

      // Duck Body Boat Hull
      ctx.beginPath();
      ctx.roundRect(-52, -10, 104, 26, 12);
      ctx.fill();
      ctx.stroke();

      // Duck Inner Seat Rim
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.roundRect(-35, -12, 55, 8, 4);
      ctx.fill();

      // Giant Duck Head at Bow
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.arc(46, -20, 16, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Cute Duck Beak
      ctx.fillStyle = '#ea580c';
      ctx.beginPath();
      ctx.moveTo(56, -23);
      ctx.lineTo(76, -18);
      ctx.lineTo(56, -13);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#c2410c';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Duck Eye `•`
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.arc(50, -23, 3, 0, Math.PI * 2);
      ctx.fill();
      // Eye Sparkle
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(49, -24, 1, 0, Math.PI * 2);
      ctx.fill();

      // Duck Wing on Side
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.ellipse(-8, 0, 18, 9, 0.1, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

    } else if (type === 'rowboat') {
      // 🚣 3. Classic Cozy Rowboat (낭만 조각배)
      ctx.fillStyle = '#a16207';
      ctx.strokeStyle = '#713f12';
      ctx.lineWidth = 3;

      ctx.beginPath();
      ctx.moveTo(-54, -10);
      ctx.quadraticCurveTo(-25, 16, 0, 18);
      ctx.quadraticCurveTo(35, 16, 62, -10);
      ctx.lineTo(50, -10);
      ctx.quadraticCurveTo(30, 8, 0, 8);
      ctx.quadraticCurveTo(-30, 8, -46, -10);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Boat inner wooden floor
      ctx.fillStyle = '#ca8a04';
      ctx.beginPath();
      ctx.ellipse(0, -6, 48, 7, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Wooden Oar (노) Resting on Side
      ctx.strokeStyle = '#eab308';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-20, -18);
      ctx.lineTo(24, 16);
      ctx.stroke();
      // Oar Paddle
      ctx.fillStyle = '#ca8a04';
      ctx.beginPath();
      ctx.ellipse(24, 16, 5, 10, -0.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Warm Cozy Lantern at Stern
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(-48, -22, 6, 14);
      const glow = ctx.createRadialGradient(-45, -16, 2, -45, -16, 18);
      glow.addColorStop(0, 'rgba(255, 214, 10, 0.95)');
      glow.addColorStop(1, 'rgba(255, 214, 10, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(-45, -16, 18, 0, Math.PI * 2);
      ctx.fill();

    } else if (type === 'motorboat') {
      // 🚤 4. Speed Motorboat (쾌속 모터보트)
      ctx.fillStyle = '#ef4444';
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 3;

      // Sharp streamlined hull
      ctx.beginPath();
      ctx.moveTo(-58, -12);
      ctx.lineTo(-48, 16);
      ctx.lineTo(46, 16);
      ctx.lineTo(76, -12);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Racing Stripe (White & Navy)
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(-54, -2, 122, 6);

      // Glass Windshield
      ctx.fillStyle = 'rgba(56, 189, 248, 0.65)';
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(18, -12);
      ctx.lineTo(36, -26);
      ctx.lineTo(44, -12);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Heavy Outboard Motor at Stern
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.roundRect(-66, -18, 14, 30, 3);
      ctx.fill();
      ctx.stroke();

      // Motor Propeller Wake/Bubble
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.beginPath();
      ctx.arc(-72, 8, 4 + Math.sin(this.animTime * 15) * 2, 0, Math.PI * 2);
      ctx.fill();

    } else if (type === 'jetski') {
      // ⚡ 5. Cyber Neon Jet Ski (사이버 네온 제트스키)
      ctx.fillStyle = '#0f172a';
      ctx.strokeStyle = '#00f5d4';
      ctx.lineWidth = 3;

      // Aggressive Jet Ski Hull
      ctx.beginPath();
      ctx.moveTo(-50, -10);
      ctx.lineTo(-40, 14);
      ctx.lineTo(48, 14);
      ctx.lineTo(74, -8);
      ctx.lineTo(52, -18);
      ctx.lineTo(-20, -18);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Neon Magenta Accent Decal
      ctx.fillStyle = '#ff007f';
      ctx.beginPath();
      ctx.moveTo(-35, -8);
      ctx.lineTo(45, -8);
      ctx.lineTo(60, -2);
      ctx.lineTo(-30, -2);
      ctx.closePath();
      ctx.fill();

      // Handlebar & Sporty Screen
      ctx.strokeStyle = '#00f5d4';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(28, -18);
      ctx.lineTo(34, -30);
      ctx.lineTo(24, -30);
      ctx.stroke();

      // High-pressure Jet Spray Wake
      ctx.fillStyle = 'rgba(0, 245, 212, 0.75)';
      ctx.beginPath();
      ctx.arc(-58, 6, 6 + Math.sin(this.animTime * 20) * 3, 0, Math.PI * 2);
      ctx.arc(-68, 0, 4 + Math.sin(this.animTime * 20) * 2, 0, Math.PI * 2);
      ctx.fill();

    } else if (type === 'trawler') {
      // 🚢 6. Oceanic Trawler (원양 트롤러 어선)
      ctx.fillStyle = '#1e3a8a';
      ctx.strokeStyle = '#172554';
      ctx.lineWidth = 3.5;

      // Heavy Steel Oceanic Hull
      ctx.beginPath();
      ctx.moveTo(-64, -16);
      ctx.lineTo(-52, 18);
      ctx.lineTo(50, 18);
      ctx.lineTo(82, -16);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Lower Hull Red Waterline
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.moveTo(-52, 6);
      ctx.lineTo(-52, 18);
      ctx.lineTo(50, 18);
      ctx.lineTo(58, 6);
      ctx.closePath();
      ctx.fill();

      // Orange Wheelhouse Cabin at Stern
      ctx.fillStyle = '#ea580c';
      ctx.fillRect(-50, -42, 32, 28);
      ctx.strokeStyle = '#9a3412';
      ctx.lineWidth = 2;
      ctx.strokeRect(-50, -42, 32, 28);

      // Cabin Windows
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(-45, -36, 10, 10);
      ctx.fillRect(-30, -36, 8, 10);

      // Radar Mast & Rotating Radar
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-34, -42);
      ctx.lineTo(-34, -58);
      ctx.stroke();

      const radarRot = Math.sin(this.animTime * 6) * 8;
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(-40 + radarRot, -60, 12, 3);

    } else if (type === 'catamaran') {
      // ⛵ 7. Sport Twin-Hull Catamaran (쌍동선 스포츠 카타마란)
      ctx.fillStyle = '#0284c7';
      ctx.strokeStyle = '#0369a1';
      ctx.lineWidth = 3;

      // Dual Floats / Hulls
      // Lower Hull
      ctx.beginPath();
      ctx.roundRect(-65, 4, 130, 14, 7);
      ctx.fill();
      ctx.stroke();

      // Central Deck Trampoline
      ctx.fillStyle = '#38bdf8';
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(-42, -12, 84, 16, 4);
      ctx.fill();
      ctx.stroke();

      // Tall Carbon Fiber Mast
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(8, -12);
      ctx.lineTo(8, -62);
      ctx.stroke();

      // Sport Sail (Cyan & White Triangles)
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(8, -58);
      ctx.lineTo(44, -20);
      ctx.lineTo(8, -16);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Sail Stripes
      ctx.fillStyle = '#0ea5e9';
      ctx.beginPath();
      ctx.moveTo(8, -46);
      ctx.lineTo(34, -22);
      ctx.lineTo(8, -32);
      ctx.closePath();
      ctx.fill();

    } else if (type === 'cruiser') {
      // 🛳️ 6. Luxury Yacht Cruiser (럭셔리 요트 크루저)
      ctx.fillStyle = '#f8fafc';
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 3;

      // Sleek Monocoque Hull
      ctx.beginPath();
      ctx.moveTo(-66, -14);
      ctx.lineTo(-52, 18);
      ctx.lineTo(48, 18);
      ctx.lineTo(84, -14);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Royal Blue & Gold Stripes
      ctx.fillStyle = '#0369a1';
      ctx.fillRect(-60, -2, 134, 6);
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(-58, 4, 120, 2);

      // Deck Sunshade & Cockpit
      ctx.fillStyle = 'rgba(14, 165, 233, 0.4)';
      ctx.beginPath();
      ctx.moveTo(15, -14);
      ctx.lineTo(40, -30);
      ctx.lineTo(54, -14);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#0284c7';
      ctx.stroke();

      // Cat Flag fluttering at Stern
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-52, -14);
      ctx.lineTo(-52, -48);
      ctx.stroke();

      ctx.fillStyle = '#ec4899';
      ctx.beginPath();
      ctx.moveTo(-52, -48);
      ctx.lineTo(-26, -40);
      ctx.lineTo(-52, -32);
      ctx.closePath();
      ctx.fill();

      // Paw on Flag
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(-42, -40, 3, 0, Math.PI * 2);
      ctx.fill();

    } else if (type === 'submarine') {
      // 潜 7. Cat Submarine (고양이 잠수함)
      ctx.fillStyle = '#eab308';
      ctx.strokeStyle = '#ca8a04';
      ctx.lineWidth = 3.5;

      // Submarine Oval Hull
      ctx.beginPath();
      ctx.roundRect(-66, -18, 132, 36, 18);
      ctx.fill();
      ctx.stroke();

      // Porthole Glass Window
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(-18, 0, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#0369a1';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Cat Ear Periscope Tower
      ctx.fillStyle = '#ca8a04';
      ctx.fillRect(-42, -38, 12, 22);
      ctx.beginPath();
      ctx.moveTo(-46, -38);
      ctx.lineTo(-36, -50);
      ctx.lineTo(-30, -38);
      ctx.closePath();
      ctx.fill();

      // Rotating Rear Propeller
      const propAngle = this.animTime * 14;
      ctx.save();
      ctx.translate(-72, 0);
      ctx.rotate(propAngle);
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(-4, -14, 8, 28);
      ctx.restore();

    } else if (type === 'hyper') {
      // 🛸 8. Hyper Cosmic Space Skiff (하이퍼 코스믹 비행정)
      ctx.fillStyle = '#3b0764';
      ctx.strokeStyle = '#c084fc';
      ctx.lineWidth = 3.5;

      // Futuristic Saucer Hull
      ctx.beginPath();
      ctx.ellipse(0, 0, 72, 20, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Glowing Neon Energy Rings
      ctx.strokeStyle = '#a855f7';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(0, 0, 60, 12, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Anti-Gravity Plasma Thrusters Pulse
      const pulse = Math.abs(Math.sin(this.animTime * 10));
      ctx.fillStyle = `rgba(34, 211, 238, ${0.7 + pulse * 0.3})`;
      ctx.beginPath();
      ctx.ellipse(0, 16, 36, 8, 0, 0, Math.PI * 2);
      ctx.fill();

      // Plasma Particles
      ctx.fillStyle = '#a5f3fc';
      ctx.beginPath();
      ctx.arc(Math.sin(this.animTime * 8) * 20, 20, 3, 0, Math.PI * 2);
      ctx.arc(Math.cos(this.animTime * 8) * 20, 20, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  drawCatBody(ctx) {
    ctx.save();
    ctx.scale(this.facing, 1);

    // Dynamic Skin Palette from Economy
    const skin = (this.economy && this.economy.getCurrentCatSkin) 
      ? this.economy.getCurrentCatSkin() 
      : { colors: { body: '#f4a261', stripe: '#e76f51', belly: '#fefae0', innerEar: '#ffafcc', paw: '#ffafcc' } };
    
    const bodyColor = skin.colors.body;
    const stripeColor = skin.colors.stripe;
    const bellyColor = skin.colors.belly;
    const innerEarColor = skin.colors.innerEar;
    const pink = '#ffafcc';

    // 1. Tail (swaying animatedly)
    const tailWiggle = Math.sin(this.animTime * 3) * 0.25;
    ctx.strokeStyle = bodyColor;
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-12, -12);
    ctx.quadraticCurveTo(-26 + tailWiggle * 10, -22 + tailWiggle * 8, -28, -34);
    ctx.stroke();
    // Tail tip accent
    ctx.strokeStyle = bellyColor;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(-24, -28);
    ctx.lineTo(-28, -34);
    ctx.stroke();

    // 2. Body (plump round kitty)
    ctx.fillStyle = bodyColor;
    ctx.beginPath();
    ctx.ellipse(0, -18, 16, 14, 0, 0, Math.PI * 2);
    ctx.fill();

    // Special body markings (e.g. Calico spots, Tuxedo vest)
    if (skin.id === 'skin_calico') {
      // Black & Orange Calico patches
      ctx.fillStyle = '#2b2d42';
      ctx.beginPath();
      ctx.ellipse(-8, -22, 6, 5, -0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#e76f51';
      ctx.beginPath();
      ctx.ellipse(-4, -12, 7, 6, 0.4, 0, Math.PI * 2);
      ctx.fill();
    }

    // Belly (White/Cream)
    ctx.fillStyle = bellyColor;
    ctx.beginPath();
    if (skin.id === 'skin_tuxedo') {
      // Tuxedo white shirt chest patch
      ctx.ellipse(3, -16, 8, 11, 0, 0, Math.PI * 2);
    } else {
      ctx.ellipse(4, -16, 9, 10, 0, 0, Math.PI * 2);
    }
    ctx.fill();

    // 3. Head
    ctx.fillStyle = bodyColor;
    ctx.beginPath();
    ctx.arc(8, -32, 14, 0, Math.PI * 2);
    ctx.fill();

    // Siamese Dark Mask or Calico Head Spot
    if (skin.id === 'skin_siamese') {
      // Chocolate face mask around nose and eyes
      ctx.fillStyle = stripeColor; // dark chocolate
      ctx.beginPath();
      ctx.ellipse(9, -30, 8, 6, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (skin.id === 'skin_calico') {
      ctx.fillStyle = '#e76f51';
      ctx.beginPath();
      ctx.arc(3, -37, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#2b2d42';
      ctx.beginPath();
      ctx.arc(15, -36, 6, 0, Math.PI * 2);
      ctx.fill();
    }

    // Ears
    const isSad = (this.currentEmote === 'sad' && this.emoteTimer > 0);
    const isAngry = (this.currentEmote === 'angry' && this.emoteTimer > 0);

    // Left Ear (Droop if sad, flatten if angry)
    const leftEarTipY = isSad ? -44 : (isAngry ? -45 : -54);
    const leftEarTipX = isAngry ? -12 : -4;
    ctx.fillStyle = (skin.id === 'skin_siamese') ? stripeColor : bodyColor;
    ctx.beginPath();
    ctx.moveTo(0, -42);
    ctx.lineTo(leftEarTipX, leftEarTipY);
    ctx.lineTo(6, -45);
    ctx.closePath();
    ctx.fill();
    // Left inner ear
    ctx.fillStyle = innerEarColor || pink;
    ctx.beginPath();
    ctx.moveTo(1, -43);
    ctx.lineTo(leftEarTipX + 2, leftEarTipY + 4);
    ctx.lineTo(4, -45);
    ctx.closePath();
    ctx.fill();

    // Right Ear
    const rightEarTipY = isSad ? -44 : (isAngry ? -45 : -54);
    const rightEarTipX = isAngry ? 26 : 18;
    ctx.fillStyle = (skin.id === 'skin_siamese') ? stripeColor : bodyColor;
    ctx.beginPath();
    ctx.moveTo(12, -44);
    ctx.lineTo(rightEarTipX, rightEarTipY);
    ctx.lineTo(22, -41);
    ctx.closePath();
    ctx.fill();
    // Right inner ear
    ctx.fillStyle = innerEarColor || pink;
    ctx.beginPath();
    ctx.moveTo(13, -44);
    ctx.lineTo(rightEarTipX - 2, rightEarTipY + 4);
    ctx.lineTo(19, -42);
    ctx.closePath();
    ctx.fill();

    // Forehead Stripes / Patterns (for tabby and others)
    if (skin.id !== 'skin_white' && skin.id !== 'skin_siamese' && skin.id !== 'skin_tuxedo') {
      ctx.strokeStyle = stripeColor;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(6, -42);
      ctx.lineTo(6, -37);
      ctx.moveTo(10, -42);
      ctx.lineTo(10, -37);
      ctx.stroke();
    }

    // 4. Face & Eyes
    if (this.currentEmote === 'joy' && this.emoteTimer > 0) {
      // 😊 Joy: Happy `^‿^` closed smiling eyes
      ctx.strokeStyle = '#264653';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.arc(4, -33, 3.5, Math.PI, 0, false);
      ctx.arc(14, -33, 3.5, Math.PI, 0, false);
      ctx.stroke();
    } else if ((this.currentEmote === 'clap' || this.currentEmote === 'excited') && this.emoteTimer > 0) {
      // 👏 Clap: Starry sparkle eyes `★.★`
      ctx.fillStyle = '#f59e0b';
      ctx.font = 'bold 9px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('★', 4, -31);
      ctx.fillText('★', 14, -31);
    } else if (this.currentEmote === 'tease' && this.emoteTimer > 0) {
      // 😜 Tease: Winking left eye `>` and round right eye `.`
      ctx.strokeStyle = '#264653';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(1, -35);
      ctx.lineTo(6, -33);
      ctx.lineTo(1, -31);
      ctx.stroke();

      ctx.fillStyle = '#264653';
      ctx.beginPath();
      ctx.arc(14, -33, 3, 0, Math.PI * 2);
      ctx.fill();
    } else if (this.currentEmote === 'sad' && this.emoteTimer > 0) {
      // 😭 Sad: Crying teardrop lines `T_T`
      ctx.strokeStyle = '#264653';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(2, -35);
      ctx.lineTo(6, -35);
      ctx.moveTo(4, -35);
      ctx.lineTo(4, -28);
      ctx.moveTo(12, -35);
      ctx.lineTo(16, -35);
      ctx.moveTo(14, -35);
      ctx.lineTo(14, -28);
      ctx.stroke();

      // Tear streaks
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(4, -27, 2, 0, Math.PI * 2);
      ctx.arc(14, -27, 2, 0, Math.PI * 2);
      ctx.fill();
    } else if (this.currentEmote === 'angry' && this.emoteTimer > 0) {
      // 😡 Angry: Sharp slanted angry eyes `> <`
      ctx.strokeStyle = '#b91c1c';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(1, -36);
      ctx.lineTo(7, -32);
      ctx.moveTo(17, -36);
      ctx.lineTo(11, -32);
      ctx.stroke();
    } else if (this.state === 'CATCH') {
      // Happy `^‿^` closed eyes
      ctx.strokeStyle = '#264653';
      ctx.lineWidth = 2;
      ctx.beginPath();
      // Left eye
      ctx.arc(4, -33, 3.5, Math.PI, 0, false);
      // Right eye
      ctx.arc(14, -33, 3.5, Math.PI, 0, false);
      ctx.stroke();
    } else if (this.state === 'NIBBLE') {
      // Big startled round eyes O.O
      ctx.fillStyle = '#264653';
      ctx.beginPath();
      ctx.arc(5, -33, 4, 0, Math.PI * 2);
      ctx.arc(15, -33, 4, 0, Math.PI * 2);
      ctx.fill();
      // Eye reflection highlight
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(6.5, -34.5, 1.5, 0, Math.PI * 2);
      ctx.arc(16.5, -34.5, 1.5, 0, Math.PI * 2);
      ctx.fill();
    } else if (this.isBlinking) {
      // Blinking closed line
      ctx.strokeStyle = '#264653';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(2, -33);
      ctx.lineTo(8, -33);
      ctx.moveTo(12, -33);
      ctx.lineTo(18, -33);
      ctx.stroke();
    } else {
      // Normal cute calm eyes
      ctx.fillStyle = '#264653';
      ctx.beginPath();
      ctx.arc(5, -33, 3, 0, Math.PI * 2);
      ctx.arc(15, -33, 3, 0, Math.PI * 2);
      ctx.fill();
      // Sparkle
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(6, -34, 1.2, 0, Math.PI * 2);
      ctx.arc(16, -34, 1.2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Rosy Cheeks
    ctx.fillStyle = (this.currentEmote === 'joy' || this.currentEmote === 'excited') ? 'rgba(255, 90, 120, 0.65)' : 'rgba(255, 143, 163, 0.45)';
    ctx.beginPath();
    ctx.arc(2, -28, 3.2, 0, Math.PI * 2);
    ctx.arc(18, -28, 3.2, 0, Math.PI * 2);
    ctx.fill();

    // Cute Pink Nose & Whiskers
    ctx.fillStyle = pink;
    ctx.beginPath();
    ctx.moveTo(10, -30);
    ctx.lineTo(8, -28);
    ctx.lineTo(12, -28);
    ctx.closePath();
    ctx.fill();

    // Mouth `:3` / Open / Tease Tongue
    if (this.currentEmote === 'tease' && this.emoteTimer > 0) {
      // Pink Tongue sticking out!
      ctx.fillStyle = '#ff4d6d';
      ctx.strokeStyle = '#c9184a';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(10, -24, 3.5, 0, Math.PI);
      ctx.fill();
      ctx.stroke();
    } else if (this.currentEmote === 'sad' && this.emoteTimer > 0) {
      // Downward mouth
      ctx.strokeStyle = '#264653';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.arc(10, -23, 3, Math.PI, 0);
      ctx.stroke();
    } else if ((this.currentEmote === 'joy' || this.currentEmote === 'clap' || this.currentEmote === 'excited') && this.emoteTimer > 0) {
      // Open happy mouth `:D`
      ctx.fillStyle = '#d90429';
      ctx.beginPath();
      ctx.arc(10, -26, 3, 0, Math.PI);
      ctx.fill();
    } else {
      // Default cute `:3` mouth
      ctx.strokeStyle = '#264653';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(10, -28);
      ctx.lineTo(10, -26);
      ctx.moveTo(10, -26);
      ctx.quadraticCurveTo(7, -24, 6, -26);
      ctx.moveTo(10, -26);
      ctx.quadraticCurveTo(13, -24, 14, -26);
      ctx.stroke();
    }

    // Whiskers
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    // Left
    ctx.moveTo(1, -29);
    ctx.lineTo(-6, -31);
    ctx.moveTo(1, -27);
    ctx.lineTo(-5, -25);
    // Right
    ctx.moveTo(17, -29);
    ctx.lineTo(24, -31);
    ctx.moveTo(17, -27);
    ctx.lineTo(23, -25);
    ctx.stroke();

    // 5. Paws holding rod / Waving in joy / Clapping
    ctx.fillStyle = skin.colors.paw || bellyColor || '#ffffff';
    if ((this.currentEmote === 'clap' || this.currentEmote === 'excited') && this.emoteTimer > 0) {
      // 👏 Rhythmic Clapping Paws in front of chest
      const clapDist = Math.abs(Math.sin(this.animTime * 18)) * 5.5;
      ctx.beginPath();
      ctx.arc(8 - clapDist, -22, 4.5, 0, Math.PI * 2);
      ctx.arc(14 + clapDist, -22, 4.5, 0, Math.PI * 2);
      ctx.fill();

      // Sparkle on clap impact
      if (clapDist < 1.2) {
        ctx.fillStyle = '#ffd166';
        ctx.font = '11px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('✨', 11, -26);
      }
    } else if (this.state === 'CATCH' || (this.currentEmote === 'joy' && this.emoteTimer > 0)) {
      // Raised celebration paws!
      const pawWiggle = Math.sin(this.animTime * 12) * 3;
      ctx.beginPath();
      ctx.arc(0, -42 + pawWiggle, 4.5, 0, Math.PI * 2);
      ctx.arc(18, -42 - pawWiggle, 4.5, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.arc(12, -20, 4, 0, Math.PI * 2);
      ctx.arc(16, -22, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  drawHat(ctx) {
    if (!this.economy || typeof this.economy.getCurrentHat !== 'function') return;
    const hat = this.economy.getCurrentHat();
    if (!hat || hat.id === 'hat_none') return;

    ctx.save();
    ctx.scale(this.facing, 1);

    const type = hat.drawType;
    if (type === 'straw') {
      ctx.fillStyle = '#fef08a';
      ctx.strokeStyle = '#ca8a04';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(8, -48, 18, 5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(8, -50, 10, Math.PI, 0);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(0, -50, 16, 3);
    } else if (type === 'sailor') {
      ctx.fillStyle = '#f8fafc';
      ctx.strokeStyle = '#1e3a8a';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(0, -54, 16, 10, 3);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#1e3a8a';
      ctx.fillRect(0, -47, 16, 3);
    } else if (type === 'frog') {
      ctx.fillStyle = '#22c55e';
      ctx.beginPath();
      ctx.arc(8, -48, 12, Math.PI, 0);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(2, -54, 5, 0, Math.PI * 2);
      ctx.arc(14, -54, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(2, -54, 3, 0, Math.PI * 2);
      ctx.arc(14, -54, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(2, -54, 1.5, 0, Math.PI * 2);
      ctx.arc(14, -54, 1.5, 0, Math.PI * 2);
      ctx.fill();
    } else if (type === 'wizard') {
      // 🧙‍♂️ Starlight Wizard Hat (별빛 마법사 고깔모자)
      // 1. Hat Brim (신비로운 우주 보라빛 타원 챙)
      ctx.fillStyle = '#2e1065';
      ctx.strokeStyle = '#ffd166';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(8, -47, 18, 5.5, -0.05, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // 2. Wizard Hat Cone (위로 귀엽게 꺾인 마법 고깔)
      ctx.fillStyle = '#4c1d95';
      ctx.beginPath();
      ctx.moveTo(-2, -47);
      ctx.quadraticCurveTo(2, -60, 16, -68);
      ctx.quadraticCurveTo(12, -56, 18, -47);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // 3. Golden Ribbon Band
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.ellipse(8, -48, 11, 2.5, -0.05, 0, Math.PI * 2);
      ctx.fill();

      // 4. Sparkling Star at the Cone Tip
      const starPulse = 1.0 + Math.sin(this.animTime * 5) * 0.15;
      ctx.save();
      ctx.translate(16, -68);
      ctx.scale(starPulse, starPulse);
      ctx.shadowColor = '#ffd166';
      ctx.shadowBlur = 8;
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('⭐', 0, 0);
      ctx.restore();

      // 5. Floating Starlight Sparkle
      const sparkY = -56 + Math.sin(this.animTime * 3) * 3;
      ctx.fillStyle = '#fef08a';
      ctx.font = '8px sans-serif';
      ctx.fillText('✨', 3, sparkY);
    } else if (type === 'pirate') {
      ctx.fillStyle = '#0f172a';
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-6, -46);
      ctx.lineTo(8, -62);
      ctx.lineTo(22, -46);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 9px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('☠️', 8, -48);
    } else if (type === 'crown') {
      ctx.fillStyle = '#facc15';
      ctx.strokeStyle = '#ca8a04';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-2, -46);
      ctx.lineTo(-4, -56);
      ctx.lineTo(2, -50);
      ctx.lineTo(8, -60);
      ctx.lineTo(14, -50);
      ctx.lineTo(20, -56);
      ctx.lineTo(18, -46);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(8, -52, 2, 0, Math.PI * 2);
      ctx.fill();
    } else if (type === 'radar') {
      ctx.fillStyle = '#38bdf8';
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(8, -48, 11, Math.PI, 0);
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(8, -48);
      ctx.lineTo(8, -62);
      ctx.stroke();
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(8, -62, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  drawFishingRod(ctx) {
    if (this.state === 'CATCH') return; // Don't draw rod during celebration paws
    if (!this.economy || typeof this.economy.getCurrentRod !== 'function') return;
    const rod = this.economy.getCurrentRod();
    if (!rod) return;
    const rodColor = rod.color || '#8b5a2b';

    ctx.save();
    ctx.scale(this.facing, 1);

    const handX = 14;
    const handY = -20;

    let angle = -Math.PI / 4;
    if (this.state === 'CHARGE') {
      angle = -Math.PI * 0.65;
    } else if (this.state === 'CAST') {
      angle = -Math.PI * 0.15;
    } else if (this.state === 'REELING') {
      angle = -Math.PI / 3 + Math.sin(this.animTime * 15) * 0.08;
    }

    ctx.translate(handX, handY);
    ctx.rotate(angle);

    // Rod pole with gradient taper
    ctx.strokeStyle = rodColor;
    ctx.lineWidth = 3.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(48, 0);
    ctx.stroke();

    // Rod guide rings
    ctx.strokeStyle = '#adb5bd';
    ctx.lineWidth = 1.5;
    [16, 32, 47].forEach(rx => {
      ctx.beginPath();
      ctx.arc(rx, -2, 2, 0, Math.PI * 2);
      ctx.stroke();
    });

    // Reel Handle
    ctx.fillStyle = '#495057';
    ctx.beginPath();
    ctx.arc(8, 4, 3.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  drawEmotions(ctx) {
    // 1. Exclamation `!` on nibble
    if (this.exclamationTimer > 0) {
      ctx.save();
      ctx.translate(0, -70);
      const scale = Math.min(1.2, (1.2 - this.exclamationTimer) * 5);
      ctx.scale(scale, scale);

      ctx.fillStyle = '#ff0054';
      ctx.font = 'bold 24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('❗', 0, 0);
      ctx.restore();
    }

    // 2. Sparkles on Catch
    if (this.celebrateTimer > 0) {
      ctx.save();
      const sparkleCount = 6;
      for (let i = 0; i < sparkleCount; i++) {
        const ang = (i / sparkleCount) * Math.PI * 2 + this.animTime * 2;
        const rad = 40 + Math.sin(this.animTime * 6 + i) * 10;
        const sx = Math.cos(ang) * rad;
        const sy = Math.sin(ang) * rad - 35;

        ctx.fillStyle = i % 2 === 0 ? '#ffd166' : '#06d6a0';
        ctx.beginPath();
        ctx.arc(sx, sy, 3 + Math.sin(this.animTime * 8 + i) * 1.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // "냐앙~!" Speech bubble
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#ffb703';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(-30, -85, 60, 26, 8);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#d90429';
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('냐앙~! 🐟', 0, -68);
      ctx.restore();
    }

    // 3. 🎭 Active Mood Emote Floating Badge & Particles
    if (this.emoteTimer > 0 && this.emoteIcon) {
      ctx.save();
      const floatY = -85 + Math.sin(this.animTime * 4) * 3;
      const alpha = Math.min(1.0, this.emoteTimer * 2.0);
      ctx.globalAlpha = alpha;

      // Floating Emote Bubble Card
      const badgeWidth = 60;
      const badgeHeight = 28;

      ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2;
      ctx.shadowColor = 'rgba(245, 158, 11, 0.4)';
      ctx.shadowBlur = 10;

      ctx.beginPath();
      ctx.roundRect(-badgeWidth / 2, floatY - badgeHeight / 2, badgeWidth, badgeHeight, 14);
      ctx.fill();
      ctx.stroke();

      // Tail triangle pointing to cat
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.moveTo(-4, floatY + badgeHeight / 2);
      ctx.lineTo(4, floatY + badgeHeight / 2);
      ctx.lineTo(0, floatY + badgeHeight / 2 + 5);
      ctx.closePath();
      ctx.fill();

      // Emoji & Label Text
      ctx.shadowColor = 'transparent';
      ctx.font = '16px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(this.emoteIcon, -12, floatY);

      ctx.fillStyle = '#fef08a';
      ctx.font = 'bold 11px "Pretendard", "Segoe UI", sans-serif';
      ctx.fillText(this.emoteLabel, 12, floatY);

      ctx.restore();
    }

    // 4. Draw Emote Floating Particles
    if (this.emoteParticles && this.emoteParticles.length > 0) {
      ctx.save();
      this.emoteParticles.forEach(p => {
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.font = `${p.size}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(p.symbol, p.x, p.y);
      });
      ctx.restore();
    }
  }
}
