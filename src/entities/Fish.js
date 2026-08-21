/**
 * Fish Entity, Procedural Biological Renderer, ✨ Shiny (이로치) Variant System,
 * and Tiring / Slack-Line Escape Mechanics
 */
import { Vector2 } from '../engine/Vector.js';

export class Fish {
  constructor(speciesData, startPos, isShiny = false) {
    this.data = speciesData;
    this.pos = startPos.clone();
    this.vel = new Vector2(0, 0);
    
    // Facing direction: 1 (right) or -1 (left)
    this.facing = Math.random() < 0.5 ? 1 : -1;
    
    // Randomized individual size within species range
    const [minCm, maxCm] = this.data.sizeRange;
    this.sizeCm = Math.round(minCm + Math.random() * (maxCm - minCm));
    this.scale = 0.7 + (this.sizeCm / maxCm) * 0.6; // Visual scale

    // ✨ Shiny (이로치) Variant State
    this.isShiny = isShiny;
    this.shinyParticles = [];

    // AI States: 'WANDER', 'CURIOUS', 'HOOKED', 'FLEE'
    this.state = 'WANDER';
    this.target = null; // Hook target
    this.targetSlot = null;
    this.wanderTimer = Math.random() * 5;
    this.wanderAngle = this.facing > 0 ? 0 : Math.PI;

    // Struggle & Tiring (탈진 & 방치 탈출 줄타기) Mechanics
    // The struggle gauge is ONLY applied to Shiny (이로치) variants and Mythic titans!
    this.hasStruggleGauge = this.isShiny || (this.data.rarity === 'mythic');
    this.rage = 0; // 0 ~ 100
    this.fightDuration = 0;
    this.maxFightDuration = 8.0 + (this.data.strength || 20) * 0.07; // 8~22 seconds of fight stamina
    this.isExhausted = false;
    this.slackEscapeTimer = 0; // Tracks idle slack line without reeling
    this.onEscapeCallback = null;

    // Animation time
    this.animTime = Math.random() * 10;
    this.tailSpeed = (this.data.speed / 30);

    // Special state
    this.isPuffed = false;
    this.inkParticles = [];
    this.curiousTimer = 0;
    this.ignoreCooldown = 0;
  }

