const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = __dirname;
const scripts = ['engine.js', 'data.js', 'app.js'].map(name => {
  const source = fs.readFileSync(path.join(root, name), 'utf8');
  new vm.Script(source, {filename: name});
  if (/<\/script/i.test(source)) throw new Error('Unsafe inline script ending in '+name);
  return source;
});
const html = fs.readFileSync(path.join(root, 'template.html'), 'utf8')
  .replace('<!--ENGINE-->', '<script>'+scripts[0]+'</script>\n<script>'+scripts[1]+'</script>')
  .replace('<!--APP-->', '<script>'+scripts[2]+'</script>');
fs.mkdirSync(path.join(root, 'dist'), {recursive: true});
fs.writeFileSync(path.join(root, 'dist', 'index.html'), html, 'utf8');
fs.writeFileSync(path.join(root, 'reelay_pricing_workbench_v9.html'), html, 'utf8');
console.log('Built V9.2 standalone HTML ('+Buffer.byteLength(html)+' bytes)');
