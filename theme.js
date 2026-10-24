/* Reversible presentation layer for NUXRAD 5.42.0 and 5.43.0. */
(() => {
  const previous = window.__nuxradPro;
  if (previous) previous.destroy();
  const root = document.documentElement;
  const originalAttribute = root.getAttribute('data-nuxrad-pro');
  const originalStyle = root.getAttribute('data-style');
  const sheet = new CSSStyleSheet();
  sheet.replaceSync(__NXPRO_CSS__);
  document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet];
  root.setAttribute('data-nuxrad-pro', 'on');
  root.setAttribute('data-style', 'nxpro');
  const tagged = new Map();
  const tag = (node, name) => {
    if (!node || node.classList.contains(name)) return;
    node.classList.add(name);
    if (!tagged.has(node)) tagged.set(node, new Set());
    tagged.get(node).add(name);
  };
  let scheduled = false;
  let destroyed = false;
  const label = node => node.getAttribute('aria-label') || node.getAttribute('title') || node.textContent.trim();
  function paint() {
    if (destroyed) return;
    scheduled = false;
    const navbar = document.querySelector('[data-app-navbar]');
    tag(navbar, 'nxpro-navbar');
    tag(document.querySelector('main'), 'nxpro-main');
    tag(document.querySelector('[data-tour-sidebar="left"]'), 'nxpro-rail');
    tag(document.querySelector('[data-tour-sidebar="right"]'), 'nxpro-right-rail');
    const siteButton = [...document.querySelectorAll('button')].find(button => label(button) === 'Radar Site');
    if (siteButton) {
      let parent = siteButton.parentElement;
      for (let depth = 0; parent && depth < 5; depth++, parent = parent.parentElement) {
        const labels = [...parent.querySelectorAll('button')].map(label);
        if (labels.includes('Models') && labels.includes('Archive') && parent.getBoundingClientRect().width < 150) {
          tag(parent, 'nxpro-rail');
          break;
        }
      }
    }
    const playButton = document.querySelector('button[aria-label="Play animation"],button[aria-label="Pause animation"]');
    if (playButton) {
      let parent = playButton.parentElement;
      for (let depth = 0; parent && depth < 4; depth++, parent = parent.parentElement) {
        if (parent.querySelector('[aria-label="Scrub through frames"]')) { tag(parent, 'nxpro-timeline'); break; }
      }
    }
    for (const button of document.querySelectorAll('button[aria-label*="choose radar product"],button[aria-label*="choose the map"]')) tag(button, 'nxpro-pane-label');
    const frames = [...document.querySelectorAll('button')].find(button => label(button) === 'Frames');
    if (frames) {
      let parent = frames.parentElement;
      for (let depth = 0; parent && depth < 4; depth++, parent = parent.parentElement) {
        if ([...parent.querySelectorAll('button')].some(button => label(button) === 'Overlays')) { tag(parent, parent.getBoundingClientRect().width < 150 ? 'nxpro-right-rail' : 'nxpro-bottom'); break; }
      }
    }
  }
  function setEnabled(on) {
    root.setAttribute('data-nuxrad-pro', on ? 'on' : 'off');
    if (on) root.setAttribute('data-style', 'nxpro');
    else if (originalStyle === null) root.removeAttribute('data-style');
    else root.setAttribute('data-style', originalStyle);
    window.dispatchEvent(new Event('resize'));
    window.__nuxradPro?.marketplace?.onAppearanceChange(on);
  }
  const toggle = () => setEnabled(root.getAttribute('data-nuxrad-pro') !== 'on');
  const onKey = event => {
    if (event.ctrlKey && event.altKey && (event.code === 'KeyP' || event.key?.toLowerCase() === 'p')) { event.preventDefault(); event.stopPropagation(); toggle(); }
  };
  const observer = new MutationObserver(() => {
    if (!scheduled) { scheduled = true; requestAnimationFrame(paint); }
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });
  window.addEventListener('keydown', onKey, true);
  paint();
  window.dispatchEvent(new Event('resize'));
  window.__nuxradPro = {
    version: '2.0.0',
    setEnabled,
    destroy() {
      window.__nuxradPro?.marketplace?.destroy();
      destroyed = true;
      observer.disconnect();
      window.removeEventListener('keydown', onKey, true);
      document.adoptedStyleSheets = document.adoptedStyleSheets.filter(item => item !== sheet);
      for (const [node, classes] of tagged) for (const name of classes) node.classList.remove(name);
      if (originalAttribute === null) root.removeAttribute('data-nuxrad-pro');
      else root.setAttribute('data-nuxrad-pro', originalAttribute);
      if (originalStyle === null) root.removeAttribute('data-style');
      else root.setAttribute('data-style', originalStyle);
      delete window.__nuxradPro;
      window.dispatchEvent(new Event('resize'));
    }
  };
  return { installed: true, version: '2.0.0', maps: document.querySelectorAll('.maplibregl-map').length, navbar: Boolean(document.querySelector('[data-app-navbar]')) };
})()
