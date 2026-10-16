import { writingConfig } from '../../../../shared/writing/config.js';
import { SubscriptionEmbed } from './subscription-embed.js';
import { commentURL } from '../../../../shared/writing/comment-url.js';

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

/** Recognize provider links without intercepting unrelated destinations or its Terms. */
export function substackLinkDestination(value) {
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.username || url.password) return null;
    if (url.hostname !== 'substack.com' && !url.hostname.endsWith('.substack.com')) return null;
    if (url.hostname === 'substack.com' && url.pathname.replace(/\/$/, '') === '/tos') return null;
    return url.href;
  } catch { return null; }
}

/** Shared provider notice for comments, likes and the subscription fallback. */
export function mountSubstackInteractions(container, { article = null, outboundLinks = false, newsletter = true, ui, text, bind, release = () => {}, view = container.ownerDocument.defaultView }) {
  const doc = container.ownerDocument;
  const section = newsletter ? SubscriptionEmbed({ doc, ui, text, bind }) : null;
  const suffix = outboundLinks ? '-global' : '';
  const dialog = doc.createElement('dialog'); dialog.className = 'editorial-dialog editorial-provider-dialog';
  const heading = doc.createElement('h2'); heading.id = 'writing-provider-heading' + suffix;
  const notice = doc.createElement('p'); notice.id = 'writing-provider-notice' + suffix;
  dialog.setAttribute('aria-labelledby', heading.id); dialog.setAttribute('aria-describedby', notice.id);
  const cancel = doc.createElement('button'); cancel.type = 'button'; text(cancel, () => ui.writingPage.cancel);
  const proceed = doc.createElement('a'); proceed.className = 'btn'; proceed.target = '_blank'; proceed.rel = 'noopener noreferrer';
  text(proceed, () => ui.writingPage.continueSubstack);
  const controls = doc.createElement('div'); controls.className = 'editorial-dialog-controls'; controls.append(cancel, proceed);
  dialog.append(heading, notice, controls); if (section) container.append(section); container.append(dialog);
  let kind = 'subscribe', opener, previousOverflow, disposed = false;
  text(heading, () => kind === 'comments' ? ui.writingPage.commentsOnSubstack : ui.writingPage.subscribeOnSubstack);
  text(notice, () => kind === 'comments' ? ui.writingPage.commentsNotice : ui.writingPage.subscribeNotice);
  bind(proceed, 'attr:aria-label', () => ui.writingPage.continueSubstack);
  const close = () => { if (dialog.open) dialog.close(); };
  const restore = () => {
    if (previousOverflow !== undefined) doc.body.style.overflow = previousOverflow;
    previousOverflow = undefined;
    if (!disposed && opener?.isConnected) opener.focus({ preventScroll: true });
  };
  const open = (button, destination, action) => {
    if (dialog.open) return;
    kind = action; opener = button; proceed.href = destination;
    proceed.target = '_blank';
    text(heading, () => kind === 'comments' ? ui.writingPage.commentsOnSubstack : kind === 'likes' ? ui.writingPage.likesOnSubstack : kind === 'external' ? ui.writingPage.leavingSubstackHeading : ui.writingPage.subscribeOnSubstack);
    text(notice, () => kind === 'comments' ? ui.writingPage.commentsNotice : kind === 'likes' ? ui.writingPage.likesNotice : kind === 'external' ? ui.writingPage.leavingSubstackNotice : ui.writingPage.subscribeNotice);
    previousOverflow = doc.body.style.overflow; doc.body.style.overflow = 'hidden';
    dialog.showModal(); cancel.focus();
  };
  const click = event => {
    if (event.defaultPrevented || event.target.closest('.editorial-provider-dialog')) return;
    const button = event.target.closest('[data-substack-action]');
    if (button && container.contains(button) && !button.disabled && !outboundLinks) {
      const comment = button.tagName === 'A' && button.dataset.substackAction === 'comments' && button.dataset.commentId
        ? commentURL({ id: Number(button.dataset.commentId), sourceUrl: button.href }) : null;
      const destination = comment || (button.tagName === 'A' && button.dataset.substackAction === 'likes'
        ? substackLinkDestination(button.href) || substackDestination('likes', article)
        : substackDestination(button.dataset.substackAction, article));
      if (!destination) return;
      event.preventDefault(); open(button, destination, button.dataset.substackAction); return;
    }
    if (!outboundLinks) return;
    const link = event.target.closest('a[href]');
    if (!link || !container.contains(link)) return;
    const destination = substackLinkDestination(link.href);
    if (!destination) return;
    event.preventDefault(); open(link, destination, 'external');
  };
  const submit = event => {
    const form = event.target;
    if (event.defaultPrevented || !form.matches('.editorial-subscribe-fields') || !container.contains(form)) return;
    const destination = substackLinkDestination(form.action);
    if (!destination) return;
    event.preventDefault();
    if (!form.reportValidity()) return;
    const url = new URL(destination);
    url.search = new URLSearchParams(new view.FormData(form)).toString();
    open(event.submitter || form.querySelector('button[type=submit]'), url.href, 'subscribe');
  };
  const backdrop = event => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) close();
  };
  container.addEventListener('click', click); container.addEventListener('submit', submit); cancel.addEventListener('click', close); proceed.addEventListener('click', close);
  dialog.addEventListener('close', restore); dialog.addEventListener('click', backdrop);
  return () => {
    disposed = true; close(); restore(); container.removeEventListener('click', click); container.removeEventListener('submit', submit);
    if (section) { section.dispose?.(); release(section); section.remove(); } release(dialog); dialog.remove();
  };
}
