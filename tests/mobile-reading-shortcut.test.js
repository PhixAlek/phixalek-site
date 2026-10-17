import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { mountMobileReadingShortcut } from '../src/js/modules/header/mobile-reading-shortcut.js';

function fixture() {
  const dom = new JSDOM('<button id="shortcut"></button><main class="writing-page" data-writing-view="index"><div class="editorial-toolbar"><button>All</button></div></main>');
  const doc = dom.window.document, button = doc.getElementById('shortcut'), page = doc.querySelector('main');
  const timers = new Map(), calls = [];
  let next = 0, reduced = false;
  const view = {
    matchMedia: query => ({ matches: query.includes('reduced') ? reduced : true }),
    setTimeout: callback => { timers.set(++next, callback); return next; },
    clearTimeout: id => timers.delete(id), scrollTo: options => calls.push(['top', options]),
    addEventListener() {}, removeEventListener() {},
  };
  page.querySelector('.editorial-toolbar').scrollIntoView = options => calls.push(['filters', options]);
  const dispose = mountMobileReadingShortcut(button, { doc, view });
  const tap = () => button.dispatchEvent(new dom.window.MouseEvent('click', { detail: 1 }));
  const flush = () => { const pending = [...timers.values()]; timers.clear(); pending.forEach(callback => callback()); };
  return { doc, dom, page, button, tap, flush, calls, timers, dispose, reduce: () => { reduced = true; } };
}

test('one tap returns to filters; two taps cancel the single action and return to page top', () => {
  const f = fixture(); f.tap(); assert.equal(f.calls.length, 0); f.flush();
  assert.deepEqual(f.calls, [['filters', { block: 'start', behavior: 'smooth' }]]);
  f.calls.length = 0; f.tap(); f.tap(); f.flush();
  assert.deepEqual(f.calls, [['top', { top: 0, behavior: 'smooth' }]]);
  f.dispose(); f.dom.window.close();
});

test('keyboard activation is immediate, reduced motion is respected and stale navigation is ignored', () => {
  const f = fixture(); f.reduce(); f.button.click();
  assert.equal(f.calls[0][1].behavior, 'instant');
  assert.equal(f.doc.activeElement.textContent, 'All');
  f.calls.length = 0; f.tap(); f.page.remove(); f.flush(); assert.equal(f.calls.length, 0);
  f.tap(); f.dispose(); assert.equal(f.timers.size, 0); f.dom.window.close();
});

test('Home uses Latest Writing for a tap and page top for a double tap', () => {
  const f = fixture(); f.page.remove();
  const home = f.doc.createElement('main'); home.className = 'site';
  home.innerHTML = '<section id="writing"><button>View all posts</button></section>';
  f.doc.body.append(home);
  home.querySelector('#writing').scrollIntoView = options => f.calls.push(['writing', options]);
  f.tap(); f.flush(); assert.equal(f.calls[0][0], 'writing');
  f.calls.length = 0; f.tap(); f.tap(); f.flush(); assert.equal(f.calls[0][0], 'top');
  home.hidden = true; f.calls.length = 0; f.tap(); f.flush(); assert.equal(f.calls.length, 0);
  f.dispose(); f.dom.window.close();
});
