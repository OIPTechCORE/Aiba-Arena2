# Backend + docs sync commit (files that were previously left uncommitted).
# Run from repo root: .\scripts\commit-backend-docs-sync.ps1
$ErrorActionPreference = "Stop"
$root = if ($PSScriptRoot) { Join-Path $PSScriptRoot ".." } else { ".." }
Set-Location $root

git add `
  backend/engine/raceEngine.js `
  backend/jobs/seedRacingTracks.js `
  backend/models/BikeListing.js backend/models/BikeRace.js backend/models/BikeRaceEntry.js backend/models/BikeTrack.js `
  backend/models/CarListing.js backend/models/CarRace.js backend/models/CarRaceEntry.js backend/models/CarTrack.js `
  backend/models/Gift.js backend/models/NftStake.js backend/models/NftUniverse.js backend/models/RacingCar.js backend/models/RacingMotorcycle.js backend/models/UsedTonTxHash.js `
  backend/routes/adminMultiverse.js backend/routes/bikeRacing.js backend/routes/carRacing.js backend/routes/gifts.js backend/routes/multiverse.js backend/routes/starsStore.js `
  backend/util/tonVerify.js `
  docs/AUTONOMOUS-RACING-MASTER-PLAN.md docs/LEADERBOARD-AND-GROUPS-CHECK.md docs/MARKETPLACE-AND-PAYMENTS-MASTER-PLAN.md docs/NFT-MULTIVERSE-MASTER-PLAN.md docs/TELEGRAM-MINI-APP-UI-UX-AUDIT.md docs/VERCEL-DEPLOYMENT-CHECKLIST.md

$status = git status --short
if ($status) {
    git commit -m "Backend and docs sync: engine, jobs, models, routes, util, plan docs (AUTONOMOUS-RACING, LEADERBOARD, MARKETPLACE, NFT-MULTIVERSE, TELEGRAM-UI-UX, VERCEL-CHECKLIST)"
    git push
    Write-Host "Committed and pushed backend/docs sync."
} else {
    Write-Host "No changes to commit (these files may already be committed)."
}
