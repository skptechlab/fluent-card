# Special Effects System Guide

## Overview

The special effects system has been completely modularized into a separate file (`specialEffects.js`) to make it easy to add, modify, and manage special effects. The system supports both instant effects and duration-based effects with a clean registry pattern.

## Architecture

### Files Structure
- `specialEffects.js` - Main special effects module with registry and processor
- `cards.js` - Card definitions that reference special effects
- `game.js` - Game logic that uses the special effect processor

### Key Components

1. **SPECIAL_EFFECTS Registry** - Central registry of all available effects
2. **SpecialEffectProcessor Class** - Handles effect application and processing
3. **Effect Handler Functions** - Individual functions for each effect type
4. **Global Integration** - Seamless integration with existing game systems

## Adding New Special Effects

### Step 1: Define the Effect in the Registry

Add your new effect to the `SPECIAL_EFFECTS` object in `specialEffects.js`:

```javascript
new_effect_name: {
  id: 'new_effect_name',
  name: 'Display Name',
  type: 'instant' | 'duration',
  description: 'Effect description for players',
  duration: 0, // 0 for instant, >0 for turn-based
  handler: handlerFunction,
  modifier: modifierFunction, // Optional for damage modifiers
  tickDamage: number // Optional for per-turn damage effects
}
```

### Step 2: Create the Handler Function

Add the handler function in the same file:

```javascript
function handlerFunction(gameData) {
  const { gameState, scene, currentPlayer } = gameData;
  
  // Your effect logic here
  log(`🎭 ${effect.name}: Effect description`);
  
  // Modify game state, apply effects, etc.
  // Examples:
  // - Modify player stats: gameState.player1.hp += 50;
  // - Draw cards: drawCards(currentPlayer, 3);
  // - Modify battlefield: gameState.battlefieldCards.forEach(...);
  
  // Update UI if needed
  updateBoard();
  updateHPBars();
}
```

### Step 3: Add Card Data (Optional)

If you want to create a physical card for the effect, add it to `cards.js`:

```javascript
{
  id: 'g6', // Next available ID
  name: "Effect Name",
  atk: 0,
  imagePath: "./cards/g6.webp",
  type: "special",
  effect: "new_effect_name", // Must match registry ID
  description: "Same as registry description",
  duration: 0 // Must match registry duration
}
```

## Effect Types

### Instant Effects
- Applied immediately when card is played
- Examples: heal, damage, card draw, shuffle
- Duration: 0

```javascript
instant_heal: {
  id: 'instant_heal',
  name: 'Healing Potion',
  type: 'instant',
  description: 'Restore 100 HP immediately',
  duration: 0,
  handler: (data) => {
    const player = data.currentPlayer === 1 ? data.gameState.player1 : data.gameState.player2;
    player.hp = Math.min(player.maxHp, player.hp + 100);
    updateHPBars();
  }
}
```

### Duration Effects
- Active for multiple turns
- Can modify damage calculations
- Can apply turn-based effects (poison, burn, etc.)

```javascript
damage_boost: {
  id: 'damage_boost',
  name: 'Berserker Rage',
  type: 'duration',
  description: 'Double all damage for 2 turns',
  duration: 2,
  handler: applyDamageBoost,
  modifier: (damage) => damage * 2
}
```

### Tick Damage Effects
- Apply damage each turn
- Automatically handled by the processor

```javascript
bleeding: {
  id: 'bleeding',
  name: 'Bleeding Wound',
  type: 'duration',
  description: 'Deal 3 damage per turn for 4 turns',
  duration: 4,
  handler: applyBleeding,
  tickDamage: 3
}
```

## Advanced Features

### Damage Modifiers
Effects can modify damage calculations using the `modifier` function:

```javascript
// In your effect definition
modifier: (baseDamage, isFirstCard) => {
  // Apply your modification logic
  return Math.floor(baseDamage * 1.5);
}
```

### Animation Support
Add custom animations for your effects:

```javascript
function showCustomAnimation(effectName) {
  const overlay = document.createElement('div');
  overlay.textContent = `✨ ${effectName}`;
  overlay.className = 'effect-animation';
  // Add styling and animation
  document.body.appendChild(overlay);
  
  setTimeout(() => {
    if (overlay.parentNode) {
      overlay.parentNode.removeChild(overlay);
    }
  }, 2000);
}
```

