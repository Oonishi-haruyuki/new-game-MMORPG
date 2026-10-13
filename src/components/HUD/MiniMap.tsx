import React from 'react';
import { Enemy, OtherPlayer } from '../../types/game';
import { Compass, Map as MapIcon } from 'lucide-react';
import { WARP_POINTS } from '../../game/worldData';

interface MiniMapProps {
  playerX: number;
  playerZ: number;
  playerRotation: number;
  enemies: Enemy[];
  otherPlayers: OtherPlayer[];
  onOpenWorldMap: () => void;
}

export const MiniMap: React.FC<MiniMapProps> = ({
  playerX,
  playerZ,
  playerRotation,
  enemies,
  otherPlayers,
  onOpenWorldMap
}) => {
  // Determine biome / zone name
  const getZoneName = (x: number, z: number): string => {
    const distCenter = Math.hypot(x, z);
    if (distCenter < 26) return 'サンクチュアリ中央広場 [安全地帯]';
    if (x > 50 && z > 40) return '獄炎竜の火口 [BOSS RAID]';
    if (x > 15) return 'エメラルド森林街道';
    if (x < -20 && z > 20) return '古代の石造遺跡';
    if (x < -20 && z < -20) return '結晶の深淵峡谷';
    return 'エセリア平原';
  };

  const zoneName = getZoneName(playerX, playerZ);
  const radarScale = 1.35; // world units to mini-map px (approx radius 50)

  return (
    <div className="flex flex-col items-end gap-1 select-none pointer-events-auto">
      {/* Zone Name Header */}
      <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-950/80 backdrop-blur-md border border-slate-800 text-xs shadow-xl">
        <Compass className="w-3.5 h-3.5 text-cyan-400 animate-spin-slow" />
        <span className="font-bold text-slate-100">{zoneName}</span>
      </div>

      {/* Circular Radar Container */}
      <div className="relative w-32 h-32 rounded-full overflow-hidden border-2 border-slate-700/80 bg-slate-950/90 shadow-2xl backdrop-blur-md">
        {/* Radar concentric range rings */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-20 h-20 rounded-full border border-slate-800/80" />
          <div className="absolute w-full h-[1px] bg-slate-800/40" />
          <div className="absolute h-full w-[1px] bg-slate-800/40" />
        </div>

        {/* Sanctuary Town Center Icon */}
        {(() => {
          const dx = (0 - playerX) * radarScale;
          const dz = (0 - playerZ) * radarScale;
          const dist = Math.hypot(dx, dz);
          if (dist < 58) {
            return (
              <div
                className="absolute w-2.5 h-2.5 rounded-full bg-yellow-400 border border-white shadow-sm"
                style={{
                  left: `calc(50% + ${dx}px - 5px)`,
                  top: `calc(50% + ${dz}px - 5px)`
                }}
                title="サンクチュアリ噴水広場"
              />
            );
          }
          return null;
        })()}

        {/* Warp Portals on Radar */}
        {WARP_POINTS.map((wp) => {
          const dx = (wp.x - playerX) * radarScale;
          const dz = (wp.z - playerZ) * radarScale;
          const dist = Math.hypot(dx, dz);
          if (dist > 58) return null;
          return (
            <div
              key={wp.id}
              className="absolute w-2.5 h-2.5 rounded-full border border-white shadow-sm animate-pulse z-10"
              style={{
                backgroundColor: wp.color,
                left: `calc(50% + ${dx}px - 5px)`,
                top: `calc(50% + ${dz}px - 5px)`
              }}
              title={`転送門: ${wp.name}`}
            />
          );
        })}

        {/* Enemies Dots */}
        {enemies.map((enemy) => {
          if (enemy.isDead) return null;
          const dx = (enemy.x - playerX) * radarScale;
          const dz = (enemy.z - playerZ) * radarScale;
          const dist = Math.hypot(dx, dz);
          if (dist > 58) return null; // out of radar radius

          return (
            <div
              key={enemy.id}
              className={`absolute rounded-full border shadow-sm ${
                enemy.isBoss
                  ? 'w-3 h-3 bg-amber-400 border-red-600 animate-pulse'
                  : 'w-2 h-2 bg-rose-500 border-rose-300'
              }`}
              style={{
                left: `calc(50% + ${dx}px - ${enemy.isBoss ? 6 : 4}px)`,
                top: `calc(50% + ${dz}px - ${enemy.isBoss ? 6 : 4}px)`
              }}
              title={enemy.name}
            />
          );
        })}

        {/* Other Players Dots */}
        {otherPlayers.map((p) => {
          const dx = (p.x - playerX) * radarScale;
          const dz = (p.z - playerZ) * radarScale;
          const dist = Math.hypot(dx, dz);
          if (dist > 58) return null;

          return (
            <div
              key={p.id}
              className="absolute w-2 h-2 rounded-full bg-cyan-400 border border-cyan-200"
              style={{
                left: `calc(50% + ${dx}px - 4px)`,
                top: `calc(50% + ${dz}px - 4px)`
              }}
              title={p.name}
            />
          );
        })}

        {/* Center Player Dot with Heading arrow */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div
            className="w-3.5 h-3.5 relative flex items-center justify-center"
            style={{ transform: `rotate(${-playerRotation}rad)` }}
          >
            <div className="w-0 h-0 border-x-4 border-x-transparent border-b-8 border-b-amber-400 drop-shadow" />
          </div>
        </div>

        {/* Map Expand Button */}
        <button
          onClick={onOpenWorldMap}
          className="absolute bottom-1 right-1 p-1 rounded-full bg-slate-900/90 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          title="全体マップを開く (M)"
        >
          <MapIcon className="w-3 h-3" />
        </button>
      </div>

      {/* Coordinate Display */}
      <div className="text-[10px] text-slate-400 font-mono tracking-tight bg-slate-950/70 px-2 py-0.5 rounded border border-slate-900">
        X: {Math.round(playerX)} / Z: {Math.round(playerZ)}
      </div>
    </div>
  );
};
