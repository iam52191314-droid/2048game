import React, { useState, useEffect, useRef, useCallback } from 'react';
import { RotateCcw, ArrowLeftRight, Trash2, Undo2, Trophy, Crown } from 'lucide-react';
import { Tile, Direction, GameMode } from './types';
import { GRID_SIZE, ANIMATION_DURATION } from './constants';
import { TileComponent } from './components/TileComponent';

// --- Utility Helpers ---

const generateId = (() => {
  let id = 1;
  return () => id++;
})();

const getEmptyCells = (tiles: Tile[]) => {
  const cells: { x: number; y: number }[] = [];
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      if (!tiles.find((t) => t.x === x && t.y === y && !t.toBeDeleted)) {
        cells.push({ x, y });
      }
    }
  }
  return cells;
};

const addRandomTile = (tiles: Tile[]): Tile[] => {
  const emptyCells = getEmptyCells(tiles);
  if (emptyCells.length === 0) return tiles;

  const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
  const newVal = Math.random() < 0.9 ? 2 : 4;

  const newTile: Tile = {
    id: generateId(),
    x: randomCell.x,
    y: randomCell.y,
    val: newVal,
    isNew: true,
  };

  return [...tiles, newTile];
};

const checkGameOver = (tiles: Tile[]) => {
  if (getEmptyCells(tiles).length > 0) return false;

  // Check possible merges
  for (let i = 0; i < tiles.length; i++) {
    const t = tiles[i];
    if (t.toBeDeleted) continue;
    // Check neighbors
    const neighbors = [
      tiles.find(n => n.x === t.x + 1 && n.y === t.y && !n.toBeDeleted),
      tiles.find(n => n.x === t.x - 1 && n.y === t.y && !n.toBeDeleted),
      tiles.find(n => n.x === t.x && n.y === t.y + 1 && !n.toBeDeleted),
      tiles.find(n => n.x === t.x && n.y === t.y - 1 && !n.toBeDeleted)
    ];
    if (neighbors.some(n => n && n.val === t.val)) return false;
  }

  return true;
};

