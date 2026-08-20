// =========================================================
// 空间哈希网格与对象池 (性能核心模块)
// =========================================================

/**
 * 空间网格分区系统，将 O(N^2) 碰撞检测降低至接近 O(N)
 */
export class SpatialGrid {
    constructor(cellSize = 120) {
        this.cellSize = cellSize;
        this.grid = new Map();
    }

    clear() {
        this.grid.clear();
    }

    _getKey(x, y) {
        const cx = Math.floor(x / this.cellSize);
        const cy = Math.floor(y / this.cellSize);
        return `${cx}_${cy}`;
    }

    insert(entity) {
        const key = this._getKey(entity.x, entity.y);
        let cell = this.grid.get(key);
        if (!cell) {
            cell = [];
            this.grid.set(key, cell);
        }
        cell.push(entity);
    }

    getNearby(x, y, radius = 0) {
        const results = [];
        const minX = Math.floor((x - radius) / this.cellSize);
        const maxX = Math.floor((x + radius) / this.cellSize);
        const minY = Math.floor((y - radius) / this.cellSize);
        const maxY = Math.floor((y + radius) / this.cellSize);

        for (let cx = minX; cx <= maxX; cx++) {
            for (let cy = minY; cy <= maxY; cy++) {
                const cell = this.grid.get(`${cx}_${cy}`);
                if (cell) {
                    for (let i = 0; i < cell.length; i++) {
                        results.push(cell[i]);
                    }
                }
            }
        }
        return results;
    }
}

/**
 * 高性能通用对象池，消除频繁创建与垃圾回收(GC)导致的帧率波动
 */
export class ObjectPool {
    constructor(createFn, resetFn, initialSize = 30) {
        this.createFn = createFn;
        this.resetFn = resetFn;
        this.pool = [];
        for (let i = 0; i < initialSize; i++) {
            this.pool.push(this.createFn());
        }
    }

    acquire(...args) {
        const item = this.pool.length > 0 ? this.pool.pop() : this.createFn();
        if (this.resetFn) {
            this.resetFn(item, ...args);
        }
        return item;
    }

    release(item) {
        this.pool.push(item);
    }
}
