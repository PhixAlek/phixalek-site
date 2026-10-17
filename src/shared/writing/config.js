import configuration from '../../content/writing.json' with { type: 'json' };

// Shared by browser components, imports and Netlify; no browser globals here.
export const writingConfig = configuration;
export const PUBLICATION = writingConfig.source.origin;
export const SUBSTACK_FEED = new URL(writingConfig.source.feedPath, PUBLICATION).href;
