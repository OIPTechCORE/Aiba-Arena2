/**
 * Custom AI help agent — 100% free, no paid APIs.
 * Knowledge base: Q&A pairs with keyword patterns + doc chunks.
 * Matching: normalize query, score by keyword overlap, return best answer(s).
 */

const Q_AND_A = [
    {
        patterns: [
            'what is aiba',
            'what is aiba arena',
            'what is ai broker battle',
            'what is this app',
            'explain game',
            'what is aiba arena app',
        ],
        answer: 'AI Broker Battle Arena (AIBA) is a Telegram Mini App where you own AI brokers, enter battle arenas, run fights, and earn NEUR and AIBA. It combines trading-sim AI agents (brokers) with competitive arenas and an economy you can withdraw on-chain.',
    },
    {
        patterns: ['what is broker', 'what is ai broker', 'what are brokers', 'explain broker', 'broker meaning'],
        answer: 'An AI Broker is your in-game AI agent with stats (INT, SPD, RISK) and energy. You create, own, combine, trade, or mint brokers. They compete in arenas, earn AIBA and NEUR from battles, and can be listed on the Market.',
    },
    {
        patterns: [
            'what is arena',
            'battle arena',
            'arenas',
            'game mode',
            'prediction simulation',
            'guild wars arbitrage',
        ],
        answer: 'A Battle Arena is a game mode where your broker competes—prediction, simulation, strategyWars, arbitrage, or guildWars. Run a battle, get a score, and earn AIBA, Stars, and sometimes Diamonds. Each arena weights broker stats differently.',
    },
    {
        patterns: ['how start', 'how do i start', 'how to begin', 'first steps', 'get started', 'new player'],
        answer: 'Go to Brokers → create a broker (New broker) if you have none → pick an arena → Run battle. Earn NEUR and AIBA. Use the Guide (University) from the header for step-by-step.',
    },
    {
        patterns: ['how get broker', 'get a broker', 'create broker', 'new broker', 'buy broker', 'where broker'],
        answer: 'Brokers tab: New broker (free starter). Or Market: buy from system (AIBA) or from other players. You can combine two brokers in the Brokers tab.',
    },
    {
        patterns: ['earn neur', 'earn aiba', 'how earn', 'get neur', 'get aiba', 'make neur', 'make aiba', 'rewards'],
        answer: 'Run battles (Home or Arenas). You earn NEUR (off-chain) and AIBA (off-chain credits). AIBA can be claimed on-chain via Wallet → Vault: connect wallet, create claim, sign the transaction.',
    },
    {
        patterns: ['earn stars', 'what are stars', 'stars currency', 'how get stars'],
        answer: 'Win battles. Each win grants Stars (Telegram Stars–style in-app currency). Stars are shown in your balance strip and Wallet tab.',
    },
    {
        patterns: ['where aiba', 'where is my aiba', 'aiba balance', 'withdraw aiba', 'claim aiba'],
        answer: 'Your balance shows off-chain credits. To receive AIBA on-chain: connect your TON wallet (Wallet tab), then after a battle use Create claim or enable Auto-claim. Wallet tab → Vault.',
    },
    {
        patterns: ['diamonds', 'what are diamonds', 'diamond reward'],
        answer: 'Diamonds are a rare in-app asset. You get Diamonds on your first battle win (one-time). They appear in your balance strip and Wallet.',
    },
    {
        patterns: ['badges', 'verified', 'profile badge', 'badge meaning'],
        answer: 'Profile badges (e.g. verified, top leader) are assigned by the team or earned (e.g. top leaderboard). They show next to your name in the balance strip and Profile.',
    },
    {
        patterns: ['referral', 'referrals', 'referral code', 'invite friend', 'share link'],
        answer: 'Referrals tab: create your code (My code), share it. When someone applies your code, you both get bonuses (NEUR/AIBA if configured).',
    },
    {
        patterns: ['creator economy', 'referrer earn', 'passive income', 'tier 100'],
        answer: "As a referrer, you earn 2–7% of your referrals' battle, race, tournament, and Global Boss rewards. Tier: 100 refs = 3%, 1k = 5%, 10k = 7%.",
    },
    {
        patterns: ['predict', 'bet', 'battle of the hour', 'bet aiba'],
        answer: 'Predict: bet AIBA on which broker scores higher (Battle of the hour). Admins create events; you pick a side and amount. Winners split the pool minus a small vig to treasury.',
    },
    {
        patterns: ['car racing', 'bike racing', 'racing', 'race', 'cars bikes'],
        answer: 'Create or buy a car or bike (AIBA or TON), enter open races, earn AIBA by finish position. System shop sells cars/bikes for AIBA. Tabs: Car Racing, Bike Racing.',
    },
    {
        patterns: ['market', 'marketplace', 'sell broker', 'buy broker', 'list broker', 'unified market'],
        answer: 'Super Futuristic Unified Marketplace: one place for brokers, assets, rentals, system shop, and boosts. Sell or buy with AIBA. Create brokers with TON. Withdraw from guild first to list your broker.',
    },
    {
        patterns: ['guild', 'guilds', 'group', 'guild wars', 'deposit broker guild'],
        answer: 'Guilds tab: create or join a group. Guild Wars arena sends part of rewards to the guild. Deposit brokers into the guild pool to participate in guild wars.',
    },
    {
        patterns: ['wallet', 'connect wallet', 'ton wallet', 'tonconnect', 'claim on chain'],
        answer: 'Connect your TON wallet (e.g. Tonkeeper) via the header "Connect Wallet". Then you can create AIBA claims (Wallet → Vault), stake AIBA, and use P2P or gifts.',
    },
    {
        patterns: ['staking', 'stake aiba', 'yield', 'apy', 'lock aiba'],
        answer: 'Wallet or Staking tab: stake AIBA (flexible or locked periods). You earn APY. Minimum stake is set in config. Cancel early = 5% fee to Treasury.',
    },
    {
        patterns: ['memes', 'memefi', 'create meme', 'meme earn', 'meme boost'],
        answer: 'Memes tab: create memes (image URL + caption), get likes, comments, shares. Boost with AIBA/NEUR to increase score. Top memes and boosters earn from the daily reward pool. Education categories: study humor, exam tips, school events.',
    },
    {
        patterns: ['earn tab', 'how earn', 'earn summary', 'earn from'],
        answer: 'Earn tab shows all ways you earn: battles, memes, referrals, daily NEUR, tasks. It also lists redemption products (school fee discount, LMS premium, exam prep, merch) you can unlock with AIBA/NEUR/Stars.',
    },
    {
        patterns: ['redemption', 'redeem', 'school fee', 'lms', 'exam prep', 'merch'],
        answer: 'Earn tab → Redeem: spend AIBA, NEUR, or Stars for school fee discount, LMS premium, exam prep unlocks, or merch. Products are configured by admins.',
    },
    {
        patterns: ['university', 'guide', 'courses', 'learn', 'tutorial'],
        answer: 'University (Guide in header): step-by-step courses on brokers, arenas, economy, guilds. Complete courses for progress and optional badge/certificate mint (TON).',
    },
    {
        patterns: ['support', 'help', 'contact', 'bug', 'problem', 'issue'],
        answer: 'Updates tab: FAQs (expandable) and Contact support form (subject + message). For bugs or requests, use the form or the channel/link in announcements.',
    },
    {
        patterns: ['energy', 'cooldown', 'broker energy', 'run battle again'],
        answer: 'Each broker has energy; each battle costs energy (per mode). Energy regens over time. Each arena mode has a cooldown (seconds) before the same broker can run that mode again.',
    },
    {
        patterns: ['combine', 'merge broker', 'two brokers'],
        answer: 'Brokers tab: if you have at least two brokers, use Combine. Pick base and sacrifice; base keeps blended stats, sacrifice is removed. Cost: NEUR (see Brokers tab hint).',
    },
    {
        patterns: ['mint', 'nft', 'mint broker', 'broker nft'],
        answer: 'Brokers tab: Mint as NFT. Costs AIBA. Your broker gets an on-chain NFT; you can keep or trade it.',
    },
    {
        patterns: ['train', 'repair', 'upgrade', 'broker train', 'broker repair'],
        answer: 'Brokers tab: on each broker you can Train (+1 stat, costs NEUR), Repair (restore energy, NEUR), or Upgrade (+2 stat and +1 level, costs AIBA).',
    },
    {
        patterns: ['daily', 'daily reward', 'daily neur', 'daily claim'],
        answer: 'Wallet tab: Daily reward. Claim NEUR once per day (if configured). Check Daily status there.',
    },
    {
        patterns: ['tasks', 'task center', 'missions', 'personalized task'],
        answer: 'Tasks tab: personalized mission queue (newcomer, fighter, trader, racer, social, scholar, investor). Complete tasks for progress and rewards.',
    },
    {
        patterns: ['global boss', 'boss', 'damage', 'boss reward'],
        answer: 'Global Boss: fight the community boss. Damage from your battles counts. When the boss is defeated, top damagers share the reward pool. Run battles to deal damage.',
    },
    {
        patterns: ['dao', 'governance', 'proposal', 'vote'],
        answer: 'DAO/Governance: create proposals and vote (requires staked AIBA and min stake period). Wallet tab has links to Staking and DAO.',
    },
    {
        patterns: ['charity', 'donate', 'donation'],
        answer: 'Charity tab: Unite for Good. Donate NEUR or AIBA to active campaigns. Your impact and charity leaderboard are shown there.',
    },
    {
        patterns: ['disclaimer', 'guarantee', 'financial advice', 'no guarantee'],
        answer: 'Rewards (AIBA, NEUR, Stars) are not guaranteed. They depend on gameplay and participation. No financial advice. See Terms of Service and Privacy Policy in the app.',
    },
    {
        patterns: ['auto claim', 'auto-claim', 'autoclaim', 'claim after battle', 'claim automatically'],
        answer: 'Turn on "Auto-claim AIBA on battle" (Wallet or battle area). After you run a battle with wallet connected, the app creates a claim for that battle\'s AIBA. Then tap "Claim on-chain" in your wallet to receive AIBA jettons.',
    },
    {
        patterns: ['create claim', 'manual claim', 'claim manually', 'vault claim', 'on-chain claim'],
        answer: 'Wallet tab → Vault / On-chain claim. Enter amount (or leave blank for all AIBA credits) → "Create claim". Then tap "Claim on-chain (TonConnect)" and confirm in your TON wallet. Your connected wallet address is saved for receiving AIBA.',
    },
    {
        patterns: ['claim expired', 'validUntil', 'claim invalid', 'vault inventory', 'insufficient vault'],
        answer: 'Claims have a time limit (validUntil). If it expires, create a new claim. If you see "Vault inventory too low" or "Vault has insufficient TON", the project needs to top up the vault; try again later.',
    },
    {
        patterns: ['list broker', 'sell broker', 'withdraw from guild', 'broker in guild', 'list on market'],
        answer: 'To list a broker on the Market: withdraw it from the guild first (Guilds tab → Withdraw selected broker). Then in Market tab choose the broker, set AIBA price, and tap List.',
    },
    {
        patterns: ['stars store', 'buy stars', 'stars with aiba', 'stars with ton'],
        answer: 'Market or Wallet tab → Stars Store. You can buy a pack of Stars with AIBA or with TON (send TON to the Stars Store wallet, paste tx hash, then confirm).',
    },
    {
        patterns: ['boost profile', 'profile boost', 'boosted badge', 'visibility'],
        answer: 'Wallet tab → Boost your profile. Pay TON to the Boost Profile wallet, paste the transaction hash, tap Boost. Your profile gets higher visibility (e.g. Boosted badge) until the configured end date.',
    },
    {
        patterns: ['gift', 'gifts', 'send gift', 'gift ton', 'gifts received'],
        answer: 'Wallet tab → Gifts. Enter recipient (Telegram ID or @username), send the required TON to the Gifts wallet, paste tx hash, add optional message, tap Send gift. You can see Gifts sent and Gifts received there.',
    },
    {
        patterns: ['combine cost', 'merge cost', 'how much combine', 'neur for combine'],
        answer: 'Combining two brokers costs NEUR (amount shown on the Brokers tab, e.g. 50 NEUR). Pick base and sacrifice; the base keeps blended stats and the sacrifice is removed.',
    },
    {
        patterns: ['mint cost', 'mint broker cost', 'nft cost', 'how much to mint'],
        answer: 'Minting a broker as NFT costs AIBA (amount shown on the Brokers tab). After mint, the backend queues the job; when complete, your broker is linked to an on-chain NFT. You can stake it in Multiverse for daily AIBA.',
    },
    {
        patterns: ['intelligence', 'speed', 'risk', 'broker stats', 'stat meaning', 'int spd risk'],
        answer: 'Each broker has INT (Intelligence), SPD (Speed), RISK (0–100). These stats feed into the battle score. Different arenas weight them differently: e.g. prediction favors INT, strategyWars favors RISK. Level gates leagues (rookie 1+, pro 5+, elite 10+).',
    },
    {
        patterns: ['rookie', 'pro league', 'elite', 'league requirement', 'level gate'],
        answer: 'Leagues: rookie (level 1+), pro (level 5+), elite (level 10+). Higher league = more energy/cooldown and higher rewards. Your broker level is shown in the Brokers tab.',
    },
    {
        patterns: ['leaderboard', 'rank', 'my rank', 'top players', 'score rank'],
        answer: 'Home tab → Leaderboard. You can sort by score, AIBA, NEUR, or battles. Your leaderboard rank (e.g. #42) is shown in the Guilds tab and is used for free group creation (top N can create for free).',
    },
    {
        patterns: ['meme leaderboard', 'top memes', 'meme rank', 'memes tab leaderboard'],
        answer: 'Leaderboard tab has a Meme subsection (top 5 memes). Full meme leaderboard is in the Memes tab: top memes and top creators by engagement score. Top memes share the daily MemeFi reward pool.',
    },
    {
        patterns: ['meme boost', 'boost meme', 'boost with aiba', 'meme boost lock'],
        answer: 'On a meme detail: tap Boost and spend AIBA or NEUR. Your boost is locked for a period (config: boostLockHours). Boosters share 20% of the daily MemeFi reward pool. Minimum boost amount may apply.',
    },
    {
        patterns: ['meme report', 'report meme', 'inappropriate', 'report content'],
        answer: 'On a meme: use Report and choose a reason. Reports are for moderation; avoid false reports (anti-spam rules may apply).',
    },
    {
        patterns: ['meme share', 'share meme', 'share in app', 'share telegram'],
        answer: "Meme detail: Share records an internal share (in-app) or external share (e.g. Telegram). Both count toward the meme's engagement score and can help it rank in the daily pool.",
    },
    {
        patterns: [
            'redemption product',
            'redeem product',
            'school fee discount',
            'lms premium',
            'exam prep',
            'merch redeem',
        ],
        answer: 'Earn tab → Redeem. Products (e.g. school fee discount, LMS premium, exam prep unlock, merch) are set by admins. Each has a cost in AIBA, NEUR, or Stars. Tap Redeem to spend and receive a code or message.',
    },
    {
        patterns: ['university mint', 'mint certificate', 'course badge', 'graduate badge', 'pay ton university'],
        answer: 'University tab: after completing course modules you can mint a course badge or full certificate by paying TON. Send TON to the configured wallet, paste the tx hash, and submit. Your graduate badge appears in progress.',
    },
    {
        patterns: ['trainers', 'trainer', 'become trainer', 'trainer tier'],
        answer: 'Trainers tab: users who refer others can become trainers. Trainer tiers and rewards are configured by the project. Check the Trainers tab for your status and how to level up.',
    },
    {
        patterns: ['multiverse', 'nft stake', 'stake nft', 'stake broker nft', 'multiverse earn'],
        answer: 'Multiverse tab: view My NFTs (broker NFTs you minted). Stake a broker NFT to earn AIBA daily (e.g. 5 AIBA per NFT per day). Claim rewards there; Unstake to stop earning and keep the NFT.',
    },
    {
        patterns: ['contact support', 'support form', 'bug report', 'feature request', 'updates tab support'],
        answer: 'Updates tab: use the support form (subject: question, bug, feature, account, other + message). Submit to contact the team. For FAQs, expand the FAQ block in the same tab.',
    },
    {
        patterns: ['create broker with ton', 'pay ton broker', 'create broker ton', 'tx hash broker'],
        answer: 'Market tab → Create your broker (pay TON). Send the required TON to the project wallet, copy the transaction hash, paste it in the app, tap Create broker. Your new broker is created and listed on the marketplace.',
    },
    {
        patterns: ['apply referral', 'enter referral code', 'referral code apply', 'used referral'],
        answer: 'Paste the referral code into "Enter referral code" and tap Apply. You need a connected wallet (anti-sybil). Each code is usually one-time per user. If it fails: check wallet, code spelling, and that you haven\'t already used a referral.',
    },
    {
        patterns: ['daily neur', 'daily reward claim', 'once per day', 'daily limit'],
        answer: 'Wallet tab → Daily reward. You can claim NEUR once per day if the feature is enabled. The Daily status shows when you last claimed and when you can claim again.',
    },
    {
        patterns: ['yield vault', 'minimum stake', 'min stake', 'stake 100 aiba', 'ecosystem stake'],
        answer: 'Wallet or Yield Vault tab: staking has a minimum (default 1000 AIBA; Super Admin can change it in Admin → Economy). Flexible and locked periods both enforce it. Locked options (30/90/180/365 days) show reward preview; cancel early = 5% fee to Treasury.',
    },
    {
        patterns: ['tournament', 'tournaments', 'tournament reward'],
        answer: "Tournaments are competitive events (when enabled). Join from the relevant tab or Home. Rewards depend on placement. Referrers may earn a share of their referrals' tournament rewards.",
    },
    {
        patterns: ['breeding', 'breed', 'breed broker'],
        answer: 'Breeding (if enabled) lets you combine two brokers to create offspring. Check the Brokers or dedicated Breeding tab for requirements and cost (often NEUR or AIBA).',
    },
    {
        patterns: ['premium', 'subscription', 'pay monthly', 'premium feature'],
        answer: 'Premium or subscription features (if any) are described in the app where they appear. Common perks: extra energy, exclusive arenas, or cosmetic badges. Check Wallet or Settings for upgrade options.',
    },
    {
        patterns: ['saved address', 'claim address', 'where is my wallet', 'wallet address saved'],
        answer: 'Your connected TON wallet address is saved for claims. It appears in the Wallet tab (truncated). All AIBA claims are sent to this address when you tap "Claim on-chain". Reconnect if you switch wallets.',
    },
];

