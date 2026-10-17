import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';
import { motionLetters } from '../src/js/modules/common/text-motion.js';

test('language animation never turns decorative letters into project tag capsules', () => {
  const css = readFileSync(new URL('../src/css/styles.css', import.meta.url), 'utf8');
  const tagRules = css.match(/[^{}]*\.tags[^{}]*\{[^{}]*\}/g).join('\n');
  const dom = new JSDOM(`<style>${tagRules}</style><article class="project"><div class="tags"><span class="tag-primary">Integraciones</span></div></article>`);
  const previous = globalThis.document;
  globalThis.document = dom.window.document;
  try {
    const tag = document.querySelector('.tags > span');
    motionLetters(tag);
    assert.equal(dom.window.getComputedStyle(tag).paddingTop, '8px');
    const letters = tag.querySelectorAll('.language-wave-letter');
    assert.equal(letters.length, 'Integraciones'.length);
    for (const node of tag.querySelectorAll('span')) {
      assert.notEqual(dom.window.getComputedStyle(node).paddingTop, '8px');
      assert.equal(parseFloat(dom.window.getComputedStyle(node).borderTopWidth) || 0, 0);
    }
    motionLetters(tag);
    assert.equal(tag.querySelectorAll('.language-wave-letter').length, letters.length);
  } finally {
    globalThis.document = previous;
    dom.window.close();
  }
});
