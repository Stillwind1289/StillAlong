import React from 'react';

export type GirlAnimationState =
  | 'idle'
  | 'blink'
  | 'reading'
  | 'writing'
  | 'walkDown'
  | 'walkUp'
  | 'walkLeft'
  | 'walkRight';

interface GirlSpriteProps {
  animation?: GirlAnimationState;
  className?: string;
  alt?: string;
}

const ANIMATION_CLASS: Record<GirlAnimationState, string> = {
  idle: 'girl-anim-idle',
  blink: 'girl-anim-blink',
  reading: 'girl-anim-reading',
  writing: 'girl-anim-writing',
  walkDown: 'girl-anim-walk-down',
  walkUp: 'girl-anim-walk-up',
  walkLeft: 'girl-anim-walk-left',
  walkRight: 'girl-anim-walk-right',
};

/**
 * Fixed-cell CSS steps() sprite renderer backed verbatim by the normalized
 * 8x4 (160x176 cell) girl sprite sheet extracted from the user's artwork.
 * Container proportions never squash, stretch, or shrink across states.
 */
export const GirlSprite: React.FC<GirlSpriteProps> = ({
  animation = 'idle',
  className = 'w-28',
  alt = 'Stillalong study companion',
}) => {
  return (
    <div
      role="img"
      aria-label={alt}
      className={`relative aspect-[160/176] shrink-0 overflow-hidden select-none ${className}`}
    >
      <img
        src="/assets/sprites/girl-spritesheet-normalized.png"
        alt=""
        aria-hidden="true"
        draggable={false}
        className={`pixelated pointer-events-none block h-[400%] w-[800%] max-w-none will-change-transform ${ANIMATION_CLASS[animation]}`}
      />
    </div>
  );
};
