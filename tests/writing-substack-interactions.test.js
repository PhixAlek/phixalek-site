import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import catalog from '../src/content/locales/en.json' with { type: 'json' };
import { ArticleComments } from '../src/js/modules/writing/components/article-comments.js';
import { substackDestination, mountSubstackInteractions } from '../src/js/modules/writing/components/substack-interactions.js';

const article = { sourceUrl: 'https://phixalek.substack.com/p/test-post-1' };
const ui = catalog.messages;
const text = (node, get) => { node.textContent = get(); };
const bind = (node, property, get) => node.setAttribute(property.slice(5), get());

test('provider destinations belong to the configured publication and reject fake or foreign articles', () => {
  assert.equal(substackDestination('subscribe'), 'https://phixalek.substack.com/subscribe');
  assert.equal(substackDestination('comments', article), article.sourceUrl + '/comments');
  assert.equal(substackDestination('comments', { ...article, localDemo: true }), null);
  for (const sourceUrl of ['javascript:alert(1)', 'https://other.example/p/post', 'https://phixalek.substack.com/account', 'invalid']) {
    assert.equal(substackDestination('comments', { sourceUrl }), null);
  }
});

test('comments retain a cancelable notice while subscription uses only its official form and neutral terms', () => {
  const dom = new JSDOM('<main></main>'), doc = dom.window.document, container = doc.querySelector('main');
  container.append(ArticleComments(article, { doc, ui, text }));
  const dispose = mountSubstackInteractions(container, { article, ui, text, bind });
  const dialog = container.querySelector('dialog');
  dialog.showModal = () => { dialog.open = true; };
  dialog.close = () => { dialog.open = false; dialog.dispatchEvent(new dom.window.Event('close')); };
  const comment = container.querySelector('[data-substack-action="comments"]');
  assert.equal(container.querySelector('.editorial-subscribe-fallback'), null);
  comment.click();
  assert.equal(dialog.open, true); assert.equal(doc.activeElement.textContent, ui.writingPage.cancel);
  assert.equal(dialog.querySelector('a').href, article.sourceUrl + '/comments');
  assert.equal(dialog.querySelector('a').target, '_blank');
  assert.equal(dialog.querySelector('p').textContent, ui.writingPage.commentsNotice);
  assert.equal(doc.body.style.overflow, 'hidden');
  dialog.querySelector('button').click();
  assert.equal(doc.activeElement, comment); assert.equal(doc.body.style.overflow, '');
  assert.equal(container.querySelector('iframe'), null);
  assert.equal(container.querySelector('form').action, 'https://phixalek.substack.com/subscribe');
  assert.equal(container.querySelector('form').method, 'get');
  const email = container.querySelector('input[type=email]'); email.value = 'example@example.org';
  const destination = new URL(container.querySelector('form').action);
  destination.search = new URLSearchParams(new dom.window.FormData(container.querySelector('form'))).toString();
  assert.equal(destination.searchParams.get('email'), 'example@example.org');
  assert.equal(destination.pathname, '/subscribe');
  email.value = 'invalid-address'; assert.equal(email.checkValidity(), false);
  assert.equal(container.querySelector('input[type=email]').required, true);
  dispose(); assert.equal(container.querySelector('dialog'), null); assert.equal(doc.body.style.overflow, '');
  comment.click(); assert.equal(container.querySelector('dialog'), null); dom.window.close();
});

test('local preview comments never redirect to a fictional Substack post', () => {
  const dom = new JSDOM(''), doc = dom.window.document;
  const section = ArticleComments({ ...article, localDemo: true }, { doc, ui, text });
  assert.equal(section.querySelector('button').disabled, true);
  assert.equal(section.querySelector('a'), null);
  assert.ok(section.textContent.includes(ui.writingPage.localCommentsNotice)); dom.window.close();
});

test('public comments remain read-only with an explicit external invitation and remaining-comments link', () => {
  const dom = new JSDOM(''), doc = dom.window.document;
  const section = ArticleComments({ ...article, engagement: { comments: 3, preview: [{ id: 1, author: 'PhixAlek', date: '2026-10-03T12:00:00Z', body: '<img onerror=bad>', avatar: null, likes: 2, isAuthor: true, replies: '2 replies' }] } }, { doc, ui, text });
  assert.equal(section.querySelector('.editorial-comment-body').textContent, '<img onerror=bad>');
  assert.equal(section.querySelector('.editorial-comment-body img'), null);
  assert.ok(section.querySelector('.editorial-comment-likes').classList.contains('has-reactions'));
  assert.equal(section.querySelector('.editorial-comment-replies').dataset.substackAction, 'comments');
  assert.equal(section.querySelector('.editorial-comment-more').textContent, '2 more comments…');
  assert.equal(section.querySelector('.editorial-comment-more').href, article.sourceUrl + '/comments');
  assert.equal(section.querySelector('form,input'), null);
  assert.equal(section.querySelector('textarea'), null);
  assert.equal(section.querySelector('.editorial-comment-cta').href, article.sourceUrl + '/comments'); dom.window.close();
});

