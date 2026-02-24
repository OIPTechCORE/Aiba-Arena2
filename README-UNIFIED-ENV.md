# Aiba Arena Unified Environment Configuration

This document explains the unified environment variable system for Aiba Arena, which consolidates all configuration for the backend API, miniapp frontend, and admin panel into a single source of truth.

## Overview

The unified environment system provides:
- **Single source of truth** for all environment variables
- **Service-specific prefixes** to avoid conflicts
- **Automatic generation** of service-specific .env files
- **Production-ready** configuration examples

## File Structure

```
Aiba-Arena2/
├── .env.unified.example          # Unified template (copy to .env)
├── .env                          # Your actual unified configuration
├── scripts/
│   └── unified-env-setup.js      # Environment file generator
├── backend/.env                  # Generated backend config
├── miniapp/.env.local            # Generated miniapp config
└── admin-panel/.env.local        # Generated admin panel config
```

## Quick Setup

### 1. Create Your Unified Environment File
```bash
cp .env.unified.example .env
```

### 2. Fill in Your Values
Edit `.env` with your actual configuration values for all services.

### 3. Generate Service-Specific Files
```bash
# Generate all service files
node scripts/unified-env-setup.js

# Or generate specific service only
node scripts/unified-env-setup.js backend
node scripts/unified-env-setup.js miniapp
node scripts/unified-env-setup.js admin-panel
```

### 4. Deploy Services
Each service now has its own `.env` file with only the variables it needs.

## Variable Prefixes

### SHARED_ Variables
Shared across all services:
- `SHARED_APP_ENV` - Environment (development/production)
- `SHARED_NODE_ENV` - Node.js environment
- `SHARED_BACKEND_URL` - Backend API URL

### BACKEND_ Variables
Backend API specific:
- `BACKEND_PORT` - Server port (default: 5000)
- `BACKEND_MONGO_URI` - MongoDB connection string
- `BACKEND_ADMIN_JWT_SECRET` - JWT secret for authentication
- `BACKEND_TELEGRAM_BOT_TOKEN` - Telegram bot token
- `BACKEND_TON_*` - TON blockchain configuration
- `BACKEND_CORS_ORIGIN` - Allowed CORS origins

### MINIAPP_ Variables
Miniapp frontend specific:
- `MINIAPP_NEXT_PUBLIC_BACKEND_URL` - Backend URL for frontend
- `MINIAPP_NEXT_PUBLIC_APP_URL` - Miniapp domain
- `MINIAPP_NEXT_PUBLIC_TONCONNECT_MANIFEST_URL` - TonConnect manifest

### ADMIN_ Variables
Admin panel specific:
- `ADMIN_NEXT_PUBLIC_BACKEND_URL` - Backend URL for admin panel
- `ADMIN_NEXT_PUBLIC_APP_URL` - Admin panel domain

## Vercel Deployment

### Miniapp on Vercel
1. Set environment variables in Vercel dashboard using unified names
2. Use the unified setup script to generate `.env.local`
3. Deploy - Vercel will automatically use the environment variables

### Admin Panel on Vercel
Same process as miniapp, but with admin-specific variables.

### Backend on Vercel/Other Platform
1. Set backend-specific environment variables
2. Generate backend `.env` file
3. Deploy with the generated configuration

## Variable Transformations

The setup script automatically transforms variables for each service:

### Backend
- Removes `SHARED_` prefix: `SHARED_BACKEND_URL` → `BACKEND_URL`
- Keeps `BACKEND_` prefix unchanged

### Miniapp
- `SHARED_` → `MINIAPP_NEXT_PUBLIC_`: `SHARED_BACKEND_URL` → `MINIAPP_NEXT_PUBLIC_BACKEND_URL`
- Keeps `MINIAPP_` prefix unchanged

### Admin Panel
- `SHARED_` → `ADMIN_NEXT_PUBLIC_`: `SHARED_BACKEND_URL` → `ADMIN_NEXT_PUBLIC_BACKEND_URL`
- Keeps `ADMIN_` prefix unchanged

## Security Considerations

### Production Security
- Use strong secrets (minimum 32 characters for JWT and battle seeds)
- Never commit `.env` files to version control
- Use environment-specific values for production
- Enable HTTPS in production

### Variable Exposure
- **Backend variables**: Only accessible to server
- **Frontend variables**: Exposed to browser (use `NEXT_PUBLIC_` prefix)
- **Admin variables**: Exposed to admin panel users

## Examples

### Development Setup
```bash
# Create unified .env
cp .env.unified.example .env

# Edit with local values
SHARED_APP_ENV=development
SHARED_BACKEND_URL=http://localhost:5000
BACKEND_MONGO_URI=mongodb://localhost:27017/aiba-arena
MINIAPP_NEXT_PUBLIC_BACKEND_URL=http://localhost:5000
ADMIN_NEXT_PUBLIC_BACKEND_URL=http://localhost:5000

# Generate service files
node scripts/unified-env-setup.js
```

### Production Setup
```bash
# Production values in .env
SHARED_APP_ENV=production
SHARED_BACKEND_URL=https://api.your-domain.com
BACKEND_MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/aiba-arena
BACKEND_ADMIN_JWT_SECRET=super-secure-production-secret-256-bit
MINIAPP_NEXT_PUBLIC_BACKEND_URL=https://api.your-domain.com
ADMIN_NEXT_PUBLIC_BACKEND_URL=https://api.your-domain.com

# Generate and deploy
node scripts/unified-env-setup.js
```

## Troubleshooting

### Common Issues

1. **Missing variables**: Check that all required variables are in your unified `.env`
2. **Prefix conflicts**: Ensure variables use correct prefixes for their services
3. **File permissions**: Make sure the script can write to service directories
4. **Environment mismatch**: Verify `SHARED_APP_ENV` matches your deployment environment

### Debug Mode
Run the script with verbose output:
```bash
DEBUG=1 node scripts/unified-env-setup.js
```

## Migration from Old System

To migrate from separate `.env` files:

1. **Backup existing files**:
   ```bash
   cp backend/.env backend/.env.backup
   cp miniapp/.env.local miniapp/.env.local.backup
   cp admin-panel/.env.local admin-panel/.env.local.backup
   ```

2. **Create unified file**:
   ```bash
   cp .env.unified.example .env
   # Copy values from backup files to unified .env with appropriate prefixes
   ```

3. **Generate new files**:
   ```bash
   node scripts/unified-env-setup.js
   ```

4. **Test and deploy**: Verify all services work with new configuration

## Support

For issues with the unified environment system:
1. Check this README first
2. Review the script comments in `scripts/unified-env-setup.js`
3. Ensure your `.env` file follows the prefix conventions
4. Verify all required variables are present
