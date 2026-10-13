import React from 'react';
import { CharacterClass } from '../../types/game';
import { Shield, Sparkles, Coins, Volume2, VolumeX, Music, HelpCircle } from 'lucide-react';
import { sound } from '../../utils/audio';

interface PlayerFrameProps {
  playerClass: CharacterClass;
  level: number;
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  gold: number;
  onOpenCharacter: () => void;
  onOpenHelp: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  bgmEnabled: boolean;
  onToggleBgm: () => void;
}

export const PlayerFrame: React.FC<PlayerFrameProps> = ({
  playerClass,
  level,
  hp,
  maxHp,
  mp,
  maxMp,
  gold,
  onOpenCharacter,
  onOpenHelp,
  soundEnabled,
  onToggleSound,
  bgmEnabled,
  onToggleBgm
}) => {
  const hpPercent = Math.max(0, Math.min(100, (hp / maxHp) * 100));
  const mpPercent = Math.max(0, Math.min(100, (mp / maxMp) * 100));

  return (
    <div className="flex items-start gap-3 select-none pointer-events-auto">
      {/* Player Portrait & Level Badge */}
      <div
        onClick={onOpenCharacter}
        className="relative group cursor-pointer transition-transform hover:scale-105 active:scale-95"
        title="ステータス・装備を開く (C)"
      >
        <div className="w-16 h-16 rounded-xl overflow-hidden border-2 border-amber-500/80 bg-slate-900 shadow-xl shadow-amber-500/10">
          <img
            src={playerClass.portrait}
            alt={playerClass.name}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover object-top group-hover:scale-110 transition-transform duration-300"
          />
        </div>
        {/* Level Emblem */}
        <div className="absolute -bottom-2 -right-1.5 px-2 py-0.5 rounded-md bg-gradient-to-r from-amber-600 to-yellow-500 text-slate-950 font-black text-xs shadow-md border border-amber-300 font-mono">
          Lv.{level}
        </div>
      </div>

      {/* Vitals Bars & Gold */}
      <div className="flex flex-col gap-1.5 w-48 sm:w-56 bg-slate-950/75 backdrop-blur-md p-2.5 rounded-xl border border-slate-800 shadow-2xl">
        {/* Name & Class info */}
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-white tracking-wide truncate max-w-[120px]">
            冒険者
          </span>
          <span className="text-[10px] text-amber-400 font-medium">
            {playerClass.name.split(' ')[0]}
          </span>
        </div>

        {/* HP Bar */}
        <div className="relative w-full h-4 rounded-md bg-slate-900/90 overflow-hidden border border-red-950">
          <div
            className="h-full bg-gradient-to-r from-red-600 to-rose-500 transition-all duration-200"
            style={{ width: `${hpPercent}%` }}
          />
          <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white tracking-wider font-mono drop-shadow">
            {Math.floor(hp)} / {maxHp}
          </div>
        </div>

        {/* MP Bar */}
        <div className="relative w-full h-3.5 rounded-md bg-slate-900/90 overflow-hidden border border-cyan-950">
          <div
            className="h-full bg-gradient-to-r from-sky-600 to-cyan-400 transition-all duration-200"
            style={{ width: `${mpPercent}%` }}
          />
          <div className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-cyan-100 tracking-wider font-mono drop-shadow">
            {Math.floor(mp)} / {maxMp}
          </div>
        </div>

        {/* Gold & Quick Utilities */}
        <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 text-[11px]">
          <div className="flex items-center gap-1.5 text-amber-400 font-mono font-bold">
            <Coins className="w-3.5 h-3.5 text-yellow-400" />
            <span>{gold.toLocaleString()} G</span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={onToggleSound}
              className={`p-1 rounded hover:bg-slate-800 transition-colors ${
                soundEnabled ? 'text-amber-400' : 'text-slate-500'
              }`}
              title="効果音 ON/OFF"
            >
              {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={onToggleBgm}
              className={`p-1 rounded hover:bg-slate-800 transition-colors ${
                bgmEnabled ? 'text-cyan-400' : 'text-slate-500'
              }`}
              title="幻想BGM ON/OFF"
            >
              <Music className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onOpenHelp}
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="操作ヘルプ (H)"
            >
              <HelpCircle className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
