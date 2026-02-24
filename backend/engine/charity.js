const CharityCampaign = require('../models/CharityCampaign');
const CharityDonation = require('../models/CharityDonation');
const { debitNeurFromUser, debitAibaFromUserNoBurn } = require('./economy');

/**
 * Donate NEUR and/or AIBA from user balance to a campaign.
 * Debits user, updates campaign raised/donorCount, creates CharityDonation.
 * Idempotent when requestId is provided (same requestId returns existing donation).
 */
async function donateToCampaign({
    telegramId,
    campaignId,
    amountNeur = 0,
    amountAiba = 0,
    requestId = null,
    message = '',
    anonymous = false,
    source = 'balance',
} = {}) {
    const amtNeur = Math.floor(Number(amountNeur)) || 0;
    const amtAiba = Math.floor(Number(amountAiba)) || 0;
    if (amtNeur <= 0 && amtAiba <= 0) {
        return { ok: false, error: 'amount_required', detail: 'At least one of amountNeur or amountAiba must be > 0' };
    }
    if (!telegramId) return { ok: false, error: 'telegramId required' };
    if (!campaignId) return { ok: false, error: 'campaignId required' };

    const campaign = await CharityCampaign.findById(campaignId).lean();
    if (!campaign) return { ok: false, error: 'campaign not found' };
    if (campaign.status !== 'active') {
        return { ok: false, error: 'campaign_not_accepting', detail: 'Campaign is not active' };
    }

    if (requestId) {
        const existing = await CharityDonation.findOne({ requestId }).lean();
        if (existing) {
            return {
                ok: true,
                duplicate: true,
                donation: existing,
                campaign: campaign,
            };
        }
    }

    const reason = 'charity_donate';
    const sourceType = 'charity_donate';
    const sourceId = requestId || `charity_${campaignId}_${telegramId}_${Date.now()}`;

    if (amtNeur > 0) {
        const debNeur = await debitNeurFromUser(amtNeur, {
            telegramId,
            reason,
            arena: 'charity',
            league: 'global',
            sourceType,
            sourceId,
            requestId,
            meta: { campaignId: String(campaignId) },
        });
        if (!debNeur.ok) {
            return {
                ok: false,
                error: debNeur.reason === 'insufficient' ? 'insufficient_neur' : 'debit_failed',
                detail:
                    debNeur.reason === 'insufficient' ? 'Insufficient NEUR' : debNeur.error?.message || 'Debit failed',
            };
        }
    }

    if (amtAiba > 0) {
        const debAiba = await debitAibaFromUserNoBurn(amtAiba, {
            telegramId,
            reason,
            arena: 'charity',
            league: 'global',
            sourceType,
            sourceId,
            requestId,
            meta: { campaignId: String(campaignId) },
        });
        if (!debAiba.ok) {
            return {
                ok: false,
                error: debAiba.reason === 'insufficient' ? 'insufficient_aiba' : 'debit_failed',
                detail:
                    debAiba.reason === 'insufficient' ? 'Insufficient AIBA' : debAiba.error?.message || 'Debit failed',
            };
        }
    }

    const isFirstDonation = (await CharityDonation.countDocuments({ campaignId, telegramId })) === 0;

    const donation = await CharityDonation.create({
        campaignId,
        telegramId,
        amountNeur: amtNeur,
        amountAiba: amtAiba,
        source,
        message: (message || '').slice(0, 500),
        anonymous: Boolean(anonymous),
        requestId: requestId || undefined,
        donatedAt: new Date(),
    });

    await CharityCampaign.updateOne(
        { _id: campaignId },
        {
            $inc: {
                raisedNeur: amtNeur,
                raisedAiba: amtAiba,
                ...(isFirstDonation ? { donorCount: 1 } : {}),
            },
        },
    );

    const updated = await CharityCampaign.findById(campaignId).lean();
    return {
        ok: true,
        donation: donation.toObject(),
        campaign: updated,
    };
}

module.exports = {
    donateToCampaign,
};
