# Special Effects Testing Guide

## Quick Start Testing

### 🚀 **Enable Testing Mode**

1. **Start the game** (click Play or Login)
2. **Open Developer Console** (F12 or Ctrl+Shift+I)
3. **Enable testing mode:**
   ```javascript
   enableSpecialEffectsTesting()
   ```

### 🎮 **Alternative: Use Testing Panel**

1. **Look for the 🧪 button** in bottom-right corner of the game
2. **Click it** to open the Special Effects Testing Panel
3. **Click "🧪 Toggle Testing Mode"** to enable
4. **Click "⭐ Force Draw Special Effect"** to get a special card immediately

## Testing Features

### 🔧 **Testing Mode Effects**

When testing mode is enabled:
- ✅ **Player draws special effect cards every turn** (instead of random cards)
- ✅ **Initial hand includes 2 special effect cards**
- ✅ **Visual indicator shows testing is active**
- ✅ **Detailed logging of all special effect activities**

### 🎯 **Available Testing Commands**

**In Browser Console:**
```javascript
// Enable/disable testing mode
enableSpecialEffectsTesting()
disableSpecialEffectsTesting()
toggleSpecialEffectsTesting()

// Force draw a special effect card immediately
forceDrawSpecialEffect()

// Check current available effects
console.log(Object.keys(SPECIAL_EFFECTS))
```

**Via Testing Panel:**
- 🧪 **Toggle Testing Mode** - Enable/disable automatic special effect drawing
- ⭐ **Force Draw Special Effect** - Add a random special effect card to hand
- 📋 **List All Effects** - Show popup with all available special effects

## Current Special Effects to Test

### ✅ **Fully Implemented Effects**

1. **g1 - Chaos Shuffle** 🌪️
   - Shuffles all cards in both players' hands
   - Redraws 5 cards each
   - **Test**: Play and check if hands are reshuffled

2. **g2 - Power Boost** ⚡
   - +50% ATK boost to all cards for 1 turn
   - **Test**: Play, then attack with any card - damage should be increased

3. **g3 - Champion's Might** 👑
   - First card played gets 2x ATK for 1 turn
   - **Test**: Play, then play a card first - it should deal double damage

4. **g4 - Mind Fracture** 🧠
   - Forces opponent to discard 2 random cards
   - **Test**: Play and check opponent's hand size decreases

5. **g5 - Poison Cloud** ☠️
   - Deals 2 HP damage per turn for 3 turns
   - **Test**: Play and watch opponent HP decrease each turn

### 🔄 **Placeholder Effects (Ready for Implementation)**

6. **heal** - Healing Light 💚
7. **shield** - Magic Shield 🛡️
8. **draw_cards** - Card Draw 📇
9. **burn** - Flame Burst 🔥
10. **freeze** - Ice Prison 🧊

## Step-by-Step Testing Process

### 🧪 **Test Individual Effects**

1. **Enable testing mode**
2. **Start a new game** 
3. **Look for special effect cards** in your hand (they have ⭐ symbol)
4. **Click a special effect card** to select it
5. **Play the card** and observe the effect
6. **Check the game log** for effect messages
7. **Verify the effect worked** as expected

### 🔄 **Test Effect Duration**

1. **Play a duration-based effect** (Power Boost, Champion's Might, Poison)
2. **Check the field effects area** (right side) - card should appear there
3. **End your turn** and let AI play
4. **Start next turn** - effect should still be active
5. **Repeat until duration expires** - card should move to played area

### ⚔️ **Test Effect Interactions**

1. **Play multiple effects** in sequence
2. **Test damage modifiers** with Power Boost + Champion's Might
3. **Test tick damage** with Poison + Burn
4. **Verify effect stacking rules** (some effects may not stack)

## Expected Behaviors

### ✅ **Visual Indicators**

- **Testing Mode Banner**: Red banner shows "🧪 TESTING MODE: Special Effects"
- **Special Effect Cards**: Have different appearance/glow
- **Field Effects**: Cards with duration appear on right side of field
- **Damage Numbers**: Float up when effects deal damage
- **Game Log**: Shows detailed effect messages

### ✅ **Gameplay Changes**

- **Card Draw**: Testing mode prioritizes special effects
- **Turn Processing**: Effects are processed at start of each turn
- **Damage Calculation**: Modifiers are applied to base damage
- **Effect Expiration**: Duration effects automatically expire

## Troubleshooting

### ❌ **Common Issues**

**"Effect not working"**
- ✅ Check console for error messages
- ✅ Verify card is actually a special effect (check card type)
- ✅ Ensure testing mode is enabled
- ✅ Try restarting the game

**"No special effects drawn"**
- ✅ Enable testing mode: `enableSpecialEffectsTesting()`
- ✅ Force draw: `forceDrawSpecialEffect()`
- ✅ Check if special effects are in deck: `console.log(gameState.availableCards.filter(c => isSpecialEffectCard(c)))`

**"Effect duration not working"**
- ✅ Check if card appears in field effects area (right side)
- ✅ Verify effect is in active effects: `console.log(gameState.activeEffects)`
- ✅ Make sure you're ending turns properly

### 🔧 **Debug Commands**

```javascript
// Check current game state
console.log(gameState)

// Check active effects
console.log(gameState.activeEffects)

// Check field effects
console.log(gameState.fieldEffects)

// Check available cards
console.log(gameState.availableCards.filter(c => isSpecialEffectCard(c)))

// Check processor state
console.log(getSpecialEffectProcessor())
```

## Test Results Template

When testing, note:

```
Effect Name: _______________
Expected Behavior: _______________
Actual Behavior: _______________
Issues Found: _______________
Status: ✅ Pass / ❌ Fail / 🔄 Partial
```

## Adding New Effects for Testing

1. **Add to SPECIAL_EFFECTS registry** in `specialEffects.js`
2. **Create handler function**
3. **Add card data** (optional)
4. **Test using the methods above**
5. **Update this guide** with new effect

## Quick Test Checklist

- [ ] Testing mode enables successfully
- [ ] Special effect cards appear in hand
- [ ] Cards can be played without errors
- [ ] Instant effects work immediately
- [ ] Duration effects appear in field area
- [ ] Duration effects expire properly
- [ ] Damage modifiers apply correctly
- [ ] Turn-based effects process each turn
- [ ] Game log shows effect messages
- [ ] Effects integrate with existing systems (referee, mobile, etc.)

Happy testing! 🎮✨