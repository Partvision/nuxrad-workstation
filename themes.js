/* Bundled JSS-style theme packages. Styles, defaults, settings, and palette references travel together. */
(() => {
  const themes = [
    { id:'graphite',name:'Graphite',description:'A balanced analyst desk: labeled navigation, crisp panels, and restrained cyan details.',mode:'Dark',tag:'ANALYST DESK',colors:['#0b111a','#121c29','#1a2737','#2b3a4d','#64d8ee','#dce7f3','#a3b6cc'],profile:{rail:164,header:64,radius:8,control:44,font:'"Segoe UI Variable Text","Segoe UI",sans-serif',label:'Labeled desk',surface:'flat',weight:600},palettes:{BR:'classic-ref',BV:'classic-vel'}},
    { id:'midnight',name:'Midnight',description:'A compact instrument panel with an icon rail, lean controls, and precise numeric typography.',mode:'Dark',tag:'COMPACT INSTRUMENTS',colors:['#060c1b','#0d1730','#172441','#2a3d64','#80acff','#e0e9ff','#9aafd2'],profile:{rail:76,header:50,radius:4,control:38,font:'"Cascadia Code","Consolas",monospace',label:'Compact icon rail',surface:'outlined',weight:500},palettes:{BR:'high-contrast-ref',BV:'classic-vel'}},
    { id:'aurora',name:'Aurora',description:'A spacious, softly rounded workspace with pill controls and a quieter visual rhythm.',mode:'Dark',tag:'SOFT WORKSPACE',colors:['#081410','#10251d','#1a352a','#2c5141','#7ce7b7','#e0f4e9','#a2c5b4'],profile:{rail:184,header:72,radius:16,control:50,font:'"Segoe UI Variable Text","Segoe UI",sans-serif',label:'Spacious pill controls',surface:'soft',weight:600},palettes:{BR:'color-friendly-ref',BV:'color-friendly-vel'}},
    { id:'ember',name:'Ember',description:'Squared instrument controls, condensed headings, and a dense warm-toned analysis layout.',mode:'Dark',tag:'FIELD INSTRUMENTS',colors:['#17110d','#261d17','#35291f','#594433','#f1bd77','#f4e7d8','#c6ad94'],profile:{rail:148,header:52,radius:1,control:36,font:'"Bahnschrift","Segoe UI",sans-serif',label:'Dense squared instruments',surface:'outlined',weight:650},palettes:{BR:'high-contrast-ref',BV:'classic-vel'}},
    { id:'amethyst',name:'Amethyst',description:'A slim dock, floating panels, soft depth, and rounded controls for a studio-like workspace.',mode:'Dark',tag:'FLOATING STUDIO',colors:['#110e1b','#1e182f','#2c2441','#4b3d64','#beabff','#ede6ff','#b8a8d1'],profile:{rail:88,header:68,radius:18,control:48,font:'"Segoe UI Variable Display","Segoe UI",sans-serif',label:'Floating icon dock',surface:'glass',weight:550},palettes:{BR:'color-friendly-ref',BV:'color-friendly-vel'}},
    { id:'daylight',name:'Daylight',description:'A spacious light desk with clear dividers, wide labeled navigation, and editorial headings.',mode:'Light',tag:'DAY SHIFT',colors:['#e8edf3','#f8fafc','#e4ebf3','#bdcbdc','#186b92','#182c43','#526980'],profile:{rail:188,header:72,radius:10,control:48,font:'"Segoe UI Variable Text","Segoe UI",sans-serif',label:'Spacious labeled desk',surface:'flat',weight:600},palettes:{BR:'classic-ref',BV:'color-friendly-vel'}},
  ];
  for(const theme of themes){theme.version='2.0.0';theme.format='nuxrad-jss-theme/v1';theme.capabilities=['layout','typography','controls','panels','radar-palettes'];for(const product of ['BR','BV'])theme.palettes[product]=theme.palettes[product].startsWith('color-friendly')?'color-friendly':theme.palettes[product].startsWith('high-contrast')?'contrast':'classic';}
  const defaults={scale:100,density:'theme',corners:'theme',navigation:'theme',font:'theme',motion:'system',contrast:'normal',reflectivityPalette:'keep',velocityPalette:'keep'};
  const settingsSchema=[
    {id:'scale',title:'Interface scale',description:'Resize interface text and controls together.',options:[[90,'90%'],[100,'100%'],[110,'110%'],[120,'120%']]},
    {id:'density',title:'Control density',description:'Use the theme’s spacing or choose your own.',options:[['theme','Theme default'],['compact','Compact'],['comfortable','Comfortable']]},
    {id:'corners',title:'Corners',description:'Shape buttons, panels, and menus.',options:[['theme','Theme default'],['square','Square'],['soft','Soft rounded']]},
    {id:'navigation',title:'Left navigation',description:'Choose a labeled menu or a compact icon rail.',options:[['theme','Theme default'],['labels','Labeled menu'],['icons','Icon rail']]},
    {id:'font',title:'Interface font',description:'Scientific plots keep their own rendering.',options:[['theme','Theme font'],['system','System sans serif'],['mono','Monospace']]},
    {id:'motion',title:'Motion',description:'Reduce interface transitions without changing radar playback.',options:[['system','Follow system preference'],['reduced','Reduced']]},
    {id:'contrast',title:'Panel contrast',description:'Increase control and panel boundaries.',options:[['normal','Theme default'],['high','High contrast']]},
  ];
  function normalize(value={}) {
    const result={...defaults};
    for(const item of settingsSchema)if(item.options.some(([key])=>String(key)===String(value[item.id])))result[item.id]=item.id==='scale'?Number(value[item.id]):value[item.id];
    for(const key of ['reflectivityPalette','velocityPalette'])if(typeof value[key]==='string')result[key]=value[key];
    return result;
  }
  const kebab=key=>key.startsWith('--')?key:key.replace(/[A-Z]/g,match=>'-'+match.toLowerCase());
  const unitless=new Set(['opacity','fontWeight','lineHeight','zIndex','flex','flexGrow','flexShrink','order']);
  function selectorList(value){
    const result=[];let start=0,depth=0,quote='';
    for(let i=0;i<value.length;i++){
      const c=value[i];if(c==='\\'){i++;continue;}
      if(quote){if(c===quote)quote='';continue;}
      if(c==='"'||c==="'"){quote=c;continue;}
      if(c==='('||c==='[')depth++;else if(c===')'||c===']')depth--;
      else if(c===','&&depth===0){result.push(value.slice(start,i).trim());start=i+1;}
    }
    result.push(value.slice(start).trim());return result;
  }
  function compile(rules,scope='html[data-nuxrad-pro="on"]') {
    let output='';
    for(const [selector,style]of Object.entries(rules)) {
      if(selector.startsWith('@media')||selector.startsWith('@supports')){output+=`${selector}{${compile(style,scope)}}`;continue;}
      const resolved=selectorList(scope).flatMap(parent=>selectorList(selector).map(part=>part.includes('&')?part.replaceAll('&',parent):parent+' '+part)).join(',');
      const declarations=[],nested={};
      for(const [key,value]of Object.entries(style)){
        if(value&&typeof value==='object'){nested[key]=value;continue;}
        if(value===null||value===undefined)continue;
        const rendered=typeof value==='number'&&!unitless.has(key)&&!key.startsWith('--')?value+'px':String(value);
        declarations.push(`${kebab(key)}:${rendered.replace(/\s*!important\s*$/,'')}!important`);
      }
      if(declarations.length)output+=`${resolved}{${declarations.join(';')}}`;
      for(const [key,value]of Object.entries(nested)){
        if(key.startsWith('@'))output+=`${key}{${compile({'&':value},resolved)}}`;
        else output+=compile({[key]:value},resolved);
      }
    }
    return output;
  }
  function jss(theme,rawSettings) {
    const settings=normalize(rawSettings),p=theme.profile,scale=settings.scale/100;
    const icons=settings.navigation==='icons'||(settings.navigation==='theme'&&p.rail<100);
    const rail=icons?(p.rail<100?p.rail:76):Math.max(148,p.rail);
    const radius=settings.corners==='square'?0:settings.corners==='soft'?14:p.radius;
    const control=settings.density==='compact'?36:settings.density==='comfortable'?50:p.control;
    const font=settings.font==='mono'?'"Cascadia Code","Consolas",monospace':settings.font==='system'?'"Segoe UI",sans-serif':p.font;
    const border=settings.contrast==='high'?'var(--ui-text-muted)':'var(--nxpro-line)';
    const glass=p.surface==='glass';
    const shadow=p.surface==='outlined'?'none':p.surface==='soft'?'0 7px 24px #0002':glass?'0 10px 32px #0005':'0 2px 10px #0002';
    const r={
      '&':{'--ui-header-height':`${Math.round(p.header*scale)}px`,'--ui-radius':`${radius/2}px`,'--radius-control':`${radius}px`,'--font-sans':font,'--nxpro-rail-width':`${rail}px`,fontSize:14*scale},
      '& body, & #__nuxt':{fontFamily:font},
      '& [data-app-navbar]':{borderBottom:`${p.surface==='outlined'?2:1}px solid ${border}`,boxShadow:p.surface==='outlined'?'none':'0 3px 16px #0002',background:glass?'color-mix(in srgb,var(--nxpro-panel) 90%,transparent)':'var(--nxpro-panel)',backdropFilter:glass?'blur(16px)':'none'},
      '& [data-app-navbar] [data-slot="root"]':{minHeight:p.header*scale},
      '& #dashboard-sidebar-toolbox[data-collapsed="true"]':{width:rail,minWidth:rail},
      '& .nxpro-rail':{width:rail,minWidth:rail,maxWidth:rail,padding:`${icons?16:22}px ${icons?6:12}px 12px`,gap:settings.density==='compact'?2:p.surface==='soft'?9:5,borderRight:`1px solid ${border}`,background:'var(--nxpro-panel)'},
      '& .nxpro-rail button':{width:rail-(icons?12:24),minWidth:rail-(icons?12:24),minHeight:Math.round(control*scale),borderRadius:radius,fontFamily:font,fontWeight:p.weight,flexDirection:icons?'column':'row',justifyContent:icons?'center':'flex-start',gap:icons?5:12,padding:icons?'7px 4px':`${settings.density==='compact'?7:10}px 12px`,fontSize:(icons?10:12)*scale},
      '& .nxpro-rail button [class*="text-"]':{fontFamily:font,fontSize:(icons?9.5:12)*scale,lineHeight:1.3},
      '& .nxpro-rail::before':{content:icons?'"TOOLS"':'"WORKSPACE"',fontFamily:font,fontSize:9*scale,padding:icons?'0 0 8px':'0 12px 12px',letterSpacing:p.surface==='outlined'?'.18em':'.12em'},
      '& .nxpro-rail .nxm-entry-label':{fontSize:icons?7:9,padding:icons?'0 0 10px':'0 12px 12px',textAlign:icons?'center':'left'},
      '& .nxpro-rail .nxm-entry-button':{flexDirection:icons?'column':'row'},
      '& .nxpro-rail .nxm-entry-button span':{fontSize:icons?9:12},
      '& .nxpro-right-rail button':{borderRadius:radius,minHeight:control+6,fontFamily:font},
      '& #dashboard-panel-home':{padding:glass?'14px 14px 12px':p.surface==='outlined'?'4px 4px 4px':'10px 10px 8px'},
      '& #dashboard-panel-home > [data-slot="body"]':{borderRadius:glass?radius+2:radius,boxShadow:`0 0 0 ${settings.contrast==='high'?2:1}px ${border}${shadow==='none'?'':','+shadow}`},
      '& .nxpro-pane-label':{borderRadius:radius,fontFamily:font,fontSize:12*scale,minHeight:Math.max(28,control-10),boxShadow:shadow,border:`1px solid ${border}`,letterSpacing:p.surface==='outlined'?'.04em':'.01em'},
      '& .nxpro-timeline':{borderRadius:radius,padding:settings.density==='compact'?'4px 7px':'9px 12px',fontFamily:font,boxShadow:shadow,backdropFilter:glass?'blur(14px)':'none'},
      '& [data-app-navbar] button, & [data-slot="header"] button':{borderRadius:radius,fontFamily:font},
      '& [data-slot="title"]':{fontFamily:font,fontWeight:p.weight,letterSpacing:p.surface==='outlined'?'.05em':'-.01em'},
      '& [role="dialog"][data-slot="content"], & [role="menu"], & [role="listbox"]':{borderRadius:radius+2,border:`1px solid ${border}`,boxShadow:shadow,fontFamily:font},
      '& input:not([type="range"]):not([type="checkbox"]):not([type="radio"]), & select, & textarea':{borderRadius:radius,fontFamily:font},
      '& .nxm-dialog, & .nxm-card, & .nxm-notes':{borderRadius:radius+4,fontFamily:font},
      '& .nxm-button, & .nxm-filter, & .nxm-search, & .nxm-dock-button':{borderRadius:radius,fontFamily:font},
      '& .nxm-dialog':{left:rail+12,top:p.header*scale+16},
      '@media (max-width: 1000px)':{
        '& #dashboard-sidebar-toolbox[data-collapsed="true"], & .nxpro-rail':{width:76,minWidth:76,maxWidth:76},
        '& .nxpro-rail':{padding:'12px 6px'},
        '& .nxpro-rail button':{width:64,minWidth:64,flexDirection:'column',justifyContent:'center',gap:4},
        '& .nxpro-rail button [class*="text-"]':{fontSize:10},
        '& .nxm-dialog':{left:88},
      },
      '@media (max-width: 750px)':{'& .nxm-dialog':{left:12,top:15}},
    };
    if(settings.motion==='reduced')r['& .nxpro-rail button, & .nxm-card, & [data-slot="content"]']={transition:'none',animation:'none'};
    return r;
  }
  window.__nuxradThemeCatalog={version:'2.0.0',themes,defaults,settingsSchema,normalize,compile,jss,stylesheet:(theme,settings)=>compile(jss(theme,settings))};
  return {themePackages:themes.length,format:'nuxrad-jss-theme/v1'};
})()
