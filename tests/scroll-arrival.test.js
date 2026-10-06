import test from 'node:test';
import assert from 'node:assert/strict';
import { afterScrollArrival } from '../src/js/modules/common/scroll-arrival.js';

test('arrival waits for stable scrolling before page cues can start', async () => {
  const frames = [];
  const view = { scrollY: 0, requestAnimationFrame: callback => frames.push(callback) };
  let arrived = false;
  const pending = afterScrollArrival(view).then(value => { arrived = value; });
  for (const position of [0, 20, 50, 90, 90, 90, 90]) {
    view.scrollY = position; frames.shift()(); await Promise.resolve();
    assert.equal(arrived, false);
  }
  frames.shift()(); await pending;
  assert.equal(arrived, true);
});
test('leaving or superseding Home cancels the pending arrival cue', async () => {
  const frames = [];
  const view = { scrollY: 0, requestAnimationFrame: callback => frames.push(callback) };
  let current = true;
  const pending = afterScrollArrival(view, () => current);
  frames.shift()(); current = false; frames.shift()();
  assert.equal(await pending, false);
});
