/**
 * 🎲 Gambling Boat & Wagering Management System
 * Handles spawn scheduling, fish wagering transactions, and payouts
 */
import { GamblerBoat } from '../entities/GamblerBoat.js?v=8.0.0';

export class GamblingSystem {
  constructor(economy, soundEngine, hud) {
    this.economy = economy;
    this.sound = soundEngine;
    this.hud = hud;

    this.boat = new GamblerBoat();

    // Spawn scheduling (Spawns every 12~18 minutes, with initial test spawn after 45s)
    this.spawnIntervalMin = 720; // 12 minutes
    this.spawnIntervalMax = 1080; // 18 minutes
    this.nextSpawnTimer = 45; // First spawn in 45 seconds for rapid testing / discovery!

    this.onBoatSpawnCallback = null;
    this.onBoatDespawnCallback = null;
  }

  update(dt, waterSurfaceY, playerCatPos) {
    // 1. Update boat entity
    const wasActive = this.boat.isActive;
    this.boat.update(dt, waterSurfaceY, playerCatPos);

    if (wasActive && !this.boat.isActive) {
      // Just despawned
      this.hud.showNotification('🌊 도박 어선냥이가 닻을 올리고 먼 바다로 떠났습니다냥!', '💨');
      this.scheduleNextSpawn();
      if (typeof this.onBoatDespawnCallback === 'function') {
        this.onBoatDespawnCallback();
      }
    }

    // 2. Spawn timer countdown
    if (!this.boat.isActive) {
      this.nextSpawnTimer -= dt;
      if (this.nextSpawnTimer <= 0) {
        this.triggerSpawn();
      }
    }
  }

  triggerSpawn(explicitX = null, duration = 360) {
    this.boat.spawn(explicitX, duration);
    const distM = Math.max(0, Math.round((this.boat.pos.x - 200) / 20));

    this.hud.showNotification(
      `🏴‍☠️ [수상한 도박 어선]이 부두 인근 약 ${distM.toLocaleString()}m 해역에 정박했습니다냥! (체류: ${Math.round(duration / 60)}분) 🎲`,
      '🎰'
    );
    this.sound.playCoin();

    if (typeof this.onBoatSpawnCallback === 'function') {
      this.onBoatSpawnCallback(this.boat);
    }
  }

  scheduleNextSpawn() {
    this.nextSpawnTimer = this.spawnIntervalMin + Math.random() * (this.spawnIntervalMax - this.spawnIntervalMin);
  }

  /**
   * Process Fish Wager
   * @param {string} basketId - ID of fish in caughtFishBasket
   * @param {'red'|'black'|'green'} betChoice - Target color
   * @param {Object} rouletteResult - { number, color }
   */
  resolveFishWager(basketId, betChoice, rouletteResult) {
    const fish = this.economy.caughtFishBasket.find(f => f.basketId === basketId);
    if (!fish) {
      return { success: false, error: 'NO_FISH' };
    }

    const isWin = (betChoice === rouletteResult.color);
    const fishBaseValue = fish.price || 50;

    if (isWin) {
      let multiplier = 2;
      let isJackpot = false;

      if (betChoice === 'green') {
        multiplier = 30; // 🌟 30x Jackpot on Green 0!
        isJackpot = true;
      }

      const winGold = Math.round(fishBaseValue * multiplier);
      this.economy.addGold(winGold);

      // Keep fish or remove fish with huge gold payout
      this.economy.removeFishFromBasket(basketId);

      return {
        success: true,
        isWin: true,
        betChoice,
        resultColor: rouletteResult.color,
        resultNumber: rouletteResult.number,
        multiplier,
        winGold,
        isJackpot,
        fishName: fish.speciesName,
        isShiny: fish.isShiny
      };
    } else {
      // Lose: Remove fish from basket
      this.economy.removeFishFromBasket(basketId);

      return {
        success: true,
        isWin: false,
        betChoice,
        resultColor: rouletteResult.color,
        resultNumber: rouletteResult.number,
        lostGold: fishBaseValue,
        fishName: fish.speciesName
      };
    }
  }

  /**
   * Process Gold Wager fallback
   */
  resolveGoldWager(amount, betChoice, rouletteResult) {
    if (this.economy.gold < amount) {
      return { success: false, error: 'NO_GOLD' };
    }

    // Deduct bet amount first
    this.economy.spendGold(amount);

    const isWin = (betChoice === rouletteResult.color);

    if (isWin) {
      const multiplier = (betChoice === 'green') ? 30 : 2;
      const winGold = amount * multiplier;
      this.economy.addGold(winGold);

      return {
        success: true,
        isWin: true,
        betChoice,
        resultColor: rouletteResult.color,
        resultNumber: rouletteResult.number,
        multiplier,
        winGold,
        isJackpot: (betChoice === 'green')
      };
    } else {
      return {
        success: true,
        isWin: false,
        betChoice,
        resultColor: rouletteResult.color,
        resultNumber: rouletteResult.number,
        lostGold: amount
      };
    }
  }
}
