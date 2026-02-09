# Contract Deployment Order (TON / Tact)

This order matches current scripts and dependencies. Use testnet first.

## 1) Build

```
npm run build:contracts
```

## 2) Deploy order

1. **AibaJetton** (token)
2. **AibaJettonSupply** (supply/minting)
3. **AibaToken** (legacy token, if needed)
4. **ArenaVault**
5. **ArenaRewardVault** (requires AibaToken address)
6. **BrokerNFT**
7. **BrokerMarketplaceEscrow**
8. **AiAssetRegistry**
9. **AiAssetMarketplaceEscrow**
10. **AiAssetMarketplaceEscrowJetton**
11. **MentorStakingVault**

Scripts live in `scripts/` and `tact.config.json` defines projects.

## 3) Backend env required for claims

Set these in backend:
- `ARENA_VAULT_ADDRESS`
- `AIBA_JETTON_MASTER`
- `ORACLE_PRIVATE_KEY_HEX` or `ORACLE_SIGNER_URL`
- `TON_PROVIDER_URL`
- `TON_API_KEY`

## 4) Validate

- `GET /api/vault/inventory`
- Run a small claim end‑to‑end with a test wallet