const CHUNKS = [
    {
        title: 'Core loop',
        text: 'Connect wallet → Get or create broker → Pick arena and league → Run battle → Earn NEUR and AIBA → Optionally claim AIBA on-chain from Wallet → Vault.',
    },
    {
        title: 'Brokers',
        text: 'Brokers are your AI agents. Each has INT, SPD, RISK (0–100), level, energy, and cooldowns. Create (starter or buy), combine two, mint as NFT, or list on Market.',
    },
    {
        title: 'Arenas',
        text: 'Arenas: prediction, simulation, strategyWars, guildWars, arbitrage. Leagues: rookie, pro, elite. Higher league = higher rewards and level requirement. Guild Wars needs a guild.',
    },
    {
        title: 'Economy',
        text: 'NEUR: off-chain, from battles, referrals, daily. AIBA: off-chain credits, claimable on-chain. Stars: per battle win. Diamonds: first battle win once.',
    },
    {
        title: 'Wallet',
        text: 'Wallet tab: connect TON wallet, boost profile, gifts, daily NEUR, vault (create claim), staking, DAO, Stars and Diamonds. Claim address is saved for receiving AIBA on-chain.',
    },
    {
        title: 'MemeFi',
        text: 'Memes tab: create memes (image URL + caption, category e.g. study_humor, exam_tips, general_edu). Like, comment, share (internal/external), boost with AIBA/NEUR, report. Daily pool: top memes 40%, boosters 20%, lottery 10%, mining 30%.',
    },
    {
        title: 'Redemption',
        text: 'Earn tab → Redeem: spend AIBA, NEUR, or Stars on products (school fee discount, LMS premium, exam prep, merch). Products and costs are set by admins. My redemptions shows your history and issued codes.',
    },
    {
        title: 'Vault claim',
        text: 'Create claim in Wallet → Vault (amount or all). Claim on-chain sends AIBA jettons to your connected TON address. Claims expire (validUntil); if vault is low, the project tops it up later.',
    },
    {
        title: 'Guilds',
        text: 'Guilds tab: create (free if top N on leaderboard, else pay TON with tx hash), join (paste Guild ID), boost (pay TON, paste tx). Deposit/withdraw broker for guild wars. Withdraw broker before listing on Market.',
    },
    {
        title: 'Staking',
        text: 'Stake AIBA in Wallet or Yield Vault: flexible or locked (30/90/180/365 days). Minimum stake applies. APY and countdown shown. Cancel early: 5% fee to Treasury.',
    },
];

