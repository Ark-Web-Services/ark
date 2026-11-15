#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════
# SETUP-NICHE.SH — One-Command Infrastructure Provisioning
# ═══════════════════════════════════════════════════════════════
# Reads niche.config.ts and provisions:
#   1. Cloudflare Pages project + D1 database
#   2. Google Cloud project + Search Console API + service account + JSON key
#   3. Drone CI secrets (all 7 required values)
#   4. Local .env + wrangler.toml population
#   5. D1 schema migration
#
# Usage:
#   ./scripts/setup-niche.sh            # Full setup
#   ./scripts/setup-niche.sh --dry-run  # Preview only (no API calls)
#
# Prerequisites:
#   brew install --cask google-cloud-sdk   # gcloud CLI
#   brew install drone/drone/drone         # drone CLI
#   npm install -g wrangler               # or use npx
#
# Shared credentials are stored in ~/.godfather/credentials
# so you don't have to re-enter them for every niche.
# ═══════════════════════════════════════════════════════════════

set -euo pipefail

# ── Colors & Formatting ──────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
DIM='\033[2m'
NC='\033[0m' # No Color

CHECKMARK="${GREEN}✅${NC}"
CROSS="${RED}❌${NC}"
WARN="${YELLOW}⚠️${NC}"
ARROW="${CYAN}→${NC}"

DRY_RUN=false
[[ "${1:-}" == "--dry-run" ]] && DRY_RUN=true

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
CREDS_DIR="$HOME/.godfather"
CREDS_FILE="$CREDS_DIR/credentials"

# ── Helper Functions ─────────────────────────────────────────

banner() {
  echo ""
  echo -e "${BOLD}═══════════════════════════════════════════════════════${NC}"
  echo -e "${BOLD}  $1${NC}"
  echo -e "${BOLD}═══════════════════════════════════════════════════════${NC}"
  echo ""
}

step() {
  echo -e "${ARROW} ${BOLD}$1${NC}"
}

success() {
  echo -e "  ${CHECKMARK} $1"
}

warn() {
  echo -e "  ${WARN} $1"
}

fail() {
  echo -e "  ${CROSS} $1"
  exit 1
}

info() {
  echo -e "  ${DIM}$1${NC}"
}

run_or_dry() {
  if $DRY_RUN; then
    echo -e "  ${DIM}[DRY-RUN] Would run: $*${NC}"
  else
    eval "$@"
  fi
}

prompt_value() {
  local varname="$1"
  local prompt="$2"
  local current="${!varname:-}"

  if [[ -n "$current" ]]; then
    echo -e "  ${DIM}$prompt: ${GREEN}already set${NC}"
    return
  fi

  echo -ne "  ${YELLOW}$prompt: ${NC}"
  read -r value
  if [[ -z "$value" ]]; then
    warn "Skipped (can be added later)"
  else
    eval "$varname='$value'"
  fi
}

prompt_secret() {
  local varname="$1"
  local prompt="$2"
  local current="${!varname:-}"

  if [[ -n "$current" ]]; then
    echo -e "  ${DIM}$prompt: ${GREEN}already set${NC}"
    return
  fi

  echo -ne "  ${YELLOW}$prompt: ${NC}"
  read -rs value
  echo ""
  if [[ -z "$value" ]]; then
    warn "Skipped (can be added later)"
  else
    eval "$varname='$value'"
  fi
}

# ══════════════════════════════════════════════════════════════
# PHASE 0: Parse niche.config.ts & Check Prerequisites
# ══════════════════════════════════════════════════════════════

banner "🎩 Godfather SEO Engine — Niche Setup"

if $DRY_RUN; then
  echo -e "${YELLOW}  ── DRY RUN MODE — No changes will be made ──${NC}"
  echo ""
fi

step "Reading niche.config.ts..."

CONFIG_FILE="$PROJECT_ROOT/niche.config.ts"
if [[ ! -f "$CONFIG_FILE" ]]; then
  fail "niche.config.ts not found at $CONFIG_FILE"
fi

