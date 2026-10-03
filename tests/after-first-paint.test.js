import test from 'node:test';
import assert from 'node:assert/strict';
import { afterFirstPaint } from '../src/js/modules/common/after-first-paint.js';

test('optional network work waits until the mounted page has had a paint opportunity', () => {
  const frames = [];
  let requests = 0;
  afterFirstPaint(() => { requests++; }, { requestAnimationFrame: fn => frames.push(fn) });
  assert.equal(requests, 0);
  frames.shift()();
  assert.equal(requests, 0);
  frames.shift()();
  assert.equal(requests, 1);
  assert.equal(frames.length, 0);
});

test('the fallback still schedules work asynchronously without animation frames', () => {
  let task, requests = 0;
  afterFirstPaint(() => { requests++; }, { setTimeout: fn => { task = fn; } });
  assert.equal(requests, 0);
  task();
  assert.equal(requests, 1);
});
