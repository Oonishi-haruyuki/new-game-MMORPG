import { CharacterClass, Skill, Item, Quest, Enemy, OtherPlayer, EnemyType, WarpPoint, DuelOpponent, TutorialStep } from '../types/game';

// Image paths from batch generation
export const CLASS_PORTRAITS = {
  paladin: '/src/assets/images/class_paladin_1791854504508.jpg',
  mage: '/src/assets/images/class_mage_1791854504704.jpg',
  ranger: '/src/assets/images/class_ranger_1791854505301.jpg',
  banner: '/src/assets/images/mmorpg_banner_1791854505421.jpg'
};

export const CHARACTER_CLASSES: Record<string, CharacterClass> = {
  paladin: {
    id: 'paladin',
    name: 'パラディン (聖騎士)',
    role: '近接タンク / 防御型アタッカー',
    description: '聖なる光の加護を受け、強固な大盾と神聖剣で前線を維持する歴戦の守護者。高い生命力と防御力を誇る。',
    portrait: CLASS_PORTRAITS.paladin,
    baseHp: 650,
    baseMp: 200,
    baseAtk: 45,
    baseDef: 30,
    baseCrit: 8,
    baseSpeed: 9.5,
    color: '#38bdf8'
  },
  mage: {
    id: 'mage',
    name: 'アルケインメイジ (魔導士)',
    role: '遠距離魔法 / 広範囲殲滅アタッカー',
    description: '星辰と古代ルーンの秘術を操る大魔導士。圧倒的な火力と広範囲氷結・火炎魔法で群がる敵を一掃する。',
    portrait: CLASS_PORTRAITS.mage,
    baseHp: 380,
    baseMp: 480,
    baseAtk: 68,
    baseDef: 12,
    baseCrit: 18,
    baseSpeed: 9.0,
    color: '#c084fc'
  },
  ranger: {
    id: 'ranger',
    name: 'シャドウレンジャー (狩人)',
    role: '中遠距離 / 敏捷連射・会心スナイパー',
    description: '風を味方につけ、俊敏なフットワークと百発百中の精密連射で敵の急所を射抜くエルフの森の狩人。',
    portrait: CLASS_PORTRAITS.ranger,
    baseHp: 440,
    baseMp: 280,
    baseAtk: 58,
    baseDef: 18,
    baseCrit: 28,
    baseSpeed: 11.0,
    color: '#4ade80'
  }
};

export const CLASS_SKILLS: Record<string, Skill[]> = {
  paladin: [
    {
      id: 'p_slash',
      key: '1',
      name: '聖光の斬撃',
      description: '聖光を纏った大剣で敵を一閃する基本攻撃。【クールタイムなし】',
      cooldown: 0.0,
      currentCooldown: 0,
      manaCost: 0,
      damageMultiplier: 1.2,
      range: 4.5,
      radius: 2.0,
      type: 'melee',
      color: '#38bdf8',
      icon: 'Sword'
    },
    {
      id: 'p_whirlwind',
      key: '2',
      name: 'スピンスマッシュ',
      description: '大盾と剣を旋回させ、周囲の敵全員に強打を与える。【CT: 3秒】',
      cooldown: 3.0,
      currentCooldown: 0,
      manaCost: 20,
      damageMultiplier: 2.2,
      range: 5.5,
      radius: 6.0,
      type: 'aoe',
      color: '#60a5fa',
      icon: 'RotateCw'
    },
    {
      id: 'p_shieldbash',
      key: '3',
      name: 'シールドバッシュ',
      description: '重盾を敵に叩きつけ、大ダメージとノックバックを与える。【CT: 4秒】',
      cooldown: 4.0,
      currentCooldown: 0,
      manaCost: 25,
      damageMultiplier: 2.6,
      range: 4.0,
      radius: 2.5,
      type: 'melee',
      color: '#e0f2fe',
      icon: 'ShieldAlert'
    },
    {
      id: 'p_heal',
      key: '4',
      name: '聖なる祈り',
      description: '天の加護を仰ぎ、自身のHPを最大値の35%回復する。【CT: 10秒】',
      cooldown: 10.0,
      currentCooldown: 0,
      manaCost: 45,
      damageMultiplier: 0,
      range: 0,
      radius: 0,
      type: 'heal',
      color: '#fbbf24',
      icon: 'HeartHandshake'
    },
    {
      id: 'p_ultimate',
      key: 'R',
      name: '神聖審判の雷',
      description: '【ULTIMATE】天から巨光の剣を召喚し、広範囲の敵に致命的な裁きの打撃を放つ。【CT: 25秒】',
      cooldown: 25.0,
      currentCooldown: 0,
      manaCost: 90,
      damageMultiplier: 5.5,
      range: 12.0,
      radius: 10.0,
      type: 'aoe',
      color: '#facc15',
      icon: 'Sparkles'
    }
  ],
  mage: [
    {
      id: 'm_bolt',
      key: '1',
      name: 'アルケイン弾',
      description: '純粋な魔力球を高速射出して敵を貫く。【クールタイムなし】',
      cooldown: 0.0,
      currentCooldown: 0,
      manaCost: 4,
      damageMultiplier: 1.3,
      range: 16.0,
      radius: 2.0,
      type: 'projectile',
      color: '#c084fc',
      icon: 'Zap'
    },
    {
      id: 'm_fireball',
      key: '2',
      name: 'インフェルノボム',
      description: '灼熱の火球を放ち、着弾地点を大爆破する。【CT: 3秒】',
      cooldown: 3.0,
      currentCooldown: 0,
      manaCost: 30,
      damageMultiplier: 2.8,
      range: 18.0,
      radius: 5.5,
      type: 'projectile',
      color: '#f97316',
      icon: 'Flame'
    },
    {
      id: 'm_frost',
      key: '3',
      name: 'フロストノヴァ',
      description: '周囲の冷気を爆発させ、周囲の敵を凍結させダメージを与える。【CT: 4秒】',
      cooldown: 4.0,
      currentCooldown: 0,
      manaCost: 35,
      damageMultiplier: 2.2,
      range: 7.0,
      radius: 8.0,
      type: 'aoe',
      color: '#38bdf8',
      icon: 'Snowflake'
    },
    {
      id: 'm_barrier',
      key: '4',
      name: 'マナ障壁',
      description: '魔力の結界を展開し、生命力を回復しつつ防御を固める。【CT: 10秒】',
      cooldown: 10.0,
      currentCooldown: 0,
      manaCost: 50,
      damageMultiplier: 0,
      range: 0,
      radius: 0,
      type: 'heal',
      color: '#a855f7',
      icon: 'Shield'
    },
    {
      id: 'm_ultimate',
      key: 'R',
      name: 'メテオストーム',
      description: '【ULTIMATE】虚空より巨大隕石を召喚し、戦場全体を焼き尽くす天変地異。【CT: 25秒】',
      cooldown: 25.0,
      currentCooldown: 0,
      manaCost: 110,
      damageMultiplier: 6.2,
      range: 20.0,
      radius: 12.0,
      type: 'aoe',
      color: '#ef4444',
      icon: 'Sparkles'
    }
  ],
  ranger: [
    {
      id: 'r_shot',
      key: '1',
      name: '精霊の精密矢',
      description: '研ぎ澄まされた集中力で敵の弱点を射抜く。【クールタイムなし】',
      cooldown: 0.0,
      currentCooldown: 0,
      manaCost: 0,
      damageMultiplier: 1.25,
      range: 18.0,
      radius: 1.5,
      type: 'projectile',
      color: '#4ade80',
      icon: 'Crosshair'
    },
    {
      id: 'r_multishot',
      key: '2',
      name: 'マルチスプレッド',
      description: '扇状に5本の光矢を同時発射し、複数の敵を一斉射撃。【CT: 3秒】',
      cooldown: 3.0,
      currentCooldown: 0,
      manaCost: 20,
      damageMultiplier: 2.4,
      range: 16.0,
      radius: 7.0,
      type: 'aoe',
      color: '#22c55e',
      icon: 'Wind'
    },
    {
      id: 'r_poison',
      key: '3',
      name: '毒蛇の矢刃',
      description: '猛毒を塗った特殊矢を撃ち込み、強力な継続毒ダメージを与える。【CT: 4秒】',
      cooldown: 4.0,
      currentCooldown: 0,
      manaCost: 25,
      damageMultiplier: 2.7,
      range: 17.0,
      radius: 2.5,
      type: 'projectile',
      color: '#a3e635',
      icon: 'Skull'
    },
    {
      id: 'r_potion',
      key: '4',
      name: '野伏の応急処置',
      description: '薬草の知識を用いて即座に体力を癒やす。【CT: 10秒】',
      cooldown: 10.0,
      currentCooldown: 0,
      manaCost: 30,
      damageMultiplier: 0,
      range: 0,
      radius: 0,
      type: 'heal',
      color: '#10b981',
      icon: 'Heart'
    },
    {
      id: 'r_ultimate',
      key: 'R',
      name: 'アローテンペスト',
      description: '【ULTIMATE】無数の風刃矢の豪雨を降らせ、標的地点を徹底的に壊滅させる。【CT: 25秒】',
      cooldown: 25.0,
      currentCooldown: 0,
      manaCost: 85,
      damageMultiplier: 5.8,
      range: 18.0,
      radius: 10.0,
      type: 'aoe',
      color: '#16a34a',
      icon: 'Sparkles'
    }
  ]
};