# Extract values from niche.config.ts
# We match lines with quoted values (') to skip TypeScript interface definitions (: string;)
NICHE_ID=$(grep "id:" "$CONFIG_FILE" | grep "'" | head -1 | sed "s/.*'\(.*\)'.*/\1/" | tr -d ',' | xargs)
SITE_NAME=$(grep "siteName:" "$CONFIG_FILE" | grep "'" | head -1 | sed "s/.*'\(.*\)'.*/\1/" | tr -d ',')
SITE_URL=$(grep "^  url:" "$CONFIG_FILE" | grep "'" | head -1 | sed "s/.*'\(.*\)'.*/\1/" | tr -d ',')
CF_PROJECT=$(grep "cloudflareProjectName:" "$CONFIG_FILE" | grep "'" | head -1 | sed "s/.*'\(.*\)'.*/\1/" | tr -d ',')
D1_DB_NAME=$(grep "d1DatabaseName:" "$CONFIG_FILE" | grep "'" | head -1 | sed "s/.*'\(.*\)'.*/\1/" | tr -d ',')

# Derive domain from URL (macOS sed doesn't support \? so chain two seds)
DOMAIN=$(echo "$SITE_URL" | sed 's|https://||' | sed 's|http://||' | sed 's|www\.||' | sed 's|/.*||')

# Derive Gitea repo name from domain
REPO_NAME="$DOMAIN"

echo -e "  Niche ID:        ${CYAN}$NICHE_ID${NC}"
echo -e "  Site Name:       ${CYAN}$SITE_NAME${NC}"
echo -e "  Site URL:        ${CYAN}$SITE_URL${NC}"
echo -e "  Domain:          ${CYAN}$DOMAIN${NC}"
echo -e "  CF Project:      ${CYAN}$CF_PROJECT${NC}"
echo -e "  D1 Database:     ${CYAN}$D1_DB_NAME${NC}"
echo -e "  Gitea Repo:      ${CYAN}$REPO_NAME${NC}"
echo ""

# Validate no template placeholders remain
if [[ "$NICHE_ID" == "TEMPLATE_NICHE_ID" ]] || [[ "$CF_PROJECT" == *"TEMPLATE"* ]]; then
  fail "niche.config.ts still contains TEMPLATE placeholders. Edit it first!"
fi

# ── Check Prerequisites ──────────────────────────────────────

step "Checking prerequisites..."

MISSING=()

if command -v gcloud &>/dev/null; then
  success "gcloud CLI found"
else
  MISSING+=("gcloud")
  warn "gcloud CLI not found — install: brew install --cask google-cloud-sdk"
fi

if command -v drone &>/dev/null; then
  success "drone CLI found"
else
  MISSING+=("drone")
  warn "drone CLI not found — install: brew install drone/drone/drone"
fi

if command -v npx &>/dev/null; then
  success "npx found (for wrangler)"
else
  MISSING+=("npx")
  warn "npx not found — install Node.js"
fi

if [[ ${#MISSING[@]} -gt 0 ]]; then
  echo ""
  echo -e "${YELLOW}  Missing tools: ${MISSING[*]}${NC}"
  echo -e "${YELLOW}  Install them and re-run this script.${NC}"
  echo ""
  echo -e "  ${BOLD}Quick install:${NC}"
  for tool in "${MISSING[@]}"; do
    case "$tool" in
      gcloud) echo "    brew install --cask google-cloud-sdk" ;;
      drone)  echo "    brew install drone/drone/drone" ;;
      npx)    echo "    brew install node" ;;
    esac
  done
  exit 1
fi

echo ""

# ── Load / Create Shared Credentials ────────────────────────

step "Loading shared credentials from ~/.godfather/credentials..."

if [[ ! -d "$CREDS_DIR" ]]; then
  mkdir -p "$CREDS_DIR"
  chmod 700 "$CREDS_DIR"
fi

# Source existing credentials if they exist
if [[ -f "$CREDS_FILE" ]]; then
  source "$CREDS_FILE"
  success "Loaded existing credentials"
else
  info "No existing credentials — will prompt for values"
fi

echo ""
step "Verifying required credentials..."

prompt_value    CLOUDFLARE_API_TOKEN   "Cloudflare API Token"
prompt_value    CLOUDFLARE_ACCOUNT_ID  "Cloudflare Account ID"
prompt_value    DRONE_SERVER           "Drone Server URL (e.g., http://drone.premiumwebsitecollective.com)"
prompt_secret   DRONE_TOKEN            "Drone Personal Token"
prompt_value    GITEA_ORG              "Gitea Organization (e.g., homelab-admin)"
prompt_value    GEMINI_API_KEY         "Gemini API Key"
prompt_secret   CLAUDE_API_KEY         "Claude API Key"

