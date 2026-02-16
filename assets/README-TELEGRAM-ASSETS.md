# Telegram assets (from AI Battle Arena logo)

- **telegram-profile-512.png** — **Profile photo** for your Telegram bot or channel.  
  Upload in Telegram: Bot Settings → Edit Bot → Profile Photo.  
  Telegram will show it as a circle; 512×512 keeps the logo sharp.

- **telegram-splash-1080x1920.png** — **Splash screen** for the Mini App (loading screen).  
  Use in your Web App (e.g. `window.Telegram.WebApp.showAlert` or your splash UI) or in BotFather when configuring the Mini App.

To regenerate from a new logo:
```bash
node scripts/telegram-assets.js path/to/your-logo.png
```
Outputs are written to `assets/`.