export const INITIAL_ITEMS: Item[] = [
  {
    id: 'hp_potion_1',
    name: '癒やしの霊薬 (小)',
    type: 'potion',
    rarity: 'common',
    description: '瞬時に体力を180回復する冒険者の必需品。',
    iconName: 'Heart',
    healHp: 180,
    value: 20
  },
  {
    id: 'hp_potion_2',
    name: '癒やしの霊薬 (小)',
    type: 'potion',
    rarity: 'common',
    description: '瞬時に体力を180回復する冒険者の必需品。',
    iconName: 'Heart',
    healHp: 180,
    value: 20
  },
  {
    id: 'mp_potion_1',
    name: '魔力の霊水 (小)',
    type: 'potion',
    rarity: 'common',
    description: '瞬時にマナを120回復する青い小瓶。',
    iconName: 'Droplet',
    healMp: 120,
    value: 25
  },
  {
    id: 'apprentice_ring',
    name: '見習い星屑の指輪',
    type: 'ring',
    rarity: 'rare',
    description: '微小な魔石が埋め込まれた指輪。会心率が向上する。',
    iconName: 'Sparkle',
    stats: { crit: 5, hp: 40 },
    value: 120
  }
];

export const WORLD_QUESTS: Quest[] = [
  {
    id: 'q1',
    title: 'エメラルド・スライムの討伐',
    description: 'サンクチュアリ周辺の草原で異常繁殖したスライムを5体撃破して平穏を取り戻せ。',
    giverName: '衛兵隊長 レオン',
    targetMonsterType: 'slime',
    currentCount: 0,
    requiredCount: 5,
    expReward: 250,
    goldReward: 150,
    itemReward: {
      id: 'iron_blade',
      name: '精錬された鋼鉄の刃',
      type: 'weapon',
      rarity: 'rare',
      description: '王都の鍛冶職人が鍛え上げた実戦用の上質な武器。',
      iconName: 'Sword',
      stats: { atk: 18, crit: 4 },
      value: 200
    },
    status: 'available'
  },
  {
    id: 'q2',
    title: '宵闇の影狼の駆除',
    description: '深き森の街道を徘徊し、旅人を脅かす影狼を4体討伐せよ。',
    giverName: '狩人 アリア',
    targetMonsterType: 'forest_wolf',
    currentCount: 0,
    requiredCount: 4,
    expReward: 500,
    goldReward: 300,
    itemReward: {
      id: 'leather_armor_plus',
      name: '影歩きの強化装甲',
      type: 'armor',
      rarity: 'rare',
      description: '硬質レザーを重ね合わせ、動きやすさと防御力を両立した鎧。',
      iconName: 'Shield',
      stats: { def: 16, hp: 80 },
      value: 350
    },
    status: 'available'
  },
  {
    id: 'q3',
    title: '古代遺跡の骸骨兵の浄化',
    description: '旧文明の遺跡を守護する不死のスケルトン戦士を4体浄化せよ。',
    giverName: '神官長 エレナ',
    targetMonsterType: 'skeleton_warrior',
    currentCount: 0,
    requiredCount: 4,
    expReward: 900,
    goldReward: 500,
    itemReward: {
      id: 'crystal_pendant',
      name: '星霊の輝晶アミュレット',
      type: 'ring',
      rarity: 'epic',
      description: '古代の聖霊石が封じられた首飾り。最大HPとマナを底上げする。',
      iconName: 'Gem',
      stats: { hp: 150, mp: 100, crit: 8 },
      value: 650
    },
    status: 'available'
  },
  {
    id: 'q4',
    title: '結晶の峡谷：ゴーレム粉砕',
    description: '水晶の魔力で駆動する岩石ゴーレムを3体討伐し、魔鉱石サンプルを確保せよ。',
    giverName: '錬金術師 ソル',
    targetMonsterType: 'crystal_golem',
    currentCount: 0,
    requiredCount: 3,
    expReward: 1600,
    goldReward: 850,
    itemReward: {
      id: 'titan_shield',
      name: '泰山巨人の重甲冑',
      type: 'armor',
      rarity: 'epic',
      description: 'ゴーレムの結晶石で補強された重鎧。鉄壁の防御力を付与する。',
      iconName: 'Shield',
      stats: { def: 35, hp: 260 },
      value: 1200
    },
    status: 'available'
  },
  {
    id: 'q5',
    title: '【WORLD BOSS RAID】火竜イグニスの討伐',
    description: '大火山の火口に君臨する古の支配者『獄炎竜イグニス』を討伐し、エセリア大陸を救え！',
    giverName: '最高議長 ヴァレリウス',
    targetMonsterType: 'boss_dragon',
    currentCount: 0,
    requiredCount: 1,
    expReward: 5000,
    goldReward: 3500,
    itemReward: {
      id: 'dragon_god_weapon',
      name: '滅竜神の天光聖剣 [LEGENDARY]',
      type: 'weapon',
      rarity: 'legendary',
      description: '竜王の血と神聖の炎で鍛造された究極の宝剣。圧倒的な威力を解き放つ。',
      iconName: 'Crown',
      stats: { atk: 65, crit: 20, hp: 200 },
      value: 5000
    },
    status: 'available'
  }
];

