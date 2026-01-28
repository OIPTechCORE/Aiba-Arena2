const router = require("express").Router()
const User = require("../models/User")

router.post("/score", async (req,res)=>{
  const { telegramId, score } = req.body
  const reward = score * 2
  const user = await User.findOne({ telegramId })
  user.pendingAIBA += reward
  await user.save()
  res.json({ reward })
})

module.exports = router
