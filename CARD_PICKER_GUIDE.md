# Manual Card Picker Testing Guide

## Overview

Instead of automatically forcing special effects, you can now manually choose which card to draw next from a complete list of available cards. This gives you full control over testing specific cards and effects.

## How to Use

### 🎮 **Enable Card Picker Mode**

**Method 1: Using Testing Panel**
1. **Start the game** (click Play or Login)
2. **Click the 📋 button** in bottom-right corner
3. **Click "📋 Toggle Card Picker"**
4. **Green indicator** shows "📋 CARD PICKER MODE"

**Method 2: Using Console**
```javascript
enableCardPicker()
```

### 📋 **Choose Cards to Draw**

When card picker mode is enabled:
1. **On your turn** - A card list automatically appears on the **left side**
2. **Two sections available:**
   - **⭐ Special Effects** - All special effect cards
   - **⚔️ Battle Cards** - Regular attack cards with ATK values
3. **Click any card name** to draw that specific card
4. **Card gets added to your hand** immediately

### 🎯 **Manual Card Selection**

You can also show the card picker anytime:
- **Click "📖 Show Card List"** in testing panel
- **Or use console:** `showCardPicker()`

## Card List Format

### ⭐ **Special Effects Section**
```
⭐ Special Effects
Chaos Shuffle
Power Boost  
Champion's Might
Mind Fracture
Poison Cloud
```

### ⚔️ **Battle Cards Section**
```
⚔️ Battle Cards
Fire Blast (45 ATK)
Ice Storm (40 ATK)
Lightning Strike (35 ATK)
[... all battle cards with ATK values]
```

## Testing Workflow

### 🧪 **Test Specific Special Effects**

1. **Enable card picker mode**
2. **Start your turn**
3. **Pick a special effect** from the list (e.g., "Poison Cloud")
4. **Play the card** and observe the effect
5. **Continue testing** other effects as needed

### ⚔️ **Test Mixed Gameplay**

1. **Pick battle cards** for normal gameplay
2. **Pick special effects** when you want to test them
3. **Mix both types** to test interactions
4. **Full control** over your hand composition

### 🎯 **Test Specific Scenarios**

**Test Duration Effects:**
1. Pick "Power Boost" or "Poison Cloud"
2. Play the card
3. Observe effect over multiple turns

**Test Instant Effects:**
1. Pick "Chaos Shuffle" or "Mind Fracture"  
2. Play immediately
3. See instant results

**Test Damage Modifiers:**
1. Pick "Power Boost"
2. Play it first
3. Pick battle cards
4. Test increased damage

## Available Special Effects

### ✅ **Fully Implemented**
- **Chaos Shuffle** - Reshuffles all hands, redraws 5 cards
- **Power Boost** - +50% ATK for 1 turn
- **Champion's Might** - First card gets 2x ATK  
- **Mind Fracture** - Opponent discards 2 cards
- **Poison Cloud** - 2 damage per turn for 3 turns

### 🔄 **Ready to Implement**
- **Healing Light** - Restore HP
- **Magic Shield** - Reduce damage
- **Card Draw** - Draw extra cards
- **Flame Burst** - Burn damage over time
- **Ice Prison** - Freeze opponent

## Console Commands

```javascript
// Enable/disable card picker
enableCardPicker()
disableCardPicker()
toggleCardPicker()

// Show/hide card list
showCardPicker()
hideCardPicker()

// Draw specific card (if you know the card object)
drawSpecificCard(cardData)

// Check available cards
console.log(gameState.availableCards)

// Check special effects only
console.log(gameState.availableCards.filter(c => isSpecialEffectCard(c)))
```

## Visual Indicators

- **📋 CARD PICKER MODE** - Green banner when enabled
- **Card List Panel** - Appears on left side during your turn
- **Color Coding:**
  - 🟡 **Special Effects** - Gold/Red gradient buttons
  - 🔵 **Battle Cards** - Blue gradient buttons
- **Hover Effects** - Buttons light up when hovered

## Benefits Over Automatic Mode

1. **Precise Testing** - Choose exactly which cards to test
2. **Scenario Control** - Build specific hand compositions
3. **No Randomness** - Predictable testing environment
4. **Full Card Access** - See and choose from all available cards
5. **Real-time Selection** - Choose cards as you need them

## Tips for Testing

1. **Test One Effect at a Time** - Pick one special effect, test thoroughly
2. **Check Field Effects** - Duration effects appear on right side of field
3. **Watch Game Log** - Detailed messages show effect results
4. **Test Interactions** - Try multiple effects together
5. **Test Edge Cases** - What happens with multiple shields, poisons, etc.

## Troubleshooting

**Card picker not showing?**
- Make sure card picker mode is enabled (`enableCardPicker()`)
- Check if it's your turn (card picker only shows on player turn)
- Try manually showing it (`showCardPicker()`)

**Cards not appearing in list?**
- Check console: `console.log(gameState.availableCards.length)`
- Verify game is active: `console.log(gameState.isGameActive)`
- Make sure cards are loaded: restart the game

**Card picker interferes with gameplay?**
- Disable when not testing: `disableCardPicker()`
- Close picker panel: click the × button or `hideCardPicker()`

This system gives you complete control over which cards appear in your hand, making it perfect for systematic testing of all special effects! 🎮📋