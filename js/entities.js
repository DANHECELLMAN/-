/**
 * 《今天也不想上班》- 实体与战斗系统核心类库 (V1.5 终极优化版)
 */

import { M_TO_PX, CHARACTERS, PLAYER_BASE, PRESSURE_STAGES, WEAPONS, SKILLS, ARTIFACTS, NORMAL_ENEMIES, ELITES, UPGRADE_SYSTEM, STAGES_CONFIG } from './constants.js';
import { sound } from './audio.js';

// 伤害飘字类
export class DamageNumber {
  constructor(x, y, damage, isCrit = false, isPlayer = false, textPrefix = "") {
    this.x = x + (Math.random() - 0.5) * 20;
    this.y = y - 10 + (Math.random() - 0.5) * 10;
    this.damage = Math.round(damage);
    this.isCrit = isCrit;
    this.isPlayer = isPlayer;
    this.textPrefix = textPrefix;
    this.life = 0.75;
    this.maxLife = 0.75;
    this.vy = isCrit ? -75 : -45;
    this.vx = (Math.random() - 0.5) * 35;
    this.scale = isCrit ? 1.45 : 1.0;
  }

  update(dt) {
    this.life -= dt;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.vy += 45 * dt;
  }

  draw(ctx) {
    ctx.save();
    const progress = this.life / this.maxLife;
    ctx.globalAlpha = Math.max(0, Math.min(1, progress * 1.5));

    let color = "#ffffff";
    if (this.isPlayer) color = "#ef4444";
    else if (this.isCrit) color = "#fbbf24";
    else if (this.textPrefix === "❄️") color = "#38bdf8";
    else if (this.textPrefix === "🔥") color = "#f97316";

    ctx.fillStyle = color;
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = this.isCrit ? 3 : 2;
    ctx.font = `bold ${Math.round(14 * this.scale)}px 'Segoe UI', Arial, sans-serif`;
    ctx.textAlign = "center";

    const text = `${this.textPrefix}${this.damage}${this.isCrit ? '!' : ''}`;
    ctx.strokeText(text, this.x, this.y);
    ctx.fillText(text, this.x, this.y);
    ctx.restore();
  }
}

// 浮动提示文本类
export class FloatingText {
  constructor(x, y, text, color = "#38bdf8", size = 16) {
    this.x = x;
    this.y = y;
    this.text = text;
    this.color = color;
    this.size = size;
    this.life = 1.2;
    this.maxLife = 1.2;
    this.vy = -35;
  }

  update(dt) {
    this.life -= dt;
    this.y += this.vy * dt;
  }

  draw(ctx) {
    ctx.save();
    const alpha = Math.max(0, Math.min(1, this.life / this.maxLife));
    ctx.globalAlpha = alpha;
    ctx.fillStyle = this.color;
    ctx.strokeStyle = "rgba(0,0,0,0.85)";
    ctx.lineWidth = 3;
    ctx.font = `bold ${this.size}px 'Segoe UI', Arial, sans-serif`;
    ctx.textAlign = "center";
    ctx.strokeText(this.text, this.x, this.y);
    ctx.fillText(this.text, this.x, this.y);
    ctx.restore();
  }
}

// 特效粒子类
export class Particle {
  constructor(x, y, vx, vy, color, size, life, type = "normal") {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.color = color;
    this.size = size;
    this.life = life;
    this.maxLife = life;
    this.type = type;
    this.alpha = 1.0;
  }

  update(dt) {
    this.life -= dt;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.alpha = Math.max(0, this.life / this.maxLife);
    if (this.type === "spark" || this.type === "fire") {
      this.size = Math.max(0.5, this.size * (1 - dt * 1.5));
    }
  }

  draw(ctx) {
    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

// 掉落物类
export class DropItem {
  constructor(x, y, type = "xp", value = 1) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.value = value;
    this.radius = type === "artifact_chest" ? 14 : (type === "punch_card" ? 18 : 8);
    this.alive = true;
    this.isMagnetized = false;
    this.speed = 0;
    this.bobPhase = Math.random() * Math.PI * 2;
  }

  update(dt, player) {
    if (!this.alive) return;
    this.bobPhase += dt * 5;

    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const dist = Math.hypot(dx, dy);

    if (dist <= player.pickupRadius || this.isMagnetized) {
      this.isMagnetized = true;
      this.speed += 550 * dt;
      this.x += (dx / dist) * this.speed * dt;
      this.y += (dy / dist) * this.speed * dt;

      if (dist <= player.radius + this.radius) {
        this.collect(player);
      }
    }
  }

  collect(player) {
    this.alive = false;
    if (this.type === "xp") {
      player.addXp(this.value);
      sound.playXp();
    } else if (this.type === "coffee") {
      player.heal(player.maxHp * 0.20, player.game, true);
      player.reducePressure(25, player.game);
      sound.playXp();
      player.game.addFloatingText(player.x, player.y - 30, "☕ 摸鱼续命！", "#10b981", 16);
    } else if (this.type === "artifact_chest") {
      player.game.triggerArtifactSelection();
    } else if (this.type === "punch_card") {
      player.game.triggerVictory();
    }
  }

  draw(ctx) {
    ctx.save();
    const bob = Math.sin(this.bobPhase) * 3;
    if (this.type === "xp") {
      ctx.fillStyle = this.value >= 10 ? "#a855f7" : (this.value >= 3 ? "#38bdf8" : "#10b981");
      ctx.shadowColor = ctx.fillStyle;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(this.x, this.y + bob, 5, 0, Math.PI * 2);
      ctx.fill();
    } else if (this.type === "coffee") {
      ctx.font = "16px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("☕", this.x, this.y + bob);
    } else if (this.type === "artifact_chest") {
      ctx.font = "22px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.shadowColor = "#fbbf24";
      ctx.shadowBlur = 12;
      ctx.fillText("🎁", this.x, this.y + bob);
    } else if (this.type === "punch_card") {
      ctx.font = "28px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.shadowColor = "#22c55e";
      ctx.shadowBlur = 16;
      ctx.fillText("💳", this.x, this.y + bob);
    }
    ctx.restore();
  }
}

// 投射物与子弹类
export class Projectile {
  constructor(options) {
    this.x = options.x;
    this.y = options.y;
    this.vx = options.vx || 0;
    this.vy = options.vy || 0;
    this.damage = options.damage || 10;
    this.radius = options.radius || 6;
    this.life = options.life || 3.0;
    this.pierce = options.pierce || 0;
    this.hitEnemies = new Set();
    this.isEvo = options.isEvo || false;
    this.isEnemy = options.isEnemy || false;
    this.type = options.type || "keycap";
    this.color = options.color || "#38bdf8";
    this.targetX = options.targetX;
    this.targetY = options.targetY;
    this.onExplode = options.onExplode || null;
    this.alive = true;
    this.knockback = options.knockback || false;
    this.rotation = Math.random() * Math.PI * 2;
    this.tracking = options.tracking || false;
  }

  update(dt, game) {
    this.life -= dt;
    this.rotation += dt * 8;

    if (this.life <= 0) {
      this.alive = false;
      if ((this.type === "resignation_bomb" || this.type === "water_cup_lob") && this.onExplode) {
        this.onExplode(this.x, this.y);
      }
      return;
    }

    if (this.tracking && this.isEnemy && game.player) {
      const dx = game.player.x - this.x;
      const dy = game.player.y - this.y;
      const dist = Math.hypot(dx, dy) || 1;
      const speed = Math.hypot(this.vx, this.vy) || 180;
      this.vx = (this.vx * 0.94) + ((dx / dist) * speed * 0.06);
      this.vy = (this.vy * 0.94) + ((dy / dist) * speed * 0.06);
    }

    if (this.type === "resignation_bomb" || this.type === "water_cup_lob") {
      const dx = this.targetX - this.x;
      const dy = this.targetY - this.y;
      const dist = Math.hypot(dx, dy);
      const speed = 440;
      if (dist < speed * dt) {
        this.x = this.targetX;
        this.y = this.targetY;
        this.alive = false;
        if (this.onExplode) this.onExplode(this.x, this.y);
        return;
      } else {
        this.x += (dx / dist) * speed * dt;
        this.y += (dy / dist) * speed * dt;
      }
    } else {
      this.x += this.vx * dt;
      this.y += this.vy * dt;
    }
  }

  draw(ctx) {
    ctx.save();
    if (this.type === "keycap") {
      ctx.translate(this.x, this.y);
      ctx.rotate(Math.atan2(this.vy, this.vx));
      ctx.fillStyle = this.isEvo ? "#dc2626" : "#f1f5f9";
      ctx.strokeStyle = this.isEvo ? "#991b1b" : "#64748b";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(-7, -7, 14, 14, 3);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = this.isEvo ? "#fef08a" : "#0f172a";
      ctx.font = "bold 9px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(this.isEvo ? "!" : "K", 0, 0);
    } else if (this.type === "resignation_bomb") {
      ctx.translate(this.x, this.y);
      ctx.rotate(this.rotation);
      ctx.font = "20px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("📄", 0, 0);
    } else if (this.type === "water_cup_lob") {
      ctx.translate(this.x, this.y);
      ctx.rotate(this.rotation);
      ctx.font = "18px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(this.isEvo ? "🪣" : "🫗", 0, 0);
    } else if (this.type === "mail_bullet" || (this.isEnemy && this.type === "enemy_bullet")) {
      ctx.translate(this.x, this.y);
      ctx.rotate(Math.atan2(this.vy, this.vx));
      ctx.fillStyle = "#38bdf8";
      ctx.shadowColor = "#0284c7";
      ctx.shadowBlur = 8;
      ctx.fillRect(-7, -4, 14, 8);
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 1;
      ctx.strokeRect(-7, -4, 14, 8);
      ctx.beginPath();
      ctx.moveTo(-7, -4); ctx.lineTo(0, 1); ctx.lineTo(7, -4);
      ctx.stroke();
    } else if (this.type === "boss_bullet") {
      ctx.translate(this.x, this.y);
      ctx.rotate(this.rotation);
      ctx.fillStyle = this.color || "#dc2626";
      ctx.shadowColor = "#ef4444";
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#fbbf24";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 9px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("KPI", 0, 0);
    } else if (this.type === "call_bullet") {
      ctx.translate(this.x, this.y);
      ctx.rotate(this.rotation);
      ctx.font = "16px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.shadowColor = "#06b6d4";
      ctx.shadowBlur = 10;
      ctx.fillText("🔔", 0, 0);
    } else if (this.type === "client_stamp_bullet") {
      ctx.translate(this.x, this.y);
      ctx.rotate(this.rotation);
      ctx.fillStyle = "#ec4899";
      ctx.shadowColor = "#f43f5e";
      ctx.shadowBlur = 10;
      ctx.fillRect(-8, -8, 16, 16);
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 1.5;
      ctx.strokeRect(-8, -8, 16, 16);
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 9px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("驳回", 0, 0);
    }
    ctx.restore();
  }
}

// 可破坏地形与障碍物类 (Boss交互、限制移动与障碍物破坏)
export class TerrainObstacle {
  constructor(options) {
    this.x = options.x;
    this.y = options.y;
    this.radius = options.radius || 24;
    this.maxHp = options.hp || 80;
    this.hp = this.maxHp;
    this.type = options.type || "contract_pillar";
    this.name = options.name || "公文障碍物";
    this.icon = options.icon || "📑";
    this.color = options.color || "#ec4899";
    this.duration = options.duration || 12.0;
    this.alive = true;
    this.pulseTimer = 0;
    this.isSolid = true;
  }

