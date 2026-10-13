import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Header } from './components/Header';
import { GameCanvas } from './components/GameCanvas';
import { PlayerFrame } from './components/HUD/PlayerFrame';
import { TargetFrame } from './components/HUD/TargetFrame';
import { MiniMap } from './components/HUD/MiniMap';
import { ActionBar } from './components/HUD/ActionBar';
import { ChatBox } from './components/HUD/ChatBox';
import { QuestTracker } from './components/HUD/QuestTracker';
import { ShortcutBar } from './components/HUD/ShortcutBar';
import { MobileControls } from './components/HUD/MobileControls';

import { CharacterModal } from './components/HUD/Modals/CharacterModal';
import { InventoryModal } from './components/HUD/Modals/InventoryModal';
import { QuestLogModal } from './components/HUD/Modals/QuestLogModal';
import { WorldMapModal } from './components/HUD/Modals/WorldMapModal';
import { HelpControlsModal } from './components/HUD/Modals/HelpControlsModal';
import { ClassSelectModal } from './components/HUD/Modals/ClassSelectModal';
import { BestiaryModal } from './components/HUD/Modals/BestiaryModal';

import {
  CharacterClassId,
  PlayerStats,
  Equipment,
  Item,
  Skill,
  Enemy,
  OtherPlayer,
  WorldDrop,
  Quest,
  ChatMessage,
  ChatChannel,
  WarpPoint,
  DuelOpponent
} from './types/game';

import {
  CHARACTER_CLASSES,
  CLASS_SKILLS,
  INITIAL_ITEMS,
  WORLD_QUESTS,
  INITIAL_ENEMIES,
  INITIAL_OTHER_PLAYERS,
  WORLD_CHAT_BANTER,
  WARP_POINTS,
  DUEL_OPPONENTS,
  TUTORIAL_STEPS
} from './game/worldData';

import { sound } from './utils/audio';
import { multiplayer } from './utils/multiplayer';
import { DuelModal } from './components/HUD/Modals/DuelModal';
import { DuelArenaHUD } from './components/HUD/DuelArenaHUD';
import { TutorialOverlay } from './components/HUD/TutorialOverlay';
import { Award, Navigation, Swords, Sparkles, BookOpen } from 'lucide-react';

