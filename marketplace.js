/* Included local collection. No downloads, accounts, payments, or arbitrary third-party scripts. */
(() => {
  const api = window.__nuxradPro;
  if (!api) throw new Error('The NUXRAD Workstation presentation layer is required.');
  api.marketplace?.destroy();
  const root = document.documentElement;
  const storageKey = 'nuxrad-workstation-marketplace-v1';
  const notesKey = 'nuxrad-workstation-field-notes-v1';
  const themeEngine = window.__nuxradThemeCatalog;
  if(!themeEngine)throw new Error('Theme package engine not loaded.');
  const themes = themeEngine.themes;
  const radarPalettes = window.NuxradThemePalettes?.create();
  const plugins = [
    {id:'utc-clock', name:'UTC Clock', icon:'clock', category:'Utility', description:'Keep a live UTC clock beside your radar site. Always know the observation time.', detail:'Uses your computer clock. The display updates once per second.'},
    {id:'field-notes', name:'Field Notes', icon:'notes', category:'Workspace', description:'A small scratchpad for observations, scan times, and things to follow up.', detail:'Notes stay in this NUXRAD profile and are retained when the plugin is removed.'},
    {id:'map-crosshair', name:'Map Crosshair', icon:'crosshair', category:'Display', description:'Use a precise crosshair pointer over map canvases without changing the radar display.', detail:'Changes the map cursor only. Does not add measurements or modify map data.'},
  ];
  const plannedPlugins = [
    {id:'in-app-notifications',name:'In App Notifications',icon:'bell',category:'Alerts',description:'Theme-aware notifications for severe weather alerts and other in-app events.',plan:'First milestone: an alert inbox with severity, source, issue time, expiry, and a link to the native alert. Then area/site filtering, deduplication, sound preferences, and quiet hours. Styling follows the active theme. Existing weather alerts remain the authoritative source.'},
    {id:'menushift',name:'MenuShift',icon:'move',category:'Layout',description:'Move specific menu parts into the positions that fit your workflow.',plan:'First milestone: named docking zones for tool groups, layer controls, pane headers, and playback. Add drag handles, keyboard repositioning, snap previews, per-theme layouts, and one-click Reset layout. Preserve the native controls and their events.'},
    {id:'sandbox',name:'Sandbox',icon:'sandbox',category:'Simulation',description:'Select a map area and explore an idealized atmosphere with simulated storms and couplets.',plan:'Research milestone: area selection and a separate, clearly labeled simulation layer with pause, step, reset, and seeded replay. Start with an idealized teaching model, then evaluate storm organization and synthetic velocity signatures against documented reference cases. The simulation is separate from live radar and warnings; it is not a forecast.'},
  ];
  const themeIds = new Set(themes.map(t=>t.id));
  const pluginIds = new Set(plugins.map(p=>p.id));
  let saved;
  try { saved = JSON.parse(localStorage.getItem(storageKey) || '{}'); } catch { saved = {}; }
  const state = {
    theme: themeIds.has(saved?.theme) ? saved.theme : 'graphite',
    enabled: saved?.enabled !== false,
    installedThemes: [...new Set(['graphite', ...(Array.isArray(saved?.installedThemes) ? saved.installedThemes.filter(id=>themeIds.has(id)) : [])])],
    plugins: Object.fromEntries(Object.entries(saved?.plugins && typeof saved.plugins==='object' ? saved.plugins : {}).filter(([id,value])=>pluginIds.has(id) && ['enabled','disabled'].includes(value))),
    themeSettings:Object.fromEntries(themes.map(theme=>[theme.id,themeEngine.normalize(saved?.themeSettings?.[theme.id])])),
  };
  if (!state.installedThemes.includes(state.theme)) state.installedThemes.push(state.theme);
  let storageAvailable = true;
  function save() {
    try { localStorage.setItem(storageKey, JSON.stringify(state)); }
    catch { storageAvailable = false; announce('Your choices work for this session. Local storage is unavailable.'); }
  }
  const icons = {
    store:'<path d="M4 9h16l-2-5H6L4 9Zm0 0v3a2 2 0 0 0 4 0 2 2 0 0 0 4 0 2 2 0 0 0 4 0 2 2 0 0 0 4 0V9M5 14v6h14v-6M9 20v-5h6v5"/>',
    close:'<path d="m6 6 12 12M18 6 6 18"/>',
    search:'<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4 4"/>',
    check:'<path d="m5 12 4 4L19 6"/>',
    clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    notes:'<path d="M6 3h9l4 4v14H6zM14 3v5h5M9 12h7M9 16h5"/>',
    crosshair:'<circle cx="12" cy="12" r="6"/><path d="M12 2v5m0 10v5M2 12h5m10 0h5"/>',
    palette:'<circle cx="12" cy="12" r="8"/><circle cx="9" cy="8" r=".6"/><circle cx="14" cy="7" r=".6"/><circle cx="17" cy="11" r=".6"/><path d="M7 14c0 4 5 5 5 2s5-1 5-1"/>',
    plug:'<path d="M8 3v5m8-5v5M6 8h12v3a6 6 0 0 1-12 0V8Zm6 9v4"/>',
    settings:'<path d="M4 7h16M4 17h16M8 4v6m8 4v6"/>',
    bell:'<path d="M5 17h14l-2-3V9a5 5 0 0 0-10 0v5l-2 3Zm5 3h4"/>',
    move:'<path d="M12 3v18M3 12h18M9 6l3-3 3 3M9 18l3 3 3-3M6 9l-3 3 3 3m12-6 3 3-3 3"/>',
    sandbox:'<path d="m3 8 9-5 9 5v9l-9 5-9-5V8Zm0 0 9 5 9-5m-9 5v9"/>',
  };
  const icon = name => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name]||icons.plug}</svg>`;
  const node = (tag, className, text) => {const element=document.createElement(tag);if(className)element.className=className;if(text!==undefined)element.textContent=text;return element;};
  const button = (text, action, className='nxm-button') => {const item=node('button',className,text);item.type='button';item.addEventListener('click',action);return item;};
  const sheet = new CSSStyleSheet();
  sheet.replaceSync(__NXPRO_MARKET_CSS__);
  const paletteSheet = new CSSStyleSheet();
  const layoutSheet = new CSSStyleSheet();
  document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet, paletteSheet,layoutSheet];
  const originalThemeAttribute = root.getAttribute('data-nxpro-theme');
  const mounted = new Set();
  const cleanups = new Map();
  let overlay, dialog, cards, search, resultCount, status, tablist, empty, previousFocus;
  let currentTab='themes';
  let query='';
  let mode='All';
  let dead=false;
  let notesPanel, notesArea, notesStatus, noteTimer;
  let observerScheduled=false;
  const dock = node('div','nxm-plugin-dock');
  mounted.add(dock);
  let navEntry;
  const entries = new Set();

  function announce(message) {if(status)status.textContent=message;}
  function applyTheme() {
    const theme=themes.find(item=>item.id===state.theme);
    const [bg,panel,raised,line,accent,text,muted]=theme.colors;
    const light=theme.mode==='Light';
    const vars={
      '--nxpro-bg':bg,'--nxpro-panel':panel,'--nxpro-raised':raised,'--nxpro-line':line,'--nxpro-accent':accent,
      '--ui-bg':panel,'--ui-bg-muted':bg,'--ui-bg-elevated':raised,'--ui-bg-accented':raised,'--ui-bg-inverted':text,
      '--ui-border':line,'--ui-border-muted':line,'--ui-border-accented':muted,
      '--ui-text':text,'--ui-text-highlighted':text,'--ui-text-muted':muted,'--ui-text-toned':text,'--ui-text-dimmed':muted,'--ui-text-inverted':bg,
      '--ui-primary':accent,'--ui-color-primary-300':accent,'--ui-color-primary-400':accent,'--ui-color-primary-500':accent,'--ui-color-primary-600':accent,'--ui-color-primary-700':accent,
      '--ui-color-neutral-50':light?'#172c43':'#f4f7fc','--ui-color-neutral-100':text,'--ui-color-neutral-200':text,'--ui-color-neutral-300':text,'--ui-color-neutral-400':muted,'--ui-color-neutral-500':muted,'--ui-color-neutral-600':muted,'--ui-color-neutral-700':line,'--ui-color-neutral-800':raised,'--ui-color-neutral-900':panel,'--ui-color-neutral-950':bg,
      '--nxm-bg':bg,'--nxm-panel':panel,'--nxm-raised':raised,'--nxm-line':line,'--nxm-accent':accent,'--nxm-text':text,'--nxm-muted':muted,
    };
    paletteSheet.replaceSync(`html[data-nuxrad-pro="on"]{${Object.entries(vars).map(([key,value])=>`${key}:${value}!important`).join(';')};color-scheme:${light?'light':'dark'}!important} html[data-nuxrad-pro]{${Object.entries(vars).filter(([key])=>key.startsWith('--nxm')).map(([key,value])=>`${key}:${value}`).join(';')}}`);
    root.setAttribute('data-nxpro-theme',theme.id);
    layoutSheet.replaceSync(themeEngine.stylesheet(theme,state.themeSettings[theme.id]));
    if (state.enabled) api.setEnabled(true);
  }
  function mountEntry() {
    if(dead)return;
    const rail=document.querySelector('[data-tour-sidebar="left"]');
    if(rail && !rail.querySelector('[data-nxm-entry]')) {
      navEntry=node('div','nxm-entry');navEntry.setAttribute('data-nxm-entry','');
      navEntry.append(node('div','nxm-entry-label','PERSONALIZE'));
      const openButton=button('',open,'nxm-entry-button');
      openButton.innerHTML=`${icon('store')}<span>Marketplace</span>`;
      openButton.setAttribute('aria-label','Open Marketplace');
      openButton.setAttribute('aria-haspopup','dialog');
      openButton.setAttribute('aria-expanded',String(Boolean(overlay&&!overlay.hidden)));
      navEntry.append(openButton);rail.append(navEntry);entries.add(navEntry);
    }
    const header=document.querySelector('[data-app-navbar] [data-slot="left"]');
    if(header && !dock.isConnected)header.append(dock);
  }
  function setTab(tab) {
    currentTab=tab;
    for(const item of tablist.querySelectorAll('button')) {const selected=item.dataset.tab===tab;item.setAttribute('aria-selected',String(selected));item.tabIndex=selected?0:-1;}
    overlay.querySelector('.nxm-theme-filters').hidden=tab==='plugins';
    renderCards();
  }
  function build() {
    overlay=node('div','nxm-backdrop');overlay.hidden=true;overlay.setAttribute('data-nxm-root','');
    overlay.addEventListener('click',event=>{if(event.target===overlay)close();});
    overlay.addEventListener('keydown',event=>event.stopPropagation());
    dialog=node('section','nxm-dialog');dialog.setAttribute('role','dialog');dialog.setAttribute('aria-modal','true');dialog.setAttribute('aria-labelledby','nxm-title');dialog.tabIndex=-1;
    const header=node('header','nxm-header');
    const brand=node('div','nxm-heading');brand.innerHTML=`<span class="nxm-store-icon">${icon('store')}</span><div><div class="nxm-eyebrow">THEMES & EXTENSIONS</div><h1 id="nxm-title">Marketplace</h1></div>`;
    const closeButton=button('',close,'nxm-icon-button');closeButton.innerHTML=icon('close');closeButton.setAttribute('aria-label','Close Marketplace');
    header.append(brand,closeButton);
    const intro=node('div','nxm-intro');intro.append(node('h2','','Build your own radar workspace.'),node('p','','Full interface themes with layout, typography, controls, and radar palette bundles.'));
    const searchBox=node('label','nxm-search');searchBox.innerHTML=icon('search');
    search=node('input');search.type='search';search.placeholder='Search themes and plugins';search.setAttribute('aria-label','Search Marketplace');search.addEventListener('input',()=>{query=search.value;renderCards();});searchBox.append(search);
    tablist=node('div','nxm-tabs');tablist.setAttribute('role','tablist');tablist.setAttribute('aria-label','Marketplace categories');
    for(const [id,title,mark] of [['themes','Themes','palette'],['plugins','Plugins','plug'],['installed','Installed','check']]) {
      const item=button('',()=>setTab(id),'nxm-tab');item.dataset.tab=id;item.id=`nxm-tab-${id}`;item.setAttribute('role','tab');item.setAttribute('aria-controls','nxm-items');item.innerHTML=`${icon(mark)}<span>${title}</span><span class="nxm-tab-count"></span>`;
      item.addEventListener('keydown',event=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(event.key)){event.preventDefault();const tabs=[...tablist.children];let index=tabs.indexOf(item);index=event.key==='Home'?0:event.key==='End'?tabs.length-1:(index+(event.key==='ArrowLeft'?-1:1)+tabs.length)%tabs.length;setTab(tabs[index].dataset.tab);tabs[index].focus();}});
      tablist.append(item);
    }
    const toolbar=node('div','nxm-toolbar');
    const filters=node('div','nxm-theme-filters');filters.setAttribute('role','group');filters.setAttribute('aria-label','Theme appearance');
    for(const value of ['All','Dark','Light']) {const item=button(value,()=>{mode=value;for(const b of filters.children)b.setAttribute('aria-pressed',String(b.textContent===value));renderCards();},'nxm-filter');item.setAttribute('aria-pressed',String(value==='All'));filters.append(item);}
    resultCount=node('div','nxm-result-count');toolbar.append(filters,resultCount);
    cards=node('div','nxm-grid');cards.id='nxm-items';cards.setAttribute('role','tabpanel');cards.setAttribute('aria-live','polite');
    empty=node('div','nxm-empty');empty.hidden=true;empty.append(node('h3','','Nothing matched that search.'),node('p','','Try a different name, or browse another category.'));
    const body=node('div','nxm-body');const browse=node('div','nxm-browse');browse.append(intro,searchBox,tablist,toolbar,cards,empty);body.append(browse);
    const footer=node('footer','nxm-footer');
    const collection=node('div');collection.append(node('strong','','Included collection'),node('span','','Saved on this device · No account needed'));
    const original=button('Use original appearance',()=>{api.setEnabled(false);close();},'nxm-link-button');footer.append(collection,original);
    status=node('div','nxm-status');status.setAttribute('role','status');
    dialog.append(header,body,status,footer);overlay.append(dialog);document.body.append(overlay);mounted.add(overlay);
    setTab('themes');
  }
  function subpage(title,description) {
    const body=overlay.querySelector('.nxm-body');
    body.querySelector('.nxm-subpage')?.remove();
    body.querySelector('.nxm-browse').hidden=true;
    const page=node('section','nxm-subpage');
    const back=button('← Back to Marketplace',()=>{page.remove();body.querySelector('.nxm-browse').hidden=false;search.focus();},'nxm-link-button');
    page.append(back,node('h2','nxm-settings-title',title),node('p','nxm-settings-description',description));
    body.append(page);body.scrollTop=0;
    back.focus();
    return page;
  }
  function download(name,contents,type='text/plain') {
    const url=URL.createObjectURL(new Blob([contents],{type}));
    const link=document.createElement('a');link.href=url;link.download=name;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  function paletteId(theme,selection,product) {return selection==='theme'?theme.palettes[product]:selection;}
  function paletteBar(packId,slot) {
    const element=node('div','nxm-palette-preview');
    if(packId==='keep') {element.append(node('span','','Current NUXRAD palette will be preserved.'));return element;}
    if(!radarPalettes) {element.append(node('span','','Palette exporter unavailable.'));return element;}
    const text=radarPalettes.export(packId,slot);
    const stops=text.split('\n').filter(line=>line.startsWith('Color4:')).map(line=>line.slice(7).trim().split(/\s+/).map(Number));
    const min=stops[0][0],max=stops.at(-1)[0],unit=slot==='reflectivity'?'dBZ':'m/s';
    const bar=node('div','nxm-palette-bar');bar.setAttribute('role','img');bar.setAttribute('aria-label',`${packId} ${slot} palette, ${min} to ${max} ${unit}`);
    bar.style.background=`linear-gradient(90deg,${stops.map(([value,r,g,b,a])=>`rgba(${r},${g},${b},${a/255}) ${(value-min)/(max-min)*100}%`).join(',')})`;
    const labels=node('div','nxm-palette-labels');labels.append(node('span','',`${min} ${unit}`),node('span','',`${max} ${unit}`));element.append(bar,labels);return element;
  }
  function openThemeSettings(id) {
    if(!overlay||overlay.hidden)open();
    const theme=themes.find(item=>item.id===id);if(!theme)return;
    const page=subpage(`${theme.name} settings`,`${theme.profile.label}. Customize this theme’s layout, typography, controls, and radar palettes.`);
    page.dataset.settingsTheme=id;
    const hero=node('div','nxm-settings-hero');hero.append(themePreview(theme),node('div','nxm-settings-package',`Theme v${theme.version} · REF & VEL palettes included`));page.append(hero);
    const inputs=new Map();
    page.append(node('h3','nxm-section-title','Interface'));
    const controls=node('div','nxm-settings-controls');
    for(const schema of themeEngine.settingsSchema){
      const row=node('label','nxm-setting');const text=node('div');text.append(node('strong','',schema.title),node('span','',schema.description));
      const select=node('select');select.setAttribute('aria-label',schema.title);select.dataset.setting=schema.id;
      for(const [value,label]of schema.options){const option=node('option','',label);option.value=String(value);select.append(option);}select.value=String(state.themeSettings[id][schema.id]);inputs.set(schema.id,select);row.append(text,select);controls.append(row);
    }
    page.append(controls);
    const collect=()=>themeEngine.normalize(Object.fromEntries([...inputs].map(([key,input])=>[key,input.value])));
    const saveSettings=()=>{
      state.themeSettings[id]=collect();if(!state.installedThemes.includes(id))state.installedThemes.push(id);state.theme=id;state.enabled=true;applyTheme();save();renderCards();announce(`${theme.name} interface settings applied. Radar palettes are unchanged.`);
    };
    const uiActions=node('div','nxm-settings-actions');
    const apply=button('Apply interface settings',saveSettings);apply.setAttribute('data-apply-interface','');
    uiActions.append(apply,button('Reset settings',()=>{for(const [key,input]of inputs)input.value=String(themeEngine.defaults[key]);updatePalettes();announce('Default settings loaded. Apply to save them.');},'nxm-link-button'));
    page.append(uiActions,node('h3','nxm-section-title','Radar color palettes'),node('p','nxm-setting-note','Each theme includes reflectivity and radial-velocity tables. Keep your current palettes, use the theme’s selection, or choose another bundle.'));
    const paletteControls=node('div','nxm-palette-controls');
    const previews=new Map();
    for(const [key,title,slot,product]of [['reflectivityPalette','Reflectivity','reflectivity','BR'],['velocityPalette','Radial velocity','velocity','BV']]){
      const item=node('div','nxm-palette-control');const row=node('label','nxm-setting');const text=node('div');text.append(node('strong','',title),node('span','',product==='BR'?'BR · dBZ':'BV · m/s'));
      const select=node('select');select.dataset.setting=key;select.setAttribute('aria-label',`${title} palette`);
      for(const [value,label]of [['keep','Keep my current palette'],['theme','Theme bundled palette'],['classic','Classic Radar'],['contrast','High Contrast'],['color-friendly','Teal & Amber']]){const option=node('option','',label);option.value=value;select.append(option);}
      const saved=state.themeSettings[id][key];select.value=['keep','theme','classic','contrast','color-friendly'].includes(saved)?saved:'keep';inputs.set(key,select);
      const preview=node('div');previews.set(key,{preview,slot,product});select.addEventListener('change',updatePalettes);row.append(text,select);item.append(row,preview);paletteControls.append(item);
    }
    const bridgeStatus=radarPalettes?.getStatus();
    page.append(paletteControls,node('p','nxm-setting-note',bridgeStatus?.available?'Applying changes NUXRAD’s color tables and follows NUXRAD’s account-sync settings. Units and physical value ranges are preserved.':'Native palette controls are unavailable in this app version. Palette previews and exports remain available.'));
    const paletteActions=node('div','nxm-settings-actions');
    const applyPalettes=button('Apply radar palettes',async()=>{
      applyPalettes.disabled=true;
      try{
        const draft=collect();
        await radarPalettes.apply({reflectivity:paletteId(theme,draft.reflectivityPalette,'BR'),velocity:paletteId(theme,draft.velocityPalette,'BV')});
        state.themeSettings[id]=draft;save();announce('Selected radar palettes applied through NUXRAD. Check each product’s legend.');
      }catch(error){announce(`Palette change could not finish: ${error.message}`);}finally{updatePalettes();}
    });applyPalettes.setAttribute('data-apply-palettes','');
    const restore=button('Restore previous palettes',async()=>{try{await radarPalettes.restore();announce('Previous palettes restored where the theme still owned the selection.');}catch(error){announce(error.message);}updatePalettes();},'nxm-link-button');restore.disabled=!bridgeStatus?.available;
    paletteActions.append(applyPalettes,restore);page.append(paletteActions);
    const exports=node('div','nxm-export-actions');
    for(const [slot,product,title]of [['reflectivity','BR','Export REF .pal'],['velocity','BV','Export VEL .pal']])exports.append(button(title,()=>{const key=slot==='reflectivity'?'reflectivityPalette':'velocityPalette';const value=inputs.get(key).value;const pack=value==='keep'?theme.palettes[product]:paletteId(theme,value,product);download(`${theme.id}-${slot}-${pack}.pal`,radarPalettes.export(pack,slot));},'nxm-link-button'));
    exports.append(button('Export full theme package',()=>{const settings=collect();const result={format:theme.format,id:theme.id,name:theme.name,version:theme.version,colors:theme.colors,profile:theme.profile,settings,jss:themeEngine.jss(theme,settings),palettes:{BR:radarPalettes?.export(theme.palettes.BR,'reflectivity'),BV:radarPalettes?.export(theme.palettes.BV,'velocity')}};download(`${theme.id}.nuxrad-theme.json`,JSON.stringify(result,null,2),'application/json');},'nxm-link-button'));
    page.append(exports);
    function updatePalettes(){
      for(const [key,{preview,slot,product}]of previews){preview.replaceChildren(paletteBar(paletteId(theme,inputs.get(key).value,product),slot));}
      applyPalettes.disabled=!radarPalettes?.getStatus().available||[...previews.keys()].every(key=>inputs.get(key).value==='keep');
      restore.disabled=!radarPalettes?.getStatus().available||!Object.values(radarPalettes?.getStatus().slots||{}).some(slot=>slot.owned);
    }
    updatePalettes();
  }
  function roadmapCard(plugin){
    const card=node('article','nxm-card nxm-roadmap-card');card.dataset.roadmapId=plugin.id;
    const content=node('div','nxm-card-content');const top=node('div','nxm-plugin-top');top.innerHTML=`<span class="nxm-plugin-icon">${icon(plugin.icon)}</span>`;top.append(node('span','nxm-pill','PLANNED'));
    content.append(top,node('h3','',plugin.name),node('p','',plugin.description));
    const actions=node('div','nxm-card-actions');actions.append(button('View plan',()=>{const page=subpage(plugin.name,'Plugin roadmap · not available to install');page.append(node('p','nxm-roadmap-plan',plugin.plan),node('div','nxm-roadmap-state','Planned for a future milestone. No feature is running in the background.'));},'nxm-button nxm-button-secondary'));content.append(actions);card.append(content);return card;
  }
  function updateCounts() {
    const counts={themes:themes.length,plugins:plugins.length,installed:state.installedThemes.length+Object.keys(state.plugins).length};
    for(const tab of tablist.children)tab.querySelector('.nxm-tab-count').textContent=counts[tab.dataset.tab];
  }
  function themePreview(theme) {
    const preview=node('div','nxm-preview');preview.setAttribute('aria-hidden','true');
    preview.dataset.layout=theme.profile.label;
    preview.style.setProperty('--preview-radius',`${theme.profile.radius/2}px`);
    preview.style.setProperty('--preview-rail-width',theme.profile.rail<100?'26px':'52px');
    const [bg,panel,raised,line,accent]=theme.colors;
    for(const [key,value] of Object.entries({'--preview-bg':bg,'--preview-panel':panel,'--preview-raised':raised,'--preview-line':line,'--preview-accent':accent}))preview.style.setProperty(key,value);
    preview.innerHTML='<div class="nxm-preview-header"><i></i><i></i><i></i><b></b></div><div class="nxm-preview-rail"><i></i><i></i><i></i></div><div class="nxm-preview-map"><span></span><i></i><b></b></div><div class="nxm-preview-timeline"><i></i></div>';
    return preview;
  }
  function themeCard(theme) {
    const installed=state.installedThemes.includes(theme.id), active=state.enabled&&state.theme===theme.id;
    const card=node('article','nxm-card nxm-theme-card');card.dataset.themeId=theme.id;
    const preview=themePreview(theme);preview.append(node('span','nxm-preview-label',theme.mode));
    if(active)preview.append(node('span','nxm-active-badge','ACTIVE'));
    const content=node('div','nxm-card-content');content.append(node('div','nxm-card-eyebrow',theme.tag),node('h3','',theme.name),node('p','',theme.description),node('div','nxm-theme-capabilities',`${theme.profile.label} · REF + VEL palettes`));
    const swatches=node('div','nxm-swatches');swatches.setAttribute('aria-label',`${theme.name} interface colors`);for(const color of theme.colors.slice(0,5)){const swatch=node('span');swatch.style.backgroundColor=color;swatches.append(swatch);}content.append(swatches);
    const actions=node('div','nxm-card-actions');
    const applyButton=button(active?'Active':installed?'Apply theme':'Install theme',()=>{if(!installed)state.installedThemes.push(theme.id);state.theme=theme.id;state.enabled=true;applyTheme();save();renderCards();announce(`${theme.name} is now your active theme.`);},active?'nxm-button nxm-button-active':'nxm-button');applyButton.disabled=active;applyButton.setAttribute('aria-label',`${active?'Active':installed?'Apply':'Install'} ${theme.name} theme`);actions.append(applyButton);
    const settingsButton=button('Settings',()=>openThemeSettings(theme.id),'nxm-button nxm-button-secondary');settingsButton.setAttribute('aria-label',`${theme.name} theme settings`);actions.append(settingsButton);
    if(installed&&theme.id!=='graphite')actions.append(button('Remove',()=>{state.installedThemes=state.installedThemes.filter(id=>id!==theme.id);if(state.theme===theme.id){state.theme='graphite';applyTheme();}save();renderCards();announce(`${theme.name} removed from your library.`);},'nxm-remove-button'));
    content.append(actions);card.append(preview,content);return card;
  }
  function pluginCard(plugin) {
    const installed=Object.hasOwn(state.plugins,plugin.id), enabled=state.plugins[plugin.id]==='enabled';
    const card=node('article','nxm-card nxm-plugin-card');card.dataset.pluginId=plugin.id;
    const top=node('div','nxm-plugin-top');top.innerHTML=`<span class="nxm-plugin-icon">${icon(plugin.icon)}</span>`;top.append(node('span','nxm-pill',plugin.category));
    const content=node('div','nxm-card-content');content.append(top,node('div','nxm-card-eyebrow','INCLUDED PLUGIN'),node('h3','',plugin.name),node('p','',plugin.description),node('p','nxm-plugin-detail',plugin.detail));
    const actions=node('div','nxm-card-actions');
    const control=button(!installed?'Install plugin':enabled?'Disable':'Enable',()=>{const next=!installed||!enabled?'enabled':'disabled';state.plugins[plugin.id]=next;syncPlugin(plugin.id);save();renderCards();announce(`${plugin.name} ${next==='enabled'?'enabled':'disabled'}.`);},!installed?'nxm-button':'nxm-button nxm-button-secondary');control.setAttribute('aria-label',`${!installed?'Install':enabled?'Disable':'Enable'} ${plugin.name}`);actions.append(control);
    if(installed)actions.append(button('Remove',()=>{delete state.plugins[plugin.id];syncPlugin(plugin.id);save();renderCards();announce(`${plugin.name} removed.`);},'nxm-remove-button'));
    if(installed)content.append(node('span',enabled?'nxm-plugin-state nxm-enabled':'nxm-plugin-state',enabled?'Enabled':'Installed · disabled'));
    content.append(actions);card.append(content);return card;
  }
  function renderCards() {
    if(!cards)return;
    updateCounts();cards.replaceChildren();cards.setAttribute('aria-labelledby',`nxm-tab-${currentTab}`);
    const matches=item=>`${item.name} ${item.description} ${item.category||''}`.toLowerCase().includes(query.trim().toLowerCase());
    const selectedThemes=currentTab==='plugins'?[]:themes.filter(item=>matches(item)&&(mode==='All'||mode===item.mode)&&(currentTab!=='installed'||state.installedThemes.includes(item.id)));
    const selectedPlugins=currentTab==='themes'?[]:plugins.filter(item=>matches(item)&&(currentTab!=='installed'||Object.hasOwn(state.plugins,item.id)));
    for(const theme of selectedThemes)cards.append(themeCard(theme));
    for(const plugin of selectedPlugins)cards.append(pluginCard(plugin));
    const planned=currentTab==='plugins'?plannedPlugins.filter(matches):[];
    if(planned.length){const heading=node('div','nxm-roadmap-heading');heading.append(node('h3','','On the roadmap'),node('p','','Concepts for the first public repository. These plugins are not installable yet.'));cards.append(heading);for(const plugin of planned)cards.append(roadmapCard(plugin));}
    const count=selectedThemes.length+selectedPlugins.length;resultCount.textContent=currentTab==='plugins'?`${selectedPlugins.length} available · ${planned.length} planned`:`${count} ${count===1?'item':'items'}`;empty.hidden=count+planned.length>0;
  }
  function open() {
    if(!overlay)build();
    previousFocus=document.activeElement;
    overlay.hidden=false;
    for(const entry of entries)entry.querySelector('button').setAttribute('aria-expanded','true');
    renderCards();search.focus();
  }
  function close() {
    if(!overlay||overlay.hidden)return;
    overlay.hidden=true;
    for(const entry of entries)entry.querySelector('button').setAttribute('aria-expanded','false');
    if(previousFocus?.isConnected)previousFocus.focus();
  }
  function onKey(event) {
    if(event.ctrlKey&&event.shiftKey&&event.key.toLowerCase()==='m'){event.preventDefault();event.stopImmediatePropagation();overlay&&!overlay.hidden?close():open();return;}
    if(!overlay||overlay.hidden)return;
    if(event.key==='Escape'){event.preventDefault();event.stopImmediatePropagation();close();return;}
    if(event.key==='Tab') {
      const focusable=[...dialog.querySelectorAll('button,input,textarea,[tabindex="0"]')].filter(item=>!item.disabled&&item.getClientRects().length);
      if(!focusable.length){event.preventDefault();dialog.focus();return;}
      const first=focusable[0],last=focusable.at(-1);
      if(event.shiftKey&&(document.activeElement===first||!dialog.contains(document.activeElement))){event.preventDefault();last.focus();}
      else if(!event.shiftKey&&(document.activeElement===last||!dialog.contains(document.activeElement))){event.preventDefault();first.focus();}
    }
    // Prevent native radar shortcuts while editing inside this modal, without blocking its controls.
    if(!dialog.contains(event.target)){event.stopImmediatePropagation();search.focus();}
  }
  function makeDockButton(text,mark,action){const item=button('',action,'nxm-dock-button');item.innerHTML=`${icon(mark)}<span>${text}</span>`;item.setAttribute('aria-label',text);dock.append(item);return item;}
  function ensureNotes(){
    if(notesPanel)return;
    notesPanel=node('section','nxm-notes');notesPanel.hidden=true;notesPanel.setAttribute('aria-label','Field Notes');
    const header=node('header');header.append(node('strong','','Field Notes'));const hide=button('',()=>{notesPanel.hidden=true;},'nxm-icon-button');hide.innerHTML=icon('close');hide.setAttribute('aria-label','Close Field Notes');header.append(hide);
    notesArea=node('textarea');notesArea.placeholder='Your observations, scan times, and next steps…';notesArea.setAttribute('aria-label','Field notes');notesArea.maxLength=50000;
    try{notesArea.value=localStorage.getItem(notesKey)||'';}catch{}
    notesStatus=node('div','nxm-notes-status','Saved on this device');
    notesArea.addEventListener('input',()=>{clearTimeout(noteTimer);notesStatus.textContent='Saving…';noteTimer=setTimeout(saveNotes,250);});
    notesPanel.append(header,notesArea,notesStatus);document.body.append(notesPanel);mounted.add(notesPanel);
  }
  function saveNotes(){if(!notesArea)return;try{localStorage.setItem(notesKey,notesArea.value);notesStatus.textContent='Saved on this device';}catch{notesStatus.textContent='Local storage unavailable · copy your notes before closing';}}
  function syncPlugin(id){
    cleanups.get(id)?.();cleanups.delete(id);
    if(state.plugins[id]!=='enabled')return;
    if(id==='utc-clock'){
      const clock=node('time','nxm-clock');clock.setAttribute('aria-label','Current UTC time');clock.title='Current UTC time from your computer clock';dock.append(clock);
      const tick=()=>{const now=new Date();clock.dateTime=now.toISOString();clock.textContent=now.toISOString().slice(11,19)+' UTC';};tick();const timer=setInterval(tick,1000);cleanups.set(id,()=>{clearInterval(timer);clock.remove();});
    }else if(id==='field-notes'){
      ensureNotes();const item=makeDockButton('Notes','notes',()=>{notesPanel.hidden=!notesPanel.hidden;if(!notesPanel.hidden)notesArea.focus();});cleanups.set(id,()=>{clearTimeout(noteTimer);saveNotes();notesPanel.hidden=true;item.remove();});
    }else if(id==='map-crosshair'){
      root.setAttribute('data-nxpro-crosshair','');cleanups.set(id,()=>root.removeAttribute('data-nxpro-crosshair'));
    }
  }
  const observer=new MutationObserver(()=>{if(!observerScheduled){observerScheduled=true;requestAnimationFrame(()=>{observerScheduled=false;mountEntry();});}});
  observer.observe(document.documentElement,{childList:true,subtree:true});
  window.addEventListener('keydown',onKey,true);
  const onPageHide=()=>{clearTimeout(noteTimer);saveNotes();};window.addEventListener('pagehide',onPageHide);
  api.marketplace={
    version:'2.0.0',open,close,openThemeSettings,
    onAppearanceChange(enabled){state.enabled=enabled;save();if(cards)renderCards();},
    getState(){return {theme:state.theme,enabled:state.enabled,installedThemes:[...state.installedThemes],plugins:{...state.plugins},themeSettings:structuredClone(state.themeSettings),themeCount:themes.length,pluginCount:plugins.length,plannedPlugins:plannedPlugins.map(item=>item.name),storageAvailable,open:Boolean(overlay&&!overlay.hidden)};},
    destroy(){dead=true;observer.disconnect();window.removeEventListener('keydown',onKey,true);window.removeEventListener('pagehide',onPageHide);for(const cleanup of cleanups.values())cleanup();cleanups.clear();clearTimeout(noteTimer);for(const element of mounted)element.remove();for(const entry of entries)entry.remove();document.adoptedStyleSheets=document.adoptedStyleSheets.filter(item=>item!==sheet&&item!==paletteSheet&&item!==layoutSheet);if(originalThemeAttribute===null)root.removeAttribute('data-nxpro-theme');else root.setAttribute('data-nxpro-theme',originalThemeAttribute);root.removeAttribute('data-nxpro-focus');root.removeAttribute('data-nxpro-crosshair');},
  };
  root.removeAttribute('data-nxpro-focus');applyTheme();api.setEnabled(state.enabled);for(const plugin of plugins)syncPlugin(plugin.id);mountEntry();save();
  return {installed:true,version:api.version,marketplace:api.marketplace.getState(),maps:document.querySelectorAll('.maplibregl-map').length};
})()
