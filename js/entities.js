// =========================================================
// 游戏实体体系 (Player, Enemy, Projectile, ExpGem, DamageNumber)
// =========================================================

import { CHARACTERS, MONSTER_TYPES } from './constants.js';
import { ObjectPool } from './spatial-grid.js';
import { sound } from './sound.js';

// 安全向量归一化
export function safeNormalize(dx, dy) {
    const lenSq = dx * dx + dy * dy;
    if (lenSq < 0.000001) return { x: 0, y: 0 };
    const len = Math.sqrt(lenSq);
    return { x: dx / len, y: dy / len };
}

// 1. 伤害飘字对象池
export const DamageNumberPool = new ObjectPool(
    () => ({ x: 0, y: 0, text: '', color: '#fff', opacity: 1, life: 0, isDead: true }),
    (item, x, y, text, color = '#ffffff') => {
        item.x = x + (Math.random() * 16 - 8);
        item.y = y - 10;
        item.text = text;
        item.color = color;
        item.opacity = 1;
        item.life = 0.55;
        item.isDead = false;
    },
    60
);

// 2. 经验宝石对象池
export const ExpGemPool = new ObjectPool(
    () => ({ x: 0, y: 0, expValue: 1, radius: 6, isDead: true }),
    (item, x, y, expValue = 1) => {
        item.x = x;
        item.y = y;
        item.expValue = expValue;
        item.radius = 6;
        item.isDead = false;
    },
    100
);

// 3. 子弹弹道对象池
export const ProjectilePool = new ObjectPool(
    () => ({ x: 0, y: 0, vx: 0, vy: 0, damage: 10, radius: 8, life: 1, pierce: 1, type: 'normal', isDead: true }),
    (p, x, y, vx, vy, damage, radius, life, pierce = 1, type = 'normal') => {
        p.x = x;
        p.y = y;
        p.vx = vx;
        p.vy = vy;
        p.damage = damage;
        p.radius = radius;
        p.life = life;
        p.maxLife = life;
        p.pierce = pierce;
        p.type = type;
        p.hitList = [];
        p.isDead = false;
    },
    80
);

// =========================================================
// 玩家实体 (Player)
// =========================================================
export class Player {
    constructor(x, y, charId = 'xiaochen') {
        this.x = x;
        this.y = y;
        this.charConfig = CHARACTERS[charId] || CHARACTERS.xiaochen;
        
        // 属性初始化
        this.name = this.charConfig.name;
        this.icon = this.charConfig.icon;
        const stats = this.charConfig.baseStats;

        this.hp = stats.hp;
        this.maxHp = stats.maxHp;
        this.speed = stats.speed;
        this.attackDamage = stats.attackDamage;
        this.attackSpeed = stats.attackSpeed;
        this.pickupRadius = stats.pickupRadius;
        this.defense = stats.defense;

        this.dashCooldownMax = stats.dashCooldown;
        this.dashTimer = 0;
        this.isDashing = false;
        this.dashDuration = 0.22;
        this.dashTimeRemaining = 0;

        this.specialCooldownMax = stats.specialCooldown;
        this.specialTimer = 0;

        this.inputVector = { x: 0, y: 0 };
        this.facing = 1; // 1: right, -1: left
        this.level = 1;
        this.currentExp = 0;
        this.radius = 18;

        this.attackTimer = 0;
        this.invulnerableTimer = 0;

        // 肉鸽加成属性
        this.projectileCount = 1;
        this.hasOrbitLaptop = false;
        this.orbitCount = 0;
        this.orbitAngle = 0;
        this.critRate = 0.05;
        this.lifesteal = 0;
    }

    setInput(vx, vy) {
        this.inputVector.x = vx;
        this.inputVector.y = vy;
        if (vx > 0.1) this.facing = 1;
        else if (vx < -0.1) this.facing = -1;
    }

    triggerDash() {
        if (this.dashTimer <= 0 && !this.isDashing) {
            this.isDashing = true;
            this.dashTimeRemaining = this.dashDuration;
            this.dashTimer = this.dashCooldownMax;
            this.invulnerableTimer = this.dashDuration + 0.1;
            sound.playDash();
        }
    }

