import React from 'react';
import { Quest } from '../../types/game';
import { Scroll, CheckCircle2, ChevronRight } from 'lucide-react';

interface QuestTrackerProps {
  quests: Quest[];
  onOpenQuestLog: () => void;
}

export const QuestTracker: React.FC<QuestTrackerProps> = ({ quests, onOpenQuestLog }) => {
  const activeQuests = quests.filter((q) => q.status === 'active' || q.status === 'completed');

  return (
    <div className="w-56 bg-slate-950/80 backdrop-blur-md rounded-xl border border-slate-800 p-2.5 shadow-2xl pointer-events-auto select-none">
      <div
        onClick={onOpenQuestLog}
        className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-slate-800 cursor-pointer group"
      >
        <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
          <Scroll className="w-3.5 h-3.5 text-amber-400" />
          <span>任務ジャーナル</span>
        </div>
        <div className="flex items-center text-[10px] text-slate-400 group-hover:text-amber-300 transition-colors">
          <span>(L)</span>
          <ChevronRight className="w-3 h-3" />
        </div>
      </div>

      {activeQuests.length === 0 ? (
        <div className="text-[11px] text-slate-400 py-1">
          進行中の任務はありません。街の掲示板やNPCから任務を受注しましょう。
        </div>
      ) : (
        <div className="space-y-2">
          {activeQuests.map((quest) => {
            const isFinished = quest.currentCount >= quest.requiredCount;
            return (
              <div
                key={quest.id}
                onClick={onOpenQuestLog}
                className="cursor-pointer group hover:bg-slate-900/50 p-1 rounded transition-colors"
              >
                <div className="flex items-start justify-between gap-1 text-[11px]">
                  <span className="font-bold text-slate-200 group-hover:text-white truncate">
                    {quest.title}
                  </span>
                  {isFinished ? (
                    <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-0.5 shrink-0">
                      <CheckCircle2 className="w-3 h-3" /> 完了
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono text-amber-400 shrink-0">
                      {quest.currentCount} / {quest.requiredCount}
                    </span>
                  )}
                </div>

                <div className="w-full bg-slate-900 h-1.5 rounded-full mt-1 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      isFinished ? 'bg-emerald-500' : 'bg-amber-500'
                    }`}
                    style={{
                      width: `${Math.min(100, (quest.currentCount / quest.requiredCount) * 100)}%`
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
