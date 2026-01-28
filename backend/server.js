require("dotenv").config()
const express = require("express")
const mongoose = require("mongoose")
const cors = require("cors")
const cron = require("node-cron")

const app = express()
app.use(cors())
app.use(express.json())

mongoose.connect(process.env.MONGO_URI)
  .then(()=>console.log("MongoDB Connected"))

app.use("/api/wallet", require("./routes/wallet"))
app.use("/api/game", require("./routes/game"))
app.use("/api/admin", require("./routes/admin"))

const sendAIBA = require("./ton/sendAiba")
const User = require("./models/User")

cron.schedule("0 * * * *", async () => {
  const users = await User.find({ pendingAIBA: { $gt: 0 }})
  for (const user of users) {
    if (!user.wallet) continue
    await sendAIBA(user.wallet, user.pendingAIBA)
    user.pendingAIBA = 0
    await user.save()
  }
})

app.listen(5000, ()=>console.log("Server on 5000"))
