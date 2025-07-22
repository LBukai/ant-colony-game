class Vector2 {
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }
    
    add(v) {
        this.x += v.x;
        this.y += v.y;
        return this;
    }
    
    multiply(scalar) {
        this.x *= scalar;
        this.y *= scalar;
        return this;
    }
    
    normalize() {
        const mag = Math.sqrt(this.x * this.x + this.y * this.y);
        if (mag > 0) {
            this.x /= mag;
            this.y /= mag;
        }
        return this;
    }
    
    distance(v) {
        const dx = this.x - v.x;
        const dy = this.y - v.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    clone() {
        return new Vector2(this.x, this.y);
    }
    
    static random() {
        return new Vector2(
            (Math.random() - 0.5) * 2,
            (Math.random() - 0.5) * 2
        ).normalize();
    }
}