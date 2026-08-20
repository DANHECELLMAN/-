// =========================================================
// 关卡节奏与刷怪导演系统 (WaveDirector V1.9 移动端高帧率优化版)
// =========================================================

import { Enemy } from './entities.js';

export class WaveDirector {
    constructor(engine) {
        this.engine = engine;
        this.gameTime = 0;
        this.spawnTimer = 0;
        this.maxMonsters = 85; // 移动端同屏硬上限，保持 60 FPS
        this.despawnRadius = 1100; // 超出视野外自动清理距离
        this.bossSpawned = false;
    }

    reset() {
        this.gameTime = 0;
        this.spawnTimer = 0;
        this.bossSpawned = false;
    }

    update(dt, player, monsters) {
        this.gameTime += dt;
        this.spawnTimer -= dt;

        // 1. 动态生成怪物
        if (this.spawnTimer <= 0) {
            if (monsters.length < this.maxMonsters) {
                this.spawnWave(player, monsters);
            }
            // 刷怪间隔随时间略微加快 (1.2s -> 0.4s)
            this.spawnTimer = Math.max(0.4, 1.2 - (this.gameTime / 180) * 0.7);
        }

        // 2. BOSS 触发 (存活满 180 秒触发大魔王)
        if (this.gameTime >= 180 && !this.bossSpawned) {
            this.bossSpawned = true;
            this.spawnBoss(player, monsters);
        }

        // 3. 回收离玩家过远的怪物，防止内存泄漏和无效运算
        for (let i = monsters.length - 1; i >= 0; i--) {
            const m = monsters[i];
            const distSq = (m.x - player.x) ** 2 + (m.y - player.y) ** 2;
            if (distSq > this.despawnRadius ** 2 && !m.isBoss) {
                monsters.splice(i, 1);
            }
        }
    }

    spawnWave(player, monsters) {
        const time = this.gameTime;
        // 随时间推移生成更高阶怪物
        let typeId = 'normal_bug';
        const rand = Math.random();

        if (time > 90 && rand < 0.15) {
            typeId = 'elite_pm';
        } else if (time > 40 && rand < 0.4) {
            typeId = 'micromanager';
        }

        // 在玩家视野外的环形边缘随机生成
        const spawnDistance = 450 + Math.random() * 120;
        const angle = Math.random() * Math.PI * 2;
        const sx = player.x + Math.cos(angle) * spawnDistance;
        const sy = player.y + Math.sin(angle) * spawnDistance;

        monsters.push(new Enemy(sx, sy, typeId));
    }

    spawnBoss(player, monsters) {
        const spawnDistance = 500;
        const angle = Math.random() * Math.PI * 2;
        const sx = player.x + Math.cos(angle) * spawnDistance;
        const sy = player.y + Math.sin(angle) * spawnDistance;

        monsters.push(new Enemy(sx, sy, 'boss_kpi'));
    }
}
