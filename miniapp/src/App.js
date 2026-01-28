import { TonConnectButton, useTonWallet } from "@tonconnect/ui-react"
import axios from "axios"
import { useEffect } from "react"

function App(){
  const wallet = useTonWallet()

  useEffect(()=>{
    if(wallet){
      const user = window.Telegram.WebApp.initDataUnsafe.user
      axios.post("http://localhost:5000/api/wallet/connect",{
        telegramId:user.id,
        username:user.username,
        address:wallet.account.address
      })
    }
  },[wallet])

  return(
    <div>
      <h1>AIBA Arena</h1>
      <TonConnectButton/>
    </div>
  )
}

export default App
