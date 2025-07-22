class Ant {
    constructor(x, y, colony, type = 'worker') {
        this.position = new Vector2(x, y);
        this.velocity = new Vector2();
        this.acceleration = new Vector2();
        this.colony = colony;
        this.type = type;
        
        // Set stats based on ant type
        this.setStatsFromType(type);
        
        this.wanderAngle = Math.random() * Math.PI * 2;
        this.state = 'exploring'; // exploring, returning, fighting, healing
        this.target = null;
        
        this.color = colony.color;
        this.lastPheromoneTime = 0;
        this.lastHealTime = 0;
    }
    
    setStatsFromType(type) {
        switch(type) {
            case 'worker':
                this.maxSpeed = 2;
                this.maxForce = 0.1;
                this.size = 3;
                this.maxHealth = 80;
                this.health = 80;
                this.attack = 5;
                this.canCollectFood = true;
                this.healingPower = 0;
                break;
            case 'warrior':
                this.maxSpeed = 2;
                this.maxForce = 0.12;
                this.size = 4;
                this.maxHealth = 150;
                this.health = 150;
                this.attack = 20;
                this.canCollectFood = true;
                this.healingPower = 0;
                break;
            case 'healer':
                this.maxSpeed = 2.5;
                this.maxForce = 0.15;
                this.size = 3;
                this.maxHealth = 100;
                this.health = 100;
                this.attack = 3;
                this.canCollectFood = false;
                this.healingPower = 15;
                break;
        }
        this.energy = 100;
        this.carryingFood = false;
    }
    
    update(ants, foods, obstacles, pheromones, config, canvasWidth, canvasHeight) {
        this.acceleration.x = 0;
        this.acceleration.y = 0;
        
        // Apply behaviors based on current state
        if (this.carryingFood) {
            this.state = 'returning';
            this.applySeek(this.colony.nest);
        } else {
            this.state = 'exploring';
            this.applyForaging(foods, pheromones, config);
        }
        
        // Apply social behaviors
        this.applySeparation(ants, config);
        this.applyAggression(ants, config);
        this.applyWander(config);
        this.avoidObstacles(obstacles);
        
        // Update physics
        this.velocity.add(this.acceleration);
        this.velocity.x = Math.max(-this.maxSpeed * config.speed, Math.min(this.maxSpeed * config.speed, this.velocity.x));
        this.velocity.y = Math.max(-this.maxSpeed * config.speed, Math.min(this.maxSpeed * config.speed, this.velocity.y));
        
        this.position.add(this.velocity);
        
        // Wrap around screen edges
        if (this.position.x < 0) this.position.x = canvasWidth;
        if (this.position.x > canvasWidth) this.position.x = 0;
        if (this.position.y < 0) this.position.y = canvasHeight;
        if (this.position.y > canvasHeight) this.position.y = 0;
        
        // Drop pheromones
        this.dropPheromone(pheromones);
        
        // Check for food collection
        if (!this.carryingFood) {
            this.checkFoodCollection(foods);
        }
        
        // Check if returning to nest with food
        if (this.carryingFood && this.position.distance(this.colony.nest) < 20) {
            this.carryingFood = false;
            this.colony.foodStored++;
        }
    }
    
    applyForaging(foods, pheromones, config) {
        let closestFood = null;
        let closestDistance = Infinity;
        
        // Look for nearby food
        for (let food of foods) {
            const distance = this.position.distance(food.position);
            if (distance < 50 && distance < closestDistance) {
                closestFood = food;
                closestDistance = distance;
            }
        }
        
        if (closestFood) {
            this.applySeek(closestFood.position);
        } else {
            // Follow pheromone trails
            this.followPheromones(pheromones, config);
        }
    }
    
    followPheromones(pheromones, config) {
        const senseRadius = 30;
        let totalForce = new Vector2();
        let count = 0;
        
        for (let pheromone of pheromones) {
            const distance = this.position.distance(pheromone.position);
            if (distance < senseRadius && pheromone.type === 'food') {
                const force = new Vector2(
                    pheromone.position.x - this.position.x,
                    pheromone.position.y - this.position.y
                ).normalize().multiply(pheromone.strength * config.pheromoneAttraction);
                
                totalForce.add(force);
                count++;
            }
        }
        
        if (count > 0) {
            totalForce.multiply(1 / count);
            this.acceleration.add(totalForce);
        }
    }
    
    applySeek(target) {
        const desired = new Vector2(
            target.x - this.position.x,
            target.y - this.position.y
        ).normalize().multiply(this.maxSpeed);
        
        const steer = new Vector2(
            desired.x - this.velocity.x,
            desired.y - this.velocity.y
        );
        
        steer.x = Math.max(-this.maxForce, Math.min(this.maxForce, steer.x));
        steer.y = Math.max(-this.maxForce, Math.min(this.maxForce, steer.y));
        
        this.acceleration.add(steer);
    }
    
    applySeparation(ants, config) {
        const separationRadius = 15;
        let steer = new Vector2();
        let count = 0;
        
        for (let other of ants) {
            const distance = this.position.distance(other.position);
            if (distance > 0 && distance < separationRadius) {
                const diff = new Vector2(
                    this.position.x - other.position.x,
                    this.position.y - other.position.y
                ).normalize().multiply(1 / distance);
                
                steer.add(diff);
                count++;
            }
        }
        
        if (count > 0) {
            steer.multiply(1 / count).normalize().multiply(this.maxSpeed);
            steer.x -= this.velocity.x;
            steer.y -= this.velocity.y;
            steer.x = Math.max(-this.maxForce, Math.min(this.maxForce, steer.x));
            steer.y = Math.max(-this.maxForce, Math.min(this.maxForce, steer.y));
            
            this.acceleration.add(steer);
        }
    }
    
    applyAggression(ants, config) {
        if (config.aggression === 0) return;
        
        const aggressionRadius = 25;
        const hiveAttackRadius = 20;
        
        for (let other of ants) {
            if (other.colony !== this.colony) {
                const distance = this.position.distance(other.position);
                if (distance < aggressionRadius) {
                    // Attack enemy ant
                    const attackForce = new Vector2(
                        other.position.x - this.position.x,
                        other.position.y - this.position.y
                    ).normalize().multiply(config.aggression * 0.5);
                    
                    this.acceleration.add(attackForce);
                    
                    if (distance < 8) {
                        other.health -= this.attack * config.aggression * 0.1;
                    }
                }
            }
        }
        
        // Check for hive attacks
        for (let colony of window.gameInstance.colonies) {
            if (colony !== this.colony && !colony.isDestroyed) {
                const distanceToHive = this.position.distance(colony.nest);
                if (distanceToHive < hiveAttackRadius) {
                    // Move towards enemy hive
                    const attackForce = new Vector2(
                        colony.nest.x - this.position.x,
                        colony.nest.y - this.position.y
                    ).normalize().multiply(config.aggression * 0.3);
                    
                    this.acceleration.add(attackForce);
                    
                    // Attack hive if close enough
                    if (distanceToHive < colony.nestRadius + 5) {
                        const damage = this.attack * config.aggression * 0.2;
                        const hiveDestroyed = colony.takeDamage(damage, this);
                        
                        if (hiveDestroyed && window.gameInstance) {
                            window.gameInstance.checkWinCondition();
                        }
                    }
                }
            }
        }
    }
    
    applyHealingBehavior(ants) {
        if (this.healingPower === 0) return;
        
        const healRadius = 40;
        let targetToHeal = null;
        let lowestHealthRatio = 1;
        
        // Find the most injured ally nearby
        for (let other of ants) {
            if (other.colony === this.colony && other !== this) {
                const distance = this.position.distance(other.position);
                const healthRatio = other.health / other.maxHealth;
                
                if (distance < healRadius && healthRatio < lowestHealthRatio && healthRatio < 0.8) {
                    targetToHeal = other;
                    lowestHealthRatio = healthRatio;
                }
            }
        }
        
        if (targetToHeal) {
            this.state = 'healing';
            this.applySeek(targetToHeal.position);
            
            // Heal if close enough
            const distance = this.position.distance(targetToHeal.position);
            if (distance < 12) {
                const now = Date.now();
                if (now - this.lastHealTime > 500) { // Heal every 500ms
                    targetToHeal.health = Math.min(targetToHeal.maxHealth, targetToHeal.health + this.healingPower);
                    this.lastHealTime = now;
                }
            }
        }
    }
    
    applyWander(config) {
        this.wanderAngle += (Math.random() - 0.5) * 0.3;
        const wanderForce = new Vector2(
            Math.cos(this.wanderAngle),
            Math.sin(this.wanderAngle)
        ).multiply(config.wanderStrength * 0.1);
        
        this.acceleration.add(wanderForce);
    }
    
    avoidObstacles(obstacles) {
        for (let obstacle of obstacles) {
            const distance = this.position.distance(obstacle.position);
            if (distance < obstacle.radius + 20) {
                const avoidForce = new Vector2(
                    this.position.x - obstacle.position.x,
                    this.position.y - obstacle.position.y
                ).normalize().multiply(0.3);
                
                this.acceleration.add(avoidForce);
            }
        }
    }
    
    dropPheromone(pheromones) {
        const now = Date.now();
        if (now - this.lastPheromoneTime > 200) {
            const type = this.carryingFood ? 'food' : 'explore';
            pheromones.push(new Pheromone(
                this.position.x,
                this.position.y,
                type,
                this.carryingFood ? 0.8 : 0.3
            ));
            this.lastPheromoneTime = now;
        }
    }
    
    checkFoodCollection(foods) {
        for (let i = foods.length - 1; i >= 0; i--) {
            const food = foods[i];
            if (this.position.distance(food.position) < 8) {
                if (food.collectFood()) {
                    this.carryingFood = true;
                    console.log(`${this.colony.color} ant collected food! Carrying: ${this.carryingFood}`);
                    // Remove food if empty
                    if (food.isEmpty()) {
                        foods.splice(i, 1);
                        console.log(`Food source depleted and removed`);
                    }
                }
                break;
            }
        }
    }
    
    draw(ctx) {
        ctx.save();
        ctx.translate(this.position.x, this.position.y);
        
        // Ant body color based on type and state
        let bodyColor = this.color;
        if (this.carryingFood) {
            bodyColor = '#ffff00';
        } else if (this.type === 'warrior') {
            bodyColor = this.color === '#ff4444' ? '#cc2222' : '#2222cc';
        } else if (this.type === 'healer') {
            bodyColor = this.color === '#ff4444' ? '#ffaa44' : '#44aaff';
        }
        
        // Healing aura for healers
        if (this.type === 'healer' && this.state === 'healing') {
            ctx.strokeStyle = '#00ff00';
            ctx.lineWidth = 2;
            ctx.globalAlpha = 0.5;
            ctx.beginPath();
            ctx.arc(0, 0, 15, 0, Math.PI * 2);
            ctx.stroke();
            ctx.globalAlpha = 1;
        }
        
        // Ant body
        ctx.fillStyle = bodyColor;
        ctx.beginPath();
        ctx.arc(0, 0, this.size, 0, Math.PI * 2);
        ctx.fill();
        
        // Type indicator (small symbol)
        ctx.fillStyle = '#fff';
        ctx.font = '8px Arial';
        ctx.textAlign = 'center';
        if (this.type === 'warrior') {
            ctx.fillText('⚔', 0, 2);
        } else if (this.type === 'healer') {
            ctx.fillText('♡', 0, 2);
        }
        
        // Health bar
        if (this.health < this.maxHealth) {
            const barWidth = 12;
            const barHeight = 2;
            const healthRatio = this.health / this.maxHealth;
            
            // Background
            ctx.fillStyle = 'red';
            ctx.fillRect(-barWidth/2, -this.size - 6, barWidth, barHeight);
            
            // Health
            ctx.fillStyle = 'green';
            ctx.fillRect(-barWidth/2, -this.size - 6, barWidth * healthRatio, barHeight);
        }
        
        ctx.restore();
    }
}