export interface BestiaryEntry {
  type: EnemyType;
  name: string;
  category: '森林・草原' | '古代遺跡' | '水晶峡谷' | '灼熱火山' | '星辰・虚空';
  level: number;
  hp: number;
  atk: number;
  def: number;
  exp: number;
  gold: number;
  description: string;
  location: string;
  dropName: string;
  isBoss?: boolean;
  isElite?: boolean;
}

export const WARP_POINTS: WarpPoint[] = [
  {
    id: 'wp_sanctuary',
    name: 'サンクチュアリ中央転送門',
    zone: 'サンクチュアリ中央広場',
    x: 0,
    y: 0,
    z: 14,
    color: '#38bdf8',
    description: '安全地帯。噴水広場、鍛冶屋、任務掲示板があるエセリアの中心都市。',
    unlocked: true
  },
  {
    id: 'wp_forest',
    name: 'エメラルド森林・古樹前',
    zone: '深緑の街道',
    x: 45,
    y: 0,
    z: -8,
    color: '#4ade80',
    description: 'スライムやフォレストウルフが生息する広大な原生林地帯。',
    unlocked: true
  },
  {
    id: 'wp_ruins',
    name: '古代遺跡・崩壊神殿門',
    zone: '古代遺跡',
    x: -45,
    y: 0,
    z: 42,
    color: '#c084fc',
    description: '骸骨兵やレイス、死霊魔導士リッチが徘徊する禁忌の神殿。',
    unlocked: true
  },
  {
    id: 'wp_crystal',
    name: '水晶峡谷・紫紺の晶洞',
    zone: '水晶峡谷',
    x: -65,
    y: 0,
    z: -50,
    color: '#a855f7',
    description: '結晶蜘蛛や水晶ゴーレムが守る神秘的なアメジストの峡谷。',
    unlocked: true
  },
  {
    id: 'wp_volcano',
    name: '灼熱火山・カルデラ前哨',
    zone: '灼熱火山',
    x: 82,
    y: 0,
    z: 75,
    color: '#f97316',
    description: '溶岩流と火炎ドレイク、ワールドボス獄炎竜イグニスの巣穴。',
    unlocked: true
  },
  {
    id: 'wp_arena',
    name: '修練闘技場・決闘陣',
    zone: 'サンクチュアリ闘技場',
    x: 18,
    y: 0,
    z: 26,
    color: '#facc15',
    description: '決闘師範アルトリウスが待つ武術の闘技場。NPCとの真剣勝負が可能。',
    unlocked: true
  }
];

export const DUEL_OPPONENTS: DuelOpponent[] = [
  {
    id: 'duel_leo',
    name: '見習い剣士 レオ',
    title: '駆け出しの誓い',
    classId: 'paladin',
    level: 3,
    maxHp: 420,
    atk: 14,
    def: 12,
    description: '基本に忠実な剣技を学ぶ若き騎士候補生。新米冒険者の手合わせに最適。',
    rewardGold: 150,
    rewardExp: 300,
    rewardTitle: '若き日の好敵手'
  },
  {
    id: 'duel_iris',
    name: '氷結の魔導士 イリス',
    title: '蒼氷の詠唱者',
    classId: 'mage',
    level: 8,
    maxHp: 680,
    atk: 24,
    def: 16,
    description: '距離を取りながらフロストノヴァと氷弾を連続詠唱する気鋭のエルフ術士。',
    rewardGold: 400,
    rewardExp: 800,
    rewardTitle: '氷華を砕く者'
  },
  {
    id: 'duel_raven',
    name: '影刃の暗殺者 レイヴン',
    title: '神速の黒羽',
    classId: 'ranger',
    level: 14,
    maxHp: 1100,
    atk: 36,
    def: 22,
    description: '俊敏なフットワークで死角へ回り込み、毒矢と精密連射を叩き込んでくる歴戦の狩人。',
    rewardGold: 900,
    rewardExp: 1800,
    rewardTitle: '影を捉えし達人'
  },
  {
    id: 'duel_artorius',
    name: '剣聖 アルトリウス',
    title: '不敗の神聖守護者',
    classId: 'paladin',
    level: 20,
    maxHp: 2800,
    atk: 52,
    def: 40,
    description: 'かつて竜をも討ち払った王国最高峰の剣聖。神聖な衝撃波と鉄壁の大盾を操る。',
    rewardGold: 2500,
    rewardExp: 5000,
    rewardTitle: '剣聖を越えし神話'
  }
];

export const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 1,
    title: '移動とダッシュの基本',
    objective: '移動キーまたはShiftキーで前方にダッシュしてみよう',
    hint: '【WASD】キーで自由に移動できます。また、【Shift】キーを押すだけでも瞬時に前方へ高速ダッシュが可能です！',
    keyGuide: 'WASD または Shiftキー'
  },
  {
    id: 2,
    title: 'カメラ視点操作とズーム',
    objective: 'マウスドラッグで周囲を見渡し、ホイールでズームしよう',
    hint: '画面上で【右/左ドラッグ】するとカメラが360度旋回します。【マウスホイール】で遠近のズームイン・アウトが可能です。',
    keyGuide: 'マウスドラッグ & ホイール'
  },
  {
    id: 3,
    title: 'ターゲット選択とスキル攻撃',
    objective: 'モンスターをターゲットしてスキル(1〜5)で攻撃してみよう',
    hint: '敵をクリックするか【Tab】キーで最寄りの敵を選択！【1】キーでクールタイムなしの基本技、【2〜4】や【R】キーで必殺技を発動！',
    keyGuide: 'Tab / 1〜4キー / Rキー'
  },
  {
    id: 4,
    title: '空間転送門（ワープポイント）',
    objective: 'マップ上の光る転送門に入り、別バイオームへワープしよう',
    hint: 'サンクチュアリ中央や各バイオームに青く輝く転送門が設置されています。足を踏み入れるかマップから瞬時に長距離移動が可能です！',
    keyGuide: '転送門に侵入 / Mキー地図'
  },
  {
    id: 5,
    title: '闘技場でのNPC決闘腕試し',
    objective: '闘技場(X:18, Z:26)で決闘師範アルトリウスに挑戦しよう',
    hint: 'サンクチュアリ東側の闘技場でNPCとの真剣勝負ができます！勝利すると名誉称号と大量のゴールド・経験値を獲得！',
    keyGuide: '闘技場NPC / ヘッダー「決闘」'
  }
];

