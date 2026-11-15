# Visual Distribution Suite (RSS)

Automated visual SEO distribution for your niche site. This system uses a **Pinterest-friendly RSS feed** to automatically publish pins with high-authority backlinks.

## Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                  data/plans/<plan>.json                      │
│       (Metadata source for the images and links)             │
└──────────────────────────┬───────────────────────────────────┘
                           ▼
            ┌──────────────────────────────┐
            │   scripts/generate_rss.ts    │
            │   (The Feed Generator)       │
            └──────────────┬───────────────┘
                           ▼
            ┌──────────────────────────────┐
            │    public/visuals.xml        │
            │    (The live RSS Feed)       │
            └──────────────┬───────────────┘
                           ▼
            ┌──────────────────────────────┐
            │       Pinterest.com          │
            │    (Auto-Publishing Bot)     │
            └──────────────────────────────┘
```

## How it works

1. **Plans**: Metadata is defined in `data/plans/*.json`. These files contain the headline, destination link (backlink), and local image path.
2. **Assets**: Images are stored in `public/assets/visuals/`. Pinterest "pulls" these images directly from your website.
3. **Feed**: Running `npm run generate-rss` (or `npx tsx scripts/generate_rss.ts`) scans the plans and builds `public/visuals.xml`.
4. **Automation**: Once Pinterest is connected to the feed, it checks for updates every 24 hours and creates Pins automatically.

## Usage

### 1. Create content
Add new JSON plans to `data/plans/` and ensure the corresponding images are in `public/assets/visuals/`.

### 2. Update the feed
```bash
npm run generate-rss
```

### 3. Deploy
Commit and push your changes. The feed will be live at `<your site url>/visuals.xml` — the URL is derived from `config.url` in `niche.config.ts`.

## Setup on Pinterest

1. Log in to your **Pinterest Business** account.
2. Go to **Settings > Claimed Accounts**.
3. Verify your domain (the host in `config.url`) via Meta Tag or HTML file.
4. Under **RSS Feed**, connect: `<your site url>/visuals.xml`.
5. Select your target board — set it as `visualDistribution.pinterest.defaultBoardName` in `niche.config.ts`.

## Why RSS?
- **Zero API maintenance**: No tokens to rotate, no video demos for Pinterest approval.
- **High Authority**: Pinterest treats RSS-sourced pins as "official" content from the domain owner.
- **Set and Forget**: Once connected, distribution is hands-off.
