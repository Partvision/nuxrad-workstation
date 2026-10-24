import { spawn, execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, appendFileSync, existsSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { createServer } from 'node:net';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const directory = path.dirname(fileURLToPath(import.meta.url));
const executable = path.join(process.env.LOCALAPPDATA, 'NUXRAD', 'nuxrad.exe');
const statusFile = path.join(directory, 'status.json');
const logFile = path.join(directory, 'launcher.log');
const verifiedBuilds = new Map([
  ['be66146c955c2933c0988e66be989863a28e2f4b0548a4ba9a3b2fd56b631196','5.42.0'],
  ['0100899c6f8be1b525c0d305abdb3a2a34ff9c25aac75b41caf2598117664636','5.43.0'],
]);
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
const report = data => { writeFileSync(statusFile, JSON.stringify({ updated: new Date().toISOString(), ...data }, null, 2)); };
const log = message => appendFileSync(logFile, `${new Date().toISOString()} ${message}\n`);

class Connection {
  constructor(url) {
    this.id = 0; this.pending = new Map();
    this.socket = new WebSocket(url);
    this.ready = new Promise((resolve, reject) => {
      this.socket.addEventListener('open', resolve, { once: true });
      this.socket.addEventListener('error', () => reject(new Error('Local NUXRAD debugger connection failed')), { once: true });
    });
    this.socket.addEventListener('message', event => {
      const message = JSON.parse(event.data);
      const item = this.pending.get(message.id);
      if (!item) return;
      clearTimeout(item.timer); this.pending.delete(message.id);
      message.error ? item.reject(new Error(message.error.message)) : item.resolve(message.result);
    });
    this.socket.addEventListener('close', () => {
      for (const item of this.pending.values()) { clearTimeout(item.timer); item.reject(new Error('NUXRAD window disconnected')); }
      this.pending.clear();
    });
  }
  async call(method, params = {}) {
    await this.ready;
    return new Promise((resolve, reject) => {
      const id = ++this.id;
      const timer = setTimeout(() => { this.pending.delete(id); reject(new Error(`Local theme operation timed out: ${method}`)); }, 10000);
      this.pending.set(id, { resolve, reject, timer });
      this.socket.send(JSON.stringify({ id, method, params }));
    });
  }
  close() { this.socket.close(); }
}

async function choosePort() {
  const server = createServer();
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
  const port = server.address().port;
  await new Promise(resolve => server.close(resolve));
  return port;
}
function source() {
  const css = readFileSync(path.join(directory, 'theme.css'), 'utf8');
  const js = readFileSync(path.join(directory, 'theme.js'), 'utf8');
  const marketCss = readFileSync(path.join(directory, 'marketplace.css'), 'utf8');
  const marketJs = readFileSync(path.join(directory, 'marketplace.js'), 'utf8');
  const themePackages=readFileSync(path.join(directory,'themes.js'),'utf8');
  const palettes=readFileSync(path.join(directory,'palette-adapter.js'),'utf8');
  return themePackages+'\n;'+palettes+'\n;'+js.replace('__NXPRO_CSS__', () => JSON.stringify(css)) + '\n;' + marketJs.replace('__NXPRO_MARKET_CSS__', () => JSON.stringify(marketCss));
}
async function apply(connection) {
  const result = await connection.call('Runtime.evaluate', { expression: source(), returnByValue: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text || 'Theme script failed');
  return result.result?.value;
}

async function main() {
  if (!existsSync(executable)) throw new Error('NUXRAD was not found in its expected installation directory.');
  const hash = createHash('sha256').update(readFileSync(executable)).digest('hex');
  if (!verifiedBuilds.has(hash)) throw new Error('This theme is verified for NUXRAD 5.42.0 and 5.43.0. The executable changed; review theme compatibility before launching.');
  const processList = execFileSync('tasklist.exe', ['/FI', 'IMAGENAME eq nuxrad.exe', '/FO', 'CSV', '/NH'], { encoding: 'utf8', windowsHide: true });
  let endpoint, child, appPid;
  if (/"nuxrad\.exe"/i.test(processList)) {
    let prior;
    try { prior = JSON.parse(readFileSync(statusFile, 'utf8')); } catch {}
    try {
      const url = new URL(prior.endpoint);
      if (url.protocol !== 'http:' || url.hostname !== '127.0.0.1' || !url.port) throw new Error('No local theme connection');
      if (!processList.split(/\r?\n/).some(row => row.startsWith(`"nuxrad.exe","${Number(prior.pid)}",`))) throw new Error('Stale process identity');
      const targets = await (await fetch(`${url.origin}/json/list`, { signal: AbortSignal.timeout(2000) })).json();
      if (!targets.some(target => target.type === 'page' && new URL(target.url).hostname === 'tauri.localhost')) throw new Error('No NUXRAD page');
      endpoint = url.origin; appPid = Number(prior.pid);
      // A second launch asks Tauri's existing instance to show its main window.
      spawn(executable, [], { cwd: path.dirname(executable), stdio: 'ignore', windowsHide: false }).unref();
      if (Number.isInteger(prior.watcherPid) && prior.watcherPid > 0 && prior.watcherPid !== process.pid) {
        const watcher = execFileSync('tasklist.exe', ['/FI', `PID eq ${prior.watcherPid}`, '/FO', 'CSV', '/NH'], { encoding: 'utf8', windowsHide: true });
        if (watcher.toLowerCase().startsWith('"node.exe",')) return;
      }
    } catch {
      report({ state: 'restart-required', message: 'NUXRAD is already running without a Workstation connection. Fully quit NUXRAD from its tray or user menu, then launch Workstation. Closing its window can leave it running in the background.' });
      log('The existing NUXRAD instance has no verified Workstation connection.');
      return;
    }
  }
  if (!endpoint) {
    const port = await choosePort();
    endpoint = `http://127.0.0.1:${port}`;
    child = spawn(executable, [], {
      cwd: path.dirname(executable),
      env: { ...process.env, WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS: `${process.env.WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS || ''} --remote-debugging-address=127.0.0.1 --remote-debugging-port=${port}`.trim() },
      stdio: 'ignore',
      windowsHide: false,
    });
    appPid = child.pid;
  }
  let exited = false;
  child?.on('exit', () => { exited = true; });
  child?.on('error', error => { log(error.message); exited = true; });
  report({ state: 'starting', endpoint, pid: appPid, watcherPid: process.pid });
  const sessions = new Map();
  const started = Date.now();
  let lastModified = 0;
  let firstApplied = false;
  try {
    while (!exited) {
      try {
        const response = await fetch(`${endpoint}/json/list`, { signal: AbortSignal.timeout(2000) });
        const targets = await response.json();
        const selected = targets.filter(target => {
          try { return target.type === 'page' && new URL(target.url).hostname === 'tauri.localhost' && target.webSocketDebuggerUrl; }
          catch { return false; }
        });
        const modified = Math.max(...['theme.css','theme.js','marketplace.css','marketplace.js','themes.js','palette-adapter.js'].map(file => statSync(path.join(directory,file)).mtimeMs));
        const changed = modified !== lastModified;
        for (const target of selected) {
          let session = sessions.get(target.id);
          if (!session || session.socket.readyState > 1) {
            session = new Connection(target.webSocketDebuggerUrl);
            sessions.set(target.id, session);
            await session.call('Runtime.enable');
            const installed = await apply(session);
            report({ state: 'active', endpoint, pid: appPid, watcherPid: process.pid, targetId: target.id, installed, executableSha256: hash });
            log('Workstation theme attached to the local NUXRAD page.');
            firstApplied = true;
          } else {
            const check = await session.call('Runtime.evaluate', { expression: 'Boolean(window.__nuxradPro)', returnByValue: true });
            if (changed || check.result?.value !== true) {
              const installed = await apply(session);
              report({ state: 'active', endpoint, pid: appPid, watcherPid: process.pid, targetId: target.id, installed, executableSha256: hash });
            }
          }
        }
        lastModified = modified;
      } catch (error) {
        if (firstApplied) log(error.message);
        if (!child && firstApplied) {
          const running = execFileSync('tasklist.exe', ['/FI', `PID eq ${appPid}`, '/FO', 'CSV', '/NH'], { encoding: 'utf8', windowsHide: true });
          if (!running.toLowerCase().startsWith('"nuxrad.exe",')) break;
        }
        if (!firstApplied && Date.now() - started > 60000) throw new Error('NUXRAD started, but its local WebView2 theme connection did not become available. Close NUXRAD and launch normally to use the original appearance.');
      }
      await pause(1500);
    }
  } finally {
    for (const session of sessions.values()) session.close();
  }
  report({ state: 'closed', message: 'NUXRAD closed; the theme watcher has stopped.' });
}
main().catch(error => { log(error.message); report({ state: 'error', message: error.message }); process.exitCode = 1; });
