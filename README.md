# 🐜 Ant Colony Strategy Game

A real-time strategy game where you command ant colonies in tactical warfare. Build your army, gather resources, and destroy the enemy hive to achieve victory!

## 🎮 Game Overview

Command the **Red Colony** (player) against the **Blue Colony** (AI) in intense strategic battles. Use different ant types, manage resources, and employ tactical thinking to outmaneuver your opponent and destroy their hive.

### 🎯 **Victory Condition**
Destroy the enemy hive (500 HP) to win the game!

## 🐜 Unit Types

### **Worker Ant** 💼
- **Cost:** 5 food
- **HP:** 80 | **Attack:** 5 | **Speed:** Normal
- **Role:** Economic backbone - collects food and builds your economy
- **Behavior:** Prioritizes food collection, avoids combat

### **Warrior Ant** ⚔️
- **Cost:** 15 food
- **HP:** 150 | **Attack:** 20 | **Speed:** Normal
- **Role:** Main combat unit - fights enemies and attacks hives
- **Behavior:** Seeks out enemies, follows enemy pheromone trails, can collect food

### **Healer Ant** ♡
- **Cost:** 12 food
- **HP:** 100 | **Attack:** 3 | **Speed:** Fast
- **Role:** Support unit - heals injured allies
- **Behavior:** Follows warrior groups, heals damaged ants, avoids combat

### **Scout Ant** 👁
- **Cost:** 8 food
- **HP:** 60 | **Attack:** 3 | **Speed:** Very Fast
- **Role:** Intelligence gatherer - explores and reports discoveries
- **Behavior:** High mobility exploration, leaves intel trails when finding targets

## 🧠 Pheromone Trail System

Ants communicate through chemical trails that influence group behavior:

- **🟡 Food Trails:** Lead to discovered food sources
- **🔴 Enemy Trails:** Mark enemy presence and guide warriors to combat
- **🔵 Exploration Trails:** General movement and exploration patterns

### **Trail Following Behavior:**
- **Workers:** Strongly follow food trails (1.5x), weakly follow enemy trails (0.3x)
- **Warriors:** Moderately follow food trails (0.8x), strongly follow enemy trails (1.5x)
- **Healers:** Ignore food trails (0x), avoid enemy trails (0.2x)
- **Scouts:** Don't follow trails - create them instead!

## 🎛️ Controls & Interface

### **Behavior Controls**
- **Speed:** Global movement speed multiplier
- **Aggression:** Combat intensity and enemy-seeking behavior
- **Pheromone Attraction:** How strongly ants follow chemical trails
- **Wander Strength:** Random exploration tendency

### **AI Configuration**
- **Strategy:** Choose AI behavior (Economy/Balanced/Aggressive/Defensive)
- **Difficulty:** Easy/Normal/Hard (affects AI speed and bonuses)
- **AI Speed Multiplier:** How fast AI makes decisions

### **Recruitment Panel**
Click unit buttons to recruit ants using stored food. Button availability depends on current food reserves.

## 🤖 AI Strategies

### **Economy Focus** 📈
- 60% Workers, 20% Warriors, 10% Healers, 10% Scouts
- Prioritizes food collection and economic growth
- Builds minimal defense forces

### **Balanced** ⚖️
- 30% Workers, 30% Warriors, 20% Healers, 20% Scouts
- Well-rounded approach with good intelligence
- Adapts to player actions

### **Aggressive** 🗡️
- 20% Workers, 60% Warriors, 10% Healers, 10% Scouts
- Heavy military focus for early pressure
- Minimal economy, maximum combat power

### **Defensive** 🛡️
- 30% Workers, 30% Warriors, 30% Healers, 10% Scouts
- Strong healing support and base defense
- Responds to threats with appropriate counters

## 🏗️ Technical Architecture

### **File Structure**
```
├── index.html          # Main game interface
├── styles.css          # UI styling and layout
├── vector2.js          # 2D vector math utilities
├── ant-base.js         # Base ant class with common behavior
├── ant-types.js        # Specialized ant classes (Worker, Warrior, Healer, Scout)
├── hive.js            # Hive/Colony management
├── other-entities.js   # Food, Obstacles, Pheromones
├── ai.js              # AI controller and decision making
├── game.js            # Main game loop and management
└── main.js            # Initialization and setup
```

### **Class Hierarchy**
```
BaseAnt
├── WorkerAnt (economy focus)
├── WarriorAnt (combat focus)
├── HealerAnt (support focus)
└── ScoutAnt (intelligence focus)
```

## 🚀 Getting Started

1. **Open `index.html`** in a modern web browser
2. **Configure AI settings** in the behavior controls panel
3. **Click to add food** sources on the battlefield
4. **Recruit your army** using the recruitment panel
5. **Watch the battle unfold** as ants gather resources and fight
6. **Destroy the enemy hive** to achieve victory!

## 🎮 Gameplay Tips

### **Early Game Strategy**
- Start with **2-3 Workers** to establish economy
- Add **1-2 Scouts** for map awareness and food discovery
- Build **basic Warriors** for defense

### **Mid Game Tactics**
- Balance **economy vs military** based on AI strategy
- Use **Scouts** to locate enemy movements and food sources
- Add **Healers** to support large warrior groups

### **Late Game Warfare**
- Focus on **hive assault** with warrior groups
- Use **combined arms** - warriors attack, healers support
- **Protect your economy** while maintaining military pressure

### **Advanced Techniques**
- **Pheromone warfare:** Let warriors mark enemies for coordinated attacks
- **Economic disruption:** Target enemy workers gathering food
- **Intelligence advantage:** Use scouts to plan strategic moves
- **Resource control:** Secure large food sources with military presence

## 🔧 Customization

### **Difficulty Scaling**
- **Easy AI:** Slower decisions, reduced efficiency
- **Normal AI:** Balanced baseline performance
- **Hard AI:** Faster decisions, resource bonuses, enhanced efficiency

### **Behavioral Tuning**
Real-time sliders allow fine-tuning of:
- Movement speed and responsiveness
- Combat aggression and enemy-seeking
- Pheromone trail following strength
- Exploration vs focused behavior

## 🐛 Features & Mechanics

### **Resource Management**
- **Food collection** from stackable sources (3-8 stacks per source)
- **Per-colony food storage** with independent economies
- **Strategic resource competition** over limited food sources

### **Combat System**
- **Real-time combat** with health bars and damage feedback
- **Unit type advantages** (Warriors excel, Workers survive, Healers support)
- **Hive destruction** as primary victory condition

### **AI Intelligence**
- **Dynamic strategy adaptation** based on game state
- **Threat assessment** and appropriate responses
- **Emergency behavior** when hive under attack
- **Resource efficiency scaling** with difficulty

### **Visual Feedback**
- **Unit type indicators** (symbols and colors)
- **Health bars** for damaged units and hives
- **Pheromone trails** with type-specific colors
- **Special effects** for healing, combat, and scouting

## 🎯 Future Enhancements

Potential areas for expansion:
- **Multiplayer support** for human vs human battles
- **Campaign mode** with progressive difficulty
- **Additional unit types** (Engineers, Bombers, etc.)
- **Environmental hazards** and dynamic obstacles
- **Technology trees** and upgrades
- **Larger maps** with multiple hives per side

---

**Enjoy commanding your ant armies and may the best colony win!** 🏆
