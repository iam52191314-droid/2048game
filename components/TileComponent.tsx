import React from 'react';
import { Tile } from '../types';
import { getTileColor, SLIDE_DURATION } from '../constants';

interface TileProps {
  tile: Tile;
  isHighlight: boolean;
  isDimmed: boolean;
  onClick: (tile: Tile) => void;
  cellSize: number;
  gap: number;
}

export const TileComponent: React.FC<TileProps> = ({ 
  tile, 
  isHighlight, 
  isDimmed, 
  onClick, 
  cellSize, 
  gap 
}) => {
  // Z-Index priority:
  // 30: Highlighted (Selection)
  // 25: Merging (Stay on top during the pause)
  // 20: Merged/New (Top priority for visuals)
  // 15: Standard tiles
  // 10: To be deleted (Ghost tiles sliding underneath)
  let zIndex = 15;
  if (tile.toBeDeleted) zIndex = 10;
  else if (tile.isMerging) zIndex = 25;
  else if (tile.isMerged || tile.isNew) zIndex = 20;
  if (isHighlight) zIndex = 30;

  // Position calculation
  const xPos = tile.x * (cellSize + gap) + gap;
  const yPos = tile.y * (cellSize + gap) + gap;

  return (
    <div
      className="absolute tile-transform"
      style={{
        width: `${cellSize}px`,
        height: `${cellSize}px`,
        transform: `translate(${xPos}px, ${yPos}px)`,
        transitionProperty: 'transform',
        transitionDuration: `${SLIDE_DURATION}ms`,
        transitionTimingFunction: 'ease-in-out',
        left: 0, 
        top: 0,
        zIndex,
      }}
      onClick={() => onClick(tile)}
    >
      <div 
        className={`w-full h-full flex items-center justify-center rounded-lg font-bold select-none cursor-pointer shadow-sm
          ${getTileColor(tile.val)}
          ${isHighlight ? 'ring-4 ring-blue-500 ring-offset-2 scale-105' : ''}
          ${isDimmed ? 'opacity-40 grayscale' : 'opacity-100'}
          ${tile.isNew ? 'animate-bounce-in' : ''}
          ${tile.isMerged ? 'animate-pop' : ''}
        `}
      >
        {tile.val}
      </div>
    </div>
  );
};