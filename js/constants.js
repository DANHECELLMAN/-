/**
 * 《今天也不想上班》- 核心数值常量与配置表 (V1.5 终极优化版)
 */

export const M_TO_PX = 32;

// 等级经验表 (1-50级)
export const XP_TABLE = [
  0,
  12,   28,   48,   72,   102,  138,  180,  230,  290,
  360,  440,  530,  630,  740,  860,  990,  1130, 1280, 1440,
  1620, 1810, 2020, 2240, 2480, 2730, 3000, 3280, 3580, 3900,
  4240, 4600, 4980, 5380, 5800, 6240, 6700, 7180, 7680, 8200,
  8750, 9320, 9920, 10540, 11190, 11860, 12560, 13290, 14050, 14840
];

// 4大可选职场角色配置表
export const CHARACTERS = {
  xiaochen: {
    id: "xiaochen",
    name: "小陈",
    title: "全能运营",
    avatar: "👨‍💼",
    desc: "综合能力全面均衡，升级后摸鱼极速奔跑，适合新手稳健通关。",
    initialWeapon: "keyboard",
    baseStats: {
      maxHp: 110,
      moveSpeed: 4.2 * M_TO_PX,
      damageMult: 1.05,
      critRate: 0.05,
      critDmg: 1.6,
      xpMult: 1.0,
      pickupRadius: 2.3 * M_TO_PX
    },
    passive: {
      name: "熟练摸鱼",
      desc: "每次升级后3秒内移动速度 +20%，拾取范围 +40%。"
    },
    active: {
      name: "疯狂输出",
      icon: "🔥",
      desc: "3.5秒内攻击速度 +70%，武器伤害 +25%！",
      cd: 16.0,
      duration: 3.5
    }
  },
  awei: {
    id: "awei",
    name: "阿伟",
    title: "资深开发",
    avatar: "👨‍💻",
    desc: "代码战神，擅长范围电击与群体控场，击杀时引发内存泄露爆炸。",
    initialWeapon: "charging_cable",
    baseStats: {
      maxHp: 100,
      moveSpeed: 4.0 * M_TO_PX,
      damageMult: 1.15,
      critRate: 0.07,
      critDmg: 1.65,
      xpMult: 1.05,
      pickupRadius: 2.2 * M_TO_PX
    },
    passive: {
      name: "线上热更",
      desc: "击杀敌人有 16% 概率引发代码内存泄漏爆炸（小范围AOE伤害）。"
    },
    active: {
      name: "系统崩溃",
      icon: "⚡",
      desc: "全屏冻结所有杂兵 3.0 秒，并造成 130 点电击伤害！",
      cd: 18.0,
      duration: 3.0
    }
  },
  lili: {
    id: "lili",
    name: "莉莉",
    title: "视觉设计",
    avatar: "👩‍🎨",
    desc: "像素主宰，天生高暴击与高机动，挥洒水彩风暴绞杀四周。",
    initialWeapon: "water_cup",
    baseStats: {
      maxHp: 90,
      moveSpeed: 4.4 * M_TO_PX,
      damageMult: 1.10,
      critRate: 0.16,
      critDmg: 1.9,
      xpMult: 1.0,
      pickupRadius: 2.2 * M_TO_PX
    },
    passive: {
      name: "灵感迸发",
      desc: "触发暴击时，在自身周围掉落颜料飞溅，造成 40% 溅射伤害。"
    },
    active: {
      name: "改稿风暴",
      icon: "🎨",
      desc: "召唤旋转调色盘风暴，在 4 秒内绞杀周围敌人并反弹弹道！",
      cd: 17.0,
      duration: 4.0
    }
  },
  xiaozhang: {
    id: "xiaozhang",
    name: "小张",
    title: "无畏实习",
    avatar: "🧑‍🎓",
    desc: "职场新人光环，经验获取大幅提升，更容易遇到高级强化选项。",
    initialWeapon: "resignation",
    baseStats: {
      maxHp: 95,
      moveSpeed: 4.1 * M_TO_PX,
      damageMult: 1.0,
      critRate: 0.04,
      critDmg: 1.5,
      xpMult: 1.30,
      pickupRadius: 2.5 * M_TO_PX
    },
    passive: {
      name: "初生牛犊",
      desc: "三选一升级时，出现稀有/进化词条的概率提升 50%。"
    },
    active: {
      name: "假装很忙",
      icon: "🏃‍♂️",
      desc: "进入 2.5 秒无敌与极速隐身奔跑状态，沿途洒下咖啡豆绊倒敌人！",
      cd: 15.0,
      duration: 2.5
    }
  },
  horn_mecha: {
    id: "horn_mecha",
    name: "角虎机甲",
    title: "同步作战原型",
    avatar: "🤖",
    desc: "根据原创设计图接入的近中距离机甲角色，拥有稳定输出、短爆发与突进反制能力。",
    initialWeapon: "keyboard",
    baseStats: {
      maxHp: 108,
      moveSpeed: 4.25 * M_TO_PX,
      damageMult: 1.12,
      critRate: 0.08,
      critDmg: 1.75,
      xpMult: 1.0,
      pickupRadius: 2.35 * M_TO_PX
    },
    passive: {
      name: "同步率提升",
      desc: "闪避后 1.5 秒内攻击速度 +20%，受到伤害后短暂提升 8% 移速。"
    },
    active: {
      name: "角虎机动",
      icon: "🦄",
      desc: "启动 0.9 秒高机动冲刺并释放近身冲击波，对周围敌人造成伤害与击退。",
      cd: 15.0,
      duration: 0.9
    }
  }
};

// 玩家基础数值
export const PLAYER_BASE = {
  maxHp: 100,
  moveSpeed: 4.0 * M_TO_PX,
  pickupRadius: 2.0 * M_TO_PX,
  hurtInvulnTime: 0.45,
  dodgeSpeed: 10.0 * M_TO_PX,
  dodgeDuration: 0.28,
  dodgeCd: 2.8,
  perfectDodgeWindow: 0.10,
  contactDmgCd: 0.45
};

// 压力阶段配置
export const PRESSURE_STAGES = {
  normal: { min: 0, max: 49, name: "正常", color: "#10b981", desc: "心如止水，专注摸鱼" },
  anxious: { min: 50, max: 79, name: "焦虑", color: "#f59e0b", desc: "攻速+15%，移速+10%，受击伤害+10%" },
  manic: { min: 80, max: 99, name: "狂躁", color: "#f97316", desc: "暴击+20%，武器范围+25%，每秒自增压力+0.5" },
  collapse: { min: 100, max: 100, name: "崩溃", color: "#ef4444", desc: "全攻击暴击+50%，每秒扣除 2% 最大生命！" }
};

