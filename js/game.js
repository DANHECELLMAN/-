/**
 * 《今天也不想上班》- 核心游戏引擎与状态机 (V1.5 终极优化版)
 */

import { M_TO_PX, CHARACTERS, PLAYER_BASE, PRESSURE_STAGES, WEAPONS, SKILLS, ARTIFACTS, UPGRADE_SYSTEM, TALENTS, STAGES_CONFIG } from './constants.js';
import { Player, DamageNumber, FloatingText, Particle, DropItem, Projectile, AOEZone, TerrainObstacle, createBossInstance } from './entities.js';
import { WaveDirector } from './director.js';
import { sound } from './audio.js';

export class GameEngine {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');

    this.state = 'MENU'; // 'MENU', 'PLAYING', 'PAUSED', 'GAMEOVER', 'VICTORY'
    this.selectedCharacterId = "xiaochen";
    this.selectedStageId = "stage_1";

    this.player = null;
    this.enemies = [];
    this.projectiles = [];
    this.aoeZones = [];
    this.obstacles = [];
    this.drops = [];
    this.particles = [];
    this.damageNumbers = [];
    this.floatingTexts = [];
    this.bossInstance = null;

    this.saveData = this.loadSaveData();
    this.director = new WaveDirector(this);

    this.lastTime = 0;
    this.timeScale = 1.0;
    this.slowMoTimer = 0;
    this.slowMoScale = 1.0;

    this.keys = {};
    this.joystick = { x: 0, y: 0, active: false, id: null };
    this.kills = 0;
    this.gameStartTime = 0;
    this.showMobileControls = true;
    this.freeRerollAvailable = true;
    this.activeUpgradeTab = "character"; // "character" 或 "weapon"

