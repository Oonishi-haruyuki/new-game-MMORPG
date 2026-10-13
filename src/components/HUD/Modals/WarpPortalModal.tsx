import React from 'react';
import { WarpPoint } from '../../../types/game';
import { WARP_POINTS } from '../../../game/worldData';
import { X, Sparkles, Navigation, Compass, MapPin } from 'lucide-react';
import { sound } from '../../../utils/audio';

interface WarpPortalModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentWarpPoint?: WarpPoint | null;
  onSelectWarp: (wp: WarpPoint) => void;
}

export const WarpPortalModal: React.FC<WarpPortalModalProps> = ({
  isOpen,
  onClose,
  currentWarpPoint,
  onSelectWarp
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-slate-900/95 border-2 border-sky-500/50 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-sky-500/20 bg-gradient-to-r from-sky-950/60 to-slate-900/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-sky-500/20 border border-sky-400/40 text-sky-400 shadow-inner">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-100 tracking-wide flex items-center gap-2">
                古代の空間転送門
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-sky-500/20 text-sky-300 font-bold border border-sky-500/30">
                  WAYPOINT NETWORK
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                {currentWarpPoint ? `現在地：【${currentWarpPoint.name}】` : '大陸全土の解放済み転送門へ一瞬で移動できます'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* List of Warp Destinations */}
        <div className="p-6 overflow-y-auto space-y-3.5">
          {WARP_POINTS.map((wp) => {
            const isHere = currentWarpPoint?.id === wp.id;
            return (
              <div
                key={wp.id}
                className={`p-4 rounded-xl border transition-all duration-200 flex items-center justify-between gap-4 ${
                  isHere
                    ? 'bg-sky-950/40 border-sky-400/50 ring-1 ring-sky-400/40'
                    : 'bg-slate-800/40 border-slate-700/60 hover:bg-slate-800/80 hover:border-sky-500/40'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border shadow-md"
                    style={{
                      backgroundColor: `${wp.color}20`,
                      borderColor: `${wp.color}60`,
                      color: wp.color
                    }}
                  >
                    <Compass className="w-6 h-6 animate-spin-slow" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-slate-100 text-base">{wp.name}</h3>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                        {wp.zone}
                      </span>
                      {isHere && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-500 text-slate-950 font-black">
                          現在地
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">{wp.description}</p>
                    <div className="flex items-center gap-2 mt-2 text-[11px] text-slate-500">
                      <MapPin className="w-3.5 h-3.5 text-sky-400" />
                      <span>座標: X: {wp.x}, Z: {wp.z}</span>
                    </div>
                  </div>
                </div>

                <button
                  disabled={isHere}
                  onClick={() => {
                    onSelectWarp(wp);
                    onClose();
                  }}
                  className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 shrink-0 transition-all shadow-lg ${
                    isHere
                      ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                      : 'bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white border border-sky-400/40 active:scale-95'
                  }`}
                >
                  <Navigation className="w-3.5 h-3.5" />
                  {isHere ? '滞在中心' : '転送する'}
                </button>
              </div>
            );
          })}
        </div>

        {/* Footer info */}
        <div className="px-6 py-3.5 bg-slate-950/70 border-t border-slate-800 text-xs text-slate-400 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            全域エーテル転送ネットワーク稼働中（転送料金：無料）
          </span>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 underline text-xs"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
};