// 8大核心武器库与超级进化
export const WEAPONS = {
  keyboard: {
    id: "keyboard",
    name: "机械键盘",
    type: "projectile",
    icon: "⌨️",
    desc: "高射速远程键帽，智能自动瞄准敌群，成长后多弹道与穿透。",
    tag: "射速 / 穿透 / 自动索敌",
    levels: [
      { level: 1, desc: "基础伤害 14，攻击间隔 0.52s，自动射击单发键帽", damage: 14, interval: 0.52, range: 8.0 * M_TO_PX, count: 1, pierce: 0 },
      { level: 2, desc: "伤害 +20%", damageMult: 1.20 },
      { level: 3, desc: "攻击间隔 -15%", intervalMult: 0.85 },
      { level: 4, desc: "发射键帽数 +1 (双发散射)", extraCount: 1 },
      { level: 5, desc: "伤害 +25%，键帽穿透 +1 目标", damageMult: 1.25, pierce: 1 }
    ],
    evolution: {
      id: "keyboard_evo",
      name: "祖安机械键盘",
      icon: "⚡⌨️",
      desc: "极速双发狂暴键帽！命中有 25% 概率触发“？？？”连锁爆炸（造成80%范围伤害）！",
      req: { keyboard: 5, coffee: 3, dual_screen: 3 }
    }
  },
  mug: {
    id: "mug",
    name: "马克杯",
    type: "orbit",
    icon: "☕",
    desc: "白瓷杯环绕自身形成全方位绞杀圈，大范围近身扫荡与咖啡溅射。",
    tag: "范围 / 环绕扫荡",
    levels: [
      { level: 1, desc: "1个大马克杯环绕扫荡，每次造成 18 范围伤害与溅射", damage: 18, count: 1, speed: 2.4, radius: 2.2 * M_TO_PX, hitCd: 0.35 },
      { level: 2, desc: "旋转速度 +25%，扫荡判定范围扩大", speedMult: 1.25 },
      { level: 3, desc: "杯子数量 +1 (共2个大杯)", count: 2 },
      { level: 4, desc: "伤害 +25%，旋转半径 +10%", damageMult: 1.25, radiusMult: 1.10 },
      { level: 5, desc: "杯子数量 +1 (共3个大杯)，附带强力击退与水花溅射", count: 3, knockback: true }
    ],
    evolution: {
      id: "mug_evo",
      name: "无限续杯",
      icon: "🌊☕",
      desc: "4个马克杯高速环绕！每 6 秒释放一次 4.0 米咖啡巨浪冲击波击飞全屏杂兵！",
      req: { mug: 5, shield: 3, coffee: 2 }
    }
  },
  resignation: {
    id: "resignation",
    name: "辞职信",
    type: "mortar",
    icon: "📄",
    desc: "自动锁定敌人最密集区域抛射公文袋，轰炸爆炸后留下腐蚀水洼。",
    tag: "范围 / 密集轰炸",
    levels: [
      { level: 1, desc: "每 2.0s 自动轰炸最密集敌群，爆炸半径 1.8m，伤害 45", damage: 45, interval: 2.0, radius: 1.8 * M_TO_PX },
      { level: 2, desc: "爆炸半径 +20%", radiusMult: 1.20 },
      { level: 3, desc: "伤害 +25%", damageMult: 1.25 },
      { level: 4, desc: "爆炸后留下持续 2.0 秒的“离职情绪”腐蚀水洼", poolDuration: 2.0, poolDmgMult: 0.25 },
      { level: 5, desc: "投掷间隔 -20%，爆炸伤害 +25%", intervalMult: 0.80, damageMult: 1.25 }
    ],
    evolution: {
      id: "resignation_evo",
      name: "辞职报告",
      icon: "📑💥",
      desc: "每 2.2 秒召唤巨型辞职报告砸向敌群中心（半径 3.6m，190% 毁灭伤害；压力≥80时范围 +25%）！",
      req: { resignation: 5, quit: 3, kpi: 2 }
    }
  },
  headphones: {
    id: "headphones",
    name: "降噪耳机",
    type: "sonic",
    icon: "🎧",
    desc: "释放 360° 全方位高频声波震荡，穿透击退附近全屏敌群。",
    tag: "范围 / 360°声波穿透",
    levels: [
      { level: 1, desc: "每 2.0s 释放 2.2m 环形声波，造成 24 伤害并穿透击退全怪", damage: 24, interval: 2.0, radius: 2.2 * M_TO_PX },
      { level: 2, desc: "声波半径 +20%，伤害 +18%", radiusMult: 1.20, damageMult: 1.18 },
      { level: 3, desc: "释放间隔 -15%，击退距离提升", intervalMult: 0.85 },
      { level: 4, desc: "每次攻击释放 2 道回响声波 (双重打击)", echoWaves: 2 },
      { level: 5, desc: "声波伤害 +25%，声波半径 +20%", damageMult: 1.25, radiusMult: 1.20 }
    ],
    evolution: {
      id: "headphones_evo",
      name: "降噪核爆耳机",
      icon: "☢️🎧",
      desc: "每 1.4 秒释放半径 4.2 米的核爆声浪（造成 150% 伤害），同时震碎范围内的敌方子弹！",
      req: { headphones: 5, loudspeaker_meeting: 3, on_time_off: 2 }
    }
  },
  water_cup: {
    id: "water_cup",
    name: "养生水杯",
    type: "puddle_throw",
    icon: "🫗",
    desc: "自动锁定敌群投掷水杯碎裂在地，形成大范围烫水水洼造成持续伤害。",
    tag: "地面 / 持续伤害 / 自动投掷",
    levels: [
      { level: 1, desc: "每 2.2s 自动向敌群投掷水杯，落地生成 1.8m 水洼持续 2.0 秒（造成持续伤害）", damage: 15, interval: 2.2, radius: 1.8 * M_TO_PX, count: 1, duration: 2.0 },
      { level: 2, desc: "水洼半径 +20%，投掷间隔 -15%", radiusMult: 1.20, intervalMult: 0.85 },
      { level: 3, desc: "投掷数量 +1 (同时扔出2个水杯)", count: 2 },
      { level: 4, desc: "地面伤害 +30%，持续时间延长至 2.5 秒", damageMult: 1.30, duration: 2.5 },
      { level: 5, desc: "投掷数量 +1 (共3个水杯)，水洼敌人减速 30%", count: 3, slowPct: 0.30 }
    ],
    evolution: {
      id: "water_cup_evo",
      name: "高压八杯水领域",
      icon: "🌊🫗",
      desc: "同时投掷 3 个巨型加湿水桶，形成持续 3.5 秒的暴风雨领域并为自己回血！",
      req: { water_cup: 5, paid_slacking: 3, lunch_break: 2 }
    }
  },
  charging_cable: {
    id: "charging_cable",
    name: "快充充电线",
    type: "lightning_whip",
    icon: "🔌",
    desc: "自动锁定向敌人最密集方向挥舞高压电弧，大范围电击横扫与链式电击。",
    tag: "近战 / 自动扇形电弧 / 连锁",
    levels: [
      { level: 1, desc: "每 1.0s 自动向敌群扇形 (半径 2.4m) 挥舞电鞭，造成 34 电击与链式电弧", damage: 34, interval: 1.0, range: 2.4 * M_TO_PX, count: 1 },
      { level: 2, desc: "攻击范围 +20%，电击伤害 +20%", rangeMult: 1.20, damageMult: 1.20 },
      { level: 3, desc: "挥舞数量 +1 (同时前后双向横扫)", count: 2 },
      { level: 4, desc: "挥舞间隔 -18% (0.82s一次)，引发连锁雷击", intervalMult: 0.82 },
      { level: 5, desc: "化为 360° 全身圆周电磁横扫，伤害额外 +30%", fullCircle: true, damageMult: 1.30 }
    ],
    evolution: {
      id: "charging_cable_evo",
      name: "超导快充高压鞭",
      icon: "⚡🔌",
      desc: "每 0.7 秒引爆全屏超导雷击，电击全屏敌人并产生静电护盾！",
      req: { charging_cable: 5, elevator_dash: 3, last_minute_rush: 2 }
    }
  },
  chair: {
    id: "chair",
    name: "人体工学椅",
    type: "chair_spin",
    icon: "🪑",
    desc: "诺手Q式360°大杀四方！每5秒狂暴旋转横扫一圈，外圈造成巨额暴击、强力击退并恢复摸鱼值。",
    tag: "近战 / 360°横扫 / 外圈暴击",
    levels: [
      { level: 1, desc: "每 5.0s 旋转工学椅横扫一圈 (半径 2.8m)，内圈造成 45 伤害，外圈造成 170% 暴击与强力击退", damage: 45, interval: 5.0, range: 2.8 * M_TO_PX },
      { level: 2, desc: "横扫伤害 +25%，旋转半径 +15%", damageMult: 1.25, rangeMult: 1.15 },
      { level: 3, desc: "旋转冷却 -1.0s (4.0s 一次)，外圈命中回复少量生命", intervalVal: 4.0, healOnHit: 2 },
      { level: 4, desc: "外圈锋刃造成 200% 暴击伤害并降低自身压力", damageMult: 1.25, sweetSpotMult: 2.0 },
      { level: 5, desc: "连续旋转 2 圈 (双重大杀四方)，外圈范围扩大至 3.8m", doubleSpin: true, rangeMult: 1.20 }
    ],
    evolution: {
      id: "chair_evo",
      name: "老板真皮按摩椅",
      icon: "👑🪑",
      desc: "每 2.8 秒释放超音速气动旋风斩，外圈造成 250% 毁灭伤害与大击退，并吸取摸鱼能量生成气动护盾！",
      req: { chair: 5, paid_slacking: 3, shield: 2 }
    }
  },
  ac_freeze: {
    id: "ac_freeze",
    name: "空调·制冷",
    type: "ac_freeze",
    icon: "❄️",
    desc: "自动锁定敌群喷射极寒冷气，伤害较低但能将命中的敌人冻结 1.0 秒（完全定身停止行动）！",
    tag: "控场 / 极寒冻结1s",
    levels: [
      { level: 1, desc: "每 2.5s 向密集敌群喷射极寒冷气 (半径 5.5m)，造成 20 伤害并冻结敌人 1.0 秒", damage: 20, interval: 2.5, range: 5.5 * M_TO_PX, freezeDuration: 1.0 },
      { level: 2, desc: "冷气范围 +20%，喷射间隔 -15%", rangeMult: 1.20, intervalMult: 0.85 },
      { level: 3, desc: "伤害 +25%，冻结持续时间延长至 1.3 秒", damageMult: 1.25, freezeDuration: 1.3 },
      { level: 4, desc: "冷气喷射角度扩大至 140°，冰霜穿透全怪", coneAngle: 140 },
      { level: 5, desc: "冻结时间延长至 1.6 秒，被冻结敌人受到所有伤害 +30%", freezeDuration: 1.6, freezeVulnerability: 0.30 }
    ]
  },
  ac_heat: {
    id: "ac_heat",
    name: "空调·制热",
    type: "ac_heat",
    icon: "🔥",
    desc: "自动锁定敌群喷射滚烫热浪，伤害较高并对命中的敌人附加持续灼烧热伤害（DoT）！",
    tag: "输出 / 持续灼烧",
    levels: [
      { level: 1, desc: "每 2.5s 向密集敌群喷射热浪 (半径 5.5m)，造成 50 伤害并灼烧敌人 3 秒 (每0.5s造成15伤害)", damage: 50, interval: 2.5, range: 5.5 * M_TO_PX, burnDps: 30, burnDuration: 3.0 },
      { level: 2, desc: "初始伤害 +25%，灼烧伤害 +25%", damageMult: 1.25, burnDmgMult: 1.25 },
      { level: 3, desc: "喷射间隔 -15%，灼烧持续时间延长至 4.0 秒", intervalMult: 0.85, burnDuration: 4.0 },
      { level: 4, desc: "热浪范围 +25%，喷射后在地面留下一道持续 2 秒的余热火海", rangeMult: 1.25, groundFire: true },
      { level: 5, desc: "初始伤害 +30%，被灼烧敌人死亡时引发烈焰爆炸", damageMult: 1.30, deathExplode: true }
    ]
  },
  ac_fusion_evo: {
    id: "ac_fusion_evo",
    name: "中央空调·冰火两重天",
    type: "ac_fusion_evo",
    icon: "💥❄️🔥",
    desc: "冷热共鸣终极进化！周期性在敌人最密集区域引发大范围冰火冷热对流核爆（范围爆炸攻击），造成 240% 爆发伤害并碎冰火海！",
    tag: "超武共鸣 / 冰火核爆 / 范围毁灭",
    evolution: {
      id: "ac_fusion_evo",
      name: "中央空调·冰火两重天",
      icon: "💥❄️🔥",
      desc: "每 3.2 秒在最密集敌群引爆冰火对流大核爆，对冻结敌人造成双倍暴击伤害并点燃全场！",
      req: { ac_freeze: 3, ac_heat: 3 }
    }
  }
};

