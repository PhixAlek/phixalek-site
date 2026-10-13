/** Keep the source title intact while giving its final English phrase an editorial accent. */
export function createWritingHeading({ doc, text, getTitle }) {
  const heading = doc.createElement('h1'); heading.className = 'editorial-heading';
  const primary = doc.createElement('span'); primary.className = 'editorial-heading-primary';
  const accent = doc.createElement('span'); accent.className = 'editorial-heading-accent';
  const parts = () => {
    const title = getTitle();
    const split = title.lastIndexOf(' and ');
    return split < 0 ? [title, ''] : [title.slice(0, split), title.slice(split + 1)];
  };
  text(primary, () => parts()[0]); text(accent, () => parts()[1]);
  heading.append(primary, doc.createTextNode(' '), accent);
  return heading;
}