    this.initCanvasSize();
    this.initEventListeners();
  }

  loadSaveData() {
    try {
      const raw = localStorage.getItem('slacker_survivor_save_v14');
      if (raw) {
        const d = JSON.parse(raw);
        if (!d.unlockedStages || d.unlockedStages.length === 0) {
          d.unlockedStages = ["stage_1"];
        }
        if (!d.talents) d.talents = {};
        return d;
      }
    } catch (e) {}

    return {
      gold: 200,
      unlockedCharacters: ["xiaochen", "awei", "lili", "xiaozhang"],
      unlockedStages: ["stage_1"],
      talents: {
        hp_max: 0, move_speed: 0, hp_regen: 0, stress_resist: 0, pickup_range: 0, crit_boost: 0, xp_gain: 0, gold_gain: 0,
        weapon_damage: 0, attack_speed: 0, aoe_range: 0, bullet_speed: 0, knockback_power: 0, evo_resonance: 0
      },
      highestEndlessTime: 0,
      highestEndlessKills: 0
    };
  }

  saveGameData() {
    try {
      localStorage.setItem('slacker_survivor_save_v14', JSON.stringify(this.saveData));
    } catch (e) {}
  }

  initCanvasSize() {
    const dpr = window.devicePixelRatio || 1;
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.canvas.width = width * dpr;
    this.canvas.height = height * dpr;
    this.canvas.style.width = width + 'px';
    this.canvas.style.height = height + 'px';
    this.ctx.scale(dpr, dpr);
    this.viewWidth = width;
    this.viewHeight = height;
  }

  initEventListeners() {
    window.addEventListener('resize', () => this.initCanvasSize());

    window.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;
      if (e.code === 'Space' && this.state === 'PLAYING') {
        e.preventDefault();
        this.player.performDodge(this);
      }
      if (e.code === 'KeyE' && this.state === 'PLAYING') {
        e.preventDefault();
        this.player.performActiveSkill(this);
      }
      if (e.code === 'Escape' && this.state === 'PLAYING') {
        this.pauseGame();
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });

    // 触控虚拟摇杆
    const joyZone = document.getElementById('joystick-zone');
    const joyBase = document.getElementById('joystick-base');
    const joyNub = document.getElementById('joystick-nub');

    if (joyZone) {
      const handleTouch = (e) => {
        e.preventDefault();
        const touch = e.touches[0];
        const rect = joyBase.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const dx = touch.clientX - centerX;
        const dy = touch.clientY - centerY;
        const dist = Math.hypot(dx, dy);
        const maxR = rect.width / 2 - 10;

        if (dist > 0) {
          const nx = dx / dist;
          const ny = dy / dist;
          const clampedDist = Math.min(dist, maxR);
          this.joystick.x = nx * (clampedDist / maxR);
          this.joystick.y = ny * (clampedDist / maxR);
          joyNub.style.transform = `translate(${nx * clampedDist}px, ${ny * clampedDist}px)`;
        }
      };

      joyZone.addEventListener('touchstart', (e) => {
        this.joystick.active = true;
        handleTouch(e);
      }, { passive: false });

      joyZone.addEventListener('touchmove', (e) => {
        if (this.joystick.active) handleTouch(e);
      }, { passive: false });

      const resetJoy = () => {
        this.joystick.active = false;
        this.joystick.x = 0;
        this.joystick.y = 0;
        if (joyNub) joyNub.style.transform = `translate(0px, 0px)`;
      };

      joyZone.addEventListener('touchend', resetJoy);
      joyZone.addEventListener('touchcancel', resetJoy);
    }
  }

  startNewGame() {
    sound.init();
    sound.playClick();
    this.hideAllModals();

    const stageConf = STAGES_CONFIG[this.selectedStageId] || STAGES_CONFIG.stage_1;
    this.mapWidth = stageConf.mapWidth;
    this.mapHeight = stageConf.mapHeight;

    this.player = new Player(this, this.selectedCharacterId);
    this.enemies = [];
    this.projectiles = [];
    this.aoeZones = [];
    this.obstacles = [];
    this.drops = [];
    this.particles = [];
    this.damageNumbers = [];
    this.floatingTexts = [];
    this.bossInstance = null;

    this.kills = 0;
    this.gameStartTime = Date.now();
    this.freeRerollAvailable = true;

    this.director.setStage(this.selectedStageId);

    document.getElementById('hud').style.display = 'block';
    document.getElementById('main-menu').style.display = 'none';
    if (this.showMobileControls) {
      document.getElementById('mobile-controls').style.display = 'block';
    }

    this.state = 'PLAYING';
    sound.startBgm();
  }

  pauseGame() {
    if (this.state !== 'PLAYING') return;
    this.state = 'PAUSED';
    sound.playClick();
    this.renderPauseModal();
    document.getElementById('pause-modal').style.display = 'flex';
  }

  resumeGame() {
    if (this.state !== 'PAUSED') return;
    this.hideAllModals();
    this.state = 'PLAYING';
  }

  triggerSlowMotion(duration = 0.4, scale = 0.25) {
    this.slowMoTimer = duration;
    this.slowMoScale = scale;
  }

  getXpNeeded(level) {
    const table = [0, 12, 28, 48, 72, 102, 138, 180, 230, 290, 360, 440, 530, 630, 740, 860, 990, 1130, 1280, 1440, 1620, 1810, 2020, 2240, 2480, 2730, 3000, 3280, 3580, 3900, 4240, 4600, 4980, 5380, 5800, 6240, 6700, 7180, 7680, 8200, 8750, 9320, 9920, 10540, 11190, 11860, 12560, 13290, 14050, 14840];
    return table[level] || (level * 320);
  }

  addDamageNumber(x, y, damage, isCrit = false, isPlayer = false, prefix = "") {
    this.damageNumbers.push(new DamageNumber(x, y, damage, isCrit, isPlayer, prefix));
  }

  addFloatingText(x, y, text, color = "#38bdf8", size = 16) {
    this.floatingTexts.push(new FloatingText(x, y, text, color, size));
  }

  getNearestEnemy(x, y, maxDist = 9999) {
    let nearest = null;
    let minDist = maxDist;
    for (const e of this.enemies) {
      if (e.alive) {
        const dist = Math.hypot(e.x - x, e.y - y);
        if (dist < minDist) {
          minDist = dist;
          nearest = e;
        }
      }
    }
    return nearest;
  }

  // 智能热点索敌算法：自动搜寻敌人聚集最多、密度最高的目标区域
  getOptimalTarget(maxRange = 9999, clusterRadius = 120) {
    if (!this.player) return null;
    const px = this.player.x;
    const py = this.player.y;

    let bestTarget = null;
    let highestScore = -1;

    for (const e of this.enemies) {
      if (e.alive) {
        const distToP = Math.hypot(e.x - px, e.y - py);
        if (distToP <= maxRange) {
          let clusterCount = 0;
          for (const other of this.enemies) {
            if (other.alive && Math.hypot(other.x - e.x, other.y - e.y) <= clusterRadius) {
              clusterCount++;
            }
          }
          const bossBonus = e.isBoss ? 8 : (e.isElite ? 4 : 1);
          const score = (clusterCount * 2.5 + bossBonus) / (1 + distToP / 240);
          if (score > highestScore) {
            highestScore = score;
            bestTarget = e;
          }
        }
      }
    }
    return bestTarget || this.getNearestEnemy(px, py, maxRange);
  }

  getTopClusterTargets(maxRange = 9999, count = 3) {
    if (!this.player) return [];
    const px = this.player.x;
    const py = this.player.y;
    const scored = [];

    for (const e of this.enemies) {
      if (e.alive) {
        const distToP = Math.hypot(e.x - px, e.y - py);
        if (distToP <= maxRange) {
          let clusterCount = 0;
          for (const other of this.enemies) {
            if (other.alive && Math.hypot(other.x - e.x, other.y - e.y) <= 120) {
              clusterCount++;
            }
          }
          scored.push({ target: e, score: clusterCount / (1 + distToP / 300) });
        }
      }
    }
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, count).map(s => s.target);
  }

  getDenseEnemyClusterTarget(x, y, maxDist = 9999) {
    return this.getOptimalTarget(maxDist, 140);
  }

  generateUpgradeChoices() {
    const choices = [];
    const p = this.player;

    // 检查武器超级进化与组合共鸣
    for (const wKey in WEAPONS) {
      const wConf = WEAPONS[wKey];
      if (wConf.evolution && !p.evolvedWeapons[wConf.evolution.id]) {
        let canEvo = true;
        const reqs = wConf.evolution.req;
        for (const reqKey in reqs) {
          const reqVal = reqs[reqKey];
          if (WEAPONS[reqKey]) {
            if ((p.weapons[reqKey] || 0) < reqVal) canEvo = false;
          } else if (SKILLS[reqKey]) {
            if ((p.skills[reqKey] || 0) < reqVal) canEvo = false;
          }
        }
        if (canEvo) {
          choices.push({
            type: 'EVOLUTION',
            id: wConf.evolution.id,
            baseWeapon: wKey,
            name: wConf.evolution.name,
            icon: wConf.evolution.icon,
            tag: '🌟 超级进化',
            desc: wConf.evolution.desc
          });
        }
      }
    }

    // 可用武器升级
    for (const wKey in WEAPONS) {
      const wConf = WEAPONS[wKey];
      if (wKey === "ac_fusion_evo") continue;
      const curLvl = p.weapons[wKey] || 0;
      if (curLvl < 5) {
        const nextLvl = curLvl + 1;
        const lvlInfo = wConf.levels[nextLvl - 1];
        choices.push({
          type: 'WEAPON',
          id: wKey,
          name: `${wConf.name} Lv.${nextLvl}`,
          icon: wConf.icon,
          tag: curLvl === 0 ? '✨ 新武器' : wConf.tag,
          desc: lvlInfo.desc
        });
      }
    }

    // 可用技能升级
    for (const sKey in SKILLS) {
      const sConf = SKILLS[sKey];
      const curLvl = p.skills[sKey] || 0;
      if (curLvl < sConf.maxLevel) {
        const nextLvl = curLvl + 1;
        choices.push({
          type: 'SKILL',
          id: sKey,
          name: `${sConf.name} Lv.${nextLvl}`,
          icon: sConf.icon,
          tag: sConf.tag,
          desc: sConf.levelDescs[nextLvl - 1]
        });
      }
    }

    // 乱序抽取3项 (小张实习生额外有更高几率出稀有/超武)
    choices.sort(() => Math.random() - 0.5);
    return choices.slice(0, 3);
  }

  triggerLevelUpSelection() {
    this.state = 'PAUSED';
    const choices = this.generateUpgradeChoices();
    this.currentUpgradeChoices = choices;
    this.renderLevelUpModal(choices);
    document.getElementById('levelup-modal').style.display = 'flex';
  }

  rerollLevelUpChoices() {
    sound.init();
    sound.playClick();
    const choices = this.generateUpgradeChoices();
    this.currentUpgradeChoices = choices;
    this.renderLevelUpModal(choices);
    document.getElementById('levelup-reroll-btn').disabled = true;
    document.getElementById('levelup-reroll-btn').innerText = "已使用免费刷新";
  }

  renderLevelUpModal(choices) {
    const container = document.getElementById('levelup-cards');
    container.innerHTML = '';

    choices.forEach(choice => {
      const card = document.createElement('div');
      card.className = `upgrade-card ${choice.type === 'EVOLUTION' ? 'evo-card' : ''}`;
      card.innerHTML = `
        <div class="card-icon">${choice.icon}</div>
        <div class="card-body">
          <div class="card-header-line">
            <div class="card-title">${choice.name}</div>
            <div class="card-tag">${choice.tag}</div>
          </div>
          <div class="card-desc">${choice.desc}</div>
        </div>
      `;
      card.onclick = () => {
        sound.playClick();
        this.applyUpgrade(choice);
        document.getElementById('levelup-modal').style.display = 'none';
        this.state = 'PLAYING';
      };
      container.appendChild(card);
    });
  }

  applyUpgrade(choice) {
    const p = this.player;
    if (choice.type === 'WEAPON') {
      p.weapons[choice.id] = (p.weapons[choice.id] || 0) + 1;
    } else if (choice.type === 'SKILL') {
      p.skills[choice.id] = (p.skills[choice.id] || 0) + 1;
    } else if (choice.type === 'EVOLUTION') {
      p.evolvedWeapons[choice.id] = true;
      if (choice.id === "ac_fusion_evo") {
        p.evolvedWeapons.ac_fusion_evo = true;
      }
    }
  }

  triggerArtifactSelection() {
    this.state = 'PAUSED';
    const allArts = Object.values(ARTIFACTS).filter(a => !this.player.artifacts[a.id]);
    allArts.sort(() => Math.random() - 0.5);
    const picks = allArts.slice(0, 3);

    const container = document.getElementById('artifact-cards');
    container.innerHTML = '';

    picks.forEach(art => {
      const card = document.createElement('div');
      card.className = 'upgrade-card evo-card';
      card.innerHTML = `
        <div class="card-icon">${art.icon}</div>
        <div class="card-body">
          <div class="card-header-line">
            <div class="card-title" style="color:#c084fc;">${art.name}</div>
            <div class="card-tag">🎁 职场神器</div>
          </div>
          <div class="card-desc">${art.desc}</div>
        </div>
      `;
      card.onclick = () => {
        sound.playClick();
        this.player.artifacts[art.id] = true;
        document.getElementById('artifact-modal').style.display = 'none';
        this.state = 'PLAYING';
        this.addFloatingText(this.player.x, this.player.y - 30, `🎁 获得神器【${art.name}】！`, "#a855f7", 16);
      };
      container.appendChild(card);
    });
    document.getElementById('artifact-modal').style.display = 'flex';
  }

  triggerVictory() {
    this.state = 'VICTORY';
    sound.stopBgm();
    sound.playVictory();

    const survivalTime = (Date.now() - this.gameStartTime) / 1000;
    const goldTalent = (this.saveData.talents && this.saveData.talents.gold_gain) || 0;
    const earnedGold = Math.round((this.kills * 1.5 + 180) * (1 + goldTalent * 0.08));

    this.saveData.gold += earnedGold;

    // 通关后解锁下一关
    const stageOrder = ["stage_1", "stage_2", "stage_3", "stage_4", "stage_5", "stage_6", "stage_endless"];
    const curIdx = stageOrder.indexOf(this.selectedStageId);
    if (curIdx >= 0 && curIdx < stageOrder.length - 1) {
      const nextStage = stageOrder[curIdx + 1];
      if (!this.saveData.unlockedStages.includes(nextStage)) {
        this.saveData.unlockedStages.push(nextStage);
      }
    }
    this.saveGameData();

    document.getElementById('victory-time').innerText = this.formatTime(survivalTime);
    document.getElementById('victory-kills').innerText = this.kills;
    document.getElementById('victory-pressure').innerText = `${Math.round(this.player.highestPressure)}%`;
    document.getElementById('victory-dodges').innerText = this.player.perfectDodgeCount;
    document.getElementById('victory-gold').innerText = `+${earnedGold} 工资 (已解锁新关卡！)`;

    const buildList = [];
    for (const w in this.player.weapons) {
      buildList.push(`${WEAPONS[w].name} Lv.${this.player.weapons[w]}`);
    }
    document.getElementById('victory-build').innerText = buildList.join(" | ") || "基础摸鱼套";
    document.getElementById('victory-modal').style.display = 'flex';
  }

  triggerGameOver() {
    this.state = 'GAMEOVER';
    sound.stopBgm();

    const survivalTime = (Date.now() - this.gameStartTime) / 1000;
    const goldTalent = (this.saveData.talents && this.saveData.talents.gold_gain) || 0;
    const earnedGold = Math.round((this.kills * 1.2 + survivalTime * 0.4) * (1 + goldTalent * 0.08));

    this.saveData.gold += earnedGold;

    if (this.selectedStageId === "stage_endless") {
      if (survivalTime > (this.saveData.highestEndlessTime || 0)) {
        this.saveData.highestEndlessTime = survivalTime;
      }
      if (this.kills > (this.saveData.highestEndlessKills || 0)) {
        this.saveData.highestEndlessKills = this.kills;
      }
    }
    this.saveGameData();

    document.getElementById('gameover-time').innerText = this.formatTime(survivalTime);
    document.getElementById('gameover-kills').innerText = this.kills;
    document.getElementById('gameover-pressure').innerText = `${Math.round(this.player.highestPressure)}%`;
    document.getElementById('gameover-dodges').innerText = this.player.perfectDodgeCount;
    document.getElementById('gameover-gold').innerText = `+${earnedGold} 工资`;
    document.getElementById('gameover-modal').style.display = 'flex';
  }

  hideAllModals() {
    ["levelup-modal", "artifact-modal", "pause-modal", "gameover-modal", "victory-modal", "talent-modal", "guide-modal", "character-modal", "stage-modal", "settings-menu-modal"].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.display = 'none';
    });
  }

  renderCharacterSelectModal() {
    const container = document.getElementById('character-cards-container');
    container.innerHTML = '';

    for (const cKey in CHARACTERS) {
      const char = CHARACTERS[cKey];
      const isSelected = (cKey === this.selectedCharacterId);
      const card = document.createElement('div');
      card.className = `char-card ${isSelected ? 'selected' : ''}`;
      card.innerHTML = `
        <div class="char-card-header">
          <div class="char-card-avatar">${char.avatar}</div>
          <div class="char-card-title-group">
            <div class="char-card-name">
              ${char.name}
              <span class="char-card-title">${char.title}</span>
            </div>
            <div class="char-card-weapon-pill">⚔️ 初始：${WEAPONS[char.initialWeapon].icon} ${WEAPONS[char.initialWeapon].name}</div>
          </div>
          ${isSelected ? '<span class="char-status-badge">✓ 出战中</span>' : ''}
        </div>
        <div class="char-card-desc">${char.desc}</div>
        <div class="char-feature-list">
          <div class="char-feature-row">
            <span class="char-feature-tag passive-tag">🌟 被动</span>
            <div class="char-feature-content"><b>${char.passive.name}</b>：${char.passive.desc}</div>
          </div>
          <div class="char-feature-row">
            <span class="char-feature-tag active-tag">🔥 大招</span>
            <div class="char-feature-content"><b>${char.active.name}</b> (${char.active.cd}s)：${char.active.desc}</div>
          </div>
        </div>
        <button class="btn btn-char-select ${isSelected ? 'btn-selected' : ''}">
          ${isSelected ? '已选择出战' : '选择出战'}
        </button>
      `;
      card.querySelector('.btn-char-select').onclick = () => {
        sound.playClick();
        this.selectedCharacterId = cKey;
        this.renderCharacterSelectModal();
      };
      container.appendChild(card);
    }
    document.getElementById('character-modal').style.display = 'flex';
  }

  renderStageSelectModal() {
    const container = document.getElementById('stage-cards-container');
    container.innerHTML = '';

    for (const sKey in STAGES_CONFIG) {
      const stage = STAGES_CONFIG[sKey];
      const isSelected = (sKey === this.selectedStageId);
      const isUnlocked = this.saveData.unlockedStages.includes(sKey) || sKey === "stage_1";

      const card = document.createElement('div');
      card.className = `stage-card ${isSelected ? 'selected' : ''} ${!isUnlocked ? 'stage-locked' : ''}`;
      card.innerHTML = `
        <div class="stage-name">${stage.name} ${!isUnlocked ? '🔒' : ''}</div>
        <div class="stage-sub">${stage.subtitle}</div>
        <div class="stage-info">${stage.isEndless ? '🔥 无尽模式 · 无时间上限' : '时长：8分钟 · 关底Boss：' + stage.boss.icon + ' ' + stage.boss.name}</div>
        ${!isUnlocked ? `<div class="stage-lock-hint">🔒 ${stage.unlockReqText || '未解锁'}</div>` : ''}
        <button class="btn btn-stage-select" ${!isUnlocked ? 'disabled' : ''}>
          ${!isUnlocked ? '未解锁' : (isSelected ? '当前选择' : '选择进入')}
        </button>
      `;
      if (isUnlocked) {
        card.querySelector('.btn-stage-select').onclick = () => {
          sound.playClick();
          this.selectedStageId = sKey;
          this.renderStageSelectModal();
        };
      }
      container.appendChild(card);
    }
    document.getElementById('stage-modal').style.display = 'flex';
  }

  // 全新角色个人属性与武器属性升级系统面板
  renderTalentsModal() {
    const container = document.getElementById('talent-list');
    container.innerHTML = '';

    document.getElementById('talent-gold').innerText = `💰 当前存款工资：¥ ${this.saveData.gold}`;

    // 标签页切换栏
    const tabNav = document.createElement('div');
    tabNav.style.display = 'flex';
    tabNav.style.gap = '10px';
    tabNav.style.justifyContent = 'center';
    tabNav.style.marginBottom = '12px';

    const charTabBtn = document.createElement('button');
    charTabBtn.className = `btn ${this.activeUpgradeTab === 'character' ? '' : 'btn-secondary'}`;
    charTabBtn.innerText = "👤 角色个人属性";
    charTabBtn.onclick = () => {
      this.activeUpgradeTab = 'character';
      this.renderTalentsModal();
    };

    const weaponTabBtn = document.createElement('button');
    weaponTabBtn.className = `btn ${this.activeUpgradeTab === 'weapon' ? '' : 'btn-secondary'}`;
    weaponTabBtn.innerText = "⚔️ 武器全局属性";
    weaponTabBtn.onclick = () => {
      this.activeUpgradeTab = 'weapon';
      this.renderTalentsModal();
    };

    tabNav.appendChild(charTabBtn);
    tabNav.appendChild(weaponTabBtn);
    container.appendChild(tabNav);

    const category = UPGRADE_SYSTEM[this.activeUpgradeTab];
    const grid = document.createElement('div');
    grid.className = 'talent-grid';

    category.items.forEach(item => {
      const curLvl = (this.saveData.talents && this.saveData.talents[item.id]) || 0;
      const isMax = curLvl >= item.maxLevel;
      const price = isMax ? 0 : item.prices[curLvl];
      const canAfford = this.saveData.gold >= price;

      const card = document.createElement('div');
      card.className = 'talent-card';
      card.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
          <div style="font-weight:bold; color:#f8fafc;">${item.icon} ${item.name}</div>
          <div style="font-size:11px; color:#38bdf8; font-weight:bold;">Lv.${curLvl} / ${item.maxLevel}</div>
        </div>
        <div style="font-size:11px; color:#94a3b8; margin-bottom:8px; line-height:1.4;">${item.desc}</div>
        <button class="btn btn-upgrade" style="width:100%; padding:6px; font-size:12px;" ${isMax || !canAfford ? 'disabled' : ''}>
          ${isMax ? '已升至满级' : `升级 (¥ ${price})`}
        </button>
      `;
      if (!isMax && canAfford) {
        card.querySelector('.btn-upgrade').onclick = () => {
          sound.playUpgrade();
          this.saveData.gold -= price;
          if (!this.saveData.talents) this.saveData.talents = {};
          this.saveData.talents[item.id] = curLvl + 1;
          this.saveGameData();
          this.renderTalentsModal();
        };
      }
      grid.appendChild(card);
    });

    container.appendChild(grid);

    // 一键重置退款按钮
    const resetBtn = document.createElement('button');
    resetBtn.className = 'btn btn-secondary';
    resetBtn.style.marginTop = '14px';
    resetBtn.style.width = '100%';
    resetBtn.innerText = "🔄 一键重置全部升级 (全额返还工资)";
    resetBtn.onclick = () => {
      sound.playClick();
      let refund = 0;
      for (const catKey in UPGRADE_SYSTEM) {
        UPGRADE_SYSTEM[catKey].items.forEach(it => {
          const lvl = (this.saveData.talents && this.saveData.talents[it.id]) || 0;
          for (let i = 0; i < lvl; i++) {
            refund += it.prices[i];
          }
        });
      }
      this.saveData.gold += refund;
      this.saveData.talents = {
        hp_max: 0, move_speed: 0, hp_regen: 0, stress_resist: 0, pickup_range: 0, crit_boost: 0, xp_gain: 0, gold_gain: 0,
        weapon_damage: 0, attack_speed: 0, aoe_range: 0, bullet_speed: 0, knockback_power: 0, evo_resonance: 0
      };
      this.saveGameData();
      sound.playUpgrade();
      this.renderTalentsModal();
    };
    container.appendChild(resetBtn);

    document.getElementById('talent-modal').style.display = 'flex';
  }

  renderPauseModal() {
    const p = this.player;
    const content = document.getElementById('pause-stats-content');
    const wList = Object.keys(p.weapons).map(k => `${WEAPONS[k].icon} ${WEAPONS[k].name} Lv.${p.weapons[k]}`).join(" | ");
    const sList = Object.keys(p.skills).map(k => `${SKILLS[k].icon} ${SKILLS[k].name} Lv.${p.skills[k]}`).join(" | ") || "暂无";
    content.innerHTML = `
      <p><b>当前角色：</b> ${p.charConf.avatar} ${p.charConf.name} · ${p.charConf.title}</p>
      <p><b>当前关卡：</b> ${this.director.stageConfig.name}</p>
      <p><b>已击杀工作：</b> ${this.kills} 项</p>
      <p><b>武器配置：</b> ${wList}</p>
      <p><b>被动技能：</b> ${sList}</p>
    `;
  }

  formatTime(sec) {
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = Math.floor(sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  update(dt) {
    if (this.state !== 'PLAYING') return;

    if (this.slowMoTimer > 0) {
      this.slowMoTimer -= dt;
      dt *= this.slowMoScale;
    }

    this.player.update(dt, this);
    this.director.update(dt);

    // 更新所有实体
    this.enemies.forEach(e => e.update(dt, this.player, this));
    this.enemies = this.enemies.filter(e => e.alive);

    this.projectiles.forEach(p => p.update(dt, this));
    this.projectiles = this.projectiles.filter(p => p.alive);

    this.aoeZones.forEach(z => z.update(dt, this));
    this.aoeZones = this.aoeZones.filter(z => z.alive);

    this.obstacles.forEach(o => o.update(dt, this.player, this));
    this.obstacles = this.obstacles.filter(o => o.alive);

    this.drops.forEach(d => d.update(dt, this.player));
    this.drops = this.drops.filter(d => d.alive);

    this.particles.forEach(pt => pt.update(dt));
    this.particles = this.particles.filter(pt => pt.life > 0);

    this.damageNumbers.forEach(dn => dn.update(dt));
    this.damageNumbers = this.damageNumbers.filter(dn => dn.life > 0);

    this.floatingTexts.forEach(ft => ft.update(dt));
    this.floatingTexts = this.floatingTexts.filter(ft => ft.life > 0);

    // 碰撞检测：玩家子弹命中怪物
    this.projectiles.forEach(proj => {
      if (!proj.alive || proj.isEnemy) return;

      this.enemies.forEach(enemy => {
        if (!proj.alive || !enemy.alive || proj.hitEnemies.has(enemy)) return;
        const dist = Math.hypot(enemy.x - proj.x, enemy.y - proj.y);
        if (dist <= enemy.radius + proj.radius) {
          proj.hitEnemies.add(enemy);
          enemy.takeDamage(proj.damage, false, this, proj.knockback ? { x: proj.x, y: proj.y, force: 160 } : null);

          // 祖安机械键盘爆炸
          if (proj.isEvo && Math.random() < 0.35) {
            this.aoeZones.push(new AOEZone({
              x: enemy.x, y: enemy.y, radius: 2.2 * M_TO_PX, duration: 0.3, damage: proj.damage * 0.8, type: "sonic_wave", isEvo: true
            }));
            this.addFloatingText(enemy.x, enemy.y - 20, "？？？爆炸!", "#ef4444", 14);
          }

          if (proj.pierce > 0) {
            proj.pierce--;
          } else if (proj.type !== "resignation_bomb" && proj.type !== "water_cup_lob") {
            proj.alive = false;
          }
        }
      });

      // 玩家子弹命中可破坏障碍物
      this.obstacles.forEach(obs => {
        if (!proj.alive || !obs.alive || proj.hitEnemies.has(obs)) return;
        if (Math.hypot(obs.x - proj.x, obs.y - proj.y) <= obs.radius + proj.radius) {
          proj.hitEnemies.add(obs);
          obs.takeDamage(proj.damage, this);
          if (proj.pierce > 0) proj.pierce--;
          else proj.alive = false;
        }
      });
    });

    // 敌人子弹命中玩家
    this.projectiles.forEach(proj => {
      if (!proj.alive || !proj.isEnemy) return;
      if (Math.hypot(this.player.x - proj.x, this.player.y - proj.y) <= this.player.radius + proj.radius) {
        proj.alive = false;
        this.player.takeDamage(proj.damage, null, this, true);
      }
    });

    // 更新HUD
    this.updateHUD();
  }

  updateHUD() {
    const p = this.player;
    if (!p) return;

    document.getElementById('hud-avatar').innerText = p.charConf.avatar;
    document.getElementById('hud-hp-text').innerText = `${Math.max(0, Math.round(p.hp))} / ${Math.round(p.maxHp)}`;
    document.getElementById('hud-hp-fill').style.width = `${Math.max(0, Math.min(100, (p.hp / p.maxHp) * 100))}%`;

    document.getElementById('hud-level').innerText = `Lv.${p.level}`;
    document.getElementById('hud-xp-fill').style.width = `${Math.min(100, (p.xp / p.xpNeeded) * 100)}%`;

    if (this.director.stageConfig.isEndless) {
      document.getElementById('hud-time').innerText = `已加班 ${this.formatTime(this.director.gameTime)} (无尽)`;
    } else {
      document.getElementById('hud-time').innerText = `${this.formatTime(this.director.gameTime)} / 08:00`;
    }

    const pressStage = p.pressure >= 100 ? PRESSURE_STAGES.collapse : (p.pressure >= 80 ? PRESSURE_STAGES.manic : (p.pressure >= 50 ? PRESSURE_STAGES.anxious : PRESSURE_STAGES.normal));
    document.getElementById('hud-pressure-fill').style.width = `${p.pressure}%`;
    document.getElementById('hud-pressure-fill').style.backgroundColor = pressStage.color;
    document.getElementById('hud-pressure-text').innerText = `压力: ${Math.round(p.pressure)}/100 【${pressStage.name}】`;

    // 移动端动作按键冷却CD显示
    const skillBtn = document.getElementById('btn-skill');
    if (skillBtn) {
      if (p.activeSkillCdTimer > 0) {
        skillBtn.classList.add('cooldown');
        skillBtn.setAttribute('data-cd', p.activeSkillCdTimer.toFixed(1));
      } else {
        skillBtn.classList.remove('cooldown');
        skillBtn.removeAttribute('data-cd');
      }
    }

    const dodgeBtn = document.getElementById('btn-dodge');
    if (dodgeBtn) {
      if (p.dodgeCooldownTimer > 0) {
        dodgeBtn.classList.add('cooldown');
        dodgeBtn.setAttribute('data-cd', p.dodgeCooldownTimer.toFixed(1));
      } else {
        dodgeBtn.classList.remove('cooldown');
        dodgeBtn.removeAttribute('data-cd');
      }
    }

    // PC端 HUD 技能与闪避冷却提示
    const skillBadge = document.getElementById('hud-skill-status');
    if (skillBadge) {
      if (p.activeSkillCdTimer > 0) {
        skillBadge.className = 'hud-cd-badge';
        skillBadge.innerText = `🔥 E: ${p.activeSkillCdTimer.toFixed(1)}s`;
      } else {
        skillBadge.className = 'hud-cd-badge ready';
        skillBadge.innerText = '🔥 E: 就绪';
      }
    }

    const dodgeBadge = document.getElementById('hud-dodge-status');
    if (dodgeBadge) {
      if (p.dodgeCooldownTimer > 0) {
        dodgeBadge.className = 'hud-cd-badge';
        dodgeBadge.innerText = `💨 闪避: ${p.dodgeCooldownTimer.toFixed(1)}s`;
      } else {
        dodgeBadge.className = 'hud-cd-badge ready';
        dodgeBadge.innerText = '💨 闪避: 就绪';
      }
    }
  }

  render() {
    const ctx = this.ctx;
    ctx.save();
    ctx.clearRect(0, 0, this.viewWidth, this.viewHeight);

    // 摄像机平移跟随玩家
    if (this.player) {
      const cx = Math.max(0, Math.min(this.mapWidth - this.viewWidth, this.player.x - this.viewWidth / 2));
      const cy = Math.max(0, Math.min(this.mapHeight - this.viewHeight, this.player.y - this.viewHeight / 2));
      ctx.translate(-cx, -cy);
    }

    // 绘制地图背景与网格
    const stageConf = this.director.stageConfig;
    ctx.fillStyle = stageConf.bgFloor || "#1e293b";
    ctx.fillRect(0, 0, this.mapWidth, this.mapHeight);

    ctx.strokeStyle = stageConf.gridColor || "#334155";
    ctx.lineWidth = 1;
    const gridSize = 40;
    for (let x = 0; x <= this.mapWidth; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0); ctx.lineTo(x, this.mapHeight);
      ctx.stroke();
    }
    for (let y = 0; y <= this.mapHeight; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y); ctx.lineTo(this.mapWidth, y);
      ctx.stroke();
    }

    // 绘制各层实体
    this.aoeZones.forEach(z => z.draw(ctx));
    this.drops.forEach(d => d.draw(ctx));
    this.obstacles.forEach(o => o.draw(ctx));
    this.enemies.forEach(e => e.draw(ctx));
    if (this.player) this.player.draw(ctx);
    this.projectiles.forEach(p => p.draw(ctx));
    this.particles.forEach(pt => pt.draw(ctx));
    this.damageNumbers.forEach(dn => dn.draw(ctx));
    this.floatingTexts.forEach(ft => ft.draw(ctx));

    ctx.restore();
  }

  loop(timestamp) {
    if (!this.lastTime) this.lastTime = timestamp;
    const dt = Math.min((timestamp - this.lastTime) / 1000, 0.1);
    this.lastTime = timestamp;

    this.update(dt * this.timeScale);
    this.render();

    requestAnimationFrame((t) => this.loop(t));
  }
}
