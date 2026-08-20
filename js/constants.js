// =========================================================
// 游戏核心常量与数值配置表
// =========================================================

// 升级所需经验表（支持 50 级平滑成长）
export const XP_TABLE = (() => {
    const table = [0];
    let xp = 8;
    for (let lv = 1; lv <= 60; lv++) {
        table.push(Math.floor(xp));
        xp = xp * 1.25 + 5;
    }
    return table;
})();

// 角色预设与初始数值
export const CHARACTERS = {
    xiaochen: {
        id: 'xiaochen',
        name: '小陈',
        title: '全能运营',
        icon: '☕',
        baseStats: {
            hp: 100,
            maxHp: 100,
            speed: 210,
            attackDamage: 15,
            attackSpeed: 1.2, // 每秒攻击次数
            pickupRadius: 90,
            defense: 2,
            dashCooldown: 3.0,
            specialCooldown: 12.0
        },
        weapon: 'coffee_splash',
        description: '泼洒热咖啡，对前方造成扇形范围伤害与击退。'
    },
    ayun: {
        id: 'ayun',
        name: '阿云',
        title: '卷王程序',
        icon: '💻',
        baseStats: {
            hp: 75,
            maxHp: 75,
            speed: 235,
            attackDamage: 22,
            attackSpeed: 1.6,
            pickupRadius: 100,
            defense: 0,
            dashCooldown: 2.2,
            specialCooldown: 10.0
        },
        weapon: 'code_bug',
        description: '射出致命的 NullPointerException 代码报错光弹，穿透敌人。'
    },
    laozhang: {
        id: 'laozhang',
        name: '老张',
        title: '资深老油条',
        icon: '🍵',
        baseStats: {
            hp: 150,
            maxHp: 150,
            speed: 180,
            attackDamage: 12,
            attackSpeed: 0.9,
            pickupRadius: 80,
            defense: 6,
            dashCooldown: 4.0,
            specialCooldown: 15.0
        },
        weapon: 'tea_aura',
        description: '周身环绕摸鱼热茶光环，持续对近身敌人造成反震与生命自愈。'
    }
};

// 强化技能池 (Roguelike Upgrade Cards)
export const UPGRADE_POOL = [
    {
        id: 'atk_up',
        title: '薪资激励 (攻击提升)',
        desc: '基础攻击力提升 +20%',
        icon: '⚔️',
        rarity: 'common',
        apply: (player) => { player.attackDamage = Math.round(player.attackDamage * 1.2); }
    },
    {
        id: 'atk_speed_up',
        title: '加班加速 (攻速提升)',
        desc: '攻击触发频率提升 +25%',
        icon: '⚡',
        rarity: 'common',
        apply: (player) => { player.attackSpeed *= 1.25; }
    },
    {
        id: 'max_hp_up',
        title: '医保升级 (生命上限)',
        desc: '生命上限 +30，并立即恢复 30 点生命',
        icon: '❤️',
        rarity: 'common',
        apply: (player) => {
            player.maxHp += 30;
            player.hp = Math.min(player.maxHp, player.hp + 30);
        }
    },
    {
        id: 'speed_up',
        title: '提早下班 (移速提升)',
        desc: '移动速度提升 +15%',
        icon: '👟',
        rarity: 'common',
        apply: (player) => { player.speed *= 1.15; }
    },
    {
        id: 'pickup_up',
        title: '年终奖磁铁 (拾取范围)',
        desc: '经验与掉落物拾取半径提升 +50%',
        icon: '🧲',
        rarity: 'rare',
        apply: (player) => { player.pickupRadius *= 1.5; }
    },
    {
        id: 'bullet_count_up',
        title: '群发邮件 (弹道+1)',
        desc: '主武器每次攻击额外发射 1 枚弹体',
        icon: '📨',
        rarity: 'rare',
        apply: (player) => { player.projectileCount = (player.projectileCount || 1) + 1; }
    },
    {
        id: 'revolving_laptop',
        title: '带薪旋转笔记本 (护身武器)',
        desc: '召唤一台围绕自身高速旋转的笔记本电脑，击退靠近的敌人',
        icon: '💻',
        rarity: 'rare',
        apply: (player) => { player.hasOrbitLaptop = true; player.orbitCount = (player.orbitCount || 0) + 1; }
    },
    {
        id: 'vampire_coffee',
        title: '双倍浓缩 (击杀吸血)',
        desc: '击退敌人时有 15% 几率恢复 2 点生命值',
        icon: '☕',
        rarity: 'epic',
        apply: (player) => { player.lifesteal = (player.lifesteal || 0) + 0.15; }
    },
    {
        id: 'crit_rate_up',
        title: 'KPI 超额 (暴击强化)',
        desc: '暴击几率 +15%，暴击伤害 200%',
        icon: '🎯',
        rarity: 'epic',
        apply: (player) => { player.critRate = (player.critRate || 0.05) + 0.15; }
    }
];

// 怪物类型配置
export const MONSTER_TYPES = {
    normal_bug: {
        id: 'normal_bug',
        name: '紧急需求 Bug',
        icon: '🐛',
        radius: 12,
        color: '#ef4444',
        speed: 95,
        hp: 20,
        damage: 8,
        exp: 1
    },
    micromanager: {
        id: 'micromanager',
        name: '夺命催促进度怪',
        icon: '⏰',
        radius: 14,
        color: '#f97316',
        speed: 130,
        hp: 35,
        damage: 12,
        exp: 3
    },
    elite_pm: {
        id: 'elite_pm',
        name: '画饼产品经理 (精英)',
        icon: '📋',
        radius: 20,
        color: '#a855f7',
        speed: 80,
        hp: 220,
        damage: 20,
        exp: 15,
        isElite: true
    },
    boss_kpi: {
        id: 'boss_kpi',
        name: '无情 KPI 大魔王 (BOSS)',
        icon: '👹',
        radius: 36,
        color: '#dc2626',
        speed: 70,
        hp: 1500,
        damage: 35,
        exp: 100,
        isBoss: true
    }
};
