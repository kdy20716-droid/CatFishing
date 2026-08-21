/**
 * Cozy Personal Aquarium Simulation
 * Relaxing sanctuary where collected fish swim, eat food, and generate passive happiness coins
 */
import { Fish } from '../entities/Fish.js';
import { Vector2 } from '../engine/Vector.js';

export class Aquarium {
  constructor(encyclopedia, economy, soundEngine) {
    this.encyclopedia = encyclopedia;
    this.economy = economy;
    this.sound = soundEngine;

    this.isOpen = false;
    this.theme = 'coral'; // 'coral', 'night_glow', 'ancient'
    this.tankFish = [];
    this.placedFish = []; // Array of collected fish instances: [{ speciesId, isShiny, sizeCm, addedAt }]
    this.foodFlakes = [];
    this.coinBubbles = [];
    this.hearts = [];

    this.animTime = 0;
    this.tankWidth = 900;
    this.tankHeight = 550;
    this.passiveCoinTimer = 0;

    this.loadFromStorage();
  }

  loadFromStorage() {
    try {
      const saved = localStorage.getItem('cozy_cat_aquarium_v1');
      if (saved) {
        const data = JSON.parse(saved);
        this.theme = data.theme || 'coral';
        this.placedFish = Array.isArray(data.placedFish) ? data.placedFish : [];
      }
    } catch (e) {
      console.warn("Failed to load aquarium:", e);
    }
  }

  saveToStorage() {
    try {
      const data = {
        theme: this.theme,
        placedFish: this.placedFish
      };
      localStorage.setItem('cozy_cat_aquarium_v1', JSON.stringify(data));
      if (this.onSaveCallback) this.onSaveCallback();
    } catch (e) {
      console.warn("Failed to save aquarium:", e);
    }
  }

  addFishToAquarium(basketItem) {
    const item = {
      instanceId: 'aq_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      speciesId: basketItem.speciesId,
      name: basketItem.name,
      isShiny: !!basketItem.isShiny,
      sizeCm: basketItem.sizeCm,
      addedAt: Date.now()
    };
    this.placedFish.push(item);
    this.saveToStorage();
    return item;
  }

  open() {
    this.isOpen = true;
    this.populateTank();
  }

  close() {
    this.isOpen = false;
  }

  setTheme(themeName) {
    this.theme = themeName;
    this.saveToStorage();
  }

  populateTank() {
    this.tankFish = [];

    // 1. If user has placed custom collected fish, spawn them!
    if (this.placedFish.length > 0) {
      this.placedFish.forEach(item => {
        const species = this.encyclopedia.getFishData(item.speciesId);
        if (species) {
          const startPos = new Vector2(
            60 + Math.random() * (this.tankWidth - 120),
            60 + Math.random() * (this.tankHeight - 120)
          );
          const fish = new Fish(species, startPos, item.isShiny);
          fish.scale = Math.min(1.2, Math.max(0.7, item.sizeCm / 40));
          this.tankFish.push(fish);
        }
      });
    } else {
      // Fallback: spawn 1 instance of unlocked species
      const unlocked = this.encyclopedia.getUnlockedFish();
      unlocked.slice(0, 8).forEach(species => {
        const startPos = new Vector2(
          60 + Math.random() * (this.tankWidth - 120),
          60 + Math.random() * (this.tankHeight - 120)
        );
        const fish = new Fish(species, startPos, false);
        fish.scale = 0.85;
        this.tankFish.push(fish);
      });
    }
  }

  dropFood(x, y) {
    this.sound.playBubble();
    for (let i = 0; i < 4; i++) {
      this.foodFlakes.push({
        pos: new Vector2(x + (Math.random() - 0.5) * 20, y + (Math.random() - 0.5) * 10),
        vel: new Vector2((Math.random() - 0.5) * 10, 25 + Math.random() * 20),
        size: 3 + Math.random() * 2,
        life: 12
      });
    }
  }

  collectCoinBubble(bubbleIndex) {
    const b = this.coinBubbles[bubbleIndex];
    if (!b) return;

    this.economy.addGold(b.amount);
    this.sound.playCoin();
    this.coinBubbles.splice(bubbleIndex, 1);
  }

  collectAllCoins() {
    if (this.coinBubbles.length === 0) return 0;
    let total = 0;
    this.coinBubbles.forEach(b => total += b.amount);
    this.economy.addGold(total);
    this.sound.playCoin();
    this.coinBubbles = [];
    return total;
  }

