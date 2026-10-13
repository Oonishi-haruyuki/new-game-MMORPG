import React from 'react';
import { Skill, Item } from '../../types/game';
import {
  Sword,
  RotateCw,
  ShieldAlert,
  HeartHandshake,
  Zap,
  Flame,
  Snowflake,
  Shield,
  Sparkles,
  Crosshair,
  Wind,
  Skull,
  Heart,
  Droplet
} from 'lucide-react';

interface ActionBarProps {
  skills: Skill[];
  onTriggerSkill: (skill: Skill) => void;
  inventory: Item[];
  onUsePotion: (type: 'hp' | 'mp') => void;
  currentMp: number;
  currentExp: number;
  maxExp: number;
  level: number;
}

export const ActionBar: React.FC<ActionBarProps> = ({
  skills,
  onTriggerSkill,
  inventory,
  onUsePotion,
  currentMp,
  currentExp,
  maxExp,
  level
}) => {
  // Count available potions
  const hpPotions = inventory.filter((i) => i.healHp && i.healHp > 0).length;
  const mpPotions = inventory.filter((i) => i.healMp && i.healMp > 0).length;

  const expPercent = Math.max(0, Math.min(100, (currentExp / maxExp) * 100));

  const renderSkillIcon = (iconName: string) => {
    const props = { className: 'w-6 h-6' };
    switch (iconName) {
      case 'Sword': return <Sword {...props} />;
      case 'RotateCw': return <RotateCw {...props} />;
      case 'ShieldAlert': return <ShieldAlert {...props} />;
      case 'HeartHandshake': return <HeartHandshake {...props} />;
      case 'Zap': return <Zap {...props} />;
      case 'Flame': return <Flame {...props} />;
      case 'Snowflake': return <Snowflake {...props} />;
      case 'Shield': return <Shield {...props} />;
      case 'Sparkles': return <Sparkles {...props} />;
      case 'Crosshair': return <Crosshair {...props} />;
      case 'Wind': return <Wind {...props} />;
      case 'Skull': return <Skull {...props} />;
      case 'Heart': return <Heart {...props} />;
      default: return <Sword {...props} />;
    }
  };

  return (
    <div className="flex flex-col items-center gap-1.5 pointer-events-auto select-none">
      {/* Hotbar Container */}
      <div className="flex items-center gap-2 p-2 rounded-2xl bg-slate-950/85 backdrop-blur-md border border-slate-800 shadow-2xl">
        {/* Potions group */}
        <div className="flex items-center gap-1.5 pr-2 border-r border-slate-800">
          {/* HP Potion (Q) */}
          <button
            onClick={() => onUsePotion('hp')}
            disabled={hpPotions === 0}
            className={`relative group w-12 h-12 rounded-xl flex items-center justify-center border transition-all ${
              hpPotions > 0
                ? 'bg-rose-950/60 border-rose-700/80 hover:border-rose-500 hover:scale-105 active:scale-95'
                : 'bg-slate-900/60 border-slate-800 opacity-40 cursor-not-allowed'
            }`}
            title="HPポーション使用 (Q)"
          >
            <Heart className="w-5 h-5 text-rose-400 group-hover:scale-110 transition-transform" />
            <span className="absolute top-0.5 left-1 text-[9px] font-mono font-bold text-slate-400">
              Q
            </span>
            <span className="absolute -bottom-1 -right-1 px-1.5 py-0.2 rounded-full bg-rose-600 text-[10px] font-mono font-bold text-white shadow">
              {hpPotions}
            </span>
          </button>

          {/* MP Potion (E) */}
          <button
            onClick={() => onUsePotion('mp')}
            disabled={mpPotions === 0}
            className={`relative group w-12 h-12 rounded-xl flex items-center justify-center border transition-all ${
              mpPotions > 0
                ? 'bg-sky-950/60 border-sky-700/80 hover:border-sky-500 hover:scale-105 active:scale-95'
                : 'bg-slate-900/60 border-slate-800 opacity-40 cursor-not-allowed'
            }`}
            title="MPポーション使用 (E)"
          >
            <Droplet className="w-5 h-5 text-sky-400 group-hover:scale-110 transition-transform" />
            <span className="absolute top-0.5 left-1 text-[9px] font-mono font-bold text-slate-400">
              E
            </span>
            <span className="absolute -bottom-1 -right-1 px-1.5 py-0.2 rounded-full bg-sky-600 text-[10px] font-mono font-bold text-white shadow">
              {mpPotions}
            </span>
          </button>
        </div>

        {/* Class Skills 1, 2, 3, 4, R */}
        <div className="flex items-center gap-1.5">
          {skills.map((skill) => {
            const isReady = skill.currentCooldown <= 0;
            const hasMana = currentMp >= skill.manaCost;
            const canCast = isReady && hasMana;

            return (
              <button
                key={skill.id}
                onClick={() => canCast && onTriggerSkill(skill)}
                disabled={!canCast}
                className={`relative group w-13 h-13 rounded-xl flex items-center justify-center border transition-all overflow-hidden ${
                  canCast
                    ? 'hover:scale-105 active:scale-95 shadow-md shadow-cyan-500/10'
                    : 'cursor-not-allowed'
                } ${
                  skill.key === 'R'
                    ? 'bg-amber-950/40 border-amber-500/80 text-amber-300'
                    : 'bg-slate-900/80 border-slate-700/80 text-slate-100'
                }`}
                style={{
                  borderColor: canCast ? skill.color : undefined
                }}
                title={`${skill.name} (${skill.key}) - ${skill.description} [消費MP: ${skill.manaCost}]`}
              >
                {/* Skill Icon */}
                <div
                  className="transition-transform group-hover:scale-110"
                  style={{ color: skill.color }}
                >
                  {renderSkillIcon(skill.icon)}
                </div>

                {/* Keybind tag */}
                <div className="absolute top-0.5 left-1 px-1 py-0.2 rounded bg-slate-950/70 text-[9px] font-mono font-black text-amber-300">
                  {skill.key}
                </div>

                {/* Mana Cost tag if > 0 */}
                {skill.manaCost > 0 && (
                  <div className="absolute bottom-0.5 right-1 text-[8px] font-mono font-bold text-cyan-300 drop-shadow">
                    {skill.manaCost} MP
                  </div>
                )}

                {/* Cooldown Overlay */}
                {!isReady && (
                  <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-[1px] flex items-center justify-center">
                    <span className="font-mono text-xs font-black text-white">
                      {skill.currentCooldown.toFixed(1)}s
                    </span>
                  </div>
                )}

                {/* Insufficient Mana Overlay */}
                {isReady && !hasMana && (
                  <div className="absolute inset-0 bg-blue-950/75 flex items-center justify-center">
                    <span className="text-[9px] font-bold text-cyan-200">
                      NO MP
                    </span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Global XP Bar */}
      <div className="w-full max-w-md flex flex-col gap-0.5">
        <div className="relative w-full h-2 rounded-full bg-slate-950/90 border border-amber-900/40 overflow-hidden shadow">
          <div
            className="h-full bg-gradient-to-r from-amber-500 to-yellow-300 transition-all duration-300"
            style={{ width: `${expPercent}%` }}
          />
        </div>
        <div className="flex justify-between items-center text-[9px] text-slate-400 font-mono px-1">
          <span>EXP: {expPercent.toFixed(1)}%</span>
          <span>
            {currentExp} / {maxExp} (Lv.{level})
          </span>
        </div>
      </div>
    </div>
  );
};
