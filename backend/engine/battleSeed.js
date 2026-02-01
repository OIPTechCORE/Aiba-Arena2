function buildBattleSeedMessage({
    telegramId = '',
    brokerId = '',
    modeKey = '',
    arena = '',
    league = '',
    requestId = '',
    opponentId = '',
}) {
    // Must include modeKey (or empty) and arena/league so the same requestId
    // cannot be replayed across different modes without changing the seed.
    return `${telegramId}:${brokerId}:${modeKey}:${arena}:${league}:${requestId}:${opponentId}`;
}

module.exports = { buildBattleSeedMessage };

