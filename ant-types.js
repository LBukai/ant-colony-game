class WorkerAnt extends BaseAnt {
    constructor(x, y, colony) {
        super(x, y, colony, 'worker');
        
        // Worker-specific stats
        this.maxSpeed = 2;
        this.maxForce = 0.1;
        this.size = 3;
        this.maxHealth = 80;
        this.health = 80;
        this.attack = 5;
        this.canCollectFood = true;
        this.healingPower = 0;
    }
    
    applyTypeBehavior(ants, foods, pheromones, config) {
        if (this.carryingFood) {
            this.state = 'returning';
            this.applySeek(this.colony.nest);
        } else {
            this.state = 'exploring';
            this.applyForaging(foods, pheromones, config);
        }
    }
    
    getFoodAttraction(config) {
        return 1.5; // Workers strongly prefer food
    }
    
    getEnemyAttraction(config) {
        return config.aggression * 0.3; // Less interested in combat
    }
    
    getAggressionMultiplier() {
        return 0.7; // Less aggressive than warriors
    }
    
    getBodyColor() {
        if (this.carryingFood) {
            return '#ffff00';
        }
        return this.color;
    }
    
    drawTypeIndicator(ctx) {
        // No special indicator for workers (basic unit)
    }
}

class WarriorAnt extends BaseAnt {
    constructor(x, y, colony) {
        super(x, y, colony, 'warrior');
        
        // Warrior-specific stats
        this.maxSpeed = 2;
        this.maxForce = 0.12;
        this.size = 4;
        this.maxHealth = 150;
        this.health = 150;
        this.attack = 20;
        this.canCollectFood = true;
        this.healingPower = 0;
        
        // Warrior-specific behavior
        this.combatRadius = 35; // Larger detection radius
        this.patrolRadius = 80; // How far from nest they patrol
    }
    
    applyTypeBehavior(ants, foods, pheromones, config) {
        // Warriors prioritize combat and enemy seeking
        const enemy = this.findNearestEnemy(ants);
        
        if (enemy && this.position.distance(enemy.position) < this.combatRadius) {
            // Engage in combat
            this.state = 'fighting';
            this.applySeek(enemy.position);
        } else if (this.carryingFood) {
            // Return food if carrying
            this.state = 'returning';
            this.applySeek(this.colony.nest);
        } else {
            // Patrol for enemies or seek enemy pheromones
            this.state = 'patrolling';
            
            if (!this.seekEnemyPheromones(pheromones, config)) {
                // No enemies detected, help with food if nearby
                this.applyForaging(foods, pheromones, config);
            }
        }
    }
    
    findNearestEnemy(ants) {
        let closestEnemy = null;
        let closestDistance = Infinity;
        
        for (let ant of ants) {
            if (ant.colony !== this.colony) {
                const distance = this.position.distance(ant.position);
                if (distance < closestDistance) {
                    closestEnemy = ant;
                    closestDistance = distance;
                }
            }
        }
        
        return closestEnemy;
    }
    
    seekEnemyPheromones(pheromones, config) {
        const senseRadius = 40; // Warriors have better enemy detection
        let enemyForce = new Vector2();
        let count = 0;
        
        for (let pheromone of pheromones) {
            if (pheromone.type === 'enemy' && pheromone.colony !== this.colony) {
                const distance = this.position.distance(pheromone.position);
                if (distance < senseRadius) {
                    const force = new Vector2(
                        pheromone.position.x - this.position.x,
                        pheromone.position.y - this.position.y
                    ).normalize().multiply(pheromone.strength * 1.5); // Strong attraction to enemy trails
                    
                    enemyForce.add(force);
                    count++;
                }
            }
        }
        
        if (count > 0) {
            enemyForce.multiply(1 / count);
            this.acceleration.add(enemyForce);
            return true;
        }
        
        return false;
    }
    
    getFoodAttraction(config) {
        return 0.8; // Warriors less interested in food
    }
    
    getEnemyAttraction(config) {
        return config.aggression * 1.5; // Very attracted to enemies
    }
    
