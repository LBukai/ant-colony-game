class BaseAnt {
    constructor(x, y, colony, type = 'worker') {
        this.position = new Vector2(x, y);
        this.velocity = new Vector2();
        this.acceleration = new Vector2();
        this.colony = colony;
        this.type = type;
        
        // Base stats - will be overridden by subclasses
        this.maxSpeed = 2;
        this.maxForce = 0.1;
        this.size = 3;
        this.maxHealth = 100;
        this.health = 100;
        this.attack = 5;
        this.energy = 100;
        
        // Behavioral traits
        this.canCollectFood = true;
        this.healingPower = 0;
        this.carryingFood = false;
        
        // AI state
        this.wanderAngle = Math.random() * Math.PI * 2;
        this.state = 'exploring'; // exploring, returning, fighting, healing
        this.target = null;
        
        // Visual
        this.color = colony.color;
        
        // Timing
        this.lastPheromoneTime = 0;
        this.lastHealTime = 0;
        this.lastEnemySeen = 0;
    }
    
    update(ants, foods, obstacles, pheromones, config, canvasWidth, canvasHeight) {
        this.acceleration.x = 0;
        this.acceleration.y = 0;
        
        // Apply type-specific behaviors
        this.applyTypeBehavior(ants, foods, pheromones, config);
        
        // Apply universal behaviors
        this.applySeparation(ants, config);
        this.applyAggression(ants, config);
        this.applyWander(config);
        this.avoidObstacles(obstacles);
        
        // Update physics
        this.updatePhysics(config, canvasWidth, canvasHeight);
        
        // Drop pheromones
        this.dropPheromone(pheromones);
        
        // Check for food collection (if applicable)
        if (!this.carryingFood && this.canCollectFood) {
            this.checkFoodCollection(foods);
        }
        
        // Check food delivery
        this.checkFoodDelivery();
    }
    
    // To be overridden by subclasses
    applyTypeBehavior(ants, foods, pheromones, config) {
        // Default behavior - override in subclasses
        if (this.carryingFood) {
            this.state = 'returning';
            this.applySeek(this.colony.nest);
        } else {
            this.state = 'exploring';
            this.applyForaging(foods, pheromones, config);
        }
    }
    
    updatePhysics(config, canvasWidth, canvasHeight) {
        this.velocity.add(this.acceleration);
        this.velocity.x = Math.max(-this.maxSpeed * config.speed, Math.min(this.maxSpeed * config.speed, this.velocity.x));
        this.velocity.y = Math.max(-this.maxSpeed * config.speed, Math.min(this.maxSpeed * config.speed, this.velocity.y));
        
        this.position.add(this.velocity);
        
        // Wrap around screen edges
        if (this.position.x < 0) this.position.x = canvasWidth;
        if (this.position.x > canvasWidth) this.position.x = 0;
        if (this.position.y < 0) this.position.y = canvasHeight;
        if (this.position.y > canvasHeight) this.position.y = 0;
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
        let foodForce = new Vector2();
        let enemyForce = new Vector2();
        let foodCount = 0;
        let enemyCount = 0;
        
        for (let pheromone of pheromones) {
            const distance = this.position.distance(pheromone.position);
            if (distance < senseRadius) {
                const force = new Vector2(
                    pheromone.position.x - this.position.x,
                    pheromone.position.y - this.position.y
                ).normalize().multiply(pheromone.strength);
                
                if (pheromone.type === 'food') {
                    foodForce.add(force.clone().multiply(config.pheromoneAttraction));
                    foodCount++;
                } else if (pheromone.type === 'enemy' && pheromone.colony !== this.colony) {
                    enemyForce.add(force.clone().multiply(config.aggression));
                    enemyCount++;
                }
            }
        }
        
        // Combine forces based on ant type preferences
        let finalForce = new Vector2();
        
        if (foodCount > 0) {
            foodForce.multiply(1 / foodCount);
            finalForce.add(foodForce.clone().multiply(this.getFoodAttraction(config)));
        }
        
        if (enemyCount > 0) {
            enemyForce.multiply(1 / enemyCount);
            finalForce.add(enemyForce.clone().multiply(this.getEnemyAttraction(config)));
        }
        
        this.acceleration.add(finalForce);
    }
    
    // Override in subclasses for different preferences
    getFoodAttraction(config) {
        return 1.0; // Base attraction to food
    }
    
    getEnemyAttraction(config) {
        return config.aggression * 0.5; // Base attraction to enemies
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
                    // Mark enemy sighting for pheromone trail
                    this.lastEnemySeen = Date.now();
                    
                    // Attack enemy ant
                    const attackForce = new Vector2(
                        other.position.x - this.position.x,
                        other.position.y - this.position.y
                    ).normalize().multiply(config.aggression * this.getAggressionMultiplier());
                    
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
                    ).normalize().multiply(config.aggression * this.getAggressionMultiplier() * 0.3);
                    
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
    
    // Override in subclasses for different aggression levels
    getAggressionMultiplier() {
        return 1.0;
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
            let type = 'explore';
            let strength = 0.3;
            
            if (this.carryingFood) {
                type = 'food';
                strength = 0.8;
            } else if (now - this.lastEnemySeen < 300) { // Enemy seen within last 3 seconds
                type = 'enemy';
                strength = 0.6;
            }
            
            pheromones.push(new Pheromone(
                this.position.x,
                this.position.y,
                type,
                strength,
                this.colony
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
                    console.log(`${this.colony.color} ${this.type} collected food! Carrying: ${this.carryingFood}`);
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
    
    checkFoodDelivery() {
        if (this.carryingFood) {
            const distanceToNest = this.position.distance(this.colony.nest);
            if (distanceToNest < 25) {
                this.carryingFood = false;
                this.colony.foodStored++;
                console.log(`${this.colony.color} ${this.type} delivered food! Total: ${this.colony.foodStored}`);
            }
        }
    }
    
    draw(ctx) {
        ctx.save();
        ctx.translate(this.position.x, this.position.y);
        
        // Ant body color based on type and state
        let bodyColor = this.getBodyColor();
        
        // Special effects for different states
        this.drawSpecialEffects(ctx);
        
        // Ant body
        ctx.fillStyle = bodyColor;
        ctx.beginPath();
        ctx.arc(0, 0, this.size, 0, Math.PI * 2);
        ctx.fill();
        
        // Type indicator
        this.drawTypeIndicator(ctx);
        
        // Health bar
        this.drawHealthBar(ctx);
        
        ctx.restore();
    }
    
    getBodyColor() {
        if (this.carryingFood) {
            return '#ffff00';
        }
        return this.color;
    }
    
    drawSpecialEffects(ctx) {
        // Override in subclasses for special visual effects
    }
    
    drawTypeIndicator(ctx) {
        // Override in subclasses for type-specific indicators
    }
    
    drawHealthBar(ctx) {
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
    }
}