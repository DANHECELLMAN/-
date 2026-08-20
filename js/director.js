/**
 * 《今天也不想上班》- 刷怪导演与模块化关卡系统 (V1.5 终极优化版)
 */

import { STAGES_CONFIG, NORMAL_ENEMIES, ELITES, RANDOM_BOSS_ROSTER } from './constants.js';
import { Enemy, Elite, createBossInstance } from './entities.js';
import { sound } from './audio.js';

export class WaveDirector {
  constructor(game) {
    this.game = game;
    this.stageConfig = STAGES_CONFIG.stage_1;
    this.gameTime = 0;
    this.spawnTimer = 0;
    this.accumulatedBudget = 0;
    this.hrSpawned = false;
    this.pmSpawned = false;
    this.midBossSpawned = false;
    this.bossSpawned = false;
    this.tempDemandTimer = 0;
    this.recentKills = 0;
    this.killRateTimer = 0;
    this.dynamicMult = 1.0;
    this.nextEndlessBossTime = 90; // 无尽模式每90秒刷新一次随机强力Boss
  }

  setStage(stageId) {
    this.stageConfig = STAGES_CONFIG[stageId] || STAGES_CONFIG.stage_1;
    this.reset();
  }

  reset() {
    this.gameTime = 0;
    this.spawnTimer = 0;
    this.accumulatedBudget = 0;
    this.hrSpawned = false;
    this.pmSpawned = false;
    this.midBossSpawned = false;
    this.bossSpawned = false;
    this.tempDemandTimer = 0;
    this.recentKills = 0;
    this.killRateTimer = 0;
    this.dynamicMult = 1.0;
    this.nextEndlessBossTime = 90;
  }

  update(dt) {
    if (this.game.isPaused || this.game.isGameOver || this.game.isVictory) return;

    this.gameTime += dt;

    // 动态难度微调
    this.killRateTimer += dt;
    if (this.killRateTimer >= 20.0) {
      this.killRateTimer = 0;
      if (this.recentKills > 35) {
        this.dynamicMult = 1.15;
      } else if (this.game.player && this.game.player.hp / this.game.player.maxHp <= 0.35) {
        this.dynamicMult = 0.88;
      } else {
        this.dynamicMult = 1.0;
      }
      this.recentKills = 0;
    }

    // 无尽模式专属无限刷怪与周期随机Boss机制
    if (this.stageConfig.isEndless || this.stageConfig.duration === Infinity) {
      this.updateEndlessMode(dt);
      return;
    }

    // 标准关卡逻辑
    if (!this.hrSpawned && this.gameTime >= ELITES.hr.spawnTime && !this.bossSpawned) {
      this.hrSpawned = true;
      this.spawnElite("hr");
    }

    if (!this.pmSpawned && this.gameTime >= ELITES.pm.spawnTime && !this.bossSpawned) {
      this.pmSpawned = true;
      this.spawnElite("pm");
    }

    // 关卡中期随机强力Boss突袭 (220s)
    if (!this.midBossSpawned && this.gameTime >= 220 && !this.bossSpawned) {
      this.midBossSpawned = true;
      this.spawnRandomInvasionBoss();
    }

    // 关底最终Boss登场
    if (!this.bossSpawned && this.gameTime >= this.stageConfig.duration) {
      this.bossSpawned = true;
      this.spawnBoss();
      return;
    }

    if (this.bossSpawned) return;

    const timeline = this.stageConfig.timeline;
    const currentWave = timeline.find(w => this.gameTime >= w.start && this.gameTime < w.end) || timeline[timeline.length - 1];

    if (currentWave.specialEvent === "temp_demand") {
      this.tempDemandTimer += dt;
      if (this.tempDemandTimer >= 5.0) {
        this.tempDemandTimer = 0;
        this.game.player.addPressure(2, this.game);
        this.game.addFloatingText(this.game.player.x, this.game.player.y - 35, "⚠️ 临时需求：压力+2", "#f59e0b", 14);
      }
    }

    const baseBudgetPerSec = (currentWave.budget / 10.0) * this.dynamicMult * (currentWave.specialEvent === "temp_demand" ? 1.35 : 1.0);
    this.accumulatedBudget += baseBudgetPerSec * dt;

    this.spawnTimer += dt;
    if (this.spawnTimer >= 0.75) {
      this.spawnTimer = 0;
      this.spawnWaveEnemies(currentWave);
    }

    this.recycleDistantEnemies();
  }

