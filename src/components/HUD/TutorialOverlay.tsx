import React from 'react';
import { TUTORIAL_STEPS } from '../../game/worldData';
import { BookOpen, CheckCircle, ChevronRight, X, Sparkles, Award } from 'lucide-react';
import { sound } from '../../utils/audio';

interface TutorialOverlayProps {
  currentStepId: number;
  onNextStep: () => void;
  onClose: () => void;
  onCompleteTutorial: () => void;
}

export const TutorialOverlay: React.FC<TutorialOverlayProps> = ({
  currentStepId,
  onNextStep,
  onClose,
  onCompleteTutorial
}) => {
  const currentStep = TUTORIAL_STEPS.find((s) => s.id === currentStepId);
  const totalSteps = TUTORIAL_STEPS.length;
  const isLast = currentStepId >= totalSteps;

  if (!currentStep) return null;

  return (
    <div className="fixed top-20 right-4 z-40 max-w-sm w-full pointer-events-auto animate-slideDown">
      <div className="bg-slate-950/90 backdrop-blur-md border-2 border-amber-500/80 rounded-2xl p-4 shadow-2xl relative overflow-hidden flex flex-col gap-2.5">
        {/* Glow ambient background */}
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-amber-500/20 rounded-full blur-2xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/40">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase text-amber-400 tracking-wider">
                入門チュートリアル ({currentStepId} / {totalSteps})
              </span>
              <h4 className="text-sm font-black text-slate-100">{currentStep.title}</h4>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-850"
            title="チュートリアルを閉じる"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Objective */}
        <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col gap-1.5">
          <div className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span className="text-xs font-bold text-slate-200">
              {currentStep.objective}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed pl-6">
            {currentStep.hint}
          </p>
          <div className="mt-1 pl-6">
            <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-amber-950/80 text-amber-300 border border-amber-800/60 inline-block">
              操作: {currentStep.keyGuide}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-1">
          <button
            onClick={onClose}
            className="text-[11px] text-slate-400 hover:text-slate-200 underline"
          >
            後で確認
          </button>

          {isLast ? (
            <button
              onClick={() => {
                sound.playFanfare();
                onCompleteTutorial();
              }}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs flex items-center gap-1.5 shadow-lg border border-emerald-400/40 active:scale-95 transition-all"
            >
              <Award className="w-4 h-4" />
              修練完了！報酬受取
            </button>
          ) : (
            <button
              onClick={() => {
                sound.playSlash();
                onNextStep();
              }}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-slate-950 font-black text-xs flex items-center gap-1 shadow-lg border border-amber-300/40 active:scale-95 transition-all"
            >
              次へ進む
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