class Colony {
    constructor(x, y, color, count, isPlayer = false) {
        this.nest = new Vector2(x, y);
        this.color = color;
        this.ants = [];
        this.foodStored = 50; // Starting food
        this.isPlayer = isPlayer;
        
        // Hive health system
        this.maxHealth = 500;
        this.health = this.maxHealth;
        this.isDestroyed = false;
        this.nestRadius = 15;
        this.lastDamageTime = 0;
        
        // Create initial workers
        for (let i = 0; i < Math.min(count, 20); i++) {
            this.ants.push(new Ant(
                x + (Math.random() - 0.5) * 40,
                y + (Math.random() - 0.5) * 40,
                this,
                'worker'
            ));
        }
    }
    
    takeDamage(damage, attacker) {
        if (this.isDestroyed) return false;
        
        this.health -= damage;
        this.lastDamageTime = Date.now();
        
        if (this.health <= 0) {
            this.health = 0;
            this.isDestroyed = true;
            console.log(`${this.color} hive destroyed by ${attacker.colony.color} ant!`);
            return true; // Hive destroyed
        }
        
        return false; // Hive still alive
    }
    
    // Slowly regenerate health when not under attack
    updateHiveHealth() {
        if (this.isDestroyed) return;
        
        const timeSinceLastDamage = Date.now() - this.lastDamageTime;
        const regenDelay = 5000; // 5 seconds without damage before regen starts
        
        if (timeSinceLastDamage > regenDelay && this.health < this.maxHealth) {
            this.health += 0.5; // Slow regeneration
            this.health = Math.min(this.health, this.maxHealth);
        }
    }
    
