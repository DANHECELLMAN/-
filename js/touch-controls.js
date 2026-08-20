// =========================================================
// 移动端多点触控与虚拟摇杆系统
// =========================================================

export class TouchController {
    constructor(touchContainer, onMoveCallback, onSkillCallback) {
        this.container = touchContainer;
        this.onMove = onMoveCallback;
        this.onSkill = onSkillCallback;

        this.joystickPointerId = null;
        this.originX = 0;
        this.originY = 0;
        this.maxRadius = 45;
        this.vector = { x: 0, y: 0 };

        this.cdDashOverlay = document.getElementById('cd-dash');
        this.cdSpecialOverlay = document.getElementById('cd-special');

        this.initJoystickDOM();
        this.bindEvents();
    }

    initJoystickDOM() {
        this.base = document.createElement('div');
        this.stick = document.createElement('div');

        Object.assign(this.base.style, {
            position: 'absolute',
            width: '90px',
            height: '90px',
            borderRadius: '50%',
            backgroundColor: 'rgba(255, 255, 255, 0.12)',
            border: '2px solid rgba(56, 189, 248, 0.4)',
            boxShadow: '0 0 15px rgba(56, 189, 248, 0.2)',
            display: 'none',
            pointerEvents: 'none',
            transform: 'translate(-50%, -50%)',
            zIndex: '35'
        });

        Object.assign(this.stick.style, {
            position: 'absolute',
            width: '38px',
            height: '38px',
            borderRadius: '50%',
            backgroundColor: 'rgba(56, 189, 248, 0.75)',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.4)',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'none'
        });

        this.base.appendChild(this.stick);
        this.container.appendChild(this.base);
    }

    bindEvents() {
        // 监听左侧触控区域（摇杆生成）
        this.container.addEventListener('pointerdown', (e) => {
            if (e.target.closest('.action-btn') || e.target.closest('.hud-btn')) {
                return;
            }
            // 屏幕左侧 65% 区域支持任意位置按下呼出摇杆
            if (this.joystickPointerId === null && e.clientX < window.innerWidth * 0.65) {
                this.joystickPointerId = e.pointerId;
                this.originX = e.clientX;
                this.originY = e.clientY;

                this.base.style.left = `${this.originX}px`;
                this.base.style.top = `${this.originY}px`;
                this.base.style.display = 'block';
                this.stick.style.transform = 'translate(-50%, -50%)';
            }
        });

        window.addEventListener('pointermove', (e) => {
            if (e.pointerId !== this.joystickPointerId) return;

            const dx = e.clientX - this.originX;
            const dy = e.clientY - this.originY;
            const dist = Math.hypot(dx, dy);

            const angle = Math.atan2(dy, dx);
            const clampedDist = Math.min(dist, this.maxRadius);

            const stickX = Math.cos(angle) * clampedDist;
            const stickY = Math.sin(angle) * clampedDist;

            this.stick.style.transform = `translate(calc(-50% + ${stickX}px), calc(-50% + ${stickY}px))`;

            const strength = clampedDist / this.maxRadius;
            this.vector.x = Math.cos(angle) * strength;
            this.vector.y = Math.sin(angle) * strength;

            if (this.onMove) this.onMove(this.vector);
        });

        const handlePointerEnd = (e) => {
            if (e.pointerId === this.joystickPointerId) {
                this.joystickPointerId = null;
                this.base.style.display = 'none';
                this.vector = { x: 0, y: 0 };
                if (this.onMove) this.onMove(this.vector);
            }
        };

        window.addEventListener('pointerup', handlePointerEnd);
        window.addEventListener('pointercancel', handlePointerEnd);

        // 技能按键
        const btnDash = document.getElementById('btn-skill-dash');
        const btnSpecial = document.getElementById('btn-skill-special');

        if (btnDash) {
            btnDash.addEventListener('pointerdown', (e) => {
                e.stopPropagation();
                if (this.onSkill) this.onSkill('dash');
            });
        }

        if (btnSpecial) {
            btnSpecial.addEventListener('pointerdown', (e) => {
                e.stopPropagation();
                if (this.onSkill) this.onSkill('special');
            });
        }
    }

    updateCooldowns(dashRatio, specialRatio) {
        if (this.cdDashOverlay) {
            this.cdDashOverlay.style.height = `${Math.min(100, Math.max(0, dashRatio * 100))}%`;
        }
        if (this.cdSpecialOverlay) {
            this.cdSpecialOverlay.style.height = `${Math.min(100, Math.max(0, specialRatio * 100))}%`;
        }
    }
}
