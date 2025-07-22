class Hive {
    constructor(x, y, color, isPlayer = false) {
        this.nest = new Vector2(x, y);
        this.color = color;
        this.ants = [];
        this.foodStored = 50;
        this.isPlayer = isPlayer;
        
        // Hive health system
        this.maxHealth = 500;
        this.health = this.maxHealth;
        this.isDestroyed = false;
        this.nestRadius = 15;
        this.lastDamageTime = 0;
    }
    
    addAnt(type, count = 1) {
        for (let i = 0; i < count; i++) {
            let ant;
            const x = this.nest.x + (Math.random() - 0.5) * 40;
            const y = this.nest.y + (Math.random() - 0.5) * 40;
            
            switch(type) {
                case 'warrior':
                    ant = new WarriorAnt(x, y, this);
                    break;
                case 'healer':
                    ant = new HealerAnt(x, y, this);
                    break;
                case 'scout':
                    ant = new ScoutAnt(x, y, this);
                    break;
                default:
                    ant = new WorkerAnt(x, y, this);
                    break;
            }
            
            this.ants.push(ant);
        }
    }
    
    recruitAnt(type) {
        const costs = {
            'worker': 5,
            'warrior': 15,
            'healer': 12,
            'scout': 8
        };
        
        const cost = costs[type] || 5;
        if (this.foodStored >= cost && !this.isDestroyed) {
            this.foodStored -= cost;
            this.addAnt(type, 1);
            return true;
        }
        return false;
    }
    
    getAntCounts() {
        const counts = { worker: 0, warrior: 0, healer: 0, scout: 0 };
        for (let ant of this.ants) {
            counts[ant.type]++;
        }
        return counts;
    }
    
    takeDamage(damage, attacker) {
        if (this.isDestroyed) return false;
        
        this.health -= damage;
        this.lastDamageTime = Date.now();
        
        if (this.health <= 0) {
            this.health = 0;
            this.isDestroyed = true;
            console.log(`${this.color} hive destroyed by ${attacker.colony.color} ${attacker.type}!`);
            return true;
        }
        
        return false;
    }
    
    updateHiveHealth() {
        if (this.isDestroyed) return;
        
        const timeSinceLastDamage = Date.now() - this.lastDamageTime;
        const regenDelay = 5000;
        
        if (timeSinceLastDamage > regenDelay && this.health < this.maxHealth) {
            this.health += 0.5;
            this.health = Math.min(this.health, this.maxHealth);
        }
    }
    
    update(allAnts, foods, obstacles, pheromones, config, canvasWidth, canvasHeight) {
        this.updateHiveHealth();
        
        if (this.isDestroyed) return;
        
        for (let ant of this.ants) {
            if (ant.health > 0) {
                ant.update(allAnts, foods, obstacles, pheromones, config, canvasWidth, canvasHeight);
            }
        }
        
        this.ants = this.ants.filter(ant => ant.health > 0);
    }
    
    draw(ctx) {
        if (this.isDestroyed) {
            this.drawDestroyedHive(ctx);
        } else {
            this.drawActiveHive(ctx);
        }
        
        for (let ant of this.ants) {
            ant.draw(ctx);
        }
    }
    
    drawActiveHive(ctx) {
        // Draw nest
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.nest.x, this.nest.y, this.nestRadius, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Draw hive health bar
        const healthBarWidth = 30;
        const healthBarHeight = 4;
        const healthRatio = this.health / this.maxHealth;
        
        // Health bar background
        ctx.fillStyle = '#333';
        ctx.fillRect(this.nest.x - healthBarWidth/2, this.nest.y - 30, healthBarWidth, healthBarHeight);
        
        // Health bar fill
        if (healthRatio > 0.6) {
            ctx.fillStyle = '#00ff00';
        } else if (healthRatio > 0.3) {
            ctx.fillStyle = '#ffff00';
        } else {
            ctx.fillStyle = '#ff0000';
        }
        ctx.fillRect(this.nest.x - healthBarWidth/2, this.nest.y - 30, healthBarWidth * healthRatio, healthBarHeight);
        
        // Health bar border
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.strokeRect(this.nest.x - healthBarWidth/2, this.nest.y - 30, healthBarWidth, healthBarHeight);
        
        // Draw food storage indicator
        ctx.fillStyle = '#fff';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(this.foodStored.toString(), this.nest.x, this.nest.y - 20);
    }
    
    drawDestroyedHive(ctx) {
        // Draw destroyed hive
        ctx.fillStyle = '#444';
        ctx.beginPath();
        ctx.arc(this.nest.x, this.nest.y, this.nestRadius, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw destruction cracks
        ctx.strokeStyle = '#222';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(this.nest.x - 10, this.nest.y - 5);
        ctx.lineTo(this.nest.x + 8, this.nest.y + 7);
        ctx.moveTo(this.nest.x - 7, this.nest.y + 8);
        ctx.lineTo(this.nest.x + 5, this.nest.y - 9);
        ctx.stroke();
        
        // Draw "DESTROYED" text
        ctx.fillStyle = '#ff0000';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('DESTROYED', this.nest.x, this.nest.y - 25);
    }
}

// Alias for backward compatibility
class Colony extends Hive {
    constructor(x, y, color, count, isPlayer = false) {
        super(x, y, color, isPlayer);
        
        // Create initial workers
        this.addAnt('worker', Math.min(count, 20));
    }
}