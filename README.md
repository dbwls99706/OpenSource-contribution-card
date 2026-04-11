# OpenSource-Contribution-Card

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A widget that automatically displays your **external open-source contributions** on your GitHub profile README.

Only shows **merged PRs** to projects you don't own.

> [한국어 README](./README.ko.md)

## Preview

| Light | Dark |
|-------|------|
| ![Light](./contributions.svg) | ![Dark](./contributions-dark.svg) |

## Features

- **External contributions only** - Excludes your own repos, shows only merged PRs to other projects
- **Auto-update** - Automatically refreshed daily via GitHub Actions
- **Keepalive protection** - Prevents GitHub from auto-disabling the scheduled workflow after 60 days of inactivity
- **5 themes** - `light`, `dark`, `nord`, `dracula`, `tokyo`
- **Auto theme detection** - Automatically switches colors based on GitHub light/dark mode
- **PR numbers** - Each card displays the PR number (e.g., #1492)
- **Sort options** - Sort by date or PR count
- **Date filter** - Show only contributions from the last N months
- **Org filter** - Include or exclude specific organizations
- **OSS Score** - Quantified open-source contribution score
- **Auto contribution type** - Automatically classifies Bug Fix, Feature, Docs, etc. based on PR labels
- **Repository icons** - Displays the repo owner's avatar on each card
- **Featured PRs** - Manually select which PRs to showcase

---

## Quick Start

### Step 1: Copy files

Copy the following files to your profile repository (`username/username`):

```
your-username/
├── .github/
│   └── workflows/
│       └── update-contributions.yml
├── src/
│   ├── index.js
│   ├── fetch-contributions.js
│   └── generate-svg.js
├── package.json
└── README.md (profile README)
```

### Step 2: Set Actions permissions

Go to repository **Settings** → **Actions** → **General**:

1. Find the **Workflow permissions** section
2. Select **"Read and write permissions"**
3. Click **Save**

### Step 3: Add image to README

Add the following to your profile `README.md`:

```markdown
## Open Source Contributions

![My Contributions](./contributions.svg)
```

### Step 4: Run

**Automatic:** Updates 3 times a day (09:00, 17:00, 01:00 KST)

**Manual:**
1. Go to **Actions** tab → **Update Contributions SVG**
2. Click **Run workflow**

---

## Configuration

Set variables in repository **Settings** → **Secrets and variables** → **Actions** → **Variables** tab:

| Variable | Description | Default |
|----------|-------------|---------|
| `THEME` | Theme (`light`, `dark`, `nord`, `dracula`, `tokyo`) | `light` |
| `AUTO_THEME` | Auto-detect GitHub theme (`true`/`false`) | `false` |
| `MAX_REPOS` | Maximum number of PRs to display (1-10) | `6` |
| `TITLE` | Custom title | `Open-Source Contributions` |
| `SORT_BY` | Sort order (`date`: newest first, `count`: most PRs first) | `date` |
| `MONTHS_AGO` | Show only last N months (e.g., `6`) | All |
| `EXCLUDE_ORGS` | Orgs/users to exclude (comma-separated) | - |
| `INCLUDE_ORGS` | Show only these orgs/users (comma-separated) | All |
| `FEATURED_PRS_PATH` | Path to Featured PRs config file | `./featured-prs.json` |
| `LOCALE` | Date format locale (BCP 47, e.g. `ko-KR`, `ja-JP`) | `en-US` |
| `WIDTH` | SVG width in pixels (minimum `400`, clamped if smaller) | `480` |
| `HIDE_TITLE` | Hide the header (title / stats / score badge) | `false` |
| `HIDE_BORDER` | Hide the per-card border stroke | `false` |

### Examples

**Auto theme detection (recommended):**

Automatically switches colors based on GitHub light/dark mode:

1. **Settings** → **Secrets and variables** → **Actions** → **Variables**
2. Click **New repository variable**
3. Name: `AUTO_THEME`, Value: `true`

> When `AUTO_THEME=true` is set, the `THEME` setting is ignored.

**Dark theme + last 6 months only:**

1. **Settings** → **Secrets and variables** → **Actions** → **Variables**
2. Click **New repository variable**
3. Add the following variables:
   - Name: `THEME`, Value: `dark`
   - Name: `MONTHS_AGO`, Value: `6`

**Org/user filtering:**

Include or exclude specific organizations:

- `INCLUDE_ORGS`: `ros2,kubernetes` → Show only PRs from ros2 and kubernetes orgs
- `EXCLUDE_ORGS`: `my-company` → Exclude PRs from my-company org

> When `INCLUDE_ORGS` is set, only those orgs are shown and `EXCLUDE_ORGS` is ignored.

---

## Themes

### Light (default)
![Light Theme](./contributions-light.svg)

### Dark
![Dark Theme](./contributions-dark.svg)

### Nord
![Nord Theme](./contributions-nord.svg)

### Dracula
![Dracula Theme](./contributions-dracula.svg)

### Tokyo Night
![Tokyo Night Theme](./contributions-tokyo.svg)

---

## OSS Score

The **OSS Score** displayed in the top-right corner of the card quantifies your open-source contribution activity.

### Calculation

```
OSS Score = (Total Merged PRs × 10) + (Repos Contributed To × 20)
```

| Item | Points |
|------|--------|
| Per merged PR | +10 |
| Per repo contributed to | +20 |

### Examples

- 5 PRs merged across 3 repos → `(5 × 10) + (3 × 20)` = **110**
- 10 PRs merged in 1 repo → `(10 × 10) + (1 × 20)` = **120**

> The more diverse your contributions and the more PRs get merged, the higher your score.

---

## Contribution Type

Each PR card automatically displays a contribution type based on PR labels.

| Type | Recognized Labels |
|------|-------------------|
| Bug Fix | `bug`, `fix` |
| Feature | `feat`, `enhancement` |
| Docs | `doc`, `documentation` |
| Tests | `test` |
| Refactor | `refactor` |
| Merged | (no label or other) |

---

## Featured PRs

Use this to manually select which PRs to showcase on the card.

### Setup

Create a `featured-prs.json` file in the project root:

```json
[
  "facebook/react#12345",
  "kubernetes/kubernetes#67890"
]
```

Format: `"owner/repo#PR-number"`

### Behavior

- If the file exists → Only the specified PRs are shown on the card
- If the file doesn't exist → PRs are displayed automatically as usual
- The total PR count and repo count in the header are always based on all contributions

---

## Local Development

```bash
# Clone
git clone https://github.com/dbwls99706/OpenSource-contribution-card
cd OpenSource-contribution-card

# Run (uses real GitHub API)
node src/index.js <your-username>

# Change theme
THEME=dark node src/index.js <your-username>

# Auto theme detection (auto-switches for GitHub light/dark mode)
AUTO_THEME=true node src/index.js <your-username>

# Show only specific orgs
INCLUDE_ORGS=ros2,kubernetes node src/index.js <your-username>

# Exclude specific orgs
EXCLUDE_ORGS=my-company node src/index.js <your-username>

# Test (mock data)
node src/index.js <your-username> --mock
```

---

## How It Works

```
GitHub Actions (runs automatically daily)
         │
         ▼
┌─────────────────────────────────┐
│  1. Call GitHub Search API      │
│     author:{user} type:pr      │
│     is:merged -user:{user}     │
└─────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│  2. Sort and filter PR data    │
└─────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│  3. Generate SVG card          │
└─────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│  4. Commit contributions.svg   │
└─────────────────────────────────┘
```

---

## Limitations

- SVG internal links are disabled in GitHub READMEs for security reasons
- PR numbers are displayed so you can search for them directly on GitHub

---

## Troubleshooting

### SVG is not generated
1. Check the workflow run logs in the **Actions** tab
2. Verify that permissions are set to "Read and write" in **Settings** → **Actions** → **General**

### Contributions are not showing
- Only merged PRs to **external projects** (not your own repos) are displayed
- Make sure the PR was actually merged

### Changes don't appear after manual run
- GitHub caches images, so there may be a delay of **up to 5-10 minutes** after the SVG is updated
- Try a hard refresh (Ctrl+Shift+R / Cmd+Shift+R)
- If it still doesn't show, wait a moment and check again

### Workflow was auto-disabled after 60 days

GitHub automatically disables scheduled workflows in repositories with no activity for 60 days. This template now includes a keepalive step that creates an empty commit every ~45 days to prevent this, but if your workflow was already disabled:

1. Go to the **Actions** tab in your profile repository
2. Click **Update Contributions SVG** in the left sidebar
3. Click **Enable workflow** at the top
4. (Optional) Click **Run workflow** to trigger it immediately

To prevent recurrence, make sure your copy of `.github/workflows/update-contributions.yml` contains the latest `Keepalive workflow` step from this template.

---

## License

MIT

---

## Credits

Created by [@dbwls99706](https://github.com/dbwls99706)
