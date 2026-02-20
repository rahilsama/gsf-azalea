#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────────────────────────
# GSF Azalea — EC2 First-Time Setup Script
#
# Run this on a fresh Ubuntu EC2 instance:
#   chmod +x ec2-setup.sh
#   ./ec2-setup.sh
#
# After running, configure your .env.production and start the app:
#   cp .env.production.example .env.production
#   nano .env.production          # edit secrets
#   docker compose -f docker-compose.prod.yml pull
#   docker compose -f docker-compose.prod.yml up -d
# ──────────────────────────────────────────────────────────────────────────────

set -euo pipefail

echo "═══════════════════════════════════════════════════════"
echo "  GSF Azalea — EC2 Setup Script"
echo "═══════════════════════════════════════════════════════"

# ── 1. System updates ────────────────────────────────────────────────────────
echo ""
echo "📦  Updating system packages..."
sudo yum update -y

# ── 2. Install Docker ────────────────────────────────────────────────────────
echo ""
echo "🐳  Installing Docker..."
if ! command -v docker &> /dev/null; then
    sudo yum install -y docker
    sudo systemctl enable docker
    sudo systemctl start docker
    sudo usermod -aG docker "$USER"
    echo "   ✅ Docker installed. You may need to log out and back in for group changes."
else
    echo "   ✅ Docker already installed."
fi

# ── 3. Install Docker Compose plugin ─────────────────────────────────────────
echo ""
echo "🔧  Ensuring Docker Compose plugin is available..."
if ! docker compose version &> /dev/null; then
    COMPOSE_VERSION=$(curl -s https://api.github.com/repos/docker/compose/releases/latest | grep tag_name | cut -d '"' -f 4)
    sudo curl -L "https://github.com/docker/compose/releases/download/${COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    sudo ln -sf /usr/local/bin/docker-compose /usr/bin/docker-compose
    echo "   ✅ Docker Compose ${COMPOSE_VERSION} installed."
else
    echo "   ✅ Docker Compose already available."
fi

# ── 4. Authenticate to GitHub Container Registry ─────────────────────────────
echo ""
echo "🔑  To pull private images from ghcr.io, you need a GitHub PAT."
echo "   Create one at: https://github.com/settings/tokens"
echo "   Required scope: read:packages"
echo ""
read -rp "   Enter your GitHub username: " GH_USER
read -rsp "   Enter your GitHub PAT (classic token with read:packages): " GH_TOKEN
echo ""

echo "$GH_TOKEN" | docker login ghcr.io -u "$GH_USER" --password-stdin
echo "   ✅ Logged into ghcr.io."

# ── 5. Create app directory ──────────────────────────────────────────────────
APP_DIR="$HOME/gsf-azalea"
echo ""
echo "📁  Setting up app directory at $APP_DIR..."
mkdir -p "$APP_DIR"

# ── 6. Download production files ─────────────────────────────────────────────
echo ""
echo "📥  Downloading production files from GitHub..."

REPO="rahilsama/gsf-azalea"
BRANCH="main"
BASE_URL="https://raw.githubusercontent.com/$REPO/$BRANCH"

curl -fsSL "$BASE_URL/docker-compose.prod.yml" -o "$APP_DIR/docker-compose.prod.yml"
curl -fsSL "$BASE_URL/.env.production.example" -o "$APP_DIR/.env.production.example"

echo "   ✅ Files downloaded."

# ── 7. Create .env.production from example ────────────────────────────────────
if [ ! -f "$APP_DIR/.env.production" ]; then
    cp "$APP_DIR/.env.production.example" "$APP_DIR/.env.production"
    echo ""
    echo "⚠️   Created .env.production from example."
    echo "   IMPORTANT: Edit it with real secrets before starting!"
    echo "   nano $APP_DIR/.env.production"
fi

# ── 8. Summary ────────────────────────────────────────────────────────────────
echo ""
echo "═══════════════════════════════════════════════════════"
echo "  ✅  Setup Complete!"
echo "═══════════════════════════════════════════════════════"
echo ""
echo "  Next steps:"
echo ""
echo "  1. Edit your production env:"
echo "     nano $APP_DIR/.env.production"
echo ""
echo "  2. Pull and start the app:"
echo "     cd $APP_DIR"
echo "     docker compose -f docker-compose.prod.yml pull"
echo "     docker compose -f docker-compose.prod.yml up -d"
echo ""
echo "  3. View logs:"
echo "     docker compose -f docker-compose.prod.yml logs -f"
echo ""
echo "  4. Stop the app:"
echo "     docker compose -f docker-compose.prod.yml down"
echo ""
echo "  Your app will be available at:"
echo "     Frontend → http://<your-ec2-ip>:3000"
echo "     Backend  → http://<your-ec2-ip>:4000/api"
echo ""
