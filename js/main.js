/**
 * 《今天也不想上班》- 程序启动与全平台UI事件绑定 (V1.4 升级版)
 */

import { GameEngine } from './game.js';
import { sound } from './audio.js';

window.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('game-canvas');
  const game = new GameEngine(canvas);

  // 开始游戏
  document.getElementById('btn-start-game').onclick = () => {
    game.startNewGame();
  };

  // 角色选择弹窗与关闭/返回
  const charModal = document.getElementById('character-modal');
  document.getElementById('btn-open-characters').onclick = () => {
    sound.init();
    sound.playClick();
    game.renderCharacterSelectModal();
  };
  const closeChar = () => {
    sound.playClick();
    charModal.style.display = 'none';
  };
  document.getElementById('btn-close-characters').onclick = closeChar;
  document.getElementById('btn-back-characters').onclick = closeChar;
  document.getElementById('btn-close-char-x').onclick = closeChar;

  // 关卡选择弹窗与关闭/返回
  const stageModal = document.getElementById('stage-modal');
  document.getElementById('btn-open-stages').onclick = () => {
    sound.init();
    sound.playClick();
    game.renderStageSelectModal();
  };
  const closeStage = () => {
    sound.playClick();
    stageModal.style.display = 'none';
  };
  document.getElementById('btn-close-stages').onclick = closeStage;
  document.getElementById('btn-back-stages').onclick = closeStage;
  document.getElementById('btn-close-stage-x').onclick = closeStage;

  // 局外天赋弹窗与关闭
  const talentModal = document.getElementById('talent-modal');
  document.getElementById('btn-open-talents').onclick = () => {
    sound.init();
    sound.playClick();
    game.renderTalentsModal();
  };
  const closeTalent = () => {
    sound.playClick();
    talentModal.style.display = 'none';
  };
  document.getElementById('btn-close-talents').onclick = closeTalent;
  document.getElementById('btn-close-talent-x').onclick = closeTalent;

  // 玩法指南弹窗与关闭
  const guideModal = document.getElementById('guide-modal');
  document.getElementById('btn-open-guide').onclick = () => {
    sound.init();
    sound.playClick();
    guideModal.style.display = 'flex';
  };
  const closeGuide = () => {
    sound.playClick();
    guideModal.style.display = 'none';
  };
  document.getElementById('btn-close-guide').onclick = closeGuide;
  document.getElementById('btn-close-guide-x').onclick = closeGuide;

  // 设置菜单弹窗与关闭
  const settingsModal = document.getElementById('settings-menu-modal');
  document.getElementById('btn-open-settings').onclick = () => {
    sound.init();
    sound.playClick();
    settingsModal.style.display = 'flex';
  };
  const closeSettings = () => {
    sound.playClick();
    settingsModal.style.display = 'none';
  };
  document.getElementById('btn-close-settings').onclick = closeSettings;
  document.getElementById('btn-close-settings-x').onclick = closeSettings;

  document.getElementById('btn-pause-from-settings').onclick = () => {
    settingsModal.style.display = 'none';
    game.pauseGame();
  };

  // 刷新升级选项
  document.getElementById('levelup-reroll-btn').onclick = () => {
    game.rerollLevelUpChoices();
  };

  // 暂停与继续
  document.getElementById('btn-resume-game').onclick = () => {
    sound.playClick();
    game.resumeGame();
  };
  document.getElementById('btn-quit-game').onclick = () => {
    sound.playClick();
    game.hideAllModals();
    game.state = 'MENU';
    document.getElementById('hud').style.display = 'none';
    document.getElementById('mobile-controls').style.display = 'none';
    document.getElementById('main-menu').style.display = 'flex';
    sound.stopBgm();
  };

  // 结算重试与返回
  document.getElementById('btn-restart-gameover').onclick = () => {
    game.startNewGame();
  };
  document.getElementById('btn-menu-gameover').onclick = () => {
    document.getElementById('btn-quit-game').click();
  };
  document.getElementById('btn-restart-victory').onclick = () => {
    game.startNewGame();
  };
  document.getElementById('btn-menu-victory').onclick = () => {
    document.getElementById('btn-quit-game').click();
  };

  // 手机端动作按键
  const dodgeBtn = document.getElementById('btn-dodge');
  if (dodgeBtn) {
    dodgeBtn.addEventListener('touchstart', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (game.player && game.state === "PLAYING") game.player.performDodge(game);
    }, { passive: false });

    dodgeBtn.onclick = (e) => {
      e.preventDefault();
      if (game.player && game.state === "PLAYING") game.player.performDodge(game);
    };
  }

  const skillBtn = document.getElementById('btn-skill');
  if (skillBtn) {
    skillBtn.addEventListener('touchstart', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (game.player && game.state === "PLAYING") game.player.performActiveSkill(game);
    }, { passive: false });

    skillBtn.onclick = (e) => {
      e.preventDefault();
      if (game.player && game.state === "PLAYING") game.player.performActiveSkill(game);
    };
  }

  // 设置弹窗内功能按钮
  const controlsBtn = document.getElementById('btn-toggle-controls');
  if (controlsBtn) {
    controlsBtn.onclick = () => {
      sound.init();
      sound.playClick();
      game.showMobileControls = !game.showMobileControls;
      document.getElementById('mobile-controls').style.display = (game.showMobileControls && game.state === 'PLAYING') ? 'block' : 'none';
      controlsBtn.innerText = game.showMobileControls ? '🎮 虚拟摇杆: 开' : '🎮 虚拟摇杆: 关';
    };
  }

  const soundBtn = document.getElementById('btn-toggle-sound');
  if (soundBtn) {
    soundBtn.onclick = () => {
      sound.init();
      const muted = sound.toggleMute();
      soundBtn.innerText = muted ? '🔇 音效: 关' : '🔊 音效: 开';
    };
  }

  const speedBtn = document.getElementById('btn-toggle-speed');
  if (speedBtn) {
    speedBtn.onclick = () => {
      sound.init();
      if (game.timeScale === 1.0) {
        game.timeScale = 3.0;
        speedBtn.innerText = '⚡ 游戏速度: 3x';
      } else {
        game.timeScale = 1.0;
        speedBtn.innerText = '⏱️ 游戏速度: 1x';
      }
    };
  }

  const bossTestBtn = document.getElementById('btn-test-boss');
  if (bossTestBtn) {
    bossTestBtn.onclick = () => {
      if (game.state === 'PLAYING') {
        settingsModal.style.display = 'none';
        game.director.gameTime = game.director.stageConfig.duration;
        game.director.spawnBoss();
      }
    };
  }

  requestAnimationFrame((t) => game.loop(t));
});