export default function App() {
  // --- State ---
  const [tiles, setTiles] = useState<Tile[]>([]);
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [history, setHistory] = useState<{ tiles: Tile[]; score: number }[]>([]);
  const [won, setWon] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [gameMode, setGameMode] = useState<GameMode>('NORMAL');
  const [selectedTileId, setSelectedTileId] = useState<number | null>(null);
  const [wonDismissed, setWonDismissed] = useState(false);
  
  // Animation lock
  const [isAnimating, setIsAnimating] = useState(false);

  // UI Ref for board sizing
  const boardRef = useRef<HTMLDivElement>(null);
  const [cellSize, setCellSize] = useState(70);
  const [gapSize, setGapSize] = useState(12);

  // Initialize
  useEffect(() => {
    const savedBest = localStorage.getItem('2048-infinite-best');
    if (savedBest) setBestScore(parseInt(savedBest, 10));
    initGame();
    
    // Resize handler
    const handleResize = () => {
        if (boardRef.current) {
            const width = Math.min(boardRef.current.clientWidth, 500); // Max width limit
            const newGap = Math.max(8, width * 0.025);
            const newSize = (width - newGap * (GRID_SIZE + 1)) / GRID_SIZE;
            setCellSize(newSize);
            setGapSize(newGap);
        }
    };
    
    window.addEventListener('resize', handleResize);
    handleResize(); // Initial calculation
    // Small delay to ensure container is rendered
    setTimeout(handleResize, 100);

    return () => window.removeEventListener('resize', handleResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update Best Score
  useEffect(() => {
    if (score > bestScore) {
      setBestScore(score);
      localStorage.setItem('2048-infinite-best', score.toString());
    }
  }, [score, bestScore]);

  const initGame = () => {
    let newTiles: Tile[] = [];
    // Add two starting tiles
    const cell1 = { x: Math.floor(Math.random() * 4), y: Math.floor(Math.random() * 4) };
    let cell2 = { x: Math.floor(Math.random() * 4), y: Math.floor(Math.random() * 4) };
    while (cell1.x === cell2.x && cell1.y === cell2.y) {
      cell2 = { x: Math.floor(Math.random() * 4), y: Math.floor(Math.random() * 4) };
    }

    newTiles.push({ id: generateId(), x: cell1.x, y: cell1.y, val: 2 });
    newTiles.push({ id: generateId(), x: cell2.x, y: cell2.y, val: 2 });

    setTiles(newTiles);
    setScore(0);
    setWon(false);
    setGameOver(false);
    setWonDismissed(false);
    setHistory([]);
    setGameMode('NORMAL');
    setIsAnimating(false);
  };

  const saveHistory = useCallback(() => {
    setHistory(prev => {
        // Clean up any ghost tiles before saving
        const cleanTiles = tiles.filter(t => !t.toBeDeleted).map(t => ({...t, isMerged: false, isNew: false, isMerging: false}));
        const newHist = [...prev, { tiles: JSON.parse(JSON.stringify(cleanTiles)), score }];
        if (newHist.length > 20) newHist.shift(); // Limit history size
        return newHist;
    });
  }, [tiles, score]);

  const undo = () => {
    if (history.length === 0 || isAnimating) return;
    const lastState = history[history.length - 1];
    setTiles(lastState.tiles);
    setScore(lastState.score);
    setHistory(prev => prev.slice(0, prev.length - 1));
    setGameOver(false);
  };

  // --- Logic: Move ---
  const move = useCallback((direction: Direction) => {
    if (gameMode !== 'NORMAL' || gameOver || isAnimating) return;

    // Save history before modifying anything
    const currentHistoryState = { tiles: JSON.parse(JSON.stringify(tiles.filter(t => !t.toBeDeleted))), score };
    
    let hasMoved = false;
    // Working copy
    let currentTiles: Tile[] = JSON.parse(JSON.stringify(tiles));
    // Clean up previous animation flags
    currentTiles.forEach(t => { t.isMerged = false; t.isNew = false; t.toBeDeleted = false; t.isMerging = false; });
    
    let scoreGain = 0;
    
    const isHoriz = direction === 'LEFT' || direction === 'RIGHT';
    const isIncr = direction === 'RIGHT' || direction === 'DOWN';

    // Two sets of tiles:
    // 1. displayTiles: Contains tiles moving to destination (including ghosts). Values are NOT updated yet.
    // 2. finalTiles: Contains the state AFTER the animation (merged values, no ghosts).
    let displayTiles: Tile[] = [];
    let finalTiles: Tile[] = [];

    // Grid for sorting
    let grid: (Tile | null)[][] = Array(4).fill(null).map(() => Array(4).fill(null));
    currentTiles.forEach(t => grid[t.y][t.x] = t);

    for (let i = 0; i < 4; i++) {
        // Extract row/col
        let line: (Tile | null)[] = [];
        for (let j = 0; j < 4; j++) {
            const x = isHoriz ? j : i;
            const y = isHoriz ? i : j;
            line.push(grid[y][x]);
        }

        if (isIncr) line.reverse();

        // Process line
        let compressed = line.filter(t => t !== null) as Tile[];
        let destIndex = 0;
        let skip = false;

        for (let k = 0; k < compressed.length; k++) {
            if (skip) {
                skip = false;
                continue;
            }
            
            let t1 = compressed[k];
            let t2 = compressed[k+1];

            // Calculate destination coords
            let targetPos = destIndex;
            let tx = isHoriz ? targetPos : i;
            let ty = isHoriz ? i : targetPos;
            if (isIncr) {
                 if (isHoriz) tx = 3 - targetPos;
                 else ty = 3 - targetPos;
            }

            if (t2 && t1.val === t2.val) {
                // MERGE
                hasMoved = true; 
                
                // t1 moves to target and will wait there (isMerging)
                const t1Sliding = { ...t1, x: tx, y: ty, isMerging: true };
                // t2 moves to target and will wait there (isMerging + toBeDeleted)
                const t2Ghost = { ...t2, x: tx, y: ty, toBeDeleted: true, isMerging: true };
                
                // Final state tile (merged)
                const tMerged = { ...t1, x: tx, y: ty, val: t1.val * 2, isMerged: true };

                displayTiles.push(t1Sliding);
                displayTiles.push(t2Ghost);
                
                finalTiles.push(tMerged);
                
                scoreGain += tMerged.val;
                skip = true;
                destIndex++;
            } else {
                // NO MERGE
                if (t1.x !== tx || t1.y !== ty) hasMoved = true;
                
                const tMoved = { ...t1, x: tx, y: ty };
                displayTiles.push(tMoved);
                finalTiles.push(tMoved);
                
                destIndex++;
            }
        }
    }

    if (hasMoved) {
        // 1. Commit History
        setHistory(prev => {
            const newHist = [...prev, currentHistoryState];
            if (newHist.length > 20) newHist.shift();
            return newHist;
        });

        // 2. Start Animation Phase
        setIsAnimating(true);
        setTiles(displayTiles); // Show tiles sliding to new positions (old values)

        // 3. Finish Animation Phase
        setTimeout(() => {
            // Check win condition based on FINAL state
            if (!won && !wonDismissed && finalTiles.some(t => t.val === 2048)) {
                setWon(true);
            }

            setScore(prev => prev + scoreGain);

            // Add new tile to the FINAL state
            const tilesWithNew = addRandomTile(finalTiles);
            
            setTiles(tilesWithNew);
            setIsAnimating(false);
            
            if (checkGameOver(tilesWithNew)) {
                setGameOver(true);
            }

        }, ANIMATION_DURATION);
    }
  }, [tiles, gameMode, gameOver, won, wonDismissed, score, isAnimating]);

  // --- Input Handlers ---

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowUp': move('UP'); break;
      case 'ArrowDown': move('DOWN'); break;
      case 'ArrowLeft': move('LEFT'); break;
      case 'ArrowRight': move('RIGHT'); break;
      case 'Escape': 
        if (!isAnimating) {
            setGameMode('NORMAL'); 
            setSelectedTileId(null);
        }
        break;
    }
  }, [move, isAnimating]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Touch handling
  const touchStart = useRef<{x: number, y: number} | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (isAnimating) return;
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart.current || isAnimating) return;
    const dx = e.changedTouches[0].clientX - touchStart.current.x;
    const dy = e.changedTouches[0].clientY - touchStart.current.y;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    if (Math.max(absDx, absDy) > 30) { // Threshold
        if (absDx > absDy) {
            move(dx > 0 ? 'RIGHT' : 'LEFT');
        } else {
            move(dy > 0 ? 'DOWN' : 'UP');
        }
    }
    touchStart.current = null;
  };

  // --- Interaction Logic (Swap / Clear) ---

  const handleTileClick = (clickedTile: Tile) => {
    if (gameOver || isAnimating) return;

    if (gameMode === 'NORMAL') return;

    if (gameMode === 'CLEAR') {
      saveHistory();
      const valToRemove = clickedTile.val;
      const newTiles = tiles.filter(t => t.val !== valToRemove);
      setTiles(newTiles);
      setGameMode('NORMAL');
      if (newTiles.length === 0) {
          setTimeout(() => setTiles(addRandomTile([])), 150);
      }
      return;
    }

    if (gameMode === 'SWAP') {
      if (selectedTileId === null) {
        setSelectedTileId(clickedTile.id);
      } else {
        if (selectedTileId === clickedTile.id) {
            setSelectedTileId(null); // Deselect
            return;
        }
        
        saveHistory();
        // Perform Swap
        const t1Index = tiles.findIndex(t => t.id === selectedTileId);
        const t2Index = tiles.findIndex(t => t.id === clickedTile.id);

        if (t1Index !== -1 && t2Index !== -1) {
            const newTiles = [...tiles];
            const t1 = { ...newTiles[t1Index] };
            const t2 = { ...newTiles[t2Index] };

            // Swap positions
            const tempX = t1.x; const tempY = t1.y;
            t1.x = t2.x; t1.y = t2.y;
            t2.x = tempX; t2.y = tempY;

            newTiles[t1Index] = t1;
            newTiles[t2Index] = t2;
            setTiles(newTiles);
        }
        setSelectedTileId(null);
        setGameMode('NORMAL');
      }
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-indigo-50 p-4">
      {/* Header */}
      <div className="w-full max-w-[450px] flex justify-between items-center mb-6">
        <div>
          <h1 className="text-5xl font-extrabold text-slate-800">2048 <span className="text-2xl text-indigo-500">∞</span></h1>
          <p className="text-slate-500 font-medium text-sm">Join the numbers to infinity!</p>
        </div>
        <div className="flex space-x-3">
            <div className="bg-slate-200 rounded-lg p-2 min-w-[70px] flex flex-col items-center">
                <span className="text-xs font-bold text-slate-500 uppercase">Score</span>
                <span className="font-bold text-slate-800">{score}</span>
            </div>
            <div className="bg-amber-100 rounded-lg p-2 min-w-[70px] flex flex-col items-center">
                <span className="text-xs font-bold text-amber-600 uppercase">Best</span>
                <span className="font-bold text-slate-800">{bestScore}</span>
            </div>
        </div>
      </div>

      {/* Controls */}
      <div className="w-full max-w-[450px] flex justify-between mb-4">
        <button 
            onClick={initGame} 
            disabled={isAnimating}
            className="flex items-center gap-1 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition font-semibold text-sm shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
        >
            <RotateCcw size={16} /> Reset
        </button>
        <button 
            onClick={undo} 
            disabled={history.length === 0 || gameOver || isAnimating}
            className={`flex items-center gap-1 px-4 py-2 rounded-lg transition font-semibold text-sm shadow-lg active:scale-95
                ${history.length > 0 && !isAnimating ? 'bg-blue-500 text-white hover:bg-blue-600' : 'bg-slate-300 text-slate-500 cursor-not-allowed'}
            `}
        >
            <Undo2 size={16} /> Undo
        </button>
      </div>

      {/* Game Board Container */}
      <div 
        className="relative bg-slate-300 rounded-xl shadow-2xl touch-none"
        style={{
            padding: `${gapSize}px`,
            width: `${cellSize * GRID_SIZE + gapSize * (GRID_SIZE + 1)}px`,
            height: `${cellSize * GRID_SIZE + gapSize * (GRID_SIZE + 1)}px`,
        }}
        ref={boardRef}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Background Grid Cells */}
        {Array.from({ length: 16 }).map((_, i) => (
            <div
                key={i}
                className="absolute bg-slate-200 rounded-lg"
                style={{
                    width: `${cellSize}px`,
                    height: `${cellSize}px`,
                    left: `${(i % 4) * (cellSize + gapSize) + gapSize}px`,
                    top: `${Math.floor(i / 4) * (cellSize + gapSize) + gapSize}px`,
                }}
            />
        ))}

        {/* Tiles */}
        {tiles.map((tile) => (
            <TileComponent
                key={tile.id}
                tile={tile}
                cellSize={cellSize}
                gap={gapSize}
                isHighlight={selectedTileId === tile.id}
                isDimmed={gameMode !== 'NORMAL' && selectedTileId !== null && selectedTileId !== tile.id && gameMode !== 'CLEAR'}
                onClick={handleTileClick}
            />
        ))}

        {/* Overlays */}
        {gameOver && (
            <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/70 backdrop-blur-sm rounded-xl animate-fade-in">
                <h2 className="text-4xl font-extrabold text-slate-800 mb-2">Game Over!</h2>
                <p className="text-lg text-slate-600 mb-6 font-medium">Final Score: {score}</p>
                <div className="flex gap-4">
                    <button onClick={undo} className="px-6 py-3 bg-blue-500 text-white rounded-full font-bold shadow-lg hover:bg-blue-600 transition hover:scale-105">Undo</button>
                    <button onClick={initGame} className="px-6 py-3 bg-slate-800 text-white rounded-full font-bold shadow-lg hover:bg-slate-700 transition hover:scale-105">Try Again</button>
                </div>
            </div>
        )}

        {won && !wonDismissed && (
             <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-amber-400/80 backdrop-blur-sm rounded-xl animate-fade-in text-center p-6">
                <Crown size={64} className="text-white mb-4 animate-bounce" />
                <h2 className="text-4xl font-extrabold text-white mb-2 drop-shadow-md">2048!</h2>
                <p className="text-white font-bold text-lg mb-6 drop-shadow-sm">Legendary status achieved.</p>
                <button 
                    onClick={() => setWonDismissed(true)} 
                    className="px-8 py-3 bg-white text-amber-500 rounded-full font-extrabold shadow-xl hover:bg-slate-50 transition transform hover:scale-105"
                >
                    Keep Going 🚀
                </button>
            </div>
        )}
      </div>

      {/* Special Controls */}
      <div className="w-full max-w-[450px] mt-6 grid grid-cols-2 gap-4">
        <button
            onClick={() => {
                setGameMode(gameMode === 'SWAP' ? 'NORMAL' : 'SWAP');
                setSelectedTileId(null);
            }}
            disabled={gameOver || isAnimating}
            className={`flex items-center justify-center gap-2 py-4 rounded-xl font-bold text-lg shadow-md transition transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed
                ${gameMode === 'SWAP' 
                    ? 'bg-indigo-600 text-white ring-4 ring-indigo-200' 
                    : 'bg-white text-indigo-600 hover:bg-indigo-50'
                }
            `}
        >
            <ArrowLeftRight size={24} />
            {gameMode === 'SWAP' ? 'Cancel Swap' : 'Swap Tile'}
        </button>

        <button
            onClick={() => {
                setGameMode(gameMode === 'CLEAR' ? 'NORMAL' : 'CLEAR');
                setSelectedTileId(null);
            }}
            disabled={gameOver || isAnimating}
            className={`flex items-center justify-center gap-2 py-4 rounded-xl font-bold text-lg shadow-md transition transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed
                ${gameMode === 'CLEAR' 
                    ? 'bg-rose-600 text-white ring-4 ring-rose-200' 
                    : 'bg-white text-rose-600 hover:bg-rose-50'
                }
            `}
        >
            <Trash2 size={24} />
            {gameMode === 'CLEAR' ? 'Cancel Clear' : 'Clear #'}
        </button>
      </div>

      <div className="mt-6 text-slate-400 text-sm font-medium text-center">
        {gameMode === 'NORMAL' && <p>Swipe or use Arrow Keys to move</p>}
        {gameMode === 'SWAP' && <p className="text-indigo-600 animate-pulse">Select two tiles to swap positions</p>}
        {gameMode === 'CLEAR' && <p className="text-rose-600 animate-pulse">Tap a tile to remove all matching numbers</p>}
      </div>
    </div>
  );
}