export const BESTIARY_DATA: BestiaryEntry[] = [
  // 1. Forest & Plains (1-10) - Balanced friendly ATK values
  { type: 'slime', name: 'グリーンスライム', category: '森林・草原', level: 1, hp: 120, atk: 6, def: 4, exp: 65, gold: 35, description: 'サンクチュアリ周辺の草原に生息するゼリー状の魔物。新米冒険者の格好の鍛錬相手。', location: 'サンクチュアリ東側草原 (X: 16, Z: -10)', dropName: 'スライムの粘液 / 初級HP薬' },
  { type: 'blue_slime', name: 'アクアスライム', category: '森林・草原', level: 2, hp: 160, atk: 8, def: 5, exp: 85, gold: 45, description: '清流の水分を吸って青く澄んだスライム。やや防御力が高い。', location: '小川の畔 (X: 22, Z: 8)', dropName: '清らかな水滴 / 初級MP薬' },
  { type: 'red_slime', name: 'マグマスライム', category: '森林・草原', level: 3, hp: 210, atk: 10, def: 7, exp: 110, gold: 60, description: '火山灰が混ざり赤熱した好戦的なスライム。体当たりに熱を帯びる。', location: '森林街道南端 (X: 28, Z: -18)', dropName: '微熱の核 / 赤色霊薬' },
  { type: 'king_slime', name: 'キングスライム', category: '森林・草原', level: 6, hp: 980, atk: 20, def: 18, exp: 450, gold: 280, description: '無数のスライムが合体し王冠を戴いた巨体スライム。跳躍押し潰しに注意。', location: 'エメラルド平原中央 (X: 35, Z: -25)', dropName: '王冠の破片 / 王族の指輪', isElite: true },
  { type: 'mushroom_spore', name: '毒茸キノコスポア', category: '森林・草原', level: 3, hp: 180, atk: 9, def: 6, exp: 95, gold: 50, description: '胞子を撒き散らしながら歩く妖異キノコ。群生して胞子煙幕を放つ。', location: '巨木の下草地 (X: 32, Z: 12)', dropName: '発光胞子袋 / 毒消し草' },
  { type: 'forest_wolf', name: 'フォレストウルフ', category: '森林・草原', level: 4, hp: 320, atk: 13, def: 9, exp: 160, gold: 90, description: '原生林を縄張りとする俊敏な狼。鋭い牙と爪で獲物を追い詰める。', location: '深緑の街道 (X: 42, Z: -15)', dropName: '野獣の毛皮 / 狼牙の小刀' },
  { type: 'wild_boar', name: '突撃野猪ワイルドボア', category: '森林・草原', level: 4, hp: 360, atk: 14, def: 14, exp: 180, gold: 100, description: '剛毛と巨大な牙を持つ暴れ猪。直線的な突進攻撃は岩をも砕く。', location: '原生林の薮 (X: 48, Z: 18)', dropName: '剛毛革 / 頑丈なバックラー' },
  { type: 'dire_wolf', name: '紅蓮の凶狼ダイアウルフ', category: '森林・草原', level: 5, hp: 440, atk: 16, def: 12, exp: 230, gold: 130, description: '夜霧に紛れて旅人を強襲する上位の漆黒狼。鋭利な牙の連撃を繰り出す。', location: '東部深森 (X: 55, Z: -28)', dropName: '黒狼の牙 / 影歩きのブーツ' },
  { type: 'shadow_panther', name: '影豹シャドウパンサー', category: '森林・草原', level: 6, hp: 520, atk: 18, def: 15, exp: 280, gold: 160, description: '黒曜石の如き光沢を持つ影の豹。音もなく背後へ回り込み爪撃を浴びせる。', location: '深森の岩場 (X: 62, Z: -10)', dropName: '漆黒の爪 / 俊敏のリング' },
  { type: 'treant', name: '古樹のトレント', category: '森林・草原', level: 7, hp: 1400, atk: 24, def: 28, exp: 620, gold: 380, description: '樹齢数百年の大樹が魔力を得て歩行する守護獣。太い幹の腕で大地を叩き割る。', location: '太古の森の奥地 (X: 68, Z: 20)', dropName: '世界樹の小枝 / 巨樹の重装甲', isElite: true },

  // 2. Ancient Ruins & Crypts (11-17) - Balanced mid-tier ATK
  { type: 'skeleton_warrior', name: '遺跡の骸骨兵', category: '古代遺跡', level: 8, hp: 580, atk: 22, def: 18, exp: 340, gold: 180, description: '滅び去った古代王国の衛兵の骨。錆びた剣を手に遺跡の侵入者を排除する。', location: '崩れた回廊 (X: -32, Z: 30)', dropName: '古びた骨片 / 鋼鉄のショートソード' },
  { type: 'skeleton_archer', name: '遺跡の骸骨弓兵', category: '古代遺跡', level: 9, hp: 520, atk: 24, def: 15, exp: 380, gold: 200, description: '朽ちた大弓で正確無比に射撃してくる骸骨の射手。距離を取って攻撃する。', location: '崩れた物見櫓 (X: -42, Z: 38)', dropName: '亡霊の矢羽根 / 狙撃手の腕輪' },
  { type: 'ghost_wraith', name: '彷徨う亡霊レイス', category: '古代遺跡', level: 10, hp: 650, atk: 26, def: 16, exp: 450, gold: 240, description: '現世に未練を残し虚空を浮遊する怨霊。物理攻撃が通りにくい幽体を持つ。', location: '薄暗い地下聖堂 (X: -36, Z: 52)', dropName: '魂の澱み / 魔導士の外套' },
  { type: 'mummy', name: '呪縛の古代ミイラ', category: '古代遺跡', level: 11, hp: 820, atk: 28, def: 24, exp: 520, gold: 270, description: '包帯に呪詛が刻まれた不死の死者。強靭な腕力で相手を締め上げる。', location: '王家の石棺跡 (X: -50, Z: 45)', dropName: '呪符の包帯 / 古代金貨' },
  { type: 'skeleton_knight', name: '重装骸骨騎士', category: '古代遺跡', level: 11, hp: 960, atk: 30, def: 32, exp: 580, gold: 310, description: '黒鉄の板金鎧と大盾で身を固めた骸骨精鋭。ガードを崩すのが極めて困難。', location: '神殿前広場 (X: -58, Z: 34)', dropName: '黒鉄の破片 / 重装騎士の兜' },
  { type: 'gargoyle', name: '遺跡の石翼ガーゴイル', category: '古代遺跡', level: 13, hp: 1150, atk: 34, def: 35, exp: 720, gold: 400, description: '石像から目覚めた有翼の悪鬼。硬質化した皮膚と上空からの急降下攻撃が脅威。', location: '祭壇の尖塔 (X: -65, Z: 58)', dropName: '石妖の翼 / ガーゴイルの心臓' },
  { type: 'lich', name: '死霊魔導士リッチ', category: '古代遺跡', level: 14, hp: 1950, atk: 42, def: 25, exp: 1200, gold: 750, description: '死せる魔術師のなれの果て。紫紺の魔力弾を雨のように降らせる大魔導士。', location: '死霊の王座 (X: -72, Z: 46)', dropName: '冥府の宝珠 / 賢者の杖', isElite: true },

  // 3. Crystal Abyss & Caverns (18-23)
  { type: 'crystal_bat', name: '晶石コウモリ', category: '水晶峡谷', level: 11, hp: 620, atk: 28, def: 20, exp: 460, gold: 250, description: '紫水晶の洞窟を飛び交う結晶の翼を持つ蝙蝠。超音波と水晶波で撹乱する。', location: '峡谷の洞門 (X: -48, Z: -35)', dropName: '晶石の皮膜 / 鋭敏の耳飾り' },
  { type: 'crystal_golem', name: '碧晶石ゴーレム', category: '水晶峡谷', level: 12, hp: 1350, atk: 34, def: 38, exp: 720, gold: 420, description: '碧く輝く魔力結晶で自らを構築した歩行巨兵。高い物理耐性を誇る。', location: '水晶の道標 (X: -60, Z: -45)', dropName: '碧結晶の核 / 水晶のプレートメイル' },
  { type: 'crystal_spider', name: '水晶結晶蜘蛛', category: '水晶峡谷', level: 13, hp: 1080, atk: 36, def: 28, exp: 680, gold: 390, description: '透明な水晶の甲殻を持つ大蜘蛛。硬質な糸を放ち獲物の自由を奪う。', location: '青水晶の裂け目 (X: -54, Z: -62)', dropName: '水晶の糸 / 蜘蛛脚のダガー' },
  { type: 'amethyst_golem', name: '紫水晶ゴーレム', category: '水晶峡谷', level: 14, hp: 1650, atk: 40, def: 44, exp: 890, gold: 520, description: '高純度の紫アメジストでできた重戦士。打撃時に魔力衝撃波を撒き散らす。', location: '紫紺の晶洞 (X: -70, Z: -55)', dropName: '紫晶塊 / アメジストリング' },
  { type: 'cave_scorpion', name: '深淵の大蠍', category: '水晶峡谷', level: 15, hp: 1500, atk: 42, def: 42, exp: 950, gold: 560, description: '水晶洞窟の暗がりに潜む巨大蠍。尾端の毒針から致命的な猛毒を注入する。', location: '地底崖の岩陰 (X: -78, Z: -40)', dropName: '大蠍の毒針 / 劇毒のナイフ' },
  { type: 'diamond_colossus', name: '金剛石の巨神', category: '水晶峡谷', level: 17, hp: 3200, atk: 52, def: 58, exp: 2100, gold: 1200, description: 'ダイヤモンドの強固な鉱脈から生まれた伝説の巨神。あらゆる攻撃を反射する。', location: '結晶の心臓部 (X: -86, Z: -68)', dropName: '金剛石の心核 / タイタンシールド', isElite: true },

  // 4. Volcanic Caldera & Ashlands (24-28)
  { type: 'fire_elemental', name: '灼熱の火霊', category: '灼熱火山', level: 16, hp: 1450, atk: 46, def: 32, exp: 1050, gold: 620, description: '火口から噴出した純粋な炎の精霊。近づくだけで灼熱の継続ダメージを受ける。', location: '火山の裾野 (X: 68, Z: 62)', dropName: '火霊の燃え殻 / 火炎石のアミュレット' },
  { type: 'lava_hound', name: '溶岩魔犬ラヴァハウンド', category: '灼熱火山', level: 17, hp: 1750, atk: 50, def: 38, exp: 1200, gold: 720, description: '溶岩を呑んで生きる狂暴な地獄犬。体表の亀裂からマグマを滴らせ疾走する。', location: '溶岩河川の浅瀬 (X: 76, Z: 74)', dropName: '溶岩の牙 / 灼熱のレザーベスト' },
  { type: 'volcano_golem', name: '溶岩巨兵マグマゴーレム', category: '灼熱火山', level: 18, hp: 2400, atk: 56, def: 52, exp: 1550, gold: 950, description: '玄武岩と流動溶岩が固まった巨兵。拳を振り下ろす度に溶岩弾が飛散する。', location: '噴火口の前庭 (X: 84, Z: 65)', dropName: '玄武岩の塊 / マグマクラッシャー' },
  { type: 'fire_drake', name: '火炎亜竜ドレイク', category: '灼熱火山', level: 19, hp: 2800, atk: 62, def: 48, exp: 1850, gold: 1100, description: '真竜の血を引く俊敏な二足歩行亜竜。高熱の火炎ブレスで大地を一瞬で焼き払う。', location: '竜の巣穴 (X: 92, Z: 75)', dropName: '火竜の皮 / ドレイクの鱗甲' },
  { type: 'boss_dragon', name: '【ワールドボス】獄炎竜イグニス', category: '灼熱火山', level: 22, hp: 9800, atk: 85, def: 65, exp: 6500, gold: 4500, description: '火山の主にして古の災厄。灼熱の劫火を吐き、全冒険者に壊滅的打撃をもたらす竜王。', location: '獄炎のカルデラ (X: 100, Z: 92)', dropName: '滅竜神の天光聖剣 [LEGENDARY] / 竜王の心臓', isBoss: true },

  // 5. Celestial & Void Rift (29-30)
  { type: 'void_watcher', name: '虚空の監視者ボイドアイ', category: '星辰・虚空', level: 20, hp: 3100, atk: 70, def: 45, exp: 2400, gold: 1400, description: '異次元の狭間からこの世界を凝視する浮遊する巨大眼球。重力場を歪める。', location: '虚空の歪み (X: -25, Z: -90)', dropName: '虚空の瞳石 / 次元跳躍の指輪' },
  { type: 'astral_chimera', name: '【ワールドボス】星辰神獣キメラ', category: '星辰・虚空', level: 25, hp: 12500, atk: 98, def: 75, exp: 8800, gold: 6000, description: '星々の光を身に宿す伝説の幻獣。獅子の剛力、竜の翼、神聖な角の雷光を兼ね備える。', location: '星辰の祭壇 (X: -35, Z: -105)', dropName: '星辰神話の輝冠 [LEGENDARY] / 創世の星屑', isBoss: true }
];

