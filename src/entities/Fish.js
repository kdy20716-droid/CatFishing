/**
 * Fish Entity, Procedural Biological Renderer, ✨ Shiny (이로치) Variant System,
 * and Tiring / Slack-Line Escape Mechanics
 */
import { Vector2 } from '../engine/Vector.js?v=5.0.0';

export class Fish {
  constructor(speciesData, startPos, isShiny = false, swimBounds = null, uid = null) {
    this.uid = uid || ('f_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now());
    this.data = speciesData;
    this.pos = (startPos && typeof startPos.clone === 'function') 
      ? startPos.clone() 
      : new Vector2(startPos?.x || 0, startPos?.y || 0);
    this.vel = new Vector2(0, 0);
    this.swimBounds = swimBounds; // { minX, maxX }
    
    // Facing direction: 1 (right) or -1 (left)
    this.facing = Math.random() < 0.5 ? 1 : -1;
    
    // Randomized individual size within species range
    const [minCm, maxCm] = this.data.sizeRange;
    this.sizeCm = Math.round(minCm + Math.random() * (maxCm - minCm));
    this.isBoss = !!this.data.isBoss;

    // 🌟 Visual scale: Boss fish is 3x larger than normal fish!
    const baseScale = 0.7 + (this.sizeCm / maxCm) * 0.6;
    this.scale = this.isBoss ? baseScale * 2.85 : baseScale;

    // ✨ Shiny (이로치) & 👑 Boss States
    this.isShiny = isShiny;
    this.shinyParticles = [];
    this.bossParticles = [];

    // AI States: 'WANDER', 'CURIOUS', 'HOOKED', 'FLEE'
    this.state = 'WANDER';
    this.target = null; // Hook target
    this.targetSlot = null;
    this.wanderTimer = Math.random() * 5;
    this.wanderAngle = this.facing > 0 ? 0 : Math.PI;

    // Struggle & Tiring (탈진 & 방치 탈출 줄타기) Mechanics
    // The struggle gauge is applied strictly to Bosses and Shiny (이로치) variants!
    this.hasStruggleGauge = this.isBoss || this.isShiny;
    this.rage = 0; // 0 ~ 100
    this.fightDuration = 0;
    this.maxFightDuration = this.isBoss 
      ? 14.0 + (this.data.strength || 100) * 0.08 
      : 8.0 + (this.data.strength || 20) * 0.07;
    this.isExhausted = false;
    this.exhaustedTimer = 0; // 10초 후 체력 회복 및 재분노 타이머
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
    this.isInspecting = false;
    this.inspectTimer = 0;
    this.inspectDuration = 1.0;
  }

  update(dt, hook, waterBounds, cat) {
    this.animTime += dt;
    if (this.ignoreCooldown > 0) {
      this.ignoreCooldown -= dt;
    }

    // ✨ Update Shiny Stardust & 👑 Boss Aura Particles
    if (this.isShiny || this.isBoss) {
      if (Math.random() < (this.isBoss ? 0.6 : 0.35)) {
        this.shinyParticles.push({
          x: this.pos.x + (Math.random() - 0.5) * 50 * this.scale,
          y: this.pos.y + (Math.random() - 0.5) * 35 * this.scale,
          size: (this.isBoss ? 4 : 3) + Math.random() * 6,
          alpha: 1.0,
          vy: -18 - Math.random() * 25,
          color: this.isBoss ? (Math.random() > 0.5 ? '#ff0054' : '#ffd166') : (Math.random() > 0.5 ? '#ffd166' : '#ff007f'),
          symbol: this.isBoss ? (Math.random() > 0.5 ? '👑' : '⚡') : '✦'
        });
      }
      for (let i = this.shinyParticles.length - 1; i >= 0; i--) {
        const p = this.shinyParticles[i];
        p.y += p.vy * dt;
        p.alpha -= dt * 1.6;
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

    // Keep fish within its depth range (Clamped strictly to 750m+ Seabed Floor 15060px)
    const minPixelY = this.data.minDepth * 20; // 1m = 20px
    const maxPixelY = Math.min(15060, this.data.maxDepth * 20);

    if (this.pos.y < minPixelY) {
      this.pos.y = minPixelY;
      this.wanderAngle = Math.abs(this.wanderAngle);
    } else if (this.pos.y > maxPixelY) {
      this.pos.y = maxPixelY;
      this.wanderAngle = -Math.abs(this.wanderAngle);
    }

    // Keep within horizontal bounds (Respect custom species swimBounds)
    const defaultLeft = bounds ? bounds.left : -600;
    const defaultRight = bounds ? bounds.right : 14000;
    const minX = this.swimBounds?.minX ?? defaultLeft;
    const maxX = this.swimBounds?.maxX ?? defaultRight;

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

  get isNonLiving() {
    const type = this.data.drawType || this.data.id;
    return (
      type === 'chest' || 
      type === 'bottle' || 
      type === 'relic' || 
      this.data.id === 'sunken_chest' || 
      this.data.id === 'message_bottle' || 
      this.data.id === 'ancient_relic'
    );
  }

  checkBaitInterest(hook) {
    if (!hook || !hook.isSubmerged) return;

    const isLiveBait = hook.isLiveBait;
    const currentBaitId = hook.currentBaitId;
    const liveBaitData = hook.liveBaitFish ? hook.liveBaitFish.data : null;

    let isAttractive = false;

    // 🎁 0. 보물상자, 유리병 편지, 고대 유물 등 무생물 오브젝트는 기본 미끼(식빵) 포함 모든 미끼에 100% 걸림!
    if (this.isNonLiving) {
      isAttractive = true;
    } else if (hook.isAllureActive) {
      // 💖 1. 환상의 현혹 페로몬 활성화 시 반경 내 모든 물고기 즉시 매혹
      isAttractive = true;
    } else if (isLiveBait && liveBaitData) {
      if (this.data.favBait.includes('live_small') && liveBaitData.baitSize === 'small') {
        isAttractive = true;
      }
    } else {
      // 👑 2. 10대 전설 신화 보스 물고기: 오직 '황금 크릴 엑기스(golden)'에만 반응!
      if (this.isBoss) {
        if (currentBaitId === 'golden') {
          isAttractive = true;
        } else {
          return; // 보스는 일반 미끼는 거들떠보지도 않음
        }
      } else {
        // 🎯 일반 어종 Depth-based Bait Coverage Tier System
        const zone = this.data.zone || 'shallow';
        const isDeepSea = (zone === 'deep' || zone === 'abyss' || zone === 'hadal');

        if (currentBaitId === 'bread') {
          // 🍞 식빵: 표층(0~35m) 연안 어종만 유혹
          if (zone === 'shallow' && !isDeepSea) isAttractive = true;
        } else if (currentBaitId === 'worm') {
          // 🪱 갯지렁이: 표층 및 중층(0~80m) 어종 유혹
          if ((zone === 'shallow' || zone === 'mid') && !isDeepSea) isAttractive = true;
        } else if (currentBaitId === 'shrimp') {
          // 🦐 생새우: 표층 및 중층(0~180m) 어종 유혹
          if ((zone === 'shallow' || zone === 'mid') && !isDeepSea) isAttractive = true;
        } else if (currentBaitId === 'lure') {
          // ✨ 반짝 야광 루어: 심해 어둠층(0~350m) 어종 유혹
          if (zone === 'deep' || zone === 'mid' || zone === 'shallow') isAttractive = true;
        } else if (currentBaitId === 'jelly') {
          // 🔮 발광 플랑크톤 젤리: 심연층(0~520m) 초심해 어종 유혹
          if (zone !== 'hadal') isAttractive = true;
        } else if (currentBaitId === 'pearl') {
          // 🌌 심연의 오로라 펄: 해저 초심연(0~750m) 모든 일반/전설 어종 유혹
          isAttractive = true;
        } else if (currentBaitId === 'golden') {
          // 👑 황금 크릴 엑기스: 모든 물고기 유혹
          isAttractive = true;
        }
      }
    }

    if (!isAttractive) return;
    if (this.ignoreCooldown > 0) return;

    // 🛑 찌가 빠르게 아래로 가라앉는 중이면 입질 시도 안 함 (우클릭 STOP 수심 고정 시에만 입질!)
    const isFastSinking = !hook.isDepthLocked && hook.hookVel && hook.hookVel.y > 35;
    if (isFastSinking && !hook.isAllureActive && !this.isNonLiving) {
      return;
    }

    let freeSlot = null;
    if (hook.hooks && hook.hooks.length > 0) {
      // Find all empty hook slots
      const emptySlots = hook.hooks.filter(h => !h.hookedFish);
      if (emptySlots.length === 0) return;
      // Pick the closest empty slot or an unassigned slot
      freeSlot = emptySlots.reduce((closest, slot) => {
        const slotPos = slot.pos || hook.hookPos;
        const d = this.pos.dist(slotPos);
        return (!closest || d < closest.dist) ? { slot, dist: d } : closest;
      }, null)?.slot;
    } else {
      freeSlot = !hook.hookedFish ? { pos: hook.hookPos } : null;
    }
    if (!freeSlot) return;

    const targetPos = freeSlot.pos || hook.hookPos || hook.pos;
    if (!targetPos) return;

    const dist = this.pos.dist(targetPos);
    const detectRadius = (hook.isAllureActive ? 600 : 150) * (hook.attractionBonus || 1.0);

    if (dist < detectRadius) {
      this.state = 'CURIOUS';
      this.curiousTimer = 0;
      this.target = hook;
      this.targetSlot = freeSlot;
      this.isInspecting = false;
      this.inspectTimer = 0;
      this.inspectDuration = 0.8 + Math.random() * 1.4;
    }
  }

  updateCurious(dt, hook) {
    if (!hook || !hook.isSubmerged) {
      this.state = 'WANDER';
      this.isInspecting = false;
      return;
    }

    // 🛑 입질하러 가던 중 찌가 빠르게 내려가면 입질을 포기하고 배회 상태로 복귀!
    const isFastSinking = !hook.isDepthLocked && hook.hookVel && hook.hookVel.y > 35;
    if (isFastSinking && !hook.isAllureActive && !this.isNonLiving) {
      this.state = 'WANDER';
      this.ignoreCooldown = 2.0;
      this.isInspecting = false;
      this.target = null;
      this.targetSlot = null;
      return;
    }

    if (this.targetSlot && this.targetSlot.hookedFish && this.targetSlot.hookedFish !== this) {
      const anotherSlot = hook.hooks ? hook.hooks.find(h => !h.hookedFish) : null;
      if (anotherSlot) {
        this.targetSlot = anotherSlot;
      } else {
        this.state = 'WANDER';
        this.isInspecting = false;
        return;
      }
    }

    const hookPos = (this.targetSlot && this.targetSlot.pos) ? this.targetSlot.pos : (hook.hookPos || hook.pos);
    if (!hookPos) {
      this.state = 'WANDER';
      this.isInspecting = false;
      return;
    }

    const dist = this.pos.dist(hookPos);

    if (dist > 350 || hookPos.y > (this.data.maxDepth + 4) * 20) {
      this.state = 'WANDER';
      this.ignoreCooldown = 2.5;
      this.isInspecting = false;
      return;
    }

    const dir = Vector2.sub(hookPos, this.pos).normalize();
    this.facing = dir.x >= 0 ? 1 : -1;

    const isBaitMoving = hook.isJiggling || hook.isReeling;

    // 💖 환상의 현혹 페로몬 활성화 시 즉시 덥석 뭄!
    if (hook.isAllureActive) {
      if (dist < 42) {
        // Try attaching to target slot or any other remaining empty slot
        let attached = hook.attachFish(this, this.targetSlot);
        if (!attached) {
          attached = hook.attachFish(this, null);
        }
        if (attached) {
          this.state = 'HOOKED';
          this.isInspecting = false;
          if (this.data.id === 'pufferfish') this.isPuffed = true;
          if (this.data.id === 'inky_squid') this.spawnInk();
        } else {
          this.state = 'WANDER';
          this.ignoreCooldown = 2.0;
          this.isInspecting = false;
          this.targetSlot = null;
        }
      } else {
        this.pos.add(Vector2.mult(dir, this.data.speed * 2.6 * dt));
      }
      return;
    }

    // 🎁 보물상자, 유리병 편지, 고대 유물 등 무생물 오브젝트: 생물이 아니므로 쪼기 시늉/도망 없이 닿는 즉시 100% 바늘에 걸림!
    if (this.isNonLiving) {
      if (dist < 46) {
        const attached = hook.attachFish(this, this.targetSlot);
        if (attached) {
          this.state = 'HOOKED';
          this.isInspecting = false;
        } else {
          this.state = 'WANDER';
          this.ignoreCooldown = 3.0;
          this.targetSlot = null;
        }
      } else {
        this.pos.add(Vector2.mult(dir, 26 * dt));
      }
      return;
    }

    // 🎣 미끼 앞 도달 전: 미끼 쪽으로 헤엄쳐 다가감
    if (dist > 32) {
      this.isInspecting = false;
      const approachSpeed = this.data.speed * (isBaitMoving ? 1.6 : 1.0);
      this.pos.add(Vector2.mult(dir, approachSpeed * dt));

    } else {
      // 🧐 미끼 앞 도달! 바로 물지 않고 호기심 가득하게 쪼기 시늉(밀당 & 관찰) 단계
      this.isInspecting = true;
      this.inspectTimer += dt;

      // 미끼 앞에서 콕콕 쪼는 미세 진동 애니메이션
      const nibbleBob = Math.sin(this.inspectTimer * 16) * 3.5;
      this.pos.x = hookPos.x - dir.x * (20 + nibbleBob);
      this.pos.y = hookPos.y - dir.y * (10 + nibbleBob * 0.5);

      // 쪼기 시간 완료 -> 수심별 & 유혹별 입질 확률 판정!
      if (this.inspectTimer >= this.inspectDuration) {
        this.isInspecting = false;

        // 수심 계산 (1m = 20px)
        const depthM = Math.max(1, this.pos.y / 20);

        // 🌊 얕은 수심일수록 경계심이 높아 물 확률이 낮고, 심해는 먹이가 귀해 물 확률이 매우 높음!
        // 0~30m: ~45% | 100m: ~65% | 300m: ~82% | 500m+: ~95%
        let biteChance = 0.40 + Math.min(0.55, (depthM / 250) * 0.55);

        // 낚싯대 릴링/흔들기 유혹 보너스 (+20%)
        if (isBaitMoving) {
          biteChance += 0.20;
        }

        // 🎯 냥냥 매혹 유혹술 패시브 보너스 (+Lv당 +2.5%)
        if (hook.economy && typeof hook.economy.getBiteRateBonus === 'function') {
          biteChance += hook.economy.getBiteRateBonus();
        }

        // 보스는 황금 미끼에 높은 반응 (85%)
        if (this.isBoss) {
          biteChance = 0.85;
        }

        const roll = Math.random();
        if (roll < biteChance) {
          // 🎣 입질 성공! 미끼를 덥석 뭄!
          let attached = hook.attachFish(this, this.targetSlot);
          if (!attached) {
            attached = hook.attachFish(this, null);
          }
          if (attached) {
            this.state = 'HOOKED';
            if (this.data.id === 'pufferfish') this.isPuffed = true;
            if (this.data.id === 'inky_squid') this.spawnInk();
          } else {
            this.state = 'WANDER';
            this.ignoreCooldown = 2.0;
            this.targetSlot = null;
          }
        } else {
          // 💨 의심하고 뒤로 슬쩍 빠져나감 (도망 & 쿨다운)
          this.state = 'FLEE';
          this.ignoreCooldown = 4.0;
          this.wanderTimer = 3.5;
          this.wanderAngle = this.facing > 0 ? Math.PI * 0.85 : Math.PI * 0.15;
        }
      }
    }
  }

  /**
   * 🐟 물고기 주둥이/머리(Mouth) 오프셋 계산
   * 바늘이 물고기 배가 아닌 머리/입에 물리도록 정확한 좌표 보정
   */
  getMouthOffset() {
    if (this.isBoss) {
      // 👑 10 Boss Fishes have 3x massive bodies (Snout at ~60 - 80px)
      const bossType = this.data.id;
      if (bossType === 'boss_megalodon' || bossType === 'boss_cosmic_whale' || bossType === 'boss_leviathan') {
        return 72 * this.scale;
      }
      return 58 * this.scale;
    }
    const type = this.data.drawType || this.data.id;
    if (type === 'anchovy' || type === 'guppy') return 12 * this.scale;
    if (type === 'clownfish' || type === 'pufferfish' || type === 'butterfly') return 15 * this.scale;
    if (type === 'bream' || type === 'koibream' || type === 'flounder' || type === 'mackerel' || type === 'flying') return 20 * this.scale;
    if (type === 'tuna' || type === 'salmon' || type === 'sea_bass' || type === 'angler') return 28 * this.scale;
    if (type === 'swordfish' || type === 'sawshark' || type === 'coelacanth') return 36 * this.scale;
    if (type === 'oarfish' || type === 'whale' || type === 'kraken' || type === 'turtle' || type === 'cosmic_turtle') return 38 * this.scale;
    if (type === 'squid' || type === 'octopus' || type === 'dumbo') return 18 * this.scale;
    if (type === 'bottle') return 22 * this.scale; // Cork mouth
    if (type === 'crab') return 18 * this.scale;
    
    // Default fallback based on fish body size
    return Math.min(40, Math.max(14, (this.data.length || 25) * 0.45)) * this.scale;
  }

  updateHooked(dt, hook, cat) {
    // 🛡️ 유령 물고기 방지: 낚싯대가 없거나 READY 상태이거나 등록된 물고기 목록에 없으면 즉시 유영 상태로 복귀
    if (!hook || hook.state === 'READY' || (hook.allHookedFishes && !hook.allHookedFishes.includes(this))) {
      this.state = 'WANDER';
      this.ignoreCooldown = 4.0;
      this.targetSlot = null;
      return;
    }

    const targetSlotPos = (this.targetSlot && this.targetSlot.pos) ? this.targetSlot.pos : (hook.hookPos || hook.pos);
    if (targetSlotPos) {
      // 🎣 바늘(Hook)이 물고기의 입/머리(Mouth)에 물리도록 오프셋 계산 적용 & 해저 바닥(15070px) 뚫림 방지!
      const mouthOffset = this.getMouthOffset();
      this.pos.x = targetSlotPos.x - this.facing * mouthOffset;
      this.pos.y = Math.min(15070, targetSlotPos.y + Math.sin(this.animTime * 6) * 2);
    }

    this.animTime += dt * (this.isNonLiving ? 0.5 : 3);

    // 🎁 무생물 오브젝트(보물상자, 유리병, 유물)는 힘싸움 및 줄 풀림 탈출 없음
    if (this.isNonLiving) return;

    // --- Struggle, Tiring, and Slack-Line Escape Dynamics ---
    if (this.hasStruggleGauge) {
      this.fightDuration += dt;

      // 1. Tiring / Exhaustion Check
      if (this.fightDuration >= this.maxFightDuration && !this.isExhausted) {
        this.isExhausted = true;
        this.exhaustedTimer = 0;
        this.rage = 0; // Gauge stops building during exhaustion!
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
        // ⚡ Exhausted State: Calm for 15 seconds, then recovers stamina & resumes struggle!
        this.rage = 0;
        this.slackEscapeTimer = 0;
        this.exhaustedTimer += dt;

        if (this.exhaustedTimer >= 15.0) {
          // 👑 15초 후 체력 회복 및 다시 줄다리기 시작!
          this.isExhausted = false;
          this.exhaustedTimer = 0;
          this.fightDuration = 0; // Reset fight timer to start another struggle phase
          this.rage = 35; // Initial burst of rage upon waking up
        }
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
        ctx.font = this.isBoss ? 'bold 14px sans-serif' : 'bold 12px sans-serif';
        ctx.fillText(p.symbol || '✦', p.x, p.y);
      });
      ctx.restore();
    }

    // Draw Fish Body
    ctx.save();
    ctx.translate(this.pos.x, this.pos.y);
    ctx.scale(this.facing * this.scale, this.scale);

    // 👑 Boss Aura or ✨ Shiny Glowing Aura & Chromatic Shimmer
    if (this.isBoss) {
      ctx.shadowColor = '#ff0054';
      ctx.shadowBlur = 24 + Math.sin(this.animTime * 8) * 12;
      ctx.strokeStyle = '#ffd166';
      ctx.lineWidth = 2.5;
    } else if (this.isShiny) {
      ctx.shadowColor = '#ffd166';
      ctx.shadowBlur = 14 + Math.sin(this.animTime * 6) * 6;
      ctx.strokeStyle = '#ffd166';
      ctx.lineWidth = 1.5;
    }

    const drawType = this.data.drawType || 'anchovy';
    this.renderSpecies(ctx, drawType);

    ctx.restore();

    // Render In-Water Struggle Rage Gauge above hooked Boss / Shiny fish
    if (this.state === 'HOOKED' && this.hasStruggleGauge) {
      this.drawStruggleGauge(ctx);
    }
  }

  drawStruggleGauge(ctx) {
    const x = this.pos.x;
    const y = this.pos.y - 36 * this.scale;
    const barW = this.isBoss ? 96 : 68;
    const barH = this.isBoss ? 11 : 8;
    const pct = Math.min(100, Math.max(0, this.rage)) / 100;

    ctx.save();

    // 1. Drop shadow & Gauge Background Pill
    ctx.shadowColor = 'rgba(0, 0, 0, 0.85)';
    ctx.shadowBlur = 10;
    ctx.fillStyle = 'rgba(15, 17, 26, 0.95)';
    ctx.strokeStyle = this.isExhausted ? '#06d6a0' : (this.rage >= 85 ? '#ff0054' : (this.isBoss ? '#ffd166' : '#ffd166'));
    ctx.lineWidth = this.isBoss ? 2.5 : 2;
    ctx.beginPath();
    ctx.roundRect(x - barW / 2, y - barH / 2, barW, barH, 5);
    ctx.fill();
    ctx.stroke();

    // 2. Fill Bar
    if (this.isExhausted) {
      // Exhausted Countdown Bar (Decreases over 10 seconds)
      const remainRatio = Math.max(0, 1.0 - (this.exhaustedTimer / 10.0));
      ctx.fillStyle = '#06d6a0';
      ctx.beginPath();
      ctx.roundRect(x - barW / 2 + 1, y - barH / 2 + 1, (barW - 2) * remainRatio, barH - 2, 4);
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
      ctx.roundRect(x - barW / 2 + 1, y - barH / 2 + 1, (barW - 2) * pct, barH - 2, 4);
      ctx.fill();
    }

    // 3. Status Text Badge
    ctx.shadowBlur = 0;
    ctx.font = this.isBoss ? 'bold 12px sans-serif' : 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';

    if (this.isExhausted) {
      const remainSec = Math.max(0, 10.0 - this.exhaustedTimer).toFixed(1);
      ctx.fillStyle = '#06d6a0';
      ctx.fillText(this.isBoss ? `👑 보스 탈진! (${remainSec}초 후 재분노! 서둘러 감기!)` : `✨ 탈진! (${remainSec}초 후 회복)`, x, y - 5);
    } else if (this.slackEscapeTimer > 1.4) {
      // Blinking Escape Warning!
      const blink = Math.sin(this.animTime * 14) > 0;
      ctx.fillStyle = blink ? '#ff0054' : '#ffd166';
      ctx.fillText('⚠️ 바늘 털림 주의! (가끔 감아주세요!)', x, y - 5);
    } else if (this.rage >= 85) {
      ctx.fillStyle = '#ff0054';
      ctx.fillText(this.isBoss ? '💥 보스 분노 폭발! (릴 멈추기!)' : '💢 분노 폭발! (릴 멈추기!)', x, y - 5);
    } else if (this.rage <= 15) {
      ctx.fillStyle = '#4cc9f0';
      ctx.fillText('💤 힘 빠지는 중...', x, y - 5);
    } else {
      ctx.fillStyle = '#ffd166';
      ctx.fillText(this.isBoss ? `👑 [보스 대물 저항] ${Math.round(this.rage)}%` : `✨ 이로치 저항 ${Math.round(this.rage)}%`, x, y - 5);
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
      case 'cosmic_turtle': {
        const isCosmic = (type === 'cosmic_turtle');
        const flipperWag = Math.sin(this.animTime * 4) * 0.35; // 역동적으로 퍼덕이는 앞다리(팔) 지느러미
        const backFlipperWag = -Math.sin(this.animTime * 4 + 0.4) * 0.22;

        const bodyCol = c.body || (isCosmic ? '#4cc9f0' : '#74c69d');
        const shellCol = c.shell || (isCosmic ? '#3a0ca3' : '#2d6a4f');
        const patternCol = c.pattern || (isCosmic ? '#f72585' : '#1b4332');

        // 1. 꼬리 (Tail)
        ctx.fillStyle = bodyCol;
        ctx.beginPath();
        ctx.moveTo(-20, 0);
        ctx.lineTo(-30, 0);
        ctx.lineTo(-22, 3);
        ctx.closePath();
        ctx.fill();

        // 2. 뒷다리 지느러미 (Back Flippers - 위/아래)
        ctx.save();
        ctx.translate(-14, -13);
        ctx.rotate(backFlipperWag);
        ctx.beginPath();
        ctx.ellipse(0, 0, 9, 4, -0.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        ctx.save();
        ctx.translate(-14, 13);
        ctx.rotate(-backFlipperWag);
        ctx.beginPath();
        ctx.ellipse(0, 0, 9, 4, 0.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // 3. 앞다리 팔 지느러미 (Front Large Flippers - 위/아래)
        // 위쪽 앞다리 (팔)
        ctx.save();
        ctx.translate(10, -12);
        ctx.rotate(-0.55 + flipperWag);
        ctx.fillStyle = bodyCol;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(8, -16, 18, -20);
        ctx.quadraticCurveTo(8, -10, -2, -3);
        ctx.closePath();
        ctx.fill();
        ctx.restore();

        // 아래쪽 앞다리 (팔)
        ctx.save();
        ctx.translate(10, 12);
        ctx.rotate(0.55 - flipperWag);
        ctx.fillStyle = bodyCol;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(8, 16, 18, 20);
        ctx.quadraticCurveTo(8, 10, -2, 3);
        ctx.closePath();
        ctx.fill();
        ctx.restore();

        // 4. 머리 및 목 (Head & Beak)
        ctx.fillStyle = bodyCol;
        ctx.beginPath();
        ctx.ellipse(22, 0, 10, 7, 0, 0, Math.PI * 2);
        ctx.fill();

        // 똘망한 눈 (Eye)
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(26, -2, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.arc(27, -2, 1.3, 0, Math.PI * 2);
        ctx.fill();

        // 5. 둥근 등껍질 (Shell Carapace)
        ctx.fillStyle = shellCol;
        ctx.beginPath();
        ctx.ellipse(0, 0, 24, 18, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = patternCol;
        ctx.lineWidth = 2;
        ctx.stroke();

        // 등껍질 무늬 (Shell Hexagon/Oval Patterns)
        ctx.fillStyle = patternCol;
        ctx.beginPath();
        ctx.ellipse(0, 0, 9, 7, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(11, 0, 5, 5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(-11, 0, 5, 5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(0, -9, 5, 4, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(0, 9, 5, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        if (isCosmic) {
          ctx.fillStyle = '#ffd166';
          ctx.beginPath();
          ctx.arc(0, 0, 3, 0, Math.PI * 2);
          ctx.fill();
        }
        break;
      }

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

      case 'crab': {
        // 🦀 Ancient Horseshoe Crab (고대 투구게)
        ctx.save();
        // 1. Crawling Legs under shell
        ctx.strokeStyle = c.belly || '#8d6e63';
        ctx.lineWidth = 2;
        [-8, -2, 4, 10].forEach(lx => {
          const legWag = Math.sin(this.animTime * 6 + lx) * 3;
          ctx.beginPath();
          ctx.moveTo(lx, 6);
          ctx.lineTo(lx - 4, 12 + legWag);
          ctx.moveTo(lx, -6);
          ctx.lineTo(lx - 4, -12 - legWag);
          ctx.stroke();
        });

        // 2. Long Spike Telson Tail
        ctx.strokeStyle = c.tail || '#4a3b32';
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(-12, 0);
        ctx.lineTo(-34, Math.sin(this.animTime * 4) * 4);
        ctx.stroke();

        // 3. Horseshoe Dome Carapace Shell
        ctx.fillStyle = c.shell || '#6c584c';
        ctx.strokeStyle = '#4a3b32';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(4, 0, 16, -Math.PI * 0.45, Math.PI * 0.45, false);
        ctx.lineTo(-12, 12);
        ctx.lineTo(-8, 0);
        ctx.lineTo(-12, -12);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // 4. Glowing Blue Blood Ancient Runes / Eyes
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.arc(8, -6, 1.8, 0, Math.PI * 2);
        ctx.arc(8, 6, 1.8, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
        break;
      }

      case 'coelacanth':
        // Living Fossil Coelacanth with armored scales and lobed fins
        ctx.fillStyle = c.body || '#14213d';
        ctx.beginPath();
        ctx.ellipse(0, 0, 36, 14, 0, 0, Math.PI * 2);
        ctx.fill();
        // Armored white scale spots
        ctx.fillStyle = '#e5e5e5';
        [[-15, -4], [-6, 3], [8, -3], [18, 2], [2, -6], [-22, 1]].forEach(([sx, sy]) => {
          ctx.beginPath();
          ctx.arc(sx, sy, 2, 0, Math.PI * 2);
          ctx.fill();
        });
        // 3-lobed ancient tail fin
        ctx.fillStyle = c.fin || '#000000';
        ctx.beginPath();
        ctx.moveTo(-32, 0);
        ctx.lineTo(-46, -10 + tailWag * 10);
        ctx.lineTo(-40, 0);
        ctx.lineTo(-46, 10 + tailWag * 10);
        ctx.closePath();
        ctx.fill();
        // Lobed pectoral & pelvic fins
        ctx.beginPath();
        ctx.ellipse(-10, 10, 8, 4, 0.4, 0, Math.PI * 2);
        ctx.ellipse(8, 10, 7, 3, 0.3, 0, Math.PI * 2);
        ctx.fill();
        // Eye & Gills
        ctx.fillStyle = '#fca311';
        ctx.beginPath();
        ctx.arc(24, -3, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(25, -3, 1.5, 0, Math.PI * 2);
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
        // Belly ridges
        ctx.fillStyle = '#1b263b';
        ctx.beginPath();
        ctx.ellipse(10, 12, 45, 10, 0, 0, Math.PI * 2);
        ctx.fill();
        // Golden Constellation Stars
        ctx.fillStyle = c.star || '#ffd166';
        [[-25, -6], [-5, -12], [18, -8], [35, -4], [-40, -4], [5, 2], [-14, 4]].forEach(([sx, sy]) => {
          ctx.beginPath();
          ctx.arc(sx, sy, 2.5, 0, Math.PI * 2);
          ctx.fill();
        });
        // Tail
        ctx.fillStyle = c.body || '#0d1b2a';
        ctx.beginPath();
        ctx.moveTo(-60, 0);
        ctx.lineTo(-82, -18 + tailWag * 12);
        ctx.lineTo(-72, 0);
        ctx.lineTo(-82, 18 + tailWag * 12);
        ctx.closePath();
        ctx.fill();
        break;

      case 'leviathan':
        // Legendary Mythic Leviathan (Abyssal Sea Dragon)
        ctx.save();
        // Body segments & spines
        ctx.fillStyle = c.body || '#0b090a';
        ctx.strokeStyle = c.scale || '#00f5d4';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(0, 0, 75, 22, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Abyssal Glowing Belly Plate
        ctx.fillStyle = c.belly || '#161a1d';
        ctx.beginPath();
        ctx.ellipse(6, 8, 55, 10, 0, 0, Math.PI * 2);
        ctx.fill();

        // Bioluminescent Dorsal Spines & Horns
        ctx.fillStyle = c.scale || '#00f5d4';
        [-40, -22, -4, 14, 32, 50].forEach((hx, idx) => {
          const spineH = 14 + (idx % 3) * 6;
          ctx.beginPath();
          ctx.moveTo(hx - 5, -16);
          ctx.lineTo(hx, -16 - spineH);
          ctx.lineTo(hx + 5, -16);
          ctx.closePath();
          ctx.fill();
        });

        // Dragon Head Horn & Menacing Jaw
        ctx.beginPath();
        ctx.moveTo(60, -12);
        ctx.lineTo(76, -26);
        ctx.lineTo(68, -8);
        ctx.closePath();
        ctx.fill();

        // Glowing Dragon Eye
        ctx.fillStyle = '#ff0054';
        ctx.beginPath();
        ctx.arc(58, -4, 4.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffd166';
        ctx.beginPath();
        ctx.arc(59, -4, 2, 0, Math.PI * 2);
        ctx.fill();

        // Massive Dragon Fin Tail
        ctx.fillStyle = c.scale || '#00f5d4';
        ctx.beginPath();
        ctx.moveTo(-70, 0);
        ctx.lineTo(-98, -26 + tailWag * 14);
        ctx.lineTo(-84, 0);
        ctx.lineTo(-98, 26 + tailWag * 14);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
        break;

      case 'seahorse':
        // Starlight Constellation Seahorse
        ctx.save();
        ctx.fillStyle = c.body || '#7209b7';
        ctx.strokeStyle = c.glow || '#f72585';
        ctx.lineWidth = 1.5;

        // Head & Snout
        ctx.beginPath();
        ctx.arc(4, -20, 8, 0, Math.PI * 2);
        ctx.fill();
        // Snout
        ctx.beginPath();
        ctx.moveTo(8, -22);
        ctx.lineTo(18, -20);
        ctx.lineTo(18, -16);
        ctx.lineTo(8, -16);
        ctx.closePath();
        ctx.fill();
        // Crown Horn
        ctx.fillStyle = c.glow || '#f72585';
        ctx.beginPath();
        ctx.moveTo(0, -26);
        ctx.lineTo(2, -34);
        ctx.lineTo(6, -26);
        ctx.closePath();
        ctx.fill();

        // S-shaped Curved Plump Body
        ctx.fillStyle = c.body || '#7209b7';
        ctx.beginPath();
        ctx.ellipse(2, -6, 9, 13, 0.2, 0, Math.PI * 2);
        ctx.fill();

        // Curved Spiral Tail
        ctx.strokeStyle = c.body || '#7209b7';
        ctx.lineWidth = 4.5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(0, 5);
        ctx.quadraticCurveTo(-10, 16, -4, 24);
        ctx.quadraticCurveTo(4, 28, 8, 22);
        ctx.stroke();

        // Dorsal Star Wing
        ctx.fillStyle = c.glow || '#f72585';
        ctx.beginPath();
        ctx.moveTo(-6, -14);
        ctx.lineTo(-18, -8 + tailWag * 8);
        ctx.lineTo(-6, 2);
        ctx.closePath();
        ctx.fill();

        // Starlight Gem Dots
        ctx.fillStyle = c.star || '#4cc9f0';
        [[-1, -12], [2, -6], [0, 0], [10, -19]].forEach(([gx, gy]) => {
          ctx.beginPath();
          ctx.arc(gx, gy, 1.8, 0, Math.PI * 2);
          ctx.fill();
        });
        ctx.restore();
        break;

      case 'cosmic_turtle':
        // Cosmic Shell Nebula Turtle
        ctx.save();
        // Flipper Legs
        ctx.fillStyle = c.body || '#4cc9f0';
        // Front Flippers
        ctx.beginPath();
        ctx.ellipse(18, -18, 16, 6, -0.6, 0, Math.PI * 2);
        ctx.ellipse(18, 18, 16, 6, 0.6, 0, Math.PI * 2);
        // Back Flippers
        ctx.ellipse(-18, -14, 10, 4, 0.5, 0, Math.PI * 2);
        ctx.ellipse(-18, 14, 10, 4, -0.5, 0, Math.PI * 2);
        ctx.fill();

        // Turtle Head & Cute Beak
        ctx.beginPath();
        ctx.arc(28, 0, 9, 0, Math.PI * 2);
        ctx.fill();
        // Eye
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.arc(31, -3, 2, 0, Math.PI * 2);
        ctx.fill();

        // Massive Nebula Shell
        ctx.fillStyle = c.shell || '#3a0ca3';
        ctx.strokeStyle = c.nebula || '#f72585';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.ellipse(0, 0, 24, 20, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Cosmic Nebula Hex Pattern & Stars
        ctx.fillStyle = c.nebula || '#f72585';
        ctx.beginPath();
        ctx.arc(0, 0, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffd166';
        [[-10, -6], [10, -6], [-8, 8], [8, 8]].forEach(([sx, sy]) => {
          ctx.beginPath();
          ctx.arc(sx, sy, 1.8, 0, Math.PI * 2);
          ctx.fill();
        });
        ctx.restore();
        break;

      case 'chest':
      case 'relic':
        // Atlantis Sunken Relic & Sacred Gold Temple Artifact
        ctx.save();
        // Golden Base Pedestal
        ctx.fillStyle = c.gold || '#ffd166';
        ctx.strokeStyle = '#b7791f';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(-22, 6, 44, 10, 3);
        ctx.fill();
        ctx.stroke();

        // Main Shrine Pillar
        ctx.beginPath();
        ctx.moveTo(-16, 6);
        ctx.lineTo(-12, -18);
        ctx.lineTo(12, -18);
        ctx.lineTo(16, 6);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Glowing Ancient Crystal Core
        ctx.fillStyle = c.crystal || '#06d6a0';
        ctx.strokeStyle = '#a7f3d0';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(0, -28);
        ctx.lineTo(10, -14);
        ctx.lineTo(0, 0);
        ctx.lineTo(-10, -14);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Atlantis Ancient Runes
        ctx.fillStyle = c.rune || '#00b4d8';
        [[-5, -4], [5, -4], [0, 2]].forEach(([rx, ry]) => {
          ctx.beginPath();
          ctx.arc(rx, ry, 1.5, 0, Math.PI * 2);
          ctx.fill();
        });
        ctx.restore();
        break;

      // =========================================================
      // 👑 10 GIANT MYTHIC BOSS FISHES RENDERERS
      // =========================================================
      case 'boss_megalodon': {
        // 🦈 1. Ancient Megalodon Shark (Giant Jaws & Fins)
        ctx.fillStyle = c.body || '#1e293b';
        ctx.beginPath();
        ctx.ellipse(0, 0, 78, 28, 0, 0, Math.PI * 2);
        ctx.fill();

        // White underbelly
        ctx.fillStyle = c.belly || '#e2e8f0';
        ctx.beginPath();
        ctx.ellipse(8, 12, 60, 14, 0, 0, Math.PI * 2);
        ctx.fill();

        // Giant Dorsal Shark Fin
        ctx.fillStyle = c.fin || '#0f172a';
        ctx.beginPath();
        ctx.moveTo(5, -28);
        ctx.lineTo(-15, -60);
        ctx.lineTo(25, -28);
        ctx.closePath();
        ctx.fill();

        // Massive Tail Fin
        ctx.beginPath();
        ctx.moveTo(-68, 0);
        ctx.lineTo(-105, -38 + tailWag * 14);
        ctx.lineTo(-85, 0);
        ctx.lineTo(-105, 38 + tailWag * 14);
        ctx.closePath();
        ctx.fill();

        // Sharp Shark Teeth & Jaws
        ctx.fillStyle = '#ffffff';
        for (let tx = 35; tx <= 65; tx += 6) {
          ctx.beginPath();
          ctx.moveTo(tx, 14);
          ctx.lineTo(tx + 3, 22);
          ctx.lineTo(tx + 6, 14);
          ctx.fill();
        }

        // Glowing Red Predator Eye
        ctx.fillStyle = c.eye || '#ff0054';
        ctx.beginPath();
        ctx.arc(52, -6, 4.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(54, -7, 1.8, 0, Math.PI * 2);
        ctx.fill();
        break;
      }

      case 'boss_cosmic_whale': {
        // 🌌 2. Cosmic Galaxy Nebula Whale
        ctx.fillStyle = c.body || '#240046';
        ctx.beginPath();
        ctx.ellipse(0, 0, 85, 32, 0, 0, Math.PI * 2);
        ctx.fill();

        // Nebula Gradient Swirl Belly
        ctx.fillStyle = c.belly || '#5a189a';
        ctx.beginPath();
        ctx.ellipse(10, 15, 65, 14, 0, 0, Math.PI * 2);
        ctx.fill();

        // Cosmic Nebula Starlight Constellations
        ctx.fillStyle = c.star || '#ffd166';
        [[-40, -10], [-20, -18], [0, -8], [25, -15], [50, -6], [-10, 5], [30, 8], [-35, 10]].forEach(([sx, sy]) => {
          ctx.beginPath();
          ctx.arc(sx, sy, 3, 0, Math.PI * 2);
          ctx.fill();
        });

        // Giant Galaxy Flipper Wings
        ctx.fillStyle = c.fin || '#7b2cbf';
        ctx.beginPath();
        ctx.moveTo(-5, 12);
        ctx.quadraticCurveTo(10, 48, 25, 55);
        ctx.quadraticCurveTo(15, 30, 20, 12);
        ctx.closePath();
        ctx.fill();

        // Majestic Whale Tail
        ctx.beginPath();
        ctx.moveTo(-78, 0);
        ctx.lineTo(-118, -32 + tailWag * 14);
        ctx.lineTo(-95, 0);
        ctx.lineTo(-118, 32 + tailWag * 14);
        ctx.closePath();
        ctx.fill();

        // Glowing Star Eye
        ctx.fillStyle = '#ffd166';
        ctx.beginPath();
        ctx.arc(60, -8, 4, 0, Math.PI * 2);
        ctx.fill();
        break;
      }

      case 'boss_kraken_king': {
        // 🐙 3. Abyssal Kraken King (Golden Crown & 10 Massive Tentacles)
        ctx.fillStyle = c.body || '#9d0208';
        ctx.beginPath();
        ctx.arc(15, 0, 36, 0, Math.PI * 2);
        ctx.fill();

        // Crown on head
        ctx.fillStyle = c.crown || '#ffd166';
        ctx.beginPath();
        ctx.moveTo(5, -36);
        ctx.lineTo(15, -55);
        ctx.lineTo(25, -38);
        ctx.lineTo(35, -55);
        ctx.lineTo(45, -36);
        ctx.closePath();
        ctx.fill();

        // 8-10 Giant Waving Tentacles
        ctx.strokeStyle = c.tentacle || '#6a040f';
        ctx.lineWidth = 6;
        for (let i = -24; i <= 24; i += 8) {
          const sway = Math.sin(this.animTime * 4 + i) * 20;
          ctx.beginPath();
          ctx.moveTo(0, i);
          ctx.quadraticCurveTo(-45, i + sway, -85, i - sway * 1.5);
          ctx.stroke();
        }

        // Fiery Glowing Eye
        ctx.fillStyle = c.eye || '#ffba08';
        ctx.beginPath();
        ctx.arc(28, -6, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(30, -6, 3, 0, Math.PI * 2);
        ctx.fill();
        break;
      }

      case 'boss_sea_dragon': {
        // 🐉 4. Storm Ocean Dragon (Serpentine with Blue Lightning Mane)
        ctx.fillStyle = c.body || '#0077b6';
        // Sinusoidal wavy body
        for (let seg = 0; seg < 6; seg++) {
          const sx = 40 - seg * 24;
          const sy = Math.sin(this.animTime * 5 + seg * 0.8) * 14;
          ctx.beginPath();
          ctx.ellipse(sx, sy, 18 - seg * 1.5, 14 - seg * 1.2, 0, 0, Math.PI * 2);
          ctx.fill();
        }

        // Head & Horns
        const headY = Math.sin(this.animTime * 5) * 14;
        ctx.fillStyle = c.body || '#0077b6';
        ctx.beginPath();
        ctx.ellipse(55, headY, 22, 14, 0, 0, Math.PI * 2);
        ctx.fill();

        // Golden Dragon Horns
        ctx.fillStyle = c.horn || '#ffd166';
        ctx.beginPath();
        ctx.moveTo(50, headY - 10);
        ctx.lineTo(35, headY - 32);
        ctx.lineTo(44, headY - 10);
        ctx.fill();

        // Lightning Cyan Mane
        ctx.strokeStyle = c.lightning || '#00f5d4';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(60, headY + 5);
        ctx.lineTo(85, headY + 12);
        ctx.stroke();

        // Glowing Dragon Eye
        ctx.fillStyle = '#ffd166';
        ctx.beginPath();
        ctx.arc(62, headY - 4, 4, 0, Math.PI * 2);
        ctx.fill();
        break;
      }

      case 'boss_trench_serpent': {
        // 🪐 5. Abyss Trench Leviathan Serpent
        ctx.fillStyle = c.body || '#10002b';
        ctx.strokeStyle = c.rune || '#c77dff';
        ctx.lineWidth = 2.5;

        for (let seg = 0; seg < 7; seg++) {
          const sx = 45 - seg * 22;
          const sy = Math.sin(this.animTime * 4 + seg * 0.7) * 16;
          ctx.beginPath();
          ctx.ellipse(sx, sy, 20 - seg * 1.6, 16 - seg * 1.3, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        }

        // Spines
        ctx.fillStyle = c.spine || '#7b2cbf';
        for (let seg = 0; seg < 6; seg++) {
          const sx = 40 - seg * 22;
          const sy = Math.sin(this.animTime * 4 + seg * 0.7) * 16;
          ctx.beginPath();
          ctx.moveTo(sx, sy - 14);
          ctx.lineTo(sx - 8, sy - 28);
          ctx.lineTo(sx + 4, sy - 14);
          ctx.fill();
        }

        // Menacing Crimson Eyes
        const sHeadY = Math.sin(this.animTime * 4) * 16;
        ctx.fillStyle = c.eye || '#ff0054';
        ctx.beginPath();
        ctx.arc(58, sHeadY - 5, 5, 0, Math.PI * 2);
        ctx.fill();
        break;
      }

      case 'boss_crystal_angler': {
        // 💎 6. Crystal Prismatic Angler
        ctx.fillStyle = c.body || '#00b4d8';
        ctx.beginPath();
        ctx.ellipse(0, 0, 48, 30, 0, 0, Math.PI * 2);
        ctx.fill();

        // Crystal Scale Facets
        ctx.fillStyle = c.crystal || '#e0aaff';
        [[-15, -8], [0, 8], [15, -6], [-5, -14], [10, 12]].forEach(([cx, cy]) => {
          ctx.beginPath();
          ctx.moveTo(cx, cy - 8);
          ctx.lineTo(cx + 6, cy);
          ctx.lineTo(cx, cy + 8);
          ctx.lineTo(cx - 6, cy);
          ctx.closePath();
          ctx.fill();
        });

        // Giant Lure Antenna & Diamond Star Lamp
        ctx.strokeStyle = '#48cae4';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(25, -25);
        ctx.quadraticCurveTo(45, -55, 60, -45);
        ctx.stroke();

        // Diamond Glowing Lure
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#48cae4';
        ctx.shadowBlur = 18;
        ctx.beginPath();
        ctx.arc(60, -45, 9, 0, Math.PI * 2);
        ctx.fill();

        // Eye & Teeth
        ctx.fillStyle = '#212529';
        ctx.beginPath();
        ctx.arc(30, -5, 4, 0, Math.PI * 2);
        ctx.fill();
        break;
      }

      case 'boss_magma_turtle': {
        // 🌋 7. Volcanic Magma Turtle (Molten Shell & Big Flippers)
        const flipperWagM = Math.sin(this.animTime * 3) * 0.4;

        // Front Magma Flippers
        ctx.fillStyle = c.body || '#d90429';
        ctx.save();
        ctx.translate(18, -20);
        ctx.rotate(-0.5 + flipperWagM);
        ctx.beginPath();
        ctx.ellipse(0, 0, 24, 9, -0.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        ctx.save();
        ctx.translate(18, 20);
        ctx.rotate(0.5 - flipperWagM);
        ctx.beginPath();
        ctx.ellipse(0, 0, 24, 9, 0.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Head
        ctx.fillStyle = c.body || '#d90429';
        ctx.beginPath();
        ctx.ellipse(40, 0, 16, 12, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(46, -4, 3.5, 0, Math.PI * 2);
        ctx.fill();

        // Volcanic Obsidian Shell
        ctx.fillStyle = c.shell || '#2b2d42';
        ctx.beginPath();
        ctx.ellipse(0, 0, 42, 32, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = c.magma || '#ff5400';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Glowing Magma Cracks
        ctx.fillStyle = c.magma || '#ff5400';
        [[-15, 0], [15, 0], [0, -14], [0, 14], [0, 0]].forEach(([mx, my]) => {
          ctx.beginPath();
          ctx.arc(mx, my, 6, 0, Math.PI * 2);
          ctx.fill();
        });
        break;
      }

      case 'boss_thunder_manta': {
        // ⚡ 8. Thunder God Manta Ray (Massive Wings & Lightning Sparks)
        ctx.fillStyle = c.body || '#03045e';
        ctx.beginPath();
        ctx.moveTo(60, 0);
        ctx.lineTo(-20, -58);
        ctx.lineTo(-40, 0);
        ctx.lineTo(-20, 58);
        ctx.closePath();
        ctx.fill();

        // Cyan Electric Wing Trim
        ctx.strokeStyle = c.spark || '#00f5d4';
        ctx.lineWidth = 3.5;
        ctx.stroke();

        // Long Electric Whip Tail
        ctx.beginPath();
        ctx.moveTo(-40, 0);
        ctx.lineTo(-95, Math.sin(this.animTime * 6) * 12);
        ctx.stroke();

        // Thunder Eyes
        ctx.fillStyle = c.eye || '#ffd166';
        ctx.beginPath();
        ctx.arc(38, -14, 4, 0, Math.PI * 2);
        ctx.arc(38, 14, 4, 0, Math.PI * 2);
        ctx.fill();
        break;
      }

      case 'boss_ghost_phantom': {
        // 👻 9. Cursed Ghost Phantom Fish (Translucent Emerald Spirit)
        ctx.save();
        ctx.globalAlpha = 0.85;
        ctx.fillStyle = c.body || '#06d6a0';
        ctx.beginPath();
        ctx.ellipse(0, 0, 55, 22, 0, 0, Math.PI * 2);
        ctx.fill();

        // Ghostly Ribs & Skull
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(32, -2, 14, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(38, -4, 4.5, 0, Math.PI * 2);
        ctx.fill();

        // Floating Spirit Wisp Flames
        ctx.fillStyle = c.flame || '#70e000';
        for (let i = 0; i < 4; i++) {
          const fx = -25 - i * 16;
          const fy = Math.sin(this.animTime * 5 + i) * 12;
          ctx.beginPath();
          ctx.arc(fx, fy, 7 - i * 1.2, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
        break;
      }

      case 'boss_chronos_whale': {
        // ⏳ 10. Chronos Time Whale (Golden Gears & Celestial Runes)
        ctx.fillStyle = c.body || '#ffd166';
        ctx.beginPath();
        ctx.ellipse(0, 0, 90, 35, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#e85d04';
        ctx.lineWidth = 3;
        ctx.stroke();

        // White Pearl Belly
        ctx.fillStyle = c.belly || '#ffe8d6';
        ctx.beginPath();
        ctx.ellipse(15, 16, 68, 15, 0, 0, Math.PI * 2);
        ctx.fill();

        // Rotating Time Gear Halo
        ctx.save();
        ctx.translate(-5, -6);
        ctx.rotate(this.animTime * 0.8);
        ctx.strokeStyle = c.gear || '#d4a373';
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.arc(0, 0, 20, 0, Math.PI * 2);
        ctx.stroke();
        for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) {
          ctx.beginPath();
          ctx.moveTo(Math.cos(a) * 18, Math.sin(a) * 18);
          ctx.lineTo(Math.cos(a) * 26, Math.sin(a) * 26);
          ctx.stroke();
        }
        ctx.restore();

        // Majestic Whale Tail
        ctx.fillStyle = c.body || '#ffd166';
        ctx.beginPath();
        ctx.moveTo(-82, 0);
        ctx.lineTo(-125, -34 + tailWag * 15);
        ctx.lineTo(-100, 0);
        ctx.lineTo(-125, 34 + tailWag * 15);
        ctx.closePath();
        ctx.fill();

        // Cyan Chrono Eye
        ctx.fillStyle = c.eye || '#38bdf8';
        ctx.beginPath();
        ctx.arc(65, -8, 5, 0, Math.PI * 2);
        ctx.fill();
        break;
      }

      case 'bottle': {
        // 🍾 Vintage Message in a Bottle (유리병 편지)
        ctx.save();
        const floatTilt = Math.sin(this.animTime * 2.5) * 0.12;
        ctx.rotate(floatTilt);

        // 1. Transparent Glass Bottle Body (유리병 몸통)
        ctx.fillStyle = c.glass || 'rgba(168, 218, 220, 0.75)';
        ctx.strokeStyle = '#457b9d';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(-22, -12, 32, 24, 6);
        ctx.fill();
        ctx.stroke();

        // 2. Rolled Secret Letter Scroll with Ribbon (편지 두루마리)
        ctx.fillStyle = c.paper || '#fefae0';
        ctx.strokeStyle = '#d4a373';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(-16, -6, 20, 12, 3);
        ctx.fill();
        ctx.stroke();

        // Red Ribbon around scroll
        ctx.fillStyle = '#e63946';
        ctx.fillRect(-8, -6, 4, 12);

        // 3. Narrow Bottle Neck (잘록한 병목)
        ctx.fillStyle = c.glass || 'rgba(168, 218, 220, 0.75)';
        ctx.strokeStyle = '#457b9d';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(10, -6, 12, 12, 2);
        ctx.fill();
        ctx.stroke();

        // Bottle Rim / Lip
        ctx.beginPath();
        ctx.roundRect(20, -8, 4, 16, 2);
        ctx.fill();
        ctx.stroke();

        // 4. Brown Cork Stopper (코르크 마개)
        ctx.fillStyle = c.cork || '#bc6c25';
        ctx.strokeStyle = '#8c4815';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(22, -5, 8, 10, 2);
        ctx.fill();
        ctx.stroke();

        // 5. Glossy Glass Shine Highlight Reflection (유리병 반사광)
        ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
        ctx.beginPath();
        ctx.roundRect(-18, -9, 24, 3, 1.5);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(-14, 6, 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
        break;
      }

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
  static drawPreview(canvas, species, isDiscovered = true, isShiny = false) {
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
      // Elegant mystery silhouette for undiscovered species
      ctx.filter = 'grayscale(100%) brightness(40%) opacity(0.45)';
    } else if (isShiny) {
      // ✨ Golden Shiny Aura & Stardust
      ctx.shadowColor = '#ffd166';
      ctx.shadowBlur = 12;
    }

    try {
      // Mock fish instance for renderSpecies
      const mockFish = new Fish(species, new Vector2(0, 0), isShiny);
      mockFish.animTime = 0.8;
      mockFish.tailSpeed = 0.5;
      mockFish.renderSpecies(ctx, species.drawType || 'anchovy');

      if (isShiny) {
        // Draw tiny sparkle stars around fish
        ctx.font = 'bold 10px sans-serif';
        ctx.fillStyle = '#ffd166';
        ctx.fillText('✦', -24, -14);
        ctx.fillText('✦', 20, -12);
        ctx.fillText('✦', -10, 16);
      }
    } catch (err) {
      console.warn("Fish preview render error:", err);
    }

    ctx.restore();
  }
}
