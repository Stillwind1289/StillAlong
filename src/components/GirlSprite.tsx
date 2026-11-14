import React from 'react';

export type GirlAnimationState =
  | 'idle'
  | 'writing'
  | 'reading'
  | 'mug'
  | 'happy'
  | 'sleepy';

interface GirlSpriteProps {
  animation?: GirlAnimationState;
  className?: string;
  alt?: string;
}

const ANIMATION_CLASS: Record<GirlAnimationState, string> = {
  idle: 'girl-sit-idle',
  writing: 'girl-sit-writing',
  reading: 'girl-sit-reading',
  mug: 'girl-sit-mug',
  happy: 'girl-sit-happy',
  sleepy: 'girl-sit-sleepy',
};

/**
 * Fixed-cell sprite renderer backed by the normalized 5x4 (320x240 cell)
 * /assets/sprites/girl-sit-sheet.png extracted from the user's artwork.
 */
export const GirlSprite: React.FC<GirlSpriteProps> = ({
  animation = 'idle',
  className = 'w-20',
  alt = 'Stillalong study companion',
}) => {
  return (
    <div
      role="img"
      aria-label={alt}
      className={`relative aspect-[320/240] shrink-0 overflow-hidden select-none ${className}`}
    >
      <img
        src="/assets/sprites/girl-sit-sheet.png"
        alt=""
        aria-hidden="true"
        draggable={false}
        className={`pixelated pointer-events-none block h-[400%] w-[500%] max-w-none will-change-transform ${ANIMATION_CLASS[animation]}`}
      />
    </div>
  );
};
