# Production SEO and new articles

## Repeatable technical verification

```sh
npm run seo:live
```

This is a read-only audit of https://phixalek.com. It does not trigger a Netlify deployment or rebuild the project. It checks sitemap.xml, robots.txt, and sitemap page status, canonical, robots metadata, title, description and Open Graph URL. Failures produce a nonzero exit status. It does not establish whether Google has indexed a URL or selected the same canonical.

`npm run build` validates the local deployable HTML, structured data and sitemap before publishing. It is separate from the production audit.

## Search Console

1. Open the verified property for phixalek.com.
2. In Sitemaps submit `https://phixalek.com/sitemap.xml` once, then check its processing status.
3. Inspect `https://phixalek.com/`, `https://phixalek.com/blog/` and a representative article's final URL with its trailing slash.
4. Run the live URL test. Check crawlability, then request indexing for the main updated pages when appropriate.
5. In the indexed URL inspection result, compare the user-declared canonical with Google's selected canonical. A live test alone cannot tell you Google's final choice.
6. For “Page with redirect,” inspect the exact source URL and destination. An intentionally redirected HTTP/www/old route should not be indexed separately. The destination must be the valid canonical page.

Google documentation:
- https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap
- https://developers.google.com/search/docs/crawling-indexing/ask-google-to-recrawl
- https://support.google.com/webmasters/answer/9012289

## New Substack posts

Publish the article on Substack with a clear title, opening cover and relevant tags. You can group several posts before one site deployment. Publishing on Substack alone does not trigger a Netlify deploy.

The production build refreshes the feed and generates article HTML, metadata, structured data and sitemap using the existing template. Update/commit the editorial snapshot periodically with `npm run writing:update` to preserve articles beyond the RSS window. Review those changes before publishing. The browser may show fresher feed data before the next deploy; search crawlers need the generated article pages from the deploy.

After publishing the batch, run `npm run seo:live` and inspect an article in Search Console. Do not request repeated builds just to submit a sitemap. Existing sitemap submission is sufficient for subsequent updates; request indexing of selected important pages rather than resubmitting every page repeatedly.

## Verification recorded on 2026-10-17

- Home, Writing and three articles: HTTP 200, matching self-canonicals, titles, descriptions and og:url; no noindex.
- sitemap.xml and robots.txt: HTTP 200; robots declares the correct sitemap.
- `/blog/missing-check-20261017/`: HTTP 404.
- `test-post-1/` remains published and in the sitemap. If it is only a test, unpublish it in Substack and review the archived snapshot rather than presenting it as a finished public article.

Search Console ownership, sitemap submission, Google-selected canonicals, indexing status and rankings were not verified in the account. Technical correctness does not guarantee indexing or ranking.