# Save credentials for future niches
if ! $DRY_RUN; then
  cat > "$CREDS_FILE" << CREDS_EOF
# ═══════════════════════════════════════════════════════════════
# Godfather SEO Engine — Shared Credentials
# Generated by setup-niche.sh on $(date -Iseconds)
# ═══════════════════════════════════════════════════════════════

# Cloudflare (shared across all niches)
CLOUDFLARE_API_TOKEN="${CLOUDFLARE_API_TOKEN:-}"
CLOUDFLARE_ACCOUNT_ID="${CLOUDFLARE_ACCOUNT_ID:-}"

# Drone CI
DRONE_SERVER="${DRONE_SERVER:-}"
DRONE_TOKEN="${DRONE_TOKEN:-}"
GITEA_ORG="${GITEA_ORG:-}"

# AI API Keys (shared across all niches)
GEMINI_API_KEY="${GEMINI_API_KEY:-}"
CLAUDE_API_KEY="${CLAUDE_API_KEY:-}"
CREDS_EOF
  chmod 600 "$CREDS_FILE"
  success "Credentials saved to ~/.godfather/credentials"
fi

echo ""

# ══════════════════════════════════════════════════════════════
# PHASE 1: Cloudflare Setup
# ══════════════════════════════════════════════════════════════

banner "☁️  Phase 1: Cloudflare Setup"

export CLOUDFLARE_API_TOKEN="${CLOUDFLARE_API_TOKEN:-}"
export CLOUDFLARE_ACCOUNT_ID="${CLOUDFLARE_ACCOUNT_ID:-}"

# ── Create Pages Project ─────────────────────────────────────
step "Creating Cloudflare Pages project: $CF_PROJECT"
if $DRY_RUN; then
  run_or_dry "npx wrangler pages project create '$CF_PROJECT' --production-branch main"
else
  PROJECT_LIST=$(npx wrangler pages project list --json)
  if echo "$PROJECT_LIST" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{const x=JSON.parse(s);process.exit(Array.isArray(x)&&x.some(p=>p.name===process.argv[1])?0:1)}catch{process.exit(2)}})' "$CF_PROJECT"; then
    success "Pages project verified: $CF_PROJECT"
  else
    npx wrangler pages project create "$CF_PROJECT" --production-branch main
    PROJECT_LIST=$(npx wrangler pages project list --json)
    echo "$PROJECT_LIST" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{const x=JSON.parse(s);process.exit(Array.isArray(x)&&x.some(p=>p.name===process.argv[1])?0:1)}catch{process.exit(2)}})' "$CF_PROJECT" || fail "Pages project creation could not be verified"
    success "Pages project created and verified: $CF_PROJECT"
  fi
fi

# ── Create D1 Database ───────────────────────────────────────
step "Creating D1 database: $D1_DB_NAME"

D1_ID=""
if ! $DRY_RUN; then
  # Try to get existing database ID first
  D1_LIST=$(npx wrangler d1 list 2>&1)
  EXISTING_D1=$(echo "$D1_LIST" | grep "$D1_DB_NAME" | head -1 || true)
  if [[ -n "$EXISTING_D1" ]]; then
    # Extract UUID from the list output
    D1_ID=$(echo "$EXISTING_D1" | grep -oE '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}' | head -1)
    if [[ -z "$D1_ID" ]]; then fail "Found $D1_DB_NAME in Wrangler output but could not verify its database ID"; fi
    success "D1 database already exists: $D1_ID"
  else
    D1_OUTPUT=$(npx wrangler d1 create "$D1_DB_NAME" 2>&1)
    D1_ID=$(echo "$D1_OUTPUT" | grep -oE '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}' | head -1)
    if [[ -z "$D1_ID" ]]; then
      warn "Could not extract D1 database ID. Full output:"
      echo "$D1_OUTPUT"
      fail "Could not determine the D1 database ID from Wrangler output; no database success can be confirmed."
    fi
    D1_LIST=$(npx wrangler d1 list 2>&1)
    VERIFIED_D1=$(echo "$D1_LIST" | grep "$D1_DB_NAME" | head -1 || true)
    if [[ -z "$VERIFIED_D1" ]] || ! echo "$VERIFIED_D1" | grep -Fq "$D1_ID"; then
      fail "D1 database creation could not be verified in Wrangler's database list"
    fi
    success "D1 database created and verified: $D1_ID"
  fi
