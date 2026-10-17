# Substack → PhixAlek

Publish and edit the original content in Substack. The site imports the saved RSS copy; `npm run writing:update` refreshes that copy, and `npm run writing:engagement` refreshes available public counts/previews. Builds do not fetch remote content.

## Article
Use `article.md`. Enter its title and subtitle in the corresponding Substack fields. In the editor, format section titles as H5, and quotations as Blockquote. The site preserves H4/H5, emphasis, lists, images, and quote lines. Markdown markers in these files describe formatting; confirm the formatting in the Substack editor before publishing.

## Note
Use `note.md` for short writing. Substack Notes and article posts are different formats. The current import reads publication RSS article posts, not the separate Notes stream. To see a short note in this feed now, publish it as a short article post.

## Topic / tags
Use `topic.md` for any subject; do not create an independent layout for each tag. Choose only tags relevant to the actual post. A topic uses the same article layout, with content and tags supplied by that item.

The site imports RSS categories and, during `npm run writing:update`, supplements them with public `postTags` from each article page. This is public page data, not an official tags API; temporary failures retain the last valid tags. Builds derive filters from the saved item JSON and make no extra network requests.

If the provider changes that page format, you can supply missing tags by editing `articleOverrides` in `src/content/writing.json`, keyed by the exact published source URL:

```json
"https://phixalek.substack.com/p/actual-published-slug": {
  "categories": ["Actual primary tag", "Actual secondary tag"]
}
```

Replace these placeholders with real URL/tags; this example is not active configuration. Only tags attached to available items generate filters during compilation. No fixed tag list is needed.

Do not add local-demo URLs or fictitious reaction counts. Cover attribution should describe the actual image source. The two original launch examples used generated covers; their temporary testing notice is excluded from the site, but it remains in Substack until edited there.