test('comment invitation requests the provider notice before continuing in a new tab', () => {
  const dom = new JSDOM(''), doc = dom.window.document;
  const section = ArticleComments(article, { doc, ui, text, bind });
  const link = section.querySelector('.editorial-comment-cta');
  assert.equal(link.tagName, 'A'); assert.equal(link.href, article.sourceUrl + '/comments');
  assert.equal(link.target, '_blank');
  assert.equal(link.rel, 'noopener noreferrer');
  assert.equal(link.dataset.substackAction, 'comments');
  assert.equal(section.querySelector('textarea,form,[data-substack-draft]'), null);
  assert.equal(section.querySelector('.editorial-comment-invitation p'), null);
  assert.equal(section.querySelector('.editorial-comments-header [data-substack-action]'), null); dom.window.close();
});

test('imported replies expand locally and retain their parent hierarchy', () => {
  const dom = new JSDOM(''), doc = dom.window.document;
  const base = { author: 'PhixAlek', date: '2026-10-03T12:00:00Z', avatar: null, likes: 1, isAuthor: true, replies: '' };
  const root = { ...base, id: 1, body: 'Root', repliesPreview: [{ ...base, id: 2, parentId: 1, body: 'First reply' }, { ...base, id: 3, parentId: 2, body: 'Nested reply' }] };
  const section = ArticleComments({ ...article, engagement: { comments: 3, preview: [root] } }, { doc, ui, text });
  const thread = section.querySelector('details');
  assert.equal(thread.querySelector('summary').textContent, '2 replies');
  assert.equal(thread.open, false); thread.open = true;
  assert.ok(thread.textContent.includes('First reply')); assert.ok(thread.textContent.includes('Nested reply'));
  assert.equal(thread.querySelectorAll(':scope > ol > li ol').length, 1);
  assert.equal(thread.querySelector('[data-substack-action=comments]')?.textContent, ui.writingPage.reply);
  dom.window.close();
});

test('Latest comments shows only the three most recent root previews and preserves expandable replies', () => {
  const dom = new JSDOM(''), doc = dom.window.document;
  const base = { author: 'Reader', body: 'Comment', avatar: null, likes: 0, isAuthor: false, replies: '' };
  const preview = [1, 2, 3, 4].map(id => ({ ...base, id, date: `2026-10-0${id}T12:00:00Z` }));
  preview[3].repliesPreview = [{ ...base, id: 5, parentId: 4, date: '2026-10-05T12:00:00Z', body: 'Reply context' }];
  const section = ArticleComments({ ...article, engagement: { comments: 5, preview } }, { doc, ui, text, bind });
  assert.equal(section.querySelector('.editorial-latest-comments').textContent, ui.writingPage.latestComments);
  const roots = section.querySelectorAll('.editorial-comment-list > li'); assert.equal(roots.length, 3);
  assert.deepEqual([...roots].map(node => node.querySelector('time').dateTime), ['2026-10-04T12:00:00Z', '2026-10-03T12:00:00Z', '2026-10-02T12:00:00Z']);
  assert.ok(roots[0].querySelector('details').textContent.includes('Reply context'));
  assert.equal(preview.length, 4); assert.equal(preview[0].id, 1);
  assert.equal(section.querySelector('.editorial-comment-more').textContent, '2 more comments…');
  dom.window.close();
});

test('an empty published discussion says no comments without inventing recent previews', () => {
  const dom = new JSDOM('');
  const section = ArticleComments({ ...article, engagement: { likes: 0, comments: 0, preview: [] } }, { doc: dom.window.document, ui, text, bind });
  assert.equal(section.querySelector('.editorial-comments-empty').textContent, ui.writingPage.noComments);
  assert.equal(section.querySelector('.editorial-latest-comments'), null);
  assert.equal(section.querySelector('.editorial-comment-cta').dataset.substackAction, 'comments');
  dom.window.close();
});

