// =========================================================
// 游戏入口模块 (main.js)
// =========================================================

import { GameEngine } from './game.js';
import { TouchController } from './touch-controls.js';
import { sound } from './sound.js';

window.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('game-canvas');
    const touchLayer = document.getElementById('touch-layer');

    let selectedCharId = 'xiaochen';

    // 1. 初始化触控系统
    let engine = null;
    const touchController = new TouchController(
        touchLayer,
        (vector) => {
            if (engine && engine.player) {
                engine.player.setInput(vector.x, vector.y);
            }
        },
        (skillType) => {
            if (!engine || !engine.player) return;
            if (skillType === 'dash') {
                engine.player.triggerDash();
            } else if (skillType === 'special') {
                engine.player.triggerSpecial(engine.projectiles);
            }
        }
    );

    // 2. 实例化游戏引擎
    engine = new GameEngine(canvas, touchController);

    // 3. 角色选择事件
    const charCards = document.querySelectorAll('.char-card');
    charCards.forEach((card) => {
        card.addEventListener('pointerdown', () => {
            charCards.forEach((c) => c.classList.remove('selected'));
            card.classList.add('selected');
            selectedCharId = card.dataset.char;
            sound.init();
        });
    });

    // 4. 按钮事件绑定
    document.getElementById('btn-start').addEventListener('pointerdown', () => {
        engine.startNewGame(selectedCharId);
    });

    document.getElementById('btn-pause').addEventListener('pointerdown', () => {
        engine.pauseGame();
    });

    document.getElementById('btn-resume').addEventListener('pointerdown', () => {
        engine.resumeGame();
    });

    const restartHandler = () => {
        engine.startNewGame(selectedCharId);
    };

    document.getElementById('btn-restart').addEventListener('pointerdown', restartHandler);
    document.getElementById('btn-restart-pause').addEventListener('pointerdown', restartHandler);

    const btnSound = document.getElementById('btn-sound-toggle');
    btnSound.addEventListener('pointerdown', () => {
        const isMuted = sound.toggleMute();
        btnSound.innerText = isMuted ? '🔇' : '🔊';
    });

    // 5. 键盘操作监听 (PC 端兼容)
    const activeKeys = {};
    window.addEventListener('keydown', (e) => {
        const key = e.key.toLowerCase();
        activeKeys[key] = true;
        updatePCInput();

        if (key === ' ' || key === 'j') {
            if (engine && engine.player) engine.player.triggerDash();
        }
        if (key === 'k') {
            if (engine && engine.player) engine.player.triggerSpecial(engine.projectiles);
        }
        if (key === 'escape') {
            if (engine.state === 'PLAYING') engine.pauseGame();
            else if (engine.state === 'PAUSED') engine.resumeGame();
        }
    });

    window.addEventListener('keyup', (e) => {
        const key = e.key.toLowerCase();
        activeKeys[key] = false;
        updatePCInput();
    });

    function updatePCInput() {
        if (!engine || !engine.player) return;
        let vx = 0;
        let vy = 0;
        if (activeKeys['w'] || activeKeys['arrowup']) vy -= 1;
        if (activeKeys['s'] || activeKeys['arrowdown']) vy += 1;
        if (activeKeys['a'] || activeKeys['arrowleft']) vx -= 1;
        if (activeKeys['d'] || activeKeys['arrowright']) vx += 1;

        // 如果没有触控摇杆输入，则应用键盘输入
        if (touchController.joystickPointerId === null) {
            engine.player.setInput(vx, vy);
        }
    }
});
