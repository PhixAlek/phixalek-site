/** Public comment previews are read-only; every interaction continues on Substack. */
export function ArticleComments(article, { doc = document, ui, text, bind = (node, property, getter) => node.setAttribute(property.slice(5), getter()) }) {
  const section = doc.createElement('section'); section.id = 'comments'; section.className = 'editorial-comments';
  section.tabIndex = -1; section.setAttribute('aria-labelledby', 'article-comments-heading');
  const heading = doc.createElement('h2'); heading.id = 'article-comments-heading';
  text(heading, () => `${ui.writingPage.comments}${article.engagement ? ` (${article.engagement.comments})` : ''}`);
  const notice = doc.createElement('p'); text(notice, () => article.localDemo ? ui.writingPage.localCommentsNotice : ui.writingPage.commentsNotice);
  const action = (label, className) => {
    const button = doc.createElement('button'); button.type = 'button'; button.className = className;
    button.dataset.substackAction = 'comments'; button.disabled = Boolean(article.localDemo); if (label) text(button, label); return button;
  };
  const header = doc.createElement('div'); header.className = 'editorial-comments-header';
  header.append(heading);
  const invitation = doc.createElement('div'); invitation.className = 'editorial-comment-invitation';
  const icon = doc.createElement('span'); icon.className = 'editorial-comment-invitation-icon'; icon.setAttribute('aria-hidden', 'true');
  icon.innerHTML = '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5 9 9 0 0 1-3.8-.9L3 21l1.9-5.7A8.5 8.5 0 1 1 21 11.5Z"/><path d="M8 9h8M8 13h5"/></svg>';
  const invitationCopy = doc.createElement('div');
  const title = doc.createElement('h3'); text(title, () => ui.writingPage.commentInvitation);
  invitationCopy.append(title);
  const comment = doc.createElement(article.localDemo ? 'button' : 'a'); comment.className = 'btn editorial-comment-cta';
  if (article.localDemo) { comment.type = 'button'; comment.disabled = true; }
  else { comment.href = article.sourceUrl + '/comments'; comment.target = '_blank'; comment.rel = 'noopener noreferrer'; comment.dataset.substackAction = 'comments'; }
  const fullLabel = doc.createElement('span'); fullLabel.className = 'editorial-comment-label-full'; text(fullLabel, () => ui.writingPage.commentOnSubstack + ' ↗');
  const compactLabel = doc.createElement('span'); compactLabel.className = 'editorial-comment-label-compact'; text(compactLabel, () => ui.writingPage.comment + ' ↗');
  bind(comment, 'attr:aria-label', () => ui.writingPage.commentOnSubstack); comment.append(fullLabel, compactLabel);
  invitation.append(icon, invitationCopy, comment); section.append(header, notice, invitation);
  const previews = [...(article.engagement?.preview || [])].sort((a, b) => Date.parse(b.date) - Date.parse(a.date)).slice(0, 3);
  if (previews.length) {
    const latest = doc.createElement('h3'); latest.className = 'editorial-latest-comments'; text(latest, () => ui.writingPage.latestComments); section.append(latest);
    const list = doc.createElement('ol'); list.className = 'editorial-comment-list';
    const renderComment = (comment, replies = comment.repliesPreview || [], depth = 0) => {
      const item = doc.createElement('li'); item.className = 'editorial-comment';
      const avatar = doc.createElement('span'); avatar.className = 'editorial-comment-avatar'; avatar.setAttribute('aria-hidden', 'true'); avatar.textContent = comment.author.slice(0, 1);
      if (comment.avatar) { const image = doc.createElement('img'); image.src = comment.avatar; image.alt = ''; image.width = 36; image.height = 36; image.loading = 'lazy'; image.onerror = () => image.remove(); avatar.append(image); }
      const copy = doc.createElement('div'); copy.className = 'editorial-comment-copy';
      const meta = doc.createElement('div'); meta.className = 'editorial-comment-meta';
      const name = doc.createElement('strong'); name.textContent = comment.author;
      const date = doc.createElement('time'); date.dateTime = comment.date;
      text(date, () => new Intl.DateTimeFormat(doc.documentElement.lang === 'es' ? 'es-MX' : 'en-US', { dateStyle: 'medium', timeZone: 'UTC' }).format(new Date(comment.date)));
      meta.append(name, date);
      if (comment.isAuthor) { const badge = doc.createElement('span'); badge.className = 'editorial-comment-author'; text(badge, () => ui.writingPage.commentAuthor); meta.append(badge); }
      const body = doc.createElement('p'); body.className = 'editorial-comment-body'; body.textContent = comment.body;
      const actions = doc.createElement('div'); actions.className = 'editorial-comment-actions';
      if (comment.likes != null) { const likes = doc.createElement('span'); likes.textContent = `♡ ${comment.likes}`; likes.className = 'editorial-comment-likes'; if (comment.likes > 1) likes.classList.add('has-reactions'); actions.append(likes); }
      actions.append(action(() => ui.writingPage.reply, 'editorial-comment-link'));
      copy.append(meta, body, actions);
      const children = depth < 4 ? replies.filter(reply => reply.parentId === comment.id) : [];
      if (children.length) {
        const nested = doc.createElement('ol'); nested.className = 'editorial-comment-thread';
        children.forEach(reply => nested.append(renderComment(reply, replies, depth + 1)));
        if (depth === 0) {
          const thread = doc.createElement('details'); thread.className = 'editorial-comment-thread-toggle';
          const summary = doc.createElement('summary');
          text(summary, () => ui.writingPage.repliesCount.replace('{count}', String(replies.length)));
          thread.append(summary, nested); copy.append(thread);
        } else copy.append(nested);
      } else if (comment.replies) { const moreReplies = action(() => comment.replies, 'editorial-comment-replies'); copy.append(moreReplies); }
      item.append(avatar, copy); return item;
    };
    previews.forEach(comment => list.append(renderComment(comment)));
    section.append(list);
  }
  if (!previews.length) { const empty = doc.createElement('p'); empty.className = 'editorial-comments-empty'; text(empty, () => ui.writingPage.noComments); section.append(empty); }
  if (!article.localDemo) {
    const more = doc.createElement('a'); more.className = 'editorial-comment-more'; more.href = article.sourceUrl + '/comments';
    more.target = '_blank'; more.rel = 'noopener noreferrer';
    const remaining = Math.max(0, (article.engagement?.comments || 0) - previews.length);
    text(more, () => remaining ? ui.writingPage.moreComments.replace('{count}', String(remaining)) : ui.writingPage.allComments);
    section.append(more);
  }
  return section;
}
