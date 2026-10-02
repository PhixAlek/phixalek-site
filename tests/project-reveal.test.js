import test from 'node:test';
import assert from 'node:assert/strict';
import { mountReveal } from '../src/js/modules/common/reveal.js';

function fixture(reduce = false, supported = true) {
  const classes = new Set();
  const project = { classList: { add: c => classes.add(c), remove: c => classes.delete(c) } };
  const events = new Map();
  let callback, disconnected = false;
  const preference = { matches: reduce, addEventListener: (key, fn) => events.set(key, fn), removeEventListener: key => events.delete(key) };
  const root = { querySelectorAll: () => [project], addEventListener: (key, fn) => events.set(key, fn), removeEventListener: key => events.delete(key) };
  const view = { matchMedia: () => preference };
  if (supported) view.IntersectionObserver = class {
    constructor(fn) { callback = fn; }
    observe() {}
    unobserve() {}
    disconnect() { disconnected = true; }
  };
  return { classes, project, root, view, events, enter: () => callback([{ target: project, isIntersecting: true }]), disconnected: () => disconnected };
}

test('projects stay visible without motion or observer support', () => {
  for (const state of [fixture(true), fixture(false, false)]) {
    mountReveal(state.root, state.view);
    assert.equal(state.classes.size, 0);
  }
});
test('entering the viewport reveals a project once; cleanup leaves it visible', () => {
  const state = fixture();
  const cleanup = mountReveal(state.root, state.view);
  assert.ok(state.classes.has('project-pending'));
  state.enter();
  assert.equal(state.classes.size, 0);
  cleanup();
  assert.ok(state.disconnected());
});
test('keyboard focus and changing motion preference never leave content hidden', () => {
  const state = fixture();
  mountReveal(state.root, state.view);
  state.events.get('focusin')({ target: { closest: () => state.project } });
  assert.equal(state.classes.size, 0);
  state.events.get('change')({ matches: true });
  assert.ok(state.disconnected());
  assert.equal(state.events.size, 0);
});
test('evidence shares the reveal safeguards with its own pending state', () => {
  const state = fixture();
  mountReveal(state.root, state.view, { selector: '.evidence-item', pendingClass: 'evidence-pending' });
  assert.ok(state.classes.has('evidence-pending'));
  state.events.get('change')({ matches: true });
  assert.equal(state.classes.size, 0);
  assert.ok(state.disconnected());
});
