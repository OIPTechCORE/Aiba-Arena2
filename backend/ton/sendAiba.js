const TonWeb = require("tonweb")
const tonweb = new TonWeb()

async function sendAIBA(to, amount){
  const jettonWallet = new tonweb.token.jetton.JettonWallet(tonweb.provider, {
    address: process.env.ADMIN_WALLET
  })

  await jettonWallet.transfer({
    toAddress: to,
    jettonAmount: TonWeb.utils.toNano(amount.toString()),
    forwardAmount: TonWeb.utils.toNano("0.05")
  })
}

module.exports = sendAIBA