    getAggressionMultiplier() {
        return 1.5; // More aggressive than other types
    }
    
    getBodyColor() {
        if (this.carryingFood) {
            return '#ffff00';
        }
        // Darker color for warriors
        return this.color === '#ff4444' ? '#cc2222' : '#2222cc';
    }
    
    drawTypeIndicator(ctx) {
        ctx.fillStyle = '#fff';
        ctx.font = '8px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('⚔', 0, 2);
    }
    
    drawSpecialEffects(ctx) {
        // Draw combat aura when fighting
        if (this.state === 'fighting') {
            ctx.strokeStyle = '#ff0000';
            ctx.lineWidth = 1;
            ctx.globalAlpha = 0.3;
            ctx.beginPath();
            ctx.arc(0, 0, 12, 0, Math.PI * 2);
            ctx.stroke();
            ctx.globalAlpha = 1;
        }
    }
}

class HealerAnt extends BaseAnt {
    constructor(x, y, colony) {
        super(x, y, colony, 'healer');
        
        // Healer-specific stats
        this.maxSpeed = 2.5;
        this.maxForce = 0.15;
        this.size = 3;
        this.maxHealth = 100;
        this.health = 100;
        this.attack = 3;
        this.canCollectFood = false;
        this.healingPower = 15;
        
        // Healer-specific behavior
        this.healRadius = 40;
        this.supportRadius = 60;
    }
    
    applyTypeBehavior(ants, foods, pheromones, config) {
        // Healers focus on supporting allies
        const injuredAlly = this.findMostInjuredAlly(ants);
        
        if (injuredAlly) {
            this.state = 'healing';
            this.applySeek(injuredAlly.position);
            this.performHealing(injuredAlly);
        } else {
            // No injured allies, follow warrior groups for support
            this.state = 'supporting';
            
            if (!this.followWarriorGroup(ants)) {
                // No warriors to support, just wander
                this.applyWander(config);
            }
        }
    }
    
    findMostInjuredAlly(ants) {
        let mostInjured = null;
        let lowestHealthRatio = 0.8; // Only heal if below 80% health
        
        for (let ant of ants) {
            if (ant.colony === this.colony && ant !== this) {
                const distance = this.position.distance(ant.position);
                const healthRatio = ant.health / ant.maxHealth;
                
                if (distance < this.healRadius && healthRatio < lowestHealthRatio) {
                    mostInjured = ant;
                    lowestHealthRatio = healthRatio;
                }
            }
        }
        
        return mostInjured;
    }
    
    followWarriorGroup(ants) {
        let warriorCenter = new Vector2(0, 0);
        let warriorCount = 0;
        
        for (let ant of ants) {
            if (ant.colony === this.colony && ant.type === 'warrior') {
                const distance = this.position.distance(ant.position);
                if (distance < this.supportRadius) {
                    warriorCenter.add(ant.position);
                    warriorCount++;
                }
            }
        }
        
        if (warriorCount > 0) {
            warriorCenter.multiply(1 / warriorCount);
            
            // Stay slightly behind the warrior group
            const offset = new Vector2(
                this.colony.nest.x - warriorCenter.x,
                this.colony.nest.y - warriorCenter.y
            ).normalize().multiply(15);
            
            warriorCenter.add(offset);
            this.applySeek(warriorCenter);
            return true;
        }
        
        return false;
    }
    
    performHealing(target) {
        const distance = this.position.distance(target.position);
        if (distance < 12) {
            const now = Date.now();
            if (now - this.lastHealTime > 500) { // Heal every 500ms
                target.health = Math.min(target.maxHealth, target.health + this.healingPower);
                this.lastHealTime = now;
            }
        }
    }
    
    getFoodAttraction(config) {
        return 0; // Healers don't collect food
    }
    
    getEnemyAttraction(config) {
        return config.aggression * 0.2; // Avoid combat
    }
    
    getAggressionMultiplier() {
        return 0.3; // Very low aggression
    }
    
    getBodyColor() {
        // Lighter color for healers
        return this.color === '#ff4444' ? '#ffaa44' : '#44aaff';
    }
    