  update(dt) {
    if (!this.isOpen) return;
    this.animTime += dt;

    // Passive Coin Bubble Spawner
    this.passiveCoinTimer += dt;
    if (this.passiveCoinTimer >= 6.0 && this.tankFish.length > 0) {
      this.passiveCoinTimer = 0;
      if (this.coinBubbles.length < 15) {
        const randomFish = this.tankFish[Math.floor(Math.random() * this.tankFish.length)];
        this.coinBubbles.push({
          pos: randomFish.pos.clone(),
          amount: Math.round(randomFish.data.basePrice * 0.15),
          size: 16,
          vy: -20 - Math.random() * 15,
          life: 20
        });
      }
    }

    // Update Coin Bubbles
    for (let i = this.coinBubbles.length - 1; i >= 0; i--) {
      const b = this.coinBubbles[i];
      b.pos.y += b.vy * dt;
      b.pos.x += Math.sin(this.animTime * 2 + i) * 0.5;
      b.life -= dt;
      if (b.pos.y < 40 || b.life <= 0) {
        this.coinBubbles.splice(i, 1);
      }
    }

    // Update Food Flakes
    for (let i = this.foodFlakes.length - 1; i >= 0; i--) {
      const f = this.foodFlakes[i];
      f.pos.add(Vector2.mult(f.vel, dt));
      f.life -= dt;
      if (f.pos.y > this.tankHeight - 40 || f.life <= 0) {
        this.foodFlakes.splice(i, 1);
      }
    }

    // Update Hearts
    for (let i = this.hearts.length - 1; i >= 0; i--) {
      const h = this.hearts[i];
      h.pos.y += h.vy * dt;
      h.alpha -= dt * 0.8;
      if (h.alpha <= 0) {
        this.hearts.splice(i, 1);
      }
    }

    // Update Tank Fish AI (swims in tank, eats food)
    const bounds = { left: 40, right: this.tankWidth - 40, top: 40, bottom: this.tankHeight - 50 };

    this.tankFish.forEach(fish => {
      fish.animTime += dt;

      // Check if food flake is nearby
      let closestFood = null;
      let closestDist = 200;

      for (let i = 0; i < this.foodFlakes.length; i++) {
        const food = this.foodFlakes[i];
        const d = fish.pos.dist(food.pos);
        if (d < closestDist) {
          closestDist = d;
          closestFood = { food, index: i };
        }
      }

      if (closestFood) {
        // Chase food!
        const dir = Vector2.sub(closestFood.food.pos, fish.pos).normalize();
        fish.facing = dir.x >= 0 ? 1 : -1;
        fish.pos.add(Vector2.mult(dir, fish.data.speed * 1.4 * dt));

        // Eat food!
        if (closestDist < 12) {
          this.foodFlakes.splice(closestFood.index, 1);
          this.sound.playBubble();
          // Spawn Heart ❤️
          this.hearts.push({
            pos: fish.pos.clone().add(new Vector2(0, -15)),
            vy: -30,
            alpha: 1.0
          });
        }
      } else {
        // Peaceful wander in tank
        fish.wanderTimer -= dt;
        if (fish.wanderTimer <= 0) {
          fish.wanderTimer = 3 + Math.random() * 4;
          fish.wanderAngle = (Math.random() - 0.5) * Math.PI;
          if (Math.random() < 0.5) fish.wanderAngle += Math.PI;
          fish.facing = Math.cos(fish.wanderAngle) >= 0 ? 1 : -1;
        }

        const spd = fish.data.speed * 0.6;
        fish.pos.x += Math.cos(fish.wanderAngle) * spd * dt;
        fish.pos.y += Math.sin(fish.wanderAngle) * spd * 0.4 * dt;

        // Keep within tank walls
        if (fish.pos.x < bounds.left) {
          fish.pos.x = bounds.left;
          fish.wanderAngle = 0;
          fish.facing = 1;
        } else if (fish.pos.x > bounds.right) {
          fish.pos.x = bounds.right;
          fish.wanderAngle = Math.PI;
          fish.facing = -1;
        }

        if (fish.pos.y < bounds.top) {
          fish.pos.y = bounds.top;
          fish.wanderAngle = Math.abs(fish.wanderAngle);
        } else if (fish.pos.y > bounds.bottom) {
          fish.pos.y = bounds.bottom;
          fish.wanderAngle = -Math.abs(fish.wanderAngle);
        }
      }
    });
  }

