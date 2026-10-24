import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import vm from 'node:vm';
const directory=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const context={window:{}};vm.createContext(context);
vm.runInContext(readFileSync(path.join(directory,'themes.js'),'utf8'),context);
vm.runInContext(readFileSync(path.join(directory,'palette-adapter.js'),'utf8'),context);
const engine=context.window.__nuxradThemeCatalog,palette=context.NuxradThemePalettes;
mkdirSync(path.join(directory,'theme-packages'),{recursive:true});mkdirSync(path.join(directory,'palettes'),{recursive:true});
for(const theme of engine.themes){
 const entry={format:theme.format,id:theme.id,name:theme.name,version:theme.version,colors:theme.colors,profile:theme.profile,settings:engine.defaults,jss:engine.jss(theme,{}),palettes:{BR:palette.export(theme.palettes.BR,'BR'),BV:palette.export(theme.palettes.BV,'BV')}};
 writeFileSync(path.join(directory,'theme-packages',theme.id+'.nuxrad-theme.json'),JSON.stringify(entry,null,2));
}
for(const pack of palette.catalog())for(const product of ['BR','BV'])writeFileSync(path.join(directory,'palettes',pack.id+'-'+product+'.pal'),palette.export(pack.id,product));
console.log('Built six complete theme packages and six native .pal files.');
