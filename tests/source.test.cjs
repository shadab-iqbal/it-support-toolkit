const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const C=require('../js/core.js');
const D=require('../js/data.js');
const root=path.join(__dirname,'..');

test('Entry assets use portable relative paths and all files exist',()=>{
  const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
  const assets=[...html.matchAll(/(?:src|href)="(\.\/[^"#]+)"/g)].map(m=>m[1]);
  assert.ok(assets.length>=5);for(const asset of assets)assert.ok(fs.existsSync(path.join(root,asset)),`Missing ${asset}`);
  assert.ok(html.includes('lang="en"'));assert.ok(html.includes('Skip to content'));assert.ok(html.includes('aria-live="polite"'));assert.ok(!html.includes('<script src="http'));
});

function boot(hash,initialState){
  const nodes=new Map();
  const fakeNode=key=>{if(!nodes.has(key))nodes.set(key,{innerHTML:'',textContent:'',value:key==='#guide-category'||key==='#request-status'||key==='#command-category'?'all':'',checked:false,elements:{address:{value:'192.168.10.25'},prefix:{value:'24'},impact:{value:'individual'},urgency:{value:'normal'}},classList:{add(){},remove(){},toggle(){}},setAttribute(){},addEventListener(){},focus(){}});return nodes.get(key);};
  const document={querySelector:fakeNode,body:{classList:{remove(){},toggle(){}}},addEventListener(){}};
  const storage={getItem(){return initialState?JSON.stringify(initialState):null;},setItem(){},removeItem(){}};
  const window={ToolkitCore:C,ToolkitData:D,addEventListener(){}};
  vm.runInNewContext(fs.readFileSync(path.join(root,'js/app.js'),'utf8'),{window,document,localStorage:storage,location:{hash},URLSearchParams,setTimeout(){},clearTimeout(){},console});
  return nodes.get('#main').innerHTML;
}
test('Every page renders without a JavaScript exception using a DOM test double',()=>{
  for(const route of ['#home','#guides','#diagnose','#requests','#requests/new','#desk','#settings','#about','#unknown']){
    const html=boot(route);assert.ok(html.includes('<h1>'),route+' needs a heading');assert.ok(!html.includes('undefined'),route+' contains undefined');
  }
  for(const guide of D.guides)assert.ok(boot('#guides/'+guide.slug).includes(guide.id));
  for(const key of Object.keys(D.flows))assert.ok(boot('#diagnose/'+key).includes('answer-list'));
});
test('Request detail renders user text as escaped content and does not offer a fake send action',()=>{
  const state=C.emptyState();state.requests=[C.makeRequest({title:'<img onerror="alert(1)">',task:'<script>alert(1)</script>',category:'Network'},'2026-10-12T12:00:00Z','SK-TEST-9999')];
  const html=boot('#requests/SK-TEST-9999',state);assert.ok(html.includes('&lt;img'));assert.ok(!html.includes('<script>alert'));assert.ok(html.includes('Not submitted to a help desk'));assert.ok(html.includes('Download Markdown'));
});
