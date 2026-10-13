import React from 'react';
import { Swords, Navigation, Trophy, BookOpen, Users } from 'lucide-react';

interface HeaderProps {
  onOpenClassSelect: () => void;
  onOpenMap: () => void;
  onOpenCharacter: () => void;
  onOpenQuests: () => void;
  onOpenBestiary: () => void;
  onOpenHelp: () => void;
  onOpenWarps: () => void;
  onOpenDuel: () => void;
  onOpenTutorial: () => void;
  onlinePlayersCount?: number;
  ping?: number;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenClassSelect,
  onOpenMap,
  onOpenCharacter,
  onOpenQuests,
  onOpenBestiary,
  onOpenHelp,
  onOpenWarps,
  onOpenDuel,
  onOpenTutorial,
  onlinePlayersCount = 1,
  ping = 12
}) => {
  return (
    <header className="h-14 px-3 sm:px-6 border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md flex items-center justify-between gap-4 z-40 select-none shrink-0">
      {/* Zone 1: Wordmark & Live Online Status */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-600 to-yellow-500 flex items-center justify-center text-slate-950 shadow-md shadow-amber-500/20">
            <Swords className="w-4 h-4" />
          </div>
          <span className="text-sm sm:text-base font-black tracking-wider text-white font-fantasy whitespace-nowrap">
            Aetheria Online
          </span>
        </div>

        {/* Real-time Multiplayer Badge */}
        <div
          className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/70 border border-emerald-500/50 text-[11px] font-bold text-emerald-300 shadow-sm"
          title={`リアルタイム通信中 / 遅延: ${ping}ms`}
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <Users className="w-3.5 h-3.5 text-emerald-400" />
          <span>接続: {onlinePlayersCount}人</span>
          <span className="text-[10px] text-emerald-500 font-mono">({ping}ms)</span>
        </div>
      </div>

      {/* Zone 2: Navigation Links */}
      <nav className="hidden lg:flex items-center gap-4 text-xs font-semibold text-slate-300">
        <button
          onClick={onOpenWarps}
          className="hover:text-sky-300 text-sky-400 flex items-center gap-1 transition-colors whitespace-nowrap cursor-pointer"
        >
          <Navigation className="w-3.5 h-3.5" />
          転送門(ワープ)
        </button>
        <button
          onClick={onOpenDuel}
          className="hover:text-amber-300 text-amber-400 flex items-center gap-1 transition-colors whitespace-nowrap cursor-pointer font-bold"
        >
          <Trophy className="w-3.5 h-3.5" />
          NPC決闘場
        </button>
        <button
          onClick={onOpenTutorial}
          className="hover:text-emerald-300 text-emerald-400 flex items-center gap-1 transition-colors whitespace-nowrap cursor-pointer"
        >
          <BookOpen className="w-3.5 h-3.5" />
          チュートリアル
        </button>
        <button
          onClick={onOpenMap}
          className="hover:text-amber-400 transition-colors whitespace-nowrap cursor-pointer"
        >
          大陸地図
        </button>
        <button
          onClick={onOpenCharacter}
          className="hover:text-amber-400 transition-colors whitespace-nowrap cursor-pointer"
        >
          冒険者情報
        </button>
        <button
          onClick={onOpenQuests}
          className="hover:text-amber-400 transition-colors whitespace-nowrap cursor-pointer"
        >
          任務記録
        </button>
        <button
          onClick={onOpenBestiary}
          className="hover:text-amber-400 transition-colors whitespace-nowrap cursor-pointer text-amber-300 font-bold"
        >
          魔物図鑑(30種)
        </button>
        <button
          onClick={onOpenHelp}
          className="hover:text-amber-400 transition-colors whitespace-nowrap cursor-pointer"
        >
          手引き
        </button>
      </nav>

      {/* Zone 3: Quick Action Buttons */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={onOpenWarps}
          className="lg:hidden p-2 rounded-lg bg-sky-950/80 border border-sky-500/50 text-sky-300 text-xs font-bold flex items-center gap-1"
          title="空間転送門"
        >
          <Navigation className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">ワープ</span>
        </button>
        <button
          onClick={onOpenDuel}
          className="lg:hidden p-2 rounded-lg bg-amber-950/80 border border-amber-500/50 text-amber-300 text-xs font-bold flex items-center gap-1"
          title="NPC決闘"
        >
          <Trophy className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">決闘</span>
        </button>
        <button
          onClick={onOpenClassSelect}
          className="px-3 py-1.5 text-xs font-black text-slate-950 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 rounded-lg transition-all shadow-md shadow-amber-500/20 whitespace-nowrap shrink-0 active:scale-95 cursor-pointer"
        >
          クラス切替
        </button>
      </div>
    </header>
  );
};
