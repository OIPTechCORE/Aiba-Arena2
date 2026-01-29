const router = require("express").Router()
const User = require("../models/User")

// Exported handler for easier testing
async function postScoreHandler(req, res) {
  try {
    const { telegramId, score } = req.body

    if (!telegramId) return res.status(400).json({ error: "telegramId required" })
    const numericScore = Number(score)
    if (!Number.isFinite(numericScore) || numericScore < 0) {
      return res.status(400).json({ error: "score must be a non-negative number" })
    }

    const reward = numericScore * 2

    let user = await User.findOne({ telegramId })
    if (!user) {
      // create minimal user record so a pendingAIBA can be tracked
      user = await User.create({ telegramId, pendingAIBA: reward })
      await user.save?.()
      return res.json({ reward, created: true })
    }

    user.pendingAIBA = (user.pendingAIBA || 0) + reward
    await user.save()

    res.json({ reward })
  } catch (err) {
    console.error("Error in /api/game/score:", err)
    res.status(500).json({ error: "internal server error" })
  }
}

router.post("/score", postScoreHandler)

module.exports = router
module.exports.postScoreHandler = postScoreHandler