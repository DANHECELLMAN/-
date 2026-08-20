// =========================================================
// 游戏主引擎与状态机 (GameEngine V2.0 移动适配与防崩溃增强版)
// =========================================================

import { XP_TABLE, UPGRADE_POOL } from './constants.js';
import { SpatialGrid, DamageNumberPool, ExpGemPool, ProjectilePool } from './spatial-grid.js';
import { Player } from './entities.js';
import { WaveDirector } from './director.js';
import { sound } from './sound.js';

export class GameEngine {
    constructor(canvas, touchController) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.touchController = touchController;

        this.state = 'MENU'; // MENU, PLAYING, LEVEL_UP, PAUSED, GAMEOVER
        this.lastTime = 0;
        this.dpr = Math.min(window.devicePixelRatio || 1, 2);

        this.player = null;
        this.director = new WaveDirector(this);
        this.spatialGrid = new SpatialGrid(120);

        this.monsters = [];
        this.projectiles = [];
        this.expGems = [];
        this.damageNumbers = [];

        this.kills = 0;
        this.selectedChar = 'xiaochen';

        // 摄像机
        this.camera = { x: 0, y: 0 };

        // DOM 绑定
        this.cacheDOM();
        this.initResizeListener();
    }

    cacheDOM() {
        this.dom = {
            hud: document.getElementById('game-hud'),
            touchLayer: document.getElementById('touch-layer'),
            avatar: document.getElementById('hud-avatar'),
            hpInner: document.getElementById('hp-bar-inner'),
            hpText: document.getElementById('hp-text'),
            expInner: document.getElementById('exp-bar-inner'),
            expText: document.getElementById('exp-text'),
            timer: document.getElementById('hud-timer'),
            kills: document.getElementById('hud-kills'),
            menuScreen: document.getElementById('menu-screen'),
            upgradeModal: document.getElementById('upgrade-modal'),
            upgradeOptions: document.getElementById('upgrade-options'),
            pauseModal: document.getElementById('pause-modal'),
            gameoverModal: document.getElementById('gameover-modal'),
            summaryTime: document.getElementById('summary-time'),
            summaryKills: document.getElementById('summary-kills'),
            summaryLevel: document.getElementById('summary-level')
        };
    }

    initResizeListener() {
        const resize = () => {
            const width = window.innerWidth;
            const height = window.innerHeight;
            this.dpr = Math.min(window.devicePixelRatio || 1, 2);

            this.canvas.width = Math.floor(width * this.dpr);
            this.canvas.height = Math.floor(height * this.dpr);
            this.canvas.style.width = `${width}px`;
            this.canvas.style.height = `${height}px`;

            this.viewWidth = width;
            this.viewHeight = height;
        };

        window.addEventListener('resize', resize);
        window.addEventListener('orientationchange', () => setTimeout(resize, 150));
        resize();
    }

    startNewGame(charId) {
        sound.init();
        this.selectedChar = charId || 'xiaochen';
        this.player = new Player(0, 0, this.selectedChar);
        this.director.reset();

        this.monsters = [];
        this.projectiles = [];
        this.expGems = [];
        this.damageNumbers = [];
        this.kills = 0;

        // UI 切换
        this.dom.menuScreen.classList.add('hidden');
        this.dom.upgradeModal.classList.add('hidden');
        this.dom.pauseModal.classList.add('hidden');
        this.dom.gameoverModal.classList.add('hidden');
        this.dom.hud.classList.remove('hidden');
        this.dom.touchLayer.classList.remove('hidden');

        this.dom.avatar.innerText = this.player.icon;
        this.state = 'PLAYING';
        this.lastTime = performance.now();

        requestAnimationFrame((t) => this.gameLoop(t));
    }

    pauseGame() {
        if (this.state === 'PLAYING') {
            this.state = 'PAUSED';
            this.dom.pauseModal.classList.remove('hidden');
        }
    }

    resumeGame() {
        if (this.state === 'PAUSED') {
            this.state = 'PLAYING';
            this.dom.pauseModal.classList.add('hidden');
            this.lastTime = performance.now();
            requestAnimationFrame((t) => this.gameLoop(t));
        }
    }

    gameLoop(now) {
        if (this.state !== 'PLAYING' && this.state !== 'LEVEL_UP') return;

        if (!this.lastTime) this.lastTime = now;
        let dt = (now - this.lastTime) / 1000;
        this.lastTime = now;

        // 核心防崩保护：切后台或掉帧时强制截断单帧 dt
        dt = Math.min(dt, 0.05);

        if (this.state === 'PLAYING') {
            this.update(dt);
        }

        this.render();

        if (this.state === 'PLAYING' || this.state === 'LEVEL_UP') {
            requestAnimationFrame((t) => this.gameLoop(t));
        }
    }

    update(dt) {
        // 1. 重建空间哈希网格
        this.spatialGrid.clear();
        for (let i = 0; i < this.monsters.length; i++) {
            this.spatialGrid.insert(this.monsters[i]);
        }

        // 2. 更新玩家
        this.player.update(dt, this.spatialGrid, this.projectiles, (lv) => this.triggerLevelUp(lv));

        // 死亡检测
        if (this.player.hp <= 0) {
            this.triggerGameOver();
            return;
        }

        // 3. 刷怪系统更新
        this.director.update(dt, this.player, this.monsters);

        // 4. 怪群更新与碰撞
        for (let i = this.monsters.length - 1; i >= 0; i--) {
            const m = this.monsters[i];
            m.update(dt, this.player);
            if (m.isDead) {
                this.kills++;
                // 掉落经验宝石
                const gem = ExpGemPool.acquire(m.x, m.y, m.exp);
                this.expGems.push(gem);
                this.monsters.splice(i, 1);
            }
        }

        // 5. 弹道更新与命中判定
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const p = this.projectiles[i];
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.life -= dt;

            // 空间碰撞
            const nearby = this.spatialGrid.getNearby(p.x, p.y, p.radius);
            for (const m of nearby) {
                if (!m.isDead && !p.hitList.includes(m)) {
                    if (Math.hypot(m.x - p.x, m.y - p.y) < m.radius + p.radius) {
                        m.takeDamage(p.damage, this.player);
                        p.hitList.push(m);
                        p.pierce--;
                        if (p.pierce <= 0) {
                            p.life = 0;
                            break;
                        }
                    }
                }
            }

            if (p.life <= 0) {
                ProjectilePool.release(p);
                this.projectiles.splice(i, 1);
            }
        }

        // 6. 经验宝石拾取与磁吸
        for (let i = this.expGems.length - 1; i >= 0; i--) {
            const gem = this.expGems[i];
            const dist = Math.hypot(this.player.x - gem.x, this.player.y - gem.y);

            // 磁铁吸附范围
            if (dist < this.player.pickupRadius) {
                const spd = 380 * dt;
                gem.x += ((this.player.x - gem.x) / dist) * spd;
                gem.y += ((this.player.y - gem.y) / dist) * spd;
            }

            // 触碰拾取
            if (dist < this.player.radius + gem.radius) {
                this.addExp(gem.expValue);
                sound.playPickup();
                ExpGemPool.release(gem);
                this.expGems.splice(i, 1);
            }
        }

        // 7. 伤害飘字更新
        for (let i = this.damageNumbers.length - 1; i >= 0; i--) {
            const dn = this.damageNumbers[i];
            dn.y -= dt * 25;
            dn.life -= dt;
            dn.opacity = Math.max(0, dn.life / 0.55);
            if (dn.life <= 0) {
                DamageNumberPool.release(dn);
                this.damageNumbers.splice(i, 1);
            }
        }

        // 8. 摄像机跟随玩家平滑插值
        this.camera.x += (this.player.x - this.camera.x) * 0.12;
        this.camera.y += (this.player.y - this.camera.y) * 0.12;

        // 9. 更新 HUD 与触控冷却指示
        this.updateHUD();
        if (this.touchController) {
            this.touchController.updateCooldowns(
                this.player.dashTimer / this.player.dashCooldownMax,
                this.player.specialTimer / this.player.specialCooldownMax
            );
        }
    }

    addExp(amount) {
        this.player.currentExp += amount;
        const required = XP_TABLE[this.player.level] || (this.player.level * 30);
        if (this.player.currentExp >= required) {
            this.player.currentExp -= required;
            this.player.level++;
            sound.playLevelUp();
            this.triggerLevelUp();
        }
    }

    triggerLevelUp() {
        this.state = 'LEVEL_UP';
        this.dom.upgradeModal.classList.remove('hidden');

        // 从技能池随机抽取 3 张卡
        const shuffled = [...UPGRADE_POOL].sort(() => 0.5 - Math.random());
        const choices = shuffled.slice(0, 3);

        this.dom.upgradeOptions.innerHTML = '';
        choices.forEach((card) => {
            const cardEl = document.createElement('div');
            cardEl.className = 'upgrade-card';
            cardEl.innerHTML = `
                <div class="card-icon">${card.icon}</div>
                <div class="card-title">${card.title}</div>
                <div class="card-desc">${card.desc}</div>
                <div class="card-rarity rarity-${card.rarity}">${card.rarity.toUpperCase()}</div>
            `;
            cardEl.addEventListener('pointerdown', (e) => {
                e.stopPropagation();
                card.apply(this.player);
                this.dom.upgradeModal.classList.add('hidden');
                this.state = 'PLAYING';
                this.lastTime = performance.now();
            });
            this.dom.upgradeOptions.appendChild(cardEl);
        });
    }

    triggerGameOver() {
        this.state = 'GAMEOVER';
        sound.playGameOver();
        this.dom.summaryTime.innerText = this.formatTime(this.director.gameTime);
        this.dom.summaryKills.innerText = this.kills;
        this.dom.summaryLevel.innerText = `Lv.${this.player.level}`;
        this.dom.gameoverModal.classList.remove('hidden');
    }

    formatTime(sec) {
        const m = Math.floor(sec / 60).toString().padStart(2, '0');
        const s = Math.floor(sec % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    }

    updateHUD() {
        // HP
        const hpPercent = Math.max(0, (this.player.hp / this.player.maxHp) * 100);
        this.dom.hpInner.style.width = `${hpPercent}%`;
        this.dom.hpText.innerText = `${Math.ceil(this.player.hp)}/${this.player.maxHp}`;

        // EXP
        const reqExp = XP_TABLE[this.player.level] || (this.player.level * 30);
        const expPercent = Math.min(100, (this.player.currentExp / reqExp) * 100);
        this.dom.expInner.style.width = `${expPercent}%`;
        this.dom.expText.innerText = `Lv.${this.player.level}`;

        // Timer & Kills
        this.dom.timer.innerText = this.formatTime(this.director.gameTime);
        this.dom.kills.innerText = `击退: ${this.kills}`;
    }

    render() {
        this.ctx.save();
        this.ctx.scale(this.dpr, this.dpr);

        // 清屏
        this.ctx.fillStyle = '#0b0f19';
        this.ctx.fillRect(0, 0, this.viewWidth, this.viewHeight);

        // 视口平移
        this.ctx.save();
        this.ctx.translate(
            Math.floor(this.viewWidth / 2 - this.camera.x),
            Math.floor(this.viewHeight / 2 - this.camera.y)
        );

        // 绘制地板网格
        this.renderBackgroundGrid();

        // 绘制经验宝石
        for (let i = 0; i < this.expGems.length; i++) {
            const g = this.expGems[i];
            this.ctx.fillStyle = '#10b981';
            this.ctx.beginPath();
            this.ctx.arc(g.x, g.y, g.radius, 0, Math.PI * 2);
            this.ctx.fill();
        }

        // 绘制怪物
        for (let i = 0; i < this.monsters.length; i++) {
            this.monsters[i].render(this.ctx);
        }

        // 绘制子弹
        for (let i = 0; i < this.projectiles.length; i++) {
            const p = this.projectiles[i];
            this.ctx.fillStyle = p.type === 'special' ? '#f59e0b' : '#38bdf8';
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            this.ctx.fill();
        }

        // 绘制玩家
        if (this.player) {
            this.player.render(this.ctx);
        }

        // 绘制伤害飘字
        for (let i = 0; i < this.damageNumbers.length; i++) {
            const dn = this.damageNumbers[i];
            this.ctx.save();
            this.ctx.globalAlpha = dn.opacity;
            this.ctx.fillStyle = dn.color;
            this.ctx.font = 'bold 14px sans-serif';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(dn.text, dn.x, dn.y);
            this.ctx.restore();
        }

        this.ctx.restore();
        this.ctx.restore();
    }

    renderBackgroundGrid() {
        const gridSize = 80;
        const startX = Math.floor((this.camera.x - this.viewWidth / 2) / gridSize) * gridSize;
        const endX = startX + this.viewWidth + gridSize * 2;
        const startY = Math.floor((this.camera.y - this.viewHeight / 2) / gridSize) * gridSize;
        const endY = startY + this.viewHeight + gridSize * 2;

        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
        this.ctx.lineWidth = 1;

        this.ctx.beginPath();
        for (let x = startX; x <= endX; x += gridSize) {
            this.ctx.moveTo(x, startY);
            this.ctx.lineTo(x, endY);
        }
        for (let y = startY; y <= endY; y += gridSize) {
            this.ctx.moveTo(startX, y);
            this.ctx.lineTo(endX, y);
        }
        this.ctx.stroke();
    }
}
