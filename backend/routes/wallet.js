const router = require("express").Router()
const User = require("../models/User")

router.post("/connect", async (req,res)=>{
  const { telegramId, username, address } = req.body
  let user = await User.findOne({ telegramId })
  if(!user) user = await User.create({ telegramId, username })
  user.wallet = address
  await user.save()
  res.json({ status:"connected" })
})

module.exports = router
