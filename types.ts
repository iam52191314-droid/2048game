export interface Tile {
  id: number;
  val: number;
  x: number;
  y: number;
  isNew?: boolean;
  isMerged?: boolean;
  toBeDeleted?: boolean;
  isMerging?: boolean;
}

export type Grid = (Tile | null)[][];

export type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

export type GameMode = 'NORMAL' | 'SWAP' | 'CLEAR';

export interface GameState {
  tiles: Tile[];
  score: number;
  bestScore: number;
  won: boolean;
  gameOver: boolean;
  wonDismissed: boolean;
}