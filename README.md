# 21 Rogue — Blackjack Roguelike

A strategic roguelike card game built on the logic of Blackjack. Navigate random floors, defeat enemies, collect relics, and beat the house.

## Stack

- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **Zustand** (state + localStorage persistence)
- **Supabase** (optional — global leaderboard)

## Game Design

### Core Loop
Each run takes you through 3 floors. Each floor has a map with branching paths — monsters, elites, events, shops, rest sites, and a boss.

Combat is turn-based blackjack: each round, both you and the enemy draw from separate shuffled decks. Higher total without busting wins the round and deals damage equal to the difference.

### Damage
- **Win the round**: Deal `(your total − enemy total)` damage, min 3
- **Lose the round**: Take `(enemy total − your total)` damage, min 3
- **Bust**: Take `(your total − 21)` damage, min 3. Modified by relics.
- **Tie**: Both take 2 damage (bosses may alter this)

### Relics (passive bonuses)
| Name | Tier | Effect |
|------|------|--------|
| Lucky Coin | Common | +12 max HP, +6 HP now |
| Gambler's Flask | Common | Heal 5 HP after each victory |
| Insurance Policy | Common | Half damage when you bust |
| Bankroll | Common | +20 gold at start of each floor |
| Dealing Glove | Common | Start combat with 3 cards |
| Card Counter's Lens | Uncommon | See next card before drawing |
| Iron Nerves | Uncommon | +4 damage when standing at 18+ |
| Double Down Chip | Uncommon | Draw 2 cards at once, once per combat |
| Marked Card | Uncommon | Swap a card once per combat |
| Ace Up Your Sleeve | Rare | Convert a card to Ace, once per combat |
| Hot Streak | Rare | Consecutive wins add bonus damage |
| Loaded Deck | Rare | Remove 2s, 3s, 4s from your deck |
| Second Sight | Rare | See enemy's first card each round |

### Abilities (active, cooldown-based)
| Name | Cooldown | Effect |
|------|----------|--------|
| Card Swap | 2 | Discard a card, draw replacement |
| Peek | 2 | Reveal top 3 cards of deck |
| Iron Stand | 3 | +3 to your total this round |
| Second Wind | Once/combat | If busting, set total to 20 |
| Fold | 3 | End round with no damage (take 3 HP) |
| Double Draw | 3 | Draw 2 cards as 1 action |
| Ace Mark | 4 | Convert a card to Ace |

### Enemies
**Floor 1**: Novice Gambler, Street Hustler | Elite: The Shark | Boss: Pit Boss  
**Floor 2**: Card Sharp, Risk Taker | Elite: Casino Enforcer | Boss: Loan Shark  
**Floor 3**: The Counter, House Agent | Elite: Debt Collector | Boss: The House  

Each boss has a unique mechanic that changes how combat plays out.

## Deploy to Vercel

### 1. Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOU/21-rogue.git
git push -u origin main
```

### 2. Import in Vercel
- Go to [vercel.com](https://vercel.com)
- Import the GitHub repo
- Deploy — no config needed for the base game

### 3. Optional: Enable Leaderboard (Supabase)

1. Create a project at [supabase.com](https://supabase.com)
2. Open the SQL Editor and run:

```sql
CREATE TABLE scores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  player_name TEXT NOT NULL,
  score INTEGER NOT NULL,
  floor_reached INTEGER NOT NULL DEFAULT 1,
  enemies_defeated INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX ON scores(score DESC);
ALTER TABLE scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow inserts" ON scores FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow reads" ON scores FOR SELECT USING (true);
```

3. Add environment variables in Vercel:
   - `NEXT_PUBLIC_SUPABASE_URL` — your project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` — your anon key

4. Redeploy

## Local Development

```bash
npm install
cp .env.example .env.local
# optionally fill in Supabase credentials
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
app/
  page.tsx              # Entry point
  layout.tsx            # Fonts, metadata
  globals.css           # Design system, animations
  api/scores/route.ts   # Leaderboard API

components/game/
  GameBoard.tsx          # Router — renders correct phase
  PlayerHUD.tsx          # Sticky header with stats
  CombatView.tsx         # Full combat screen
  MapView.tsx            # Floor map navigation
  EventView.tsx          # Random events
  ShopView.tsx           # Shop screen
  RestView.tsx           # Rest site
  FloorTransition.tsx    # Between floors
  EndScreens.tsx         # Game over + victory
  Card.tsx               # Playing card component
  MenuScreen.tsx         # Main menu + leaderboard

lib/game/
  types.ts               # All TypeScript types
  deck.ts                # Card math, shuffle, AI
  enemies.ts             # Enemy definitions
  relics.ts              # Relic catalog
  abilities.ts           # Ability definitions
  events.ts              # Random event catalog
  map.ts                 # Map generation
  store.ts               # Zustand store (all game logic)

lib/
  supabase.ts            # DB client
  utils.ts               # cn() helper
```
