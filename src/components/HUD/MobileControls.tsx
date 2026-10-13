import React, { useRef, useState } from 'react';
import { Target, ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from 'lucide-react';

interface MobileControlsProps {
  onMoveChange: (move: { x: number; z: number }) => void;
  onJump: () => void;
  onDash?: (active: boolean) => void;
  onTabTarget: () => void;
  onAttack: () => void;
}

export const MobileControls: React.FC<MobileControlsProps> = ({
  onMoveChange,
  onJump,
  onDash,
  onTabTarget,
  onAttack
}) => {
  const joystickRef = useRef<HTMLDivElement>(null);
  const [knobPos, setKnobPos] = useState({ x: 0, y: 0 });
  const [activeTouchId, setActiveTouchId] = useState<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (activeTouchId !== null) return;
    const touch = e.changedTouches[0];
    setActiveTouchId(touch.identifier);
    updateKnob(touch.clientX, touch.clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === activeTouchId) {
        updateKnob(touch.clientX, touch.clientY);
        break;
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === activeTouchId) {
        setActiveTouchId(null);
        setKnobPos({ x: 0, y: 0 });
        onMoveChange({ x: 0, z: 0 });
        break;
      }
    }
  };

  const updateKnob = (clientX: number, clientY: number) => {
    if (!joystickRef.current) return;
    const rect = joystickRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const dx = clientX - centerX;
    const dy = clientY - centerY;
    const dist = Math.hypot(dx, dy);
    const maxRadius = 40;

    let nx = dx;
    let ny = dy;
    if (dist > maxRadius) {
      nx = (dx / dist) * maxRadius;
      ny = (dy / dist) * maxRadius;
    }

    setKnobPos({ x: nx, y: ny });
    onMoveChange({
      x: nx / maxRadius,
      z: ny / maxRadius
    });
  };

  return (
    <div className="fixed inset-x-0 bottom-24 px-6 flex justify-between items-end pointer-events-none md:hidden z-30 select-none">
      {/* Virtual Analog Joystick (Left) */}
      <div
        ref={joystickRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        className="w-28 h-28 rounded-full bg-slate-950/60 backdrop-blur-md border border-slate-700/80 pointer-events-auto flex items-center justify-center relative touch-none shadow-2xl"
      >
        <div
          className="w-12 h-12 rounded-full bg-amber-500/80 border-2 border-amber-300 shadow-md absolute pointer-events-none"
          style={{
            transform: `translate(${knobPos.x}px, ${knobPos.y}px)`
          }}
        />
      </div>

      {/* Action Buttons (Right) */}
      <div className="flex flex-col gap-3 items-end pointer-events-auto">
        <div className="flex items-center gap-3">
          {/* Target Cycle */}
          <button
            onTouchStart={(e) => {
              e.preventDefault();
              onTabTarget();
            }}
            onClick={onTabTarget}
            className="w-12 h-12 rounded-full bg-slate-900/80 border border-slate-700 text-amber-400 font-bold flex items-center justify-center shadow-lg active:scale-90"
            title="ターゲット切替"
          >
            <Target className="w-5 h-5" />
          </button>

          {/* Jump */}
          <button
            onTouchStart={(e) => {
              e.preventDefault();
              onJump();
            }}
            onClick={onJump}
            className="w-12 h-12 rounded-full bg-slate-900/80 border border-slate-700 text-sky-400 font-bold flex items-center justify-center shadow-lg active:scale-90"
            title="ジャンプ"
          >
            <ArrowUp className="w-5 h-5" />
          </button>

          {/* Dash Button */}
          <button
            onTouchStart={(e) => {
              e.preventDefault();
              if (onDash) onDash(true);
            }}
            onTouchEnd={(e) => {
              e.preventDefault();
              if (onDash) onDash(false);
            }}
            onMouseDown={() => onDash && onDash(true)}
            onMouseUp={() => onDash && onDash(false)}
            className="w-12 h-12 rounded-full bg-emerald-950/80 border border-emerald-500/80 text-emerald-300 font-bold text-xs flex items-center justify-center shadow-lg active:scale-90"
            title="ダッシュ (長押しで高速前方推進)"
          >
            疾走
          </button>
        </div>

        {/* Primary Attack button */}
        <button
          onTouchStart={(e) => {
            e.preventDefault();
            onAttack();
          }}
          onClick={onAttack}
          className="w-16 h-16 rounded-full bg-gradient-to-tr from-amber-600 to-yellow-500 border-2 border-amber-300 text-slate-950 font-black text-sm flex items-center justify-center shadow-2xl active:scale-90"
          title="通常攻撃"
        >
          攻撃
        </button>
      </div>
    </div>
  );
};