  update(dt, hook, waterBounds, cat) {
    this.animTime += dt;
    if (this.ignoreCooldown > 0) {
      this.ignoreCooldown -= dt;
    }

    // ✨ Update Shiny Stardust Particles
    if (this.isShiny) {
      if (Math.random() < 0.35) {
        this.shinyParticles.push({
          x: this.pos.x + (Math.random() - 0.5) * 45 * this.scale,
          y: this.pos.y + (Math.random() - 0.5) * 30 * this.scale,
          size: 3 + Math.random() * 5,
          alpha: 1.0,
          vy: -15 - Math.random() * 20,
          color: Math.random() > 0.5 ? '#ffd166' : '#ff007f'
        });
      }
      for (let i = this.shinyParticles.length - 1; i >= 0; i--) {
        const p = this.shinyParticles[i];
        p.y += p.vy * dt;
        p.alpha -= dt * 1.5;
        if (p.alpha <= 0) this.shinyParticles.splice(i, 1);
      }
    }

    if (this.state === 'WANDER') {
      this.updateWander(dt, waterBounds);
      this.checkBaitInterest(hook);

    } else if (this.state === 'CURIOUS') {
      this.updateCurious(dt, hook);

    } else if (this.state === 'HOOKED') {
      this.updateHooked(dt, hook, cat);

    } else if (this.state === 'FLEE') {
      this.updateFlee(dt, waterBounds);
    }

    // Update Ink particles (if squid)
    if (this.inkParticles.length > 0) {
      for (let i = this.inkParticles.length - 1; i >= 0; i--) {
        const p = this.inkParticles[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.alpha -= dt * 0.4;
        p.size += dt * 8;
        if (p.alpha <= 0) this.inkParticles.splice(i, 1);
      }
    }
  }

  updateWander(dt, bounds) {
    this.wanderTimer -= dt;
    if (this.wanderTimer <= 0) {
      this.wanderTimer = 3 + Math.random() * 4;
      const angleDelta = (Math.random() - 0.5) * 0.8;
      this.wanderAngle += angleDelta;
      this.facing = Math.cos(this.wanderAngle) >= 0 ? 1 : -1;
    }

    const wave = Math.sin(this.animTime * 2) * 6;
    const speed = this.data.speed * (0.8 + Math.sin(this.animTime) * 0.2);

    this.vel.x = Math.cos(this.wanderAngle) * speed;
    this.vel.y = Math.sin(this.wanderAngle) * speed * 0.3 + wave * 0.2;

    this.pos.add(Vector2.mult(this.vel, dt));

    // Keep fish within its depth range
    const minPixelY = this.data.minDepth * 20; // 1m = 20px
    const maxPixelY = this.data.maxDepth * 20;

    if (this.pos.y < minPixelY) {
      this.pos.y = minPixelY;
      this.wanderAngle = Math.abs(this.wanderAngle);
    } else if (this.pos.y > maxPixelY) {
      this.pos.y = maxPixelY;
      this.wanderAngle = -Math.abs(this.wanderAngle);
    }

    // Keep within horizontal bounds
    const minX = bounds ? bounds.left : 100;
    const maxX = bounds ? bounds.right : 3200;

    if (this.pos.x < minX) {
      this.pos.x = minX;
      this.wanderAngle = 0;
      this.facing = 1;
    } else if (this.pos.x > maxX) {
      this.pos.x = maxX;
      this.wanderAngle = Math.PI;
      this.facing = -1;
    }
  }

  checkBaitInterest(hook) {
    if (!hook || !hook.isSubmerged) return;

    const isLiveBait = hook.isLiveBait;
    const currentBaitId = hook.currentBaitId;
    const liveBaitData = hook.liveBaitFish ? hook.liveBaitFish.data : null;

    let isAttractive = false;

    if (isLiveBait && liveBaitData) {
      if (this.data.favBait.includes('live_small') && liveBaitData.baitSize === 'small') {
        isAttractive = true;
      }
    } else {
      // 🍞 Bread Crumbs can catch all surface & shallow fish up to 25m!
      if (currentBaitId === 'bread' && (this.data.minDepth <= 25 || this.data.zone === 'shallow')) {
        isAttractive = true;
      } else if (this.data.favBait.includes(currentBaitId)) {
        isAttractive = true;
      }
    }

    if (!isAttractive) return;
    if (this.ignoreCooldown > 0) return;

    let freeSlot = null;
    if (hook.hooks && hook.hooks.length > 0) {
      freeSlot = hook.hooks.find(h => !h.hookedFish);
    } else {
      freeSlot = !hook.hookedFish ? { pos: hook.hookPos } : null;
    }
    if (!freeSlot) return;

    const targetPos = freeSlot.pos || hook.hookPos || hook.pos;
    if (!targetPos) return;

    const dist = this.pos.dist(targetPos);
    const detectRadius = 145 * (hook.attractionBonus || 1.0);

    if (dist < detectRadius) {
      this.state = 'CURIOUS';
      this.curiousTimer = 0;
      this.target = hook;
      this.targetSlot = freeSlot;
    }
  }

  updateCurious(dt, hook) {
    if (!hook || !hook.isSubmerged) {
      this.state = 'WANDER';
      return;
    }

    if (this.targetSlot && this.targetSlot.hookedFish && this.targetSlot.hookedFish !== this) {
      const anotherSlot = hook.hooks ? hook.hooks.find(h => !h.hookedFish) : null;
      if (anotherSlot) {
        this.targetSlot = anotherSlot;
      } else {
        this.state = 'WANDER';
        return;
      }
    }

    const hookPos = (this.targetSlot && this.targetSlot.pos) ? this.targetSlot.pos : (hook.hookPos || hook.pos);
    if (!hookPos) {
      this.state = 'WANDER';
      return;
    }

    const dist = this.pos.dist(hookPos);

    if (dist > 230 || hookPos.y > (this.data.maxDepth + 3) * 20) {
      this.state = 'WANDER';
      this.ignoreCooldown = 2.5;
      return;
    }

    const dir = Vector2.sub(hookPos, this.pos).normalize();
    this.facing = dir.x >= 0 ? 1 : -1;

    const isBaitMoving = hook.isJiggling || hook.isReeling;

    if (!isBaitMoving) {
      // Free sinking: stand off, then de-aggro
      this.curiousTimer += dt;

      if (this.curiousTimer >= 1.6) {
        this.state = 'WANDER';
        this.ignoreCooldown = 3.2;
        this.wanderTimer = 3.0;
        this.wanderAngle = this.facing > 0 ? Math.PI * 0.8 : Math.PI * 0.2;
        return;
      }

      if (dist > 28) {
        this.pos.add(Vector2.mult(dir, this.data.speed * 0.8 * dt));
      }

    } else {
      // Bait is actively twitched: strike!
      this.curiousTimer = 0;

      if (dist < 42) {
        hook.attachFish(this, this.targetSlot);
        this.state = 'HOOKED';
        if (this.data.id === 'pufferfish') this.isPuffed = true;
        if (this.data.id === 'inky_squid') this.spawnInk();
      } else {
        this.pos.add(Vector2.mult(dir, this.data.speed * 2.0 * dt));
      }
    }
  }

  updateHooked(dt, hook, cat) {
    const targetSlotPos = (this.targetSlot && this.targetSlot.pos) ? this.targetSlot.pos : (hook.hookPos || hook.pos);
    if (targetSlotPos) {
      this.pos.copy(targetSlotPos);
    }

    this.animTime += dt * 3;
    this.facing = Math.sin(this.animTime * 3) >= 0 ? 1 : -1;

    // --- Struggle, Tiring, and Slack-Line Escape Dynamics ---
    if (this.hasStruggleGauge) {
      this.fightDuration += dt;

      // 1. Tiring / Exhaustion Check
      if (this.fightDuration >= this.maxFightDuration) {
        this.isExhausted = true;
        this.rage = 0; // Gauge stops building and stays at 0!
      }

      if (!this.isExhausted) {
        if (hook.isReeling) {
          // Reeling -> Builds fish rage
          const rageGainRate = 30 + (this.data.strength || 20) * 0.8;
          this.rage = Math.min(100, this.rage + rageGainRate * dt);
          this.slackEscapeTimer = 0; // Reset slack idle timer
        } else {
          // Slack line -> Fish calms down, BUT slack escape timer ticks up!
          this.rage = Math.max(0, this.rage - 50 * dt);
          this.slackEscapeTimer += dt;

          // 2. Slack Line Escape: If neglected for >3.2 seconds, fish spits hook and flees!
          if (this.slackEscapeTimer >= 3.2) {
            this.state = 'FLEE';
            this.wanderTimer = 4.0;
            this.ignoreCooldown = 6.0;

            // Detach from hook
            if (this.targetSlot) this.targetSlot.hookedFish = null;
            if (hook.hooks) hook.hooks.forEach(h => { if (h.hookedFish === this) h.hookedFish = null; });
            if (hook.hookedFish === this) hook.hookedFish = null;

            if (this.onEscapeCallback) {
              this.onEscapeCallback(this);
            }
            return;
          }
        }
      } else {
        // Exhausted: Calm and easily reelable
        this.rage = 0;
        this.slackEscapeTimer = 0;
      }
    }

    if (this.data.id === 'inky_squid' && Math.random() < 0.03) {
      this.spawnInk();
    }
  }

  updateFlee(dt, bounds) {
    this.wanderTimer -= dt;
    const fleeSpeed = this.data.speed * 2.2;
    this.pos.x += this.facing * fleeSpeed * dt;
    if (this.wanderTimer <= 0) {
      this.state = 'WANDER';
    }
  }

  spawnInk() {
    for (let i = 0; i < 5; i++) {
      this.inkParticles.push({
        x: this.pos.x,
        y: this.pos.y,
        vx: (Math.random() - 0.5) * 40 - this.facing * 30,
        vy: (Math.random() - 0.5) * 40,
        size: 8 + Math.random() * 8,
        alpha: 0.85
      });
    }
  }

  draw(ctx) {
    // Draw Ink Particles
    if (this.inkParticles.length > 0) {
      ctx.save();
      this.inkParticles.forEach(p => {
        ctx.fillStyle = `rgba(18, 18, 20, ${p.alpha})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.restore();
    }

    // Draw ✨ Shiny Stardust Particles
    if (this.shinyParticles.length > 0) {
      ctx.save();
      this.shinyParticles.forEach(p => {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.font = 'bold 12px sans-serif';
        ctx.fillText('✦', p.x, p.y);
      });
      ctx.restore();
    }

    // Draw Fish Body
    ctx.save();
    ctx.translate(this.pos.x, this.pos.y);
    ctx.scale(this.facing * this.scale, this.scale);

    // ✨ Shiny Glowing Aura & Chromatic Shimmer
    if (this.isShiny) {
      ctx.shadowColor = '#ffd166';
      ctx.shadowBlur = 14 + Math.sin(this.animTime * 6) * 6;
      ctx.strokeStyle = '#ffd166';
      ctx.lineWidth = 1.5;
    }

    const drawType = this.data.drawType || 'anchovy';
    this.renderSpecies(ctx, drawType);

    ctx.restore();

    // Render In-Water Struggle Rage Gauge above hooked Shiny fish
    if (this.state === 'HOOKED' && this.hasStruggleGauge) {
      this.drawStruggleGauge(ctx);
    }
  }

  drawStruggleGauge(ctx) {
    const x = this.pos.x;
    const y = this.pos.y - 32 * this.scale;
    const barW = 68;
    const barH = 8;
    const pct = Math.min(100, Math.max(0, this.rage)) / 100;

    ctx.save();

    // 1. Drop shadow & Gauge Background Pill
    ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
    ctx.shadowBlur = 8;
    ctx.fillStyle = 'rgba(15, 17, 26, 0.92)';
    ctx.strokeStyle = this.isExhausted ? '#06d6a0' : (this.rage >= 85 ? '#ff0054' : '#ffd166');
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(x - barW / 2, y - barH / 2, barW, barH, 4);
    ctx.fill();
    ctx.stroke();

    // 2. Fill Bar
    if (this.isExhausted) {
      // Fully Exhausted Green Bar
      ctx.fillStyle = '#06d6a0';
      ctx.beginPath();
      ctx.roundRect(x - barW / 2 + 1, y - barH / 2 + 1, barW - 2, barH - 2, 3);
      ctx.fill();
    } else if (pct > 0.02) {
      let grad = ctx.createLinearGradient(x - barW / 2, y, x - barW / 2 + barW * pct, y);
      if (pct < 0.45) {
        grad.addColorStop(0, '#ffd166');
        grad.addColorStop(1, '#ffb703');
      } else if (pct < 0.85) {
        grad.addColorStop(0, '#ffb703');
        grad.addColorStop(1, '#ff0054');
      } else {
        grad.addColorStop(0, '#ff0054');
        grad.addColorStop(1, '#d90429');
      }
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.roundRect(x - barW / 2 + 1, y - barH / 2 + 1, (barW - 2) * pct, barH - 2, 3);
      ctx.fill();
    }

    // 3. Status Text Badge
    ctx.shadowBlur = 0;
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';

    if (this.isExhausted) {
      ctx.fillStyle = '#06d6a0';
      ctx.fillText('✨ 탈진 완료! (지금 감기!)', x, y - 4);
    } else if (this.slackEscapeTimer > 1.6) {
      // Blinking Escape Warning!
      const blink = Math.sin(this.animTime * 12) > 0;
      ctx.fillStyle = blink ? '#ff0054' : '#ffd166';
      ctx.fillText('⚠️ 놓침 경고! (지금 감아주세요!)', x, y - 4);
    } else if (this.rage >= 85) {
      ctx.fillStyle = '#ff0054';
      ctx.fillText('💢 분노 폭발! (릴 멈추기!)', x, y - 4);
    } else if (this.rage <= 15) {
      ctx.fillStyle = '#4cc9f0';
      ctx.fillText('💤 힘 빠지는 중...', x, y - 4);
    } else {
      ctx.fillStyle = '#ffd166';
      ctx.fillText(`✨ 이로치 저항 ${Math.round(this.rage)}%`, x, y - 4);
    }

    ctx.restore();
  }

  renderSpecies(ctx, type) {
    const c = this.data.colors || {};
    const tailWag = Math.sin(this.animTime * this.tailSpeed * 8) * 0.18;

    switch (type) {
      case 'anchovy':
        ctx.fillStyle = c.body || '#a0c4ff';
        ctx.beginPath();
        ctx.ellipse(0, 0, 12, 4, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = c.fin || '#70a8ff';
        ctx.beginPath();
        ctx.moveTo(-10, 0);
        ctx.lineTo(-18, -6 + tailWag * 10);
        ctx.lineTo(-15, 0);
        ctx.lineTo(-18, 6 + tailWag * 10);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#212529';
        ctx.beginPath();
        ctx.arc(8, -1, 1.5, 0, Math.PI * 2);
        ctx.fill();
        break;

      case 'guppy':
        ctx.fillStyle = c.body || '#ffadad';
        ctx.beginPath();
        ctx.ellipse(2, 0, 10, 5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.save();
        ctx.translate(-6, 0);
        ctx.rotate(tailWag);
        ctx.fillStyle = c.fin || '#caffbf';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(-12, -12, -18, -8);
        ctx.quadraticCurveTo(-14, 0, -18, 8);
        ctx.quadraticCurveTo(-12, 12, 0, 0);
        ctx.fill();
        ctx.restore();
        ctx.fillStyle = '#212529';
        ctx.beginPath();
        ctx.arc(8, -1, 1.8, 0, Math.PI * 2);
        ctx.fill();
        break;

      case 'clownfish':
        ctx.fillStyle = c.body || '#ff7b00';
        ctx.beginPath();
        ctx.ellipse(0, 0, 14, 8, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-2, -7, 4, 14);
        ctx.fillRect(5, -6, 3, 12);
        ctx.fillStyle = c.fin || '#e85d04';
        ctx.beginPath();
        ctx.moveTo(-12, 0);
        ctx.lineTo(-20, -7 + tailWag * 8);
        ctx.lineTo(-20, 7 + tailWag * 8);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#212529';
        ctx.beginPath();
        ctx.arc(8, -2, 2, 0, Math.PI * 2);
        ctx.fill();
        break;

      case 'pufferfish':
        const pR = this.isPuffed ? 18 : 12;
        ctx.fillStyle = c.body || '#fdffb6';
        ctx.beginPath();
        ctx.arc(0, 0, pR, 0, Math.PI * 2);
        ctx.fill();
        if (this.isPuffed) {
          ctx.strokeStyle = '#d4a373';
          ctx.lineWidth = 2;
          for (let a = 0; a < Math.PI * 2; a += 0.6) {
            ctx.beginPath();
            ctx.moveTo(Math.cos(a) * pR, Math.sin(a) * pR);
            ctx.lineTo(Math.cos(a) * (pR + 5), Math.sin(a) * (pR + 5));
            ctx.stroke();
          }
        }
        ctx.fillStyle = '#212529';
        ctx.beginPath();
        ctx.arc(pR * 0.5, -2, 2.2, 0, Math.PI * 2);
        ctx.fill();
        break;

      case 'jellyfish':
      case 'gold_jelly':
        ctx.fillStyle = c.body || '#ffc6ff';
        ctx.beginPath();
        ctx.arc(0, -4, 14, Math.PI, 0, false);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = c.tentacle || '#e8c2ff';
        ctx.lineWidth = 1.8;
        for (let i = -8; i <= 8; i += 4) {
          const sway = Math.sin(this.animTime * 3 + i) * 6;
          ctx.beginPath();
          ctx.moveTo(i, -4);
          ctx.quadraticCurveTo(i + sway, 12, i - sway, 24);
          ctx.stroke();
        }
        break;

      case 'butterfly':
        ctx.fillStyle = c.body || '#ffd166';
        ctx.beginPath();
        ctx.ellipse(0, 0, 15, 12, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#212529';
        ctx.fillRect(4, -11, 3, 22);
        ctx.fillStyle = c.fin || '#ffb703';
        ctx.beginPath();
        ctx.moveTo(-10, 0);
        ctx.lineTo(-18, -10 + tailWag * 10);
        ctx.lineTo(-18, 10 + tailWag * 10);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.arc(9, -3, 2, 0, Math.PI * 2);
        ctx.fill();
        break;

      case 'flounder':
        ctx.fillStyle = c.body || '#d4a373';
        ctx.beginPath();
        ctx.ellipse(0, 0, 18, 10, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#212529';
        ctx.beginPath();
        ctx.arc(10, -5, 2, 0, Math.PI * 2);
        ctx.arc(12, -2, 2, 0, Math.PI * 2);
        ctx.fill();
        break;

      case 'bream':
      case 'koibream':
        ctx.fillStyle = c.body || '#ff4d6d';
        ctx.beginPath();
        ctx.ellipse(0, 0, 22, 14, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = c.belly || '#ffb3c1';
        ctx.beginPath();
        ctx.ellipse(2, 5, 16, 7, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = c.fin || '#c9184a';
        ctx.beginPath();
        ctx.moveTo(-16, 0);
        ctx.lineTo(-28, -14 + tailWag * 12);
        ctx.lineTo(-24, 0);
        ctx.lineTo(-28, 14 + tailWag * 12);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#212529';
        ctx.beginPath();
        ctx.arc(14, -4, 2.5, 0, Math.PI * 2);
        ctx.fill();
        break;

      case 'mackerel':
      case 'flying':
        ctx.fillStyle = c.body || '#0077b6';
        ctx.beginPath();
        ctx.ellipse(0, 0, 26, 8, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = c.fin || '#023e8a';
        ctx.beginPath();
        ctx.moveTo(-20, 0);
        ctx.lineTo(-32, -10 + tailWag * 10);
        ctx.lineTo(-32, 10 + tailWag * 10);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(18, -2, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#000814';
        ctx.beginPath();
        ctx.arc(19, -2, 1.4, 0, Math.PI * 2);
        ctx.fill();
        break;

      case 'squid':
        ctx.fillStyle = c.body || '#e0aaff';
        ctx.beginPath();
        ctx.moveTo(22, 0);
        ctx.lineTo(-10, -10);
        ctx.lineTo(-10, 10);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = c.tentacle || '#c77dff';
        ctx.lineWidth = 2.5;
        for (let i = -6; i <= 6; i += 3) {
          const sway = Math.sin(this.animTime * 4 + i) * 8;
          ctx.beginPath();
          ctx.moveTo(-10, i);
          ctx.quadraticCurveTo(-22, i + sway, -32, i - sway);
          ctx.stroke();
        }
        break;

      case 'ribbon':
      case 'oarfish':
        ctx.fillStyle = c.body || '#e9ecef';
        ctx.beginPath();
        ctx.ellipse(0, 0, 48, 6, 0, 0, Math.PI * 2);
        ctx.fill();
        if (c.crest) {
          ctx.fillStyle = c.crest;
          ctx.fillRect(35, -16, 6, 12);
        }
        ctx.fillStyle = '#212529';
        ctx.beginPath();
        ctx.arc(42, -1, 2.2, 0, Math.PI * 2);
        ctx.fill();
        break;

      case 'turtle':
      case 'cosmic_turtle':
        ctx.fillStyle = c.shell || '#2d6a4f';
        ctx.beginPath();
        ctx.ellipse(0, 0, 24, 18, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = c.body || '#74c69d';
        ctx.beginPath();
        ctx.arc(24, 0, 8, 0, Math.PI * 2);
        ctx.fill();
        break;

      case 'marlin':
      case 'dragonfish':
        ctx.fillStyle = c.body || '#03045e';
        ctx.beginPath();
        ctx.ellipse(0, 0, 36, 10, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#023e8a';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(25, 0);
        ctx.lineTo(55, 0);
        ctx.stroke();
        break;

      case 'angler':
        ctx.fillStyle = c.body || '#3a0ca3';
        ctx.beginPath();
        ctx.ellipse(0, 0, 26, 18, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#480ca8';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(12, -16);
        ctx.quadraticCurveTo(24, -30, 28, -20);
        ctx.stroke();
        ctx.fillStyle = '#4cc9f0';
        ctx.beginPath();
        ctx.arc(28, -20, 5, 0, Math.PI * 2);
        ctx.fill();
        break;

      case 'blobfish':
        ctx.fillStyle = c.body || '#ffafcc';
        ctx.beginPath();
        ctx.ellipse(0, 0, 20, 16, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ff758f';
        ctx.beginPath();
        ctx.arc(8, 0, 6, 0, Math.PI * 2);
        ctx.fill();
        break;

      case 'shark':
      case 'megamouth':
      case 'ghost_shark':
        ctx.fillStyle = c.body || '#2b2d42';
        ctx.beginPath();
        ctx.ellipse(0, 0, 42, 16, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(0, -16);
        ctx.lineTo(-8, -32);
        ctx.lineTo(12, -16);
        ctx.closePath();
        ctx.fill();
        break;

      case 'octopus':
      case 'glass_octo':
      case 'kraken':
        ctx.fillStyle = c.body || '#6a040f';
        ctx.beginPath();
        ctx.arc(10, 0, 20, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = c.tentacle || '#9d0208';
        ctx.lineWidth = 4;
        for (let i = -12; i <= 12; i += 6) {
          const sway = Math.sin(this.animTime * 3 + i) * 12;
          ctx.beginPath();
          ctx.moveTo(-5, i);
          ctx.quadraticCurveTo(-25, i + sway, -45, i - sway);
          ctx.stroke();
        }
        break;

      case 'crab':
        ctx.fillStyle = c.shell || '#6c584c';
        ctx.beginPath();
        ctx.arc(0, 0, 16, Math.PI * 0.5, Math.PI * 1.5, true);
        ctx.closePath();
        ctx.fill();
        break;

      case 'coelacanth':
        ctx.fillStyle = c.body || '#14213d';
        ctx.beginPath();
        ctx.ellipse(0, 0, 36, 14, 0, 0, Math.PI * 2);
        ctx.fill();
        break;

      case 'ray':
        ctx.fillStyle = c.body || '#03045e';
        ctx.beginPath();
        ctx.moveTo(30, 0);
        ctx.lineTo(-10, -32);
        ctx.lineTo(-20, 0);
        ctx.lineTo(-10, 32);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#48cae4';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-20, 0);
        ctx.lineTo(-55, 0);
        ctx.stroke();
        break;

      case 'starwhale':
        ctx.fillStyle = c.body || '#0d1b2a';
        ctx.beginPath();
        ctx.ellipse(0, 0, 65, 26, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = c.star || '#ffd166';
        [[-25, -6], [-5, -12], [18, -8], [35, -4], [-40, -4]].forEach(([sx, sy]) => {
          ctx.beginPath();
          ctx.arc(sx, sy, 2.5, 0, Math.PI * 2);
          ctx.fill();
        });
        break;

      case 'leviathan':
        ctx.fillStyle = c.body || '#0b090a';
        ctx.beginPath();
        ctx.ellipse(0, 0, 85, 28, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = c.scale || '#00f5d4';
        ctx.lineWidth = 3;
        ctx.stroke();
        break;

      case 'seahorse':
        ctx.fillStyle = c.body || '#7209b7';
        ctx.beginPath();
        ctx.ellipse(0, -10, 10, 16, 0, 0, Math.PI * 2);
        ctx.fill();
        break;

      case 'chest':
      case 'relic':
        ctx.fillStyle = c.gold || '#ffd166';
        ctx.fillRect(-16, -10, 32, 20);
        ctx.fillStyle = '#d90429';
        ctx.fillRect(-4, -4, 8, 8);
        break;

      case 'bottle':
        ctx.fillStyle = c.glass || '#a8dadc';
        ctx.beginPath();
        ctx.roundRect(-12, -6, 24, 12, 4);
        ctx.fill();
        break;

      default:
        ctx.fillStyle = '#adb5bd';
        ctx.beginPath();
        ctx.ellipse(0, 0, 16, 8, 0, 0, Math.PI * 2);
        ctx.fill();
        break;
    }
  }

  /**
   * Static renderer for Fish Encyclopedia previews
   */
  static drawPreview(canvas, species, isDiscovered = true) {
    if (!canvas || !species) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    ctx.save();
    ctx.translate(w / 2, h / 2);

    // Scaling based on species size to fit preview canvas
    let scale = 1.35;
    if (species.drawType === 'leviathan' || species.drawType === 'megalodon' || species.drawType === 'oarfish') {
      scale = 0.55;
    } else if (species.drawType === 'coelacanth' || species.drawType === 'sunfish' || species.drawType === 'whale_shark') {
      scale = 0.75;
    } else if (species.drawType === 'bream' || species.drawType === 'mackerel' || species.drawType === 'squid') {
      scale = 1.05;
    }

    ctx.scale(scale, scale);

    if (!isDiscovered) {
      // Silhouette shadow for undiscovered species
      ctx.filter = 'brightness(0) opacity(0.35)';
    }

    // Mock fish instance for renderSpecies
    const mockFish = new Fish(species, 0, 0);
    mockFish.animTime = 0.8;
    mockFish.tailSpeed = 0.5;
    mockFish.renderSpecies(ctx, species.drawType || 'anchovy');

    ctx.restore();
  }
}