## Complete Example: Adding "Lightning Strike"

### 1. Add to Registry
```javascript
lightning_strike: {
  id: 'lightning_strike',
  name: 'Lightning Strike',
  type: 'instant',
  description: 'Deal 25 damage to opponent and stun for 1 turn',
  duration: 0,
  handler: applyLightningStrike
}
```

### 2. Create Handler
```javascript
function applyLightningStrike(gameData) {
  const { gameState, currentPlayer } = gameData;
  
  // Deal direct damage
  const opponent = currentPlayer === 1 ? gameState.player2 : gameState.player1;
  opponent.hp = Math.max(0, opponent.hp - 25);
  
  // Add stun effect
  specialEffectProcessor.addActiveEffect({
    effectId: 'stun',
    name: 'Stunned',
    description: 'Cannot play cards next turn',
    duration: 1,
    remainingTurns: 1,
    appliedBy: currentPlayer
  });
  
  log('⚡ Lightning Strike: 25 damage + stun for 1 turn!');
  showLightningAnimation();
  updateHPBars();
}

function showLightningAnimation() {
  // Custom lightning effect animation
  const overlay = document.createElement('div');
  overlay.textContent = '⚡';
  overlay.style.cssText = `
    position: absolute;
    top: 30%;
    left: 50%;
    transform: translateX(-50%);
    font-size: 4rem;
    color: #FFD700;
    text-shadow: 0 0 20px #FFD700;
    pointer-events: none;
    z-index: 10000;
    animation: lightningFlash 1.5s ease-out forwards;
  `;
  
  document.body.appendChild(overlay);
  setTimeout(() => overlay.remove(), 1500);
}
```

### 3. Add Card (Optional)
```javascript
{
  id: 'g11',
  name: "Lightning Strike",
  atk: 0,
  imagePath: "./cards/g11.webp",
  type: "special",
  effect: "lightning_strike",
  description: "Deal 25 damage to opponent and stun for 1 turn",
  duration: 0
}
```

## Testing New Effects

1. Add the effect to the registry
2. Test in game by playing the card
3. Check console logs for any errors
4. Verify effect behavior matches description
5. Test edge cases (game end, multiple effects, etc.)

## Best Practices

1. **Descriptive Names**: Use clear, descriptive effect IDs and names
2. **Balanced Effects**: Consider game balance when setting damage/duration values
3. **Error Handling**: Add try-catch blocks for complex effects
4. **Logging**: Use the `log()` function to provide player feedback
5. **Documentation**: Update this guide when adding new effect types
6. **Testing**: Test effects in various game states

## Current Effects Available

- `shuffle` - Chaos Shuffle: Shuffle all hands and redraw
- `boost_atk` - Power Boost: +50% ATK for 1 turn
- `double_first` - Champion's Might: Double first card ATK
- `discard_opponent` - Mind Fracture: Opponent discards 2 cards
- `poison` - Poison Cloud: 2 damage per turn for 3 turns
- `heal` - Healing Light: Restore 50 HP (placeholder)
- `shield` - Magic Shield: Reduce damage by 50% (placeholder)
- `draw_cards` - Card Draw: Draw 3 cards (placeholder)
- `burn` - Flame Burst: 5 damage per turn for 2 turns (placeholder)
- `freeze` - Ice Prison: Skip opponent's turn (placeholder)

## Future Enhancements

- Effect stacking system
- Conditional effects (trigger on specific events)
- Player choice effects (select targets, etc.)
- Area of effect capabilities
- Card transformation effects
- Battlefield modification effects

## Troubleshooting

**Effect not working?**
- Check the effect ID matches between registry and card
- Ensure handler function is defined
- Check console for error messages
- Verify gameData is being passed correctly

**Animation not showing?**
- Check CSS animations are properly defined
- Ensure DOM elements are being created correctly
- Verify z-index and positioning

**Duration effects not expiring?**
- Check that `processTurnEffects()` is being called each turn
- Verify duration values are set correctly
- Ensure effect cleanup is working properly