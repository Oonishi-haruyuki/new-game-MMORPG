import React from 'react';
import { DuelOpponent } from '../../../types/game';
import { DUEL_OPPONENTS } from '../../../game/worldData';
import { X, Swords, Shield, Zap, Award, Coins, Flame } from 'lucide-react';
import { sound } from '../../../utils/audio';

interface DuelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartDuel: (opponent: DuelOpponent) => void;
}

export const DuelModal: React.FC<DuelModalProps> = ({
  isOpen,
  onClose,
  onStartDuel
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-3xl bg-slate-900/95 border-2 border-amber-500/50 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-amber-500/20 bg-gradient-to-r from-amber-950/60 to-slate-900/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/20 border border-amber-400/40 text-amber-400 shadow-inner">
              <Swords className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-100 tracking-wide flex items-center gap-2">
                サンクチュアリ闘技場・武芸決闘
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                  NPC DUEL ARENA
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                剣聖アルトリウス：『己が技を研ぎ澄まし、真剣勝負に挑むがよい！』
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Master Speech Banner */}
        <div className="px-6 py-3 bg-amber-950/30 border-b border-amber-900/40 flex items-center gap-3 text-xs text-amber-200/90">
          <Flame className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            決闘中は結界が張られ、一対一の真剣勝負となります。敗北してもデスペナルティはありません！
          </span>
        </div>

        {/* Duel Opponents Grid */}
        <div className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-4">
          {DUEL_OPPONENTS.map((opp) => {
            const classColor =
              opp.classId === 'paladin'
                ? '#38bdf8'
                : opp.classId === 'mage'
                ? '#c084fc'
                : '#4ade80';

            return (
              <div
                key={opp.id}
                className="bg-slate-800/50 hover:bg-slate-800/90 border border-slate-700/80 hover:border-amber-500/60 rounded-xl p-4.5 flex flex-col justify-between transition-all duration-200 group shadow-lg"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span
                        className="text-xs px-2 py-0.5 rounded font-black border"
                        style={{
                          backgroundColor: `${classColor}15`,
                          borderColor: `${classColor}40`,
                          color: classColor
                        }}
                      >
                        Lv.{opp.level}
                      </span>
                      <h3 className="font-black text-slate-100 text-base group-hover:text-amber-300 transition-colors">
                        {opp.name}
                      </h3>
                    </div>
                    <span className="text-[10px] text-amber-400/90 font-bold bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/50">
                      称号：{opp.title}
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-3">
                    {opp.description}
                  </p>

                  {/* Vitals */}
                  <div className="grid grid-cols-3 gap-2 py-2 px-3 rounded-lg bg-slate-900/60 border border-slate-800 text-[11px] mb-3">
                    <div className="flex flex-col">
                      <span className="text-slate-500 text-[10px]">体力 HP</span>
                      <span className="font-bold text-red-400">{opp.maxHp}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-slate-500 text-[10px]">攻撃力 ATK</span>
                      <span className="font-bold text-amber-400">{opp.atk}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-slate-500 text-[10px]">防御力 DEF</span>
                      <span className="font-bold text-sky-400">{opp.def}</span>
                    </div>
                  </div>

                  {/* Rewards */}
                  <div className="flex items-center justify-between text-[11px] text-slate-400 py-1 border-t border-slate-700/40">
                    <span className="flex items-center gap-1 text-yellow-400 font-bold">
                      <Coins className="w-3.5 h-3.5" /> +{opp.rewardGold} G
                    </span>
                    <span className="flex items-center gap-1 text-sky-400 font-bold">
                      <Zap className="w-3.5 h-3.5" /> +{opp.rewardExp} EXP
                    </span>
                    <span className="flex items-center gap-1 text-amber-300 font-bold">
                      <Award className="w-3.5 h-3.5" /> 称号付与
                    </span>
                  </div>
                </div>

                {/* Challenge button */}
                <button
                  onClick={() => {
                    sound.playSlash();
                    onStartDuel(opp);
                    onClose();
                  }}
                  className="mt-4 w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg border border-amber-300/60 active:scale-95 transition-all"
                >
                  <Swords className="w-4 h-4" />
                  手合わせを申し込む
                </button>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-950/70 border-t border-slate-800 text-xs text-slate-400 flex items-center justify-between">
          <span>闘技場での戦績は名誉ランクとして記録されます</span>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 underline text-xs"
          >
            立ち去る
          </button>
        </div>
      </div>
    </div>
  );
};
