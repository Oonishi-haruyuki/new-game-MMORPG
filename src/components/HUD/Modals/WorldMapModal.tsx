import React from 'react';
import { X, Map as MapIcon, Compass, MapPin, Navigation } from 'lucide-react';
import { CLASS_PORTRAITS, WARP_POINTS } from '../../../game/worldData';

interface WorldMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  playerX: number;
  playerZ: number;
  onWarpTo?: (x: number, y: number, z: number, name: string) => void;
}

export const WorldMapModal: React.FC<WorldMapModalProps> = ({
  isOpen,
  onClose,
  playerX,
  playerZ,
  onWarpTo
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-2">
            <MapIcon className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-bold text-white font-fantasy tracking-wider">
              エセリア大陸 全体地図 &amp; 転送門ネットワーク
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Realm Illustration Banner with Map Overlay */}
          <div className="relative w-full h-56 sm:h-72 rounded-xl overflow-hidden border border-slate-700 shadow-xl group">
            <img
              src={CLASS_PORTRAITS.banner}
              alt="エセリア大陸ワールドマップ"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent" />

            {/* Current Player Pin Overlay */}
            <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-950/85 backdrop-blur-md border border-amber-500/60 shadow-lg">
              <MapPin className="w-4 h-4 text-amber-400 animate-bounce" />
              <span className="text-xs font-bold text-white">
                現在位置: X {Math.round(playerX)} / Z {Math.round(playerZ)}
              </span>
            </div>
          </div>

          {/* Warp Points / Fast Travel Grid */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
                <Navigation className="w-4 h-4" />
                登録済み転送門（ワープポイント）- クリックで瞬時転送
              </h3>
              <span className="text-[11px] text-slate-500">転送費用: 無料</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {WARP_POINTS.map((wp) => {
                const dist = Math.hypot(wp.x - playerX, wp.z - playerZ);
                const isClose = dist < 6.0;

                return (
                  <div
                    key={wp.id}
                    className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-sky-500/60 transition-all flex flex-col justify-between group"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-white flex items-center gap-1.5">
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: wp.color }}
                          />
                          {wp.name}
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-sky-300 font-bold border border-slate-800">
                          {wp.zone}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed line-clamp-2">
                        {wp.description}
                      </p>
                      <div className="text-[10px] text-slate-500 font-mono pt-1.5">
                        座標: X {wp.x}, Z {wp.z} ({Math.round(dist)}m)
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        if (onWarpTo) {
                          onWarpTo(wp.x, wp.y, wp.z, wp.name);
                          onClose();
                        }
                      }}
                      className="mt-3 w-full py-1.5 rounded-lg bg-sky-950/80 hover:bg-sky-600 text-sky-300 hover:text-white border border-sky-500/50 hover:border-sky-400 font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow active:scale-95"
                    >
                      <Navigation className="w-3.5 h-3.5" />
                      {isClose ? '現在滞在中' : 'ここへ転送する'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white transition-colors"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
};