export default function App() {
  // --- PLAYER STATE ---
  const [playerClassId, setPlayerClassId] = useState<CharacterClassId>('paladin');
  const [level, setLevel] = useState<number>(1);
  const [exp, setExp] = useState<number>(0);
  const [maxExp, setMaxExp] = useState<number>(150);
  const [gold, setGold] = useState<number>(150);

  const [stats, setStats] = useState<PlayerStats>({
    str: 12,
    agi: 10,
    int: 6,
    vit: 14,
    unspentPoints: 3
  });

  const [equipment, setEquipment] = useState<Equipment>({
    weapon: null,
    armor: null,
    helmet: null,
    boots: null,
    ring: null
  });

  const [inventory, setInventory] = useState<Item[]>(INITIAL_ITEMS);
  const [skills, setSkills] = useState<Skill[]>(CLASS_SKILLS['paladin']);

  // Calculated Attributes
  const playerClass = CHARACTER_CLASSES[playerClassId];
  const equipStats = Object.values(equipment).reduce(
    (acc, item) => {
      if (item && item.stats) {
        acc.atk += item.stats.atk || 0;
        acc.def += item.stats.def || 0;
        acc.crit += item.stats.crit || 0;
        acc.hp += item.stats.hp || 0;
        acc.mp += item.stats.mp || 0;
      }
      return acc;
    },
    { atk: 0, def: 0, crit: 0, hp: 0, mp: 0 }
  );

  const maxHp = playerClass.baseHp + stats.vit * 16 + equipStats.hp;
  const maxMp = playerClass.baseMp + stats.int * 14 + equipStats.mp;
  const [currentHp, setCurrentHp] = useState<number>(maxHp);
  const [currentMp, setCurrentMp] = useState<number>(maxMp);

  const totalAtk = Math.round(playerClass.baseAtk + stats.str * 2.2 + stats.agi * 0.8 + equipStats.atk);
  const totalDef = Math.round(playerClass.baseDef + stats.vit * 1.0 + equipStats.def);
  const totalCrit = Math.round(playerClass.baseCrit + stats.agi * 0.5 + equipStats.crit);

  // Position & Targeting
  const [playerCoords, setPlayerCoords] = useState<{ x: number; y: number; z: number; rotation: number }>({
    x: 0,
    y: 0,
    z: 0,
    rotation: 0
  });
  const [selectedTargetId, setSelectedTargetId] = useState<string | null>(null);

  // World Entities
  const [enemies, setEnemies] = useState<Enemy[]>(INITIAL_ENEMIES);
  const [otherPlayers, setOtherPlayers] = useState<OtherPlayer[]>(INITIAL_OTHER_PLAYERS);
  const [drops, setDrops] = useState<WorldDrop[]>([]);
  const [quests, setQuests] = useState<Quest[]>(WORLD_QUESTS);

  // Chat & Toast
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'c_welcome',
      sender: 'システム',
      text: '『Aetheria Online』の世界へようこそ！WASDで移動、1~4キーでスキルを発動できます。',
      channel: 'system',
      timestamp: 'NOW'
    },
    {
      id: 'c_1',
      sender: 'ヴァルキリー_凛',
      text: 'こんにちは！新米冒険者さんですね！何かあれば手伝いますよ〜',
      channel: 'world',
      timestamp: 'NOW'
    }
  ]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Audio Toggles
  const [soundEnabled, setSoundEnabled] = useState<boolean>(sound.isSfxEnabled());
  const [bgmEnabled, setBgmEnabled] = useState<boolean>(sound.isBgmEnabled());

  // Modals
  const [isCharacterOpen, setIsCharacterOpen] = useState(false);
  const [isInventoryOpen, setIsInventoryOpen] = useState(false);
  const [isQuestsOpen, setIsQuestsOpen] = useState(false);
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isClassSelectOpen, setIsClassSelectOpen] = useState(false);
  const [isBestiaryOpen, setIsBestiaryOpen] = useState(false);
  const [isDuelOpen, setIsDuelOpen] = useState(false);
  const [isTutorialOpen, setIsTutorialOpen] = useState(true); // Open on first load as guided onboarding
  const [tutorialStepId, setTutorialStepId] = useState(1);

  // Duel State
  const [isDuelActive, setIsDuelActive] = useState(false);
  const [activeDuelOpponent, setActiveDuelOpponent] = useState<DuelOpponent | null>(null);
  const [duelOpponentHp, setDuelOpponentHp] = useState<number>(1000);

  // Proximity states
  const [nearWarpPoint, setNearWarpPoint] = useState<WarpPoint | null>(null);
  const [isNearDuelMaster, setIsNearDuelMaster] = useState(false);
  const [isAutoDash, setIsAutoDash] = useState(false);

  // Multiplayer stats
  const [onlinePlayersCount, setOnlinePlayersCount] = useState(1);
  const [ping, setPing] = useState(14);

  // Callbacks registered from GameCanvas
  const triggerSkillRef = useRef<((skill: Skill) => void) | null>(null);
  const teleportRef = useRef<((x: number, y: number, z: number) => void) | null>(null);
  const duelControllerRef = useRef<{
    setDuelActive: (active: boolean, opp: DuelOpponent | null) => void;
  } | null>(null);
  const mobileControlsRef = useRef<{
    move: (dir: { x: number; z: number }) => void;
    jump: () => void;
    dash: (active: boolean) => void;
    attack: () => void;
    tabTarget: () => void;
  } | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((cur) => (cur === msg ? null : cur));
    }, 4000);
  };

  // --- MULTIPLAYER WEBSOCKET CONNECTION ---
  useEffect(() => {
    multiplayer.init();

    multiplayer.onPlayerJoined((p) => {
      setOtherPlayers((prev) => {
        if (prev.some((x) => x.id === p.id)) return prev;
        return [
          ...prev,
          {
            id: p.id,
            name: p.name,
            classId: p.classId,
            level: p.level,
            hp: p.hp,
            maxHp: p.maxHp,
            x: p.x,
            y: p.y,
            z: p.z,
            targetX: p.x,
            targetZ: p.z,
            targetEnemyId: null,
            color: CHARACTER_CLASSES[p.classId]?.color || '#38bdf8',
            rotation: p.rotation,
            state: p.state,
            guild: p.guild,
            title: p.title
          }
        ];
      });
      showToast(`👋 冒険者【${p.name}】がログインしました！`);
      addChatMessage('システム', `冒険者【${p.name}】が大陸に降り立ちました。`, 'system');
    });

    multiplayer.onPlayerLeft((id) => {
      setOtherPlayers((prev) => prev.filter((p) => p.id !== id));
    });

    multiplayer.onPlayerMoved((data) => {
      setOtherPlayers((prev) =>
        prev.map((p) =>
          p.id === data.id
            ? {
                ...p,
                x: data.x,
                y: data.y,
                z: data.z,
                rotation: data.rotation,
                isMoving: data.isMoving,
                isDashing: data.isDashing,
                state: data.state
              }
            : p
        )
      );
    });

    multiplayer.onChatBroadcast((msg) => {
      addChatMessage(msg.sender, msg.text, msg.channel);
    });

    multiplayer.onStatusChange((st) => {
      setOnlinePlayersCount(st.playerCount);
      setPing(st.ping);
    });
  }, []);

  // --- CLASS SWITCH ---
  const handleSelectClass = (newClassId: CharacterClassId) => {
    setPlayerClassId(newClassId);
    setSkills(CLASS_SKILLS[newClassId]);
    showToast(`クラスを【${CHARACTER_CLASSES[newClassId].name}】に変更しました！`);
  };

  // --- STAT ALLOCATION ---
  const handleAllocateStat = (statKey: keyof Omit<PlayerStats, 'unspentPoints'>) => {
    if (stats.unspentPoints <= 0) return;
    setStats((prev) => ({
      ...prev,
      [statKey]: prev[statKey] + 1,
      unspentPoints: prev.unspentPoints - 1
    }));
  };

  // --- EXP & LEVEL UP ---
  const handleGainExp = (amount: number) => {
    setExp((prev) => {
      let next = prev + amount;
      if (next >= maxExp) {
        // Level UP!
        next -= maxExp;
        setLevel((curLvl) => {
          const newLvl = curLvl + 1;
          setMaxExp(Math.round(maxExp * 1.45));
          setStats((st) => ({
            ...st,
            str: st.str + 1,
            vit: st.vit + 1,
            agi: st.agi + 1,
            int: st.int + 1,
            unspentPoints: st.unspentPoints + 3
          }));
          setCurrentHp(maxHp + 80);
          setCurrentMp(maxMp + 50);
          sound.playLevelUp();
          showToast(`🎊 レベルアップ！ Lv.${newLvl} に到達しました！ (能力値+3pt)`);
          addChatMessage('システム', `レベルアップ！ Lv.${newLvl} に到達しました！`, 'system');
          return newLvl;
        });
      }
      return next;
    });
  };

  const addChatMessage = (sender: string, text: string, channel: ChatChannel) => {
    setChatMessages((prev) => [
      ...prev.slice(-50),
      {
        id: Math.random().toString(),
        sender,
        text,
        channel,
        timestamp: 'NOW'
      }
    ]);
  };

  // --- SKILL EXECUTION & COOLDOWNS ---
  const handleTriggerSkill = (skill: Skill) => {
    if (currentMp < skill.manaCost) {
      showToast('マナが不足しています！');
      return;
    }

    if (triggerSkillRef.current) {
      triggerSkillRef.current(skill);
    }

    // Deduct MP
    setCurrentMp((prev) => Math.max(0, prev - skill.manaCost));

    // Put skill on cooldown
    setSkills((prev) =>
      prev.map((s) => (s.id === skill.id ? { ...s, currentCooldown: s.cooldown } : s))
    );

    // If heal skill
    if (skill.type === 'heal') {
      const healAmount = Math.round(maxHp * 0.35);
      setCurrentHp((prev) => Math.min(maxHp, prev + healAmount));
      showToast(`💖 生命力が ${healAmount} 回復しました！`);
    }
  };

  // Tick skill cooldowns and natural MP regeneration
  useEffect(() => {
    const timer = setInterval(() => {
      setSkills((prev) =>
        prev.map((s) =>
          s.currentCooldown > 0
            ? { ...s, currentCooldown: Math.max(0, s.currentCooldown - 0.1) }
            : s
        )
      );

      // Passive HP/MP regen
      setCurrentMp((prev) => Math.min(maxHp, prev + 1.2));
      setCurrentHp((prev) => Math.min(maxHp, prev + 0.5));
    }, 100);

    return () => clearInterval(timer);
  }, [maxHp, maxMp]);

  // Periodic simulated chatter in world chat
  useEffect(() => {
    let banterIdx = 0;
    const interval = setInterval(() => {
      const chatter = WORLD_CHAT_BANTER[banterIdx % WORLD_CHAT_BANTER.length];
      banterIdx++;
      addChatMessage(chatter.sender, chatter.text, 'world');
    }, 16000);

    return () => clearInterval(interval);
  }, []);

  // --- ENEMY DAMAGE & AI LOGIC ---
  const handleDamageEnemy = useCallback(
    (enemyId: string, damage: number, isCrit: boolean) => {
      setEnemies((prev) =>
        prev.map((enemy) => {
          if (enemy.id !== enemyId || enemy.isDead) return enemy;

          const newHp = Math.max(0, enemy.hp - damage);
          const isKilled = newHp <= 0;

          addChatMessage(
            '戦闘',
            `${enemy.name} に ${damage} ダメージを与えた！${isCrit ? '【会心の一撃】' : ''}`,
            'combat'
          );

          if (isKilled) {
            sound.playMonsterDeath();
            handleGainExp(enemy.expReward);
            setGold((g) => g + enemy.goldReward);
            showToast(`⚔️ ${enemy.name} を撃破！ +${enemy.expReward} EXP, +${enemy.goldReward} G 獲得！`);

            // Update Quest progress
            setQuests((qList) =>
              qList.map((q) => {
                if (q.status === 'active' && q.targetMonsterType === enemy.type) {
                  const newCount = q.currentCount + 1;
                  const isFinished = newCount >= q.requiredCount;
                  if (isFinished) {
                    showToast(`📜 任務【${q.title}】が完了可能になりました！(Lキーで報告)`);
                    sound.playLevelUp();
                  }
                  return {
                    ...q,
                    currentCount: newCount,
                    status: isFinished ? 'completed' : 'active'
                  };
                }
                return q;
              })
            );

            // Chance to drop item
            if (Math.random() < 0.5) {
              const droppedItem: Item =
                Math.random() < 0.3
                  ? {
                      id: `drop_gear_${Date.now()}`,
                      name: enemy.isBoss ? '竜鱗の神話籠手' : '戦士の頑丈なブーツ',
                      type: 'boots',
                      rarity: enemy.isBoss ? 'epic' : 'rare',
                      description: '倒した魔物が遺した強力な防具。',
                      iconName: 'Shield',
                      stats: { def: enemy.isBoss ? 24 : 12, hp: enemy.isBoss ? 120 : 50 },
                      value: enemy.isBoss ? 500 : 150
                    }
                  : {
                      id: `drop_pot_${Date.now()}`,
                      name: '特製エリクサー (大)',
                      type: 'potion',
                      rarity: 'rare',
                      description: 'HPを350回復する上質な秘薬。',
                      iconName: 'Heart',
                      healHp: 350,
                      value: 60
                    };

              setDrops((dList) => [
                ...dList,
                {
                  id: `drop_${Date.now()}`,
                  item: droppedItem,
                  x: enemy.x,
                  y: enemy.y,
                  z: enemy.z,
                  life: 60
                }
              ]);
            }

            return {
              ...enemy,
              hp: 0,
              isDead: true,
              respawnTime: enemy.isBoss ? 25 : 10
            };
          }

          return { ...enemy, hp: newHp };
        })
      );
    },
    [handleGainExp]
  );

  // Enemy Aggro & Respawn Loop
  useEffect(() => {
    const aiInterval = setInterval(() => {
      const now = Date.now();
      const px = playerCoords.x;
      const pz = playerCoords.z;

      setEnemies((prev) =>
        prev.map((enemy) => {
          // Respawn check
          if (enemy.isDead) {
            if (enemy.respawnTime <= 1) {
              return {
                ...enemy,
                isDead: false,
                hp: enemy.maxHp,
                x: enemy.spawnX,
                z: enemy.spawnZ,
                respawnTime: 0
              };
            }
            return { ...enemy, respawnTime: enemy.respawnTime - 0.4 };
          }

          // Distance to player
          const dx = px - enemy.x;
          const dz = pz - enemy.z;
          const dist = Math.hypot(dx, dz);

          // If in aggro radius
          if (dist < enemy.aggroRadius) {
            // Chase if outside attack range
            if (dist > enemy.attackRange) {
              const speed = enemy.isBoss ? 0.35 : 0.45;
              const nx = dx / dist;
              const nz = dz / dist;
              return {
                ...enemy,
                x: enemy.x + nx * speed,
                z: enemy.z + nz * speed
              };
            }

            // Attack if ready
            if (now - enemy.lastAttackTime > enemy.attackCooldown * 1000) {
              const defMitigation = Math.floor(totalDef * 0.55);
              const incomingDmg = Math.max(
                1,
                Math.round((enemy.atk - defMitigation) * (0.85 + Math.random() * 0.3))
              );
              sound.playHit();
              setCurrentHp((hp) => {
                const nextHp = hp - incomingDmg;
                if (nextHp <= 0) {
                  showToast('💀 力尽きてしまった... サンクチュアリ中央広場で蘇生しました。');
                  addChatMessage('戦闘', 'あなたは力尽きた。中央広場でリスポーンしました。', 'combat');
                  // Respawn player at sanctuary
                  if (teleportRef.current) teleportRef.current(0, 0, 14);
                  setPlayerCoords((c) => ({ ...c, x: 0, z: 14 }));
                  return maxHp;
                }
                return nextHp;
              });

              addChatMessage('戦闘', `${enemy.name} から ${incomingDmg} のダメージを受けた！`, 'combat');

              return { ...enemy, lastAttackTime: now };
            }
          }

          return enemy;
        })
      );
    }, 400);

    return () => clearInterval(aiInterval);
  }, [playerCoords, totalDef, maxHp]);

  // --- ITEM & POTION USAGE ---
  const handleUsePotion = (type: 'hp' | 'mp') => {
    if (type === 'hp') {
      const potIdx = inventory.findIndex((i) => i.healHp && i.healHp > 0);
      if (potIdx === -1) {
        showToast('HPポーションがありません！');
        return;
      }
      const pot = inventory[potIdx];
      setCurrentHp((prev) => Math.min(maxHp, prev + (pot.healHp || 150)));
      sound.playHeal();
      showToast(`💖 HPが ${pot.healHp || 150} 回復しました！`);
      setInventory((prev) => prev.filter((_, idx) => idx !== potIdx));
    } else {
      const potIdx = inventory.findIndex((i) => i.healMp && i.healMp > 0);
      if (potIdx === -1) {
        showToast('MPポーションがありません！');
        return;
      }
      const pot = inventory[potIdx];
      setCurrentMp((prev) => Math.min(maxMp, prev + (pot.healMp || 100)));
      sound.playHeal();
      showToast(`💧 MPが ${pot.healMp || 100} 回復しました！`);
      setInventory((prev) => prev.filter((_, idx) => idx !== potIdx));
    }
  };

  const handleEquipItem = (item: Item) => {
    const slot = item.type as keyof Equipment;
    const oldItem = equipment[slot];

    setEquipment((prev) => ({ ...prev, [slot]: item }));
    setInventory((prev) => {
      const removed = prev.filter((i) => i.id !== item.id);
      return oldItem ? [...removed, oldItem] : removed;
    });

    showToast(`⚔️ 【${item.name}】を装備しました！`);
  };

  const handleUnequipItem = (slot: keyof Equipment) => {
    const item = equipment[slot];
    if (!item) return;

    if (inventory.length >= 24) {
      showToast('所持品がいっぱいで外せません！');
      return;
    }

    setEquipment((prev) => ({ ...prev, [slot]: null }));
    setInventory((prev) => [...prev, item]);
    showToast(`【${item.name}】を外しました。`);
  };

  const handleSellItem = (item: Item) => {
    setInventory((prev) => prev.filter((i) => i.id !== item.id));
    setGold((g) => g + item.value);
    sound.playCoin();
    showToast(`💰 【${item.name}】を ${item.value} G で売却しました。`);
  };

  const handlePickDrop = (dropId: string) => {
    const drop = drops.find((d) => d.id === dropId);
    if (!drop) return;

    if (inventory.length >= 24) {
      showToast('所持品がいっぱいです！');
      return;
    }

    setDrops((prev) => prev.filter((d) => d.id !== dropId));
    setInventory((prev) => [...prev, drop.item]);
    showToast(`🎁 【${drop.item.name}】を拾得しました！`);
  };

  // --- QUEST ACTIONS ---
  const handleAcceptQuest = (questId: string) => {
    setQuests((prev) =>
      prev.map((q) => (q.id === questId ? { ...q, status: 'active', currentCount: 0 } : q))
    );
    showToast('📜 任務を受注しました！');
  };

  const handleTurnInQuest = (questId: string) => {
    const quest = quests.find((q) => q.id === questId);
    if (!quest) return;

    handleGainExp(quest.expReward);
    setGold((g) => g + quest.goldReward);
    if (quest.itemReward) {
      setInventory((prev) => [...prev, quest.itemReward!]);
    }

    setQuests((prev) =>
      prev.map((q) => (q.id === questId ? { ...q, status: 'turned_in' } : q))
    );

    showToast(`🎉 任務【${quest.title}】完了！ +${quest.expReward} EXP, +${quest.goldReward} G 獲得！`);
  };

  // --- TELEPORT & WARP ---
  const handleTeleport = (x: number, y: number, z: number, name: string) => {
    if (teleportRef.current) {
      teleportRef.current(x, y, z);
    }
    setPlayerCoords((c) => ({ ...c, x, z }));
    sound.playWarp();
    showToast(`🌀 【${name}】へ空間跳躍しました！`);
    addChatMessage('システム', `【${name}】へ空間跳躍しました。`, 'system');
    if (tutorialStepId === 4) {
      setTutorialStepId(5);
      showToast('✨ チュートリアル「転送門の活用」達成！');
    }
  };

  // --- DUEL ARENA HANDLERS ---
  const handleStartDuel = (opp: DuelOpponent) => {
    setActiveDuelOpponent(opp);
    setDuelOpponentHp(opp.maxHp);
    setIsDuelActive(true);
    if (teleportRef.current) {
      teleportRef.current(14, 0, 26);
    }
    setPlayerCoords((c) => ({ ...c, x: 14, z: 26 }));
    if (duelControllerRef.current) {
      duelControllerRef.current.setDuelActive(true, opp);
    }
    sound.playFanfare();
    showToast(`⚔️ 【${opp.name}】との武芸決闘が開始されました！`);
    addChatMessage('戦闘', `【${opp.name}】との真剣勝負が開始されました！`, 'combat');
  };

  const handleDuelForfeit = () => {
    if (duelControllerRef.current) {
      duelControllerRef.current.setDuelActive(false, null);
    }
    setIsDuelActive(false);
    setActiveDuelOpponent(null);
    showToast('決闘を降参しました。');
    addChatMessage('戦闘', '決闘を中断しました。', 'combat');
  };

  const handleDuelVictory = (opp: DuelOpponent) => {
    if (duelControllerRef.current) {
      duelControllerRef.current.setDuelActive(false, null);
    }
    setIsDuelActive(false);
    setActiveDuelOpponent(null);
    sound.playFanfare();
    handleGainExp(opp.rewardExp);
    setGold((g) => g + opp.rewardGold);
    showToast(
      `🏆 決闘勝利！【${opp.name}】を撃破！ +${opp.rewardExp} EXP, +${opp.rewardGold} G, 称号【${opp.rewardTitle}】獲得！`
    );
    addChatMessage(
      'システム',
      `【決闘勝利】${opp.name}との勝負に勝利し、称号【${opp.rewardTitle}】を獲得しました！`,
      'system'
    );
    if (tutorialStepId === 5) {
      handleCompleteTutorial();
    }
  };

  const handleDuelDamageTaken = (dmg: number) => {
    const defMitigation = Math.floor(totalDef * 0.45);
    const netDmg = Math.max(2, dmg - defMitigation);
    setCurrentHp((hp) => {
      const nextHp = hp - netDmg;
      if (nextHp <= 0) {
        handleDuelForfeit();
        showToast('💀 決闘で敗北しました... 中央広場で体力を回復しました。');
        if (teleportRef.current) teleportRef.current(0, 0, 14);
        setPlayerCoords((c) => ({ ...c, x: 0, z: 14 }));
        return maxHp;
      }
      return nextHp;
    });
    addChatMessage('戦闘', `決闘相手から ${netDmg} の打撃を受けた！`, 'combat');
  };

  const handleCompleteTutorial = () => {
    handleGainExp(350);
    setGold((g) => g + 250);
    setIsTutorialOpen(false);
    sound.playFanfare();
    showToast('🎉 入門チュートリアル修練完了！ +350 EXP & +250 G 獲得！');
    addChatMessage(
      'システム',
      '入門チュートリアルを全課程修了し、一人前の冒険者として承認されました！',
      'system'
    );
  };

  // Hotkey listeners for UI panels
  useEffect(() => {
    const handleGlobalKeys = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === 'INPUT') return;

      const key = e.key.toLowerCase();
      if (key === 'c') setIsCharacterOpen((v) => !v);
      if (key === 'i') setIsInventoryOpen((v) => !v);
      if (key === 'l') setIsQuestsOpen((v) => !v);
      if (key === 'b') setIsBestiaryOpen((v) => !v);
      if (key === 'm') setIsMapOpen((v) => !v);
      if (key === 'h') setIsHelpOpen((v) => !v);
      if (key === 'q') handleUsePotion('hp');
      if (key === 'e') {
        if (nearWarpPoint) {
          setIsMapOpen(true);
        } else if (isNearDuelMaster) {
          setIsDuelOpen(true);
        } else {
          handleUsePotion('mp');
        }
      }
      if (key === 'f') {
        if (nearWarpPoint) setIsMapOpen(true);
        if (isNearDuelMaster) setIsDuelOpen(true);
      }

      // Skill hotkeys 1, 2, 3, 4, 5, r
      const skillMatch = skills.find((s) => s.key.toLowerCase() === key);
      if (skillMatch && skillMatch.currentCooldown <= 0) {
        handleTriggerSkill(skillMatch);
      }
    };

    window.addEventListener('keydown', handleGlobalKeys);
    return () => window.removeEventListener('keydown', handleGlobalKeys);
  }, [skills, currentMp, inventory, nearWarpPoint, isNearDuelMaster]);

  const targetEnemy = enemies.find((e) => e.id === selectedTargetId) || null;

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 flex flex-col font-sans">
      {/* Universal Top Bar */}
      <Header
        onOpenClassSelect={() => setIsClassSelectOpen(true)}
        onOpenMap={() => setIsMapOpen(true)}
        onOpenCharacter={() => setIsCharacterOpen(true)}
        onOpenQuests={() => setIsQuestsOpen(true)}
        onOpenBestiary={() => setIsBestiaryOpen(true)}
        onOpenHelp={() => setIsHelpOpen(true)}
        onOpenWarps={() => setIsMapOpen(true)}
        onOpenDuel={() => setIsDuelOpen(true)}
        onOpenTutorial={() => setIsTutorialOpen((v) => !v)}
        onlinePlayersCount={onlinePlayersCount}
        ping={ping}
      />

      {/* Main 3D Viewport with HUD Overlays */}
      <div className="relative flex-1 w-full h-full overflow-hidden">
        {/* 3D WebGL Canvas Layer */}
        <GameCanvas
          playerClassId={playerClassId}
          enemies={enemies}
          otherPlayers={otherPlayers}
          drops={drops}
          isAutoDash={isAutoDash}
          onPlayerPosChange={(x, y, z, rot) => setPlayerCoords({ x, y, z, rotation: rot })}
          onTargetSelect={(tId) => setSelectedTargetId(tId)}
          selectedTargetId={selectedTargetId}
          onDamageEnemy={handleDamageEnemy}
          onPlayerDamaged={(amount) => setCurrentHp((hp) => Math.max(0, hp - amount))}
          onPickDrop={handlePickDrop}
          onTriggerSkillRegister={(fn) => {
            triggerSkillRef.current = fn;
          }}
          onMobileControlRegister={(controls) => {
            mobileControlsRef.current = controls;
          }}
          onNearWarpPortal={(wp) => setNearWarpPoint(wp)}
          onNearDuelMaster={(isNear) => setIsNearDuelMaster(isNear)}
          onDuelDamageTaken={handleDuelDamageTaken}
          onDuelVictory={handleDuelVictory}
          onRegisterTeleport={(fn) => {
            teleportRef.current = fn;
          }}
          onRegisterDuelController={(ctrl) => {
            duelControllerRef.current = ctrl;
          }}
        />

        {/* Active Duel Boss Banner */}
        {isDuelActive && activeDuelOpponent && (
          <DuelArenaHUD
            opponent={activeDuelOpponent}
            currentOpponentHp={duelOpponentHp}
            onForfeit={handleDuelForfeit}
          />
        )}

        {/* Tutorial Overlay Guide */}
        {isTutorialOpen && (
          <TutorialOverlay
            currentStepId={tutorialStepId}
            onNextStep={() => setTutorialStepId((id) => Math.min(5, id + 1))}
            onClose={() => setIsTutorialOpen(false)}
            onCompleteTutorial={handleCompleteTutorial}
          />
        )}

        {/* Proximity Interaction Prompts */}
        {nearWarpPoint && !isMapOpen && (
          <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-30 animate-bounce pointer-events-auto">
            <button
              onClick={() => setIsMapOpen(true)}
              className="px-4 py-2.5 rounded-2xl bg-sky-950/90 hover:bg-sky-900 border-2 border-sky-400 text-sky-200 font-bold text-xs shadow-2xl backdrop-blur-md flex items-center gap-2 transition-all active:scale-95"
            >
              <Navigation className="w-4 h-4 text-sky-300 animate-spin" />
              <span>
                空間転送門【{nearWarpPoint.name}】が共鳴中！【E】またはタップで転送地図を開く
              </span>
            </button>
          </div>
        )}

        {isNearDuelMaster && !isDuelActive && !isDuelOpen && (
          <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-30 animate-bounce pointer-events-auto">
            <button
              onClick={() => setIsDuelOpen(true)}
              className="px-4 py-2.5 rounded-2xl bg-amber-950/90 hover:bg-amber-900 border-2 border-amber-400 text-amber-200 font-bold text-xs shadow-2xl backdrop-blur-md flex items-center gap-2 transition-all active:scale-95"
            >
              <Swords className="w-4 h-4 text-amber-300 animate-pulse" />
              <span>
                決闘指南役 アルトリウス『手合わせを所望か？』【E】またはタップで対戦申請
              </span>
            </button>
          </div>
        )}

        {/* --- HUD OVERLAYS LAYER (Semantic DOM pointer-events-none) --- */}
        <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 sm:p-5 z-20">
          {/* Top Row: Player Frame (Left), Target Frame (Center), MiniMap (Right) */}
          <div className="flex items-start justify-between gap-4">
            <PlayerFrame
              playerClass={playerClass}
              level={level}
              hp={currentHp}
              maxHp={maxHp}
              mp={currentMp}
              maxMp={maxMp}
              gold={gold}
              onOpenCharacter={() => setIsCharacterOpen(true)}
              onOpenHelp={() => setIsHelpOpen(true)}
              soundEnabled={soundEnabled}
              onToggleSound={() => setSoundEnabled(sound.toggleSfx())}
              bgmEnabled={bgmEnabled}
              onToggleBgm={() => setBgmEnabled(sound.toggleBgm())}
            />

            {/* Target Enemy Frame (Center) */}
            <div className="hidden sm:block">
              <TargetFrame
                target={targetEnemy}
                onClearTarget={() => setSelectedTargetId(null)}
              />
            </div>

            {/* Mini-map & Active Quest Tracker (Right) */}
            <div className="flex flex-col items-end gap-3">
              <MiniMap
                playerX={playerCoords.x}
                playerZ={playerCoords.z}
                playerRotation={playerCoords.rotation}
                enemies={enemies}
                otherPlayers={otherPlayers}
                onOpenWorldMap={() => setIsMapOpen(true)}
              />

              <div className="hidden lg:block">
                <QuestTracker
                  quests={quests}
                  onOpenQuestLog={() => setIsQuestsOpen(true)}
                />
              </div>
            </div>
          </div>

          {/* Target Frame on mobile if target selected */}
          <div className="sm:hidden self-center">
            <TargetFrame
              target={targetEnemy}
              onClearTarget={() => setSelectedTargetId(null)}
            />
          </div>

          {/* Bottom Row: ChatBox (Left), ActionBar (Center), ShortcutBar (Right) */}
          <div className="flex items-end justify-between gap-4">
            {/* Multi-channel Chat */}
            <div className="hidden md:block">
              <ChatBox
                messages={chatMessages}
                onSendMessage={(text, ch) => {
                  addChatMessage('あなた', text, ch);
                  multiplayer.sendChat(text, ch);
                }}
              />
            </div>

            {/* Combat Action Bar & EXP Progress */}
            <div className="w-full sm:w-auto flex justify-center">
              <ActionBar
                skills={skills}
                onTriggerSkill={handleTriggerSkill}
                inventory={inventory}
                onUsePotion={handleUsePotion}
                currentMp={currentMp}
                currentExp={exp}
                maxExp={maxExp}
                level={level}
              />
            </div>

            {/* Shortcuts Panel */}
            <div className="hidden sm:block">
              <ShortcutBar
                onOpenCharacter={() => setIsCharacterOpen(true)}
                onOpenInventory={() => setIsInventoryOpen(true)}
                onOpenQuests={() => setIsQuestsOpen(true)}
                onOpenBestiary={() => setIsBestiaryOpen(true)}
                onOpenMap={() => setIsMapOpen(true)}
                onOpenSkills={() => setIsClassSelectOpen(true)}
                onOpenHelp={() => setIsHelpOpen(true)}
                onOpenWarps={() => setIsMapOpen(true)}
                onOpenDuel={() => setIsDuelOpen(true)}
                isAutoDash={isAutoDash}
                onToggleAutoDash={() => setIsAutoDash((v) => !v)}
                hasUnspentPoints={stats.unspentPoints > 0}
              />
            </div>
          </div>
        </div>

        {/* Mobile Virtual Joystick & Touch Action Buttons */}
        <MobileControls
          onMoveChange={(dir) => {
            if (mobileControlsRef.current) mobileControlsRef.current.move(dir);
          }}
          onJump={() => {
            if (mobileControlsRef.current) mobileControlsRef.current.jump();
          }}
          onTabTarget={() => {
            if (mobileControlsRef.current) mobileControlsRef.current.tabTarget();
          }}
          onAttack={() => {
            if (mobileControlsRef.current) mobileControlsRef.current.attack();
          }}
          onDash={(active) => {
            if (mobileControlsRef.current) mobileControlsRef.current.dash(active);
          }}
        />

        {/* Global Floating Toast Alert */}
        {toastMessage && (
          <div className="fixed top-18 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl bg-slate-950/90 text-amber-300 font-bold text-xs shadow-2xl border border-amber-500/60 backdrop-blur-md animate-in fade-in slide-in-from-top-2 flex items-center gap-2 select-none">
            <Award className="w-4 h-4 text-amber-400" />
            <span>{toastMessage}</span>
          </div>
        )}
      </div>

      {/* --- MODAL DIALOGS --- */}
      <CharacterModal
        isOpen={isCharacterOpen}
        onClose={() => setIsCharacterOpen(false)}
        playerClass={playerClass}
        level={level}
        stats={stats}
        onAllocatePoint={handleAllocateStat}
        equipment={equipment}
        totalAtk={totalAtk}
        totalDef={totalDef}
        totalCrit={totalCrit}
        maxHp={maxHp}
        maxMp={maxMp}
        gold={gold}
      />

      <InventoryModal
        isOpen={isInventoryOpen}
        onClose={() => setIsInventoryOpen(false)}
        inventory={inventory}
        equipment={equipment}
        onEquipItem={handleEquipItem}
        onUnequipItem={handleUnequipItem}
        onUseItem={(item) => {
          if (item.healHp) handleUsePotion('hp');
          if (item.healMp) handleUsePotion('mp');
        }}
        onSellItem={handleSellItem}
        gold={gold}
      />

      <QuestLogModal
        isOpen={isQuestsOpen}
        onClose={() => setIsQuestsOpen(false)}
        quests={quests}
        onAcceptQuest={handleAcceptQuest}
        onTurnInQuest={handleTurnInQuest}
      />

      <WorldMapModal
        isOpen={isMapOpen}
        onClose={() => setIsMapOpen(false)}
        playerX={playerCoords.x}
        playerZ={playerCoords.z}
        onWarpTo={handleTeleport}
      />

      <BestiaryModal
        isOpen={isBestiaryOpen}
        onClose={() => setIsBestiaryOpen(false)}
      />

      <DuelModal
        isOpen={isDuelOpen}
        onClose={() => setIsDuelOpen(false)}
        onStartDuel={handleStartDuel}
      />

      <HelpControlsModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
      />

      <ClassSelectModal
        isOpen={isClassSelectOpen}
        onClose={() => setIsClassSelectOpen(false)}
        currentClassId={playerClassId}
        onSelectClass={handleSelectClass}
      />
    </div>
  );
}