/** Suggested questions for empty state and fallback (no API). */
export const SUGGESTED_QUESTIONS = [
    'How do I start?',
    'What is a broker?',
    'How do I earn AIBA?',
    'Where is the Market?',
    'How do I claim AIBA on-chain?',
    'What are Stars and Diamonds?',
];

function normalize(text) {
    if (!text || typeof text !== 'string') return '';
    return text
        .toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function tokenize(text) {
    return normalize(text).split(' ').filter(Boolean);
}

function scoreOverlap(queryTokens, targetText) {
    const targetTokens = new Set(tokenize(targetText));
    let hits = 0;
    for (const t of queryTokens) {
        if (t.length < 2) continue;
        if (targetTokens.has(t)) hits += 1;
        else {
            for (const tt of targetTokens) {
                if (tt.includes(t) || t.includes(tt)) {
                    hits += 0.5;
                    break;
                }
            }
        }
    }
    return queryTokens.length > 0 ? hits / queryTokens.length : 0;
}

/** If query contains pattern as substring, return boost (0.5); else 0. */
function phraseBoost(normalizedQuery, pattern) {
    const p = normalize(pattern);
    if (p.length < 2) return 0;
    return normalizedQuery.includes(p) ? 0.5 : 0;
}

/**
 * Get the best answer for a user question. No API calls — pure client-side matching.
 * @param {string} userMessage
 * @returns {{ answer: string, source?: string, suggested?: string[] }}
 */
export function getAnswer(userMessage) {
    const q = normalize(userMessage);
    if (!q || q.length < 2) {
        return {
            answer: 'Type a short question (e.g. "How do I start?") and tap Ask.',
            source: 'Assistant',
            suggested: SUGGESTED_QUESTIONS,
        };
    }

    const tokens = tokenize(userMessage);
    let bestScore = 0;
    let bestAnswer = null;
    let bestSource = null;

    for (const qa of Q_AND_A) {
        for (const pattern of qa.patterns) {
            const patternTokens = tokenize(pattern);
            const overlap = scoreOverlap(tokens, pattern) + scoreOverlap(patternTokens, q) * 0.5;
            const boost = phraseBoost(q, pattern);
            const score = overlap + boost;
            if (score > bestScore) {
                bestScore = score;
                bestAnswer = qa.answer;
                bestSource = 'FAQ';
            }
        }
    }

    if (bestScore >= 0.25) {
        return { answer: bestAnswer, source: bestSource, suggested: SUGGESTED_QUESTIONS.slice(0, 3) };
    }

    for (const chunk of CHUNKS) {
        const score = scoreOverlap(tokens, chunk.title + ' ' + chunk.text);
        if (score > bestScore) {
            bestScore = score;
            bestAnswer = chunk.text;
            bestSource = chunk.title;
        }
    }

    if (bestScore >= 0.2) {
        return { answer: bestAnswer, source: bestSource, suggested: SUGGESTED_QUESTIONS.slice(0, 3) };
    }

    return {
        answer: "I didn't find a close match. Try one of the suggested questions below, or open Updates → FAQs and the support form.",
        source: 'Assistant',
        suggested: SUGGESTED_QUESTIONS,
    };
}

export { Q_AND_A, CHUNKS };
