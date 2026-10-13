import React from 'react';
import { DuelOpponent } from '../../types/game';
import { Swords, ShieldAlert, X } from 'lucide-react';

interface DuelArenaHUDProps {
  opponent: DuelOpponent;
  currentOpponentHp: number;
  onForfeit: () => void;
}

export const DuelArenaHUD: React.FC<DuelArenaHUDProps> = ({
  opponent,
  currentOpponentHp,
  onForfeit
}) => {
  const hpPercent = Math.max(0, Math.min(100, Math.round((currentOpponentHp / opponent.maxHp) * 100)));

  return (
    <div className="fixed top-16 left-1/2 -translate-x-1/2 z-30 w-full max-w-md px-4 pointer-events-none animate-slideDown">
      <div className="bg-slate-950/85 backdrop-blur-md border-2 border-amber-500/80 rounded-2xl p-3.5 shadow-2xl pointer-events-auto flex flex-col gap-2">
        {/* Top Info */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/40 animate-pulse">
              <Swords className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs px-1.5 py-0.5 rounded font-black bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Lv.{opponent.level}
                </span>
                <span className="text-sm font-black text-slate-100 tracking-wide">
                  {opponent.name}
                </span>
              </div>
              <span className="text-[10px] text-amber-400 font-semibold">
                【{opponent.title}】
              </span>
            </div>
          </div>

          <button
            onClick={onForfeit}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-red-950/80 text-slate-400 hover:text-red-300 border border-slate-700 text-[11px] font-bold flex items-center gap-1 transition-colors"
            title="決闘を中断"
          >
            <X className="w-3.5 h-3.5" />
            降参
          </button>
        </div>

        {/* Health Bar */}
        <div>
          <div className="flex items-center justify-between text-[11px] font-bold mb-1">
            <span className="text-slate-400 flex items-center gap-1">
              <ShieldAlert className="w-3 h-3 text-red-400" />
              対戦相手 HP
            </span>
            <span className="text-red-400 font-mono">
              {currentOpponentHp} / {opponent.maxHp} ({hpPercent}%)
            </span>
          </div>
          <div className="w-full h-3 rounded-full bg-slate-900 border border-slate-850 overflow-hidden relative shadow-inner">
            <div
              className="h-full bg-gradient-to-r from-red-600 via-amber-500 to-yellow-400 transition-all duration-150 rounded-full"
              style={{ width: `${hpPercent}%` }}
            />
          </div>
        </div>

        {/* Battle notice */}
        <div className="text-center text-[10px] text-amber-300/80 font-bold bg-amber-950/40 py-0.5 rounded border border-amber-900/30">
          闘技場結界展開中 • スキルを駆使して敵のHPを0にせよ！
        </div>
      </div>
    </div>
  );
};
