import test from 'node:test';
import assert from 'node:assert/strict';
import { activeSection } from '../src/js/modules/common/navigation.js';
test('home is active before any following section crosses the header', () => {
  assert.equal(activeSection([{id:'home',top:0},{id:'about',top:500}],80),'home');
});
test('crossing the reading line changes the active section in either direction', () => {
  assert.equal(activeSection([{id:'home',top:-600},{id:'about',top:80},{id:'work',top:500}],80),'about');
  assert.equal(activeSection([{id:'home',top:-599},{id:'about',top:81},{id:'work',top:501}],80),'home');
});
test('a short final section is active at the bottom of the page', () => {
  assert.equal(activeSection([{id:'work',top:-300},{id:'contact',top:350}],80,true),'contact');
});
test('empty navigation is supported',()=>assert.equal(activeSection([],80),null));