    drawTypeIndicator(ctx) {
        ctx.fillStyle = '#fff';
        ctx.font = '8px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('♡', 0, 2);
    }
    
    drawSpecialEffects(ctx) {
        // Draw healing aura when actively healing
        if (this.state === 'healing') {
            ctx.strokeStyle = '#00ff00';
            ctx.lineWidth = 2;
            ctx.globalAlpha = 0.5;
            ctx.beginPath();
            ctx.arc(0, 0, 15, 0, Math.PI * 2);
            ctx.stroke();
            ctx.globalAlpha = 1;
        }
    }
}

class ScoutAnt extends BaseAnt {
    constructor(x, y, colony) {
        super(x, y, colony, 'scout');
        
        // Scout-specific stats - fast and light
        this.maxSpeed = 3; // Fastest unit
        this.maxForce = 0.2; // High maneuverability
        this.size = 2.5; // Smaller than other units
        this.maxHealth = 60; // Fragile
        this.health = 60;
        this.attack = 3; // Weak attack
        this.canCollectFood = false; // Doesn't collect food
        this.healingPower = 0;
        
        // Scout-specific behavior
        this.scoutRadius = 80; // Large detection radius
        this.explorationRadius = 150; // How far they explore from nest
        this.returnDistance = 50; // When to return to hive with intel
        
        // Scouting state
        this.discovered = null; // What they've found
        this.discoveryType = null; // 'food', 'enemy', 'hive'
        this.discoveryTime = 0;
        this.isReturningWithIntel = false;
        this.lastReportTime = 0;
        
        // Enhanced wandering
        this.wanderStrength = 0.8; // Much higher than other units
        this.curiosity = 1.0; // Attraction to unexplored areas
    }
    
    applyTypeBehavior(ants, foods, pheromones, config) {
        if (this.isReturningWithIntel) {
            // Return to hive with discovered information
            this.state = 'reporting';
            this.applySeek(this.colony.nest);
            this.checkIntelDelivery();
        } else {
            // Scout for targets
            this.state = 'scouting';
            
            const discovery = this.scanForTargets(ants, foods);
            if (discovery) {
                this.makeDiscovery(discovery.target, discovery.type);
            } else {
                // No targets found, continue exploring
                this.exploreArea(config);
            }
        }
    }
    
    scanForTargets(ants, foods) {
        // Look for food sources
        for (let food of foods) {
            const distance = this.position.distance(food.position);
            if (distance < this.scoutRadius) {
                return { target: food, type: 'food' };
            }
        }
        
        // Look for enemy ants
        for (let ant of ants) {
            if (ant.colony !== this.colony) {
                const distance = this.position.distance(ant.position);
                if (distance < this.scoutRadius) {
                    return { target: ant, type: 'enemy' };
                }
            }
        }
        
        // Look for enemy hives
        if (window.gameInstance && window.gameInstance.colonies) {
            for (let colony of window.gameInstance.colonies) {
                if (colony !== this.colony && !colony.isDestroyed) {
                    const distance = this.position.distance(colony.nest);
                    if (distance < this.scoutRadius) {
                        return { target: colony, type: 'hive' };
                    }
                }
            }
        }
        
        return null;
    }
    
    makeDiscovery(target, type) {
        this.discovered = target.position ? target.position.clone() : target.nest.clone();
        this.discoveryType = type;
        this.discoveryTime = Date.now();
        this.isReturningWithIntel = true;
        
        console.log(`${this.colony.color} scout discovered ${type}!`);
    }
    
    checkIntelDelivery() {
        const distanceToNest = this.position.distance(this.colony.nest);
        if (distanceToNest < 25) {
            // Delivered intel successfully
            this.deliverIntel();
            this.isReturningWithIntel = false;
            this.discovered = null;
            this.discoveryType = null;
        }
    }
    
