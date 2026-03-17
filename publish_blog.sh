#!/bin/bash
# MenoMind Blog Auto-Publisher
# Publishes one blog post per day from the staging directory.
# Run via cron: 0 6 * * * /home/ubuntu/menomind-landing/publish_blog.sh >> /home/ubuntu/publish_blog.log 2>&1

set -e

REPO_DIR="/home/ubuntu/menomind-landing"
STAGING_DIR="/home/ubuntu/blog_staging"
TODAY=$(date +%Y-%m-%d)
LOG_PREFIX="[$(date '+%Y-%m-%d %H:%M:%S')]"

# Blog post schedule: DATE|SLUG|TITLE|DESCRIPTION|READ_TIME
POSTS=(
  "2026-03-17|is-this-perimenopause|Is This Perimenopause? The First Signs Most Women Miss|Wondering if what you're feeling is perimenopause? Learn the first signs most women miss — from brain fog to rage to insomnia.|8 min read"
  "2026-03-18|hot-flashes-night-sweats|Hot Flashes and Night Sweats — It's Way Worse Than Anyone Told You|Hot flashes aren't a cute little flush — they're drenching and disruptive. Here's what's actually happening and what helps.|7 min read"
  "2026-03-19|how-long-does-perimenopause-last|How Long Does Perimenopause Last? What the Research Actually Says|Perimenopause isn't a quick phase — it can last 4 to 10 years. Here's what the research says about the timeline and stages.|7 min read"
  "2026-03-20|perimenopause-anxiety-or-mental-health|Is It Perimenopause or Anxiety? How to Tell the Difference|Sudden anxiety in your 40s with no history? It might not be GAD — it could be perimenopause. Learn how to tell the difference.|8 min read"
  "2026-03-21|natural-remedies-perimenopause|Natural Remedies for Perimenopause — What Actually Works|Looking for natural ways to manage perimenopause? Here's what the evidence says about supplements and lifestyle changes that help.|9 min read"
  "2026-03-24|vaginal-dryness-low-libido-menopause|Vaginal Dryness and Low Libido — The Symptom No One Talks About|More than half of menopausal women experience vaginal dryness and low libido. It's not in your head — it's hormonal.|8 min read"
  "2026-03-25|menopause-ruining-my-marriage|Menopause Is Ruining My Marriage — When Hormones Strain Everything|If menopause is straining your relationship, you're not alone. Peak divorce age overlaps with perimenopause.|8 min read"
  "2026-03-26|perimenopause-career-brain-fog-work|Perimenopause at Work — When Brain Fog Threatens Your Career|Brain fog making you question your competence at work? Perimenopause affects 60% of women's cognitive function.|7 min read"
  "2026-03-27|no-one-told-me-perimenopause|No One Told Me About Perimenopause — Why Half of Women Are Blindsided|46% of women don't know perimenopause exists. Only 31% of OB-GYN programs teach it. Here's what you were never told.|8 min read"
  "2026-03-28|perimenopause-identity-loss|I Don't Recognize Myself Anymore — Identity Loss in Perimenopause|If you feel like a stranger in your own body, you're not alone. Identity loss is one of perimenopause's most painful symptoms.|8 min read"
)

cd "$REPO_DIR"

# Pull latest changes
echo "$LOG_PREFIX Pulling latest changes..."
git pull origin main

PUBLISHED=0

for entry in "${POSTS[@]}"; do
  IFS='|' read -r SCHED_DATE SLUG TITLE DESCRIPTION READ_TIME <<< "$entry"

  # Skip if not yet scheduled
  if [[ "$TODAY" < "$SCHED_DATE" ]]; then
    continue
  fi

  # Skip if already published (file exists in public/blog/)
  if [[ -f "public/blog/${SLUG}.html" ]]; then
    continue
  fi

  # Check if staging file exists
  if [[ ! -f "${STAGING_DIR}/${SLUG}.html" ]]; then
    echo "$LOG_PREFIX ERROR: Staging file not found: ${STAGING_DIR}/${SLUG}.html"
    continue
  fi

  echo "$LOG_PREFIX Publishing: ${TITLE}"

  # 1. Copy blog HTML from staging
  cp "${STAGING_DIR}/${SLUG}.html" "public/blog/${SLUG}.html"

  # 2. Add rewrite to vercel.json (insert before the last ] in the rewrites array)
  python3 -c "
import json
with open('vercel.json', 'r') as f:
    config = json.load(f)
config['rewrites'].append({
    'source': '/blog/${SLUG}',
    'destination': '/blog/${SLUG}.html'
})
with open('vercel.json', 'w') as f:
    json.dump(config, f, indent=2)
    f.write('\n')
"

  # 3. Add URL to sitemap.xml (insert before closing </urlset>)
  sed -i "s|</urlset>|  <url>\n    <loc>https://menomind.app/blog/${SLUG}</loc>\n    <lastmod>${TODAY}</lastmod>\n    <priority>0.7</priority>\n  </url>\n</urlset>|" "public/sitemap.xml"

  # 4. Add card to blog/index.html (insert after <div class="blog-cards">)
  ESCAPED_TITLE=$(echo "$TITLE" | sed 's/&/\&amp;/g; s/</\&lt;/g; s/>/\&gt;/g')
  ESCAPED_DESC=$(echo "$DESCRIPTION" | sed 's/&/\&amp;/g; s/</\&lt;/g; s/>/\&gt;/g')
  CARD_HTML="<a href=\"\/blog\/${SLUG}\" class=\"blog-card\">\n                <h2>${ESCAPED_TITLE}<\/h2>\n                <p>${ESCAPED_DESC}<\/p>\n                <div class=\"card-meta\">\n                    <span class=\"read-time\">⏱ ${READ_TIME}<\/span>\n                <\/div>\n            <\/a>\n"

  sed -i "/<div class=\"blog-cards\">/a\\
            ${CARD_HTML}" "public/blog/index.html"

  # 5. Commit and push
  git add "public/blog/${SLUG}.html" "vercel.json" "public/sitemap.xml" "public/blog/index.html"
  git commit -m "Publish blog: ${TITLE}"
  git push origin main

  PUBLISHED=1
  echo "$LOG_PREFIX Successfully published: ${SLUG}"
  echo "$LOG_PREFIX Vercel deploy triggered."

  # Only publish one post per run
  break
done

if [[ $PUBLISHED -eq 0 ]]; then
  echo "$LOG_PREFIX No posts to publish today."
fi
