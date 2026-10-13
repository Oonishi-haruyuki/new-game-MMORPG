import React, { useState } from 'react';
import { Quest } from '../../../types/game';
import { X, Scroll, Award, CheckCircle2, Coins, ArrowRight } from 'lucide-react';
import { sound } from '../../../utils/audio';

interface QuestLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  quests: Quest[];
  onAcceptQuest: (questId: string) => void;
  onTurnInQuest: (questId: string) => void;
}

export const QuestLogModal: React.FC<QuestLogModalProps> = ({
  isOpen,
  onClose,
  quests,
  onAcceptQuest,
  onTurnInQuest
}) => {
  const [selectedQuestId, setSelectedQuestId] = useState<string>(quests[0]?.id || '');

  if (!isOpen) return null;

  const selectedQuest = quests.find((q) => q.id === selectedQuestId) || quests[0];

  const getStatusBadge = (status: Quest['status'], current: number, req: number) => {
    if (status === 'turned_in') {
      return <span className="text-[10px] text-slate-500 font-medium">完了済み</span>;
    }
    if (current >= req || status === 'completed') {
      return (
        <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3" /> 報酬受取可能
        </span>
      );
    }
    if (status === 'active') {
      return <span className="text-[10px] text-amber-400 font-bold font-mono">進行中 ({current}/{req})</span>;
    }
    return <span className="text-[10px] text-sky-400 font-bold">受注可能</span>;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-2">
            <Scroll className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-bold text-white font-fantasy tracking-wider">
              任務ジャーナル (クエスト一覧)
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Quest List */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider pb-1 border-b border-slate-800">
              任務リスト
            </h3>
            <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
              {quests.map((quest) => {
                const isSelected = quest.id === selectedQuestId;
                return (
                  <div
                    key={quest.id}
                    onClick={() => setSelectedQuestId(quest.id)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-slate-950 border-amber-500 shadow-md ring-1 ring-amber-500/30'
                        : 'bg-slate-950/40 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs font-bold text-white mb-1">
                      <span className="truncate max-w-[170px]">{quest.title}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-slate-400">{quest.giverName}</span>
                      {getStatusBadge(quest.status, quest.currentCount, quest.requiredCount)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quest Details */}
          {selectedQuest ? (
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div>
                  <div className="text-[10px] text-amber-400 font-mono font-semibold">依頼人: {selectedQuest.giverName}</div>
                  <h3 className="text-sm font-bold text-white mt-0.5">{selectedQuest.title}</h3>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/60 p-3 rounded-lg border border-slate-800/80">
                  {selectedQuest.description}
                </p>

                {/* Rewards */}
                <div className="space-y-1.5 pt-2 border-t border-slate-800">
                  <div className="text-xs font-bold text-slate-300">達成報酬:</div>
                  <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                    <div className="flex items-center gap-1.5 p-2 rounded bg-slate-900 text-amber-400">
                      <Award className="w-4 h-4 text-amber-400" />
                      <span>+{selectedQuest.expReward} EXP</span>
                    </div>
                    <div className="flex items-center gap-1.5 p-2 rounded bg-slate-900 text-yellow-400">
                      <Coins className="w-4 h-4 text-yellow-400" />
                      <span>+{selectedQuest.goldReward} G</span>
                    </div>
                  </div>

                  {selectedQuest.itemReward && (
                    <div className="p-2 rounded bg-slate-900 border border-amber-500/30 flex items-center gap-2 mt-2">
                      <div className="text-[10px] text-slate-400">特別報酬:</div>
                      <div className="text-xs font-bold text-amber-300 truncate">
                        {selectedQuest.itemReward.name}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Button */}
              <div>
                {selectedQuest.status === 'available' && (
                  <button
                    onClick={() => {
                      onAcceptQuest(selectedQuest.id);
                      sound.playLevelUp();
                    }}
                    className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs shadow-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <span>任務を受注する</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}

                {selectedQuest.status === 'active' && selectedQuest.currentCount < selectedQuest.requiredCount && (
                  <div className="w-full py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 text-xs text-center font-medium">
                    目標進行中: {selectedQuest.currentCount} / {selectedQuest.requiredCount} 討伐
                  </div>
                )}

                {(selectedQuest.status === 'completed' ||
                  (selectedQuest.status === 'active' && selectedQuest.currentCount >= selectedQuest.requiredCount)) && (
                  <button
                    onClick={() => {
                      onTurnInQuest(selectedQuest.id);
                      sound.playLevelUp();
                    }}
                    className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 transition-colors flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>任務を完了して報酬を受け取る！</span>
                  </button>
                )}

                {selectedQuest.status === 'turned_in' && (
                  <div className="w-full py-2.5 rounded-xl bg-slate-900 text-slate-500 text-xs text-center font-bold">
                    この任務は完了しました
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
