const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = __dirname;
require('node:child_process').execFileSync(process.execPath, [path.join(root,'source-rules.cjs'),'--check'], {cwd:root,stdio:'inherit'});
require('node:child_process').execFileSync(process.execPath, [path.join(root,'models-source.cjs'),'--check'], {cwd:root,stdio:'inherit'});
require('node:child_process').execFileSync(process.execPath, [path.join(root,'model-catalog-check.cjs'),'--check'], {cwd:root,stdio:'inherit'});
const scripts = ['engine.js', 'generated-minima.js', 'data.js', 'generated-model-minima.js', 'models.js', 'pricing-profiles.js', 'cloud-ui.js', 'app.js'].map(name => {
  const source = fs.readFileSync(path.join(root, name), 'utf8');
  new vm.Script(source, {filename: name});
  if (/<\/script/i.test(source)) throw new Error('Unsafe inline script ending in '+name);
  return source;
});
const cloudConfig = JSON.parse(fs.readFileSync(path.join(root, 'cloud-config.json'), 'utf8'));
if (Object.keys(cloudConfig).some(key => !['url', 'publishableKey'].includes(key))) throw new Error('Only public cloud configuration belongs in the standalone HTML');
require('./cloud-client.cjs').validateConfig(cloudConfig);
const cloudBundle = require('esbuild').buildSync({entryPoints:[path.join(root,'cloud-runtime.cjs')],bundle:true,write:false,minify:true,platform:'browser',target:['chrome110','edge110','safari16'],supported:{'template-literal':false},define:{REELAY_CLOUD_CONFIG:JSON.stringify(cloudConfig)},legalComments:'none'}).outputFiles[0].text;
if (/<\/script/i.test(cloudBundle)) throw new Error('Unsafe cloud script ending');
let template = fs.readFileSync(path.join(root, 'template.html'), 'utf8');
for (const [asset, mime] of [
  ['assets/bootstrap-icons/bootstrap-icons.woff2', 'font/woff2'],
  ['assets/brand/reelay-wordmark.png', 'image/png'],
  ['assets/brand/reelay-symbol.png', 'image/png'],
]) {
  if (!template.includes(asset)) throw new Error('Missing asset reference: '+asset);
  template = template.replaceAll(asset, 'data:'+mime+';base64,'+fs.readFileSync(path.join(root,asset)).toString('base64'));
}
const html = template
  .replace('<!--ENGINE-->', '<script>'+cloudBundle+'</script>\n'+scripts.slice(0,-1).map(source=>'<script>'+source+'</script>').join('\n'))
  .replace('<!--APP-->', '<script>'+scripts.at(-1)+'</script>');
fs.mkdirSync(path.join(root, 'dist'), {recursive: true});
fs.writeFileSync(path.join(root, 'dist', 'index.html'), html, 'utf8');
fs.writeFileSync(path.join(root, 'reelay_pricing_workbench_v9.html'), html, 'utf8');
console.log('Built V9.16.0 standalone HTML ('+Buffer.byteLength(html)+' bytes)');