else
  echo -e "  ${DIM}[DRY-RUN] Would create D1 database and capture ID${NC}"
  D1_ID="dry-run-placeholder-id"
fi

# Wrangler 4.80.0 has no Pages custom-domain command. Do not claim these
# domains are configured; add them under Pages > project > Custom domains.
step "Custom domains require Cloudflare dashboard configuration"
warn "Add $DOMAIN and www.$DOMAIN to $CF_PROJECT in Cloudflare Pages."

# ── Run D1 Schema Migration ─────────────────────────────────
step "Running D1 schema migration..."
if [[ -f "$PROJECT_ROOT/db/schema.sql" ]]; then
  run_or_dry "npx wrangler d1 execute '$D1_DB_NAME' --remote --file='$PROJECT_ROOT/db/schema.sql' 2>&1"
  success "Schema migrated"
else
  warn "db/schema.sql not found — skipping migration"
fi

if [[ -f "$PROJECT_ROOT/db/seed.sql" ]]; then
  step "Running D1 seed data..."
  run_or_dry "npx wrangler d1 execute '$D1_DB_NAME' --remote --file='$PROJECT_ROOT/db/seed.sql' 2>&1"
  success "Seed data loaded"
fi

echo ""

# ══════════════════════════════════════════════════════════════
# PHASE 2: Google Cloud Setup
# ══════════════════════════════════════════════════════════════

banner "🔐 Phase 2: Google Cloud Setup"

GCP_PROJECT="godfather-$(echo "$NICHE_ID" | tr '_' '-' | tr '[:upper:]' '[:lower:]' | head -c 20)"
SA_NAME="gsc-bot"
SA_EMAIL="$SA_NAME@$GCP_PROJECT.iam.gserviceaccount.com"
KEY_FILE="$PROJECT_ROOT/data/gsc-service-account.json"

step "Creating GCP project: $GCP_PROJECT"
if $DRY_RUN; then
  run_or_dry "gcloud projects create '$GCP_PROJECT' --name='Godfather: $SITE_NAME'"
elif gcloud projects describe "$GCP_PROJECT" --format='value(projectId)' 2>/dev/null | grep -Fxq "$GCP_PROJECT"; then
  success "GCP project verified: $GCP_PROJECT"
else
  gcloud projects create "$GCP_PROJECT" --name="Godfather: $SITE_NAME"
  gcloud projects describe "$GCP_PROJECT" --format='value(projectId)' | grep -Fxq "$GCP_PROJECT" || fail "GCP project creation could not be verified"
  success "GCP project created and verified: $GCP_PROJECT"
fi

# Check if billing needs to be linked (APIs won't enable without it)
step "Checking billing account..."
if ! $DRY_RUN; then
  BILLING_ACCOUNT=$(gcloud billing accounts list --format='value(name)' --filter='open=true' 2>/dev/null | head -1 || true)
  if [[ -n "$BILLING_ACCOUNT" ]]; then
    gcloud billing projects link "$GCP_PROJECT" --billing-account="$BILLING_ACCOUNT"
    success "Billing linked: $BILLING_ACCOUNT"
  else
    warn "No billing account found. APIs may not enable without billing."
    warn "Link one at: https://console.cloud.google.com/billing"
  fi
else
  echo -e "  ${DIM}[DRY-RUN] Would check/link billing account${NC}"
fi

step "Enabling Search Console API..."
run_or_dry "gcloud services enable searchconsole.googleapis.com --project='$GCP_PROJECT' 2>&1"
success "Search Console API enabled"

step "Creating service account: $SA_NAME"
if $DRY_RUN; then
  run_or_dry "gcloud iam service-accounts create '$SA_NAME' --project='$GCP_PROJECT' --display-name='Godfather GSC Bot for $SITE_NAME'"
