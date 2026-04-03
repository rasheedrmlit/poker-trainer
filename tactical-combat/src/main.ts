import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { MainMenuScene } from './scenes/MainMenuScene';
import { CombatScene } from './scenes/CombatScene';
import { GAME_WIDTH, GAME_HEIGHT } from './config';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: '#1a1a2e',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  input: {
    touch: {
      capture: true,
    },
  },
  scene: [BootScene, MainMenuScene, CombatScene],
  render: {
    pixelArt: false,
    antialias: true,
    antialiasGL: true,
  },
  fps: {
    target: 60,
    forceSetTimeOut: false,
  },
};

new Phaser.Game(config);
