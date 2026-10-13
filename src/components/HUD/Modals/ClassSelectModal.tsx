import React from 'react';
import { CharacterClassId } from '../../../types/game';
import { CHARACTER_CLASSES } from '../../../game/worldData';
import { X, Shield, Sparkles, Check, Swords } from 'lucide-react';
import { sound } from '../../../utils/audio';

interface ClassSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentClassId: CharacterClassId;
  onSelectClass: (id: CharacterClassId) => void;
}

export const ClassSelectModal: React.FC<ClassSelectModalProps> = ({
  isOpen,
  onClose,
  currentClassId,
  onSelectClass
}) => {
  if (!isOpen) return null;

  const classes = Object.values(CHARACTER_CLASSES);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2">
            <Swords className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-bold text-white font-fantasy tracking-wider">
              冒険者クラス変更 (ジョブ選択)
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Classes Card Grid */}
        <div className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-3 gap-5">
          {classes.map((cls) => {
            const isSelected = cls.id === currentClassId;

            return (
              <div
                key={cls.id}
                onClick={() => {
                  onSelectClass(cls.id);
                  sound.playLevelUp();
                }}
                className={`flex flex-col justify-between p-4 rounded-xl border transition-all cursor-pointer group ${
                  isSelected
                    ? 'bg-slate-950 border-amber-400 shadow-xl ring-2 ring-amber-400/30 scale-[1.02]'
                    : 'bg-slate-950/50 border-slate-800 hover:border-slate-700 hover:bg-slate-950/80'
                }`}
              >
                <div className="space-y-3">
                  {/* Portrait */}
                  <div className="w-full aspect-square rounded-xl overflow-hidden border border-slate-800 bg-slate-900 relative shadow-md">
                    <img
                      src={cls.portrait}
                      alt={cls.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                    />
                    {isSelected && (
                      <div className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-amber-500 text-slate-950 font-black text-[10px] flex items-center gap-1 shadow">
                        <Check className="w-3 h-3 stroke-[3]" /> 選択中
                      </div>
                    )}
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-white">{cls.name}</h3>
                    <div className="text-[11px] text-amber-400 font-medium">{cls.role}</div>
                  </div>

                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    {cls.description}
                  </p>
                </div>

                {/* Base Stats Preview */}
                <div className="pt-3 mt-3 border-t border-slate-800/80 space-y-1 text-[10px] font-mono text-slate-400">
                  <div className="flex justify-between">
                    <span>基礎HP:</span>
                    <span className="text-white font-bold">{cls.baseHp}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>基礎攻撃力:</span>
                    <span className="text-rose-400 font-bold">{cls.baseAtk}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>基礎防御力:</span>
                    <span className="text-sky-400 font-bold">{cls.baseDef}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>会心率:</span>
                    <span className="text-amber-400 font-bold">{cls.baseCrit}%</span>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectClass(cls.id);
                      sound.playLevelUp();
                      onClose();
                    }}
                    className={`w-full mt-2 py-2 rounded-lg text-xs font-bold transition-all ${
                      isSelected
                        ? 'bg-slate-800 text-slate-400 cursor-default'
                        : 'bg-amber-600 hover:bg-amber-500 text-slate-950'
                    }`}
                  >
                    {isSelected ? '選択中' : 'このクラスに就職する'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
