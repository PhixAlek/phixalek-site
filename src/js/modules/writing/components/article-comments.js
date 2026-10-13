/** Provider notice is independent of the reader and never imitates synced comments. */
export function ArticleComments(article, { doc = document, ui, text }) {
  const section = doc.createElement('section'); section.id = 'comments'; section.className = 'editorial-comments';
  section.tabIndex = -1; section.setAttribute('aria-labelledby', 'article-comments-heading');
  const heading = doc.createElement('h2'); heading.id = 'article-comments-heading'; text(heading, () => ui.writingPage.comments);
  const notice = doc.createElement('p'); text(notice, () => ui.writingPage.commentsNotice);
  section.append(heading, notice);
  if (!article.localDemo) {
    const link = doc.createElement('a'); link.className = 'btn'; link.href = article.sourceUrl + '#comments';
    link.target = '_blank'; link.rel = 'noopener noreferrer'; text(link, () => ui.writingPage.continueSubstack);
    section.append(link);
  }
  return section;
}
