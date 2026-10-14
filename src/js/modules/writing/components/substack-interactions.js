import { writingConfig } from '../../../../shared/writing/config.js';
import { SubscriptionEmbed } from './subscription-embed.js';

/** Only the configured publication can receive a provider interaction. */
export function substackDestination(kind, article, origin = writingConfig.source.origin) {
  const publication = new URL(origin);
  if (publication.protocol !== 'https:') return null;
  if (kind === 'subscribe') return new URL('/subscribe', publication).href;
  if (!['comments', 'likes'].includes(kind) || !article || article.localDemo) return null;
  try {
    const url = new URL(article.sourceUrl);
    if (url.origin !== publication.origin || !url.pathname.startsWith('/p/') || url.username || url.password) return null;
    url.hash = ''; if (kind === 'comments') url.pathname = url.pathname.replace(/\/$/, '') + '/comments'; return url.href;
  } catch { return null; }
}

/** Shared provider notice for comments, likes and the subscription fallback. */
export function mountSubstackInteractions(container, { article = null, ui, text, bind, release = () => {}, view = container.ownerDocument.defaultView }) {
  const doc = container.ownerDocument;
  const section = SubscriptionEmbed({ doc, ui, text, bind });
  const dialog = doc.createElement('dialog'); dialog.className = 'editorial-dialog editorial-provider-dialog';
  const heading = doc.createElement('h2'); heading.id = 'writing-provider-heading';
  const notice = doc.createElement('p'); notice.id = 'writing-provider-notice';
  dialog.setAttribute('aria-labelledby', heading.id); dialog.setAttribute('aria-describedby', notice.id);
  const cancel = doc.createElement('button'); cancel.type = 'button'; text(cancel, () => ui.writingPage.cancel);
  const proceed = doc.createElement('a'); proceed.className = 'btn'; proceed.target = '_blank'; proceed.rel = 'noopener noreferrer';
  text(proceed, () => ui.writingPage.continueSubstack);
  const controls = doc.createElement('div'); controls.className = 'editorial-dialog-controls'; controls.append(cancel, proceed);
  const draftPreview = doc.createElement('textarea'); draftPreview.readOnly = true; draftPreview.rows = 3; draftPreview.hidden = true;
  draftPreview.className = 'editorial-draft-preview'; bind(draftPreview, 'attr:aria-label', () => ui.writingPage.addComment);
  const copyDraft = doc.createElement('button'); copyDraft.type = 'button'; copyDraft.hidden = true; text(copyDraft, () => ui.writingPage.copyComment);
  controls.insertBefore(copyDraft, proceed);
  const status = doc.createElement('p'); status.setAttribute('role', 'status'); status.className = 'editorial-draft-status';
  dialog.append(heading, notice, draftPreview, controls, status); container.append(section, dialog);
  let kind = 'subscribe', opener, previousOverflow, disposed = false, revision = 0;
  text(heading, () => kind === 'comments' ? ui.writingPage.commentsOnSubstack : ui.writingPage.subscribeOnSubstack);
  text(notice, () => kind === 'comments' ? ui.writingPage.commentsNotice : ui.writingPage.subscribeNotice);
  bind(proceed, 'attr:aria-label', () => ui.writingPage.continueSubstack);
  const close = () => { if (dialog.open) dialog.close(); };
  const restore = () => {
    revision++;
    if (previousOverflow !== undefined) doc.body.style.overflow = previousOverflow;
    previousOverflow = undefined;
    if (!disposed && opener?.isConnected) opener.focus({ preventScroll: true });
  };
  const copyDraftText = async () => {
    const request = revision;
    copyDraft.disabled = true;
    try {
      if (!view.navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
      await view.navigator.clipboard.writeText(draftPreview.value);
      if (!disposed && request === revision && dialog.open) text(status, () => ui.writingPage.commentCopied);
    } catch {
      if (!disposed && request === revision && dialog.open) {
        text(status, () => ui.writingPage.commentCopyError); draftPreview.focus(); draftPreview.select();
      }
    } finally { if (!disposed && request === revision) copyDraft.disabled = false; }
  };
  const click = event => {
    const button = event.target.closest('[data-substack-action]');
    if (!button || !container.contains(button) || button.disabled || dialog.open) return;
    const destination = substackDestination(button.dataset.substackAction, article);
    if (!destination) return;
    event.preventDefault();
    kind = button.dataset.substackAction; opener = button; proceed.href = destination;
    proceed.target = '_blank';
    revision++; release(status); status.textContent = ''; copyDraft.disabled = false;
    draftPreview.value = button.hasAttribute('data-substack-draft') ? container.querySelector('.editorial-comment-draft')?.value || '' : '';
    const hasDraft = Boolean(draftPreview.value.trim()); draftPreview.hidden = !hasDraft; copyDraft.hidden = !hasDraft;
    text(heading, () => kind === 'comments' ? ui.writingPage.commentsOnSubstack : kind === 'likes' ? ui.writingPage.likesOnSubstack : ui.writingPage.subscribeOnSubstack);
    text(notice, () => kind === 'comments' ? ui.writingPage.commentsNotice : kind === 'likes' ? ui.writingPage.likesNotice : ui.writingPage.subscribeNotice);
    if (hasDraft) text(notice, () => ui.writingPage.commentTransferNotice);
    previousOverflow = doc.body.style.overflow; doc.body.style.overflow = 'hidden';
    dialog.showModal(); cancel.focus();
    if (hasDraft) void copyDraftText();
  };
  const backdrop = event => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) close();
  };
  container.addEventListener('click', click); cancel.addEventListener('click', close); proceed.addEventListener('click', close);
  copyDraft.addEventListener('click', copyDraftText);
  dialog.addEventListener('close', restore); dialog.addEventListener('click', backdrop);
  return () => {
    disposed = true; close(); restore(); container.removeEventListener('click', click);
    release(section); release(dialog); section.remove(); dialog.remove();
  };
}