// 15项被动技能配置表
export const SKILLS = {
  coffee: {
    id: "coffee",
    name: "加班咖啡",
    icon: "☕",
    desc: "攻击速度提升",
    tag: "攻击速度",
    maxLevel: 5,
    attackSpeed: [0.08, 0.16, 0.24, 0.32, 0.40],
    levelDescs: ["攻击速度 +8%", "攻击速度 +16%", "攻击速度 +24%", "攻击速度 +32%", "攻击速度 +40% (全武器极速爆发)"]
  },
  dual_screen: {
    id: "dual_screen",
    name: "双屏办公",
    icon: "🖥️",
    desc: "弹道数量增加",
    tag: "弹道数量",
    maxLevel: 5,
    projectiles: [1, 1, 2, 2, 3],
    levelDescs: ["弹道数 +1", "弹道数 +1，弹道速度 +10%", "弹道数 +2", "弹道数 +2，弹道速度 +20%", "弹道数 +3 (多发散射狂潮)"]
  },
  keyboard_warrior: {
    id: "keyboard_warrior",
    name: "键盘侠",
    icon: "⌨️",
    desc: "暴击率与暴击伤害提升",
    tag: "暴击 / 爆发",
    maxLevel: 5,
    critRate: [0.05, 0.10, 0.15, 0.20, 0.25],
    critDmg: [0.20, 0.35, 0.50, 0.70, 1.00],
    levelDescs: ["暴击率 +5%，暴击伤害 +20%", "暴击率 +10%，暴击伤害 +35%", "暴击率 +15%，暴击伤害 +50%", "暴击率 +20%，暴击伤害 +70%", "暴击率 +25%，暴击伤害 +100% (刀刀暴击)"]
  },
  kpi: {
    id: "kpi",
    name: "KPI重压",
    icon: "📊",
    desc: "全局武器伤害大幅提升",
    tag: "纯伤害",
    maxLevel: 5,
    damageBonus: [0.10, 0.20, 0.32, 0.45, 0.60],
    levelDescs: ["全伤害 +10%", "全伤害 +20%", "全伤害 +32%", "全伤害 +45%", "全伤害 +60% (极致输出)"]
  },
  boss_is_coming: {
    id: "boss_is_coming",
    name: "老板来了",
    icon: "👀",
    desc: "移动速度提升",
    tag: "机动 / 移速",
    maxLevel: 5,
    speedBonus: [0.08, 0.16, 0.24, 0.32, 0.42],
    levelDescs: ["移动速度 +8%", "移动速度 +16%", "移动速度 +24%", "移动速度 +32%", "移动速度 +42% (健步如飞)"]
  },
  quit: {
    id: "quit",
    name: "我不干了",
    icon: "🛑",
    desc: "低血量与高压时伤害暴增",
    tag: "背水一战",
    maxLevel: 5,
    lowHpDmg: [0.20, 0.40, 0.65, 0.95, 1.30],
    levelDescs: ["生命低于50%时伤害 +20%", "生命低于50%时伤害 +40%", "生命低于50%时伤害 +65%", "生命低于50%时伤害 +95%", "生命低于50%时伤害 +130% (逆风翻盘)"]
  },
  shield: {
    id: "shield",
    name: "工位护盾",
    icon: "🛡️",
    desc: "周期性生成抵挡1次伤害的护盾",
    tag: "生存 / 护盾",
    maxLevel: 5,
    shieldCd: [14.0, 11.5, 9.0, 7.0, 5.0],
    levelDescs: ["每14秒获得1层护盾抵挡伤害", "护盾冷却缩短至 11.5 秒", "护盾冷却缩短至 9.0 秒", "护盾冷却缩短至 7.0 秒", "护盾冷却缩短至 5.0 秒 (金身不坏)"]
  },
  paid_slacking: {
    id: "paid_slacking",
    name: "带薪摸鱼",
    icon: "📱",
    desc: "每秒持续回复生命值",
    tag: "持续回血",
    maxLevel: 5,
    regen: [0.8, 1.6, 2.6, 3.8, 5.2],
    levelDescs: ["每秒恢复 0.8 生命", "每秒恢复 1.6 生命", "每秒恢复 2.6 生命", "每秒恢复 3.8 生命", "每秒恢复 5.2 生命 (血条永动机)"]
  },
  lunch_break: {
    id: "lunch_break",
    name: "午休充电",
    icon: "🍱",
    desc: "最大生命值上限提升",
    tag: "生命上限",
    maxLevel: 5,
    maxHpBonus: [0.15, 0.30, 0.48, 0.68, 0.90],
    levelDescs: ["最大生命 +15%", "最大生命 +30%", "最大生命 +48%", "最大生命 +68%", "最大生命 +90% (肉盾体魄)"]
  },
  on_time_off: {
    id: "on_time_off",
    name: "准点下班",
    icon: "⏰",
    desc: "拾取范围与摸鱼经验获取提升",
    tag: "拾取 / 经验",
    maxLevel: 5,
    pickupBonus: [0.25, 0.50, 0.80, 1.15, 1.60],
    xpBonus: [0.08, 0.16, 0.25, 0.35, 0.50],
    levelDescs: ["拾取范围 +25%，经验获取 +8%", "拾取范围 +50%，经验获取 +16%", "拾取范围 +80%，经验获取 +25%", "拾取范围 +115%，经验获取 +35%", "拾取范围 +160%，经验获取 +50% (全屏吸取)"]
  },
  elevator_dash: {
    id: "elevator_dash",
    name: "电梯冲刺",
    icon: "🛗",
    desc: "闪避冷却缩短，闪避距离提升",
    tag: "闪避强化",
    maxLevel: 5,
    dodgeCdReduc: [0.15, 0.30, 0.45, 0.60, 0.75],
    levelDescs: ["闪避冷却 -15%", "闪避冷却 -30%，闪避距离 +15%", "闪避冷却 -45%，闪避距离 +30%", "闪避冷却 -60%，闪避距离 +45%", "闪避冷却 -75% (无限滑步)"]
  },
  toilet_excuse: {
    id: "toilet_excuse",
    name: "带薪如厕",
    icon: "🚽",
    desc: "完美闪避时掉落爆炸公文包并回血",
    tag: "反击 / 特效",
    maxLevel: 5,
    healAmount: [5, 10, 16, 24, 35],
    bombDmg: [40, 75, 120, 180, 260],
    levelDescs: ["完美闪避恢复 5 点生命并扔出炸弹", "完美闪避恢复 10 点生命，炸弹伤害 +80%", "完美闪避恢复 16 点生命，炸弹伤害 +150%", "完美闪避恢复 24 点生命，炸弹伤害 +220%", "完美闪避恢复 35 点生命，引爆全屏公文包！"]
  },
  loudspeaker_meeting: {
    id: "loudspeaker_meeting",
    name: "扩音会议",
    icon: "📢",
    desc: "全武器范围 (AOE) 大幅扩大",
    tag: "攻击范围",
    maxLevel: 5,
    areaBonus: [0.12, 0.24, 0.38, 0.54, 0.75],
    levelDescs: ["全技能范围 +12%", "全技能范围 +24%", "全技能范围 +38%", "全技能范围 +54%", "全技能范围 +75% (全屏覆盖)"]
  },
  slacker_science: {
    id: "slacker_science",
    name: "摸鱼科学",
    icon: "🔬",
    desc: "压力增长减缓，压力衰减加速",
    tag: "抗压 / 控压",
    maxLevel: 5,
    pressureReduc: [0.15, 0.30, 0.45, 0.60, 0.75],
    levelDescs: ["受击增加压力 -15%", "受击增加压力 -30%", "受击增加压力 -45%，压力衰减 +20%", "受击增加压力 -60%，压力衰减 +40%", "受击增加压力 -75%，绝不崩溃！"]
  },
  last_minute_rush: {
    id: "last_minute_rush",
    name: "临时抱佛脚",
    icon: "⚡",
    desc: "暴击时引发闪电链打击敌人",
    tag: "闪电链 / 特效",
    maxLevel: 5,
    chainDmg: [20, 38, 60, 90, 130],
    targets: [2, 3, 4, 5, 7],
    levelDescs: ["暴击时引发连锁闪电打击 2 个敌人", "连锁闪电打击 3 个目标，伤害 +90%", "连锁闪电打击 4 个目标，伤害 +150%", "连锁闪电打击 5 个目标，伤害 +220%", "连锁闪电打击 7 个目标 (全场雷暴)"]
  }
};