    deliverIntel() {
        if (!this.discovered || !this.discoveryType) return;
        
        const now = Date.now();
        if (now - this.lastReportTime < 1000) return; // Prevent spam
        
        console.log(`${this.colony.color} scout reported ${this.discoveryType} at (${Math.round(this.discovered.x)}, ${Math.round(this.discovered.y)})`);
        
        // Create strong pheromone trail pointing to discovery
        if (window.gameInstance && window.gameInstance.pheromones) {
            const strength = 1.0; // Maximum strength
            const pheromoneType = this.discoveryType === 'food' ? 'food' : 'enemy';
            
            // Create multiple pheromones creating a trail from nest to discovery
            const steps = 8;
            for (let i = 0; i <= steps; i++) {
                const t = i / steps;
                const trailPos = new Vector2(
                    this.colony.nest.x + (this.discovered.x - this.colony.nest.x) * t,
                    this.colony.nest.y + (this.discovered.y - this.colony.nest.y) * t
                );
                
                window.gameInstance.pheromones.push(new Pheromone(
                    trailPos.x,
                    trailPos.y,
                    pheromoneType,
                    strength * (0.8 + 0.2 * t), // Stronger near target
                    this.colony
                ));
            }
        }
        
        this.lastReportTime = now;
    }
    
    exploreArea(config) {
        // Enhanced exploration behavior
        const nestDistance = this.position.distance(this.colony.nest);
        
        if (nestDistance > this.explorationRadius) {
            // Too far from nest, return towards home
            const homeForce = new Vector2(
                this.colony.nest.x - this.position.x,
                this.colony.nest.y - this.position.y
            ).normalize().multiply(0.3);
            
            this.acceleration.add(homeForce);
        } else {
            // Explore freely with enhanced wandering
            this.applyEnhancedWander(config);
        }
    }
    
    applyEnhancedWander(config) {
        // Stronger, more erratic wandering than other units
        this.wanderAngle += (Math.random() - 0.5) * 0.6; // More random
        const wanderForce = new Vector2(
            Math.cos(this.wanderAngle),
            Math.sin(this.wanderAngle)
        ).multiply(this.wanderStrength * config.wanderStrength);
        
        this.acceleration.add(wanderForce);
    }
    
    getFoodAttraction(config) {
        return 0; // Scouts don't collect food
    }
    
    getEnemyAttraction(config) {
        return 0; // Scouts observe but don't engage
    }
    
    getAggressionMultiplier() {
        return 0.2; // Very low aggression - avoid combat
    }
    
    // Override pheromone dropping to leave exploration trails
    dropPheromone(pheromones) {
        const now = Date.now();
        if (now - this.lastPheromoneTime > 300) { // Drop pheromones more frequently
            let type = 'explore';
            let strength = 0.4;
            
            if (this.isReturningWithIntel && this.discoveryType) {
                // Leave strong trail when returning with intel
                type = this.discoveryType === 'food' ? 'food' : 'enemy';
                strength = 0.9;
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
    
    getBodyColor() {
        if (this.isReturningWithIntel) {
            // Flash between normal color and bright when carrying intel
            const flash = Math.sin(Date.now() * 0.01) > 0;
            return flash ? '#ffffff' : this.color;
        }
        
        // Slightly different color for scouts
        return this.color === '#ff4444' ? '#ff6666' : '#6666ff';
    }
    
    drawTypeIndicator(ctx) {
        ctx.fillStyle = '#fff';
        ctx.font = '8px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('👁', 0, 2);
    }
    
    drawSpecialEffects(ctx) {
        // Draw scouting radius when exploring
        if (this.state === 'scouting') {
            ctx.strokeStyle = this.color;
            ctx.lineWidth = 1;
            ctx.globalAlpha = 0.1;
            ctx.beginPath();
            ctx.arc(0, 0, this.scoutRadius * 0.3, 0, Math.PI * 2);
            ctx.stroke();
            ctx.globalAlpha = 1;
        }
        
        // Draw intel trail effect when returning
        if (this.isReturningWithIntel) {
            ctx.strokeStyle = '#ffff00';
            ctx.lineWidth = 2;
            ctx.globalAlpha = 0.6;
            ctx.beginPath();
            ctx.arc(0, 0, 8, 0, Math.PI * 2);
            ctx.stroke();
            ctx.globalAlpha = 1;
        }
    }
}