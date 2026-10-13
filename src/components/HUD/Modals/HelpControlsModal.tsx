import React from 'react';
import { X, HelpCircle, Keyboard, Mouse, Compass, Swords } from 'lucide-react';

interface HelpControlsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpControlsModal: React.FC<HelpControlsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-bold text-white font-fantasy tracking-wider">
              エセリア オンライン 操作マニュアル
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
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-300">
          {/* Movement */}
          <div className="space-y-2">
            <h3 className="font-bold text-white flex items-center gap-2 text-xs uppercase tracking-wide">
              <Keyboard className="w-4 h-4 text-cyan-400" /> 移動・視点操作
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800">
                <span className="font-mono font-bold text-amber-300">W / A / S / D</span>
                <p className="text-[11px] text-slate-400 mt-0.5">前後左右にキャラクターを移動</p>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800">
                <span className="font-mono font-bold text-amber-300">Space / Shift</span>
                <p className="text-[11px] text-slate-400 mt-0.5">ジャンプ / ダッシュ高速移動</p>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800">
                <span className="font-mono font-bold text-amber-300">マウスドラッグ</span>
                <p className="text-[11px] text-slate-400 mt-0.5">3D視点カメラの旋回・角度調整</p>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800">
                <span className="font-mono font-bold text-amber-300">マウスホイール</span>
                <p className="text-[11px] text-slate-400 mt-0.5">視点のズームイン / ズームアウト</p>
              </div>
            </div>
          </div>

          {/* Combat & Targeting */}
          <div className="space-y-2">
            <h3 className="font-bold text-white flex items-center gap-2 text-xs uppercase tracking-wide">
              <Swords className="w-4 h-4 text-rose-400" /> 戦闘 &amp; スキル発動
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800">
                <span className="font-mono font-bold text-amber-300">敵をクリック / TAB</span>
                <p className="text-[11px] text-slate-400 mt-0.5">ターゲットロックオン (足元に赤リング)</p>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800">
                <span className="font-mono font-bold text-amber-300">1 / 2 / 3 / 4</span>
                <p className="text-[11px] text-slate-400 mt-0.5">通常攻撃およびクラス別スキル発動</p>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800">
                <span className="font-mono font-bold text-amber-300">R (アルティメット)</span>
                <p className="text-[11px] text-slate-400 mt-0.5">超強力な広範囲必殺技</p>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800">
                <span className="font-mono font-bold text-amber-300">Q / E</span>
                <p className="text-[11px] text-slate-400 mt-0.5">HPポーション / MPポーション即時服用</p>
              </div>
            </div>
          </div>

          {/* Interface shortcuts */}
          <div className="space-y-2">
            <h3 className="font-bold text-white flex items-center gap-2 text-xs uppercase tracking-wide">
              <Compass className="w-4 h-4 text-amber-400" /> UIショートカットキー
            </h3>
            <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 grid grid-cols-3 sm:grid-cols-4 gap-2 text-center font-mono text-[11px]">
              <div><span className="text-amber-300 font-bold">C</span>: ステータス</div>
              <div><span className="text-amber-300 font-bold">I</span>: 所持品 (荷物)</div>
              <div><span className="text-amber-300 font-bold">L</span>: 任務ジャーナル</div>
              <div><span className="text-amber-300 font-bold">B</span>: 魔物図鑑(30種)</div>
              <div><span className="text-amber-300 font-bold">M</span>: 全体地図</div>
              <div><span className="text-amber-300 font-bold">ESC</span>: ターゲット解除</div>
              <div><span className="text-amber-300 font-bold">H</span>: ヘルプ画面</div>
              <div><span className="text-amber-300 font-bold">TAB</span>: 敵切替</div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-xs font-bold text-slate-950 transition-colors"
          >
            冒険に戻る
          </button>
        </div>
      </div>
    </div>
  );
};
