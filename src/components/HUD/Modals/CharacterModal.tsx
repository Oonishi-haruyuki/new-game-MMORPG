import React from 'react';
import { CharacterClass, PlayerStats, Equipment } from '../../../types/game';
import { X, Shield, Zap, Heart, Sparkles, Plus, Award } from 'lucide-react';
import { sound } from '../../../utils/audio';

interface CharacterModalProps {
  isOpen: boolean;
  onClose: () => void;
  playerClass: CharacterClass;
  level: number;
  stats: PlayerStats;
  onAllocatePoint: (stat: keyof Omit<PlayerStats, 'unspentPoints'>) => void;
  equipment: Equipment;
  totalAtk: number;
  totalDef: number;
  totalCrit: number;
  maxHp: number;
  maxMp: number;
  gold: number;
}

export const CharacterModal: React.FC<CharacterModalProps> = ({
  isOpen,
  onClose,
  playerClass,
  level,
  stats,
  onAllocatePoint,
  equipment,
  totalAtk,
  totalDef,
  totalCrit,
  maxHp,
  maxMp,
  gold
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-bold text-white font-fantasy tracking-wider">
              冒険者ステータス &amp; 能力値
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Top Profile Card */}
          <div className="flex flex-col sm:flex-row items-center gap-5 p-4 rounded-xl bg-slate-950/60 border border-slate-800">
            <div className="w-24 h-24 rounded-xl overflow-hidden border-2 border-amber-500/80 bg-slate-900 shrink-0 shadow-lg shadow-amber-500/10">
              <img
                src={playerClass.portrait}
                alt={playerClass.name}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover object-top"
              />
            </div>
            <div className="flex-1 text-center sm:text-left space-y-1">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <span className="text-lg font-bold text-white">エセリアの守護者</span>
                <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono text-xs font-bold border border-amber-500/40">
                  Lv.{level}
                </span>
              </div>
              <div className="text-xs text-amber-400 font-semibold">{playerClass.name}</div>
              <p className="text-[11px] text-slate-400 leading-relaxed">{playerClass.description}</p>
            </div>
          </div>

          {/* Core Battle Statistics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800">
              <div className="text-[11px] text-slate-400 font-medium">攻撃力 (ATK)</div>
              <div className="text-lg font-bold text-rose-400 font-mono mt-0.5">{totalAtk}</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800">
              <div className="text-[11px] text-slate-400 font-medium">防御力 (DEF)</div>
              <div className="text-lg font-bold text-sky-400 font-mono mt-0.5">{totalDef}</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800">
              <div className="text-[11px] text-slate-400 font-medium">会心率 (CRIT)</div>
              <div className="text-lg font-bold text-amber-400 font-mono mt-0.5">{totalCrit}%</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800">
              <div className="text-[11px] text-slate-400 font-medium">最大HP / MP</div>
              <div className="text-xs font-bold text-emerald-400 font-mono mt-1">
                {maxHp} / {maxMp}
              </div>
            </div>
          </div>

          {/* Stat Points Allocation */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-xs font-bold text-slate-200">能力値ポイント割り振り</span>
              <span className="text-xs font-mono font-bold text-amber-400">
                未割り振り: {stats.unspentPoints} pt
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { key: 'str' as const, label: '筋力 (STR)', desc: '近接・武器攻撃力を強化', val: stats.str },
                { key: 'agi' as const, label: '敏捷 (AGI)', desc: '会心率と攻撃速度を強化', val: stats.agi },
                { key: 'int' as const, label: '知力 (INT)', desc: '魔法攻撃力と最大MPを強化', val: stats.int },
                { key: 'vit' as const, label: '体力 (VIT)', desc: '最大HPと基礎防御力を強化', val: stats.vit }
              ].map((stat) => (
                <div
                  key={stat.key}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900 border border-slate-800"
                >
                  <div>
                    <div className="text-xs font-bold text-slate-200">{stat.label}</div>
                    <div className="text-[10px] text-slate-400">{stat.desc}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold text-amber-300 w-6 text-right">
                      {stat.val}
                    </span>
                    <button
                      onClick={() => {
                        onAllocatePoint(stat.key);
                        sound.playCoin();
                      }}
                      disabled={stats.unspentPoints <= 0}
                      className="p-1 rounded bg-amber-600 hover:bg-amber-500 disabled:opacity-30 disabled:hover:bg-amber-600 text-slate-950 font-black transition-colors"
                      title="能力値を1上昇"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white transition-colors"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
};
