import test from 'node:test';
import assert from 'node:assert/strict';
import { createDisclosure } from '../src/js/modules/common/disclosure.js';

function fixture(reduced = false) {
  const animations = [];
  const panel = {
    hidden: true, inert: false, scrollHeight: 180,
    getBoundingClientRect: () => ({ height: 90 }),
    animate() {
      let finish, reject;
      const animation = { finished: new Promise((resolve, fail) => { finish = resolve; reject = fail; }),
        finish: () => finish(), cancel: () => reject(new Error('Cancelled')) };
      animations.push(animation);
      return animation;
    },
  };
  const view = { getComputedStyle: () => ({ opacity: '.5' }), matchMedia: () => ({ matches: reduced }) };
  return { panel, view, animations };
}

test('closing removes interaction immediately and hides only after the transition', async () => {
  const { panel, view, animations } = fixture();
  const setOpen = createDisclosure(panel, { view });
  const opening = setOpen(true);
  assert.equal(panel.hidden, false);
  assert.equal(panel.inert, false);
  animations[0].finish(); await opening;
  const closing = setOpen(false);
  assert.equal(panel.hidden, false);
  assert.equal(panel.inert, true);
  animations[1].finish(); await closing;
  assert.equal(panel.hidden, true);
});

test('a cancelled closing cannot hide a reopened panel or run stale callbacks', async () => {
  const { panel, view, animations } = fixture();
  const completed = [];
  const setOpen = createDisclosure(panel, { view, onFinish: open => completed.push(open) });
  const opening = setOpen(true);
  const closing = setOpen(false);
  const reopening = setOpen(true);
  animations[2].finish();
  await Promise.all([opening, closing, reopening]);
  assert.equal(panel.hidden, false);
  assert.equal(panel.inert, false);
  assert.deepEqual(completed, [true]);
});

test('reduced motion updates visibility without animation', async () => {
  const { panel, view, animations } = fixture(true);
  const setOpen = createDisclosure(panel, { view });
  await setOpen(true);
  assert.equal(panel.hidden, false);
  await setOpen(false);
  assert.equal(panel.hidden, true);
  assert.equal(animations.length, 0);
});

test('About can prepare its lines immediately, including after an interrupted close', async () => {
  const { panel, view, animations } = fixture();
  const completed = [];
  const setOpen = createDisclosure(panel, { view, openDuration: 0, onFinish: open => completed.push(open) });
  await setOpen(true);
  assert.deepEqual(completed, [true]);
  assert.equal(animations.length, 0);
  const closing = setOpen(false);
  await setOpen(true);
  await closing;
  assert.equal(panel.hidden, false);
  assert.equal(panel.inert, false);
  assert.deepEqual(completed, [true, true]);
});
