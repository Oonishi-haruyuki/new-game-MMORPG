import React from 'react';
import { Enemy } from '../../types/game';
import { Skull, X, ShieldAlert, Crosshair } from 'lucide-react';

interface TargetFrameProps {
  target: Enemy | null;
  onClearTarget: () => void;
}

export const TargetFrame: React.FC<TargetFrameProps> = ({ target, onClearTarget }) => {
  if (!target || target.isDead) return null;

  const hpPercent = Math.max(0, Math.min(100, (target.hp / target.maxHp) * 100));

  return (
    <div className="flex items-center gap-2.5 bg-slate-950/80 backdrop-blur-md px-3.5 py-2 rounded-xl border border-rose-900/60 shadow-2xl pointer-events-auto animate-in fade-in zoom-in-95">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border ${
        target.isBoss
          ? 'bg-amber-950/60 border-amber-500 text-amber-400'
          : 'bg-rose-950/60 border-rose-700 text-rose-400'
      }`}>
        {target.isBoss ? <Skull className="w-6 h-6 animate-pulse" /> : <Crosshair className="w-5 h-5" />}
      </div>

      <div className="w-44 flex flex-col gap-1">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-white truncate max-w-[130px]">
            {target.name}
          </span>
          <span className="text-[10px] font-mono text-rose-400 font-bold">
            Lv.{target.level}
          </span>
        </div>

        {/* Target HP Bar */}
        <div className="relative w-full h-3 rounded bg-slate-900 overflow-hidden border border-rose-950">
          <div
            className={`h-full transition-all duration-150 ${
              target.isBoss
                ? 'bg-gradient-to-r from-amber-600 via-rose-600 to-red-500'
                : 'bg-gradient-to-r from-red-600 to-rose-500'
            }`}
            style={{ width: `${hpPercent}%` }}
          />
          <div className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-white font-mono drop-shadow">
            {Math.floor(target.hp)} / {target.maxHp}
          </div>
        </div>
      </div>

      <button
        onClick={onClearTarget}
        className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        title="ターゲット解除 (ESC)"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
