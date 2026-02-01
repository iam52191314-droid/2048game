export const GRID_SIZE = 4;
export const SLIDE_DURATION = 200; // ms - fast smooth slide
export const ANIMATION_DURATION = 220; // ms - almost instant after slide (200ms slide + 20ms buffer)

export const getTileColor = (val: number): string => {
  let base = '';
  switch (val) {
    case 2: base = 'bg-orange-100 text-slate-700'; break;
    case 4: base = 'bg-orange-200 text-slate-700'; break;
    case 8: base = 'bg-orange-400 text-white'; break;
    case 16: base = 'bg-orange-500 text-white'; break;
    case 32: base = 'bg-red-500 text-white'; break;
    case 64: base = 'bg-red-600 text-white'; break;
    case 128: base = 'bg-yellow-400 text-white'; break;
    case 256: base = 'bg-yellow-500 text-white'; break;
    case 512: base = 'bg-yellow-600 text-white'; break;
    case 1024: base = 'bg-yellow-700 text-white'; break;
    case 2048: base = 'bg-yellow-800 text-white shadow-[0_0_20px_rgba(234,179,8,0.6)]'; break;
    case 4096: base = 'bg-emerald-500 text-white shadow-[0_0_25px_rgba(16,185,129,0.6)]'; break;
    case 8192: base = 'bg-emerald-700 text-white shadow-[0_0_25px_rgba(4,120,87,0.6)]'; break;
    default: base = 'bg-slate-900 text-white'; break;
  }

  // Adaptive font sizing based on number length
  if (val < 10) return `${base} text-5xl`;      // 1 digit
  if (val < 100) return `${base} text-4xl`;     // 2 digits
  if (val < 1000) return `${base} text-3xl`;    // 3 digits
  return `${base} text-2xl`;                    // 4+ digits
};