elif gcloud iam service-accounts describe "$SA_EMAIL" --project="$GCP_PROJECT" --format='value(email)' 2>/dev/null | grep -Fxq "$SA_EMAIL"; then
  success "Service account verified: $SA_EMAIL"
else
  gcloud iam service-accounts create "$SA_NAME" --project="$GCP_PROJECT" --display-name="Godfather GSC Bot for $SITE_NAME"
  gcloud iam service-accounts describe "$SA_EMAIL" --project="$GCP_PROJECT" --format='value(email)' | grep -Fxq "$SA_EMAIL" || fail "Service account creation could not be verified"
  success "Service account created and verified: $SA_EMAIL"
fi

step "Generating JSON key..."
if ! $DRY_RUN; then
  mkdir -p "$(dirname "$KEY_FILE")"
  if [[ -f "$KEY_FILE" ]]; then
    warn "Key file already exists at $KEY_FILE — skipping (delete to regenerate)"
  else
    gcloud iam service-accounts keys create "$KEY_FILE" \
      --iam-account="$SA_EMAIL" \
      --project="$GCP_PROJECT" 2>&1
    success "JSON key saved: $KEY_FILE"
  fi
else
  echo -e "  ${DIM}[DRY-RUN] Would generate key at: $KEY_FILE${NC}"
fi

echo ""

# ══════════════════════════════════════════════════════════════
# PHASE 3: Drone CI Secrets
# ══════════════════════════════════════════════════════════════

banner "🔒 Phase 3: Drone CI Secrets"

DRONE_REPO="${GITEA_ORG:-homelab-admin}/$REPO_NAME"

BUSINESS_ENABLED=false
BUSINESS_CONTENT_ENABLED=true
BUSINESS_INQUIRIES_ENABLED=false
if [[ -f "$PROJECT_ROOT/business.config.ts" ]]; then
  BUSINESS_ENABLED=$(sed -n 's/^  enabled: \(true\|false\),$/\1/p' "$PROJECT_ROOT/business.config.ts" | head -1)
  BUSINESS_CONTENT_ENABLED=$(sed -n 's/^  contentEnabled: \(true\|false\),$/\1/p' "$PROJECT_ROOT/business.config.ts" | head -1)
  BUSINESS_INQUIRIES_ENABLED=$(awk '/^const businessConfig:/ { config=1 } config && /^  inquiries:/ { inside=1; next } inside && /^  }/ { inside=0 } inside && /^    enabled:/ { sub(/^    enabled: /, ""); sub(/,$/, ""); print; exit }' "$PROJECT_ROOT/business.config.ts")
  BUSINESS_ENABLED="${BUSINESS_ENABLED:-false}"
  BUSINESS_CONTENT_ENABLED="${BUSINESS_CONTENT_ENABLED:-false}"
  BUSINESS_INQUIRIES_ENABLED="${BUSINESS_INQUIRIES_ENABLED:-false}"
fi

export DRONE_SERVER="${DRONE_SERVER:-}"
export DRONE_TOKEN="${DRONE_TOKEN:-}"

step "Adding secrets to repo: $DRONE_REPO"

add_drone_secret() {
  local name="$1"
  local value="$2"
  local source="$3"

  if [[ -z "$value" ]]; then
    warn "Skipping $name — no value provided ($source)"
    return
  fi

  if $DRY_RUN; then
    echo -e "  ${DIM}[DRY-RUN] Would add secret: $name ($source)${NC}"
  else
    # Update if exists, add if not
    if ! drone secret update --repository "$DRONE_REPO" --name "$name" --value "$value" 2>/dev/null; then
      drone secret add --repository "$DRONE_REPO" --name "$name" --value "$value"
    fi
    success "$name ← $source"
  fi
}

add_drone_secret "CF_TOKEN"        "${CLOUDFLARE_API_TOKEN:-}"  "Cloudflare API Token"
add_drone_secret "CF_ACCOUNT_ID"   "${CLOUDFLARE_ACCOUNT_ID:-}" "Cloudflare Account ID"
add_drone_secret "D1_DATABASE_ID"  "${D1_ID:-}"                 "D1 Database ID"
add_drone_secret "GEMINI_KEY"      "${GEMINI_API_KEY:-}"        "Gemini API Key"
add_drone_secret "CLAUDE_KEY"      "${CLAUDE_API_KEY:-}"        "Claude API Key"

