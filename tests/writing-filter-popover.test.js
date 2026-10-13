import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { mountFilterPopover } from '../src/js/modules/writing/components/filter-popover.js';

function fixture() {
  const dom = new JSDOM('<div id="wrap"><button id="more">...</button><div id="panel"><button aria-pressed="false">Design</button><button aria-pressed="true">Notes</button></div></div><button id="outside">Outside</button>');
  const doc = dom.window.document, wrapper = doc.getElementById('wrap'), trigger = doc.getElementById('more'), panel = doc.getElementById('panel');
  const control = mountFilterPopover(wrapper, trigger, panel, { doc });
  return { dom, doc, wrapper, trigger, panel, control };
}

test('additional filters open in a panel, focus the selected row and close with Escape', () => {
  const f = fixture();
  assert.equal(f.panel.hidden, true);
  f.trigger.click(); assert.equal(f.panel.hidden, false); assert.equal(f.trigger.getAttribute('aria-expanded'), 'true');
  assert.equal(f.doc.activeElement.textContent, 'Notes');
  f.doc.activeElement.dispatchEvent(new f.dom.window.KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
  assert.equal(f.doc.activeElement.textContent, 'Design');
  f.doc.activeElement.dispatchEvent(new f.dom.window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  assert.equal(f.panel.hidden, true); assert.equal(f.doc.activeElement, f.trigger);
  f.control.dispose(); f.dom.window.close();
});

test('outside click/focus closes without stealing focus; selection and disposal restore a clean state', () => {
  const f = fixture(), outside = f.doc.getElementById('outside');
  f.trigger.click(); outside.dispatchEvent(new f.dom.window.Event('pointerdown', { bubbles: true }));
  assert.equal(f.panel.hidden, true);
  f.trigger.click(); outside.focus(); assert.equal(f.panel.hidden, true); assert.equal(f.doc.activeElement, outside);
  f.trigger.click(); f.control.close(true); assert.equal(f.doc.activeElement, f.trigger);
  f.control.dispose(); f.trigger.click(); assert.equal(f.panel.hidden, true);
  f.dom.window.close();
});

test('mobile keeps a compact primary row and moves the same extra buttons into the panel', async () => {
  const { placeFilterButtons } = await import('../src/js/modules/writing/components/filter-popover.js');
  const f = fixture(), row = f.doc.createElement('div');
  const buttons = Array.from({ length: 5 }, (_, index) => {
    const button = f.doc.createElement('button'); button.textContent = String(index); return button;
  });
  placeFilterButtons(row, f.panel, f.wrapper, buttons, 3);
  assert.equal(row.children.length, 4); // Three primary filters and overflow.
  assert.equal(buttons[3].parentElement, f.panel);
  buttons[3].setAttribute('aria-pressed', 'true');
  placeFilterButtons(row, f.panel, f.wrapper, buttons, 4);
  assert.equal(buttons[3].parentElement, row);
  assert.equal(buttons[3].getAttribute('aria-pressed'), 'true');
  assert.equal(buttons[4].parentElement, f.panel);
  f.control.dispose(); f.dom.window.close();
});

test('filter panel stays inside the viewport when its anchor is near either edge', () => {
  const f = fixture();
  Object.defineProperty(f.dom.window, 'innerWidth', { value: 320 });
  f.panel.getBoundingClientRect = () => ({ width: 280, left: -20, right: 260 });
  f.trigger.click(); assert.equal(f.panel.style.getPropertyValue('--filter-panel-shift'), '36px');
  f.control.close();
  f.panel.getBoundingClientRect = () => ({ width: 280, left: 200, right: 480 });
  f.trigger.click(); assert.equal(f.panel.style.getPropertyValue('--filter-panel-shift'), '-176px');
  f.control.dispose(); f.dom.window.close();
});

test('opening centers the panel without focus overriding scroll and honors reduced motion', () => {
  const f = fixture(), calls = [];
  let reduced = false;
  f.dom.window.matchMedia = () => ({ matches: reduced });
  f.panel.scrollIntoView = options => calls.push(options);
  const selected = f.panel.querySelector('[aria-pressed=true]');
  const focus = selected.focus.bind(selected);
  selected.focus = options => { assert.equal(options.preventScroll, true); focus(options); };
  f.trigger.click();
  assert.equal(f.doc.activeElement, selected);
  assert.deepEqual(calls[0], { block: 'center', inline: 'nearest', behavior: 'smooth' });
  f.control.close(); reduced = true; f.trigger.click();
  assert.equal(calls[1].behavior, 'instant');
  f.control.dispose(); f.dom.window.close();
});