export const INITIAL_ENEMIES: Enemy[] = [
  // 1. Forest & Plains (1-10) - Balanced ATK
  { id: 'mob_slime_1', name: 'グリーンスライム Lv.1', type: 'slime', level: 1, hp: 120, maxHp: 120, atk: 6, def: 4, expReward: 65, goldReward: 35, x: 16, y: 0, z: -10, spawnX: 16, spawnZ: -10, aggroRadius: 8, attackRange: 3.0, attackCooldown: 2.0, lastAttackTime: 0, isDead: false, respawnTime: 0, currentTargetId: null, scale: 1.0 },
  { id: 'mob_blue_slime_1', name: 'アクアスライム Lv.2', type: 'blue_slime', level: 2, hp: 160, maxHp: 160, atk: 8, def: 5, expReward: 85, goldReward: 45, x: 22, y: 0, z: 8, spawnX: 22, spawnZ: 8, aggroRadius: 8, attackRange: 3.0, attackCooldown: 1.9, lastAttackTime: 0, isDead: false, respawnTime: 0, currentTargetId: null, scale: 1.05 },
  { id: 'mob_red_slime_1', name: 'マグマスライム Lv.3', type: 'red_slime', level: 3, hp: 210, maxHp: 210, atk: 10, def: 7, expReward: 110, goldReward: 60, x: 28, y: 0, z: -18, spawnX: 28, spawnZ: -18, aggroRadius: 9, attackRange: 3.0, attackCooldown: 1.8, lastAttackTime: 0, isDead: false, respawnTime: 0, currentTargetId: null, scale: 1.1 },
  { id: 'mob_king_slime_1', name: '【精鋭】キングスライム Lv.6', type: 'king_slime', level: 6, hp: 980, maxHp: 980, atk: 20, def: 18, expReward: 450, goldReward: 280, x: 35, y: 0, z: -25, spawnX: 35, spawnZ: -25, aggroRadius: 12, attackRange: 4.5, attackCooldown: 2.1, lastAttackTime: 0, isDead: false, respawnTime: 0, currentTargetId: null, scale: 2.2 },
  { id: 'mob_mush_1', name: '毒茸キノコスポア Lv.3', type: 'mushroom_spore', level: 3, hp: 180, maxHp: 180, atk: 9, def: 6, expReward: 95, goldReward: 50, x: 32, y: 0, z: 12, spawnX: 32, spawnZ: 12, aggroRadius: 9, attackRange: 3.2, attackCooldown: 1.8, lastAttackTime: 0, isDead: false, respawnTime: 0, currentTargetId: null, scale: 1.1 },
  { id: 'mob_fwolf_1', name: 'フォレストウルフ Lv.4', type: 'forest_wolf', level: 4, hp: 320, maxHp: 320, atk: 13, def: 9, expReward: 160, goldReward: 90, x: 42, y: 0, z: -15, spawnX: 42, spawnZ: -15, aggroRadius: 11, attackRange: 3.5, attackCooldown: 1.5, lastAttackTime: 0, isDead: false, respawnTime: 0, currentTargetId: null, scale: 1.2 },
  { id: 'mob_boar_1', name: '突撃野猪ワイルドボア Lv.4', type: 'wild_boar', level: 4, hp: 360, maxHp: 360, atk: 14, def: 14, expReward: 180, goldReward: 100, x: 48, y: 0, z: 18, spawnX: 48, spawnZ: 18, aggroRadius: 10, attackRange: 3.6, attackCooldown: 1.7, lastAttackTime: 0, isDead: false, respawnTime: 0, currentTargetId: null, scale: 1.25 },
  { id: 'mob_dwolf_1', name: '紅蓮の凶狼ダイアウルフ Lv.5', type: 'dire_wolf', level: 5, hp: 440, maxHp: 440, atk: 16, def: 12, expReward: 230, goldReward: 130, x: 55, y: 0, z: -28, spawnX: 55, spawnZ: -28, aggroRadius: 12, attackRange: 3.5, attackCooldown: 1.4, lastAttackTime: 0, isDead: false, respawnTime: 0, currentTargetId: null, scale: 1.35 },
  { id: 'mob_panther_1', name: '影豹シャドウパンサー Lv.6', type: 'shadow_panther', level: 6, hp: 520, maxHp: 520, atk: 18, def: 15, expReward: 280, goldReward: 160, x: 62, y: 0, z: -10, spawnX: 62, spawnZ: -10, aggroRadius: 12, attackRange: 3.8, attackCooldown: 1.3, lastAttackTime: 0, isDead: false, respawnTime: 0, currentTargetId: null, scale: 1.3 },
  { id: 'mob_treant_1', name: '【精鋭】古樹のトレント Lv.7', type: 'treant', level: 7, hp: 1400, maxHp: 1400, atk: 24, def: 28, expReward: 620, goldReward: 380, x: 68, y: 0, z: 20, spawnX: 68, spawnZ: 20, aggroRadius: 13, attackRange: 4.8, attackCooldown: 2.2, lastAttackTime: 0, isDead: false, respawnTime: 0, currentTargetId: null, scale: 1.6 },

  // 2. Ancient Ruins & Crypts (11-17) - Balanced ATK
  { id: 'mob_skel_1', name: '遺跡の骸骨兵 Lv.8', type: 'skeleton_warrior', level: 8, hp: 580, maxHp: 580, atk: 22, def: 18, expReward: 340, goldReward: 180, x: -32, y: 0, z: 30, spawnX: -32, spawnZ: 30, aggroRadius: 11, attackRange: 3.8, attackCooldown: 1.7, lastAttackTime: 0, isDead: false, respawnTime: 0, currentTargetId: null, scale: 1.25 },
  { id: 'mob_skel_arc_1', name: '遺跡の骸骨弓兵 Lv.9', type: 'skeleton_archer', level: 9, hp: 520, maxHp: 520, atk: 24, def: 15, expReward: 380, goldReward: 200, x: -42, y: 0, z: 38, spawnX: -42, spawnZ: 38, aggroRadius: 14, attackRange: 12.0, attackCooldown: 1.9, lastAttackTime: 0, isDead: false, respawnTime: 0, currentTargetId: null, scale: 1.25 },
  { id: 'mob_wraith_1', name: '彷徨う亡霊レイス Lv.10', type: 'ghost_wraith', level: 10, hp: 650, maxHp: 650, atk: 26, def: 16, expReward: 450, goldReward: 240, x: -36, y: 0, z: 52, spawnX: -36, spawnZ: 52, aggroRadius: 12, attackRange: 6.0, attackCooldown: 1.6, lastAttackTime: 0, isDead: false, respawnTime: 0, currentTargetId: null, scale: 1.3 },
  { id: 'mob_mummy_1', name: '呪縛の古代ミイラ Lv.11', type: 'mummy', level: 11, hp: 820, maxHp: 820, atk: 28, def: 24, expReward: 520, goldReward: 270, x: -50, y: 0, z: 45, spawnX: -50, spawnZ: 45, aggroRadius: 10, attackRange: 3.8, attackCooldown: 1.8, lastAttackTime: 0, isDead: false, respawnTime: 0, currentTargetId: null, scale: 1.3 },
  { id: 'mob_skel_knt_1', name: '重装骸骨騎士 Lv.11', type: 'skeleton_knight', level: 11, hp: 960, maxHp: 960, atk: 30, def: 32, expReward: 580, goldReward: 310, x: -58, y: 0, z: 34, spawnX: -58, spawnZ: 34, aggroRadius: 12, attackRange: 4.2, attackCooldown: 1.8, lastAttackTime: 0, isDead: false, respawnTime: 0, currentTargetId: null, scale: 1.4 },
  { id: 'mob_gargoyle_1', name: '遺跡の石翼ガーゴイル Lv.13', type: 'gargoyle', level: 13, hp: 1150, maxHp: 1150, atk: 34, def: 35, expReward: 720, goldReward: 400, x: -65, y: 0, z: 58, spawnX: -65, spawnZ: 58, aggroRadius: 13, attackRange: 4.5, attackCooldown: 1.7, lastAttackTime: 0, isDead: false, respawnTime: 0, currentTargetId: null, scale: 1.45 },
  { id: 'mob_lich_1', name: '【精鋭】死霊魔導士リッチ Lv.14', type: 'lich', level: 14, hp: 1950, maxHp: 1950, atk: 42, def: 25, expReward: 1200, goldReward: 750, x: -72, y: 0, z: 46, spawnX: -72, spawnZ: 46, aggroRadius: 15, attackRange: 14.0, attackCooldown: 2.0, lastAttackTime: 0, isDead: false, respawnTime: 0, currentTargetId: null, scale: 1.5 },

  // 3. Crystal Abyss & Caverns (18-23) - Balanced ATK
  { id: 'mob_cbat_1', name: '晶石コウモリ Lv.11', type: 'crystal_bat', level: 11, hp: 620, maxHp: 620, atk: 28, def: 20, expReward: 460, goldReward: 250, x: -48, y: 0, z: -35, spawnX: -48, spawnZ: -35, aggroRadius: 11, attackRange: 3.5, attackCooldown: 1.4, lastAttackTime: 0, isDead: false, respawnTime: 0, currentTargetId: null, scale: 1.2 },
  { id: 'mob_cgolem_1', name: '碧晶石ゴーレム Lv.12', type: 'crystal_golem', level: 12, hp: 1350, maxHp: 1350, atk: 34, def: 38, expReward: 720, goldReward: 420, x: -60, y: 0, z: -45, spawnX: -60, spawnZ: -45, aggroRadius: 10, attackRange: 4.5, attackCooldown: 2.2, lastAttackTime: 0, isDead: false, respawnTime: 0, currentTargetId: null, scale: 1.6 },
  { id: 'mob_cspider_1', name: '水晶結晶蜘蛛 Lv.13', type: 'crystal_spider', level: 13, hp: 1080, maxHp: 1080, atk: 36, def: 28, expReward: 680, goldReward: 390, x: -54, y: 0, z: -62, spawnX: -54, spawnZ: -62, aggroRadius: 11, attackRange: 4.0, attackCooldown: 1.6, lastAttackTime: 0, isDead: false, respawnTime: 0, currentTargetId: null, scale: 1.35 },
  { id: 'mob_agolem_1', name: '紫水晶ゴーレム Lv.14', type: 'amethyst_golem', level: 14, hp: 1650, maxHp: 1650, atk: 40, def: 44, expReward: 890, goldReward: 520, x: -70, y: 0, z: -55, spawnX: -70, spawnZ: -55, aggroRadius: 11, attackRange: 4.6, attackCooldown: 2.1, lastAttackTime: 0, isDead: false, respawnTime: 0, currentTargetId: null, scale: 1.7 },
  { id: 'mob_c_scorp_1', name: '深淵の大蠍 Lv.15', type: 'cave_scorpion', level: 15, hp: 1500, maxHp: 1500, atk: 42, def: 42, expReward: 950, goldReward: 560, x: -78, y: 0, z: -40, spawnX: -78, spawnZ: -40, aggroRadius: 12, attackRange: 4.2, attackCooldown: 1.7, lastAttackTime: 0, isDead: false, respawnTime: 0, currentTargetId: null, scale: 1.45 },
  { id: 'mob_diam_col_1', name: '【精鋭】金剛石の巨神 Lv.17', type: 'diamond_colossus', level: 17, hp: 3200, maxHp: 3200, atk: 52, def: 58, expReward: 2100, goldReward: 1200, x: -86, y: 0, z: -68, spawnX: -86, spawnZ: -68, aggroRadius: 13, attackRange: 5.5, attackCooldown: 2.2, lastAttackTime: 0, isDead: false, respawnTime: 0, currentTargetId: null, scale: 2.1 },

  // 4. Volcanic Caldera & Ashlands (24-28) - Balanced ATK
  { id: 'mob_felem_1', name: '灼熱の火霊 Lv.16', type: 'fire_elemental', level: 16, hp: 1450, maxHp: 1450, atk: 46, def: 32, expReward: 1050, goldReward: 620, x: 68, y: 0, z: 62, spawnX: 68, spawnZ: 62, aggroRadius: 13, attackRange: 7.0, attackCooldown: 1.8, lastAttackTime: 0, isDead: false, respawnTime: 0, currentTargetId: null, scale: 1.4 },
  { id: 'mob_lhound_1', name: '溶岩魔犬ラヴァハウンド Lv.17', type: 'lava_hound', level: 17, hp: 1750, maxHp: 1750, atk: 50, def: 38, expReward: 1200, goldReward: 720, x: 76, y: 0, z: 74, spawnX: 76, spawnZ: 74, aggroRadius: 13, attackRange: 4.0, attackCooldown: 1.4, lastAttackTime: 0, isDead: false, respawnTime: 0, currentTargetId: null, scale: 1.4 },
  { id: 'mob_vgolem_1', name: '溶岩巨兵マグマゴーレム Lv.18', type: 'volcano_golem', level: 18, hp: 2400, maxHp: 2400, atk: 56, def: 52, expReward: 1550, goldReward: 950, x: 84, y: 0, z: 65, spawnX: 84, spawnZ: 65, aggroRadius: 12, attackRange: 5.0, attackCooldown: 2.0, lastAttackTime: 0, isDead: false, respawnTime: 0, currentTargetId: null, scale: 1.9 },
  { id: 'mob_fdrake_1', name: '火炎亜竜ドレイク Lv.19', type: 'fire_drake', level: 19, hp: 2800, maxHp: 2800, atk: 62, def: 48, expReward: 1850, goldReward: 1100, x: 92, y: 0, z: 75, spawnX: 92, spawnZ: 75, aggroRadius: 15, attackRange: 6.0, attackCooldown: 1.9, lastAttackTime: 0, isDead: false, respawnTime: 0, currentTargetId: null, scale: 1.8 },
  { id: 'boss_dragon', name: '【ワールドボス】獄炎竜イグニス Lv.22', type: 'boss_dragon', level: 22, hp: 9800, maxHp: 9800, atk: 85, def: 65, expReward: 6500, goldReward: 4500, x: 100, y: 0, z: 92, spawnX: 100, spawnZ: 92, aggroRadius: 20, attackRange: 8.0, attackCooldown: 2.3, lastAttackTime: 0, isDead: false, respawnTime: 0, currentTargetId: null, scale: 3.2, isBoss: true },

  // 5. Celestial & Void Rift (29-30) - Balanced ATK
  { id: 'mob_v_eye_1', name: '虚空の監視者ボイドアイ Lv.20', type: 'void_watcher', level: 20, hp: 3100, maxHp: 3100, atk: 70, def: 45, expReward: 2400, goldReward: 1400, x: -25, y: 0, z: -90, spawnX: -25, spawnZ: -90, aggroRadius: 16, attackRange: 12.0, attackCooldown: 2.0, lastAttackTime: 0, isDead: false, respawnTime: 0, currentTargetId: null, scale: 1.7 },
  { id: 'boss_chimera', name: '【ワールドボス】星辰神獣キメラ Lv.25', type: 'astral_chimera', level: 25, hp: 12500, maxHp: 12500, atk: 98, def: 75, expReward: 8800, goldReward: 6000, x: -35, y: 0, z: -105, spawnX: -35, spawnZ: -105, aggroRadius: 22, attackRange: 9.0, attackCooldown: 2.2, lastAttackTime: 0, isDead: false, respawnTime: 0, currentTargetId: null, scale: 3.0, isBoss: true }
];

