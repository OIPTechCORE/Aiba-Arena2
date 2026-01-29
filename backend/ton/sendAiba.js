const TON_DEFAULT_PROVIDER = process.env.TON_PROVIDER_URL || 'https://testnet.toncenter.com/api/v2/jsonRPC'
const ADMIN_SIGNER_TYPE = process.env.ADMIN_SIGNER_TYPE || 'stub' // stub | mnemonic | private_key | kms
const ADMIN_WALLET = process.env.ADMIN_WALLET || ''

const TonWeb = require('tonweb')
let TonWebMnemonic
try { TonWebMnemonic = require('tonweb-mnemonic') } catch (e) { /* optional dependency for mnemonic path */ }

const provider = new TonWeb.HttpProvider(TON_DEFAULT_PROVIDER)
const tonweb = new TonWeb(provider)

async function sendAIBA(to, amount) {
  if (!to) throw new Error('recipient address required')
  if (!amount || Number(amount) <= 0) throw new Error('amount must be > 0')

  // In CI or test mode, allow stub to avoid real transfers
  if (process.env.APP_ENV === 'test' || ADMIN_SIGNER_TYPE === 'stub') {
    console.log(`[sendAIBA] STUB MODE: would send ${amount} to ${to}`)
    return { stub: true }
  }

  // Ensure provider and admin wallet are configured
  if (!TON_DEFAULT_PROVIDER) throw new Error('TON_PROVIDER_URL is not configured')
  if (!ADMIN_WALLET) throw new Error('ADMIN_WALLET is not configured')

  // Amount handling: expect amount in smallest jetton unit (integer).
  // If you store token amounts in decimal then convert to smallest unit here.

  try {
    if (ADMIN_SIGNER_TYPE === 'mnemonic') {
      if (!TonWebMnemonic) throw new Error('tonweb-mnemonic not installed. Install it to use mnemonic signer')
      const mnemonic = (process.env.ADMIN_MNEMONIC || '').split(' ').filter(Boolean)
      if (mnemonic.length < 12) throw new Error('ADMIN_MNEMONIC must be set for mnemonic signer')

      const keyPair = await TonWebMnemonic.mnemonicToKeyPair(mnemonic)
      // Example wallet class (v4R2). Adjust to your wallet version.
      const WalletClass = tonweb.wallet.all.v4R2
      const wallet = new WalletClass(tonweb.provider, { publicKey: keyPair.publicKey })
      const walletAddress = await wallet.getAddress()

      // TODO: Discover the Jetton master / minter and sender's jetton wallet address for ADMIN_WALLET.
      // This example assumes you already know your admin jetton wallet address (ADMIN_JETTON_WALLET env var).
      const adminJettonWalletAddress = process.env.ADMIN_JETTON_WALLET
      if (!adminJettonWalletAddress) throw new Error('ADMIN_JETTON_WALLET is required for mnemonic signer')

      const { JettonWallet } = TonWeb.token.jetton
      const senderJettonWallet = new JettonWallet(tonweb.provider, { address: adminJettonWalletAddress })

      // Create transfer body (amount must be in smallest units)
      const transferBody = await senderJettonWallet.createTransferBody({
        jettonAmount: BigInt(amount),
        toAddress: to,
        responseAddress: walletAddress.toString(true, true, true),
        forwardAmount: TonWeb.utils.toNano('0'),
        forwardPayload: null,
      })

      // Ensure seqno
      let seqno = await wallet.methods.seqno().call()
      if (seqno === undefined || seqno === null) seqno = 0

      // Send transfer: we send an internal message from wallet to senderJettonWalletAddress with payload
      const sendRes = await wallet.methods.transfer({
        secretKey: keyPair.secretKey,
        toAddress: adminJettonWalletAddress,
        amount: TonWeb.utils.toNano('0.05'), // gas estimate, adjust as needed
        seqno: seqno,
        payload: transferBody,
        sendMode: 3,
      }).send()

      console.log('[sendAIBA] transfer sent', sendRes)
      return sendRes
    }

    if (ADMIN_SIGNER_TYPE === 'private_key') {
      const pk = process.env.ADMIN_PRIVATE_KEY || ''
      if (!pk) throw new Error('ADMIN_PRIVATE_KEY must be set for private_key signer')

      // Implementation would derive keyPair from ADMIN_PRIVATE_KEY and mirror mnemonic flow above.
      throw new Error('private_key signer path is not implemented in this template. Implement key parsing and wallet setup.')
    }

    if (ADMIN_SIGNER_TYPE === 'kms') {
      // Placeholder for KMS: integrate with AWS KMS / Hashicorp Vault etc.
      throw new Error('KMS signer path not implemented. Implement a KMS signer that returns signatures for wallet.transfer')
    }

    throw new Error(`Unsupported ADMIN_SIGNER_TYPE: ${ADMIN_SIGNER_TYPE}`)
  } catch (err) {
    console.error('[sendAIBA] error', err)
    throw err
  }
}

module.exports = sendAIBA
