import test from 'node:test';
import assert from 'node:assert/strict';
import { mountRouter, resolveSiteRoute } from '../src/js/modules/writing/router.js';

function harness(path = '/') {
  const events = new Map(), documentEvents = new Map(), rendered = [], scrolls = [];
  const entries = [{ url: new URL(path, 'https://phixalek.com'), state: {} }];
  let index = 0;
  const target = { setAttribute() {}, focus() {}, scrollIntoView() { scrolls.push('anchor'); } };
  const view = {
    get location() { return entries[index].url; }, scrollY: 120,
    scrollTo(x, y) { scrolls.push(y); },
    addEventListener(name, fn) { events.set(name, fn); }, removeEventListener(name) { events.delete(name); },
    history: {
      scrollRestoration: 'auto', get state() { return entries[index].state; },
      replaceState(state, _, url) { entries[index] = { state, url: new URL(url) }; },
      pushState(state, _, url) { entries.splice(index + 1); entries.push({ state, url: new URL(url) }); index++; },
    },
  };
  const doc = {
    addEventListener(name, fn) { documentEvents.set(name, fn); }, removeEventListener(name) { documentEvents.delete(name); },
    getElementById(id) { return ['main-content', 'work'].includes(id) ? target : null; },
  };
  const router = mountRouter(async route => { rendered.push(route); }, { view, doc });
  return { router, view, rendered, scrolls, events, documentEvents, entries,
    async move(delta) { index += delta; await events.get('popstate')(); },
  };
}

test('direct article URLs and reload initialize the matching route', async () => {
  for (const path of ['/blog', '/blog/post', '/blog/post/']) {
    const h = harness(path); await h.router.ready;
    assert.deepEqual(h.rendered[0], resolveSiteRoute(new URL(path, 'https://phixalek.com').pathname));
    h.router.destroy();
    assert.equal(h.view.history.scrollRestoration, 'auto');
    assert.equal(h.events.size, 0);
  }
});

test('Home, index, article and browser back/forward preserve route and scroll', async () => {
  const h = harness(); await h.router.ready;
  await h.router.navigate('/blog'); await h.router.navigate('/blog/post');
  await h.move(-1); assert.equal(h.rendered.at(-1).kind, 'index');
  assert.equal(h.scrolls.at(-1), 120);
  await h.move(-1); assert.equal(h.rendered.at(-1).kind, 'home');
  await h.move(1); assert.equal(h.rendered.at(-1).kind, 'index');
  await h.move(1); assert.equal(h.rendered.at(-1).slug, 'post');
});

test('cross-page links arrive at Home sections and malformed hashes do not crash', async () => {
  const h = harness('/blog/post'); await h.router.ready;
  await h.router.navigate('/#work');
  assert.equal(h.rendered.at(-1).kind, 'home'); assert.equal(h.scrolls.at(-1), 'anchor');
  await h.router.navigate('/#%invalid'); assert.equal(h.rendered.at(-1).kind, 'home');
});

test('native anchors, external URLs, modified clicks and new tabs remain native', async () => {
  const h = harness(); await h.router.ready;
  for (const options of [
    { href: '/#work' }, { href: 'https://substack.com' }, { href: '/blog', ctrlKey: true },
    { href: '/blog', target: '_blank' }, { href: '/blog', download: true },
  ]) {
    let prevented = false;
    const link = { href: new URL(options.href, h.view.location).href, target: options.target,
      hasAttribute: name => name === 'download' && options.download };
    h.documentEvents.get('click')({ button: 0, ...options, target: { closest: () => link }, preventDefault() { prevented = true; } });
    assert.equal(prevented, false);
  }
  assert.equal(h.entries.length, 1);
});

test('rapid navigation invalidates earlier lazy renders', async () => {
  const h = harness(); await h.router.ready;
  const valid = []; const gates = [];
  h.router.destroy();
  const router = mountRouter(async (route, current) => {
    if (route.kind === 'home') return;
    await new Promise(resolve => gates.push(resolve));
    valid.push(current());
  }, { view: h.view, doc: { ...{ addEventListener() {}, removeEventListener() {}, getElementById() {} } } });
  await router.ready;
  const first = router.navigate('/blog'), second = router.navigate('/blog/post');
  gates[1](); await second; gates[0](); await first;
  assert.deepEqual(valid, [true, false]);
});

test('invalid or foreign paths are not treated as real articles', () => {
  assert.equal(resolveSiteRoute('/blog/a/b').kind, 'not-found');
  assert.equal(resolveSiteRoute('/missing').kind, 'not-found');
});

test('Back to top stays in the article without recreating it or adding a history step', async () => {
  const h = harness('/blog/post'); await h.router.ready;
  let prevented = false;
  const link = { href: 'https://phixalek.com/blog/post#main-content', hasAttribute: () => false };
  h.documentEvents.get('click')({ button: 0, target: { closest: () => link }, preventDefault() { prevented = true; } });
  assert.equal(prevented, true);
  assert.equal(h.view.location.pathname, '/blog/post');
  assert.equal(h.view.location.hash, '#main-content');
  assert.equal(h.entries.length, 1);
  assert.equal(h.rendered.length, 1);
  assert.equal(h.scrolls.at(-1), 'anchor');
});

test('the contextual back arrow uses history when an article was opened from Home', async () => {
  const h = harness('/#writing'); await h.router.ready;
  await h.router.navigate('/blog/post');
  let returned = false;
  h.view.history.back = () => { returned = true; };
  const link = { href: 'https://phixalek.com/blog', hasAttribute: name => name === 'data-route-back' };
  h.documentEvents.get('click')({ button: 0, target: { closest: () => link }, preventDefault() {} });
  assert.equal(returned, true);
});