// 职场神器配置表
export const ARTIFACTS = {
  paid_poop: {
    id: "paid_poop",
    name: "带薪拉屎特权",
    icon: "🚽",
    desc: "每隔 35 秒获得 4 秒完全无敌与极速移动（摸鱼圣经）！",
    type: "buff"
  },
  company_wifi: {
    id: "company_wifi",
    name: "极速企业专线",
    icon: "📶",
    desc: "全武器攻击间隔永久减少 18%，拾取范围 +30%！",
    type: "stat"
  },
  boss_pie: {
    id: "boss_pie",
    name: "老板画的大饼",
    icon: "🥞",
    desc: "生命值每降低 10%，全武器伤害额外提升 +12%！",
    type: "buff"
  },
  year_end_bonus: {
    id: "year_end_bonus",
    name: "传说中的年终奖",
    icon: "💰",
    desc: "经验获取 +35%，每击杀 50 个敌人自动全屏拾取所有掉落物！",
    type: "special"
  },
  resignation_cert: {
    id: "resignation_cert",
    name: "离职证明（免死金牌）",
    icon: "📜",
    desc: "受到致命伤害时免疫死亡，瞬间恢复 50% 生命并震飞全屏敌人（限1次）！",
    type: "revive"
  },
  noise_cancelling_headphones: {
    id: "noise_cancelling_headphones",
    name: "主动降噪黑科技",
    icon: "🎧",
    desc: "受到远程子弹伤害降低 40%，且每 8 秒自动格挡一次敌方弹道！",
    type: "defense"
  },
  work_badge: {
    id: "work_badge",
    name: "镀金高级工牌",
    icon: "🪪",
    desc: "受到精英和Boss伤害减少 20%，对精英与Boss伤害提升 25%！",
    type: "boss_slayer"
  },
  boss_keyboard: {
    id: "boss_keyboard",
    name: "红轴机械键盘",
    icon: "⌨️",
    desc: "键盘武器伤害 +40%，所有武器暴击伤害额外 +50%！",
    type: "crit"
  }
};