test('shell notice covers provider links, preserves destinations and exempts only Terms', () => {
  const dom = new JSDOM('<main></main>'), doc = dom.window.document, container = doc.querySelector('main');
  const dispose = mountSubstackInteractions(container, { outboundLinks: true, newsletter: false, ui, text, bind });
  const dialog = container.querySelector('dialog');
  dialog.showModal = () => { dialog.open = true; };
  dialog.close = () => { dialog.open = false; dialog.dispatchEvent(new dom.window.Event('close')); };
  for (const href of [article.sourceUrl + '/comments', 'https://substack.com/@phixalek', 'https://phixalek.substack.com/', article.sourceUrl]) {
    const link = doc.createElement('a'); link.href = href; container.append(link);
    const event = new dom.window.MouseEvent('click', { bubbles: true, cancelable: true });
    link.dispatchEvent(event);
    assert.equal(event.defaultPrevented, true); assert.equal(dialog.open, true);
    assert.equal(dialog.querySelector('a').href, href);
    assert.equal(dialog.querySelector('a').target, '_blank');
    dialog.querySelector('button').click(); assert.equal(doc.activeElement, link);
    link.remove();
  }
  for (const href of ['https://substack.com/tos', 'https://example.org/', 'https://substack.com.example.org/', '/blog/']) {
    const link = doc.createElement('a'); link.href = href; container.append(link);
    // Stop browser navigation separately, after verifying our listener leaves it alone.
    const event = new dom.window.MouseEvent('click', { bubbles: true, cancelable: true });
    container.addEventListener('click', e => { assert.equal(e.defaultPrevented, false); e.preventDefault(); }, { once: true });
    link.dispatchEvent(event); assert.equal(dialog.open, false); link.remove();
  }
  dispose(); assert.equal(doc.body.style.overflow, ''); dom.window.close();
});

test('subscription validates the email and carries it through the cancelable notice without submitting it', () => {
  const dom = new JSDOM('<main></main>'), doc = dom.window.document, container = doc.querySelector('main');
  const dispose = mountSubstackInteractions(container, { ui, text, bind });
  const dialog = container.querySelector('dialog'), form = container.querySelector('form'), email = form.querySelector('input');
  dialog.showModal = () => { dialog.open = true; };
  dialog.close = () => { dialog.open = false; dialog.dispatchEvent(new dom.window.Event('close')); };
  email.value = 'invalid';
  form.dispatchEvent(new dom.window.Event('submit', { bubbles: true, cancelable: true })); assert.equal(dialog.open, false);
  email.value = 'example@example.org';
  const event = new dom.window.Event('submit', { bubbles: true, cancelable: true }); form.dispatchEvent(event);
  assert.equal(event.defaultPrevented, true); assert.equal(dialog.open, true);
  const destination = new URL(dialog.querySelector('a').href);
  assert.equal(destination.pathname, '/subscribe'); assert.equal(destination.searchParams.get('email'), email.value);
  dialog.querySelector('button').click(); assert.equal(email.value, 'example@example.org'); assert.equal(doc.body.style.overflow, '');
  dispose(); dom.window.close();
});

test('shell and article controllers do not intercept each other’s confirmation links or open two notices', () => {
  const dom = new JSDOM('<div id="shell"><main></main></div>'), doc = dom.window.document;
  const shell = doc.querySelector('#shell'), page = doc.querySelector('main');
  page.append(ArticleComments(article, { doc, ui, text }));
  const cleanupShell = mountSubstackInteractions(shell, { outboundLinks: true, newsletter: false, ui, text, bind });
  const cleanupPage = mountSubstackInteractions(page, { article, ui, text, bind });
  for (const dialog of shell.querySelectorAll('dialog')) {
    dialog.showModal = () => { dialog.open = true; };
    dialog.close = () => { dialog.open = false; dialog.dispatchEvent(new dom.window.Event('close')); };
  }
  page.querySelector('[data-substack-action=comments]').click();
  assert.equal(shell.querySelectorAll('dialog[open]').length, 1);
  const proceed = page.querySelector('dialog a');
  shell.addEventListener('click', e => { assert.equal(e.defaultPrevented, false); e.preventDefault(); }, { once: true });
  proceed.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true, cancelable: true }));
  assert.equal(shell.querySelectorAll('dialog[open]').length, 0);
  cleanupPage(); cleanupShell(); dom.window.close();
});

test('comment likes open the exact public comment through the provider notice without changing its count', () => {
  const dom = new JSDOM('<main></main>'), doc = dom.window.document, container = doc.querySelector('main');
  const sourceUrl = 'https://substack.com/profile/554545303-phixalek/note/c-351689555';
  container.append(ArticleComments({ ...article, engagement: { comments: 1, preview: [{ id: 351689555, sourceUrl, author: 'PhixAlek', date: '2026-10-03T12:00:00Z', body: 'A public comment', likes: 2, replies: '' }] } }, { doc, ui, text }));
  const dispose = mountSubstackInteractions(container, { article, ui, text, bind });
  const dialog = container.querySelector('dialog');
  dialog.showModal = () => { dialog.open = true; };
  dialog.close = () => { dialog.open = false; dialog.dispatchEvent(new dom.window.Event('close')); };
  const like = container.querySelector('.editorial-comment-likes');
  assert.equal(like.tagName, 'A'); assert.equal(like.href, sourceUrl); assert.equal(like.target, '_blank');
  like.click(); assert.equal(dialog.open, true);
  assert.equal(dialog.querySelector('a').href, sourceUrl);
  assert.equal(dialog.querySelector('p').textContent, ui.writingPage.likesNotice);
  assert.equal(like.textContent, '♡ 2'); dialog.querySelector('button').click();
  assert.equal(doc.activeElement, like); dispose(); dom.window.close();
});
