import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { mountWritingArrivalWave } from '../src/js/modules/writing/components/arrival-wave.js';

test('Writing wave responds to arrival only, respects reduced motion and releases its listener', t => {
  const dom = new JSDOM('<main><div class="editorial-intro"><h1>Notes, lessons and progress.</h1></div></main>');
  const view = dom.window, doc = view.document, page = doc.querySelector('main');
  const previous = globalThis.document; globalThis.document = doc;
  t.after(() => { globalThis.document = previous; dom.window.close(); });
  let reduced = false, animations = 0;
  view.matchMedia = () => ({ matches: reduced });
  view.HTMLElement.prototype.getAnimations = () => [];
  view.HTMLElement.prototype.animate = () => { animations++; };
  const dispose = mountWritingArrivalWave(page, { doc, view });
  assert.equal(animations, 0);
  const arrive = () => doc.dispatchEvent(new view.CustomEvent('site:writing-arrived'));
  arrive(); assert.ok(animations > 0);
  const count = animations; reduced = true; arrive(); assert.equal(animations, count);
  reduced = false; page.hidden = true; arrive(); assert.equal(animations, count);
  page.hidden = false; dispose(); arrive(); assert.equal(animations, count);
});
