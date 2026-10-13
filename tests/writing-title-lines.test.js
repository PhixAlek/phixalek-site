import test from 'node:test';
import assert from 'node:assert/strict';
import { splitTitleLines } from '../src/js/modules/writing/components/title-lines.js';

test('two decorative lines favor a shorter first line without losing original text', () => {
  for (const title of [
    '[Demo] From a commit to a working build',
    '[Demo] Notes from a week of building',
    '[Demo] Small Angular components, clearer interfaces',
    '[Demo] What a small game prototype can teach us',
    'Notas  de una semana de aprendizaje',
  ]) {
    const parts = splitTitleLines(title);
    assert.equal(parts.join(''), title);
    assert.ok(parts[0].length < parts[2].length);
    assert.ok(parts[0].trim() && parts[2].trim());
  }
});

test('optical splitting uses measured width rather than equal character counts', () => {
  const measure = value => [...value].reduce((sum, char) => sum + (char === 'W' ? 4 : 1), 0);
  const [first, , second] = splitTitleLines('WWW iii iii iii iii iii iii', measure);
  assert.ok(measure(first) < measure(second));
  assert.deepEqual(splitTitleLines('Writing'), ['Writing', '', '']);
});