    recruitAnt(type) {
        const costs = {
            'worker': 5,
            'warrior': 15,
            'healer': 12
        };
        
        const cost = costs[type] || 5;
        if (this.foodStored >= cost) {
            this.foodStored -= cost;
            
            const newAnt = new Ant(
                this.nest.x + (Math.random() - 0.5) * 30,
                this.nest.y + (Math.random() - 0.5) * 30,
                this,
                type
            );
            this.ants.push(newAnt);
            return true;
        }
        return false;
    }
    
    getAntCounts() {
        const counts = { worker: 0, warrior: 0, healer: 0 };
        for (let ant of this.ants) {
            counts[ant.type]++;
        }
        return counts;
    }
    
    update(allAnts, foods, obstacles, pheromones, config, canvasWidth, canvasHeight) {
        // Update hive health (regeneration)
        this.updateHiveHealth();
        
        // Don't spawn new ants if hive is destroyed
        if (this.isDestroyed) return;
        
        for (let ant of this.ants) {
            if (ant.health > 0) {
                ant.update(allAnts, foods, obstacles, pheromones, config, canvasWidth, canvasHeight);
            }
        }
        
        // Remove dead ants
        this.ants = this.ants.filter(ant => ant.health > 0);
    }
    
    draw(ctx) {
        // Draw nest
        if (this.isDestroyed) {
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
        } else {
            // Draw normal hive
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
        
        // Draw ants (even if hive is destroyed, existing ants continue)
        for (let ant of this.ants) {
            ant.draw(ctx);
        }
    }
}

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
    constructor(x, y, type, strength) {
        this.position = new Vector2(x, y);
        this.type = type;
        this.strength = strength;
        this.maxLifetime = 5000; // 5 seconds
        this.lifetime = this.maxLifetime;
    }
    
    update(deltaTime) {
        this.lifetime -= deltaTime;
        this.strength = (this.lifetime / this.maxLifetime) * 0.8;
    }
    
    draw(ctx) {
        if (this.strength <= 0) return;
        
        ctx.save();
        ctx.globalAlpha = this.strength;
        ctx.fillStyle = this.type === 'food' ? '#ffaa00' : '#0088ff';
        ctx.beginPath();
        ctx.arc(this.position.x, this.position.y, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}