  draw(ctx, screenW, screenH) {
    if (!this.isOpen) return;

    ctx.save();

    // Center tank on screen
    const startX = (screenW - this.tankWidth) / 2;
    const startY = (screenH - this.tankHeight) / 2;

    ctx.translate(startX, startY);

    // 1. Tank Glass Frame Outer
    ctx.fillStyle = '#2b2d42';
    ctx.beginPath();
    ctx.roundRect(-12, -12, this.tankWidth + 24, this.tankHeight + 24, 18);
    ctx.fill();

    // 2. Tank Background Gradient (Theme-based)
    const bgGrad = ctx.createLinearGradient(0, 0, 0, this.tankHeight);
    if (this.theme === 'night_glow') {
      bgGrad.addColorStop(0, '#03071e');
      bgGrad.addColorStop(0.5, '#0a192f');
      bgGrad.addColorStop(1, '#1b263b');
    } else if (this.theme === 'ancient') {
      bgGrad.addColorStop(0, '#1d3557');
      bgGrad.addColorStop(0.6, '#457b9d');
      bgGrad.addColorStop(1, '#a8dadc');
    } else {
      // Coral
      bgGrad.addColorStop(0, '#48cae4');
      bgGrad.addColorStop(0.6, '#0096c7');
      bgGrad.addColorStop(1, '#023e8a');
    }

    ctx.fillStyle = bgGrad;
    ctx.beginPath();
    ctx.roundRect(0, 0, this.tankWidth, this.tankHeight, 10);
    ctx.fill();

    // 3. Tank Sand & Decorations
    ctx.fillStyle = '#f4a261';
    ctx.beginPath();
    ctx.roundRect(0, this.tankHeight - 45, this.tankWidth, 45, [0, 0, 10, 10]);
    ctx.fill();

    // Corals & Plants
    for (let i = 0; i < 12; i++) {
      const cx = 50 + i * 75;
      const cy = this.tankHeight - 45;
      const sway = Math.sin(this.animTime * 2 + i) * 8;

      ctx.strokeStyle = i % 2 === 0 ? '#ff70a6' : '#70e000';
      ctx.lineWidth = 6;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.quadraticCurveTo(cx + sway, cy - 35, cx + sway * 1.2, cy - 65);
      ctx.stroke();
    }

    // 4. Draw Swimming Fish
    this.tankFish.forEach(fish => fish.draw(ctx));

    // 5. Draw Food Flakes
    ctx.fillStyle = '#ffbe0b';
    this.foodFlakes.forEach(f => {
      ctx.beginPath();
      ctx.arc(f.pos.x, f.pos.y, f.size, 0, Math.PI * 2);
      ctx.fill();
    });

    // 6. Draw Hearts
    this.hearts.forEach(h => {
      ctx.fillStyle = `rgba(255, 77, 109, ${h.alpha})`;
      ctx.font = 'bold 18px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('❤️', h.pos.x, h.pos.y);
    });

    // 7. Draw Coin Bubbles
    this.coinBubbles.forEach(b => {
      // Golden Bubble
      const glow = ctx.createRadialGradient(b.pos.x, b.pos.y, 2, b.pos.x, b.pos.y, b.size);
      glow.addColorStop(0, 'rgba(255, 234, 0, 0.9)');
      glow.addColorStop(1, 'rgba(255, 183, 3, 0.4)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(b.pos.x, b.pos.y, b.size, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#ffd166';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = '#d90429';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`+${b.amount}G`, b.pos.x, b.pos.y + 4);
    });

    // 8. Glass Highlights & Water Surface Line
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(10, 20);
    ctx.lineTo(this.tankWidth - 10, 20);
    ctx.stroke();

    // Glass Reflection Diagonal
    const glassGrad = ctx.createLinearGradient(0, 0, this.tankWidth, this.tankHeight);
    glassGrad.addColorStop(0, 'rgba(255, 255, 255, 0.12)');
    glassGrad.addColorStop(0.3, 'rgba(255, 255, 255, 0)');
    glassGrad.addColorStop(0.7, 'rgba(255, 255, 255, 0.08)');
    glassGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = glassGrad;
    ctx.beginPath();
    ctx.roundRect(0, 0, this.tankWidth, this.tankHeight, 10);
    ctx.fill();

    ctx.restore();
  }
}
