import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const SECTIONS = [
  {
    id: 'basics',
    title: 'The Basics',
    level: 'Beginner',
    levelColor: 'text-green-400 bg-green-900/30',
    topics: [
      {
        title: 'How a Hand Works',
        content: `Every hand of No-Limit Hold'em follows the same pattern:

1. **Two cards are dealt face-down** to each player. Only you can see your cards.
2. **Five community cards** are dealt face-up in the middle of the table over three rounds (the flop, turn, and river).
3. **You make the best 5-card hand** using any combination of your two cards and the five community cards.
4. **The best hand wins the pot** (all the chips bet during the hand).

There are four rounds of betting: before any community cards (preflop), after the first three cards (flop), after the fourth card (turn), and after the fifth card (river). On each round, you can fold (quit), check (pass without betting), call (match someone's bet), or raise (increase the bet).`
      },
      {
        title: 'Hand Rankings (Worst to Best)',
        content: `Here are the possible hands, from weakest to strongest:

1. **High Card** — No pairs or combinations. Your highest card plays. Example: A-K-9-7-3.
2. **One Pair** — Two cards of the same rank. Example: K-K-8-5-2.
3. **Two Pair** — Two different pairs. Example: A-A-J-J-4.
4. **Three of a Kind** — Three cards of the same rank. Example: 9-9-9-K-5.
5. **Straight** — Five cards in a row. Example: 5-6-7-8-9.
6. **Flush** — Five cards of the same suit. Example: 2-5-8-J-A all hearts.
7. **Full House** — Three of a kind plus a pair. Example: Q-Q-Q-7-7.
8. **Four of a Kind** — Four cards of the same rank. Example: J-J-J-J-3.
9. **Straight Flush** — Five cards in a row, all the same suit. Example: 7-8-9-10-J all spades.
10. **Royal Flush** — A-K-Q-J-10 all the same suit. The best possible hand.

The higher the ranking, the rarer and stronger the hand. Most hands are won with one pair, two pair, or just a high card.`
      },
      {
        title: 'The Betting Rounds Explained',
        content: `**Preflop (Before the Flop)**
Two players must post forced bets called "blinds" — the small blind and big blind. Then each player looks at their two cards and decides whether to fold, call the big blind, or raise.

**The Flop**
Three community cards are dealt face-up. A new round of betting begins. The first player to act can check (bet nothing) or bet. Then each other player can fold, call, or raise.

**The Turn**
A fourth community card is dealt. Another round of betting happens, just like the flop.

**The River**
The fifth and final community card is dealt. The last round of betting happens. If more than one player is still in after betting, there's a showdown — everyone reveals their cards and the best hand wins.

**Key point:** You can win the pot at any time if everyone else folds. You don't need the best hand — sometimes just betting confidently is enough to win.`
      },
      {
        title: 'Understanding Your Position',
        content: `Your seat at the table matters — a lot. "Position" means when you act relative to other players.

**Early Position (Under the Gun / UTG)**
You act first. This is the worst position because you have no information about what other players will do. Play only your strongest hands here.

**Middle Position (MP)**
You've seen a few players act. You can be slightly looser than UTG, but still be careful.

**Late Position (Cutoff and Button)**
The Button is the best seat in poker. You act last on every street after the flop, so you get to see what everyone else does before you decide. This is a huge advantage — you can play more hands and make better decisions.

**The Blinds (Small Blind and Big Blind)**
You've already invested money, but you act first after the flop. This makes the blinds the trickiest positions to play from.

**Why does position matter?**
Acting last is like taking a test after seeing everyone else's answers. You have more information, so you can make better decisions. Professional players win most of their money from late position.`
      }
    ]
  },
  {
    id: 'fundamentals',
    title: 'Core Strategy',
    level: 'Beginner+',
    levelColor: 'text-emerald-400 bg-emerald-900/30',
    topics: [
      {
        title: 'Starting Hand Selection',
        content: `The most important decision in poker happens before the flop: which hands to play?

**Premium Hands (Always play these)**
- Pocket Aces (AA), Kings (KK), Queens (QQ), Jacks (JJ)
- Ace-King (same suit or not)

**Strong Hands (Usually play these)**
- Pocket Tens (TT), Nines (99)
- Ace-Queen suited, Ace-Jack suited
- King-Queen suited

**Playable Hands (Play from good positions)**
- Medium pairs (88, 77, 66)
- Suited connectors like 8-9 suited, 7-8 suited
- Suited aces (A-5 suited, A-4 suited)

**The Rest**
Most other hands should be folded, especially from early position. New players make their biggest mistakes by playing too many hands. Professionals fold 70-80% of their hands before the flop.

**The Rule of Thumb:**
If you wouldn't feel comfortable calling a raise with your hand, don't play it. Just fold and wait for something better.`
      },
      {
        title: 'Pot Odds — The Most Important Math in Poker',
        content: `Pot odds tell you whether calling a bet is profitable. Here's the simple version:

**The Question:** "Am I paying a fair price for my chance of winning?"

**How to Calculate:**
1. Look at the total pot (including the bet you're facing).
2. Look at what you need to pay to call.
3. Divide your call by the total pot = the percentage you need to win.

**Example:**
The pot is $20. Your opponent bets $10. Now the pot is $30, and it costs you $10 to call.
$10 / ($30 + $10) = $10 / $40 = 25%
You need to win 25% of the time to break even.

If your hand wins more than 25% of the time → calling is profitable.
If your hand wins less than 25% of the time → fold.

**Why this matters:**
You don't need to win every hand. If you call $10 and win a $40 pot 30% of the time, you profit in the long run. That's the core of poker math — making decisions that are profitable over hundreds of hands.

**Quick Reference:**
- Opponent bets 1/3 of the pot → you need ~20% to call
- Opponent bets 1/2 of the pot → you need ~25% to call
- Opponent bets the full pot → you need ~33% to call
- Opponent bets 2x the pot → you need ~40% to call`
      },
      {
        title: 'Aggression — Why Betting Beats Calling',
        content: `One of the biggest differences between winning and losing players is aggression.

**Calling only gives you one way to win:** having the best hand at showdown.
**Betting gives you two ways to win:** having the best hand OR making your opponent fold.

That extra way to win is incredibly valuable. When you bet, your opponent must make a difficult decision. If they fold, you win without needing the best cards.

**When to Bet/Raise:**
- When you think you have the best hand (betting for "value")
- When you want to protect your hand from being outdrawn
- When you think your opponent will fold better hands (a "bluff")

**When to Just Call:**
- When your hand is good but not great, and raising could scare off worse hands
- When you want to keep the pot small and see another card cheaply
- When you're trapping an aggressive opponent by letting them bet into you

**The Biggest Beginner Mistake:**
New players call too much and raise too little. If your hand is worth playing, it's often worth raising with. If it's not worth raising, ask yourself if it's worth playing at all.`
      }
    ]
  },
  {
    id: 'intermediate',
    title: 'Leveling Up',
    level: 'Intermediate',
    levelColor: 'text-blue-400 bg-blue-900/30',
    topics: [
      {
        title: 'Continuation Betting (C-Betting)',
        content: `A "continuation bet" (c-bet) is when you raised before the flop and then bet again on the flop, regardless of whether the flop helped your hand.

**Why c-bet?**
- You showed strength by raising preflop, so your opponent expects you to have a good hand.
- The flop misses most hands. Your opponent won't connect with the flop about 2/3 of the time.
- By betting, you often win the pot right there.

**Good Flops to C-Bet:**
- Dry flops (unconnected cards like K-7-2) — fewer possible hands beat you
- Flops that likely helped your range (Ace-high flops when you raised preflop)

**Bad Flops to C-Bet:**
- Very connected flops (7-8-9, J-T-9) — lots of possible straights and draws
- Flops with three of the same suit — someone might have a flush
- Multi-way pots (3+ players) — harder to bluff multiple opponents

**How Much to Bet:**
A good c-bet size is 1/3 to 2/3 of the pot. You don't need to bet big — a smaller bet achieves the same goal of making weak hands fold while risking less when you're wrong.`
      },
      {
        title: 'Reading the Board',
        content: `The community cards (the "board") tell a story. Learning to read it helps you figure out what your opponents might have.

**Dry Boards (K-7-2 rainbow)**
Few possible strong hands. If you have top pair or better, you're usually in great shape. These are good boards to bet on.

**Wet Boards (8-9-T with two hearts)**
Lots of possible straights, flushes, and draws. Be more cautious. Someone could easily have a strong hand or a draw that could beat you.

**Paired Boards (Q-Q-5)**
Someone needs a Queen to have trips (three of a kind), which is less likely. These boards often favor the player who raised before the flop.

**What to Ask Yourself:**
1. "What hands could my opponent have that beat me?"
2. "What hands could my opponent have that I beat?"
3. "Are there draws that could improve their hand on the next card?"
4. "Does this board favor hands I would typically play, or hands my opponent would play?"

The more you practice this, the better your decisions will be.`
      },
      {
        title: 'Bet Sizing — Why It Matters',
        content: `The amount you bet sends a message and affects your profit. Here's how to think about it:

**Small Bets (1/4 to 1/3 of the pot)**
- Used when you want to bet often with many different hands
- Good on dry boards where you don't need to "protect" your hand
- Risks less when you're bluffing

**Medium Bets (1/2 to 3/4 of the pot)**
- The most common bet size
- Good balance of value and protection
- Forces draws to pay a fair price

**Large Bets (Pot-size or more)**
- Used when you have a very strong hand and want maximum value
- Also used as big bluffs on scary boards
- Puts maximum pressure on your opponent

**Key Principle: Be Consistent**
If you always bet big with strong hands and small with weak hands, observant opponents will catch on. Try to use similar bet sizes with both your strong hands and your bluffs. This makes you unpredictable.`
      },
      {
        title: 'Playing Draws (Waiting for Your Hand to Improve)',
        content: `A "draw" means you don't have a made hand yet, but one more card could complete a strong hand.

**Common Draws:**
- **Flush draw:** You have 4 cards of the same suit. You need 1 more. About 35% chance by the river (19% on the next card alone).
- **Open-ended straight draw:** You have 4 cards in a row (like 5-6-7-8). You need one on either end. About 32% by the river (17% on the next card).
- **Gutshot straight draw:** You need one specific card in the middle (like 5-6-_-8-9, needing a 7). About 17% by the river (9% on the next card).

**Should You Call With a Draw?**
Use pot odds! If your chance of completing the draw is higher than the price you're paying, call. If not, fold.

**Should You Bet/Raise With a Draw?**
Yes, sometimes! This is called a "semi-bluff." You might win right away if they fold, and even if they call, you still have a chance to make your hand. It's one of the most profitable plays in poker.`
      }
    ]
  },
  {
    id: 'gto',
    title: 'GTO Strategy',
    level: 'Advanced',
    levelColor: 'text-purple-400 bg-purple-900/30',
    topics: [
      {
        title: 'What is GTO? (In Plain English)',
        content: `GTO stands for "Game Theory Optimal." It sounds intimidating, but the core idea is simple:

**GTO is a strategy that can't be beaten in the long run.**

Imagine you're playing Rock-Paper-Scissors. If you throw each option exactly 1/3 of the time at random, your opponent can't exploit you — no matter what they do, they'll break even against you.

GTO poker works the same way. It's a mathematically "balanced" strategy where you mix your bets, calls, and folds at specific frequencies so that no opponent strategy can consistently beat you.

**What does this mean practically?**
- Sometimes you bet with strong hands (for value)
- Sometimes you bet with weak hands (as a bluff)
- The ratio is balanced so your opponent can't tell which is which
- If they call too much, your value bets win more. If they fold too much, your bluffs win more.

**Should you play pure GTO?**
For most players, no. GTO is the "default" strategy — the baseline that works against everyone. But against specific opponents, you can adjust. If someone folds too much, bluff more. If someone calls too much, bluff less and bet your strong hands bigger.

**Think of GTO as the foundation, and adjustments as the finishing touches.**`
      },
      {
        title: 'Ranges — Thinking Like a Pro',
        content: `Beginners think about specific hands: "I have Ace-King, they probably have Pocket Queens."

Professionals think in **ranges**: "What collection of hands could they possibly have here?"

**What is a range?**
A range is all the possible hands someone could hold, given how they've played so far.

**Example:**
A player raises from early position. Their range might be: AA, KK, QQ, JJ, TT, AK, AQ, AJ suited. That's a tight range of strong hands — because most players only raise good hands from early position.

If that same player raised from the Button (last position), their range is wider: all of the above plus 99, 88, KQ, KJ, QJ, suited connectors, and more — because position gives them an advantage.

**Why does thinking in ranges help?**
Instead of guessing their exact cards, you evaluate how your hand performs against their entire range. If you beat most of their range, you should bet. If you lose to most of their range, you should fold.

**This is the biggest mental leap in poker.** Once you start thinking in ranges instead of specific hands, your decisions become much more logical and consistent.`
      },
      {
        title: 'Frequencies — Why "Sometimes" Is the Right Answer',
        content: `In GTO poker, the correct play isn't always "bet" or "fold" — it's often "bet X% of the time and check Y% of the time."

**Why mix your plays?**
If you always bet your strong hands and always check your weak hands, you become predictable. A good opponent will just fold when you bet and attack when you check.

By mixing, you make yourself unpredictable. Your opponent can't be sure if your bet means strength or weakness.

**Practical Example:**
You're on the river with a medium-strength hand. GTO might say:
- Bet 40% of the time (as a thin value bet)
- Check 60% of the time (to trap or to avoid being raised)

You don't need to be exactly 40/60. The principle is: don't always do the same thing in the same spot.

**How the Coach Uses This:**
When the coaching panel shows frequencies like "Raise 70%, Call 25%, Fold 5%", it's telling you the balanced approach. The highest-frequency action is the most common correct play, but the other options aren't wrong — they're alternatives that keep you balanced.

**For beginners:** Just follow the highest-frequency action. As you improve, you can start incorporating the mixed strategies.`
      },
      {
        title: 'Expected Value (EV) — The Ultimate Measure',
        content: `Every decision in poker has an "Expected Value" — the average amount you gain or lose over many repetitions.

**Positive EV (+EV):** On average, this play makes you money. Do it.
**Negative EV (-EV):** On average, this play loses money. Avoid it.
**Zero EV (0 EV):** Break even. It doesn't matter what you choose.

**Example:**
The pot is $100. You have a 40% chance of winning. Someone bets $30.
- If you call: 40% of the time you win $130 (pot + their bet). 60% you lose $30.
- EV = (0.40 x $130) - (0.60 x $30) = $52 - $18 = +$34

This call has an EV of +$34 — it's very profitable! Even though you'll lose this specific hand more than half the time, the times you win more than make up for it.

**The Mindset Shift:**
Stop thinking about individual hand results. A good decision might lose this time but win you money over 100 hands. A bad decision might get lucky this time but cost you money over 100 hands.

**Focus on making good decisions, not on short-term results.** The money will follow.`
      },
      {
        title: 'Exploitative Play — Adjusting to Your Opponent',
        content: `GTO is the default, but the real money comes from adjusting to specific opponents.

**If your opponent folds too much:**
- Bluff more often
- Bet more aggressively
- You don't need a great hand to win — just the courage to bet

**If your opponent calls too much (a "calling station"):**
- Stop bluffing! They'll call you down with anything
- Bet bigger with your strong hands — they'll pay you off
- Be patient and wait for good cards

**If your opponent is very aggressive:**
- Let them do the betting for you — check strong hands and let them bluff into you
- Call more with medium-strength hands (they're often bluffing)
- Don't fold too easily

**If your opponent plays tight (a "nit"):**
- Steal their blinds often — they fold too much preflop
- When they do bet big, respect it — they usually have it
- Put pressure on them and make them uncomfortable

**The key:** Watch how each opponent plays and adjust your strategy. Use the GTO baseline as your starting point, then lean in the direction that exploits their tendencies.`
      }
    ]
  },
  {
    id: 'deep',
    title: 'Deep Stack Play',
    level: 'Advanced',
    levelColor: 'text-red-400 bg-red-900/30',
    topics: [
      {
        title: 'What Makes Deep Stacks Different?',
        content: `In a standard poker game you start with about 100 big blinds (100 BB). In a deep-stack game you might have 150, 200, or even 300 BB. That extra money changes almost everything about how you should play.

**Why depth matters — the short version:**
When stacks are deep, every pot has the potential to become enormous. A single hand can win or lose your entire stack. This means:

- **Speculative hands become much more valuable.** A small pair like 3-3 isn't exciting at 50 BB because you can't win enough when you hit a set. At 300 BB, hitting a set can win you a massive pot — easily 10-20 times what you invested preflop.
- **Position becomes even more important.** Deeper stacks mean more betting rounds with bigger decisions. Being last to act gives you a huge information advantage on every street.
- **Big pairs become trickier.** At 100 BB, you're happy to put it all in with Aces preflop. At 300 BB, you might get all-in and still lose — because the hands that call you deep (sets, two pair) have you crushed.
- **Post-flop skill matters more.** Shallow stacks mean fewer decisions. Deep stacks mean more streets, more bets, and more opportunities for the better player to outplay their opponent.

**Bottom line:** Deep-stack poker rewards patience, creativity, and post-flop skill. If you're a beginner, start with standard stacks and work your way up.`
      },
      {
        title: 'Implied Odds — The Engine of Deep-Stack Play',
        content: `"Implied odds" means the money you expect to win on future streets if you hit your hand. This is THE most important concept in deep-stack poker.

**Regular pot odds:** "I need to pay $10 now to potentially win the $30 that's already in the pot."
**Implied odds:** "I need to pay $10 now, but if I hit my hand, I can win the $30 in the pot PLUS another $100+ from my opponent on later streets."

**Why this matters deep:**
At 100 BB, your opponent only has so much money behind. Even if you hit a monster, they might not pay you off enough to justify your preflop call.

At 300 BB, your opponent has a massive stack behind them. If you flop a set against their overpair, they might put in 200+ BB trying to figure out why you keep raising. That's where the big money comes from.

**Example:**
You have 5-5 in the Big Blind. Someone raises to 3 BB. You call 2 BB more.
- You'll flop a set about 12% of the time (roughly 1 in 8 tries)
- At 100 BB: you need to win about 16 BB when you hit to break even. Doable but tight.
- At 300 BB: you could win 100-200+ BB when you hit. That's hugely profitable even though you miss 7 out of 8 times.

**The deeper the stacks, the more "set mining" and "drawing" is worth.**`
      },
      {
        title: 'Which Hands Gain the Most Value Deep?',
        content: `Not all hands benefit equally from deep stacks. Here's what changes:

**Hands that gain a LOT of value deep:**
- **Small and medium pairs (22-88):** Set mining becomes incredibly profitable. You invest a small amount preflop and can win a huge pot when you hit.
- **Suited connectors (54s, 67s, 89s, etc.):** These can make straights and flushes that are hard for opponents to see coming. A hidden flush or straight deep can win someone's entire stack.
- **Suited gappers (75s, 86s, 97s, etc.):** Similar to suited connectors but slightly weaker. Still very profitable deep because of flush potential.
- **Suited aces (A2s-A9s):** The nut flush draw is incredibly powerful deep. If you make the best possible flush, your opponent with a smaller flush might pay off their whole stack.

**Hands that DON'T change much deep:**
- **Premium pairs (AA, KK, QQ):** These are great at any depth, but they actually become slightly trickier deep. You can still get stacked by a set or two pair.
- **Big offsuit cards (AKo, KQo):** These make top pair, which is fine but rarely wins a huge pot deep. One pair hands are uncomfortable when 300 BB go in.

**The key shift in thinking:**
At standard depth, you want the best starting hand (AA, KK).
At deep stacks, you want the hand with the most hidden potential (suited connectors, small pairs). A hand that can make the nuts (best possible hand) is worth more than a hand that makes top pair.`
      },
      {
        title: 'Preflop Strategy Changes When Deep',
        content: `Your preflop approach needs significant adjustments when deep-stacked.

**From the Big Blind (BB) — Defend much wider:**
At 300 BB, you should call raises with almost any suited hand and all pairs. The price is tiny compared to what you can win. Hands like 43 suited, 32 suited, and all small pairs become automatic calls versus a standard raise.

**From late position — Open more speculative hands:**
The Button and Cutoff can add more suited connectors and gappers to their raising range. You have position AND deep stacks — the dream combination.

**From early position — Stay tight but add set-mining hands:**
UTG should still play tight, but you can add small pairs (22-55) that you would fold at shallow stacks. If you hit a set, your early position raise looks like AA/KK, and opponents pay you off.

**3-betting (re-raising) adjustments:**
- With premium hands: 3-bet smaller. At 300 BB, a 3-bet to 9-10 BB lets opponents call with speculative hands that you dominate.
- With suited connectors: You can 3-bet these as bluffs. If called, you have a playable hand. If they 4-bet, you fold cheaply.
- Avoid 3-betting mediocre hands: Hands like AJo or KTo are awkward when deep. They make top pair but can't handle the heat when stacks go in.

**Raise sizing:**
At deep stacks, consider raising slightly larger (3x instead of 2.5x BB) to charge speculative callers. But don't go crazy — you still want action with your premium hands.`
      },
      {
        title: 'Post-Flop Play Deep — The Art of Building Pots',
        content: `Post-flop is where deep-stack poker really diverges from standard play.

**Pot control is essential:**
With 300 BB behind, the pot can grow exponentially. A small bet on the flop leads to a medium bet on the turn and a huge bet on the river. You need a plan for ALL three streets, not just the current one.

**Before you bet, ask yourself:**
1. "If I bet here, how big will the pot be by the river?"
2. "Is my hand strong enough to put in that many chips?"
3. "Would I be comfortable if my opponent raises?"

**The stack-to-pot ratio (SPR):**
SPR = your remaining stack divided by the pot. This number tells you how committed you should be:
- SPR below 4: You're basically committed. Top pair is usually good enough to go with.
- SPR 4-10: Medium commitment. You want at least two pair or a strong draw.
- SPR above 10: You need a very strong hand (set or better) to be comfortable stacking off.

At 300 BB preflop, the SPR after a standard raise and call might be 30+. That means you need a very strong hand to put all the money in. This is why one-pair hands are dangerous deep.

**Slow-playing becomes more viable:**
At deep stacks, you can check-call with monsters (sets, straights, flushes) more often. Your opponent has more chips to bet on later streets, so you're not leaving money on the table by not raising immediately.

**Multi-street planning:**
Think about the WHOLE hand, not just the current bet. If you have a set on the flop, plan your bet sizes so that by the river, you can get all the chips in naturally. Don't bet too big too early (scares them off) or too small (leaves money behind).`
      },
      {
        title: 'Common Deep-Stack Mistakes to Avoid',
        content: `Even experienced players make these errors when stacks get deep:

**Mistake 1: Overvaluing one-pair hands**
At 100 BB, top pair top kicker is often good enough to go all-in. At 300 BB, if you put in your whole stack with one pair, you're almost always beaten. One pair is a "small pot" hand at deep stacks — play it cautiously.

**Mistake 2: Not adjusting bet sizes**
The same $20 bet means very different things at 100 BB vs 300 BB. At 100 BB it's a significant portion of your stack. At 300 BB it's a tiny probe. Adjust your sizing to match the effective depth.

**Mistake 3: Ignoring position**
Position is always important, but deep stacks amplify it. Playing out of position (acting first) with 300 BB behind is very difficult because every mistake compounds over multiple streets. Be extra disciplined about which hands you play from the blinds.

**Mistake 4: Failing to set-mine**
At deep stacks, NOT calling with small pairs against a raise is leaving money on the table. The implied odds are too good. As long as the raise is less than about 5% of the effective stack, calling with any pair is profitable.

**Mistake 5: Getting attached to premiums**
Just because you have Aces doesn't mean you should put in 300 BB. If the board is scary (connected, suited, paired) and your opponent is showing extreme aggression, even AA should be folded sometimes. Deep stacks require emotional detachment from your starting hand.

**Mistake 6: Not taking notes on opponents**
Deep-stack games are usually slower with fewer all-ins. This gives you time to observe. Pay attention to who plays too many hands, who folds to pressure, and who only bets big with the nuts. These reads are worth fortunes in deep play.`
      }
    ]
  },
  {
    id: 'mental',
    title: 'The Mental Game',
    level: 'All Levels',
    levelColor: 'text-amber-400 bg-amber-900/30',
    topics: [
      {
        title: 'Tilt — Your Biggest Enemy',
        content: `"Tilt" is when emotions take over your decision-making. It's the #1 reason good players lose money.

**Common Tilt Triggers:**
- Losing a big pot with a strong hand (a "bad beat")
- Losing several hands in a row
- Making a mistake you know was wrong
- Facing an annoying or lucky opponent

**How Tilt Hurts You:**
- You play too many hands trying to "win it back"
- You make bigger bets than the situation calls for
- You call bets you should fold because you're frustrated
- You stop thinking clearly and play on emotion

**How to Manage Tilt:**
1. Recognize it. If you feel frustrated, angry, or desperate — you're on tilt.
2. Take a break. Even 2-3 minutes away from the table helps.
3. Remember: bad luck evens out. A bad beat doesn't change the correct strategy.
4. Focus on your decisions, not your results. If you made the right play and lost, that's just variance.
5. Have a stop-loss. Decide before you play: "If I lose X amount, I'm done for the day."`
      },
      {
        title: 'Bankroll Management',
        content: `Your "bankroll" is the total amount of money you've set aside for poker. Managing it properly is crucial.

**The Problem:**
Even the best players go through losing streaks. Poker has natural ups and downs (called "variance"). If you play with money you can't afford to lose, a normal downswing can wipe you out.

**The Rule of 20:**
For casual games, have at least 20 buy-ins for the stakes you're playing. If you play $1/$2, keep at least $4,000 in your poker bankroll. This cushion lets you survive the natural swings.

**Moving Up and Down:**
- If your bankroll grows to 25+ buy-ins for the next level, you can try moving up
- If your bankroll drops below 15 buy-ins, move down in stakes
- There's no shame in playing lower stakes — it's smart management

**The Mindset:**
Treat poker money as completely separate from your living expenses. Never play with money you need for bills, rent, or food. Poker should be funded by money you can comfortably lose.`
      },
      {
        title: 'Continuous Improvement',
        content: `The best poker players never stop learning. Here's how to keep getting better:

**Review Your Hands:**
After each session, look at the hands where you lost the most or felt unsure. Ask: "Would I make the same decision again?" Use this app's coaching and analysis features to identify patterns.

**Focus on One Thing at a Time:**
Don't try to fix everything at once. Pick one leak (like calling too much on the river) and focus on improving just that area for a week. Then move to the next one.

**Track Your Results:**
Keep notes on your sessions — how many hands you played, how much you won/lost, and how you felt. Over time, you'll see patterns about when you play best and worst.

**Study the Math:**
Pot odds, expected value, and hand probabilities are the foundation of good poker. The more comfortable you are with the numbers, the easier the decisions become.

**Stay Humble:**
Even experienced players make mistakes. The game is always evolving, and there's always more to learn. Embrace the process and enjoy the journey.`
      }
    ]
  }
];

