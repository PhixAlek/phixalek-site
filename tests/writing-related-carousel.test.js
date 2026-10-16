import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { mountRelatedCarousel } from '../src/js/modules/writing/components/related-carousel.js';

test('related carousel advances every ten seconds only while visible mobile content is idle', async () => {
  const dom = new JSDOM('<div id="cards" tabindex="0"><article></article><article></article><article></article></div><div><span data-carousel-dot="0"></span><span data-carousel-dot="1"></span><span data-carousel-dot="2"></span></div>', { pretendToBeVisual: true });
  const list = dom.window.document.querySelector('#cards');
  [...list.children].forEach((card, index) => Object.defineProperty(card, 'offsetLeft', { value: index * 358 }));
  const mobile = new dom.window.EventTarget(), reduced = new dom.window.EventTarget();
  mobile.matches = true; reduced.matches = false;
  let observe, disconnected = false, serial = 0;
  const timers = new Map(), moves = [];
  list.scrollTo = options => { moves.push(options); list.scrollLeft = options.left; };
  const view = {
    matchMedia: query => query.includes('max-width') ? mobile : reduced,
    IntersectionObserver: class { constructor(callback) { observe = callback; } observe() {} disconnect() { disconnected = true; } },
    setTimeout: (callback, delay) => { timers.set(++serial, { callback, delay }); return serial; },
    clearTimeout: id => timers.delete(id), queueMicrotask,
  };
  const dispose = mountRelatedCarousel(list, { view });
  const dots = [...dom.window.document.querySelectorAll('[data-carousel-dot]')];
  assert.equal(dots[0].classList.contains('is-active'), true);
  assert.equal(timers.size, 0);
  observe([{ isIntersecting: true, intersectionRatio: 1 }]);
  const tick = () => { const [id, task] = [...timers][0]; timers.delete(id); assert.equal(task.delay, 10000); task.callback(); };
  tick(); assert.deepEqual(moves[0], { left: 358, behavior: 'smooth' });
  list.dispatchEvent(new dom.window.Event('scroll'));
  assert.deepEqual(dots.map(dot => dot.classList.contains('is-active')), [false, true, false]);
  tick(); assert.equal(moves[1].left, 716);
  tick(); assert.equal(moves[2].left, 0);
  list.focus(); assert.equal(timers.size, 0);
  list.blur(); await Promise.resolve(); assert.equal(timers.size, 1);
  observe([{ isIntersecting: false, intersectionRatio: 0 }]); assert.equal(timers.size, 0);
  observe([{ isIntersecting: true, intersectionRatio: 1 }]);
  reduced.matches = true; reduced.dispatchEvent(new dom.window.Event('change')); assert.equal(timers.size, 0);
  reduced.matches = false; mobile.matches = false; mobile.dispatchEvent(new dom.window.Event('change')); assert.equal(timers.size, 0);
  mobile.matches = true; mobile.dispatchEvent(new dom.window.Event('change')); assert.equal(timers.size, 1);
  Object.defineProperty(dom.window.document, 'hidden', { value: true, configurable: true });
  dom.window.document.dispatchEvent(new dom.window.Event('visibilitychange')); assert.equal(timers.size, 0);
  Object.defineProperty(dom.window.document, 'hidden', { value: false, configurable: true });
  dom.window.document.dispatchEvent(new dom.window.Event('visibilitychange')); assert.equal(timers.size, 1);
  dispose(); assert.equal(timers.size, 0); assert.equal(disconnected, true);
  mobile.dispatchEvent(new dom.window.Event('change')); assert.equal(timers.size, 0);
  dom.window.close();
});
