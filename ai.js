// Strategy weights for different unit types
        this.strategyWeights = {
            economy: { worker: 0.6, warrior: 0.2, healer: 0.1, scout: 0.1 },
            balanced: { worker: 0.3, warrior: 0.3, healer: 0.2, scout: 0.2 },
            aggressive: { worker: 0.2, warrior: 0.6, healer: 0.1, scout: 0.1 },
            defensive: { worker: 0.3, warrior: 0.3, healer: 0.3, scout: 0.1 }
        };class AIController {
    constructor(colony, difficulty = 2) {
        this.colony = colony;
        this.strategy = 'economy'; // economy, balanced, aggressive, defensive
        this.difficulty = difficulty; // 1 = Easy, 2 = Normal, 3 = Hard
        this.speedMultiplier = 1.0;
        
        // Define difficulty modifiers first
        this.difficultyModifiers = {
            1: { foodEfficiency: 0.8, actionSpeed: 1.5, resourceBonus: 0 },    // Easy
            2: { foodEfficiency: 1.0, actionSpeed: 1.0, resourceBonus: 0 },    // Normal  
            3: { foodEfficiency: 1.2, actionSpeed: 0.7, resourceBonus: 10 }    // Hard
        };
        
        // Strategy weights for different unit types
        this.strategyWeights = {
            economy: { worker: 0.7, warrior: 0.2, healer: 0.1 },
            balanced: { worker: 0.4, warrior: 0.4, healer: 0.2 },
            aggressive: { worker: 0.2, warrior: 0.7, healer: 0.1 },
            defensive: { worker: 0.3, warrior: 0.4, healer: 0.3 }
        };
        
        // Now initialize timing variables
        this.lastActionTime = 0;
        this.actionInterval = this.getActionInterval();
        this.nextAction = 'analyzing...';
        
        // Apply difficulty bonus
        const modifier = this.difficultyModifiers[this.difficulty];
        this.colony.foodStored += modifier.resourceBonus;
    }
    
    getActionInterval() {
        const baseInterval = 3000; // 3 seconds
        const modifier = this.difficultyModifiers[this.difficulty];
        return (baseInterval * modifier.actionSpeed) / this.speedMultiplier;
    }
    
    setStrategy(strategy) {
        this.strategy = strategy;
        this.nextAction = `Switched to ${strategy} strategy`;
        console.log(`AI switched to ${strategy} strategy`);
    }
    
    setDifficulty(difficulty) {
        this.difficulty = difficulty;
        this.actionInterval = this.getActionInterval();
        console.log(`AI difficulty set to ${this.getDifficultyName()}`);
    }
    
    setSpeedMultiplier(multiplier) {
        this.speedMultiplier = multiplier;
        this.actionInterval = this.getActionInterval();
    }
    
    getDifficultyName() {
        const names = { 1: 'Easy', 2: 'Normal', 3: 'Hard' };
        return names[this.difficulty] || 'Normal';
    }
    
    update(currentTime, enemyColony = null) {
        if (currentTime - this.lastActionTime > this.actionInterval) {
            this.makeDecision(enemyColony);
            this.lastActionTime = currentTime;
        }
    }
    
    makeDecision(enemyColony = null) {
        const analysis = this.analyzeGameState(enemyColony);
        const action = this.chooseAction(analysis);
        this.executeAction(action);
    }
    
    analyzeGameState(enemyColony) {
        const myAnts = this.colony.getAntCounts();
        const totalAnts = this.colony.ants.length;
        const foodStored = this.colony.foodStored;
        
        let enemyThreat = 0;
        let enemyAnts = { worker: 0, warrior: 0, healer: 0 };
        
        if (enemyColony) {
            enemyAnts = enemyColony.getAntCounts();
            enemyThreat = enemyAnts.warrior * 2 + enemyAnts.worker * 0.5;
        }
        
        return {
            myAnts,
            totalAnts,
            foodStored,
            enemyAnts,
            enemyThreat,
            economyRatio: myAnts.worker / Math.max(totalAnts, 1),
            militaryRatio: myAnts.warrior / Math.max(totalAnts, 1),
            supportRatio: myAnts.healer / Math.max(totalAnts, 1),
            hiveHealth: this.colony.health / this.colony.maxHealth
        };
    }
    
    chooseAction(analysis) {
        const weights = this.strategyWeights[this.strategy];
        const { myAnts, totalAnts, foodStored, enemyThreat, hiveHealth } = analysis;
        
        // Don't recruit if we have no food
        if (foodStored < 5) {
            this.nextAction = 'Waiting for food...';
            return null;
        }
        
        // Emergency responses
        if (hiveHealth < 0.3) {
            // Hive under serious attack - prioritize warriors
            if (foodStored >= 15) {
                this.nextAction = 'Emergency defense!';
                return 'warrior';
            }
        }
        
        // Strategy-specific decision making
        let preferredUnit = null;
        let reason = '';
        
        switch (this.strategy) {
            case 'economy':
                if (myAnts.worker < 8 || analysis.economyRatio < 0.6) {
                    preferredUnit = 'worker';
                    reason = 'Building economy';
                } else if (myAnts.warrior < 2) {
                    preferredUnit = 'warrior';
                    reason = 'Basic defense';
                }
                break;
                
            case 'aggressive':
                if (myAnts.worker < 3) {
                    preferredUnit = 'worker';
                    reason = 'Minimum economy';
                } else if (analysis.militaryRatio < 0.7) {
                    preferredUnit = 'warrior';
                    reason = 'Building army';
                } else if (myAnts.healer === 0 && myAnts.warrior > 5) {
                    preferredUnit = 'healer';
                    reason = 'Army support';
                }
                break;
                
            case 'defensive':
                if (enemyThreat > myAnts.warrior * 1.5) {
                    preferredUnit = 'warrior';
                    reason = 'Counter threat';
                } else if (myAnts.healer < Math.floor(totalAnts * 0.25)) {
                    preferredUnit = 'healer';
                    reason = 'Defensive support';
                } else if (myAnts.worker < 5) {
                    preferredUnit = 'worker';
                    reason = 'Economic stability';
                }
                break;
                
            case 'balanced':
            default:
                // Use weights to determine what we need most
                const currentRatios = {
                    worker: analysis.economyRatio,
                    warrior: analysis.militaryRatio,
                    healer: analysis.supportRatio,
                    scout: myAnts.scout / Math.max(totalAnts, 1)
                };
                
                let biggestGap = 0;
                for (let unitType in weights) {
                    const gap = weights[unitType] - currentRatios[unitType];
                    if (gap > biggestGap) {
                        biggestGap = gap;
                        preferredUnit = unitType;
                        reason = 'Balancing composition';
                    }
                }
                break;
        }
        
        // Check if we can afford the preferred unit
        const costs = { worker: 5, warrior: 15, healer: 12, scout: 8 };
        if (preferredUnit && foodStored >= costs[preferredUnit]) {
            this.nextAction = `${reason}: ${preferredUnit}`;
            return preferredUnit;
        }
        
        // Fallback: recruit cheapest affordable unit
        if (foodStored >= 5) {
            this.nextAction = 'Recruiting worker (fallback)';
            return 'worker';
        }
        
        this.nextAction = 'Insufficient resources';
        return null;
    }
    
    executeAction(action) {
        if (!action) return;
        
        const success = this.colony.recruitAnt(action);
        if (success) {
            console.log(`AI recruited ${action}. Food remaining: ${this.colony.foodStored}`);
            
            // Apply difficulty food efficiency bonus
            const modifier = this.difficultyModifiers[this.difficulty];
            if (modifier.foodEfficiency > 1.0 && Math.random() < 0.3) {
                this.colony.foodStored += Math.floor(Math.random() * 3); // Bonus food
            }
        } else {
            console.log(`AI failed to recruit ${action}`);
            this.nextAction = 'Recruitment failed';
        }
    }
    
    // Get current status for UI display
    getStatus() {
        return {
            strategy: this.strategy,
            difficulty: this.getDifficultyName(),
            nextAction: this.nextAction,
            speedMultiplier: this.speedMultiplier
        };
    }
}