import React from 'react';
import { User, Briefcase, Scroll, Map, BookOpen, HelpCircle, Compass, Navigation, Swords, Zap } from 'lucide-react';

interface ShortcutBarProps {
  onOpenCharacter: () => void;
  onOpenInventory: () => void;
  onOpenQuests: () => void;
  onOpenBestiary: () => void;
  onOpenMap: () => void;
  onOpenSkills: () => void;
  onOpenHelp: () => void;
  onOpenWarps: () => void;
  onOpenDuel: () => void;
  isAutoDash?: boolean;
  onToggleAutoDash?: () => void;
  hasUnspentPoints?: boolean;
}

export const ShortcutBar: React.FC<ShortcutBarProps> = ({
  onOpenCharacter,
  onOpenInventory,
  onOpenQuests,
  onOpenBestiary,
  onOpenMap,
  onOpenSkills,
  onOpenHelp,
  onOpenWarps,
  onOpenDuel,
  isAutoDash = false,
  onToggleAutoDash,
  hasUnspentPoints
}) => {
  const buttons = [
    { label: '転送門', key: 'W', icon: Navigation, action: onOpenWarps, color: 'text-sky-400' },
    { label: 'NPC決闘', key: 'D', icon: Swords, action: onOpenDuel, color: 'text-amber-400' },
    { label: 'ステータス', key: 'C', icon: User, action: onOpenCharacter, alert: hasUnspentPoints, color: 'text-amber-400' },
    { label: '所持品', key: 'I', icon: Briefcase, action: onOpenInventory, color: 'text-amber-400' },
    { label: '任務', key: 'L', icon: Scroll, action: onOpenQuests, color: 'text-amber-400' },
    { label: '図鑑', key: 'B', icon: BookOpen, action: onOpenBestiary, color: 'text-amber-400' },
    { label: '地図', key: 'M', icon: Map, action: onOpenMap, color: 'text-amber-400' },
    { label: 'クラス', key: 'K', icon: Compass, action: onOpenSkills, color: 'text-amber-400' },
    { label: 'ヘルプ', key: 'H', icon: HelpCircle, action: onOpenHelp, color: 'text-amber-400' }
  ];

  return (
    <div className="flex items-center gap-1.5 p-1.5 rounded-xl bg-slate-950/85 backdrop-blur-md border border-slate-800 shadow-2xl pointer-events-auto select-none">
      {/* Auto Dash Toggle */}
      {onToggleAutoDash && (
        <button
          onClick={onToggleAutoDash}
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs font-bold transition-all ${
            isAutoDash
              ? 'bg-emerald-950/90 border-emerald-500 text-emerald-300 ring-1 ring-emerald-400/50'
              : 'bg-slate-900/60 hover:bg-slate-800 border-slate-800 text-slate-400 hover:text-slate-200'
          }`}
          title="ダッシュ (Shiftキー単体でも前方に高速ダッシュ可能)"
        >
          <Zap className={`w-3.5 h-3.5 ${isAutoDash ? 'text-emerald-400 animate-pulse' : 'text-slate-400'}`} />
          <span className="hidden md:inline">{isAutoDash ? '常時ダッシュ中' : 'ダッシュ'}</span>
          <span className="hidden lg:inline text-[9px] text-slate-500 font-mono">(Shift)</span>
        </button>
      )}

      {buttons.map((btn) => {
        const Icon = btn.icon;
        return (
          <button
            key={btn.key}
            onClick={btn.action}
            className="relative group flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-slate-900/60 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-all text-xs active:scale-95"
            title={`${btn.label} (${btn.key})`}
          >
            <Icon className={`w-3.5 h-3.5 ${btn.color || 'text-amber-400'} group-hover:scale-110 transition-transform`} />
            <span className="hidden md:inline font-medium text-[11px]">{btn.label}</span>
            <span className="hidden lg:inline text-[9px] text-slate-500 font-mono">({btn.key})</span>

            {btn.alert && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-400 border border-slate-950 animate-pulse" />
            )}
          </button>
        );
      })}
    </div>
  );
};
