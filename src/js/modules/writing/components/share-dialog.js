/** One copy-link sheet shared by every article card. */
export function mountShareDialog(container, { view = window, ui, text }) {
  const doc = container.ownerDocument;
  const dialog = doc.createElement('dialog'); dialog.className = 'editorial-dialog editorial-share-dialog';
  const heading = doc.createElement('h2'); heading.id = 'writing-share-heading'; text(heading, () => ui.writingPage.share);
  dialog.setAttribute('aria-labelledby', heading.id);
  const field = doc.createElement('input'); field.type = 'url'; field.readOnly = true;
  field.setAttribute('aria-label', ui.writingPage.copyLink);
  const copy = doc.createElement('button'); copy.type = 'button'; copy.className = 'btn'; text(copy, () => ui.writingPage.copyLink);
  const close = doc.createElement('button'); close.type = 'button'; text(close, () => ui.writingPage.close);
  const controls = doc.createElement('div'); controls.className = 'editorial-dialog-controls'; controls.append(close, copy);
  const status = doc.createElement('p'); status.className = 'editorial-share-status'; status.setAttribute('role', 'status');
  dialog.append(heading, field, controls, status); container.append(dialog);
  let opener, disposed = false, closeTimer, revision = 0;
  const timers = view.setTimeout ? view : doc.defaultView;
  const cancelClose = () => { if (closeTimer !== undefined) timers.clearTimeout(closeTimer); closeTimer = undefined; };
  close.addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => { cancelClose(); revision++; if (!disposed && opener?.isConnected) opener.focus({ preventScroll: true }); });
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
  });
  copy.addEventListener('click', async () => {
    const request = revision;
    copy.disabled = true;
    try {
      if (!view.navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
      await view.navigator.clipboard.writeText(field.value);
      if (!disposed && request === revision && dialog.open) {
        text(status, () => ui.writingPage.copied); cancelClose();
        closeTimer = timers.setTimeout(() => { closeTimer = undefined; if (!disposed && request === revision && dialog.open) dialog.close(); }, 2000);
      }
    } catch {
      if (!disposed && request === revision && dialog.open) { field.focus(); field.select(); text(status, () => ui.writingPage.shareError); }
    } finally { copy.disabled = false; }
  });
  return {
    open(url, button) { cancelClose(); revision++; copy.disabled = false; opener = button; field.value = url; status.textContent = ''; dialog.showModal(); copy.focus(); },
    dispose() { disposed = true; cancelClose(); revision++; if (dialog.open) dialog.close(); dialog.remove(); },
  };
}