// 普通敌人配置表
export const NORMAL_ENEMIES = {
  zombie_colleague: {
    id: "zombie_colleague",
    name: "同事僵尸",
    icon: "🧟",
    hp: 26,
    damage: 6,
    speed: 1.7 * M_TO_PX,
    threatCost: 1.0,
    xpDrop: 1,
    size: 14,
    color: "#9ca3af"
  },
  file_monster: {
    id: "file_monster",
    name: "文件怪",
    icon: "📁",
    hp: 36,
    damage: 8,
    speed: 1.35 * M_TO_PX,
    threatCost: 1.4,
    xpDrop: 2,
    size: 16,
    color: "#f59e0b",
    splitOnDeath: {
      count: 2,
      id: "paper_scrap",
      name: "散落纸片",
      hp: 8,
      damage: 3,
      speed: 1.6 * M_TO_PX,
      size: 9,
      color: "#fef3c7"
    }
  },
  mail_monster: {
    id: "mail_monster",
    name: "邮件怪",
    icon: "✉️",
    hp: 24,
    damage: 7,
    speed: 1.1 * M_TO_PX,
    threatCost: 1.8,
    xpDrop: 2,
    size: 13,
    color: "#38bdf8",
    attackType: "ranged",
    keepDistance: 5.5 * M_TO_PX,
    attackInterval: 2.2,
    bulletSpeed: 4.5 * M_TO_PX,
    bulletDamage: 7,
    telegraphTime: 0.35
  },
  printer: {
    id: "printer",
    name: "卡纸打印机",
    icon: "🖨️",
    hp: 75,
    damage: 10,
    speed: 0.7 * M_TO_PX,
    threatCost: 2.5,
    xpDrop: 4,
    size: 20,
    color: "#64748b",
    attackType: "burst_turret",
    burstCount: 3,
    burstInterval: 0.15,
    attackInterval: 3.5,
    bulletSpeed: 5.0 * M_TO_PX,
    bulletDamage: 8
  },
  meeting_monster: {
    id: "meeting_monster",
    name: "会议怪",
    icon: "👥",
    hp: 55,
    damage: 8,
    speed: 1.25 * M_TO_PX,
    threatCost: 2.0,
    xpDrop: 3,
    size: 18,
    color: "#a855f7",
    slowAura: {
      radius: 2.8 * M_TO_PX,
      slowPct: 0.25
    }
  },
  phone_monster: {
    id: "phone_monster",
    name: "电话怪",
    icon: "📞",
    hp: 28,
    damage: 6,
    speed: 1.5 * M_TO_PX,
    threatCost: 1.6,
    xpDrop: 2,
    size: 14,
    color: "#eab308",
    sonicPulse: {
      interval: 4.0,
      radius: 3.2 * M_TO_PX,
      damage: 7
    }
  },
  demand_ball: {
    id: "demand_ball",
    name: "急需求球",
    icon: "💣",
    hp: 20,
    damage: 12,
    speed: 2.5 * M_TO_PX,
    threatCost: 1.5,
    xpDrop: 2,
    size: 12,
    color: "#ef4444"
  },
  paper_scrap: {
    id: "paper_scrap",
    name: "散落纸片",
    icon: "📄",
    hp: 8,
    damage: 3,
    speed: 1.6 * M_TO_PX,
    threatCost: 0.5,
    xpDrop: 1,
    size: 9,
    color: "#fef3c7"
  },
  red_dot: {
    id: "red_dot",
    name: "未读红点",
    icon: "🔴",
    hp: 12,
    damage: 4,
    speed: 3.0 * M_TO_PX,
    threatCost: 0.7,
    groupCount: 4,
    xpDrop: 1,
    size: 8,
    color: "#dc2626"
  }
};

