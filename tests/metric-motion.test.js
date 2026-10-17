import test from 'node:test';
import assert from 'node:assert/strict';
import { mountMetricMotion } from '../src/js/modules/common/metric-motion.js';

function fixture({ mobile = false, paused = false } = {}) {
  const calls = [];
  let observer, center = 360;
  const node = name => ({
    animate() {
      let finish;
      const animation = { finished: new Promise(resolve => { finish = resolve; }), cancel() {}, finish: () => finish() };
      calls.push({ name, animation });
      return animation;
    },
    getAnimations: () => [],
  });
  const items = ['web', 'clinical', 'teaching'].map(id => {
    const events = new Map();
    const symbols = id === 'clinical' ? ['before', 'arrow', 'after'].map(motion =>
      ({ ...node(motion), dataset: { motion } })) : [];
    const count = node(`${id}-count`), plus = node(`${id}-plus`);
    const item = { dataset: { metric: id }, events,
      addEventListener: (type, handler) => events.set(type, handler),
      querySelectorAll: () => symbols,
      querySelector: selector => selector === '.evidence-value' ? value : selector === '.metric-count' ? count : plus,
    };
    const value = { closest: () => item, getBoundingClientRect: () => ({ top: center - 20, bottom: center + 20 }) };
    return { item, value };
  });
  const preference = { matches: false, addEventListener() {} };
  const view = { innerHeight: 720, matchMedia: query => query.includes('max-width') ? { matches: mobile } : preference, addEventListener() {},
    IntersectionObserver: class {
      constructor(callback) { observer = callback; }
      observe() {} disconnect() {}
    },
  };
  const main = { hidden: false, dataset: { navigationReady: paused ? 'false' : 'true' } };
  mountMetricMotion({ closest: () => main, querySelectorAll: () => items.map(entry => entry.item) }, view);
  return { calls, items, main, enter: () => observer([{ target: items[1].value, isIntersecting: true, intersectionRatio: 1 }]),
    leave: () => { center = 1000; observer([{ target: items[1].value, isIntersecting: false, intersectionRatio: 0 }]); } };
}
const flush = () => new Promise(resolve => setImmediate(resolve));

test('metrics wait for Home arrival even if a value crosses the center while navigating', () => {
  const state = fixture({ paused: true });
  state.enter(); assert.equal(state.calls.length, 0);
  state.items[0].item.events.get('pointerenter')(); assert.equal(state.calls.length, 0);
  state.main.dataset.navigationReady = 'true';
  state.enter(); assert.deepEqual(state.calls.map(call => call.name), ['before', 'arrow', 'after']);
});

test('time animates first, then both counts, even when scrolling away from center', async () => {
  const state = fixture();
  state.enter();
  assert.deepEqual(state.calls.map(call => call.name), ['before', 'arrow', 'after']);
  state.leave();
  state.calls.forEach(call => call.animation.finish());
  await flush();
  assert.deepEqual(state.calls.slice(3).map(call => call.name), ['web-count', 'web-plus', 'teaching-count', 'teaching-plus']);
});

test('hover animates only the hovered metric, even outside the center', () => {
  const state = fixture();
  state.leave();
  state.items[0].item.events.get('pointerenter')();
  assert.deepEqual(state.calls.map(call => call.name), ['web-count', 'web-plus']);
  state.items[2].item.events.get('pointerenter')();
  assert.deepEqual(state.calls.slice(2).map(call => call.name), ['teaching-count', 'teaching-plus']);
  state.items[1].item.events.get('pointerenter')();
  assert.deepEqual(state.calls.slice(4).map(call => call.name), ['before', 'arrow', 'after']);
});

test('independent time hover preserves the automatic order after its restarted run', async () => {
  const state = fixture();
  state.enter();
  state.items[1].item.events.get('pointerenter')();
  state.calls.slice(0, 3).forEach(call => call.animation.finish());
  await flush();
  assert.equal(state.calls.length, 6);
  state.leave();
  state.calls.slice(3).forEach(call => call.animation.finish());
  await flush();
  assert.deepEqual(state.calls.slice(6).map(call => call.name), ['web-count', 'web-plus', 'teaching-count', 'teaching-plus']);
});


test('mobile plays time, years and teaching sequentially; touch does not interrupt', async () => {
  const state = fixture({ mobile: true });
  state.enter();
  state.items[0].item.events.get('pointerenter')({ pointerType: 'touch' });
  assert.deepEqual(state.calls.map(call => call.name), ['before', 'arrow', 'after']);
  state.calls.forEach(call => call.animation.finish());
  await flush();
  assert.deepEqual(state.calls.slice(3).map(call => call.name), ['web-count', 'web-plus']);
  state.calls.slice(3).forEach(call => call.animation.finish());
  await flush();
  assert.deepEqual(state.calls.slice(5).map(call => call.name), ['teaching-count', 'teaching-plus']);
});