  updateEndlessMode(dt) {
    // 无尽模式：时间和难度无限成长
    const minutes = this.gameTime / 60.0;
    const hpMult = 1.0 + minutes * 0.40;
    const dmgMult = 1.0 + minutes * 0.15;
    const endlessBudget = 14 + (this.gameTime / 30.0) * 4.5;

    const baseBudgetPerSec = (endlessBudget / 8.0) * this.dynamicMult;
    this.accumulatedBudget += baseBudgetPerSec * dt;

    this.spawnTimer += dt;
    if (this.spawnTimer >= 0.65) {
      this.spawnTimer = 0;
      const allEnemyTypes = Object.keys(NORMAL_ENEMIES);
      const waveObj = {
        enemies: allEnemyTypes,
        hpMult: hpMult,
        dmgMult: dmgMult
      };
      this.spawnWaveEnemies(waveObj);
    }

    // 无尽模式每隔 90 秒随机刷新一个强力Boss！
    if (this.gameTime >= this.nextEndlessBossTime) {
      this.nextEndlessBossTime += 90;
      this.spawnRandomInvasionBoss();
    }

    this.recycleDistantEnemies();
  }

  spawnWaveEnemies(wave) {
    if (this.game.enemies.length >= 105) return;

    while (this.accumulatedBudget >= 1.0 && this.game.enemies.length < 105) {
      const availableEnemies = wave.enemies;
      const typeId = availableEnemies[Math.floor(Math.random() * availableEnemies.length)];
      const conf = NORMAL_ENEMIES[typeId] || NORMAL_ENEMIES.zombie_colleague;

      if (this.accumulatedBudget >= conf.threatCost) {
        this.accumulatedBudget -= conf.threatCost;

        if (conf.groupCount && conf.groupCount > 1) {
          for (let i = 0; i < conf.groupCount; i++) {
            this.spawnEnemyAtEdge(typeId, wave.hpMult, wave.dmgMult);
          }
        } else {
          this.spawnEnemyAtEdge(typeId, wave.hpMult, wave.dmgMult);
        }
      } else {
        break;
      }
    }
  }

  spawnEnemyAtEdge(typeId, hpMult, dmgMult) {
    const p = this.game.player;
    if (!p) return;
    const angle = Math.random() * Math.PI * 2;
    const distance = 440 + Math.random() * 80;
    const sx = Math.max(20, Math.min(this.game.mapWidth - 20, p.x + Math.cos(angle) * distance));
    const sy = Math.max(20, Math.min(this.game.mapHeight - 20, p.y + Math.sin(angle) * distance));

    const enemy = new Enemy(typeId, sx, sy, hpMult, dmgMult);
    this.game.enemies.push(enemy);
  }

  spawnElite(typeId) {
    const p = this.game.player;
    if (!p) return;
    const angle = Math.random() * Math.PI * 2;
    const distance = 450;
    const sx = Math.max(40, Math.min(this.game.mapWidth - 40, p.x + Math.cos(angle) * distance));
    const sy = Math.max(40, Math.min(this.game.mapHeight - 40, p.y + Math.sin(angle) * distance));

    const elite = new Elite(typeId, sx, sy);
    this.game.enemies.push(elite);
    sound.playBossWarning();
    this.game.addFloatingText(p.x, p.y - 45, `🚨 精英【${elite.name}】进入现场！`, "#f43f5e", 20);
  }

  spawnRandomInvasionBoss() {
    const p = this.game.player;
    if (!p) return;
    const randomConf = RANDOM_BOSS_ROSTER[Math.floor(Math.random() * RANDOM_BOSS_ROSTER.length)];
    const angle = Math.random() * Math.PI * 2;
    const distance = 380;
    const bx = Math.max(50, Math.min(this.game.mapWidth - 50, p.x + Math.cos(angle) * distance));
    const by = Math.max(50, Math.min(this.game.mapHeight - 50, p.y + Math.sin(angle) * distance));

    const boss = createBossInstance(randomConf.type || randomConf.id, bx, by, randomConf);
    this.game.enemies.push(boss);
    sound.playBossWarning();
    p.addPressure(8, this.game);
    this.game.addFloatingText(p.x, p.y - 50, `⚡ 突袭Boss【${boss.name}】强行介入！`, "#ef4444", 22);
  }

  spawnBoss() {
    this.game.enemies = this.game.enemies.filter(e => e.isElite);
    const p = this.game.player;
    if (!p) return;

    const bossConf = this.stageConfig.boss;
    const boss = createBossInstance(bossConf.type || bossConf.id, p.x, p.y - 250, bossConf);
    this.game.enemies.push(boss);
    this.game.bossInstance = boss;

    sound.playBossWarning();
    p.addPressure(10, this.game);
    this.game.addFloatingText(p.x, p.y - 50, `👹【${boss.name}】登场！今日拒绝加班！`, "#dc2626", 24);
  }

  recycleDistantEnemies() {
    const p = this.game.player;
    if (!p) return;
    this.game.enemies.forEach(e => {
      if (!e.isElite && !e.isBoss) {
        const dist = Math.hypot(e.x - p.x, e.y - p.y);
        if (dist > 680) {
          const angle = Math.random() * Math.PI * 2;
          e.x = p.x + Math.cos(angle) * 400;
          e.y = p.y + Math.sin(angle) * 400;
        }
      }
    });
  }
}