// 精英怪配置表
export const ELITES = {
  hr: {
    id: "hr",
    name: "HR",
    icon: "👩‍💼",
    hp: 500,
    damage: 14,
    dmgReduction: 0.10,
    speed: 1.3 * M_TO_PX,
    size: 26,
    color: "#f43f5e",
    spawnTime: 160,
    xpDrop: 60,
    artifactChance: 0.30,
    healChance: 0.25,
    skillCd: 6.0,
    telegraphTime: 1.2,
    debuffDuration: 5.0,
    debuffDmgReduc: 0.20
  },
  pm: {
    id: "pm",
    name: "项目经理",
    icon: "👨‍💼",
    hp: 680,
    damage: 15,
    dmgReduction: 0.12,
    speed: 1.25 * M_TO_PX,
    size: 28,
    color: "#0284c7",
    spawnTime: 290,
    xpDrop: 85,
    artifactChance: 0.40,
    summonDemandCd: 7.0,
    meetingZoneCd: 12.0,
    meetingZoneRadius: 3.5 * M_TO_PX,
    meetingZoneDuration: 4.0
  }
};

// 角色与武器综合晋升升级系统 (全面提升角色属性与武器属性)
export const UPGRADE_SYSTEM = {
  character: {
    title: "👤 角色个人属性",
    items: [
      { id: "hp_max", name: "体魄强化", icon: "❤️", desc: "最大生命 +5% / 级", maxLevel: 10, valPerLvl: 0.05, unit: "%", prices: [100, 180, 280, 420, 600, 820, 1100, 1450, 1900, 2500] },
      { id: "move_speed", name: "摸鱼步法", icon: "🏃", desc: "移动速度 +3% / 级", maxLevel: 10, valPerLvl: 0.03, unit: "%", prices: [90, 160, 250, 380, 540, 750, 1000, 1300, 1700, 2200] },
      { id: "hp_regen", name: "工位养生", icon: "🍵", desc: "每秒自然回血 +0.5 HP/s / 级", maxLevel: 10, valPerLvl: 0.5, unit: "HP/s", prices: [120, 220, 350, 520, 750, 1050, 1400, 1850, 2400, 3100] },
      { id: "stress_resist", name: "抗压心理", icon: "🧘", desc: "受击增加压力 -5%，压力衰减加快 / 级", maxLevel: 10, valPerLvl: 0.05, unit: "%", prices: [110, 200, 320, 480, 680, 920, 1250, 1650, 2150, 2800] },
      { id: "pickup_range", name: "敏锐触觉", icon: "🧲", desc: "拾取范围 +8% / 级", maxLevel: 10, valPerLvl: 0.08, unit: "%", prices: [80, 140, 220, 340, 500, 700, 950, 1250, 1650, 2100] },
      { id: "crit_boost", name: "精准摸鱼", icon: "🎯", desc: "暴击率 +2%，暴击伤害 +10% / 级", maxLevel: 10, valPerLvl: 0.02, unit: "%", prices: [130, 240, 380, 560, 800, 1100, 1500, 2000, 2600, 3400] },
      { id: "xp_gain", name: "打工悟性", icon: "💡", desc: "经验获取 +5% / 级", maxLevel: 10, valPerLvl: 0.05, unit: "%", prices: [100, 180, 290, 440, 630, 880, 1180, 1550, 2000, 2600] },
      { id: "gold_gain", name: "年终分红", icon: "💰", desc: "结算工资/金币获取 +8% / 级", maxLevel: 10, valPerLvl: 0.08, unit: "%", prices: [120, 220, 360, 540, 780, 1080, 1450, 1900, 2500, 3200] }
    ]
  },
  weapon: {
    title: "⚔️ 武器全局属性",
    items: [
      { id: "weapon_damage", name: "武器精通", icon: "🗡️", desc: "所有武器伤害 +5% / 级", maxLevel: 10, valPerLvl: 0.05, unit: "%", prices: [110, 200, 320, 480, 680, 940, 1260, 1650, 2150, 2800] },
      { id: "attack_speed", name: "攻击频率", icon: "⚡", desc: "全武器攻击攻速提升 / 冷却 -4% / 级", maxLevel: 10, valPerLvl: 0.04, unit: "%", prices: [120, 220, 350, 520, 740, 1020, 1360, 1780, 2300, 3000] },
      { id: "aoe_range", name: "范围扩散", icon: "💥", desc: "全范围攻击 / 爆炸 / 扫荡面积 +6% / 级", maxLevel: 10, valPerLvl: 0.06, unit: "%", prices: [100, 190, 300, 450, 640, 880, 1180, 1550, 2000, 2600] },
      { id: "bullet_speed", name: "弹道强化", icon: "🚀", desc: "飞行速度 +6%，投掷射程提升 / 级", maxLevel: 10, valPerLvl: 0.06, unit: "%", prices: [80, 150, 240, 360, 510, 700, 940, 1240, 1600, 2100] },
      { id: "knockback_power", name: "击退冲击", icon: "🛡️", desc: "武器击退力度 +8%，推开怪群 / 级", maxLevel: 10, valPerLvl: 0.08, unit: "%", prices: [90, 160, 260, 390, 550, 760, 1020, 1340, 1740, 2250] },
      { id: "evo_resonance", name: "超武共鸣", icon: "✨", desc: "超级进化与组合共鸣核爆伤害 +8% / 级", maxLevel: 10, valPerLvl: 0.08, unit: "%", prices: [140, 260, 420, 620, 880, 1200, 1600, 2100, 2750, 3600] }
    ]
  }
};

// 保持旧 TALENTS 的兼容映射
export const TALENTS = {
  health_check: { id: "health_check", name: "体检报告", icon: "📋", desc: "最大生命 +5% / 级", maxLevel: 10, valPerLvl: 0.05, prices: [100, 180, 280, 420, 600, 820, 1100, 1450, 1900, 2500] },
  skilled_worker: { id: "skilled_worker", name: "熟练工", icon: "🔧", desc: "全武器伤害 +5% / 级", maxLevel: 10, valPerLvl: 0.05, prices: [110, 200, 320, 480, 680, 940, 1260, 1650, 2150, 2800] },
  fast_runner: { id: "fast_runner", name: "跑得快", icon: "🏃", desc: "移动速度 +3% / 级", maxLevel: 10, valPerLvl: 0.03, prices: [90, 160, 250, 380, 540, 750, 1000, 1300, 1700, 2200] },
  slacker_xp: { id: "slacker_xp", name: "摸鱼经验", icon: "💡", desc: "经验获取 +5% / 级", maxLevel: 10, valPerLvl: 0.05, prices: [100, 180, 290, 440, 630, 880, 1180, 1550, 2000, 2600] },
  mental_construction: { id: "mental_construction", name: "心理建设", icon: "🧘", desc: "受击压力增加 -5% / 级", maxLevel: 10, valPerLvl: 0.05, prices: [110, 200, 320, 480, 680, 920, 1250, 1650, 2150, 2800] }
};

