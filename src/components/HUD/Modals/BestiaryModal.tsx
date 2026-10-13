import React, { useState } from 'react';
import { BESTIARY_DATA, BestiaryEntry } from '../../../game/worldData';
import { X, BookOpen, Skull, Shield, Award, Coins, MapPin, Sparkles, Crosshair } from 'lucide-react';

interface BestiaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTrackMonster?: (entry: BestiaryEntry) => void;
}

export const BestiaryModal: React.FC<BestiaryModalProps> = ({ isOpen, onClose, onTrackMonster }) => {
  const [selectedType, setSelectedType] = useState<string>(BESTIARY_DATA[0].type);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  if (!isOpen) return null;

  const categories = ['all', '森林・草原', '古代遺跡', '水晶峡谷', '灼熱火山', '星辰・虚空'];

  const filteredMobs = BESTIARY_DATA.filter((mob) => {
    if (selectedCategory !== 'all' && mob.category !== selectedCategory) return false;
    if (searchQuery.trim() && !mob.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const selectedMob = BESTIARY_DATA.find((m) => m.type === selectedType) || filteredMobs[0] || BESTIARY_DATA[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-bold text-white font-fantasy tracking-wider">
              エセリア大陸 魔物生態図鑑 (全30種)
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Category Filter & Search Bar */}
        <div className="px-6 py-3 border-b border-slate-800/80 bg-slate-950/30 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg transition-colors font-medium ${
                  selectedCategory === cat
                    ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {cat === 'all' ? `全生息域 (${BESTIARY_DATA.length})` : cat}
              </button>
            ))}
          </div>

          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="魔物名で検索..."
            className="bg-slate-950/80 text-xs text-white px-3 py-1.5 rounded-lg border border-slate-700 focus:outline-none focus:border-amber-400 w-44"
          />
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-12 gap-6 flex-1">
          {/* Monster List Grid (Col 1-5) */}
          <div className="md:col-span-5 space-y-2 max-h-[480px] overflow-y-auto pr-1">
            <div className="text-[11px] text-slate-400 pb-1 flex justify-between">
              <span>登録魔物一覧</span>
              <span>{filteredMobs.length} 種表示中</span>
            </div>
            {filteredMobs.map((mob) => {
              const isSelected = mob.type === selectedMob.type;
              return (
                <div
                  key={mob.type}
                  onClick={() => setSelectedType(mob.type)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? 'bg-slate-950 border-amber-400 shadow-md ring-1 ring-amber-400/30'
                      : 'bg-slate-950/50 border-slate-800 hover:border-slate-700 hover:bg-slate-950/80'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                        mob.isBoss
                          ? 'bg-rose-950 text-rose-400 border border-rose-500/50'
                          : mob.isElite
                          ? 'bg-amber-950 text-amber-400 border border-amber-500/50'
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {mob.isBoss ? <Skull className="w-4 h-4" /> : mob.level}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white truncate max-w-[150px]">
                        {mob.name}
                      </div>
                      <div className="text-[10px] text-slate-400">{mob.category}</div>
                    </div>
                  </div>

                  {mob.isBoss ? (
                    <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 text-[9px] font-bold border border-rose-500/40">
                      BOSS
                    </span>
                  ) : mob.isElite ? (
                    <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[9px] font-bold border border-amber-500/40">
                      ELITE
                    </span>
                  ) : null}
                </div>
              );
            })}
          </div>

          {/* Selected Monster Detail Card (Col 6-12) */}
          <div className="md:col-span-7 p-5 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col justify-between space-y-4">
            <div className="space-y-4">
              {/* Header Title & Badge */}
              <div className="flex items-start justify-between pb-3 border-b border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-amber-400">{selectedMob.category}</span>
                    {selectedMob.isBoss && (
                      <span className="px-2 py-0.5 rounded-full bg-rose-950 border border-rose-500/60 text-rose-400 text-[10px] font-black animate-pulse">
                        WORLD BOSS
                      </span>
                    )}
                    {selectedMob.isElite && (
                      <span className="px-2 py-0.5 rounded-full bg-amber-950 border border-amber-500/60 text-amber-400 text-[10px] font-black">
                        ELITE MONSTER
                      </span>
                    )}
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-white mt-1">
                    {selectedMob.name}
                  </h3>
                </div>

                <div className="px-3 py-1 rounded-xl bg-slate-900 border border-slate-700 font-mono text-xs font-bold text-amber-300">
                  Lv.{selectedMob.level}
                </div>
              </div>

              {/* Combat Statistics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center font-mono">
                <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                  <div className="text-[10px] text-slate-400 font-sans">生命力 (HP)</div>
                  <div className="text-sm font-bold text-emerald-400 mt-0.5">{selectedMob.hp.toLocaleString()}</div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                  <div className="text-[10px] text-slate-400 font-sans">攻撃力 (ATK)</div>
                  <div className="text-sm font-bold text-rose-400 mt-0.5">{selectedMob.atk}</div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                  <div className="text-[10px] text-slate-400 font-sans">防御力 (DEF)</div>
                  <div className="text-sm font-bold text-sky-400 mt-0.5">{selectedMob.def}</div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                  <div className="text-[10px] text-slate-400 font-sans">撃破経験値</div>
                  <div className="text-sm font-bold text-amber-400 mt-0.5">+{selectedMob.exp}</div>
                </div>
              </div>

              {/* Lore & Behavior */}
              <div className="space-y-1.5">
                <div className="text-xs font-bold text-slate-300">生態 &amp; 討伐記録</div>
                <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/60 p-3.5 rounded-xl border border-slate-800/80">
                  {selectedMob.description}
                </p>
              </div>

              {/* Habitat & Drop */}
              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-900/50 border border-slate-800">
                  <MapPin className="w-4 h-4 text-cyan-400 shrink-0" />
                  <div>
                    <span className="text-slate-400 text-[10px]">主な出現生息域: </span>
                    <span className="text-slate-200 font-semibold">{selectedMob.location}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-900/50 border border-slate-800">
                  <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                  <div>
                    <span className="text-slate-400 text-[10px]">撃破時ドロップ候補: </span>
                    <span className="text-amber-300 font-semibold">{selectedMob.dropName}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Button */}
            <div className="pt-2 border-t border-slate-800/80 flex justify-between items-center text-xs">
              <span className="text-slate-400 font-mono text-[11px]">
                報酬期待値: 約 {selectedMob.gold} G
              </span>
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold transition-colors"
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