# GSC key from file
if [[ -f "$KEY_FILE" ]]; then
  GSC_KEY_VALUE=$(cat "$KEY_FILE")
  add_drone_secret "GSC_KEY" "$GSC_KEY_VALUE" "Google Service Account Key"
else
  warn "Skipping GSC_KEY — key file not found at $KEY_FILE"
fi

# The deploy pipeline also supports these generic secret aliases:
# CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID, GOOGLE_SERVICE_ACCOUNT_KEY
# Add those aliases too for compatibility with the deploy pipeline
step "Adding deploy-pipeline secret aliases..."
add_drone_secret "CLOUDFLARE_API_TOKEN"        "${CLOUDFLARE_API_TOKEN:-}"  "Alias for deploy pipeline"
add_drone_secret "CLOUDFLARE_ACCOUNT_ID"       "${CLOUDFLARE_ACCOUNT_ID:-}" "Alias for deploy pipeline"
if [[ -f "$KEY_FILE" ]]; then
  add_drone_secret "GOOGLE_SERVICE_ACCOUNT_KEY" "$GSC_KEY_VALUE" "Alias for deploy pipeline"
fi

if [[ "$BUSINESS_ENABLED" == "true" && "$BUSINESS_INQUIRIES_ENABLED" == "true" ]]; then
  if [[ -n "${ADMIN_API_TOKEN:-}" ]]; then
    add_drone_secret "ADMIN_API_TOKEN" "$ADMIN_API_TOKEN" "Business lead follow-up pipeline"
    info "Set the same ADMIN_API_TOKEN as a Cloudflare Pages runtime secret; this script never changes site runtime secrets."
  else
    warn "Lead follow-up cron not provisioned: export an existing ADMIN_API_TOKEN first; set it manually as a Cloudflare Pages runtime secret."
  fi
fi

echo ""

# ══════════════════════════════════════════════════════════════
# PHASE 4: Local File Updates
# ══════════════════════════════════════════════════════════════

banner "📝 Phase 4: Local File Updates"

# ── Generate .env ────────────────────────────────────────────
step "Generating .env file..."

ENV_FILE="$PROJECT_ROOT/.env"
if [[ -f "$ENV_FILE" ]]; then
  warn ".env already exists — creating .env.new instead"
  ENV_FILE="$PROJECT_ROOT/.env.new"
fi

if ! $DRY_RUN; then
  cat > "$ENV_FILE" << ENV_EOF
# ═══════════════════════════════════════════════════════════════
# ENVIRONMENT VARIABLES — Godfather SEO Engine
# Generated by setup-niche.sh on $(date -Iseconds)
# Niche: $SITE_NAME ($NICHE_ID)
# ═══════════════════════════════════════════════════════════════

# ── Cloudflare ────────────────────────────────────────────────
CLOUDFLARE_API_TOKEN=${CLOUDFLARE_API_TOKEN:-your_cf_api_token_here}
CLOUDFLARE_ACCOUNT_ID=${CLOUDFLARE_ACCOUNT_ID:-your_cf_account_id_here}
D1_DATABASE_ID=${D1_ID:-your_d1_database_id_here}

# ── AI APIs ───────────────────────────────────────────────────
GEMINI_API_KEY=${GEMINI_API_KEY:-your_gemini_api_key_here}
CLAUDE_API_KEY=${CLAUDE_API_KEY:-your_claude_api_key_here}

# ── Google Search Console ─────────────────────────────────────
# Full JSON content of your service account key
GOOGLE_SERVICE_ACCOUNT_KEY=$(cat "$KEY_FILE" 2>/dev/null | tr -d '\n' || echo '{"type":"service_account","project_id":"..."}')

