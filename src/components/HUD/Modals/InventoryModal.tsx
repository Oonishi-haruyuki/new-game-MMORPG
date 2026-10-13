import React, { useState } from 'react';
import { Item, Equipment, ItemType } from '../../../types/game';
import { X, Briefcase, Shield, Sword, Sparkles, Heart, Droplet, Gem, Trash2, Coins } from 'lucide-react';
import { sound } from '../../../utils/audio';

interface InventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  inventory: Item[];
  equipment: Equipment;
  onEquipItem: (item: Item) => void;
  onUnequipItem: (slot: keyof Equipment) => void;
  onUseItem: (item: Item) => void;
  onSellItem: (item: Item) => void;
  gold: number;
}

export const InventoryModal: React.FC<InventoryModalProps> = ({
  isOpen,
  onClose,
  inventory,
  equipment,
  onEquipItem,
  onUnequipItem,
  onUseItem,
  onSellItem,
  gold
}) => {
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [filter, setFilter] = useState<'all' | 'gear' | 'consumable'>('all');

  if (!isOpen) return null;

  const filteredItems = inventory.filter((item) => {
    if (filter === 'gear') return ['weapon', 'armor', 'helmet', 'boots', 'ring'].includes(item.type);
    if (filter === 'consumable') return item.type === 'potion' || item.type === 'material';
    return true;
  });

  const getRarityColor = (rarity: Item['rarity']) => {
    switch (rarity) {
      case 'common': return 'border-slate-600 text-slate-300';
      case 'rare': return 'border-blue-500 text-blue-400';
      case 'epic': return 'border-purple-500 text-purple-400';
      case 'legendary': return 'border-amber-400 text-amber-300';
    }
  };

  const renderItemIcon = (iconName: string) => {
    switch (iconName) {
      case 'Sword': return <Sword className="w-5 h-5 text-amber-400" />;
      case 'Shield': return <Shield className="w-5 h-5 text-blue-400" />;
      case 'Heart': return <Heart className="w-5 h-5 text-rose-400" />;
      case 'Droplet': return <Droplet className="w-5 h-5 text-sky-400" />;
      case 'Gem':
      case 'Sparkle': return <Gem className="w-5 h-5 text-purple-400" />;
      default: return <Sparkles className="w-5 h-5 text-slate-300" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-bold text-white font-fantasy tracking-wider">
              冒険者の所持品 &amp; 装備品
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-xs text-amber-400 font-mono font-bold">
              <Coins className="w-4 h-4 text-yellow-400" />
              <span>{gold.toLocaleString()} G</span>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Equipment Slots (Col 1) */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider pb-1 border-b border-slate-800">
              装備スロット
            </h3>
            <div className="space-y-2">
              {[
                { slot: 'weapon' as const, label: '主武器', icon: Sword, item: equipment.weapon },
                { slot: 'armor' as const, label: '胴防具', icon: Shield, item: equipment.armor },
                { slot: 'helmet' as const, label: '頭防具', icon: Shield, item: equipment.helmet },
                { slot: 'boots' as const, label: '脚防具', icon: Shield, item: equipment.boots },
                { slot: 'ring' as const, label: '指輪・装飾', icon: Gem, item: equipment.ring }
              ].map(({ slot, label, icon: Icon, item }) => (
                <div
                  key={slot}
                  onClick={() => item && setSelectedItem(item)}
                  className={`flex items-center justify-between p-2 rounded-xl border transition-all cursor-pointer ${
                    item
                      ? 'bg-slate-950 border-amber-500/50 hover:border-amber-400'
                      : 'bg-slate-950/40 border-dashed border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center border border-slate-800">
                      <Icon className="w-4 h-4 text-slate-400" />
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400">{label}</div>
                      <div className="text-xs font-bold text-white truncate max-w-[90px]">
                        {item ? item.name : '未装備'}
                      </div>
                    </div>
                  </div>
                  {item && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onUnequipItem(slot);
                        sound.playCoin();
                      }}
                      className="px-2 py-0.5 rounded text-[10px] bg-slate-800 hover:bg-rose-950 text-slate-300 hover:text-rose-400 transition-colors"
                    >
                      外す
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 24-Slot Bag Grid (Col 2 & 3) */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center justify-between pb-1 border-b border-slate-800">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                所持品インベントリ ({inventory.length}/24)
              </h3>
              {/* Filter Tabs */}
              <div className="flex items-center gap-1 text-[11px]">
                {(['all', 'gear', 'consumable'] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-2 py-0.5 rounded transition-colors ${
                      filter === f
                        ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {f === 'all' ? '全て' : f === 'gear' ? '装備' : '消費'}
                  </button>
                ))}
              </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
              {Array.from({ length: 24 }).map((_, index) => {
                const item = filteredItems[index];
                const isSelected = item && selectedItem?.id === item.id;

                return (
                  <div
                    key={index}
                    onClick={() => item && setSelectedItem(item)}
                    className={`aspect-square rounded-xl border flex items-center justify-center relative transition-all ${
                      item
                        ? `bg-slate-900 cursor-pointer hover:scale-105 ${
                            isSelected ? 'border-amber-400 ring-2 ring-amber-400/30' : getRarityColor(item.rarity)
                          }`
                        : 'bg-slate-950/40 border-slate-800/60'
                    }`}
                  >
                    {item && (
                      <div className="flex flex-col items-center">
                        {renderItemIcon(item.iconName)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Selected Item Detail Panel */}
            {selectedItem ? (
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-white">{selectedItem.name}</h4>
                    <span className={`text-[10px] font-semibold uppercase ${getRarityColor(selectedItem.rarity)}`}>
                      {selectedItem.rarity} · {selectedItem.type}
                    </span>
                  </div>
                  <div className="text-xs text-amber-400 font-mono font-bold">
                    売却: {selectedItem.value} G
                  </div>
                </div>

                <p className="text-[11px] text-slate-400">{selectedItem.description}</p>

                {/* Stats list */}
                {selectedItem.stats && (
                  <div className="flex flex-wrap gap-2 text-[10px] font-mono">
                    {selectedItem.stats.atk && (
                      <span className="text-rose-400">攻撃力 +{selectedItem.stats.atk}</span>
                    )}
                    {selectedItem.stats.def && (
                      <span className="text-sky-400">防御力 +{selectedItem.stats.def}</span>
                    )}
                    {selectedItem.stats.crit && (
                      <span className="text-amber-400">会心率 +{selectedItem.stats.crit}%</span>
                    )}
                    {selectedItem.stats.hp && (
                      <span className="text-emerald-400">HP +{selectedItem.stats.hp}</span>
                    )}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center gap-2 pt-1 border-t border-slate-800/80">
                  {['weapon', 'armor', 'helmet', 'boots', 'ring'].includes(selectedItem.type) ? (
                    <button
                      onClick={() => {
                        onEquipItem(selectedItem);
                        sound.playCoin();
                      }}
                      className="px-3 py-1 rounded bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs transition-colors"
                    >
                      装備する
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        onUseItem(selectedItem);
                        setSelectedItem(null);
                      }}
                      className="px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors"
                    >
                      使用する
                    </button>
                  )}

                  <button
                    onClick={() => {
                      onSellItem(selectedItem);
                      setSelectedItem(null);
                    }}
                    className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs transition-colors"
                  >
                    売却 ({selectedItem.value}G)
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-3 text-center text-xs text-slate-400 bg-slate-950/40 rounded-xl border border-slate-800">
                アイテムをクリックして詳細を確認・装備
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
