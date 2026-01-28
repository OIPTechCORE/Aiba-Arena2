const mongoose = require("mongoose")
module.exports = mongoose.model("User", {
  telegramId: String,
  username: String,
  wallet: String,
  aibaBalance: { type:Number, default:0 },
  pendingAIBA: { type:Number, default:0 }
})
