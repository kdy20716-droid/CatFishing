/**
 * Interactive Modals (Shop, Fish Encyclopedia, Aquarium Controls, Settings, Guide)
 */
import { RODS, BOATS, BAITS, HATS, PASSIVE_UPGRADES } from '../systems/Economy.js';
import { FISH_SPECIES } from '../systems/Encyclopedia.js';
import { getBaitIconSvg } from './BaitIcons.js';

export class Modals {
  constructor(economy, encyclopedia, aquarium, soundEngine, hud) {
    this.economy = economy;
    this.encyclopedia = encyclopedia;
    this.aquarium = aquarium;
    this.sound = soundEngine;
    this.hud = hud;

    this.shopModal = document.getElementById('shop-modal');
    this.encyclopediaModal = document.getElementById('encyclopedia-modal');
    this.aquariumUI = document.getElementById('aquarium-controls-ui');
    this.guideModal = document.getElementById('guide-modal');

    this.currentShopTab = 'rods';
    this.currentEncyclopediaFilter = 'all';

    this.initEventListeners();
  }

  initEventListeners() {
    // Close modal buttons
    document.querySelectorAll('.modal-close-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.sound.playClick();
        this.closeAll();
      });
    });

    // Shop Tabs
    document.querySelectorAll('.shop-tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.sound.playClick();
        this.currentShopTab = btn.dataset.tab;
        document.querySelectorAll('.shop-tab-btn').forEach(b => b.classList.toggle('active', b === btn));
        this.renderShopContent();
      });
    });

    // Encyclopedia Filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.sound.playClick();
        this.currentEncyclopediaFilter = btn.dataset.zone;
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.toggle('active', b === btn));
        this.renderEncyclopediaContent();
      });
    });

    // Aquarium Controls
    const btnFeed = document.getElementById('btn-aqua-feed');
    if (btnFeed) {
      btnFeed.addEventListener('click', () => {
        const cx = 150 + Math.random() * (this.aquarium.tankWidth - 300);
        this.aquarium.dropFood(cx, 30);
        this.hud.showNotification('맛있는 먹이를 뿌렸습니다! 🐟', '🥐');
      });
    }

    const btnCollect = document.getElementById('btn-aqua-collect');
    if (btnCollect) {
      btnCollect.addEventListener('click', () => {
        const earned = this.aquarium.collectAllCoins();
        if (earned > 0) {
          this.hud.showNotification(`아쿠아리움 힐링 골드 +${earned}G 수거 완료!`, '💰');
        } else {
          this.hud.showNotification('수거할 코인이 아직 없습니다.', '🫧');
        }
      });
    }

    const btnTheme = document.getElementById('aqua-theme-select');
    if (btnTheme) {
      btnTheme.addEventListener('change', (e) => {
        this.sound.playClick();
        this.aquarium.setTheme(e.target.value);
      });
    }

    const btnExitAqua = document.getElementById('btn-aqua-exit');
    if (btnExitAqua) {
      btnExitAqua.addEventListener('click', () => {
        this.sound.playClick();
        this.aquarium.close();
        if (this.aquariumUI) this.aquariumUI.classList.remove('visible');
      });
    }
  }

  closeAll() {
    if (this.shopModal) this.shopModal.classList.remove('visible');
    if (this.encyclopediaModal) this.encyclopediaModal.classList.remove('visible');
    if (this.guideModal) this.guideModal.classList.remove('visible');
    if (this.aquariumUI && !this.aquarium.isOpen) this.aquariumUI.classList.remove('visible');
  }

  openShop() {
    this.closeAll();
    if (this.shopModal) {
      this.shopModal.classList.add('visible');
      this.renderShopContent();
    }
  }

  openEncyclopedia() {
    this.closeAll();
    if (this.encyclopediaModal) {
      this.encyclopediaModal.classList.add('visible');
      this.renderEncyclopediaContent();
    }
  }

  openGuide() {
    this.closeAll();
    if (this.guideModal) {
      this.guideModal.classList.add('visible');
    }
  }

  renderShopContent() {
    const container = document.getElementById('shop-items-container');
    if (!container) return;
    container.innerHTML = '';

    if (this.currentShopTab === 'rods') {
      RODS.forEach(rod => {
        const isOwned = this.economy.ownedRods.includes(rod.id);
        const isEquipped = this.economy.currentRodId === rod.id;
        const canAfford = this.economy.gold >= rod.price;

        const card = document.createElement('div');
        card.className = `shop-card ${isEquipped ? 'equipped' : ''}`;
        card.innerHTML = `
          <div class="shop-card-header">
            <span class="card-icon" style="color: ${rod.color}">🎣</span>
            <div class="card-title-group">
              <div class="card-title">${rod.name}</div>
              <div class="card-subtitle">Tier ${rod.tier} 낚싯대</div>
            </div>
          </div>
          <div class="card-stats">
            <div>최대 수심: ${(rod.maxLineLength / 20).toFixed(0)}m</div>
            <div>릴링 속도: ${rod.reelSpeed}</div>
            <div>라인 장력 내구도: ${rod.maxTension}</div>
          </div>
          <div class="card-desc">${rod.description}</div>
          <div class="card-footer">
            ${isEquipped 
              ? '<span class="badge-equipped">착용 중</span>' 
              : isOwned 
              ? `<button class="btn-secondary btn-equip" data-id="${rod.id}">장착하기</button>` 
              : `<button class="btn-primary btn-buy ${!canAfford ? 'disabled' : ''}" data-id="${rod.id}">
                  ${rod.price.toLocaleString()} G 구매
                 </button>`}
          </div>
        `;

        const btnEquip = card.querySelector('.btn-equip');
        if (btnEquip) {
          btnEquip.addEventListener('click', () => {
            this.sound.playClick();
            this.economy.equipRod(rod.id);
            this.renderShopContent();
          });
        }

        const btnBuy = card.querySelector('.btn-buy');
        if (btnBuy) {
          btnBuy.addEventListener('click', () => {
            if (this.economy.buyRod(rod.id)) {
              this.sound.playCoin();
              this.hud.showNotification(`${rod.name} 구매 완료!`, '🎣');
              this.renderShopContent();
            } else {
              this.hud.showNotification('골드가 부족합니다!', '⚠️');
            }
          });
        }

        container.appendChild(card);
      });

    } else if (this.currentShopTab === 'boats') {
      BOATS.forEach(boat => {
        const isOwned = this.economy.ownedBoats.includes(boat.id);
        const isEquipped = this.economy.currentBoatId === boat.id;
        const canAfford = this.economy.gold >= boat.price;

        const card = document.createElement('div');
        card.className = `shop-card ${isEquipped ? 'equipped' : ''}`;
        card.innerHTML = `
          <div class="shop-card-header">
            <span class="card-icon">⛵</span>
            <div class="card-title-group">
              <div class="card-title">${boat.name}</div>
              <div class="card-subtitle">항해 속도: ${boat.speed}</div>
            </div>
          </div>
          <div class="card-stats">
            <div>최대 이동 반경: ${(boat.maxTravelX / 20).toFixed(0)}m</div>
          </div>
          <div class="card-desc">${boat.description}</div>
          <div class="card-footer">
            ${isEquipped 
              ? '<span class="badge-equipped">탑승 중</span>' 
              : isOwned 
              ? `<button class="btn-secondary btn-equip-boat" data-id="${boat.id}">탑승하기</button>` 
              : `<button class="btn-primary btn-buy-boat ${!canAfford ? 'disabled' : ''}" data-id="${boat.id}">
                  ${boat.price.toLocaleString()} G 구매
                 </button>`}
          </div>
        `;

        const btnEquip = card.querySelector('.btn-equip-boat');
        if (btnEquip) {
          btnEquip.addEventListener('click', () => {
            this.sound.playClick();
            this.economy.equipBoat(boat.id);
            this.renderShopContent();
          });
        }

        const btnBuy = card.querySelector('.btn-buy-boat');
        if (btnBuy) {
          btnBuy.addEventListener('click', () => {
            if (this.economy.buyBoat(boat.id)) {
              this.sound.playCoin();
              this.hud.showNotification(`${boat.name} 구매 및 탑승 완료!`, '⛵');
              this.renderShopContent();
            } else {
              this.hud.showNotification('골드가 부족합니다!', '⚠️');
            }
          });
        }

        container.appendChild(card);
      });

    } else if (this.currentShopTab === 'baits') {
      BAITS.forEach(bait => {
        const canAfford = this.economy.gold >= bait.price;
        const isOwnedTackle = bait.isTackle && (this.economy.baitInventory[bait.id] || 0) >= 1;
        const isEquippedTackle = (bait.id === 'multi_hook_2' && this.economy.hookCount === 2) || (bait.id === 'multi_hook_3' && this.economy.hookCount === 3);

        let countLabel = '';
        if (bait.id === 'bread') countLabel = '보유량: 무제한';
        else if (bait.isTackle) countLabel = isOwnedTackle ? '영구 해금됨' : '미보유';
        else countLabel = `보유량: ${this.economy.baitInventory[bait.id] || 0}개`;

        const card = document.createElement('div');
        card.className = `shop-card ${isEquippedTackle ? 'equipped' : ''}`;
        card.innerHTML = `
          <div class="shop-card-header">
            <span class="card-icon card-bait-icon-wrapper">${getBaitIconSvg(bait.id)}</span>
            <div class="card-title-group">
              <div class="card-title">${bait.name}</div>
              <div class="card-subtitle">${countLabel}</div>
            </div>
          </div>
          <div class="card-desc">${bait.description}</div>
          <div class="card-footer">
            ${bait.price === 0 
              ? '<span class="badge-free">기본 제공</span>' 
              : isEquippedTackle
              ? '<span class="badge-equipped">장착 중</span>'
              : isOwnedTackle
              ? `<button class="btn-secondary btn-equip-tackle" data-id="${bait.id}">장착하기</button>`
              : `<button class="btn-primary btn-buy-bait ${!canAfford ? 'disabled' : ''}" data-id="${bait.id}">
                  ${bait.price} G ${bait.isTackle ? '영구 구매' : `(+${bait.countPerBuy}개)`}
                 </button>`}
          </div>
        `;

        const btnEquip = card.querySelector('.btn-equip-tackle');
        if (btnEquip) {
          btnEquip.addEventListener('click', () => {
            this.sound.playClick();
            if (bait.id === 'multi_hook_2') this.hud.selectHookCount(2);
            if (bait.id === 'multi_hook_3') this.hud.selectHookCount(3);
            this.renderShopContent();
          });
        }

        const btnBuy = card.querySelector('.btn-buy-bait');
        if (btnBuy) {
          btnBuy.addEventListener('click', () => {
            if (this.economy.buyBait(bait.id)) {
              this.sound.playCoin();
              this.hud.showNotification(`${bait.name} 구매 완료!`, '🎒');
              this.renderShopContent();
              this.hud.initBaitBar();
            } else {
              this.hud.showNotification('골드가 부족하거나 이미 보유 중입니다!', '⚠️');
            }
          });
        }

        container.appendChild(card);
      });

    } else if (this.currentShopTab === 'hats') {
      HATS.forEach(hat => {
        const isOwned = this.economy.ownedHats.includes(hat.id);
        const isEquipped = this.economy.currentHatId === hat.id;
        const canAfford = this.economy.gold >= hat.price;

        const card = document.createElement('div');
        card.className = `shop-card ${isEquipped ? 'equipped' : ''}`;
        card.innerHTML = `
          <div class="shop-card-header">
            <span class="card-icon">${hat.icon}</span>
            <div class="card-title-group">
              <div class="card-title">${hat.name}</div>
              <div class="card-subtitle perk-text">${hat.perk}</div>
            </div>
          </div>
          <div class="card-footer">
            ${isEquipped 
              ? '<span class="badge-equipped">착용 중</span>' 
              : isOwned 
              ? `<button class="btn-secondary btn-equip-hat" data-id="${hat.id}">착용하기</button>` 
              : `<button class="btn-primary btn-buy-hat ${!canAfford ? 'disabled' : ''}" data-id="${hat.id}">
                  ${hat.price.toLocaleString()} G 구매
                 </button>`}
          </div>
        `;

        const btnEquip = card.querySelector('.btn-equip-hat');
        if (btnEquip) {
          btnEquip.addEventListener('click', () => {
            this.sound.playClick();
            this.economy.equipHat(hat.id);
            this.renderShopContent();
          });
        }

        const btnBuy = card.querySelector('.btn-buy-hat');
        if (btnBuy) {
          btnBuy.addEventListener('click', () => {
            if (this.economy.buyHat(hat.id)) {
              this.sound.playCoin();
              this.hud.showNotification(`${hat.name} 구매 및 착용 완료!`, hat.icon);
              this.renderShopContent();
            } else {
              this.hud.showNotification('골드가 부족합니다!', '⚠️');
            }
          });
        }

        container.appendChild(card);
      });

    } else if (this.currentShopTab === 'upgrades') {
      PASSIVE_UPGRADES.forEach(up => {
        const currentLv = this.economy.upgradeLevels[up.id] || 0;
        const isMax = currentLv >= up.maxLevel;
        const cost = this.economy.getUpgradeCost(up.id);
        const canAfford = this.economy.gold >= cost;

        const card = document.createElement('div');
        card.className = `shop-card ${isMax ? 'maxed' : ''}`;
        card.innerHTML = `
          <div class="shop-card-header">
            <span class="card-icon">${up.icon}</span>
            <div class="card-title-group">
              <div class="card-title">${up.name}</div>
              <div class="card-subtitle">현재 레벨: Lv.${currentLv} / Lv.${up.maxLevel}</div>
            </div>
          </div>
          <div class="card-desc">${up.description}</div>
          <div class="card-footer">
            ${isMax 
              ? '<span class="badge-max">MAX 강화 완료</span>' 
              : `<button class="btn-primary btn-upgrade ${!canAfford ? 'disabled' : ''}" data-id="${up.id}">
                  ${cost.toLocaleString()} G 강화 (Lv.${currentLv + 1})
                 </button>`}
          </div>
        `;

        const btnUpgrade = card.querySelector('.btn-upgrade');
        if (btnUpgrade) {
          btnUpgrade.addEventListener('click', () => {
            if (this.economy.buyUpgrade(up.id)) {
              this.sound.playCoin();
              this.hud.showNotification(`${up.name} Lv.${this.economy.upgradeLevels[up.id]} 강화 성공!`, up.icon);
              this.renderShopContent();
            } else {
              this.hud.showNotification('골드가 부족합니다!', '⚠️');
            }
          });
        }

        container.appendChild(card);
      });
    }
  }

  renderEncyclopediaContent() {
    const container = document.getElementById('encyclopedia-grid');
    const statsContainer = document.getElementById('encyclopedia-stats');
    if (!container) return;
    container.innerHTML = '';

    const stats = this.encyclopedia.getCompletionStats();
    if (statsContainer) {
      statsContainer.innerHTML = `
        <div class="encyclopedia-progress-bar">
          <div class="progress-fill" style="width: ${stats.percent}%"></div>
        </div>
        <div class="progress-label">도감 수집율: <strong>${stats.caught} / ${stats.total} (${stats.percent}%)</strong></div>
      `;
    }

    const filtered = FISH_SPECIES.filter(f => {
      if (this.currentEncyclopediaFilter === 'all') return true;
      return f.zone === this.currentEncyclopediaFilter;
    });

    filtered.forEach(species => {
      const record = this.encyclopedia.getRecord(species.id);
      const isDiscovered = record.caughtCount > 0;

      const card = document.createElement('div');
      card.className = `encyclo-card ${isDiscovered ? 'unlocked' : 'locked'} rarity-${species.rarity}`;

      if (isDiscovered) {
        const shinyTag = record.shinyCount > 0 ? `<div style="color: #ffd166; font-weight: 800; margin-top: 4px;">✨ 이로치 발견: ${record.shinyCount}회</div>` : '';
        card.innerHTML = `
          <div class="encyclo-badge">${species.zone.toUpperCase()}</div>
          <div class="encyclo-title">${species.name}</div>
          <div class="encyclo-eng">${species.engName}</div>
          <div class="encyclo-details">
            <div>서식 수심: <strong>${species.minDepth}m ~ ${species.maxDepth}m</strong></div>
            <div>최대 크기: <strong>${record.maxSize} cm</strong></div>
            <div>잡은 횟수: <strong>${record.caughtCount} 회</strong></div>
            <div>기본 가격: <strong>${species.basePrice} G</strong></div>
            ${shinyTag}
          </div>
          <div class="encyclo-desc">${species.description}</div>
        `;
      } else {
        card.innerHTML = `
          <div class="encyclo-badge">${species.zone.toUpperCase()}</div>
          <div class="encyclo-title mystery-title">???</div>
          <div class="encyclo-eng">미지의 생명체</div>
          <div class="encyclo-details">
            <div>서식 수심: <strong>${species.minDepth}m ~ ${species.maxDepth}m</strong></div>
            <div>상태: <strong>미발견 🔒</strong></div>
          </div>
          <div class="encyclo-hint">이 수심대에서 적절한 미끼로 낚아보세요! (✨ 이로치 출현 가능)</div>
        `;
      }

      container.appendChild(card);
    });
  }
}
