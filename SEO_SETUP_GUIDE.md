# SEO Environment Variables Setup Guide

## Required Environment Variables

Add these to your `.env.local` file for proper SEO functionality:

### 1. Application URL
```bash
NEXT_PUBLIC_APP_URL=https://ppracademy.com
```
- Used for generating absolute URLs in metadata, Open Graph images, and structured data
- Change to your production domain
- For local development, use: `http://localhost:3000`

### 2. Google Search Console Verification (Optional)
```bash
NEXT_PUBLIC_GOOGLE_VERIFICATION=your-verification-code-here
```
- Get this from Google Search Console when you verify your site
- Used in `app/layout.tsx` metadata
- Leave empty if not yet verified

## Setting Up Google Search Console

1. Go to [Google Search Console](https://search.google.com/search-console)
2. Add your property (ppracademy.com)
3. Choose "HTML tag" verification method
4. Copy the `content` value from the meta tag
5. Add it to `NEXT_PUBLIC_GOOGLE_VERIFICATION`
6. Deploy your site
7. Click "Verify" in Google Search Console

## Submitting Your Sitemap

After deploying with the SEO changes:

1. Go to Google Search Console
2. Navigate to "Sitemaps" in the left sidebar
3. Enter: `https://ppracademy.com/sitemap.xml`
4. Click "Submit"

Your sitemap will be automatically indexed by Google!

## Testing Your SEO Implementation

### 1. Local Testing
```bash
npm run dev
```
Then visit:
- http://localhost:3000/sitemap.xml
- http://localhost:3000/robots.txt
- Any course or storefront page

### 2. View Page Source
Right-click on any page and select "View Page Source"
Look for:
- `<script type="application/ld+json">` (structured data)
- `<meta property="og:` (Open Graph tags)
- `<meta name="twitter:` (Twitter Card tags)

### 3. Online Validators

**Rich Results Test** (Schema.org validation):
- https://search.google.com/test/rich-results
- Paste your production URL
- Verify Course and Person schemas appear

**Twitter Card Validator**:
- https://cards-dev.twitter.com/validator
- Paste your production URL
- Verify card preview looks good

**Facebook Sharing Debugger**:
- https://developers.facebook.com/tools/debug/
- Paste your production URL
- Verify Open Graph data is correct

**Schema Markup Validator**:
- https://validator.schema.org/
- Paste your production URL or the JSON-LD directly
- Verify no errors

## What Each URL Shows

### Homepage (/)
- Organization schema
- Website schema with search action
- Open Graph for social sharing
- Full platform metadata

### Course Pages (/courses/[slug])
- Course schema with pricing, instructor, dates
- Dynamic Open Graph image (generated from course data)
- Breadcrumb navigation
- Course-specific metadata

### Storefront Pages (/[slug])
- Person/Creator schema
- Social media links
- Dynamic Open Graph image
- Store-specific metadata

## Expected Results

### In Google Search Results:
✅ Rich snippets with star ratings (when added)
✅ Course cards with pricing
✅ Breadcrumb navigation
✅ Sitelinks to important pages

### On Social Media:
✅ Beautiful preview cards
✅ Course images and titles
✅ Proper attribution
✅ Call-to-action buttons

### In Search Console:
✅ All important pages indexed
✅ No crawl errors on protected routes
✅ Fast page load times
✅ Mobile-friendly status

## Monitoring SEO Performance

### Google Search Console Metrics to Watch:
1. **Total Impressions** - How often you appear in search
2. **Click-Through Rate (CTR)** - % of people who click
3. **Average Position** - Where you rank for keywords
4. **Index Coverage** - Pages successfully indexed

### Google Analytics 4 Metrics:
1. **Organic Traffic** - Visitors from search engines
2. **Bounce Rate** - % who leave immediately
3. **Average Session Duration** - Time spent on site
4. **Conversion Rate** - Sign-ups, purchases, enrollments

## Troubleshooting

### Sitemap not updating?
- Clear your cache
- Redeploy your site
- Sitemaps are generated dynamically from Convex data

### Open Graph images not showing?
- Check image URLs are absolute (include domain)
- Verify images are under 8MB
- Use 1200x630px recommended size
- Wait 24-48 hours for social platform caches to update

### Structured data errors?
- Use Schema.org validator
- Ensure all required fields are present
- Check for proper JSON-LD formatting

### Pages not being indexed?
- Check robots.txt isn't blocking them
- Verify they're in the sitemap
- Ensure they return 200 status code
- Submit to Google Search Console manually

## Need Help?

Check the main documentation:
- `SEO_OPTIMIZATION_COMPLETE.md` - Full implementation guide
- [Next.js Metadata Docs](https://nextjs.org/docs/app/api-reference/functions/generate-metadata)
- [Schema.org Documentation](https://schema.org/)

