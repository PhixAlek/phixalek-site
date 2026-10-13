import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { mountNavigationLoading } from '../src/js/modules/common/navigation-loading.js';

test('navigation indicator follows visible footer, hides after navigation and releases listeners', () => {
  const dom = new JSDOM('<header></header><footer></footer>');
  const view = dom.window, doc = view.document;
  const header = doc.querySelector('header'), footer = doc.querySelector('footer');
  let top = 2000;
  footer.getBoundingClientRect = () => ({ top, bottom: top + 100 });
  const dispose = mountNavigationLoading(header, footer, { view, doc });
  const bar = header.querySelector('.navigation-loading-bar'); assert.equal(bar.hidden, true);
  const notify = active => doc.dispatchEvent(new view.CustomEvent('site:navigation-loading', { detail: { active } }));
  notify(true); assert.equal(bar.hidden, false); assert.equal(bar.parentElement, header);
  top = 400; view.dispatchEvent(new view.Event('scroll'));
  assert.equal(bar.parentElement, footer); assert.equal(bar.classList.contains('at-footer'), true);
  notify(false); assert.equal(bar.hidden, true);
  dispose(); notify(true); assert.equal(bar.isConnected, false); dom.window.close();
});

test('navigation preserves shell height until rendering and scroll restoration finish', () => {
  const dom = new JSDOM('<div id="app"><header></header><main></main><footer></footer></div>');
  const view = dom.window, doc = view.document, shell = doc.getElementById('app');
  shell.style.minHeight = '100vh';
  Object.defineProperty(doc.documentElement, 'scrollHeight', { value: 2400 });
  const dispose = mountNavigationLoading(doc.querySelector('header'), doc.querySelector('footer'), { view, doc, shell });
  const notify = active => doc.dispatchEvent(new view.CustomEvent('site:navigation-loading', { detail: { active } }));
  notify(true); assert.equal(shell.style.minHeight, '2400px');
  doc.querySelector('main').remove(); notify(true); assert.equal(shell.style.minHeight, '2400px');
  notify(false); assert.equal(shell.style.minHeight, '100vh');
  notify(true); dispose(); assert.equal(shell.style.minHeight, '100vh'); dom.window.close();
});