export const INITIAL_OTHER_PLAYERS: OtherPlayer[] = [
  {
    id: 'p_1',
    name: 'ヴァルキリー_凛',
    classId: 'paladin',
    level: 14,
    hp: 920,
    maxHp: 920,
    x: 15,
    y: 0,
    z: -8,
    targetX: 18,
    targetZ: -12,
    guild: '<光の聖約>',
    title: '不撓不屈の盾',
    state: 'attack',
    targetEnemyId: 'slime_1',
    color: '#38bdf8'
  },
  {
    id: 'p_2',
    name: 'アストラル_エル',
    classId: 'mage',
    level: 12,
    hp: 510,
    maxHp: 510,
    x: 28,
    y: 0,
    z: -4,
    targetX: 32,
    targetZ: -5,
    guild: '<星辰の賢者>',
    title: '紅蓮の詠唱者',
    state: 'cast',
    targetEnemyId: 'slime_3',
    color: '#c084fc'
  },
  {
    id: 'p_3',
    name: 'シャドウ_カイ',
    classId: 'ranger',
    level: 11,
    hp: 560,
    maxHp: 560,
    x: 58,
    y: 0,
    z: -20,
    targetX: 62,
    targetZ: -15,
    guild: '<風の旅団>',
    title: '無影の一矢',
    state: 'attack',
    targetEnemyId: 'wolf_2',
    color: '#4ade80'
  },
  {
    id: 'p_4',
    name: 'ジークフリート',
    classId: 'paladin',
    level: 15,
    hp: 1100,
    maxHp: 1100,
    x: 88,
    y: 0,
    z: 78,
    targetX: 95,
    targetZ: 85,
    guild: '<光の聖約>',
    title: '竜殺しの英雄',
    state: 'attack',
    targetEnemyId: 'boss_dragon',
    color: '#38bdf8'
  },
  {
    id: 'p_5',
    name: 'ルシア_ミスティック',
    classId: 'mage',
    level: 15,
    hp: 580,
    maxHp: 580,
    x: 82,
    y: 0,
    z: 72,
    targetX: 95,
    targetZ: 85,
    guild: '<星辰の賢者>',
    title: '虚空の大魔導師',
    state: 'cast',
    targetEnemyId: 'boss_dragon',
    color: '#c084fc'
  },
  {
    id: 'p_6',
    name: 'フェザー_ユウ',
    classId: 'ranger',
    level: 13,
    hp: 620,
    maxHp: 620,
    x: -30,
    y: 0,
    z: 30,
    targetX: -35,
    targetZ: 35,
    guild: '<風の旅団>',
    title: '風神の射手',
    state: 'attack',
    targetEnemyId: 'skel_1',
    color: '#4ade80'
  }
];

export const WORLD_CHAT_BANTER = [
  { sender: 'ヴァルキリー_凛', guild: '光の聖約', text: 'スライムゾーンでレベリング中！初心者さんいれば手伝いますよ〜' },
  { sender: 'ジークフリート', guild: '光の聖約', text: '【全ワールド】獄炎竜イグニス討伐レイド募集中！残り2枠タンク歓迎！' },
  { sender: 'アストラル_エル', guild: '星辰の賢者', text: 'メテオストームの範囲火力爽快すぎるｗ' },
  { sender: 'フェザー_ユウ', guild: '風の旅団', text: '古代遺跡のスケルトンからレア装備ドロップしました！' },
  { sender: 'ルシア_ミスティック', guild: '星辰の賢者', text: 'イグニスの火炎ブレス範囲は足元の赤サークルから即離脱推奨です！' },
  { sender: 'シャドウ_カイ', guild: '風の旅団', text: 'サンクチュアリの噴水広場でバフかけ合いましょう！' }
];