    triggerSpecial(projectiles) {
        if (this.specialTimer <= 0) {
            this.specialTimer = this.specialCooldownMax;
            sound.playShoot();

            // 摸鱼风暴：向周围 360 度发射 16 枚代码飞弹
            const bulletNum = 16;
            for (let i = 0; i < bulletNum; i++) {
                const angle = (i / bulletNum) * Math.PI * 2;
                const vx = Math.cos(angle) * 380;
                const vy = Math.sin(angle) * 380;
                const p = ProjectilePool.acquire(
                    this.x, this.y, vx, vy,
                    this.attackDamage * 2.5, 10, 2.0, 3, 'special'
                );
                projectiles.push(p);
            }
        }
    }

    takeDamage(amount) {
        if (this.invulnerableTimer > 0) return 0;
        const actualDmg = Math.max(1, amount - this.defense);
        this.hp -= actualDmg;
        this.invulnerableTimer = 0.4;
        sound.playHit();

        const num = DamageNumberPool.acquire(this.x, this.y, `-${actualDmg}`, '#ef4444');
        return actualDmg;
    }

    heal(amount) {
        this.hp = Math.min(this.maxHp, this.hp + amount);
        DamageNumberPool.acquire(this.x, this.y, `+${amount}`, '#10b981');
    }

    update(dt, spatialGrid, projectiles, onLevelUp) {
        // 1. 无敌时间与技能冷却
        if (this.invulnerableTimer > 0) this.invulnerableTimer -= dt;
        if (this.dashTimer > 0) this.dashTimer -= dt;
        if (this.specialTimer > 0) this.specialTimer -= dt;

        // 2. 移动与冲刺计算
        let moveSpeed = this.speed;
        if (this.isDashing) {
            moveSpeed = this.speed * 2.8;
            this.dashTimeRemaining -= dt;
            if (this.dashTimeRemaining <= 0) {
                this.isDashing = false;
            }
        }

        const moveVec = safeNormalize(this.inputVector.x, this.inputVector.y);
        this.x += moveVec.x * moveSpeed * dt;
        this.y += moveVec.y * moveSpeed * dt;

        // 3. 旋转笔记本护盾
        if (this.hasOrbitLaptop) {
            this.orbitAngle += dt * 3.5;
            const orbitRadius = 65;
            for (let i = 0; i < this.orbitCount; i++) {
                const angle = this.orbitAngle + (i / this.orbitCount) * Math.PI * 2;
                const lx = this.x + Math.cos(angle) * orbitRadius;
                const ly = this.y + Math.sin(angle) * orbitRadius;

                // 碰撞检测
                const nearby = spatialGrid.getNearby(lx, ly, 20);
                for (const m of nearby) {
                    if (!m.isDead && Math.hypot(m.x - lx, m.y - ly) < m.radius + 14) {
                        m.takeDamage(this.attackDamage * 0.8, this);
                    }
                }
            }
        }

        // 4. 主动自动攻击
        this.attackTimer += dt * this.attackSpeed;
        if (this.attackTimer >= 1.0) {
            this.attackTimer = 0;
            this.autoAttack(spatialGrid, projectiles);
        }
    }

    autoAttack(spatialGrid, projectiles) {
        // 索敌最近的敌人
        const searchRadius = 380;
        const enemies = spatialGrid.getNearby(this.x, this.y, searchRadius);
        let target = null;
        let minDist = searchRadius;

        for (const e of enemies) {
            if (e.isDead) continue;
            const d = Math.hypot(e.x - this.x, e.y - this.y);
            if (d < minDist) {
                minDist = d;
                target = e;
            }
        }

        let aimX = this.facing;
        let aimY = 0;

        if (target) {
            const dir = safeNormalize(target.x - this.x, target.y - this.y);
            aimX = dir.x;
            aimY = dir.y;
        }

        sound.playShoot();

        // 依据弹道数量发射
        const count = this.projectileCount;
        const spreadAngle = 0.22;
        const baseAngle = Math.atan2(aimY, aimX);

        for (let i = 0; i < count; i++) {
            const offset = (i - (count - 1) / 2) * spreadAngle;
            const finalAngle = baseAngle + offset;
            const vx = Math.cos(finalAngle) * 420;
            const vy = Math.sin(finalAngle) * 420;

            const isCrit = Math.random() < this.critRate;
            const dmg = isCrit ? this.attackDamage * 2 : this.attackDamage;

            const p = ProjectilePool.acquire(
                this.x, this.y, vx, vy,
                dmg, 8, 1.2, 1, isCrit ? 'crit' : 'normal'
            );
            projectiles.push(p);
        }
    }