// 一周关卡与无尽模式体系 (通关解锁下一关)
export const STAGES_CONFIG = {
  stage_1: {
    id: "stage_1",
    name: "星期一 · 开放办公室",
    subtitle: "工位、茶水间与打印机的无限加班地狱",
    bgFloor: "#1e293b",
    gridColor: "#334155",
    mapWidth: 48 * M_TO_PX,
    mapHeight: 36 * M_TO_PX,
    duration: 480,
    unlockReqText: "初始已解锁",
    boss: {
      id: "supervisor",
      type: "supervisor",
      name: "部门主管",
      title: "终极加班推手",
      icon: "👹",
      hp: 3600,
      damage: 18,
      dmgReduction: 0.15,
      speed: 1.4 * M_TO_PX,
      size: 36,
      color: "#b91c1c"
    },
    timeline: [
      { start: 0, end: 45, budget: 11, hpMult: 1.00, dmgMult: 1.00, enemies: ["zombie_colleague", "file_monster"], desc: "同事僵尸 + 文件怪；学会移动与基础攻击" },
      { start: 45, end: 90, budget: 14, hpMult: 1.05, dmgMult: 1.00, enemies: ["zombie_colleague", "file_monster", "mail_monster"], desc: "加入邮件怪，考验远程躲避" },
      { start: 90, end: 140, budget: 18, hpMult: 1.15, dmgMult: 1.03, enemies: ["zombie_colleague", "file_monster", "mail_monster", "printer"], desc: "打印机炮台与HR精英" },
      { start: 140, end: 240, budget: 24, hpMult: 1.25, dmgMult: 1.08, enemies: ["zombie_colleague", "mail_monster", "phone_monster", "meeting_monster"], desc: "会议怪 + 电话怪软封锁" },
      { start: 240, end: 340, budget: 30, hpMult: 1.38, dmgMult: 1.12, enemies: ["zombie_colleague", "file_monster", "demand_ball", "red_dot"], desc: "项目经理与需求大潮" },
      { start: 340, end: 420, budget: 38, hpMult: 1.50, dmgMult: 1.18, enemies: ["zombie_colleague", "file_monster", "demand_ball", "red_dot", "meeting_monster"], desc: "临时需求事件", specialEvent: "temp_demand" },
      { start: 420, end: 480, budget: 48, hpMult: 1.70, dmgMult: 1.25, enemies: ["zombie_colleague", "demand_ball", "red_dot", "mail_monster", "phone_monster"], desc: "马上下班高潮冲刺" }
    ]
  },
  stage_2: {
    id: "stage_2",
    name: "星期二 · 会议室迷宫",
    subtitle: "连环对齐会与抓不住重点的PPT风暴",
    bgFloor: "#1a2238",
    gridColor: "#2a3b5c",
    mapWidth: 50 * M_TO_PX,
    mapHeight: 38 * M_TO_PX,
    duration: 480,
    unlockReqText: "通关【星期一】解锁",
    boss: {
      id: "project_director",
      type: "project_director",
      name: "项目总监",
      title: "PPT连环对齐狂人",
      icon: "🧛‍♂️",
      hp: 4200,
      damage: 20,
      dmgReduction: 0.16,
      speed: 1.45 * M_TO_PX,
      size: 36,
      color: "#6366f1"
    },
    timeline: [
      { start: 0, end: 60, budget: 13, hpMult: 1.05, dmgMult: 1.02, enemies: ["meeting_monster", "zombie_colleague"], desc: "会议怪双倍包围" },
      { start: 60, end: 150, budget: 19, hpMult: 1.18, dmgMult: 1.06, enemies: ["meeting_monster", "mail_monster", "phone_monster"], desc: "夺命连环call轰炸" },
      { start: 150, end: 280, budget: 28, hpMult: 1.32, dmgMult: 1.12, enemies: ["meeting_monster", "printer", "file_monster", "demand_ball"], desc: "打印机密布与议程封锁" },
      { start: 280, end: 480, budget: 42, hpMult: 1.60, dmgMult: 1.22, enemies: ["meeting_monster", "demand_ball", "red_dot", "phone_monster"], desc: "全屏会议与需求狂潮" }
    ]
  },
  stage_3: {
    id: "stage_3",
    name: "星期三 · 客户现场",
    subtitle: "改稿无底洞与“五彩斑斓的黑”",
    bgFloor: "#241c2c",
    gridColor: "#3d2a4a",
    mapWidth: 50 * M_TO_PX,
    mapHeight: 38 * M_TO_PX,
    duration: 480,
    unlockReqText: "通关【星期二】解锁",
    boss: {
      id: "demanding_client",
      type: "demanding_client",
      name: "刁难的客户",
      title: "改稿无底洞 · 致命甲方",
      icon: "🧐",
      hp: 4800,
      damage: 22,
      dmgReduction: 0.18,
      speed: 1.5 * M_TO_PX,
      size: 38,
      color: "#ec4899"
    },
    timeline: [
      { start: 0, end: 60, budget: 14, hpMult: 1.08, dmgMult: 1.05, enemies: ["demand_ball", "red_dot"], desc: "高速需求球连发" },
      { start: 60, end: 180, budget: 22, hpMult: 1.22, dmgMult: 1.10, enemies: ["demand_ball", "mail_monster", "file_monster"], desc: "邮件与需求混编" },
      { start: 180, end: 320, budget: 32, hpMult: 1.40, dmgMult: 1.16, enemies: ["demand_ball", "meeting_monster", "phone_monster"], desc: "甲方紧急会议连环拉通" },
      { start: 320, end: 480, budget: 46, hpMult: 1.70, dmgMult: 1.26, enemies: ["demand_ball", "red_dot", "meeting_monster", "file_monster"], desc: "极限改稿大狂潮" }
    ]
  },
  stage_4: {
    id: "stage_4",
    name: "星期四 · 运营与通信中心",
    subtitle: "夺命连环Call与全天候电波轰炸",
    bgFloor: "#091e28",
    gridColor: "#133544",
    mapWidth: 52 * M_TO_PX,
    mapHeight: 40 * M_TO_PX,
    duration: 480,
    unlockReqText: "通关【星期三】解锁",
    boss: {
      id: "harassment_call",
      type: "harassment_call",
      name: "骚扰电话",
      title: "夺命连环Call · 精神污染源",
      icon: "📞",
      hp: 5200,
      damage: 24,
      dmgReduction: 0.18,
      speed: 1.55 * M_TO_PX,
      size: 38,
      color: "#06b6d4"
    },
    timeline: [
      { start: 0, end: 60, budget: 15, hpMult: 1.12, dmgMult: 1.06, enemies: ["phone_monster", "printer"], desc: "高频声波与打印弹幕" },
      { start: 60, end: 180, budget: 24, hpMult: 1.28, dmgMult: 1.12, enemies: ["phone_monster", "mail_monster", "demand_ball"], desc: "电话怪与邮件混合封锁" },
      { start: 180, end: 340, budget: 35, hpMult: 1.48, dmgMult: 1.20, enemies: ["phone_monster", "meeting_monster", "red_dot", "printer"], desc: "声波减速与红点狂飙" },
      { start: 340, end: 480, budget: 50, hpMult: 1.80, dmgMult: 1.30, enemies: ["phone_monster", "demand_ball", "red_dot", "meeting_monster"], desc: "全机房失控高潮" }
    ]
  },
  stage_5: {
    id: "stage_5",
    name: "星期五 · 总裁董事办公室",
    subtitle: "大饼画满天、期权全画饼的终极资本家",
    bgFloor: "#23180c",
    gridColor: "#3d2a14",
    mapWidth: 52 * M_TO_PX,
    mapHeight: 40 * M_TO_PX,
    duration: 480,
    unlockReqText: "通关【星期四】解锁",
    boss: {
      id: "ceo_bigboss",
      type: "ceo_bigboss",
      name: "大老板·CEO",
      title: "资本大饼造梦师",
      icon: "👑",
      hp: 5800,
      damage: 25,
      dmgReduction: 0.20,
      speed: 1.55 * M_TO_PX,
      size: 40,
      color: "#eab308"
    },
    timeline: [
      { start: 0, end: 60, budget: 16, hpMult: 1.15, dmgMult: 1.08, enemies: ["zombie_colleague", "demand_ball"], desc: "高压加班大军涌入" },
      { start: 60, end: 180, budget: 26, hpMult: 1.32, dmgMult: 1.14, enemies: ["file_monster", "printer", "mail_monster"], desc: "文件暴风雨与大炮台" },
      { start: 180, end: 320, budget: 38, hpMult: 1.55, dmgMult: 1.22, enemies: ["meeting_monster", "phone_monster", "demand_ball"], desc: "连环战略对齐" },
      { start: 320, end: 480, budget: 54, hpMult: 1.90, dmgMult: 1.35, enemies: ["zombie_colleague", "demand_ball", "red_dot", "printer", "meeting_monster"], desc: "下班前最后一波资本狂潮" }
    ]
  },
  stage_6: {
    id: "stage_6",
    name: "周末特别篇 · 强制公司团建",
    subtitle: "打着放松旗号的折磨爬山与狼性拓展",
    bgFloor: "#142316",
    gridColor: "#1d3820",
    mapWidth: 54 * M_TO_PX,
    mapHeight: 42 * M_TO_PX,
    duration: 480,
    unlockReqText: "通关【星期五】解锁",
    boss: {
      id: "teambuilding_coach",
      type: "teambuilding_coach",
      name: "团建魔鬼教练",
      title: "狼性文化总教官",
      icon: "🦹‍♂️",
      hp: 6500,
      damage: 26,
      dmgReduction: 0.22,
      speed: 1.65 * M_TO_PX,
      size: 42,
      color: "#15803d"
    },
    timeline: [
      { start: 0, end: 60, budget: 18, hpMult: 1.20, dmgMult: 1.10, enemies: ["zombie_colleague", "red_dot"], desc: "强制徒步拉练" },
      { start: 60, end: 180, budget: 28, hpMult: 1.40, dmgMult: 1.18, enemies: ["meeting_monster", "demand_ball", "file_monster"], desc: "破冰游戏与信任背摔" },
      { start: 180, end: 320, budget: 42, hpMult: 1.68, dmgMult: 1.26, enemies: ["phone_monster", "printer", "demand_ball"], desc: "全员狼性宣誓" },
      { start: 320, end: 480, budget: 60, hpMult: 2.10, dmgMult: 1.40, enemies: ["zombie_colleague", "red_dot", "meeting_monster", "demand_ball", "phone_monster"], desc: "魔鬼拉练终极考核" }
    ]
  },
  stage_endless: {
    id: "stage_endless",
    name: "无尽模式 · 通宵加班",
    subtitle: "没有下班时间！怪物随时间无限狂暴增长，随机强力Boss轮番突袭！",
    bgFloor: "#0f172a",
    gridColor: "#1e293b",
    mapWidth: 56 * M_TO_PX,
    mapHeight: 44 * M_TO_PX,
    duration: Infinity,
    isEndless: true,
    unlockReqText: "通关【星期一】即可开启无尽挑战",
    boss: {
      id: "random_endless_boss",
      type: "demanding_client",
      name: "突袭强力Boss",
      title: "通宵狂暴主宰",
      icon: "⚡👹",
      hp: 5000,
      damage: 25,
      dmgReduction: 0.20,
      speed: 1.5 * M_TO_PX,
      size: 38,
      color: "#f43f5e"
    },
    timeline: [
      { start: 0, end: 999999, budget: 20, hpMult: 1.0, dmgMult: 1.0, enemies: ["zombie_colleague", "file_monster", "mail_monster", "meeting_monster", "phone_monster", "printer", "demand_ball", "red_dot"], desc: "无尽狂潮" }
    ]
  }
};