  update(dt, player, game) {
    if (!this.alive) return;
    this.duration -= dt;
    if (this.duration <= 0) {
      this.destroy(game, false);
      return;
    }

    // 实体碰撞：阻止玩家直接穿透
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const dist = Math.hypot(dx, dy);
    const minDist = this.radius + player.radius;
    if (dist < minDist && dist > 0) {
      const push = minDist - dist;
      player.x += (dx / dist) * push;
      player.y += (dy / dist) * push;
    }

    // 响铃分机特殊机制：周期性释放声波减速圈
    if (this.type === "phone_tower") {
      this.pulseTimer += dt;
      if (this.pulseTimer >= 2.0) {
        this.pulseTimer = 0;
        sound.playSonicWave(false);
        game.aoeZones.push(new AOEZone({
          x: this.x, y: this.y, radius: 3.5 * M_TO_PX, duration: 1.5, type: "phone_pulse", slowPct: 0.40
        }));
      }
    }
  }

  takeDamage(amount, game) {
    if (!this.alive) return;
    this.hp -= amount;
    game.addDamageNumber(this.x, this.y, amount, false, false, "🧱");
    if (this.hp <= 0) {
      this.destroy(game, true);
    }
  }

  destroy(game, byPlayer = true) {
    if (!this.alive) return;
    this.alive = false;
    sound.playExplosion(false);
    for (let i = 0; i < 8; i++) {
      game.particles.push(new Particle(
        this.x, this.y,
        (Math.random() - 0.5) * 120,
        (Math.random() - 0.5) * 120,
        this.color, 4, 0.4, "spark"
      ));
    }
    if (byPlayer) {
      game.addFloatingText(this.x, this.y - 20, "💥 地形破坏！", "#10b981", 14);
      game.drops.push(new DropItem(this.x, this.y, "xp", 3));
    }
  }

  draw(ctx) {
    ctx.save();
    ctx.fillStyle = "rgba(15, 23, 42, 0.75)";
    ctx.strokeStyle = this.color;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.font = `${this.radius * 1.1}px Arial`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(this.icon, this.x, this.y);

    // HP条
    if (this.hp < this.maxHp) {
      const barW = this.radius * 2;
      ctx.fillStyle = "rgba(0,0,0,0.6)";
      ctx.fillRect(this.x - barW / 2, this.y - this.radius - 8, barW, 4);
      ctx.fillStyle = this.color;
      ctx.fillRect(this.x - barW / 2, this.y - this.radius - 8, barW * (this.hp / this.maxHp), 4);
    }
    ctx.restore();
  }
}

// 广域范围伤害与区域特效类
export class AOEZone {
  constructor(options) {
    this.x = options.x;
    this.y = options.y;
    this.radius = options.radius || 50;
    this.duration = options.duration || 2.0;
    this.maxDuration = this.duration;
    this.type = options.type;
    this.damage = options.damage || 0;
    this.tickInterval = options.tickInterval || 0.4;
    this.tickTimer = 0;
    this.slowPct = options.slowPct || 0;
    this.alive = true;
    this.color = options.color || "rgba(239, 68, 68, 0.3)";
    this.onComplete = options.onComplete || null;
    this.isEvo = options.isEvo || false;
    this.angle = options.angle || 0;
    this.arc = options.arc || Math.PI * 2;
    this.hitEnemies = new Set();
    this.lineStartX = options.lineStartX || 0;
    this.lineStartY = options.lineStartY || 0;
    this.lineEndX = options.lineEndX || 0;
    this.lineEndY = options.lineEndY || 0;
    this.freezeDuration = options.freezeDuration || 1.0;
    this.burnDuration = options.burnDuration || 3.0;
    this.burnDps = options.burnDps || 25;
    this.sweetSpotMult = options.sweetSpotMult || 1.7;
    this.healAmount = options.healAmount || 0;
  }

  update(dt, game) {
    this.duration -= dt;
    if (this.duration <= 0) {
      this.alive = false;
      if (this.onComplete) this.onComplete();
      return;
    }

    const progress = 1 - (this.duration / this.maxDuration);

    if (this.type === "sonic_wave") {
      const curRadius = this.radius * progress;
      game.enemies.forEach(enemy => {
        if (enemy.alive && !this.hitEnemies.has(enemy)) {
          const dist = Math.hypot(enemy.x - this.x, enemy.y - this.y);
          if (dist <= curRadius + enemy.radius) {
            this.hitEnemies.add(enemy);
            enemy.takeDamage(this.damage, false, game, { x: this.x, y: this.y, force: this.isEvo ? 350 : 200 });
          }
        }
      });
      if (this.isEvo) {
        game.projectiles.forEach(p => {
          if (p.isEnemy && Math.hypot(p.x - this.x, p.y - this.y) <= curRadius + p.radius) {
            p.alive = false;
          }
        });
      }
    } else if (this.type === "chair_spin") {
      game.enemies.forEach(enemy => {
        if (enemy.alive && !this.hitEnemies.has(enemy)) {
          const dist = Math.hypot(enemy.x - this.x, enemy.y - this.y);
          if (dist <= this.radius + enemy.radius) {
            this.hitEnemies.add(enemy);
            const isSweetSpot = dist >= (this.radius * 0.45);
            const finalDmg = isSweetSpot ? (this.damage * this.sweetSpotMult) : this.damage;
            const knockForce = isSweetSpot ? (this.isEvo ? 450 : 320) : 140;

            enemy.takeDamage(finalDmg, isSweetSpot, game, { x: this.x, y: this.y, force: knockForce });

            if (isSweetSpot && game.player && game.player.alive) {
              game.player.heal(this.isEvo ? 4 : 2, game, false);
              game.player.reducePressure(2, game);
              game.addFloatingText(this.x, this.y - 35, "🪑 外圈大杀四方!", "#fbbf24", 15);
            }

            for (let k = 0; k < 4; k++) {
              game.particles.push(new Particle(enemy.x, enemy.y, (Math.random() - 0.5) * 90, (Math.random() - 0.5) * 90, isSweetSpot ? "#fbbf24" : "#cbd5e1", 3, 0.25, "spark"));
            }
          }
        }
      });
    } else if (this.type === "ac_freeze_cone") {
      game.enemies.forEach(enemy => {
        if (enemy.alive && !this.hitEnemies.has(enemy)) {
          const dist = Math.hypot(enemy.x - this.x, enemy.y - this.y);
          if (dist <= this.radius + enemy.radius) {
            const eAngle = Math.atan2(enemy.y - this.y, enemy.x - this.x);
            let diff = Math.abs(eAngle - this.angle);
            while (diff > Math.PI) diff -= Math.PI * 2;
            diff = Math.abs(diff);

            if (diff <= this.arc / 2) {
              this.hitEnemies.add(enemy);
              enemy.takeDamage(this.damage, false, game);
              if (enemy.applyFreeze) enemy.applyFreeze(this.freezeDuration, game);
              for (let k = 0; k < 3; k++) {
                game.particles.push(new Particle(enemy.x, enemy.y, (Math.random() - 0.5) * 50, (Math.random() - 0.5) * 50, "#67e8f9", 3, 0.3, "spark"));
              }
            }
          }
        }
      });
    } else if (this.type === "ac_heat_cone") {
      game.enemies.forEach(enemy => {
        if (enemy.alive && !this.hitEnemies.has(enemy)) {
          const dist = Math.hypot(enemy.x - this.x, enemy.y - this.y);
          if (dist <= this.radius + enemy.radius) {
            const eAngle = Math.atan2(enemy.y - this.y, enemy.x - this.x);
            let diff = Math.abs(eAngle - this.angle);
            while (diff > Math.PI) diff -= Math.PI * 2;
            diff = Math.abs(diff);

            if (diff <= this.arc / 2) {
              this.hitEnemies.add(enemy);
              enemy.takeDamage(this.damage, false, game);
              if (enemy.applyBurn) enemy.applyBurn(this.burnDuration, this.burnDps, game);
              for (let k = 0; k < 4; k++) {
                game.particles.push(new Particle(enemy.x, enemy.y, (Math.random() - 0.5) * 80, (Math.random() - 0.5) * 80, "#f97316", 3.5, 0.3, "fire"));
              }
            }
          }
        }
      });
    } else if (this.type === "ac_fusion_blast") {
      game.enemies.forEach(enemy => {
        if (enemy.alive && !this.hitEnemies.has(enemy)) {
          const dist = Math.hypot(enemy.x - this.x, enemy.y - this.y);
          if (dist <= this.radius + enemy.radius) {
            this.hitEnemies.add(enemy);
            const isFrozen = (enemy.freezeTimer || 0) > 0;
            const finalDmg = isFrozen ? (this.damage * 2.2) : this.damage;
            enemy.takeDamage(finalDmg, isFrozen, game, { x: this.x, y: this.y, force: 380 });
            if (enemy.applyBurn) enemy.applyBurn(4.0, 45, game);
            if (isFrozen) {
              game.addFloatingText(enemy.x, enemy.y - 20, "💥 碎冰核爆!", "#38bdf8", 16);
            }
          }
        }
      });
    } else if (this.type === "electric_whip") {
      game.enemies.forEach(enemy => {
        if (enemy.alive && !this.hitEnemies.has(enemy)) {
          const dist = Math.hypot(enemy.x - this.x, enemy.y - this.y);
          if (dist <= this.radius + enemy.radius) {
            const eAngle = Math.atan2(enemy.y - this.y, enemy.x - this.x);
            let diff = Math.abs(eAngle - this.angle);
            while (diff > Math.PI) diff -= Math.PI * 2;
            diff = Math.abs(diff);

            if (this.arc >= Math.PI * 1.9 || diff <= this.arc / 2) {
              this.hitEnemies.add(enemy);
              enemy.takeDamage(this.damage, false, game, { x: this.x, y: this.y, force: 200 });

              game.enemies.forEach(other => {
                if (other.alive && other !== enemy && Math.hypot(other.x - enemy.x, other.y - enemy.y) <= 90) {
                  other.takeDamage(this.damage * 0.6, false, game);
                  game.particles.push(new Particle((enemy.x + other.x) / 2, (enemy.y + other.y) / 2, 0, 0, "#38bdf8", 3, 0.15, "spark"));
                }
              });
            }
          }
        }
      });
    } else if (this.type === "water_puddle") {
      this.tickTimer += dt;
      if (this.tickTimer >= this.tickInterval) {
        this.tickTimer = 0;
        game.enemies.forEach(enemy => {
          if (enemy.alive && Math.hypot(enemy.x - this.x, enemy.y - this.y) <= this.radius + enemy.radius) {
            enemy.takeDamage(this.damage, false, game);
            if (this.slowPct > 0) {
              enemy.speed = enemy.baseSpeed * (1 - this.slowPct);
            }
          }
        });
        if (this.isEvo && game.player && Math.hypot(game.player.x - this.x, game.player.y - this.y) <= this.radius + game.player.radius) {
          game.player.heal(game.player.maxHp * 0.015, game, true);
        }
      }
    } else if (this.type === "resignation_pool") {
      this.tickTimer += dt;
      if (this.tickTimer >= this.tickInterval) {
        this.tickTimer = 0;
        game.enemies.forEach(enemy => {
          if (enemy.alive && Math.hypot(enemy.x - this.x, enemy.y - this.y) <= this.radius + enemy.radius) {
            enemy.takeDamage(this.damage, false, game);
          }
        });
      }
    } else if (this.type === "demand_red_line") {
      if (game.player && game.player.alive) {
        const p = game.player;
        const d = distToSegment({ x: p.x, y: p.y }, { x: this.lineStartX, y: this.lineStartY }, { x: this.lineEndX, y: this.lineEndY });
        if (d <= p.radius + 6) {
          p.speedMult = 0.5;
          this.tickTimer += dt;
          if (this.tickTimer >= 0.35) {
            this.tickTimer = 0;
            p.takeDamage(this.damage, null, game, true);
            game.addFloatingText(p.x, p.y - 25, "⚠️ 需求越界！", "#ef4444", 13);
          }
        }
      }
    } else if (this.type === "vortex_pull") {
      if (game.player && game.player.alive) {
        const p = game.player;
        const dx = this.x - p.x;
        const dy = this.y - p.y;
        const dist = Math.hypot(dx, dy);
        if (dist <= this.radius && dist > 5) {
          const pullSpeed = 160 * (1 - dist / this.radius);
          p.x += (dx / dist) * pullSpeed * dt;
          p.y += (dy / dist) * pullSpeed * dt;
        }
      }
    } else if (this.type === "phone_pulse" || this.type === "meeting_slow") {
      if (game.player && game.player.alive) {
        if (Math.hypot(game.player.x - this.x, game.player.y - this.y) <= this.radius + game.player.radius) {
          game.player.speedMult = Math.min(game.player.speedMult, 1 - this.slowPct);
        }
      }
    }
  }

