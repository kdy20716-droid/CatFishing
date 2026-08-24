/**
 * Cat Character & Boat Rendering & Animation Entity
 */
import { Vector2 } from '../engine/Vector.js';

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
    this.bobOffset = Math.sin(this.animTime * waveFreq + this.pos.x * 0.01) * 4;
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

    if (type === 'raft') {
      // Wooden Raft
      ctx.fillStyle = '#8b5a2b';
      ctx.strokeStyle = '#582f0e';
      ctx.lineWidth = 2.5;

      for (let i = -3; i <= 3; i++) {
        ctx.beginPath();
        ctx.roundRect(i * 14 - 10, -4, 20, 10, 5);
        ctx.fill();
        ctx.stroke();
      }

      // Ropes binding logs
      ctx.strokeStyle = '#e9d8a6';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-35, -2);
      ctx.lineTo(35, -2);
      ctx.stroke();

    } else if (type === 'rowboat') {
      // Classic Cozy Rowboat
      ctx.fillStyle = '#9c6644';
      ctx.strokeStyle = '#582f0e';
      ctx.lineWidth = 3;

      ctx.beginPath();
      ctx.moveTo(-45, -12);
      ctx.quadraticCurveTo(-20, 12, 0, 14);
      ctx.quadraticCurveTo(30, 12, 52, -12);
      ctx.lineTo(40, -12);
      ctx.quadraticCurveTo(25, 4, 0, 4);
      ctx.quadraticCurveTo(-25, 4, -38, -12);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Boat inner rim
      ctx.fillStyle = '#b08968';
      ctx.beginPath();
      ctx.ellipse(0, -10, 42, 6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Cozy Lantern at stern
      ctx.fillStyle = '#212529';
      ctx.fillRect(-38, -24, 6, 14);
      // Lantern Warm Glow
      const glow = ctx.createRadialGradient(-35, -18, 2, -35, -18, 16);
      glow.addColorStop(0, 'rgba(255, 214, 10, 0.9)');
      glow.addColorStop(1, 'rgba(255, 214, 10, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(-35, -18, 16, 0, Math.PI * 2);
      ctx.fill();

    } else if (type === 'cruiser') {
      // Fast Cruiser Boat
      ctx.fillStyle = '#f8f9fa';
      ctx.strokeStyle = '#0077b6';
      ctx.lineWidth = 3;

      ctx.beginPath();
      ctx.moveTo(-55, -14);
      ctx.lineTo(-45, 14);
      ctx.lineTo(35, 14);
      ctx.lineTo(65, -14);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Blue stripe
      ctx.fillStyle = '#0096c7';
      ctx.fillRect(-50, -4, 105, 6);

      // Cute Cat Flag
      ctx.strokeStyle = '#495057';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-45, -14);
      ctx.lineTo(-45, -42);
      ctx.stroke();

      // Flag fluttering
      ctx.fillStyle = '#ff70a6';
      ctx.beginPath();
      ctx.moveTo(-45, -42);
      ctx.lineTo(-22, -35);
      ctx.lineTo(-45, -28);
      ctx.closePath();
      ctx.fill();

      // Paw print on flag
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(-36, -35, 2.5, 0, Math.PI * 2);
      ctx.fill();

    } else if (type === 'submarine') {
      // Cute Yellow Cat Submarine
      ctx.fillStyle = '#ffb703';
      ctx.strokeStyle = '#fb8500';
      ctx.lineWidth = 3;

      // Sub hull
      ctx.beginPath();
      ctx.roundRect(-55, -16, 110, 32, 16);
      ctx.fill();
      ctx.stroke();

      // Round glass porthole
      ctx.fillStyle = '#8ecae6';
      ctx.beginPath();
      ctx.arc(-15, 0, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#023047';
      ctx.stroke();

      // Cat Ear Periscope
      ctx.strokeStyle = '#fb8500';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(-35, -16);
      ctx.lineTo(-35, -36);
      ctx.lineTo(-20, -36);
      ctx.stroke();

      // Small propeller at back
      const propAngle = this.animTime * 12;
      ctx.save();
      ctx.translate(-60, 0);
      ctx.rotate(propAngle);
      ctx.fillStyle = '#343a40';
      ctx.fillRect(-3, -12, 6, 24);
      ctx.restore();
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
    // Left Ear
    ctx.fillStyle = (skin.id === 'skin_siamese') ? stripeColor : bodyColor;
    ctx.beginPath();
    ctx.moveTo(0, -42);
    ctx.lineTo(-4, -54);
    ctx.lineTo(6, -45);
    ctx.closePath();
    ctx.fill();
    // Left inner ear
    ctx.fillStyle = innerEarColor || pink;
    ctx.beginPath();
    ctx.moveTo(1, -43);
    ctx.lineTo(-2, -50);
    ctx.lineTo(4, -45);
    ctx.closePath();
    ctx.fill();

    // Right Ear
    ctx.fillStyle = (skin.id === 'skin_siamese') ? stripeColor : bodyColor;
    ctx.beginPath();
    ctx.moveTo(12, -44);
    ctx.lineTo(18, -54);
    ctx.lineTo(22, -41);
    ctx.closePath();
    ctx.fill();
    // Right inner ear
    ctx.fillStyle = innerEarColor || pink;
    ctx.beginPath();
    ctx.moveTo(13, -44);
    ctx.lineTo(17, -50);
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
    if (this.state === 'CATCH') {
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
    ctx.fillStyle = 'rgba(255, 143, 163, 0.45)';
    ctx.beginPath();
    ctx.arc(2, -28, 3, 0, Math.PI * 2);
    ctx.arc(18, -28, 3, 0, Math.PI * 2);
    ctx.fill();

    // Cute Pink Nose & Whiskers
    ctx.fillStyle = pink;
    ctx.beginPath();
    ctx.moveTo(10, -30);
    ctx.lineTo(8, -28);
    ctx.lineTo(12, -28);
    ctx.closePath();
    ctx.fill();

    // Mouth `:3`
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

    // 5. Paws holding rod
    ctx.fillStyle = skin.colors.paw || bellyColor || '#ffffff';
    if (this.state === 'CATCH') {
      // Raised celebration paws!
      ctx.beginPath();
      ctx.arc(0, -42, 4, 0, Math.PI * 2);
      ctx.arc(18, -42, 4, 0, Math.PI * 2);
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
    if (!hat) return;
    const type = hat.drawType || 'none';
    if (type === 'none') return;

    ctx.save();
    ctx.scale(this.facing, 1);
    ctx.translate(8, -44); // Top of head

    if (type === 'straw') {
      // Straw Hat
      ctx.fillStyle = '#ffeaa7';
      ctx.strokeStyle = '#fdcb6e';
      ctx.lineWidth = 2;

      // Brim
      ctx.beginPath();
      ctx.ellipse(0, 2, 22, 5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Crown
      ctx.beginPath();
      ctx.roundRect(-10, -10, 20, 12, 4);
      ctx.fill();
      ctx.stroke();

      // Red ribbon
      ctx.fillStyle = '#e63946';
      ctx.fillRect(-10, -2, 20, 4);

    } else if (type === 'sailor') {
      // Sailor Cap
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#0077b6';
      ctx.lineWidth = 2;

      ctx.beginPath();
      ctx.ellipse(0, 0, 16, 6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Blue ribbon tails behind
      ctx.fillStyle = '#03045e';
      ctx.fillRect(-12, 2, 6, 12);
      ctx.fillRect(-8, 2, 5, 14);

    } else if (type === 'frog') {
      // Cute Frog Hood
      ctx.fillStyle = '#52b788';
      ctx.strokeStyle = '#2d6a4f';
      ctx.lineWidth = 2;

      // Hood arch
      ctx.beginPath();
      ctx.arc(0, 4, 17, Math.PI, 0, false);
      ctx.fill();
      ctx.stroke();

      // Frog Eyes
      ctx.beginPath();
      ctx.arc(-10, -8, 6, 0, Math.PI * 2);
      ctx.arc(10, -8, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Black pupils
      ctx.fillStyle = '#1b4332';
      ctx.beginPath();
      ctx.arc(-10, -8, 2.5, 0, Math.PI * 2);
      ctx.arc(10, -8, 2.5, 0, Math.PI * 2);
      ctx.fill();

    } else if (type === 'wizard') {
      // Wizard Cone
      ctx.fillStyle = '#5e548e';
      ctx.strokeStyle = '#9f86c0';
      ctx.lineWidth = 2;

      // Cone
      ctx.beginPath();
      ctx.moveTo(-14, 2);
      ctx.lineTo(4, -28);
      ctx.lineTo(14, 2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Gold stars on hat
      ctx.fillStyle = '#ffbe0b';
      ctx.beginPath();
      ctx.arc(0, -10, 2.5, 0, Math.PI * 2);
      ctx.arc(4, -18, 2, 0, Math.PI * 2);
      ctx.fill();

    } else if (type === 'pirate') {
      // Pirate Tricorn
      ctx.fillStyle = '#212529';
      ctx.strokeStyle = '#ffd166';
      ctx.lineWidth = 2;

      ctx.beginPath();
      ctx.moveTo(-20, 2);
      ctx.lineTo(-14, -12);
      ctx.lineTo(0, -8);
      ctx.lineTo(14, -12);
      ctx.lineTo(20, 2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Golden skull/paw
      ctx.fillStyle = '#ffd166';
      ctx.beginPath();
      ctx.arc(0, -3, 3, 0, Math.PI * 2);
      ctx.fill();

    } else if (type === 'crown') {
      // Golden Gem Crown
      ctx.fillStyle = '#ffb703';
      ctx.strokeStyle = '#fb8500';
      ctx.lineWidth = 2;

      ctx.beginPath();
      ctx.moveTo(-12, 0);
      ctx.lineTo(-14, -12);
      ctx.lineTo(-6, -6);
      ctx.lineTo(0, -15);
      ctx.lineTo(6, -6);
      ctx.lineTo(14, -12);
      ctx.lineTo(12, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Red Gem
      ctx.fillStyle = '#e63946';
      ctx.beginPath();
      ctx.arc(0, -4, 2.5, 0, Math.PI * 2);
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
  }
}
