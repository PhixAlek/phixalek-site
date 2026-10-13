import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { mountReaderContents } from '../src/js/modules/writing/components/reader-contents.js';

function fixture(html) {
  const dom = new JSDOM(`<div id="layout"><article><h1>Article title</h1><div id="prose">${html}</div></article></div>`);
  const doc = dom.window.document, layout = doc.getElementById('layout'), story = doc.querySelector('article'), prose = doc.getElementById('prose');
  const media = { matches: false, addEventListener(_, callback) { this.change = callback; }, removeEventListener() { this.change = null; } };
  let disconnected = false;
  const view = { matchMedia: () => media, IntersectionObserver: class { observe() {} disconnect() { disconnected = true; } } };
  const dispose = mountReaderContents(layout, story, prose, { doc, view, label: node => { node.textContent = 'On this page'; } });
  return { dom, doc, layout, story, prose, media, dispose, disconnected: () => disconnected };
}

test('reader keeps one h1, unique focusable headings and a labeled mobile index', () => {
  const f = fixture('<h1>Introduction</h1><h2 id="same">Projects</h2><h3 id="same">Details</h3><p>Original body.</p>');
  assert.equal(f.doc.querySelectorAll('h1').length, 1);
  const headings = [...f.prose.querySelectorAll('h2,h3')];
  assert.equal(new Set(headings.map(node => node.id)).size, 3);
  assert.ok(headings.every(node => node.tabIndex === -1));
  const panel = f.doc.querySelector('details');
  assert.equal(panel.parentElement, f.story); assert.equal(panel.open, false);
  assert.equal(panel.querySelector('nav').getAttribute('aria-labelledby'), panel.querySelector('summary').id);
  assert.equal(panel.querySelectorAll('a').length, 3);
  assert.ok(f.prose.textContent.includes('Original body.'));
  panel.open = true; panel.querySelectorAll('a')[1].click();
  assert.equal(panel.open, false); assert.equal(panel.querySelectorAll('a')[1].getAttribute('aria-current'), 'location');
  f.media.matches = true; f.media.change();
  assert.equal(panel.parentElement, f.layout); assert.equal(panel.open, true);
  f.dispose(); assert.equal(f.disconnected(), true); assert.equal(f.media.change, null); f.dom.window.close();
});

test('articles without section headings do not create an empty index', () => {
  const f = fixture('<p>Short post without sections.</p>');
  assert.equal(f.doc.querySelector('details'), null);
  assert.equal(f.layout.classList.contains('without-toc'), true);
  f.dispose(); f.dom.window.close();
});

test('reopening the mobile index returns to the last selected row instead of its beginning', () => {
  const f = fixture('<h2>First</h2><h2>Second</h2><h2>Third</h2>');
  const panel = f.doc.querySelector('details'), nav = panel.querySelector('nav'), last = nav.querySelectorAll('a')[2];
  Object.defineProperty(nav, 'clientHeight', { value: 200 });
  nav.getBoundingClientRect = () => ({ top: 0 });
  last.getBoundingClientRect = () => ({ top: 520, height: 40 });
  panel.open = true; last.click(); assert.equal(panel.open, false);
  panel.open = true; panel.dispatchEvent(new f.dom.window.Event('toggle'));
  assert.equal(nav.scrollTop, 440);
  assert.equal(last.getAttribute('aria-current'), 'location');
  f.media.matches = true; nav.scrollTop = 0;
  panel.dispatchEvent(new f.dom.window.Event('toggle')); assert.equal(nav.scrollTop, 0);
  f.dispose(); f.dom.window.close();
});
