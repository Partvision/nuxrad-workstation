/* Authored adapter for NUXRAD 5.43's observed Pinia palette interface.
 * Loading/install() reads only. apply()/restore() change native palette settings;
 * NUXRAD's existing account-sync preference also applies to these settings.
 * This file never invokes apply() itself.
 */
(function (global) {
  'use strict';
  const S = (value, r, g, b, a = 255) => ({ value, r, g, b, a });
  const packs = {
    classic: {
      id: 'classic', name: 'Classic Radar',
      description: 'Traditional reflectivity bands with green inbound and red outbound velocity.',
      BR: { units: 'dBZ', stops: [S(-20,0,0,0,0),S(0,120,150,140,60),S(15,125,180,155,160),S(20,0,240,0),S(30,0,130,0),S(35,255,255,0),S(45,255,145,0),S(50,235,55,55),S(59.9,130,10,40),S(60,255,0,255),S(70,255,255,255),S(80,0,200,255)] },
      BV: { units: 'm/s', stops: [S(-64,0,255,80),S(-40,0,160,40),S(-20,0,100,60),S(-5,120,210,170),S(0,200,200,200),S(5,245,170,120),S(20,200,55,0),S(40,170,0,0),S(64,255,50,40)] }
    },
    contrast: {
      id: 'contrast', name: 'High Contrast',
      description: 'Stronger boundaries and bright extremes; units and physical value ranges stay fixed.',
      BR: { units: 'dBZ', stops: [S(-20,0,0,0,0),S(0,70,90,110,45),S(15,70,130,150,160),S(20,0,255,100),S(30,0,150,50),S(35,255,255,0),S(45,255,130,0),S(50,255,35,35),S(60,255,0,220),S(70,255,255,255),S(80,80,215,255)] },
      BV: { units: 'm/s', stops: [S(-64,220,255,255),S(-40,0,250,120),S(-20,0,150,70),S(-5,30,80,55),S(0,65,65,75),S(5,100,45,25),S(20,245,90,20),S(40,255,30,30),S(64,255,225,225)] }
    },
    'color-friendly': {
      id: 'color-friendly', name: 'Teal & Amber',
      description: 'An alternate teal/amber velocity scale and cool-to-warm reflectivity scale. Check the legend when interpreting colors.',
      BR: { units: 'dBZ', stops: [S(-20,0,0,0,0),S(0,70,85,100,45),S(10,65,115,155,130),S(20,20,155,190),S(30,70,205,205),S(35,230,220,120),S(45,255,170,50),S(50,230,95,35),S(60,180,55,135),S(70,235,200,245),S(80,255,255,255)] },
      BV: { units: 'm/s', stops: [S(-64,180,255,255),S(-40,30,205,220),S(-20,0,125,155),S(-5,70,100,115),S(0,170,175,180),S(5,125,100,65),S(20,220,145,30),S(40,255,195,65),S(64,255,245,180)] }
    }
  };
  const slots = { reflectivity: 'BR', velocity: 'BV' };
  const clone = value => JSON.parse(JSON.stringify(value));
  const own = (object, key) => Object.prototype.hasOwnProperty.call(object, key);
  function validateTable(table) {
    if (!table || !['dBZ', 'm/s'].includes(table.units) || !Array.isArray(table.stops) || table.stops.length < 2) throw Error('Invalid palette table');
    let last = -Infinity;
    for (const stop of table.stops) {
      if (!Number.isFinite(stop.value) || stop.value <= last) throw Error('Palette values must increase');
      for (const key of ['r', 'g', 'b', 'a']) if (!Number.isInteger(stop[key]) || stop[key] < 0 || stop[key] > 255) throw Error('Invalid RGBA channel');
      last = stop.value;
    }
  }
  function serialize(packId, productKey) {
    const pack = packs[packId], table = pack?.[productKey];
    validateTable(table);
    return [`; ${pack.name} — NUXRAD theme bundle`, `Product: ${productKey}`, `Units: ${table.units}`, 'Scale: 1', 'Offset: 0', '',
      ...table.stops.map(s => `Color4: ${s.value} ${s.r} ${s.g} ${s.b} ${s.a}`), ''].join('\n');
  }
  for (const pack of Object.values(packs)) for (const key of ['BR', 'BV']) validateTable(pack[key]);

  function create(options = {}) {
    const namespace = options.namespace || 'NUXRAD Themes';
    const storageKey = `${namespace}:palette-restore:v1`;
    const storage = options.storage || global.localStorage;
    let record = { version: 1, products: {}, tables: [] };
    try {
      const saved = JSON.parse(storage.getItem(storageKey) || 'null');
      if (saved?.version === 1 && saved.products && Array.isArray(saved.tables)) record = saved;
    } catch (_) { /* An unreadable record is not applied to the native app. */ }
    function bridge() {
      const pinia = global.document?.querySelector('#__nuxt')?.__vue_app__?.config?.globalProperties?.$pinia;
      const settingsStore = pinia?._s?.get('settings'), radarStore = pinia?._s?.get('radar');
      const settings = settingsStore?.settings;
      if (!settings || !settings.customColorTables || Array.isArray(settings.customColorTables) || !settings.colorTableOverrides ||
          Array.isArray(settings.colorTableOverrides) || typeof radarStore?.refreshColorTable !== 'function') throw Error('NUXRAD palette interface is unavailable');
      return { settingsStore, settings, radarStore };
    }
    function save(next) {
      // A persistent restore record is required before changing native settings.
      storage.setItem(storageKey, JSON.stringify(next));
      record = next;
    }
    function prune(next, tables, overrides) {
      next.tables = next.tables.filter(item => {
        if (Object.values(overrides).includes(`custom:${item.key}`)) return true;
        if (tables[item.key] === item.content) delete tables[item.key];
        return false;
      });
    }
    async function commit(next, tables, overrides, b) {
      save(next);
      // Same public fields and refresh action used by NUXRAD's palette settings.
      b.settingsStore.$patch(() => {
        b.settings.customColorTables = tables;
        b.settings.colorTableOverrides = overrides;
      });
      await b.radarStore.refreshColorTable();
      return getStatus();
    }
    function install() { return getStatus(); }
    async function apply(selection = {}) {
      // Missing selections and 'keep' are no-ops, including for existing overrides.
      const wanted = Object.entries(slots).map(([slot, key]) => [key, selection[slot] || 'keep']).filter(([, id]) => id !== 'keep');
      if (!wanted.length) return getStatus();
      for (const [key, id] of wanted) if (!packs[id]?.[key]) throw Error(`Unknown palette bundle: ${id}`);
      const b = bridge(), tables = { ...b.settings.customColorTables }, overrides = { ...b.settings.colorTableOverrides }, next = clone(record);
      for (const [key, id] of wanted) {
        const old = next.products[key];
        // A user edit after our last application becomes the new restoration baseline.
        const baseline = old && overrides[key] === old.appliedValue
          ? { beforeHad: old.beforeHad, beforeValue: old.beforeValue }
          : { beforeHad: own(overrides, key), beforeValue: overrides[key] };
        const content = serialize(id, key);
        let item = next.tables.find(t => t.productKey === key && t.content === content && tables[t.key] === content);
        if (!item) {
          const base = `${key}:${namespace} / ${packs[id].name}`;
          let tableKey = base, suffix = 2;
          while (own(tables, tableKey)) tableKey = `${base} (${suffix++})`;
          item = { productKey: key, key: tableKey, content };
          next.tables.push(item);
          tables[tableKey] = content;
        }
        const appliedValue = `custom:${item.key}`;
        overrides[key] = appliedValue;
        next.products[key] = { ...baseline, packId: id, appliedValue };
      }
      prune(next, tables, overrides);
      return commit(next, tables, overrides, b);
    }
    async function restore(which = ['reflectivity', 'velocity']) {
      const keys = new Set(which.map(slot => slots[slot] || slot).filter(key => key === 'BR' || key === 'BV'));
      if (![...keys].some(key => record.products[key])) return getStatus();
      const b = bridge(), tables = { ...b.settings.customColorTables }, overrides = { ...b.settings.colorTableOverrides }, next = clone(record);
      for (const key of keys) {
        const item = next.products[key];
        if (!item) continue;
        if (overrides[key] === item.appliedValue) {
          if (item.beforeHad) overrides[key] = item.beforeValue;
          else delete overrides[key];
        }
        // External override edits are preserved; relinquish ownership of the slot.
        delete next.products[key];
      }
      prune(next, tables, overrides);
      return commit(next, tables, overrides, b);
    }
    function exportPal(packId, slot) { return serialize(packId, slots[slot] || slot); }
    function getStatus() {
      try {
        const b = bridge();
        return { available: true, nativeSettings: true, syncWithAccount: b.settings.syncWithAccount === true,
          slots: Object.fromEntries(Object.entries(slots).map(([slot, key]) => {
            const item = record.products[key];
            return [slot, { key, packId: item?.packId || null, owned: !!item && b.settings.colorTableOverrides[key] === item.appliedValue,
              externallyChanged: !!item && b.settings.colorTableOverrides[key] !== item.appliedValue }];
          })) };
      } catch (error) { return { available: false, reason: error.message }; }
    }
    return { install, apply, restore, export: exportPal, getStatus, catalog: catalog() };
  }
  function catalog() {
    return Object.values(packs).map(pack => ({ id: pack.id, name: pack.name, description: pack.description,
      products: ['BR', 'BV'], ranges: { BR: [-20, 80], BV: [-64, 64] }, units: { BR: 'dBZ', BV: 'm/s' } }));
  }
  global.NuxradThemePalettes = { create, catalog, export: serialize };
})(globalThis);
