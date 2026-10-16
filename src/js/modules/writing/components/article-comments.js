import { commentURL } from '../../../../shared/writing/comment-url.js';
import { relativeCommentDate } from '../../../../shared/writing/relative-date.js';

/** Public comment previews are read-only; every interaction continues on Substack. */
export function ArticleComments(article, { doc = document, ui, text, bind = (node, property, getter) => node.setAttribute(property.slice(5), getter()) }) {
  const section = doc.createElement('section'); section.id = 'comments'; section.className = 'editorial-comments';
  section.tabIndex = -1; section.setAttribute('aria-labelledby', 'article-comments-heading');
  const heading = doc.createElement('h2'); heading.id = 'article-comments-heading';
  text(heading, () => `${ui.writingPage.comments}${article.engagement ? ` (${article.engagement.comments})` : ''}`);
  const notice = doc.createElement('p'); text(notice, () => article.localDemo ? ui.writingPage.localCommentsNotice : ui.writingPage.commentsNotice);
  const action = (label, className, comment) => {
    const destination = !article.localDemo && commentURL(comment);
    const button = doc.createElement(destination ? 'a' : 'button'); button.className = className;
    if (destination) {
      button.href = destination; button.target = '_blank'; button.rel = 'noopener noreferrer';
      button.dataset.commentId = String(comment.id);
    } else button.type = 'button';
    button.dataset.substackAction = 'comments'; button.disabled = Boolean(article.localDemo); if (label) text(button, label);
    bind(button, 'attr:aria-label', () => ui.writingPage.replyOnSubstack); return button;
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
  const fullLabel = doc.createElement('span'); fullLabel.className = 'editorial-comment-label-full'; text(fullLabel, () => ui.writingPage.comment + ' ↗');
  const compactLabel = doc.createElement('span'); compactLabel.className = 'editorial-comment-label-compact'; text(compactLabel, () => ui.writingPage.comment + ' ↗');
  bind(comment, 'attr:aria-label', () => ui.writingPage.commentOnSubstack); comment.append(fullLabel, compactLabel);
  invitation.append(icon, invitationCopy, comment); section.append(header, notice, invitation);
  const previews = [...(article.engagement?.preview || [])].sort((a, b) => Date.parse(b.date) - Date.parse(a.date)).slice(0, 3);
  const displayedComments = [];
  if (previews.length) {
    const latest = doc.createElement('h3'); latest.className = 'editorial-latest-comments'; text(latest, () => ui.writingPage.latestComments); section.append(latest);
    const list = doc.createElement('ol'); list.className = 'editorial-comment-list';
    const renderComment = (comment, replies = comment.repliesPreview || [], ancestors = new Set()) => {
      const branch = new Set(ancestors); branch.add(comment.id);
      const item = doc.createElement('li'); item.className = 'editorial-comment';
      displayedComments.push({ id: comment.id ?? comment, node: item });
      const avatar = doc.createElement('span'); avatar.className = 'editorial-comment-avatar'; avatar.setAttribute('aria-hidden', 'true'); avatar.textContent = comment.author.slice(0, 1);
      if (comment.avatar) { const image = doc.createElement('img'); image.src = comment.avatar; image.alt = ''; image.width = 36; image.height = 36; image.loading = 'lazy'; image.onerror = () => image.remove(); avatar.append(image); }
      const copy = doc.createElement('div'); copy.className = 'editorial-comment-copy';
      const meta = doc.createElement('div'); meta.className = 'editorial-comment-meta';
      const name = doc.createElement('strong'); name.textContent = comment.author;
      const date = doc.createElement('time'); date.dateTime = comment.date;
      const locale = () => doc.documentElement.lang === 'es' ? 'es-MX' : 'en-US';
      text(date, () => relativeCommentDate(comment.date, locale()));
      bind(date, 'attr:title', () => new Intl.DateTimeFormat(locale(), { dateStyle: 'long', timeStyle: 'short', timeZone: 'UTC' }).format(new Date(comment.date)) + ' UTC');
      meta.append(name, date);
      if (comment.isAuthor) { const badge = doc.createElement('span'); badge.className = 'editorial-comment-author'; text(badge, () => ui.writingPage.commentAuthor); meta.append(badge); }
      const body = doc.createElement('p'); body.className = 'editorial-comment-body'; body.textContent = comment.body;
      const actions = doc.createElement('div'); actions.className = 'editorial-comment-actions';
      if (comment.likes != null) {
        const likes = doc.createElement(article.localDemo ? 'span' : 'a');
        likes.textContent = `♡ ${comment.likes}`; likes.className = 'editorial-comment-likes';
        if (!article.localDemo) {
          likes.href = commentURL(comment) || article.sourceUrl + '/comments'; likes.target = '_blank'; likes.rel = 'noopener noreferrer';
          likes.dataset.substackAction = 'likes';
          bind(likes, 'attr:aria-label', () => `${ui.writingPage.likesOnSubstack}: ${comment.likes}`);
        }
        if (comment.likes > 1) likes.classList.add('has-reactions'); actions.append(likes);
      }
      actions.append(action(() => ui.writingPage.reply, 'editorial-comment-link', comment));
      copy.append(meta, body, actions);
      const children = replies.filter(reply => reply.parentId === comment.id && !branch.has(reply.id));
      if (children.length) {
        const nested = doc.createElement('ol'); nested.className = 'editorial-comment-thread';
        children.forEach(reply => nested.append(renderComment(reply, replies, branch)));
        {
          const thread = doc.createElement('details'); thread.className = 'editorial-comment-thread-toggle';
          const summary = doc.createElement('summary');
          const updateSummary = () => text(summary, () => thread.open ? ui.writingPage.hideReplies : ui.writingPage.repliesCount.replace('{count}', String(nested.querySelectorAll('.editorial-comment').length)));
          updateSummary(); thread.addEventListener('toggle', updateSummary);
          thread.append(summary, nested); copy.append(thread);
        }
      } else if (comment.replies) { const moreReplies = action(() => comment.replies, 'editorial-comment-replies', comment); copy.append(moreReplies); }
      item.append(avatar, copy); return item;
    };
    previews.forEach(comment => list.append(renderComment(comment)));
    section.append(list);
  }
  if (!article.localDemo && (previews.length || article.engagement?.comments > 0)) {
    const more = doc.createElement('a'); more.className = 'editorial-comment-more'; more.href = article.sourceUrl + '/comments';
    more.target = '_blank'; more.rel = 'noopener noreferrer';
    section.append(more);
    const updateMore = () => text(more, () => {
      const visible = new Set();
      for (const { id, node } of displayedComments) {
        let parent = node.parentElement;
        while (parent && parent !== section && !(parent.tagName === 'DETAILS' && !parent.open)) parent = parent.parentElement;
        if (parent === section) visible.add(id);
      }
      const remaining = Math.max(0, (article.engagement?.comments || 0) - visible.size);
      return remaining ? (remaining === 1 ? ui.writingPage.moreComment : ui.writingPage.moreComments).replace('{count}', String(remaining)) : ui.writingPage.allComments;
    });
    updateMore(); section.addEventListener('toggle', updateMore, true);
  }
  return section;
}