export const RANDOM_BOSS_ROSTER = [
  { id: "supervisor", type: "supervisor", name: "部门主管", title: "终极加班推手", icon: "👹", hp: 3600, damage: 18, color: "#b91c1c", speed: 1.4 * M_TO_PX },
  { id: "project_director", type: "project_director", name: "项目总监", title: "PPT连环对齐狂人", icon: "🧛‍♂️", hp: 4200, damage: 20, color: "#6366f1", speed: 1.45 * M_TO_PX },
  { id: "demanding_client", type: "demanding_client", name: "刁难的客户", title: "改稿无底洞 · 致命甲方", icon: "🧐", hp: 4800, damage: 22, color: "#ec4899", speed: 1.5 * M_TO_PX },
  { id: "harassment_call", type: "harassment_call", name: "骚扰电话", title: "夺命连环Call · 精神污染源", icon: "📞", hp: 5200, damage: 24, color: "#06b6d4", speed: 1.55 * M_TO_PX },
  { id: "ceo_bigboss", type: "ceo_bigboss", name: "大老板·CEO", title: "资本大饼造梦师", icon: "👑", hp: 5800, damage: 25, color: "#eab308", speed: 1.55 * M_TO_PX }
];

export const BOSS_CONFIG = STAGES_CONFIG.stage_1.boss;
