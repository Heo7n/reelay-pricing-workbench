const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = __dirname;
require('node:child_process').execFileSync(process.execPath, [path.join(root,'source-rules.cjs'),'--check'], {cwd:root,stdio:'inherit'});
require('node:child_process').execFileSync(process.execPath, [path.join(root,'models-source.cjs'),'--check'], {cwd:root,stdio:'inherit'});
require('node:child_process').execFileSync(process.execPath, [path.join(root,'model-catalog-check.cjs'),'--check'], {cwd:root,stdio:'inherit'});
const scripts = ['engine.js', 'generated-minima.js', 'data.js', 'generated-model-minima.js', 'models.js', 'app.js'].map(name => {
  const source = fs.readFileSync(path.join(root, name), 'utf8');
  new vm.Script(source, {filename: name});
  if (/<\/script/i.test(source)) throw new Error('Unsafe inline script ending in '+name);
  return source;
});
const html = fs.readFileSync(path.join(root, 'template.html'), 'utf8')
  .replace('<!--ENGINE-->', scripts.slice(0,-1).map(source=>'<script>'+source+'</script>').join('\n'))
  .replace('<!--APP-->', '<script>'+scripts.at(-1)+'</script>');
fs.mkdirSync(path.join(root, 'dist'), {recursive: true});
fs.writeFileSync(path.join(root, 'dist', 'index.html'), html, 'utf8');
fs.writeFileSync(path.join(root, 'reelay_pricing_workbench_v9.html'), html, 'utf8');
console.log('Built V9.5.9 standalone HTML ('+Buffer.byteLength(html)+' bytes)');