# ── Drone CI ──────────────────────────────────────────────────
DRONE_SERVER=${DRONE_SERVER:-http://drone.premiumwebsitecollective.com}
DRONE_TOKEN=${DRONE_TOKEN:-your_drone_token_here}

# ── Site is configured in niche.config.ts ─────────────────────
# No SITE_URL or SITE_NAME needed here — everything is in niche.config.ts
ENV_EOF
  success "Generated: $ENV_FILE"
else
  echo -e "  ${DIM}[DRY-RUN] Would generate .env with all values populated${NC}"
fi

# ── Update wrangler.toml ─────────────────────────────────────
step "Updating wrangler.toml with D1 database ID..."

WRANGLER_FILE="$PROJECT_ROOT/wrangler.toml"
if [[ -f "$WRANGLER_FILE" ]] && [[ -n "$D1_ID" ]]; then
  if ! $DRY_RUN; then
    # Update database_id
    sed -i '' "s/database_id = \".*\"/database_id = \"$D1_ID\"/" "$WRANGLER_FILE"
    # Update database_name
    sed -i '' "s/database_name = \".*\"/database_name = \"$D1_DB_NAME\"/" "$WRANGLER_FILE"
    # Update project name
    sed -i '' "s/^name = \".*\"/name = \"$CF_PROJECT\"/" "$WRANGLER_FILE"
    success "wrangler.toml updated"
  else
    echo -e "  ${DIM}[DRY-RUN] Would update wrangler.toml with D1 ID: $D1_ID${NC}"
  fi
else
  warn "wrangler.toml not found or D1 ID not available"
fi

echo ""

# ══════════════════════════════════════════════════════════════
# PHASE 5: Setup Drone Cron Jobs
# ══════════════════════════════════════════════════════════════

banner "⏰ Phase 5: Drone Cron Jobs"

setup_cron() {
  local name="$1"
  local expr="$2"
  local branch="${3:-main}"

  if $DRY_RUN; then
    echo -e "  ${DIM}[DRY-RUN] Would create cron: $name ($expr on $branch)${NC}"
    return
  fi

  local response
  response=$(curl -s -w "\n%{http_code}" -X POST \
    "${DRONE_SERVER}/api/repos/${DRONE_REPO}/cron" \
    -H "Authorization: Bearer ${DRONE_TOKEN}" \
    -H "Content-Type: application/json" \
    -d "{\"name\":\"$name\",\"expr\":\"$expr\",\"branch\":\"$branch\"}" 2>&1)

  local http_code
  http_code=$(echo "$response" | tail -1)

  if [[ "$http_code" == "200" ]] || [[ "$http_code" == "201" ]]; then
    success "Cron: $name → $expr"
  elif [[ "$http_code" == "409" ]]; then
    warn "Cron $name returned HTTP 409; verify the existing schedule in the Drone UI."
  else
    fail "Cron $name creation failed (HTTP $http_code)"
  fi
}

step "Creating cron jobs for $DRONE_REPO..."
# ⚠️  Drone cron expressions here are SIX-field (sec min hour dom mon dow).
#     A five-field expression is accepted and then misparses SILENTLY —
#     the job registers but fires at the wrong time or never. Every
#     expression below is six-field on purpose.
#
#     These names must match the `trigger.cron` values in .drone.yml
#     exactly, or the pipeline they are meant to fire never runs.
setup_cron "nightly-gsc" "0 0 6 * * *" # Daily 06:00 UTC — GSC sync
setup_cron "weekly-audit" "0 0 7 * * 3" # Wed 07:00 UTC — SEO audit
if [[ "$BUSINESS_ENABLED" == "true" && "$BUSINESS_CONTENT_ENABLED" != "true" ]]; then
  warn "Business mode is enabled with content automation disabled; guide-content, observation, backlinks, and visual jobs were not scheduled."
  CRON_SUMMARY="nightly-gsc, weekly-audit (guide-content automation disabled)"
else
  setup_cron "daily-observe" "0 0 5 * * *" # Daily 05:00 UTC — observation
  # Override per site (WEEKLY_CONTENT_CRON) so sites sharing the Latitude CLI
  # host and one subscription do not all run at the same hour.
  setup_cron "weekly-content" "${WEEKLY_CONTENT_CRON:-0 0 6 * * 1}" # default Mon 06:00 UTC — analysis + article
  setup_cron "weekly-backlinks" "0 0 8 * * 5" # Fri 08:00 UTC — backlink queue
  setup_cron "visual-distribution" "0 0 9 * * 2" # Tue 09:00 UTC — visual distribution
  CRON_SUMMARY="nightly-gsc, daily-observe, weekly-content, weekly-audit, weekly-backlinks, visual-distribution"
fi
if [[ "$BUSINESS_ENABLED" == "true" && "$BUSINESS_INQUIRIES_ENABLED" == "true" ]]; then
  if [[ -n "${ADMIN_API_TOKEN:-}" ]]; then
    setup_cron "lead-follow-ups" "0 */5 * * * *" # Every five minutes, six fields
    CRON_SUMMARY="$CRON_SUMMARY, lead-follow-ups"
  else
    warn "Skipping lead-follow-ups cron because no ADMIN_API_TOKEN was provided."
  fi
fi

echo ""

# ══════════════════════════════════════════════════════════════
# SUMMARY
# ══════════════════════════════════════════════════════════════

banner "📊 Setup Summary — review outstanding manual steps"

echo -e "  ${BOLD}Cloudflare${NC}"
echo -e "    Pages Project:  ${GREEN}$CF_PROJECT${NC}"
echo -e "    D1 Database:    ${GREEN}$D1_DB_NAME${NC} (${D1_ID:-unknown})"
echo -e "    Domains:        Configure manually: $DOMAIN and www.$DOMAIN"
echo ""
echo -e "  ${BOLD}Google Cloud${NC}"
echo -e "    GCP Project:    ${GREEN}$GCP_PROJECT${NC}"
echo -e "    Service Account:${GREEN}$SA_EMAIL${NC}"
echo -e "    Key File:       ${GREEN}$KEY_FILE${NC}"
echo ""
echo -e "  ${BOLD}Drone CI${NC}"
echo -e "    Repository:     ${GREEN}$DRONE_REPO${NC}"
echo -e "    Secrets:        CF_TOKEN, CF_ACCOUNT_ID, D1_DATABASE_ID, GSC_KEY, GEMINI_KEY, CLAUDE_KEY"
echo -e "    Cron Jobs:      $CRON_SUMMARY"
echo ""
echo -e "  ${BOLD}Local Files${NC}"
echo -e "    Local setup:    Review phase output above for completed steps"
echo ""

# ══════════════════════════════════════════════════════════════
# MANUAL STEP CALLOUT
# ══════════════════════════════════════════════════════════════

echo -e "${YELLOW}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${YELLOW}║  ${BOLD}⚠️  MANUAL STEPS REQUIRED${NC}${YELLOW}                                 ║${NC}"
echo -e "${YELLOW}║                                                          ║${NC}"
echo -e "${YELLOW}║  Add this service account as ${BOLD}Owner${NC}${YELLOW} in Search Console:     ║${NC}"
echo -e "${YELLOW}║                                                          ║${NC}"
echo -e "${YELLOW}║  ${CYAN}$SA_EMAIL${NC}"
echo -e "${YELLOW}║                                                          ║${NC}"
echo -e "${YELLOW}║  Steps:                                                  ║${NC}"
echo -e "${YELLOW}║  1. Go to: https://search.google.com/search-console     ║${NC}"
echo -e "${YELLOW}║  2. Select: ${BOLD}$DOMAIN${NC}${YELLOW}                                       ║${NC}"
echo -e "${YELLOW}║  3. Settings → Users and permissions → Add user          ║${NC}"
echo -e "${YELLOW}║  4. Paste the email above → Set as ${BOLD}Owner${NC}${YELLOW}                  ║${NC}"
echo -e "${YELLOW}║  5. Add apex + www domains in Cloudflare Pages            ║${NC}"
echo -e "${YELLOW}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""

# Offer to open Search Console
if ! $DRY_RUN; then
  echo -ne "  Open Search Console in browser? [Y/n] "
  read -r open_browser
  if [[ "${open_browser:-Y}" =~ ^[Yy]$ ]]; then
    open "https://search.google.com/search-console" 2>/dev/null || true
  fi
fi

echo ""
echo -e "${YELLOW}${BOLD}🎩 Provisioning commands finished; complete the manual steps above:${NC}"
echo -e "   1. Complete the manual GSC step above"
echo -e "   2. Push to trigger your first deploy: ${CYAN}git push origin main${NC}"
echo -e "   3. Monitor at: ${CYAN}${DRONE_SERVER}/${DRONE_REPO}${NC}"
echo ""