    render(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);

        // 无敌受击闪烁
        if (this.invulnerableTimer > 0 && Math.floor(Date.now() / 80) % 2 === 0) {
            ctx.globalAlpha = 0.5;
        }

        // 冲刺拖尾光效
        if (this.isDashing) {
            ctx.fillStyle = 'rgba(56, 189, 248, 0.4)';
            ctx.beginPath();
            ctx.arc(0, 0, this.radius + 6, 0, Math.PI * 2);
            ctx.fill();
        }

        // 玩家底座光环
        ctx.fillStyle = 'rgba(56, 189, 248, 0.2)';
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2;
        ctx.stroke();

        // 玩家图标
        ctx.font = '22px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.save();
        if (this.facing === -1) ctx.scale(-1, 1);
        ctx.fillText(this.icon, 0, 0);
        ctx.restore();

        // 渲染环绕笔记本
        if (this.hasOrbitLaptop) {
            const orbitRadius = 65;
            for (let i = 0; i < this.orbitCount; i++) {
                const angle = this.orbitAngle + (i / this.orbitCount) * Math.PI * 2;
                const lx = Math.cos(angle) * orbitRadius;
                const ly = Math.sin(angle) * orbitRadius;
                ctx.font = '16px sans-serif';
                ctx.fillText('💻', lx, ly);
            }
        }

        ctx.restore();
    }
}

// =========================================================
// 怪物实体 (Enemy)
// =========================================================
export class Enemy {
    constructor(x, y, typeId = 'normal_bug') {
        this.config = MONSTER_TYPES[typeId] || MONSTER_TYPES.normal_bug;
        this.x = x;
        this.y = y;
        this.radius = this.config.radius;
        this.color = this.config.color;
        this.speed = this.config.speed;
        this.hp = this.config.hp;
        this.maxHp = this.config.hp;
        this.damage = this.config.damage;
        this.exp = this.config.exp;
        this.icon = this.config.icon;
        this.isElite = this.config.isElite || false;
        this.isBoss = this.config.isBoss || false;
        this.isDead = false;
        this.hitFlashTimer = 0;
    }

    takeDamage(amount, player) {
        if (this.isDead) return;
        this.hp -= amount;
        this.hitFlashTimer = 0.1;
        sound.playHit();

        DamageNumberPool.acquire(this.x, this.y, Math.round(amount), amount > 30 ? '#f59e0b' : '#ffffff');

        if (this.hp <= 0) {
            this.isDead = true;
            if (player && player.lifesteal && Math.random() < player.lifesteal) {
                player.heal(2);
            }
        }
    }

    update(dt, player) {
        if (this.isDead) return;
        if (this.hitFlashTimer > 0) this.hitFlashTimer -= dt;

        // 向玩家方向寻路移动
        const dir = safeNormalize(player.x - this.x, player.y - this.y);
        this.x += dir.x * this.speed * dt;
        this.y += dir.y * this.speed * dt;

        // 触碰玩家造成伤害判定
        const dist = Math.hypot(player.x - this.x, player.y - this.y);
        if (dist < this.radius + player.radius) {
            player.takeDamage(this.damage);
        }
    }

    render(ctx) {
        if (this.isDead) return;
        ctx.save();
        ctx.translate(this.x, this.y);

        if (this.hitFlashTimer > 0) {
            ctx.fillStyle = '#ffffff';
        } else {
            ctx.fillStyle = this.color;
        }

        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fill();

        // 精英/Boss 标志光环
        if (this.isElite || this.isBoss) {
            ctx.strokeStyle = '#fbbf24';
            ctx.lineWidth = 3;
            ctx.stroke();
        }

        ctx.font = `${Math.round(this.radius * 1.3)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.icon, 0, 0);

        // 血条 (精英怪/Boss)
        if ((this.isElite || this.isBoss) && this.hp < this.maxHp) {
            const barW = this.radius * 2.4;
            const barH = 5;
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(-barW / 2, -this.radius - 12, barW, barH);
            ctx.fillStyle = '#ef4444';
            ctx.fillRect(-barW / 2, -this.radius - 12, barW * (this.hp / this.maxHp), barH);
        }

        ctx.restore();
    }
}
