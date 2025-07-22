class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        
        this.colonies = [];
        this.foods = [];
        this.obstacles = [];
        this.pheromones = [];
        this.foodCollected = 0;
        
        this.config = {
            speed: 1.0,
            aggression: 0.5,
            pheromoneAttraction: 0.7,
            wanderStrength: 0.3,
            aiStrategy: 'economy',
            aiDifficulty: 2,
            aiSpeedMultiplier: 1.0
        };
        
        this.aiController = null;
        
        this.lastTime = 0;
        this.fps = 0;
        this.frameCount = 0;
        this.lastFpsTime = 0;
        this.gameEnded = false;
        
        // Store reference globally for button access
        window.gameInstance = this;
        
        this.init();
        this.setupControls();
        this.animate();
    }
    
    init() {
        // Create player colonies
        this.colonies.push(new Colony(200, 200, '#ff4444', 10, true)); // Red colony (Player)
        this.colonies.push(new Colony(this.canvas.width - 200, this.canvas.height - 200, '#4444ff', 10, false)); // Blue colony (AI)
        
        // Initialize AI controller for blue colony
        this.aiController = new AIController(this.colonies[1], this.config.aiDifficulty);
        this.aiController.setStrategy(this.config.aiStrategy);
        this.aiController.setSpeedMultiplier(this.config.aiSpeedMultiplier);
        
        // Add initial food sources
        for (let i = 0; i < 20; i++) {
            this.addRandomFood();
        }
        
        // Add some obstacles
        for (let i = 0; i < 5; i++) {
            this.obstacles.push(new Obstacle(
                Math.random() * this.canvas.width,
                Math.random() * this.canvas.height,
                20 + Math.random() * 40
            ));
        }
    }
    
    addRandomFood() {
        // Create food with random stack size between 3-8
        const stacks = 3 + Math.floor(Math.random() * 6);
        this.foods.push(new Food(
            Math.random() * this.canvas.width,
            Math.random() * this.canvas.height,
            stacks
        ));
    }
    
    addFood() {
        for (let i = 0; i < 5; i++) {
            this.addRandomFood();
        }
    }
    
    addObstacle() {
        this.obstacles.push(new Obstacle(
            Math.random() * this.canvas.width,
            Math.random() * this.canvas.height,
            20 + Math.random() * 40
        ));
    }
    
    resetSimulation() {
        this.foods = [];
        this.obstacles = [];
        this.pheromones = [];
        this.foodCollected = 0;
        this.gameEnded = false;
        
        // Hide win message
        const winMessage = document.getElementById('winMessage');
        if (winMessage) {
            winMessage.style.display = 'none';
        }
        
        this.resetColonies();
        this.init();
    }
    
    resetColonies() {
        this.colonies = [];
        this.aiController = null;
    }ulation() {
        this.foods = [];
        this.obstacles = [];
        this.pheromones = [];
        this.foodCollected = 0;
        this.resetColonies();
        this.init();
    }
    
    update(deltaTime) {
        // Get all ants for collision detection
        const allAnts = [];
        for (let colony of this.colonies) {
            allAnts.push(...colony.ants);
        }
        
        // Update AI controller
        if (this.aiController) {
            this.aiController.update(Date.now(), this.colonies[0]); // Pass player colony as enemy
        }
        
        // Update colonies
        for (let colony of this.colonies) {
            colony.update(allAnts, this.foods, this.obstacles, this.pheromones, this.config, this.canvas.width, this.canvas.height);
        }
        
        // Update pheromones
        for (let i = this.pheromones.length - 1; i >= 0; i--) {
            this.pheromones[i].update(deltaTime);
            if (this.pheromones[i].lifetime <= 0) {
                this.pheromones.splice(i, 1);
            }
        }
        
        // Randomly add food
        if (Math.random() < 0.01 && this.foods.length < 50) {
            this.addRandomFood();
        }
        
        this.updateStats();
        
        // Check win condition
        this.checkWinCondition();
    }
    
    draw() {
        this.ctx.fillStyle = '#2a2a2a';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw obstacles
        for (let obstacle of this.obstacles) {
            obstacle.draw(this.ctx);
        }
        
        // Draw pheromones
        for (let pheromone of this.pheromones) {
            pheromone.draw(this.ctx);
        }
        
        // Draw food
        for (let food of this.foods) {
            food.draw(this.ctx);
        }
        
        // Draw colonies
        for (let colony of this.colonies) {
            colony.draw(this.ctx);
        }
    }
    
    setupControls() {
        const sliders = [
            { id: 'speedSlider', prop: 'speed', display: 'speedValue' },
            { id: 'aggressionSlider', prop: 'aggression', display: 'aggressionValue' },
            { id: 'pheromoneSlider', prop: 'pheromoneAttraction', display: 'pheromoneValue' },
            { id: 'wanderSlider', prop: 'wanderStrength', display: 'wanderValue' },
            { id: 'aiSpeedSlider', prop: 'aiSpeedMultiplier', display: 'aiSpeedValue' }
        ];
        
        sliders.forEach(slider => {
            const element = document.getElementById(slider.id);
            const display = document.getElementById(slider.display);
            
            // Check if elements exist before adding event listeners
            if (element && display) {
                element.addEventListener('input', (e) => {
                    const value = parseFloat(e.target.value);
                    this.config[slider.prop] = value;
                    display.textContent = value;
                    
                    if (slider.prop === 'aiSpeedMultiplier' && this.aiController) {
                        this.aiController.setSpeedMultiplier(value);
                    }
                });
            } else {
                console.warn(`Slider element not found: ${slider.id}`);
            }
        });
        
        // AI Strategy dropdown
        const aiStrategyElement = document.getElementById('aiStrategy');
        if (aiStrategyElement) {
            aiStrategyElement.addEventListener('change', (e) => {
                this.config.aiStrategy = e.target.value;
                if (this.aiController) {
                    this.aiController.setStrategy(e.target.value);
                }
            });
        }
        
        // AI Difficulty slider
        const difficultyElement = document.getElementById('difficultySlider');
        const difficultyDisplay = document.getElementById('difficultyValue');
        if (difficultyElement && difficultyDisplay) {
            difficultyElement.addEventListener('input', (e) => {
                const difficulty = parseInt(e.target.value);
                this.config.aiDifficulty = difficulty;
                const difficultyNames = { 1: 'Easy', 2: 'Normal', 3: 'Hard' };
                difficultyDisplay.textContent = difficultyNames[difficulty];
                
                if (this.aiController) {
                    this.aiController.setDifficulty(difficulty);
                }
            });
        }
        
        // Button events
        document.getElementById('addFoodBtn').addEventListener('click', () => this.addFood());
        document.getElementById('addObstacleBtn').addEventListener('click', () => this.addObstacle());
        document.getElementById('resetBtn').addEventListener('click', () => this.resetSimulation());
        
        // Restart button for win condition
        const restartBtn = document.getElementById('restartBtn');
        if (restartBtn) {
            restartBtn.addEventListener('click', () => this.resetSimulation());
        }
        
        // Recruitment buttons for Red Colony (index 0) - Player only
        const redButtons = [
            { id: 'recruitWorkerRed', type: 'worker' },
            { id: 'recruitWarriorRed', type: 'warrior' },
            { id: 'recruitHealerRed', type: 'healer' },
            { id: 'recruitScoutRed', type: 'scout' }
        ];
        
        redButtons.forEach(button => {
            const element = document.getElementById(button.id);
            if (element) {
                element.addEventListener('click', () => this.recruitAnt(0, button.type));
            }
        });
        
        // Remove blue colony recruitment buttons since it's AI controlled
        const blueButtons = ['recruitWorkerBlue', 'recruitWarriorBlue', 'recruitHealerBlue'];
        blueButtons.forEach(buttonId => {
            const button = document.getElementById(buttonId);
            if (button) {
                button.style.display = 'none';
            }
        });
        
        // Canvas click events
        this.canvas.addEventListener('click', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            // Add food at click location with random stack size
            const stacks = 3 + Math.floor(Math.random() * 6);
            this.foods.push(new Food(x, y, stacks));
        });
    }
    
    recruitAnt(colonyIndex, type) {
        if (colonyIndex < this.colonies.length) {
            const colony = this.colonies[colonyIndex];
            const success = colony.recruitAnt(type);
            
            if (success) {
                this.updateRecruitmentUI();
                console.log(`${colony.color} colony recruited a ${type}!`);
            } else {
                console.log(`Not enough food to recruit ${type}!`);
            }
        }
    }
    
    updateRecruitmentUI() {
        // Update food display for both colonies
        if (this.colonies.length >= 2) {
            document.getElementById('redColonyFood').textContent = this.colonies[0].foodStored;
            document.getElementById('blueColonyFood').textContent = this.colonies[1].foodStored;
            
            // Update button states based on available food
            this.updateRecruitmentButtons();
        }
    }
    
    updateRecruitmentButtons() {
        const costs = { worker: 5, warrior: 15, healer: 12, scout: 8 };
        
        if (this.colonies.length >= 1) {
            // Red colony buttons
            const redFood = this.colonies[0].foodStored;
            
            const redButtonIds = ['recruitWorkerRed', 'recruitWarriorRed', 'recruitHealerRed', 'recruitScoutRed'];
            const unitTypes = ['worker', 'warrior', 'healer', 'scout'];
            
            redButtonIds.forEach((buttonId, index) => {
                const button = document.getElementById(buttonId);
                if (button) {
                    const unitType = unitTypes[index];
                    button.disabled = redFood < costs[unitType];
                }
            });
        }
        
        // Blue colony buttons (AI controlled - should be hidden)
        const blueButtons = ['recruitWorkerBlue', 'recruitWarriorBlue', 'recruitHealerBlue', 'recruitScoutBlue'];
        blueButtons.forEach(buttonId => {
            const button = document.getElementById(buttonId);
            if (button) {
                button.disabled = true; // AI controlled
            }
        });
    }
    
    resetColonies() {
        this.colonies = [];
        this.colonies.push(new Colony(200, 200, '#ff4444', 10, true));
        this.colonies.push(new Colony(this.canvas.width - 200, this.canvas.height - 200, '#4444ff', 10, true));
    }
    
    updateStats() {
        if (this.colonies.length >= 2) {
            // Update main colony status display
            const redColony = this.colonies[0];
            const blueColony = this.colonies[1];
            
            // Update health displays
            const redHealthElement = document.getElementById('redHealth');
            const blueHealthElement = document.getElementById('blueHealth');
            if (redHealthElement) redHealthElement.textContent = `${Math.round(redColony.health)}/${redColony.maxHealth}`;
            if (blueHealthElement) blueHealthElement.textContent = `${Math.round(blueColony.health)}/${blueColony.maxHealth}`;
            
            // Update food counts
            const redFoodElement = document.getElementById('redFood');
            const blueFoodElement = document.getElementById('blueFood');
            if (redFoodElement) redFoodElement.textContent = redColony.foodStored;
            if (blueFoodElement) blueFoodElement.textContent = blueColony.foodStored;
            
            // Update unit counts
            const redUnitsElement = document.getElementById('redUnits');
            const blueUnitsElement = document.getElementById('blueUnits');
            if (redUnitsElement) redUnitsElement.textContent = redColony.ants.length;
            if (blueUnitsElement) blueUnitsElement.textContent = blueColony.ants.length;
            
            // Update unit breakdowns
            const redCounts = redColony.getAntCounts();
            const blueCounts = blueColony.getAntCounts();
            
            // Red colony breakdown
            const redWorkersElement = document.getElementById('redWorkers');
            const redWarriorsElement = document.getElementById('redWarriors');
            const redHealersElement = document.getElementById('redHealers');
            const redScoutsElement = document.getElementById('redScouts');
            
            if (redWorkersElement) redWorkersElement.textContent = redCounts.worker;
            if (redWarriorsElement) redWarriorsElement.textContent = redCounts.warrior;
            if (redHealersElement) redHealersElement.textContent = redCounts.healer;
            if (redScoutsElement) redScoutsElement.textContent = redCounts.scout || 0;
            
            // Blue colony breakdown
            const blueWorkersElement = document.getElementById('blueWorkers');
            const blueWarriorsElement = document.getElementById('blueWarriors');
            const blueHealersElement = document.getElementById('blueHealers');
            const blueScoutsElement = document.getElementById('blueScouts');
            
            if (blueWorkersElement) blueWorkersElement.textContent = blueCounts.worker;
            if (blueWarriorsElement) blueWarriorsElement.textContent = blueCounts.warrior;
            if (blueHealersElement) blueHealersElement.textContent = blueCounts.healer;
            if (blueScoutsElement) blueScoutsElement.textContent = blueCounts.scout || 0;
            
            // Update AI status display
            if (this.aiController) {
                const aiStatus = this.aiController.getStatus();
                const currentStrategyElement = document.getElementById('currentStrategy');
                const nextActionElement = document.getElementById('nextAction');
                
                if (currentStrategyElement) currentStrategyElement.textContent = aiStatus.strategy;
                if (nextActionElement) nextActionElement.textContent = aiStatus.nextAction;
            }
        }
        
        const foodCountElement = document.getElementById('foodCount');
        if (foodCountElement) foodCountElement.textContent = this.foods.length;
        
        // Update recruitment UI
        this.updateRecruitmentUI();
    }
    
    checkWinCondition() {
        if (this.gameEnded) return;
        
        const redColony = this.colonies[0];
        const blueColony = this.colonies[1];
        
        if (redColony.isDestroyed) {
            this.endGame('AI Wins!', 'The blue colony has destroyed your hive!', '#4444ff');
        } else if (blueColony.isDestroyed) {
            this.endGame('Victory!', 'You have destroyed the enemy hive!', '#ff4444');
        }
    }
    
    endGame(title, message, color) {
        this.gameEnded = true;
        
        const winMessage = document.getElementById('winMessage');
        const winText = document.getElementById('winText');
        
        winText.textContent = title;
        winText.style.color = color;
        winMessage.style.display = 'block';
        
        console.log(`Game Over: ${title} - ${message}`);
        
        // Stop AI actions
        if (this.aiController) {
            this.aiController.nextAction = 'Game Over';
        }
    }
    
    animate(currentTime = 0) {
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        
        // Calculate FPS
        this.frameCount++;
        if (currentTime - this.lastFpsTime >= 1000) {
            this.fps = Math.round(this.frameCount * 1000 / (currentTime - this.lastFpsTime));
            document.getElementById('fps').textContent = this.fps;
            this.frameCount = 0;
            this.lastFpsTime = currentTime;
        }
        
        this.update(deltaTime);
        this.draw();
        
        requestAnimationFrame((time) => this.animate(time));
    }
}