  draw(ctx) {
    ctx.save();
    const progress = 1 - (this.duration / this.maxDuration);

    if (this.type === "sonic_wave") {
      const curR = this.radius * progress;
      ctx.strokeStyle = this.isEvo ? `rgba(239, 68, 68, ${1 - progress})` : `rgba(56, 189, 248, ${1 - progress})`;
      ctx.lineWidth = this.isEvo ? 6 : 3.5;
      ctx.beginPath();
      ctx.arc(this.x, this.y, curR, 0, Math.PI * 2);
      ctx.stroke();
    } else if (this.type === "chair_spin") {
      const spinAngle = progress * Math.PI * 4;
      ctx.strokeStyle = this.isEvo ? "rgba(234, 179, 8, 0.85)" : "rgba(56, 189, 248, 0.8)";
      ctx.lineWidth = this.isEvo ? 8 : 5;
      ctx.shadowColor = this.isEvo ? "#eab308" : "#0284c7";
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, spinAngle, spinAngle + Math.PI * 1.6);
      ctx.stroke();

      ctx.fillStyle = "rgba(148, 163, 184, 0.15)";
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius * 0.45, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = "#fbbf24";
      ctx.lineWidth = 3;
      ctx.setLineDash([8, 8]);
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.stroke();
    } else if (this.type === "ac_freeze_cone") {
      ctx.fillStyle = `rgba(103, 232, 249, ${0.4 * (1 - progress)})`;
      ctx.strokeStyle = "#67e8f9";
      ctx.lineWidth = 2.5;
      ctx.shadowColor = "#38bdf8";
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.moveTo(this.x, this.y);
      ctx.arc(this.x, this.y, this.radius, this.angle - this.arc / 2, this.angle + this.arc / 2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else if (this.type === "ac_heat_cone") {
      ctx.fillStyle = `rgba(249, 115, 22, ${0.45 * (1 - progress)})`;
      ctx.strokeStyle = "#f97316";
      ctx.lineWidth = 2.5;
      ctx.shadowColor = "#ef4444";
      ctx.shadowBlur = 14;
      ctx.beginPath();
      ctx.moveTo(this.x, this.y);
      ctx.arc(this.x, this.y, this.radius, this.angle - this.arc / 2, this.angle + this.arc / 2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else if (this.type === "ac_fusion_blast") {
      const curR = this.radius * Math.min(1, progress * 1.4);
      const grad = ctx.createRadialGradient(this.x, this.y, 5, this.x, this.y, curR);
      grad.addColorStop(0, "rgba(255, 255, 255, 0.9)");
      grad.addColorStop(0.4, "rgba(249, 115, 22, 0.6)");
      grad.addColorStop(0.8, "rgba(56, 189, 248, 0.5)");
      grad.addColorStop(1, "rgba(6, 182, 212, 0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(this.x, this.y, curR, 0, Math.PI * 2);
      ctx.fill();
    } else if (this.type === "electric_whip") {
      ctx.strokeStyle = this.isEvo ? "#f59e0b" : "#38bdf8";
      ctx.lineWidth = 4;
      ctx.shadowColor = this.isEvo ? "#fbbf24" : "#0284c7";
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, this.angle - this.arc / 2, this.angle + this.arc / 2);
      ctx.stroke();
    } else if (this.type === "demand_red_line") {
      ctx.strokeStyle = `rgba(239, 68, 68, ${0.7 + 0.3 * Math.sin(Date.now() / 100)})`;
      ctx.lineWidth = 5;
      ctx.shadowColor = "#dc2626";
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.moveTo(this.lineStartX, this.lineStartY);
      ctx.lineTo(this.lineEndX, this.lineEndY);
      ctx.stroke();
    } else if (this.type === "vortex_pull") {
      ctx.strokeStyle = `rgba(168, 85, 247, ${0.6 * (1 - progress)})`;
      ctx.lineWidth = 3;
      ctx.setLineDash([8, 8]);
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius * (1 - progress), 0, Math.PI * 2);
      ctx.stroke();
    } else if (this.type === "water_puddle") {
      ctx.fillStyle = this.isEvo ? "rgba(6, 182, 212, 0.3)" : "rgba(56, 189, 248, 0.2)";
      ctx.strokeStyle = this.isEvo ? "#06b6d4" : "#38bdf8";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    } else if (this.type === "resignation_pool") {
      ctx.fillStyle = "rgba(244, 63, 94, 0.2)";
      ctx.strokeStyle = "#f43f5e";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    } else if (this.type === "meeting_slow" || this.type === "phone_pulse") {
      ctx.fillStyle = "rgba(168, 85, 247, 0.2)";
      ctx.strokeStyle = "#a855f7";
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    } else if (this.type === "boss_warning_circle") {
      ctx.fillStyle = "rgba(239, 68, 68, 0.2)";
      ctx.strokeStyle = "#ef4444";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(239, 68, 68, 0.45)";
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius * progress, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}

function distToSegment(p, v, w) {
  const l2 = (w.x - v.x) ** 2 + (w.y - v.y) ** 2;
  if (l2 === 0) return Math.hypot(p.x - v.x, p.y - v.y);
  let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(p.x - (v.x + t * (w.x - v.x)), p.y - (v.y + t * (w.y - v.y)));
}



const HORN_MECHA_DIR_ORDER = ["down", "down_left", "left", "up_left", "up", "up_right", "right", "down_right"];
const HORN_MECHA_ANIMS = {
  idle:   { src: "assets/characters/horn_mecha/spritesheets/idle_8dir.png", rows: 8, cols: 6, fps: 6, loop: true },
  run:    { src: "assets/characters/horn_mecha/spritesheets/run_8dir.png", rows: 8, cols: 8, fps: 10, loop: true },
  attack: { src: "assets/characters/horn_mecha/spritesheets/attack_8dir.png", rows: 8, cols: 8, fps: 14, loop: false },
  dodge:  { src: "assets/characters/horn_mecha/spritesheets/dodge_8dir.png", rows: 8, cols: 6, fps: 18, loop: false },
  hit:    { src: "assets/characters/horn_mecha/spritesheets/hit_8dir.png", rows: 8, cols: 4, fps: 12, loop: false },
  death:  { src: "assets/characters/horn_mecha/spritesheets/death_8dir.png", rows: 8, cols: 10, fps: 10, loop: false }
};
const hornMechaImageCache = {};
function getHornMechaImage(src) {
  if (!hornMechaImageCache[src]) {
    const img = new Image();
    img.src = src;
    hornMechaImageCache[src] = img;
  }
  return hornMechaImageCache[src];
}
function directionFromVector(dx, dy, fallback = "right") {
  if (Math.hypot(dx, dy) < 0.08) return fallback;
  const angle = Math.atan2(dy, dx);
  const sector = Math.round(angle / (Math.PI / 4));
  const map = {0:"right",1:"down_right",2:"down",3:"down_left",4:"left",'-4':"left",'-3':"up_left",'-2':"up",'-1':"up_right"};
  return map[sector] || fallback;
}

// 玩家角色类
export class Player {
  constructor(game, characterId = "xiaochen") {
    this.game = game;
    this.characterId = characterId;
    this.charConf = CHARACTERS[characterId] || CHARACTERS.xiaochen;

    this.x = game.mapWidth / 2;
    this.y = game.mapHeight / 2;
    this.radius = 16;
    this.vx = 0;
    this.vy = 0;
    this.faceX = 1;
    this.faceY = 0;
    this.speedMult = 1.0;

    const tals = game.saveData ? (game.saveData.talents || {}) : {};
    const hpLvl = tals.hp_max || tals.health_check || 0;
    const spdLvl = tals.move_speed || tals.fast_runner || 0;
    const dmgLvl = tals.weapon_damage || tals.skilled_worker || 0;
    const xpLvl = tals.xp_gain || tals.slacker_xp || 0;
    const pickLvl = tals.pickup_range || 0;
    const regenLvl = tals.hp_regen || 0;
    const stressLvl = tals.stress_resist || tals.mental_construction || 0;
    const critLvl = tals.crit_boost || 0;

    this.maxHp = this.charConf.baseStats.maxHp * (1 + hpLvl * 0.05);
    this.hp = this.maxHp;
    this.baseMoveSpeed = this.charConf.baseStats.moveSpeed * (1 + spdLvl * 0.03);
    this.moveSpeed = this.baseMoveSpeed;
    this.baseDamageMult = this.charConf.baseStats.damageMult * (1 + dmgLvl * 0.05);
    this.damageMultiplier = this.baseDamageMult;
    this.critRate = this.charConf.baseStats.critRate + (critLvl * 0.02);
    this.critDmg = this.charConf.baseStats.critDmg + (critLvl * 0.10);
    this.xpMult = this.charConf.baseStats.xpMult * (1 + xpLvl * 0.05);
    this.pickupRadius = this.charConf.baseStats.pickupRadius * (1 + pickLvl * 0.08);
    this.hpRegenPerSec = regenLvl * 0.5;
    this.stressResistance = stressLvl * 0.05;

    this.level = 1;
    this.xp = 0;
    this.xpNeeded = game.getXpNeeded(1);

    this.pressure = 0;
    this.highestPressure = 0;
    this.isCollapsed = false;
    this.alive = true;

    this.weapons = {};
    this.weapons[this.charConf.initialWeapon] = 1;
    this.skills = {};
    this.artifacts = {};
    this.evolvedWeapons = {};

    this.invulnerableTimer = 0;
    this.dodgeTimer = 0;
    this.dodgeCooldownTimer = 0;
    this.perfectDodgeCount = 0;
    this.perfectDodgeTimer = 0;
    this.paidPoopTimer = 0;
    this.paidPoopInvulnTimer = 0;

    this.activeSkillCd = this.charConf.active?.cd || 16.0;
    this.activeSkillCdTimer = 0;
    this.activeSkillDurationTimer = 0;

    this.shieldTimer = 0;
    this.shieldReady = false;
    this.passiveBuffTimer = 0;
    this.slackingRegenTimer = 0;
    this.lastHurtTime = 0;
    this.revivedOnce = false;

    this.keyboardTimer = 0;
    this.mugAngle = 0;
    this.mugShockwaveTimer = 0;
    this.resignationTimer = 0;
    this.headphonesTimer = 0;
    this.waterCupTimer = 0;
    this.chargingCableTimer = 0;
    this.chairTimer = 0;
    this.acFreezeTimer = 0;
    this.acHeatTimer = 0;
    this.acFusionTimer = 0;
    this.renderDirection = "right";
    this.animTime = 0;
    this.attackAnimTimer = 0;
    this.attackVisualTimer = 0;
    this.hitAnimTimer = 0;
    this.deathAnimElapsed = 0;
    this.damageMoveBuffTimer = 0;
    this.dodgeAttackBuffTimer = 0;
    this.isMoving = false;
  }

  triggerAttack(duration = 0.42) { this.attackAnimTimer = Math.max(this.attackAnimTimer, duration); }
  updateAnimationState(dt, game) {
    this.animTime += dt;
    if (this.attackAnimTimer > 0) this.attackAnimTimer -= dt;
    if (this.hitAnimTimer > 0) this.hitAnimTimer -= dt;
    if (this.damageMoveBuffTimer > 0) this.damageMoveBuffTimer -= dt;
    if (this.dodgeAttackBuffTimer > 0) this.dodgeAttackBuffTimer -= dt;
    if (!this.alive) { this.deathAnimElapsed += dt; return; }
    const dx = this.isMoving ? this.vx : this.faceX;
    const dy = this.isMoving ? this.vy : this.faceY;
    this.renderDirection = directionFromVector(dx, dy, this.renderDirection || "right");
  }

  update(dt, game) {
    if (!this.alive) { this.updateAnimationState(dt, game); return; }

    if (this.invulnerableTimer > 0) this.invulnerableTimer -= dt;
    if (this.dodgeCooldownTimer > 0) this.dodgeCooldownTimer -= dt;
    if (this.dodgeTimer > 0) this.dodgeTimer -= dt;
    if (this.activeSkillCdTimer > 0) this.activeSkillCdTimer -= dt;
    if (this.activeSkillDurationTimer > 0) this.activeSkillDurationTimer -= dt;
    if (this.paidPoopInvulnTimer > 0) this.paidPoopInvulnTimer -= dt;

    if (this.hpRegenPerSec > 0 && this.hp < this.maxHp) {
      this.heal(this.hpRegenPerSec * dt, game, false);
    }

    if (this.skills.paid_slacking) {
      this.slackingRegenTimer += dt;
      if (this.slackingRegenTimer >= 1.0) {
        this.slackingRegenTimer = 0;
        const regenAmount = SKILLS.paid_slacking.regen[this.skills.paid_slacking - 1];
        this.heal(regenAmount, game, false);
      }
    }

    if (this.skills.shield && !this.shieldReady) {
      this.shieldTimer += dt;
      const cd = SKILLS.shield.shieldCd[this.skills.shield - 1];
      if (this.shieldTimer >= cd) {
        this.shieldReady = true;
        this.shieldTimer = 0;
        game.addFloatingText(this.x, this.y - 25, "🛡️ 工位护盾就绪！", "#38bdf8", 14);
      }
    }

    this.updatePressure(dt, game);
    this.updateMovement(dt, game);
    this.updateAllWeapons(dt, game);
    this.updateAnimationState(dt, game);
  }

  updateMovement(dt, game) {
    let speed = this.baseMoveSpeed * this.speedMult;
    if (this.damageMoveBuffTimer > 0) speed *= 1.08;
    if (this.skills.boss_is_coming) {
      speed *= (1 + SKILLS.boss_is_coming.speedBonus[this.skills.boss_is_coming - 1]);
    }
    if (this.pressure >= 50 && this.pressure < 80) speed *= 1.10;

    let moveX = 0;
    let moveY = 0;

    if (game.keys['KeyW'] || game.keys['ArrowUp']) moveY -= 1;
    if (game.keys['KeyS'] || game.keys['ArrowDown']) moveY += 1;
    if (game.keys['KeyA'] || game.keys['ArrowLeft']) moveX -= 1;
    if (game.keys['KeyD'] || game.keys['ArrowRight']) moveX += 1;

    if (game.joystick && (game.joystick.x !== 0 || game.joystick.y !== 0)) {
      moveX = game.joystick.x;
      moveY = game.joystick.y;
    }

    const len = Math.hypot(moveX, moveY);
    this.isMoving = len > 0.05;
    this.vx = 0;
    this.vy = 0;
    if (len > 0.05) {
      const nx = moveX / len;
      const ny = moveY / len;
      this.faceX = nx;
      this.faceY = ny;
      this.vx = nx;
      this.vy = ny;
      this.x += nx * speed * dt;
      this.y += ny * speed * dt;
    }

    this.x = Math.max(this.radius + 10, Math.min(game.mapWidth - this.radius - 10, this.x));
    this.y = Math.max(this.radius + 10, Math.min(game.mapHeight - this.radius - 10, this.y));
    this.speedMult = 1.0;
  }

  updatePressure(dt, game) {
    if (this.pressure >= 80 && this.pressure < 100) {
      this.addPressure(0.5 * dt, game);
    }
    if (this.pressure >= 100) {
      this.isCollapsed = true;
      this.hp -= (this.maxHp * 0.02) * dt;
      sound.playHeartbeat();
      if (this.hp <= 0) this.die(game);
    } else {
      this.isCollapsed = false;
      if (Date.now() - this.lastHurtTime > 4000 && this.pressure > 0) {
        const decayRate = 3.5 * (1 + this.stressResistance);
        this.reducePressure(decayRate * dt, game);
      }
    }
  }

  addPressure(amount, game) {
    const reduced = amount * (1 - this.stressResistance);
    this.pressure = Math.min(100, Math.max(0, this.pressure + reduced));
    if (this.pressure > this.highestPressure) this.highestPressure = this.pressure;
  }

  reducePressure(amount, game) {
    this.pressure = Math.max(0, this.pressure - amount);
  }

  addXp(amount) {
    this.xp += amount * this.xpMult;
    if (this.xp >= this.xpNeeded) {
      this.levelUp();
    }
  }

  levelUp() {
    this.xp -= this.xpNeeded;
    this.level++;
    this.xpNeeded = this.game.getXpNeeded(this.level);
    sound.playLevelUp();
    this.heal(this.maxHp * 0.15, this.game, false);
    this.reducePressure(15, this.game);
    this.game.addFloatingText(this.x, this.y - 35, `🎉 升至 Lv.${this.level}！`, "#38bdf8", 20);
    this.game.triggerLevelUpSelection();
  }

  heal(amount, game, showText = false) {
    if (!this.alive) return;
    this.hp = Math.min(this.maxHp, this.hp + amount);
    if (showText) {
      game.addFloatingText(this.x, this.y - 20, `+${Math.round(amount)} HP`, "#10b981", 14);
    }
  }

  getDamageMultiplier() {
    let mult = this.damageMultiplier;
    if (this.skills.kpi) mult += SKILLS.kpi.damageBonus[this.skills.kpi - 1];
    if (this.skills.quit && (this.hp / this.maxHp) <= 0.5) {
      mult += SKILLS.quit.lowHpDmg[this.skills.quit - 1];
    }
    if (this.activeSkillDurationTimer > 0 && this.characterId === "xiaochen") mult += 0.25;
    return mult;
  }

  getAttackSpeedMult() {
    let mult = 1.0;
    if (this.dodgeAttackBuffTimer > 0) mult += 0.20;
    const tals = this.game.saveData ? (this.game.saveData.talents || {}) : {};
    const spdBonus = (tals.attack_speed || 0) * 0.04;
    mult += spdBonus;
    if (this.skills.coffee) mult += SKILLS.coffee.attackSpeed[this.skills.coffee - 1];
    if (this.pressure >= 50 && this.pressure < 80) mult += 0.15;
    if (this.activeSkillDurationTimer > 0 && this.characterId === "xiaochen") mult += 0.70;
    return mult;
  }

  getAoERangeMult() {
    let mult = 1.0;
    const tals = this.game.saveData ? (this.game.saveData.talents || {}) : {};
    const aoeBonus = (tals.aoe_range || 0) * 0.06;
    mult += aoeBonus;
    if (this.skills.loudspeaker_meeting) mult += SKILLS.loudspeaker_meeting.areaBonus[this.skills.loudspeaker_meeting - 1];
    if (this.pressure >= 80) mult += 0.25;
    return mult;
  }

  updateAllWeapons(dt, game) {
    if (this.weapons.keyboard) this.updateKeyboard(dt, game);
    if (this.weapons.mug) this.updateMug(dt, game);
    if (this.weapons.resignation) this.updateResignation(dt, game);
    if (this.weapons.headphones) this.updateHeadphones(dt, game);
    if (this.weapons.water_cup) this.updateWaterCup(dt, game);
    if (this.weapons.charging_cable) this.updateChargingCable(dt, game);
    if (this.weapons.chair) this.updateChair(dt, game);
    if (this.weapons.ac_freeze) this.updateAcFreeze(dt, game);
    if (this.weapons.ac_heat) this.updateAcHeat(dt, game);
    if ((this.weapons.ac_freeze && this.weapons.ac_heat) || this.evolvedWeapons.ac_fusion_evo) {
      this.updateAcFusion(dt, game);
    }
    const nearbyEnemy = game.enemies.find(e => e.alive && Math.hypot(e.x - this.x, e.y - this.y) < 260);
    this.attackVisualTimer += dt;
    const attackVisualInterval = 0.58 / this.getAttackSpeedMult();
    if (nearbyEnemy && this.attackVisualTimer >= attackVisualInterval && this.dodgeTimer <= 0 && this.hitAnimTimer <= 0) {
      this.attackVisualTimer = 0;
      this.triggerAttack(0.44);
    }
  }

  updateKeyboard(dt, game) {
    const isEvo = !!this.evolvedWeapons.keyboard;
    const lvl = this.weapons.keyboard;
    let baseInterval = 0.52;
    if (lvl >= 3) baseInterval *= 0.85;
    if (isEvo) baseInterval *= 0.72;

    const interval = baseInterval / this.getAttackSpeedMult();
    this.keyboardTimer += dt;

    if (this.keyboardTimer >= interval) {
      this.keyboardTimer = 0;
      const target = game.getOptimalTarget(8.5 * M_TO_PX, 100) || game.getNearestEnemy(this.x, this.y, 8.5 * M_TO_PX);
      if (target) {
        let baseDmg = 14;
        if (lvl >= 2) baseDmg *= 1.20;
        if (lvl >= 5) baseDmg *= 1.25;
        const finalDmg = baseDmg * this.getDamageMultiplier();

        let count = 1;
        if (this.skills.dual_screen) count += SKILLS.dual_screen.projectiles[this.skills.dual_screen - 1];
        if (lvl >= 4) count += 1;
        if (isEvo) count += 1;

        const pierce = (lvl >= 5 || isEvo) ? 1 : 0;
        for (let i = 0; i < count; i++) {
          const spread = (i - (count - 1) / 2) * 0.15;
          const angle = Math.atan2(target.y - this.y, target.x - this.x) + spread;
          const speed = 480;
          game.projectiles.push(new Projectile({
            x: this.x, y: this.y,
            vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
            damage: finalDmg, radius: 7, life: 1.5, pierce: pierce, isEvo: isEvo, type: "keycap"
          }));
        }
        sound.playKeyboardShot(isEvo);
      }
    }
  }

  updateMug(dt, game) {
    const isEvo = !!this.evolvedWeapons.mug;
    const lvl = this.weapons.mug;
    let count = 1;
    if (lvl >= 3) count = 2;
    if (lvl >= 5) count = 3;
    if (isEvo) count = 4;

    let rotSpeed = 2.4;
    if (lvl >= 2) rotSpeed *= 1.25;
    this.mugAngle += rotSpeed * dt;

    let radius = 2.2 * M_TO_PX * this.getAoERangeMult();
    if (lvl >= 4) radius *= 1.10;

    let baseDmg = 18;
    if (lvl >= 4) baseDmg *= 1.25;
    const finalDmg = baseDmg * this.getDamageMultiplier();

    for (let i = 0; i < count; i++) {
      const angle = this.mugAngle + (i * (Math.PI * 2 / count));
      const mugX = this.x + Math.cos(angle) * radius;
      const mugY = this.y + Math.sin(angle) * radius;
      const hitRadius = 32;

      game.enemies.forEach(enemy => {
        if (enemy.alive && Math.hypot(enemy.x - mugX, enemy.y - mugY) <= enemy.radius + hitRadius) {
          if (!enemy.lastMugHitTime || (Date.now() - enemy.lastMugHitTime > 350)) {
            enemy.lastMugHitTime = Date.now();
            enemy.takeDamage(finalDmg, false, game, lvl >= 5 ? { x: mugX, y: mugY, force: 160 } : null);
            sound.playMugHit();
            for (let k = 0; k < 2; k++) {
              game.particles.push(new Particle(enemy.x, enemy.y, (Math.random() - 0.5) * 60, (Math.random() - 0.5) * 60, "#78350f", 3, 0.2, "spark"));
            }
          }
        }
      });
    }

    if (isEvo) {
      this.mugShockwaveTimer += dt;
      if (this.mugShockwaveTimer >= 6.0) {
        this.mugShockwaveTimer = 0;
        let shockRadius = 4.0 * M_TO_PX * this.getAoERangeMult();
        game.enemies.forEach(enemy => {
          if (enemy.alive && Math.hypot(enemy.x - this.x, enemy.y - this.y) <= shockRadius + enemy.radius) {
            enemy.takeDamage(finalDmg * 1.5, true, game, { x: this.x, y: this.y, force: 300 });
          }
        });
        sound.playExplosion(false);
        game.addFloatingText(this.x, this.y - 30, "☕ 咖啡巨浪！", "#38bdf8", 16);
      }
    }
  }

  updateResignation(dt, game) {
    const isEvo = !!this.evolvedWeapons.resignation;
    const lvl = this.weapons.resignation;
    let baseInterval = isEvo ? 2.2 : 2.0;
    if (lvl >= 5 && !isEvo) baseInterval *= 0.80;
    const interval = baseInterval / this.getAttackSpeedMult();

    this.resignationTimer += dt;
    if (this.resignationTimer >= interval) {
      this.resignationTimer = 0;
      const target = game.getOptimalTarget(10 * M_TO_PX, 140) || game.getNearestEnemy(this.x, this.y, 10 * M_TO_PX);
      if (target) {
        let baseDmg = 45;
        if (lvl >= 3) baseDmg *= 1.25;
        if (lvl >= 5) baseDmg *= 1.25;
        if (isEvo) baseDmg *= 1.90;
        const finalDmg = baseDmg * this.getDamageMultiplier();

        let baseRadius = (isEvo ? (3.6 * M_TO_PX) : (1.8 * M_TO_PX)) * this.getAoERangeMult();
        if (lvl >= 2 && !isEvo) baseRadius *= 1.20;

        const tx = target.x;
        const ty = target.y;
        game.projectiles.push(new Projectile({
          x: this.x, y: this.y, targetX: tx, targetY: ty, damage: finalDmg, type: "resignation_bomb",
          onExplode: (ex, ey) => {
            sound.playExplosion(isEvo);
            game.enemies.forEach(enemy => {
              if (enemy.alive && Math.hypot(enemy.x - ex, enemy.y - ey) <= baseRadius + enemy.radius) {
                enemy.takeDamage(finalDmg, false, game, { x: ex, y: ey, force: 200 });
              }
            });
            if (lvl >= 4 || isEvo) {
              game.aoeZones.push(new AOEZone({
                x: ex, y: ey, radius: baseRadius * 0.85, duration: 2.0, damage: finalDmg * 0.25, type: "resignation_pool"
              }));
            }
          }
        }));
      }
    }
  }

  updateHeadphones(dt, game) {
    const isEvo = !!this.evolvedWeapons.headphones;
    const lvl = this.weapons.headphones;
    let baseInterval = isEvo ? 1.4 : 2.0;
    if (lvl >= 3 && !isEvo) baseInterval *= 0.85;
    const interval = baseInterval / this.getAttackSpeedMult();

    this.headphonesTimer += dt;
    if (this.headphonesTimer >= interval) {
      this.headphonesTimer = 0;
      let baseDmg = 24;
      if (lvl >= 2) baseDmg *= 1.18;
      if (lvl >= 5) baseDmg *= 1.25;
      if (isEvo) baseDmg *= 1.50;
      const finalDmg = baseDmg * this.getDamageMultiplier();

      let radius = (isEvo ? (4.2 * M_TO_PX) : (2.2 * M_TO_PX)) * this.getAoERangeMult();
      sound.playSonicWave(isEvo);
      game.aoeZones.push(new AOEZone({
        x: this.x, y: this.y, radius: radius, duration: 0.35, damage: finalDmg, type: "sonic_wave", isEvo: isEvo
      }));
    }
  }

  updateWaterCup(dt, game) {
    const isEvo = !!this.evolvedWeapons.water_cup;
    const lvl = this.weapons.water_cup;
    let baseInterval = 2.2;
    if (lvl >= 2) baseInterval *= 0.85;
    const interval = baseInterval / this.getAttackSpeedMult();

    this.waterCupTimer += dt;
    if (this.waterCupTimer >= interval) {
      this.waterCupTimer = 0;
      let count = 1;
      if (lvl >= 3) count = 2;
      if (lvl >= 5) count = 3;
      if (isEvo) count = 3;

      let baseDmg = 15;
      if (lvl >= 4) baseDmg *= 1.30;
      if (isEvo) baseDmg *= 1.60;
      const finalDmg = baseDmg * this.getDamageMultiplier();
      let radius = 1.8 * M_TO_PX * this.getAoERangeMult();

      const targets = game.getTopClusterTargets(8.5 * M_TO_PX, count);
      for (let i = 0; i < count; i++) {
        let tx = this.x + (Math.random() - 0.5) * 160;
        let ty = this.y + (Math.random() - 0.5) * 160;
        if (targets[i]) {
          tx = targets[i].x;
          ty = targets[i].y;
        }

        game.projectiles.push(new Projectile({
          x: this.x, y: this.y, targetX: tx, targetY: ty, damage: finalDmg, type: "water_cup_lob", isEvo: isEvo,
          onExplode: (ex, ey) => {
            sound.playCupShatter(isEvo);
            game.aoeZones.push(new AOEZone({
              x: ex, y: ey, radius: radius, duration: isEvo ? 3.5 : 2.0, damage: finalDmg, type: "water_puddle", slowPct: 0.30, isEvo: isEvo
            }));
          }
        }));
      }
    }
  }

  updateChargingCable(dt, game) {
    const isEvo = !!this.evolvedWeapons.charging_cable;
    const lvl = this.weapons.charging_cable;
    let baseInterval = isEvo ? 0.7 : 1.0;
    if (lvl >= 4 && !isEvo) baseInterval *= 0.82;
    const interval = baseInterval / this.getAttackSpeedMult();

    this.chargingCableTimer += dt;
    if (this.chargingCableTimer >= interval) {
      this.chargingCableTimer = 0;
      let baseDmg = 34;
      if (lvl >= 2) baseDmg *= 1.20;
      if (lvl >= 5) baseDmg *= 1.30;
      if (isEvo) baseDmg *= 1.60;
      const finalDmg = baseDmg * this.getDamageMultiplier();

      let range = 2.4 * M_TO_PX * this.getAoERangeMult();
      if (lvl >= 2) range *= 1.20;
      if (isEvo) range *= 1.40;

      const target = game.getOptimalTarget(range + 40, 100) || game.getNearestEnemy(this.x, this.y, range + 40);
      const baseAngle = target ? Math.atan2(target.y - this.y, target.x - this.x) : Math.atan2(this.faceY, this.faceX);
      const isFull = (lvl >= 5 || isEvo);

      sound.playElectricWhip(isEvo);
      game.aoeZones.push(new AOEZone({
        x: this.x, y: this.y, radius: range, duration: 0.2, damage: finalDmg, type: "electric_whip",
        angle: baseAngle, arc: isFull ? (Math.PI * 2) : (140 * Math.PI / 180), isEvo: isEvo
      }));
    }
  }

  updateChair(dt, game) {
    const isEvo = !!this.evolvedWeapons.chair;
    const lvl = this.weapons.chair;
    let baseInterval = isEvo ? 2.8 : (lvl >= 3 ? 4.0 : 5.0);
    const interval = baseInterval / this.getAttackSpeedMult();

    this.chairTimer += dt;
    if (this.chairTimer >= interval) {
      this.chairTimer = 0;
      let baseDmg = isEvo ? 120 : 45;
      if (lvl >= 2 && !isEvo) baseDmg *= 1.25;
      if (lvl >= 4 && !isEvo) baseDmg *= 1.25;
      const finalDmg = baseDmg * this.getDamageMultiplier();

      let radius = (isEvo ? (4.2 * M_TO_PX) : (2.8 * M_TO_PX)) * this.getAoERangeMult();
      if (lvl >= 2 && !isEvo) radius *= 1.15;
      if (lvl >= 5 && !isEvo) radius *= 1.20;

      const sweetMult = isEvo ? 2.5 : (lvl >= 4 ? 2.0 : 1.7);
      sound.playChairSpin(isEvo);

      game.aoeZones.push(new AOEZone({
        x: this.x, y: this.y, radius: radius, duration: 0.35, damage: finalDmg, type: "chair_spin",
        sweetSpotMult: sweetMult, isEvo: isEvo
      }));

      if (lvl >= 5 || isEvo) {
        setTimeout(() => {
          if (this.alive) {
            sound.playChairSpin(isEvo);
            game.aoeZones.push(new AOEZone({
              x: this.x, y: this.y, radius: radius * 1.1, duration: 0.35, damage: finalDmg * 0.85, type: "chair_spin",
              sweetSpotMult: sweetMult, isEvo: isEvo
            }));
          }
        }, 180);
      }
    }
  }

  updateAcFreeze(dt, game) {
    const lvl = this.weapons.ac_freeze;
    let baseInterval = 2.5;
    if (lvl >= 2) baseInterval *= 0.85;
    const interval = baseInterval / this.getAttackSpeedMult();

    this.acFreezeTimer += dt;
    if (this.acFreezeTimer >= interval) {
      this.acFreezeTimer = 0;
      let baseDmg = 20;
      if (lvl >= 3) baseDmg *= 1.25;
      const finalDmg = baseDmg * this.getDamageMultiplier();

      let range = 5.5 * M_TO_PX * this.getAoERangeMult();
      if (lvl >= 2) range *= 1.20;

      const freezeDur = lvl >= 5 ? 1.6 : (lvl >= 3 ? 1.3 : 1.0);
      const arc = (lvl >= 4 ? 140 : 90) * (Math.PI / 180);

      const target = game.getOptimalTarget(range, 120) || game.getNearestEnemy(this.x, this.y, range);
      const angle = target ? Math.atan2(target.y - this.y, target.x - this.x) : Math.atan2(this.faceY, this.faceX);

      sound.playAcFreeze();
      game.aoeZones.push(new AOEZone({
        x: this.x, y: this.y, radius: range, duration: 0.35, damage: finalDmg, type: "ac_freeze_cone",
        angle: angle, arc: arc, freezeDuration: freezeDur
      }));
    }
  }

  updateAcHeat(dt, game) {
    const lvl = this.weapons.ac_heat;
    let baseInterval = 2.5;
    if (lvl >= 3) baseInterval *= 0.85;
    const interval = baseInterval / this.getAttackSpeedMult();

    this.acHeatTimer += dt;
    if (this.acHeatTimer >= interval) {
      this.acHeatTimer = 0;
      let baseDmg = 50;
      if (lvl >= 2) baseDmg *= 1.25;
      if (lvl >= 5) baseDmg *= 1.30;
      const finalDmg = baseDmg * this.getDamageMultiplier();

      let range = 5.5 * M_TO_PX * this.getAoERangeMult();
      if (lvl >= 4) range *= 1.25;

      const burnDur = lvl >= 3 ? 4.0 : 3.0;
      const burnDps = (lvl >= 2 ? 38 : 30) * this.getDamageMultiplier();
      const arc = 90 * (Math.PI / 180);

      const target = game.getOptimalTarget(range, 120) || game.getNearestEnemy(this.x, this.y, range);
      const angle = target ? Math.atan2(target.y - this.y, target.x - this.x) : Math.atan2(this.faceY, this.faceX);

      sound.playAcHeat();
      game.aoeZones.push(new AOEZone({
        x: this.x, y: this.y, radius: range, duration: 0.35, damage: finalDmg, type: "ac_heat_cone",
        angle: angle, arc: arc, burnDuration: burnDur, burnDps: burnDps
      }));
    }
  }

  updateAcFusion(dt, game) {
    const interval = 3.2 / this.getAttackSpeedMult();
    this.acFusionTimer += dt;
    if (this.acFusionTimer >= interval) {
      this.acFusionTimer = 0;
      const target = game.getOptimalTarget(10 * M_TO_PX, 150) || game.getNearestEnemy(this.x, this.y, 10 * M_TO_PX);
      if (target) {
        const finalDmg = 150 * this.getDamageMultiplier();
        const blastRadius = 4.5 * M_TO_PX * this.getAoERangeMult();

        sound.playAcExplosion();
        game.addFloatingText(target.x, target.y - 40, "💥 冰火两重天核爆！", "#38bdf8", 18);
        game.aoeZones.push(new AOEZone({
          x: target.x, y: target.y, radius: blastRadius, duration: 0.5, damage: finalDmg, type: "ac_fusion_blast"
        }));
      }
    }
  }

  takeDamage(amount, sourceEnemy, game, isBossSkill = false) {
    if (!this.alive || this.invulnerableTimer > 0 || this.paidPoopInvulnTimer > 0) return;

    if (this.shieldReady) {
      this.shieldReady = false;
      this.shieldTimer = 0;
      this.invulnerableTimer = 0.3;
      game.addFloatingText(this.x, this.y - 25, "🛡️ 护盾抵挡！", "#38bdf8", 14);
      return;
    }

    let actualDamage = amount;
    if (this.artifacts.work_badge && sourceEnemy && (sourceEnemy.isElite || sourceEnemy.isBoss)) {
      actualDamage *= 0.80;
    }

    this.hp -= actualDamage;
    this.invulnerableTimer = PLAYER_BASE.hurtInvulnTime;
    this.lastHurtTime = Date.now();
    sound.playHurt();
    this.hitAnimTimer = 0.34;
    this.damageMoveBuffTimer = 1.2;
    game.addDamageNumber(this.x, this.y, actualDamage, false, true);

    let pressureGain = (sourceEnemy && sourceEnemy.isBoss) ? 12 : ((sourceEnemy && sourceEnemy.isElite) ? 8 : 5);
    this.addPressure(pressureGain, game);

    if (this.hp <= 0) {
      if (this.artifacts.resignation_cert && !this.revivedOnce) {
        this.revivedOnce = true;
        this.hp = this.maxHp * 0.5;
        this.invulnerableTimer = 2.5;
        sound.playVictory();
        game.addFloatingText(this.x, this.y - 40, "📜 离职证明：免疫死亡复活！", "#fbbf24", 20);
        return;
      }
      this.die(game);
    }
  }

  performDodge(game) {
    if (this.dodgeCooldownTimer > 0 || !this.alive) return;
    this.dodgeCooldownTimer = PLAYER_BASE.dodgeCd;
    if (this.skills.elevator_dash) {
      this.dodgeCooldownTimer *= (1 - SKILLS.elevator_dash.dodgeCdReduc[this.skills.elevator_dash - 1]);
    }
    this.dodgeTimer = PLAYER_BASE.dodgeDuration;
    this.invulnerableTimer = PLAYER_BASE.dodgeDuration + 0.08;
    this.speedMult = 2.4;
    this.dodgeAttackBuffTimer = 1.5;
    sound.playDodge();
  }

  performActiveSkill(game) {
    if (this.activeSkillCdTimer > 0 || !this.alive) return;
    this.activeSkillCdTimer = this.activeSkillCd;
    this.activeSkillDurationTimer = 3.5;
    this.triggerAttack(0.55);
    sound.playSonicWave(true);
    game.addFloatingText(this.x, this.y - 40, `🔥 ${this.charConf.name}：职业爆发！`, "#fbbf24", 20);

    if (this.characterId === "awei") {
      game.enemies.forEach(e => {
        if (e.alive) {
          if (e.applyFreeze) e.applyFreeze(3.0, game);
          e.takeDamage(130, true, game);
        }
      });
    } else if (this.characterId === "lili") {
      game.aoeZones.push(new AOEZone({
        x: this.x, y: this.y, radius: 4.5 * M_TO_PX, duration: 4.0, damage: 60, type: "chair_spin", sweetSpotMult: 2.0
      }));
    } else if (this.characterId === "xiaozhang") {
      this.paidPoopInvulnTimer = 3.0;
      this.speedMult = 2.2;
    } else if (this.characterId === "horn_mecha") {
      this.activeSkillDurationTimer = 0.9;
      this.invulnerableTimer = Math.max(this.invulnerableTimer, 0.9);
      this.speedMult = 2.6;
      game.aoeZones.push(new AOEZone({ x: this.x, y: this.y, radius: 3.1 * M_TO_PX, duration: 0.35, damage: 95 * this.getDamageMultiplier(), type: "chair_spin", sweetSpotMult: 1.9, isEvo: false }));
      game.addFloatingText(this.x, this.y - 58, "🦄 角虎机动冲击！", "#a855f7", 18);
    }
  }

  die(game) {
    this.alive = false;
    this.deathAnimElapsed = 1.0;
    this.hitAnimTimer = 0;
    this.attackAnimTimer = 0;
    sound.playCollapseAlarm();
    game.triggerGameOver();
  }

  drawDefault(ctx) {
    ctx.save();
    if (this.invulnerableTimer > 0 && Math.floor(Date.now() / 80) % 2 === 0) { ctx.globalAlpha = 0.5; }
    if (this.shieldReady) {
      ctx.strokeStyle = "#38bdf8";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius + 6, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.fillStyle = this.isCollapsed ? "#dc2626" : (this.characterId === "awei" ? "#0284c7" : (this.characterId === "lili" ? "#ec4899" : (this.characterId === "xiaozhang" ? "#eab308" : "#3b82f6")));
    ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 2; ctx.stroke();
    ctx.font = "16px Arial"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(this.charConf.avatar, this.x, this.y);
    if (this.weapons.mug) {
      const isEvo = !!this.evolvedWeapons.mug;
      const count = isEvo ? 4 : (this.weapons.mug >= 5 ? 3 : (this.weapons.mug >= 3 ? 2 : 1));
      const radius = 2.2 * M_TO_PX * this.getAoERangeMult();
      for (let i = 0; i < count; i++) {
        const angle = this.mugAngle + (i * (Math.PI * 2 / count));
        const mx = this.x + Math.cos(angle) * radius;
        const my = this.y + Math.sin(angle) * radius;
        ctx.font = isEvo ? "20px Arial" : "16px Arial";
        ctx.fillText(isEvo ? "☕" : "🥛", mx, my);
      }
    }
    ctx.restore();
  }

  drawHornMecha(ctx) {
    ctx.save();
    if (this.invulnerableTimer > 0 && Math.floor(Date.now() / 80) % 2 === 0) { ctx.globalAlpha = 0.55; }
    ctx.fillStyle = "rgba(0,0,0,0.28)";
    ctx.beginPath(); ctx.ellipse(this.x, this.y + 5, 26, 10, 0, 0, Math.PI * 2); ctx.fill();
    if (this.shieldReady) {
      ctx.strokeStyle = "#38bdf8";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(this.x, this.y - 10, this.radius + 18, 0, Math.PI * 2);
      ctx.stroke();
    }
    let state = "idle";
    if (!this.alive) state = "death"; else if (this.hitAnimTimer > 0) state = "hit"; else if (this.dodgeTimer > 0) state = "dodge"; else if (this.attackAnimTimer > 0 || this.activeSkillDurationTimer > 0.01) state = "attack"; else if (this.isMoving) state = "run";
    const meta = HORN_MECHA_ANIMS[state];
    const img = getHornMechaImage(meta.src);
    const row = Math.max(0, HORN_MECHA_DIR_ORDER.indexOf(this.renderDirection));
    const sheetW = img.naturalWidth || img.width || meta.cols;
    const sheetH = img.naturalHeight || img.height || meta.rows;
    let timer = this.animTime;
    if (state === "attack") timer = Math.max(0, 0.55 - this.attackAnimTimer);
    if (state === "hit") timer = Math.max(0, 0.34 - this.hitAnimTimer);
    if (state === "dodge") timer = Math.max(0, PLAYER_BASE.dodgeDuration - this.dodgeTimer);
    if (state === "death") timer = this.deathAnimElapsed;
    let frame = Math.floor(timer * meta.fps);
    if (meta.loop) frame = frame % meta.cols; else frame = Math.min(meta.cols - 1, frame);
    const sx0 = Math.round(frame * sheetW / meta.cols);
    const sx1 = Math.round((frame + 1) * sheetW / meta.cols);
    const sy0 = Math.round(row * sheetH / meta.rows);
    const sy1 = Math.round((row + 1) * sheetH / meta.rows);
    const drawW = 72, drawH = 72, dx = this.x - drawW / 2, dy = this.y - drawH * 0.82;
    if (img.complete && sheetW > 0 && sheetH > 0) {
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(img, sx0, sy0, sx1 - sx0, sy1 - sy0, dx, dy, drawW, drawH);
    } else { ctx.restore(); this.drawDefault(ctx); return; }
    if (this.weapons.mug) {
      const isEvo = !!this.evolvedWeapons.mug;
      const count = isEvo ? 4 : (this.weapons.mug >= 5 ? 3 : (this.weapons.mug >= 3 ? 2 : 1));
      const radius = 2.2 * M_TO_PX * this.getAoERangeMult();
      for (let i = 0; i < count; i++) {
        const angle = this.mugAngle + (i * (Math.PI * 2 / count));
        const mx = this.x + Math.cos(angle) * radius;
        const my = this.y + Math.sin(angle) * radius;
        ctx.font = isEvo ? "20px Arial" : "16px Arial";
        ctx.fillText(isEvo ? "☕" : "🥛", mx, my);
      }
    }
    ctx.restore();
  }

  draw(ctx) { if (this.characterId === "horn_mecha") this.drawHornMecha(ctx); else this.drawDefault(ctx); }
}

// 敌人类
export class Enemy {
  constructor(typeId, x, y, hpMult = 1.0, dmgMult = 1.0) {
    this.conf = NORMAL_ENEMIES[typeId] || NORMAL_ENEMIES.zombie_colleague;
    this.typeId = typeId;
    this.x = x;
    this.y = y;
    this.maxHp = this.conf.hp * hpMult;
    this.hp = this.maxHp;
    this.damage = this.conf.damage * dmgMult;
    this.baseSpeed = this.conf.speed;
    this.speed = this.baseSpeed;
    this.size = this.conf.size;
    this.radius = this.conf.size;
    this.color = this.conf.color;
    this.icon = this.conf.icon;
    this.alive = true;
    this.isElite = false;
    this.isBoss = false;

    this.freezeTimer = 0;
    this.burnTimer = 0;
    this.burnDps = 0;
    this.burnTickTimer = 0;
    this.attackTimer = 0;
    this.lastContactDmgTime = 0;
  }

  update(dt, player, game) {
    if (!this.alive) return;

    if (this.freezeTimer > 0) {
      this.freezeTimer -= dt;
      return;
    }

    if (this.burnTimer > 0) {
      this.burnTimer -= dt;
      this.burnTickTimer += dt;
      if (this.burnTickTimer >= 0.5) {
        this.burnTickTimer = 0;
        this.takeDamage(this.burnDps * 0.5, false, game);
        game.particles.push(new Particle(this.x, this.y, (Math.random() - 0.5) * 40, -30, "#f97316", 3, 0.25, "fire"));
      }
    }

    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const dist = Math.hypot(dx, dy) || 1;

    if (this.conf.attackType === "ranged" && this.conf.keepDistance) {
      if (dist < this.conf.keepDistance - 20) {
        this.x -= (dx / dist) * this.speed * dt;
        this.y -= (dy / dist) * this.speed * dt;
      } else if (dist > this.conf.keepDistance + 20) {
        this.x += (dx / dist) * this.speed * dt;
        this.y += (dy / dist) * this.speed * dt;
      }
      this.attackTimer += dt;
      if (this.attackTimer >= this.conf.attackInterval) {
        this.attackTimer = 0;
        const angle = Math.atan2(dy, dx);
        game.projectiles.push(new Projectile({
          x: this.x, y: this.y,
          vx: Math.cos(angle) * this.conf.bulletSpeed, vy: Math.sin(angle) * this.conf.bulletSpeed,
          damage: this.conf.bulletDamage, radius: 6, isEnemy: true, type: "mail_bullet"
        }));
      }
    } else {
      this.x += (dx / dist) * this.speed * dt;
      this.y += (dy / dist) * this.speed * dt;
    }

    if (dist <= this.radius + player.radius) {
      const now = Date.now();
      if (now - this.lastContactDmgTime >= PLAYER_BASE.contactDmgCd * 1000) {
        this.lastContactDmgTime = now;
        player.takeDamage(this.damage, this, game);
      }
    }
  }

  applyFreeze(duration, game) {
    this.freezeTimer = Math.max(this.freezeTimer, duration);
    game.addFloatingText(this.x, this.y - 15, "❄️ 冻结!", "#38bdf8", 12);
  }

  applyBurn(duration, dps, game) {
    this.burnTimer = Math.max(this.burnTimer, duration);
    this.burnDps = Math.max(this.burnDps, dps);
  }

  takeDamage(amount, isCrit, game, knockback = null) {
    if (!this.alive) return;
    this.hp -= amount;
    game.addDamageNumber(this.x, this.y, amount, isCrit);

    if (knockback) {
      const kdx = this.x - knockback.x;
      const kdy = this.y - knockback.y;
      const kdist = Math.hypot(kdx, kdy) || 1;
      this.x += (kdx / kdist) * knockback.force * 0.05;
      this.y += (kdy / kdist) * knockback.force * 0.05;
    }

    if (this.hp <= 0) {
      this.die(game);
    }
  }

  die(game) {
    this.alive = false;
    game.director.recentKills++;
    game.kills++;

    if (this.conf.splitOnDeath) {
      for (let i = 0; i < this.conf.splitOnDeath.count; i++) {
        if (game.enemies.length < 100) game.enemies.push(new Enemy(this.conf.splitOnDeath.id || "paper_scrap", this.x + (i * 20 - 10), this.y));
      }
    }

    const xpVal = this.conf.xpDrop || 1;
    game.drops.push(new DropItem(this.x, this.y, "xp", xpVal));
    if (Math.random() < 0.04) {
      game.drops.push(new DropItem(this.x, this.y, "coffee"));
    }
  }

  draw(ctx) {
    ctx.save();
    ctx.fillStyle = this.freezeTimer > 0 ? "#67e8f9" : (this.burnTimer > 0 ? "#f97316" : this.color);
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.font = `${this.size * 1.2}px Arial`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(this.icon, this.x, this.y);

    if (this.freezeTimer > 0) {
      ctx.fillText("❄️", this.x, this.y - 12);
    } else if (this.burnTimer > 0) {
      ctx.fillText("🔥", this.x, this.y - 12);
    }
    ctx.restore();
  }
}

// 精英怪类
export class Elite extends Enemy {
  constructor(typeId, x, y) {
    super(typeId, x, y);
    this.conf = ELITES[typeId] || ELITES.hr;
    this.isElite = true;
    this.name = this.conf.name;
    this.maxHp = this.conf.hp;
    this.hp = this.maxHp;
    this.damage = this.conf.damage;
    this.radius = this.conf.size;
    this.size = this.conf.size;
    this.color = this.conf.color;
    this.icon = this.conf.icon;
  }

  die(game) {
    this.alive = false;
    game.director.recentKills += 5;
    game.kills++;
    sound.playExplosion(true);
    game.drops.push(new DropItem(this.x, this.y, "xp", this.conf.xpDrop || 50));
    game.drops.push(new DropItem(this.x, this.y, "artifact_chest"));
    game.addFloatingText(this.x, this.y - 30, `🎉 击败精英【${this.name}】！获得神器宝箱！`, "#fbbf24", 18);
  }
}

// 基础Boss类 (支持全状态机、冰冻抗性与持续灼烧)
export class BaseBoss {
  constructor(x, y, conf) {
    this.conf = conf;
    this.name = conf.name;
    this.x = x;
    this.y = y;
    this.maxHp = conf.hp;
    this.hp = this.maxHp;
    this.damage = conf.damage;
    this.dmgReduction = conf.dmgReduction || 0.15;
    this.speed = conf.speed || (1.4 * M_TO_PX);
    this.radius = conf.size || 38;
    this.size = this.radius;
    this.color = conf.color || "#dc2626";
    this.icon = conf.icon || "👹";
    this.isBoss = true;
    this.alive = true;
    this.currentPhase = 1;
    this.phaseEntered = { p2: false, p3: false };
    this.actionTimer = 0;
    this.lastContactDmgTime = 0;

    this.freezeTimer = 0;
    this.burnTimer = 0;
    this.burnDps = 0;
    this.burnTickTimer = 0;
  }

  applyFreeze(duration, game) {
    this.freezeTimer = Math.max(this.freezeTimer, duration * 0.5);
    game.addFloatingText(this.x, this.y - 30, "❄️ 寒气减速!", "#38bdf8", 14);
  }

  applyBurn(duration, dps, game) {
    this.burnTimer = Math.max(this.burnTimer, duration);
    this.burnDps = Math.max(this.burnDps, dps);
  }

  updateStatus(dt, game) {
    if (this.freezeTimer > 0) {
      this.freezeTimer -= dt;
    }
    if (this.burnTimer > 0) {
      this.burnTimer -= dt;
      this.burnTickTimer += dt;
      if (this.burnTickTimer >= 0.5) {
        this.burnTickTimer = 0;
        this.takeDamage(this.burnDps * 0.5, false, game);
        game.particles.push(new Particle(this.x, this.y, (Math.random() - 0.5) * 50, -35, "#f97316", 4, 0.3, "fire"));
      }
    }
  }

  takeDamage(amount, isCrit, game) {
    if (!this.alive) return;
    const actual = amount * (1 - this.dmgReduction);
    this.hp -= actual;
    game.addDamageNumber(this.x, this.y, actual, isCrit);
    if (this.hp <= 0) this.die(game);
  }

  die(game) {
    this.alive = false;
    game.triggerSlowMotion(0.4, 0.25);
    game.projectiles = game.projectiles.filter(p => !p.isEnemy);
    game.drops.push(new DropItem(this.x, this.y, 'punch_card'));
    sound.playVictory();
    game.addFloatingText(this.x, this.y - 45, `🎉 ${this.name} 被击溃！打卡下班！`, "#fbbf24", 24);
  }

  draw(ctx) {
    ctx.save();
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 20;
    ctx.fillStyle = this.freezeTimer > 0 ? "#67e8f9" : (this.burnTimer > 0 ? "#f97316" : this.color);
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.font = `${this.radius * 1.3}px Arial`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(this.icon, this.x, this.y);

    if (this.freezeTimer > 0) {
      ctx.fillText("❄️", this.x, this.y - 20);
    } else if (this.burnTimer > 0) {
      ctx.fillText("🔥", this.x, this.y - 20);
    }

    const mapW = ctx.canvas.width;
    ctx.fillStyle = "rgba(0,0,0,0.75)";
    ctx.fillRect(mapW / 2 - 160, 46, 320, 16);
    ctx.fillStyle = this.color;
    ctx.fillRect(mapW / 2 - 160, 46, Math.max(0, 320 * (this.hp / this.maxHp)), 16);
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(mapW / 2 - 160, 46, 320, 16);

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 12px Arial";
    ctx.textAlign = "center";
    ctx.fillText(`【${this.conf.title || 'Boss'}】${this.name} (${Math.round(this.hp)}/${this.maxHp}) - P${this.currentPhase}`, mapW / 2, 40);
    ctx.restore();
  }
}

// 1. 部门主管
export class SupervisorBoss extends BaseBoss {
  constructor(x, y, conf) {
    super(x, y, conf || STAGES_CONFIG.stage_1.boss);
  }

  update(dt, player, game) {
    if (!this.alive) return;
    this.updateStatus(dt, game);

    const hpPct = this.hp / this.maxHp;
    if (hpPct <= 0.35 && !this.phaseEntered.p3) {
      this.currentPhase = 3;
      this.phaseEntered.p3 = true;
      game.addFloatingText(this.x, this.y - 40, "P3：今晚全员加个通宵！", "#dc2626", 22);
      sound.playBossWarning();
    } else if (hpPct <= 0.70 && !this.phaseEntered.p2) {
      this.currentPhase = 2;
      this.phaseEntered.p2 = true;
      game.addFloatingText(this.x, this.y - 40, "P2：大家拉个紧急对齐会！", "#a855f7", 20);
      sound.playBossWarning();
    }

    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const dist = Math.hypot(dx, dy) || 1;
    const spd = this.speed * (this.currentPhase === 3 ? 1.25 : 1.0) * (this.freezeTimer > 0 ? 0.5 : 1.0);
    this.x += (dx / dist) * spd * dt;
    this.y += (dy / dist) * spd * dt;

    this.actionTimer += dt;
    if (this.actionTimer >= (this.currentPhase === 3 ? 3.2 : 4.5)) {
      this.actionTimer = 0;
      this.castSkill(player, game);
    }

    if (dist <= this.radius + player.radius) {
      const now = Date.now();
      if (now - this.lastContactDmgTime >= PLAYER_BASE.contactDmgCd * 1000) {
        this.lastContactDmgTime = now;
        player.takeDamage(this.damage, this, game);
      }
    }
  }

  castSkill(player, game) {
    const r = Math.random();
    if (r < 0.5) {
      game.addFloatingText(this.x, this.y - 30, "📄 汇报进度文件雨！", "#ef4444", 16);
      for (let i = 0; i < 5; i++) {
        setTimeout(() => {
          if (this.alive && player.alive) {
            game.aoeZones.push(new AOEZone({
              x: player.x, y: player.y, radius: 1.4 * M_TO_PX, duration: 0.7, type: "boss_warning_circle",
              onComplete: () => {
                sound.playExplosion(false);
                if (Math.hypot(player.x - this.x, player.y - this.y) <= 1.4 * M_TO_PX + player.radius) {
                  player.takeDamage(this.damage * 0.9, this, game, true);
                }
              }
            }));
          }
        }, i * 220);
      }
    } else {
      game.addFloatingText(this.x, this.y - 30, "💣 紧急需求连发！", "#f59e0b", 16);
      for (let i = 0; i < 4; i++) {
        const angle = (i * Math.PI * 2) / 4;
        game.enemies.push(new Enemy("demand_ball", this.x + Math.cos(angle) * 50, this.y + Math.sin(angle) * 50));
      }
    }
  }
}

// 2. 新增Boss：刁难的客户
export class DemandingClientBoss extends BaseBoss {
  constructor(x, y, conf) {
    super(x, y, conf || STAGES_CONFIG.stage_3.boss);
  }

  update(dt, player, game) {
    if (!this.alive) return;
    this.updateStatus(dt, game);

    const hpPct = this.hp / this.maxHp;
    if (hpPct <= 0.35 && !this.phaseEntered.p3) {
      this.currentPhase = 3;
      this.phaseEntered.p3 = true;
      game.addFloatingText(this.x, this.y - 45, "P3：必须改回第一版！！", "#ec4899", 22);
      sound.playBossWarning();
    } else if (hpPct <= 0.70 && !this.phaseEntered.p2) {
      this.currentPhase = 2;
      this.phaseEntered.p2 = true;
      game.addFloatingText(this.x, this.y - 45, "P2：给我五彩斑斓的黑！", "#f43f5e", 20);
      sound.playBossWarning();
    }

    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const dist = Math.hypot(dx, dy) || 1;
    const spd = this.speed * (this.freezeTimer > 0 ? 0.5 : 1.0);
    this.x += (dx / dist) * spd * dt;
    this.y += (dy / dist) * spd * dt;

    this.actionTimer += dt;
    if (this.actionTimer >= (this.currentPhase === 3 ? 3.0 : 4.2)) {
      this.actionTimer = 0;
      this.castClientSkill(player, game);
    }

    if (dist <= this.radius + player.radius) {
      const now = Date.now();
      if (now - this.lastContactDmgTime >= PLAYER_BASE.contactDmgCd * 1000) {
        this.lastContactDmgTime = now;
        player.takeDamage(this.damage, this, game);
      }
    }
  }

  castClientSkill(player, game) {
    const r = Math.random();
    if (r < 0.35) {
      game.addFloatingText(this.x, this.y - 30, "🚫 需求红线封锁禁区！", "#ef4444", 16);
      sound.playBossTerrain();
      const pX = player.x;
      const pY = player.y;
      game.aoeZones.push(new AOEZone({
        x: pX, y: pY, duration: 6.0, type: "demand_red_line", damage: 16,
        lineStartX: pX - 220, lineStartY: pY - 80, lineEndX: pX + 220, lineEndY: pY - 80
      }));
      game.aoeZones.push(new AOEZone({
        x: pX, y: pY, duration: 6.0, type: "demand_red_line", damage: 16,
        lineStartX: pX - 220, lineStartY: pY + 80, lineEndX: pX + 220, lineEndY: pY + 80
      }));
    } else if (r < 0.70) {
      game.addFloatingText(this.x, this.y - 30, "📑 砸下3座巨型合同柱！", "#ec4899", 16);
      sound.playBossTerrain();
      for (let i = 0; i < 3; i++) {
        const angle = (i * Math.PI * 2) / 3;
        const dist = 110 + Math.random() * 60;
        const ox = Math.max(40, Math.min(game.mapWidth - 40, player.x + Math.cos(angle) * dist));
        const oy = Math.max(40, Math.min(game.mapHeight - 40, player.y + Math.sin(angle) * dist));
        game.obstacles.push(new TerrainObstacle({
          x: ox, y: oy, hp: 80, name: "巨型合同公文柱", icon: "📑", color: "#ec4899"
        }));
      }
    } else {
      game.addFloatingText(this.x, this.y - 30, "🌀 方案打回！全部重做！", "#a855f7", 17);
      sound.playSonicWave(true);
      game.aoeZones.push(new AOEZone({
        x: this.x, y: this.y, radius: 6.0 * M_TO_PX, duration: 3.5, type: "vortex_pull"
      }));
      for (let i = 0; i < 8; i++) {
        const angle = (i * Math.PI * 2) / 8;
        game.projectiles.push(new Projectile({
          x: this.x, y: this.y,
          vx: Math.cos(angle) * 180, vy: Math.sin(angle) * 180,
          damage: this.damage * 0.75, radius: 8, isEnemy: true, type: "client_stamp_bullet"
        }));
      }
    }
  }
}

// 3. 新增Boss：骚扰电话
export class HarassmentCallBoss extends BaseBoss {
  constructor(x, y, conf) {
    super(x, y, conf || STAGES_CONFIG.stage_4.boss);
  }

  update(dt, player, game) {
    if (!this.alive) return;
    this.updateStatus(dt, game);

    const hpPct = this.hp / this.maxHp;
    if (hpPct <= 0.35 && !this.phaseEntered.p3) {
      this.currentPhase = 3;
      this.phaseEntered.p3 = true;
      game.addFloatingText(this.x, this.y - 45, "P3：全员夺命连环Call！！", "#06b6d4", 22);
      sound.playBossWarning();
    } else if (hpPct <= 0.70 && !this.phaseEntered.p2) {
      this.currentPhase = 2;
      this.phaseEntered.p2 = true;
      game.addFloatingText(this.x, this.y - 45, "P2：响铃轰炸！", "#38bdf8", 20);
      sound.playBossWarning();
    }

    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const dist = Math.hypot(dx, dy) || 1;
    const spd = this.speed * (this.freezeTimer > 0 ? 0.5 : 1.0);
    this.x += (dx / dist) * spd * dt;
    this.y += (dy / dist) * spd * dt;

    this.actionTimer += dt;
    if (this.actionTimer >= (this.currentPhase === 3 ? 2.8 : 3.8)) {
      this.actionTimer = 0;
      this.castCallSkill(player, game);
    }

    if (dist <= this.radius + player.radius) {
      const now = Date.now();
      if (now - this.lastContactDmgTime >= PLAYER_BASE.contactDmgCd * 1000) {
        this.lastContactDmgTime = now;
        player.takeDamage(this.damage, this, game);
      }
    }
  }

  castCallSkill(player, game) {
    const r = Math.random();
    if (r < 0.4) {
      game.addFloatingText(this.x, this.y - 30, "📞 植入响铃分机！", "#06b6d4", 16);
      sound.playBossTerrain();
      for (let i = 0; i < 2; i++) {
        const angle = (i * Math.PI) + (Math.random() - 0.5);
        const ox = Math.max(40, Math.min(game.mapWidth - 40, player.x + Math.cos(angle) * 140));
        const oy = Math.max(40, Math.min(game.mapHeight - 40, player.y + Math.sin(angle) * 140));
        game.obstacles.push(new TerrainObstacle({
          x: ox, y: oy, hp: 60, type: "phone_tower", name: "响铃分机", icon: "📞", color: "#06b6d4"
        }));
      }
    } else if (r < 0.75) {
      game.addFloatingText(this.x, this.y - 30, "🔔 夺命连环追踪弹！", "#38bdf8", 16);
      for (let wave = 0; wave < 4; wave++) {
        setTimeout(() => {
          if (this.alive && player.alive) {
            const angle = Math.atan2(player.y - this.y, player.x - this.x) + (Math.random() - 0.5) * 0.4;
            game.projectiles.push(new Projectile({
              x: this.x, y: this.y,
              vx: Math.cos(angle) * 260, vy: Math.sin(angle) * 260,
              damage: this.damage * 0.7, radius: 8, isEnemy: true, tracking: true, type: "call_bullet"
            }));
          }
        }, wave * 160);
      }
    } else {
      game.addFloatingText(this.x, this.y - 30, "⚡ EMP信号全场过载！", "#eab308", 18);
      sound.playElectricWhip(true);
      game.aoeZones.push(new AOEZone({
        x: this.x, y: this.y, radius: 8.0 * M_TO_PX, duration: 0.6, damage: this.damage * 0.8, type: "sonic_wave", isEvo: true
      }));
      for (let i = 0; i < 4; i++) {
        game.enemies.push(new Enemy("red_dot", this.x + (Math.random() - 0.5) * 60, this.y + (Math.random() - 0.5) * 60));
      }
    }
  }
}

export function createBossInstance(type, x, y, customConf = null) {
  if (type === "demanding_client" || (customConf && customConf.id === "demanding_client")) {
    return new DemandingClientBoss(x, y, customConf);
  } else if (type === "harassment_call" || (customConf && customConf.id === "harassment_call")) {
    return new HarassmentCallBoss(x, y, customConf);
  } else {
    return new SupervisorBoss(x, y, customConf);
  }
}