export default function Guide() {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('basics');
  const [expandedTopic, setExpandedTopic] = useState(null);

  const section = SECTIONS.find(s => s.id === activeSection);

  const renderContent = (text) => {
    // Simple markdown-like rendering
    return text.split('\n\n').map((paragraph, i) => {
      // Check for bold markers
      const parts = paragraph.split(/(\*\*[^*]+\*\*)/g);
      const rendered = parts.map((part, j) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={j} className="text-white font-semibold">{part.slice(2, -2)}</strong>;
        }
        return <span key={j}>{part}</span>;
      });

      // Check if it's a list item
      if (paragraph.trim().match(/^[\d]+\./)) {
        return (
          <p key={i} className="text-gray-300 text-sm leading-relaxed mb-2 pl-2">
            {rendered}
          </p>
        );
      }
      if (paragraph.trim().startsWith('- ')) {
        return (
          <p key={i} className="text-gray-300 text-sm leading-relaxed mb-1.5 pl-4">
            {rendered}
          </p>
        );
      }

      return (
        <p key={i} className="text-gray-300 text-sm leading-relaxed mb-3">
          {rendered}
        </p>
      );
    });
  };

  return (
    <div className="w-full h-full flex flex-col bg-gray-950 overflow-hidden">
      {/* Header */}
      <div className="bg-gray-900/90 border-b border-gray-800 px-4 py-3 flex items-center gap-3 shrink-0">
        <button
          onClick={() => navigate('/')}
          className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-800 text-gray-400 active:bg-gray-700"
        >
          ←
        </button>
        <div>
          <h1 className="text-lg font-bold text-white">Strategy Guide</h1>
          <p className="text-[10px] text-gray-500">From beginner to advanced</p>
        </div>
      </div>

      {/* Section Tabs */}
      <div className="bg-gray-900/60 border-b border-gray-800 px-2 py-2 flex gap-1.5 overflow-x-auto shrink-0 no-scrollbar">
        {SECTIONS.map(s => (
          <button
            key={s.id}
            onClick={() => { setActiveSection(s.id); setExpandedTopic(null); }}
            className={`shrink-0 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
              activeSection === s.id
                ? 'bg-gold text-black'
                : 'bg-gray-800 text-gray-400 active:bg-gray-700'
            }`}
          >
            {s.title}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {section && (
          <>
            {/* Section header */}
            <div className="flex items-center gap-2 mb-4">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${section.levelColor}`}>
                {section.level}
              </span>
              <h2 className="text-xl font-black text-white">{section.title}</h2>
            </div>

            {/* Topics */}
            <div className="space-y-2">
              {section.topics.map((topic, i) => {
                const topicKey = `${section.id}-${i}`;
                const isExpanded = expandedTopic === topicKey;
                return (
                  <div key={i} className="bg-gray-900/80 border border-gray-800 rounded-xl overflow-hidden">
                    <button
                      onClick={() => setExpandedTopic(isExpanded ? null : topicKey)}
                      className="w-full flex items-center justify-between px-4 py-3.5 active:bg-gray-800/50"
                    >
                      <span className="text-sm font-semibold text-gray-200 text-left">{topic.title}</span>
                      <span className="text-gray-500 text-xs shrink-0 ml-2">{isExpanded ? '▼' : '▶'}</span>
                    </button>
                    {isExpanded && (
                      <div className="px-4 pb-4 pt-0 border-t border-gray-800/50 animate-fade-in">
                        <div className="mt-3">{renderContent(topic.content)}</div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Navigation to next section */}
            <div className="flex gap-2 mt-6 mb-8">
              {SECTIONS.findIndex(s => s.id === activeSection) > 0 && (
                <button
                  onClick={() => {
                    const idx = SECTIONS.findIndex(s => s.id === activeSection);
                    setActiveSection(SECTIONS[idx - 1].id);
                    setExpandedTopic(null);
                    window.scrollTo(0, 0);
                  }}
                  className="flex-1 bg-gray-800 text-gray-300 font-semibold py-3 rounded-xl text-sm active:bg-gray-700"
                >
                  ← Previous
                </button>
              )}
              {SECTIONS.findIndex(s => s.id === activeSection) < SECTIONS.length - 1 && (
                <button
                  onClick={() => {
                    const idx = SECTIONS.findIndex(s => s.id === activeSection);
                    setActiveSection(SECTIONS[idx + 1].id);
                    setExpandedTopic(null);
                    window.scrollTo(0, 0);
                  }}
                  className="flex-1 bg-gold text-black font-semibold py-3 rounded-xl text-sm active:scale-[0.98]"
                >
                  Next: {SECTIONS[SECTIONS.findIndex(s => s.id === activeSection) + 1]?.title} →
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
