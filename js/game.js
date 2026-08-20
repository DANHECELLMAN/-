/**
 * 《今天也不想上班》- 核心游戏引擎与状态机 (V1.9 Boss稳定/稀疏奖励/强敌与真横屏修复版)
 */

import { M_TO_PX, CHARACTERS, PLAYER_BASE, PRESSURE_STAGES, WEAPONS, SKILLS, ARTIFACTS, UPGRADE_SYSTEM, TALENTS, STAGES_CONFIG } from './constants.js?v=2.0';
import { Player, DamageNumber, FloatingText, Particle, DropItem, Projectile, AOEZone, TerrainObstacle, createBossInstance } from './entities.js?v=2.0';
import { WaveDirector } from './director.js?v=2.0';
import { sound } from './audio.js?v=2.0';

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
    this.mapZones = [];
    this.zoneEvents = [];
    this.upgradeOfferHistory = [];
    this.upgradeOfferCounter = 0;
    this._resizeRaf = 0;
    this.landscapeRequested = false;
    this.pendingPlayerPushX = 0;
    this.pendingPlayerPushY = 0;
    this.lastViewportW = 0;
    this.lastViewportH = 0;
    this.lastSafePlayerX = 0;
    this.lastSafePlayerY = 0;
    this.cameraX = 0;
    this.cameraY = 0;

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
    const dpr = Math.max(1, Math.min(3, window.devicePixelRatio || 1));
    const viewport = window.visualViewport;
    const width = Math.max(320, Math.round(viewport?.width || window.innerWidth || document.documentElement.clientWidth || 320));
    const height = Math.max(240, Math.round(viewport?.height || window.innerHeight || document.documentElement.clientHeight || 240));
    const changed = width !== this.lastViewportW || height !== this.lastViewportH || this.canvas.width === 0 || this.canvas.height === 0;
    if (changed) {
      this.canvas.width = Math.round(width * dpr);
      this.canvas.height = Math.round(height * dpr);
      this.canvas.style.width = width + 'px';
      this.canvas.style.height = height + 'px';
      this.lastViewportW = width;
      this.lastViewportH = height;
    }
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.viewWidth = width;
    this.viewHeight = height;
    this.syncMobileOrientationUi();
  }

  scheduleCanvasResize() {
    if (this._resizeRaf) cancelAnimationFrame(this._resizeRaf);
    this._resizeRaf = requestAnimationFrame(() => {
      this._resizeRaf = 0;
      this.initCanvasSize();
    });
  }

  syncMobileOrientationUi() {
    const landscape = window.innerWidth > window.innerHeight;
    document.body.classList.toggle('mobile-landscape', landscape);
    const hint = document.getElementById('rotate-device-hint');
    if (hint) hint.style.display = (this.landscapeRequested && !landscape) ? 'flex' : 'none';
  }

  async requestLandscapeMode() {
    this.landscapeRequested = true;
    let locked = false;
    try {
      if (document.documentElement.requestFullscreen && !document.fullscreenElement) {
        await document.documentElement.requestFullscreen({ navigationUI: 'hide' });
      }
    } catch (e) {}
    try {
      if (screen.orientation?.lock) {
        await screen.orientation.lock('landscape');
        locked = true;
      }
    } catch (e) { locked = false; }

    await new Promise(resolve => setTimeout(resolve, 120));
    this.scheduleCanvasResize();
    this.syncMobileOrientationUi();
    const landscape = window.innerWidth > window.innerHeight;
    return { mode: landscape ? (locked ? 'native-landscape' : 'landscape') : 'rotate-required' };
  }

  initEventListeners() {
    window.addEventListener('resize', () => this.scheduleCanvasResize());
    window.visualViewport?.addEventListener('resize', () => this.scheduleCanvasResize());
    window.addEventListener('orientationchange', () => setTimeout(() => this.scheduleCanvasResize(), 120));

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

    // 触控虚拟摇杆：统一使用 Pointer Events，横竖屏都直接按真实屏幕坐标计算。
    const joyZone = document.getElementById('joystick-zone');
    const joyBase = document.getElementById('joystick-base');
    const joyNub = document.getElementById('joystick-nub');
    if (joyZone && joyBase && joyNub) {
      const updatePointer = (clientX, clientY) => {
        const rect = joyBase.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const dx = clientX - centerX;
        const dy = clientY - centerY;
        const dist = Math.hypot(dx, dy);
        const maxR = Math.max(20, Math.min(rect.width, rect.height) / 2 - 12);
        if (dist > 0.5) {
          const nx = dx / dist;
          const ny = dy / dist;
          const clampedDist = Math.min(dist, maxR);
          this.joystick.x = nx * (clampedDist / maxR);
          this.joystick.y = ny * (clampedDist / maxR);
          joyNub.style.transform = `translate(${nx * clampedDist}px, ${ny * clampedDist}px)`;
        }
      };
      joyZone.addEventListener('pointerdown', (e) => {
        if (e.pointerType === 'mouse' && e.button !== 0) return;
        e.preventDefault();
        this.joystick.active = true;
        this.joystick.id = e.pointerId;
        joyZone.setPointerCapture?.(e.pointerId);
        updatePointer(e.clientX, e.clientY);
      });
      joyZone.addEventListener('pointermove', (e) => {
        if (!this.joystick.active || this.joystick.id !== e.pointerId) return;
        e.preventDefault();
        updatePointer(e.clientX, e.clientY);
      });
      const resetJoy = (e) => {
        if (this.joystick.id !== null && e?.pointerId !== undefined && e.pointerId !== this.joystick.id) return;
        this.joystick.active = false;
        this.joystick.id = null;
        this.joystick.x = 0;
        this.joystick.y = 0;
        joyNub.style.transform = 'translate(0px, 0px)';
      };
      joyZone.addEventListener('pointerup', resetJoy);
      joyZone.addEventListener('pointercancel', resetJoy);
      joyZone.addEventListener('lostpointercapture', resetJoy);
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
    this.pendingPlayerPushX = 0;
    this.pendingPlayerPushY = 0;
    this.lastSafePlayerX = this.player.x;
    this.lastSafePlayerY = this.player.y;
    this.cameraX = Math.max(0, this.player.x - this.viewWidth / 2);
    this.cameraY = Math.max(0, this.player.y - this.viewHeight / 2);
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
    this.initOfficeZones();
    this.upgradeOfferHistory = [];
    this.upgradeOfferCounter = 0;

    document.getElementById('hud').style.display = 'block';
    document.getElementById('main-menu').style.display = 'none';
    if (this.showMobileControls) {
      document.getElementById('mobile-controls').style.display = 'block';
    }

    this.state = 'PLAYING';
    sound.startBgm();
  }

  initOfficeZones() {
    const cols = 3, rows = 2;
    const labelsByStage = {
      stage_1: ["前台接待区", "开放工位A", "打印复印区", "开放工位B", "茶水间", "会议室"],
      stage_2: ["小会议室", "大会议室", "PPT准备区", "视频会议区", "休息走廊", "资料室"],
      stage_3: ["客户前厅", "提案区", "改稿工位", "审稿区", "休息角", "客户会议室"],
      stage_4: ["电话坐席A", "电话坐席B", "通信机房", "运营工位", "茶水间", "应急会议区"],
      stage_5: ["董事前厅", "高管工位", "财务资料区", "战略会议室", "休息区", "CEO办公室"],
      stage_6: ["签到区", "训练区", "物资区", "团建休息区", "宣誓区", "考核场"],
      stage_endless: ["夜班工位A", "夜班工位B", "服务器区", "空会议室", "自动售货区", "通宵休息角"]
    };
    const labels = labelsByStage[this.selectedStageId] || labelsByStage.stage_1;
    const zoneW = this.mapWidth / cols;
    const zoneH = this.mapHeight / rows;
    this.mapZones = [];
    this.zoneEvents = [];

    let idx = 0;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        this.mapZones.push({
          id: `zone_${idx}`,
          name: labels[idx] || `办公区${idx + 1}`,
          x: c * zoneW,
          y: r * zoneH,
          w: zoneW,
          h: zoneH,
          index: idx
        });
        idx++;
      }
    }

    // V1.9：不再每个区域都刷奖励。每张地图固定只有3个奖励点，且刷新很慢。
    const zoneOrder = [...this.mapZones].sort(() => Math.random() - 0.5).slice(0, 3);
    for (let i = 0; i < zoneOrder.length; i++) {
      const zone = zoneOrder[i];
      const pad = 70;
      this.zoneEvents.push({
        zoneId: zone.id,
        x: zone.x + pad + Math.random() * Math.max(20, zone.w - pad * 2),
        y: zone.y + pad + Math.random() * Math.max(20, zone.h - pad * 2),
        active: false,
        respawn: 35 + i * 25 + Math.random() * 30,
        quality: this.rollMapRewardQuality(),
        pulse: Math.random() * Math.PI * 2
      });
    }
  }

  rollMapRewardQuality() {
    const r = Math.random();
    if (r < 0.58) return 'junk';        // 58% 小垃圾：少量经验/回血/减压
    if (r < 0.83) return 'common';      // 25% 普通
    if (r < 0.95) return 'rare';        // 12% 稀有
    if (r < 0.992) return 'epic';       // 4.2% 史诗
    return 'legendary';                 // 0.8% 金色传说
  }

  updateZoneEvents(dt) {
    if (!this.player || this.director?.bossSpawned) return;
    for (const ev of this.zoneEvents) {
      ev.pulse += dt * 3;
      if (!ev.active) {
        ev.respawn -= dt;
        if (ev.respawn <= 0) {
          ev.quality = this.rollMapRewardQuality();
          ev.active = true;
        }
        continue;
      }
      const dist = Math.hypot(this.player.x - ev.x, this.player.y - ev.y);
      if (dist <= this.player.radius + 24) this.claimZoneEvent(ev);
    }
  }

  claimZoneEvent(ev) {
    const zone = this.mapZones.find(z => z.id === ev.zoneId);
    const q = ev.quality || 'junk';
    ev.active = false;
    ev.respawn = 125 + Math.random() * 70;

    if (zone) {
      const pad = 72;
      ev.x = zone.x + pad + Math.random() * Math.max(20, zone.w - pad * 2);
      ev.y = zone.y + pad + Math.random() * Math.max(20, zone.h - pad * 2);
    }

    const giveXp = (ratio, min = 8) => {
      const xp = Math.max(min, Math.round(this.player.xpNeeded * ratio));
      this.player.addXp(xp);
      this.addFloatingText(this.player.x, this.player.y - 42, `📦 ${zone?.name || '办公区'}：经验 +${xp}`, '#94a3b8', 15);
      sound.playXp();
    };

    if (q === 'junk') {
      const r = Math.random();
      if (r < 0.55) {
        giveXp(0.12 + Math.random() * 0.08, 8);
      } else if (r < 0.80) {
        const heal = Math.max(5, Math.round(this.player.maxHp * 0.08));
        this.player.heal(heal, this, true);
        this.addFloatingText(this.player.x, this.player.y - 42, `☕ 小福利：回复 ${heal} HP`, '#10b981', 15);
      } else {
        this.player.reducePressure(10, this);
        this.addFloatingText(this.player.x, this.player.y - 42, '🧃 摸鱼补给：压力 -10', '#38bdf8', 15);
      }
      ev.quality = this.rollMapRewardQuality();
      return;
    }

    const rarityWanted = q;
    const eligible = Object.keys(WEAPONS).filter(k => {
      const w = WEAPONS[k];
      return w?.levels && k !== 'ac_fusion_evo' && (this.player.weapons[k] || 0) < 5 && (w.rarity || 'common') === rarityWanted;
    });
    const unowned = eligible.filter(k => !(this.player.weapons[k] > 0));
    const source = unowned.length ? unowned : eligible;

    if (source.length) {
      const k = source[Math.floor(Math.random() * source.length)];
      this.player.weapons[k] = (this.player.weapons[k] || 0) + 1;
      const qualityName = { common:'普通', rare:'稀有', epic:'史诗', legendary:'金色传说' }[q] || q;
      const color = { common:'#cbd5e1', rare:'#60a5fa', epic:'#c084fc', legendary:'#fbbf24' }[q] || '#fff';
      this.addFloatingText(this.player.x, this.player.y - 42, `🎁 ${qualityName}奖励：${WEAPONS[k].name} Lv.${this.player.weapons[k]}`, color, q === 'legendary' ? 19 : 16);
      sound.playUpgrade();
    } else {
      // 对应品质没有可升级武器时，退化成经验，不强行送更高品质。
      const ratio = q === 'legendary' ? 0.75 : q === 'epic' ? 0.5 : q === 'rare' ? 0.32 : 0.22;
      giveXp(ratio, 16);
    }
    ev.quality = this.rollMapRewardQuality();
  }

  drawOfficeMap(ctx, stageConf) {
    ctx.fillStyle = stageConf.bgFloor || '#1e293b';
    ctx.fillRect(0, 0, this.mapWidth, this.mapHeight);
    const alt = ['rgba(255,255,255,0.025)','rgba(56,189,248,0.035)','rgba(168,85,247,0.03)','rgba(16,185,129,0.03)','rgba(251,191,36,0.025)','rgba(244,63,94,0.025)'];
    for (const z of this.mapZones) {
      ctx.fillStyle = alt[z.index % alt.length];
      ctx.fillRect(z.x + 5, z.y + 5, z.w - 10, z.h - 10);
      ctx.strokeStyle = 'rgba(148,163,184,0.22)';
      ctx.lineWidth = 3;
      ctx.strokeRect(z.x + 6, z.y + 6, z.w - 12, z.h - 12);
      ctx.fillStyle = 'rgba(226,232,240,0.38)';
      ctx.font = 'bold 18px Arial';
      ctx.textAlign = 'left';
      ctx.fillText(z.name, z.x + 20, z.y + 30);
      // 办公桌/隔断装饰，不参与碰撞，恢复办公室布局感。
      const deskCount = 5 + (z.index % 3);
      for (let i = 0; i < deskCount; i++) {
        const dx = z.x + 70 + ((i * 137 + z.index * 43) % Math.max(150, z.w - 150));
        const dy = z.y + 90 + ((i * 91 + z.index * 67) % Math.max(140, z.h - 150));
        ctx.fillStyle = 'rgba(100,116,139,0.32)';
        ctx.fillRect(dx, dy, 54, 24);
        ctx.fillStyle = 'rgba(15,23,42,0.38)';
        ctx.fillRect(dx + 8, dy + 4, 18, 12);
        ctx.strokeStyle = 'rgba(203,213,225,0.16)';
        ctx.strokeRect(dx, dy, 54, 24);
      }
    }
    // 主通道
    ctx.fillStyle = 'rgba(148,163,184,0.06)';
    ctx.fillRect(0, this.mapHeight / 2 - 28, this.mapWidth, 56);
    ctx.fillRect(this.mapWidth / 3 - 20, 0, 40, this.mapHeight);
    ctx.fillRect(this.mapWidth * 2 / 3 - 20, 0, 40, this.mapHeight);
  }

  drawZoneEvents(ctx) {
    const palette = {
      junk: { glow:'#94a3b8', fill:'rgba(148,163,184,0.15)', icon:'📦' },
      common: { glow:'#cbd5e1', fill:'rgba(203,213,225,0.16)', icon:'🎁' },
      rare: { glow:'#60a5fa', fill:'rgba(96,165,250,0.18)', icon:'🎁' },
      epic: { glow:'#c084fc', fill:'rgba(192,132,252,0.19)', icon:'🎁' },
      legendary: { glow:'#fbbf24', fill:'rgba(251,191,36,0.22)', icon:'🏆' }
    };
    for (const ev of this.zoneEvents) {
      if (!ev.active) continue;
      const style = palette[ev.quality] || palette.junk;
      const pulse = 1 + Math.sin(ev.pulse) * 0.07;
      ctx.save();
      ctx.translate(ev.x, ev.y);
      ctx.scale(pulse, pulse);
      ctx.shadowBlur = ev.quality === 'legendary' ? 24 : 12;
      ctx.shadowColor = style.glow;
      ctx.fillStyle = style.fill;
      ctx.strokeStyle = style.glow;
      ctx.lineWidth = ev.quality === 'legendary' ? 3 : 1.5;
      ctx.beginPath(); ctx.arc(0, 0, 22, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.font = '25px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(style.icon, 0, 0);
      ctx.restore();
    }
  }

  drawBossHud() {
    const boss = this.bossInstance;
    if (!boss || !boss.alive) return;
    const ctx = this.ctx;
    const w = Math.min(420, Math.max(240, this.viewWidth * 0.42));
    const x = (this.viewWidth - w) / 2;
    const y = 46;
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.72)'; ctx.fillRect(x, y, w, 15);
    ctx.fillStyle = boss.color || '#ef4444'; ctx.fillRect(x, y, w * Math.max(0, boss.hp / boss.maxHp), 15);
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.strokeRect(x, y, w, 15);
    ctx.fillStyle = '#fff'; ctx.font = 'bold 12px Arial'; ctx.textAlign = 'center';
    ctx.fillText(`【${boss.conf?.title || 'Boss'}】${boss.name}  ${Math.max(0, Math.round(boss.hp))}/${boss.maxHp}  P${boss.currentPhase || 1}`, this.viewWidth / 2, y - 6);
    ctx.restore();
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

  getRarityMeta(rarity = "common") {
    const table = {
      common: { name: "普通", weight: 55 },
      rare: { name: "稀有", weight: 28 },
      epic: { name: "史诗", weight: 13 },
      legendary: { name: "传说", weight: 4 }
    };
    return table[rarity] || table.common;
  }

  weightedPick(pool, excludeKeys = new Set()) {
    const candidates = pool.filter(item => !excludeKeys.has(`${item.type}:${item.id}`));
    if (!candidates.length) return null;
    let total = 0;
    const weighted = candidates.map(item => {
      let weight = Math.max(0.01, item.weight || 1);
      const itemKey = `${item.type}:${item.id}`;
      const recentIndex = this.upgradeOfferHistory.lastIndexOf(itemKey);
      if (recentIndex >= 0) {
        const distance = this.upgradeOfferHistory.length - recentIndex;
        weight *= distance <= 4 ? 0.18 : (distance <= 8 ? 0.45 : 0.75);
      }
      if (item.type === 'WEAPON' && item.currentLevel === 0) weight *= 1.25;
      if (this.player?.characterId === "xiaozhang" && (item.rarity === "epic" || item.rarity === "legendary")) {
        weight *= 1.45;
      }
      total += weight;
      return { item, weight };
    });
    let roll = Math.random() * total;
    for (const entry of weighted) {
      roll -= entry.weight;
      if (roll <= 0) return entry.item;
    }
    return weighted[weighted.length - 1].item;
  }

  pickNewWeaponDiverse(pool, excludeKeys = new Set()) {
    const candidates = pool.filter(item => !excludeKeys.has(`${item.type}:${item.id}`));
    if (!candidates.length) return null;
    const rarityWeights = { common: 44, rare: 32, epic: 18, legendary: 6 };
    const groups = {};
    for (const item of candidates) (groups[item.rarity || 'common'] ||= []).push(item);
    const rarities = Object.keys(groups);
    let total = rarities.reduce((sum, r) => sum + (rarityWeights[r] || 1), 0);
    let roll = Math.random() * total;
    let selectedRarity = rarities[0];
    for (const r of rarities) {
      roll -= rarityWeights[r] || 1;
      if (roll <= 0) { selectedRarity = r; break; }
    }
    const bucket = groups[selectedRarity];
    const weighted = bucket.map(item => {
      const key = `${item.type}:${item.id}`;
      const recentIndex = this.upgradeOfferHistory.lastIndexOf(key);
      const distance = recentIndex < 0 ? 999 : this.upgradeOfferHistory.length - recentIndex;
      return { item, weight: distance <= 4 ? 0.15 : (distance <= 8 ? 0.5 : 1) };
    });
    let sum = weighted.reduce((a,b) => a + b.weight, 0);
    let r = Math.random() * sum;
    for (const entry of weighted) { r -= entry.weight; if (r <= 0) return entry.item; }
    return weighted[weighted.length - 1].item;
  }

  generateUpgradeChoices() {
    const p = this.player;
    const ownedWeaponUpgrades = [];
    const newWeaponPool = [];
    const randomPool = [];

    // 满足条件的超级进化进入随机池。
    for (const wKey in WEAPONS) {
      const wConf = WEAPONS[wKey];
      if (!wConf.evolution || p.evolvedWeapons[wConf.evolution.id]) continue;
      let canEvo = true;
      const reqs = wConf.evolution.req || {};
      for (const reqKey in reqs) {
        const reqVal = reqs[reqKey];
        if (WEAPONS[reqKey]) {
          if ((p.weapons[reqKey] || 0) < reqVal) canEvo = false;
        } else if (SKILLS[reqKey]) {
          if ((p.skills[reqKey] || 0) < reqVal) canEvo = false;
        }
      }
      if (canEvo) {
        randomPool.push({
          type: 'EVOLUTION', id: wConf.evolution.id, baseWeapon: wKey,
          name: wConf.evolution.name, icon: wConf.evolution.icon,
          tag: '🌟 超级进化', desc: wConf.evolution.desc,
          rarity: 'legendary', rarityLabel: '传说', weight: 18
        });
      }
    }

    // 已拥有武器和未拥有武器分池。
    for (const wKey in WEAPONS) {
      const wConf = WEAPONS[wKey];
      if (wKey === "ac_fusion_evo" || !wConf.levels) continue;
      const curLvl = p.weapons[wKey] || 0;
      if (curLvl >= 5) continue;
      const nextLvl = curLvl + 1;
      const lvlInfo = wConf.levels[nextLvl - 1];
      const rarity = wConf.rarity || 'common';
      const meta = this.getRarityMeta(rarity);
      const choice = {
        type: 'WEAPON', id: wKey, name: `${wConf.name} Lv.${nextLvl}`,
        icon: wConf.icon,
        tag: curLvl === 0 ? `✨ 新武器 · ${meta.name}` : `${wConf.tag} · ${meta.name}`,
        desc: lvlInfo.desc, rarity, rarityLabel: meta.name,
        weight: wConf.dropWeight || meta.weight, currentLevel: curLvl
      };
      if (curLvl > 0) ownedWeaponUpgrades.push(choice);
      else newWeaponPool.push(choice);
    }

    // 被动技能进入随机池。
    for (const sKey in SKILLS) {
      const sConf = SKILLS[sKey];
      const curLvl = p.skills[sKey] || 0;
      if (curLvl >= sConf.maxLevel) continue;
      const nextLvl = curLvl + 1;
      randomPool.push({
        type: 'SKILL', id: sKey, name: `${sConf.name} Lv.${nextLvl}`,
        icon: sConf.icon, tag: sConf.tag,
        desc: sConf.levelDescs[nextLvl - 1], weight: 42
      });
    }

    const result = [];
    const used = new Set();

    // 每次升级/刷新保证且仅保证一个“已拥有武器升级”。
    if (ownedWeaponUpgrades.length > 0) {
      const guaranteed = { ...ownedWeaponUpgrades[Math.floor(Math.random() * ownedWeaponUpgrades.length)] };
      guaranteed.guaranteedOwnedUpgrade = true;
      guaranteed.tag = `🔒 必出升级 · ${guaranteed.rarityLabel}`;
      result.push(guaranteed);
      used.add(`${guaranteed.type}:${guaranteed.id}`);
    }

    // 另外两个槽位保持随机，但提高“新武器”曝光率，并对最近出现过的选项降权，避免实战中反复刷同几件。
    const mixedPool = [...newWeaponPool, ...randomPool];
    while (result.length < 3) {
      let source = mixedPool;
      const availableNew = newWeaponPool.filter(item => !used.has(`${item.type}:${item.id}`));
      // 约68%概率优先从未拥有武器池抽取；仍然是随机，不固定具体武器。
      const preferNewWeapon = availableNew.length > 0 && Math.random() < 0.68;
      if (preferNewWeapon) source = newWeaponPool;
      const pick = preferNewWeapon ? (this.pickNewWeaponDiverse(newWeaponPool, used) || this.weightedPick(mixedPool, used)) : this.weightedPick(source, used);
      if (!pick) break;
      result.push({ ...pick });
      used.add(`${pick.type}:${pick.id}`);
    }

    // 极端情况下补足3项。
    if (result.length < 3) {
      for (const fallback of ownedWeaponUpgrades) {
        const key = `${fallback.type}:${fallback.id}`;
        if (!used.has(key)) {
          result.push({ ...fallback });
          used.add(key);
          if (result.length >= 3) break;
        }
      }
    }

    const finalChoices = result.sort(() => Math.random() - 0.5).slice(0, 3);
    for (const c of finalChoices) this.upgradeOfferHistory.push(`${c.type}:${c.id}`);
    if (this.upgradeOfferHistory.length > 24) this.upgradeOfferHistory.splice(0, this.upgradeOfferHistory.length - 24);
    this.upgradeOfferCounter++;
    return finalChoices;
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
      const rarityClass = choice.rarity ? `rarity-${choice.rarity}` : '';
      card.className = `upgrade-card ${choice.type === 'EVOLUTION' ? 'evo-card' : ''} ${rarityClass}`;
      const rarityBadge = choice.rarityLabel ? `<span class="rarity-badge ${rarityClass}">${choice.rarityLabel}</span>` : '';
      card.innerHTML = `
        <div class="card-icon">${choice.icon}</div>
        <div class="card-body">
          <div class="card-header-line">
            <div class="card-title">${choice.name} ${rarityBadge}</div>
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
      if (choice.baseWeapon) p.evolvedWeapons[choice.baseWeapon] = true;
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
          <div class="char-card-avatar">${char.avatarImage ? `<img class="char-card-avatar-img" src="${new URL('../' + char.avatarImage, import.meta.url).href}" alt="${char.name}">` : char.avatar}</div>
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

  queuePlayerPush(dx, dy, maxStep = 14) {
    if (!Number.isFinite(dx) || !Number.isFinite(dy)) return;
    const len = Math.hypot(dx, dy);
    if (len <= 0.001) return;
    const scale = Math.min(1, maxStep / len);
    this.pendingPlayerPushX += dx * scale;
    this.pendingPlayerPushY += dy * scale;
  }

  applyQueuedPlayerPush() {
    const p = this.player;
    if (!p) return;
    let dx = this.pendingPlayerPushX;
    let dy = this.pendingPlayerPushY;
    this.pendingPlayerPushX = 0;
    this.pendingPlayerPushY = 0;
    if (!Number.isFinite(dx) || !Number.isFinite(dy)) return;
    const len = Math.hypot(dx, dy);
    const maxTotal = 18;
    if (len > maxTotal) {
      dx = dx / len * maxTotal;
      dy = dy / len * maxTotal;
    }
    p.x += dx;
    p.y += dy;
  }

  stabilizePlayerPosition() {
    const p = this.player;
    if (!p) return;
    const margin = Math.max(8, p.radius + 10);
    const valid = Number.isFinite(p.x) && Number.isFinite(p.y);
    if (!valid) {
      p.x = Number.isFinite(this.lastSafePlayerX) ? this.lastSafePlayerX : this.mapWidth / 2;
      p.y = Number.isFinite(this.lastSafePlayerY) ? this.lastSafePlayerY : this.mapHeight / 2;
      p.vx = 0; p.vy = 0;
      console.error('[camera-guard] invalid player position recovered');
    }
    p.x = Math.max(margin, Math.min(this.mapWidth - margin, p.x));
    p.y = Math.max(margin, Math.min(this.mapHeight - margin, p.y));
    this.lastSafePlayerX = p.x;
    this.lastSafePlayerY = p.y;
  }

  update(dt) {
    if (this.state !== 'PLAYING') return;

    if (this.slowMoTimer > 0) {
      this.slowMoTimer -= dt;
      dt *= this.slowMoScale;
    }

    this.player.update(dt, this);
    this.director.update(dt);
    this.updateZoneEvents(dt);

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

    // Boss/AOE/障碍物只提交安全外力，统一结算，禁止技能直接改写玩家坐标。
    this.applyQueuedPlayerPush();
    this.stabilizePlayerPosition();

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

    const hudAvatar = document.getElementById('hud-avatar');
    if (p.charConf.avatarImage) {
      const src = new URL('../' + p.charConf.avatarImage, import.meta.url).href;
      if (!hudAvatar.querySelector('img') || hudAvatar.querySelector('img').src !== src) {
        hudAvatar.innerHTML = `<img class="hud-avatar-img" src="${src}" alt="${p.charConf.name}">`;
      }
    } else {
      hudAvatar.innerText = p.charConf.avatar;
    }
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

    // 摄像机只跟随经过坐标保护的玩家位置；Boss绝不接管摄像机。
    if (this.player) {
      const maxCx = Math.max(0, this.mapWidth - this.viewWidth);
      const maxCy = Math.max(0, this.mapHeight - this.viewHeight);
      const targetX = Math.max(0, Math.min(maxCx, this.player.x - this.viewWidth / 2));
      const targetY = Math.max(0, Math.min(maxCy, this.player.y - this.viewHeight / 2));
      if (Number.isFinite(targetX) && Number.isFinite(targetY)) {
        this.cameraX = targetX;
        this.cameraY = targetY;
      }
      ctx.translate(-this.cameraX, -this.cameraY);
    }

    // 绘制办公室分区地图与随机事件
    const stageConf = this.director.stageConfig;
    this.drawOfficeMap(ctx, stageConf);
    this.drawZoneEvents(ctx);

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
    this.drawBossHud();
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
