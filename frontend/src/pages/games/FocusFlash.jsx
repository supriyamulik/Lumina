import React, { useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';
import GameContainer from '../../components/games/GameContainer';
import { useProfile } from '../../contexts/ProfileContext';
import { useTranslation } from 'react-i18next';

export default function FocusFlash() {
  const { profile } = useProfile();
  const { t } = useTranslation();
  const [score, setScore] = useState(0);

  // Disability flags
  const isADHD = profile?.disabilities?.includes('ADHD');
  const isLowVision = profile?.disabilities?.includes('Low Vision');

  const handleGameEnd = (finalScore) => {
    setScore(finalScore);
    // Logic to save to behaviorService can go here
  };

  const GameComponent = () => {
    const containerRef = useRef(null);

    useEffect(() => {
      if (!containerRef.current) return;

      const config = {
        type: Phaser.AUTO,
        parent: containerRef.current,
        width: 800,
        height: 500,
        transparent: true,
        scale: {
          mode: Phaser.Scale.FIT,
          autoCenter: Phaser.Scale.CENTER_BOTH
        },
        physics: {
          default: 'arcade',
          arcade: { gravity: { y: 0 } }
        },
        scene: {
          preload: preload,
          create: create,
          update: update
        }
      };

      const game = new Phaser.Game(config);
      let target;
      let gameScore = 0;
      let timer;

      function preload() {
        // No assets needed, we'll draw shapes
      }

      function create() {
        const scene = this;
        
        // Spawn first orb
        spawnOrb(scene);

        // Feedback Text
        this.scoreText = this.add.text(20, 20, `${t('games.math_race')} : 0`, { 
          fontSize: '24px', 
          fill: isLowVision ? '#FFFF00' : '#1A7A62',
          fontWeight: 'bold'
        });
      }

      function spawnOrb(scene) {
        if (target) target.destroy();

        const x = Phaser.Math.Between(100, 700);
        const y = Phaser.Math.Between(100, 400);
        const radius = isLowVision ? 50 : 40;

        // Visual for ADHD: Flashy colored orbs
        const colors = [0xFF9900, 0x1A7A62, 0x4A90D9, 0xE8920C];
        const color = colors[Math.floor(Math.random() * colors.length)];

        target = scene.add.circle(x, y, radius, color);
        target.setInteractive();

        // ADHD Feature: Pulse effect
        scene.tweens.add({
          targets: target,
          scale: 1.2,
          duration: 400,
          yoyo: true,
          repeat: -1
        });

        target.on('pointerdown', () => {
          gameScore += 10;
          scene.scoreText.setText(`${t('games.math_race')} : ` + gameScore);
          setScore(gameScore);

          // Success Flash for ADHD
          scene.cameras.main.flash(100, 255, 255, 255, 0.1);
          
          spawnOrb(scene);
        });

        // Time pressure for ADHD (auto-respawn)
        if (timer) timer.remove();
        timer = scene.time.delayedCall(isADHD ? 1500 : 3000, () => {
          spawnOrb(scene);
        });
      }

      function update() {}

      return () => {
        game.destroy(true);
      };
    }, []);

    return <div ref={containerRef} style={{ width: '100%', maxWidth: '800px', height: '100%', margin: '0 auto', borderRadius: '24px', overflow: 'hidden' }} />;
  };

  return (
    <GameContainer
      title={t('games.focus_flash')}
      description={t('games.focus_flash_desc')}
      type="component"
      gameSource={<GameComponent />}
      background={isLowVision ? '#000' : '#F0F9F7'}
    />
  );
}
