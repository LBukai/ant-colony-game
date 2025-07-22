class Food {
    constructor(x, y, stacks = 5) {
        this.position = new Vector2(x, y);
        this.size = 4;
        this.stacks = stacks;
        this.maxStacks = stacks;
    }
    
    collectFood() {
        if (this.stacks > 0) {
            this.stacks--;
            return true;
        }
        return false;
    }
    
    isEmpty() {
        return this.stacks <= 0;
    }
    
    draw(ctx) {
        if (this.stacks <= 0) return;
        
        // Color intensity based on remaining stacks
        const intensity = Math.max(0.3, this.stacks / this.maxStacks);
        const green = Math.floor(255 * intensity);
        
        ctx.fillStyle = `rgb(0, ${green}, 0)`;
        ctx.beginPath();
        ctx.arc(this.position.x, this.position.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw stack count
        if (this.stacks > 1) {
            ctx.fillStyle = '#fff';
            ctx.font = '8px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(this.stacks.toString(), this.position.x, this.position.y - 8);
        }
    }
}

class Obstacle {
    constructor(x, y, radius = 30) {
        this.position = new Vector2(x, y);
        this.radius = radius;
    }
    
    draw(ctx) {
        ctx.fillStyle = '#666';
        ctx.beginPath();
        ctx.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
    }
}

class Pheromone {
    constructor(x, y, type, strength, colony = null) {
        this.position = new Vector2(x, y);
        this.type = type; // 'food', 'enemy', 'explore'
        this.strength = strength;
        this.colony = colony; // Which colony left this pheromone
        this.maxLifetime = this.getLifetime(type);
        this.lifetime = this.maxLifetime;
    }
    
    getLifetime(type) {
        switch(type) {
            case 'enemy': return 8000; // Enemy pheromones last longer
            case 'food': return 5000;
            case 'explore': return 3000;
            default: return 5000;
        }
    }
    
    update(deltaTime) {
        this.lifetime -= deltaTime;
        this.strength = (this.lifetime / this.maxLifetime) * 0.8;
    }
    
    draw(ctx) {
        if (this.strength <= 0) return;
        
        ctx.save();
        ctx.globalAlpha = this.strength;
        
        // Different colors for different pheromone types
        switch(this.type) {
            case 'food':
                ctx.fillStyle = '#ffaa00';
                break;
            case 'enemy':
                ctx.fillStyle = '#ff4444';
                break;
            case 'explore':
            default:
                ctx.fillStyle = '#0088ff';
                break;
        }
        
        ctx.beginPath();
        
        // Different sizes for different types
        const size = this.type === 'enemy' ? 3 : 2;
        ctx.arc(this.position.x, this.position.y, size, 0, Math.PI * 2);
        ctx.fill();
        
        // Add a subtle glow effect for enemy pheromones
        if (this.type === 'enemy') {
            ctx.globalAlpha = this.strength * 0.3;
            ctx.beginPath();
            ctx.arc(this.position.x, this.position.y, 6, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.restore();
    }
}