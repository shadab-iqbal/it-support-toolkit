const test = require('node:test');
const assert = require('node:assert/strict');
const C = require('../js/core.js');
const D = require('../js/data.js');

const sample = () => C.makeRequest({title:'Network access after desk move',category:'Network',task:'Open the internal app',impact:'team',urgency:'blocked',error:'No access',steps:'Checked cable'},'2026-10-12T12:00:00.000Z','SK-TEST-1234');

test('Subnet calculator handles normal, boundary, and point-to-point networks',()=>{
  assert.deepEqual(C.subnet('192.168.10.25',24),{network:'192.168.10.0',mask:'255.255.255.0',broadcast:'192.168.10.255',first:'192.168.10.1',last:'192.168.10.254',hosts:254,prefix:24,note:'Traditional IPv4 subnet; network and broadcast addresses excluded.'});
  assert.equal(C.subnet('10.0.0.1',0).hosts,4294967294);
  assert.equal(C.subnet('255.255.255.255',0).network,'0.0.0.0');
  const p31=C.subnet('10.0.0.3',31);assert.equal(p31.network,'10.0.0.2');assert.equal(p31.hosts,2);assert.equal(p31.first,'10.0.0.2');assert.equal(p31.last,'10.0.0.3');assert.equal(p31.broadcast,'Not applicable');
  const p32=C.subnet('255.255.255.255',32);assert.equal(p32.first,'255.255.255.255');assert.equal(p32.last,p32.first);assert.equal(p32.hosts,1);assert.equal(p32.mask,'255.255.255.255');
});
test('Invalid IPs and prefixes are rejected rather than silently coerced',()=>{
  for(const ip of ['256.1.1.1','1.2.3','-1.2.3.4','hello','1.2.3.4;alert(1)','1.2.3.4/24']) assert.throws(()=>C.subnet(ip,24));
  for(const prefix of [-1,33,'24abc','',3.4,'/24']) assert.throws(()=>C.subnet('10.0.0.1',prefix));
});
test('Every scope and urgency combination follows the documented suggested matrix',()=>{
  const expected={individual:['P4','P3','P2'],team:['P3','P2','P1'],organization:['P2','P1','P1']};
  for(const [impact,values] of Object.entries(expected)) ['normal','blocked','critical'].forEach((urgency,i)=>assert.equal(C.priority(impact,urgency),values[i]));
});
test('Resolution requires validation notes and reopening removes the current closure date',()=>{
  const request=sample();assert.equal(request.status,'Draft');assert.equal(request.priority,'P2');
  assert.throws(()=>C.updateStatus(request,'Resolved','   '));assert.throws(()=>C.updateStatus(request,'Sent','test'));
  const resolved=C.updateStatus(request,'Resolved','Confirmed the original application opens.','2026-10-12T13:00:00.000Z');
  assert.equal(resolved.resolvedAt,'2026-10-12T13:00:00.000Z');
  assert.equal(C.updateStatus(resolved,'Resolved','Additional validation.','2026-10-12T14:00:00.000Z').resolvedAt,resolved.resolvedAt);
  assert.equal(C.updateStatus(resolved,'Investigating','Recurred.','2026-10-12T15:00:00.000Z').resolvedAt,null);
});
test('Backups round trip records and reject duplicates or unsupported schema',()=>{
  const state=C.emptyState();state.requests.push(sample());state.bookmarks=['KB-NET-001','unknown','KB-NET-001'];state.checks={'triage:0':true};state.settings.rememberRequests=true;
  const restored=C.validateState(JSON.parse(JSON.stringify(state)),D.guides.map(g=>g.id));
  assert.deepEqual(restored.requests,state.requests);assert.deepEqual(restored.bookmarks,['KB-NET-001']);assert.equal(restored.checks['triage:0'],true);assert.equal(restored.settings.rememberRequests,true);
  assert.throws(()=>C.validateState({...state,schemaVersion:2}));assert.throws(()=>C.validateState({...state,requests:[sample(),sample()]}));
  assert.throws(()=>C.validateState({...state,requests:[{...sample(),status:'Resolved'}]}));
  assert.throws(()=>C.validateState({...state,requests:[{...sample(),createdAt:'not a date'}]}));
  assert.throws(()=>C.validateState({...state,requests:[{...sample(),updatedAt:'2026-10-11T00:00:00Z'}]}));
});
test('Imported strings are bounded, unexpected properties dropped, and secrets not collected as fields',()=>{
  const request={...sample(),title:'x'.repeat(200),notes:'x'.repeat(4000),password:'SECRET'};
  const state=C.validateState({...C.emptyState(),requests:[request],settings:{supportEmail:'javascript:alert(1)',organization:'Demo',rememberRequests:true}});
  assert.equal(state.requests[0].title.length,120);assert.equal(state.requests[0].notes.length,2000);assert.equal(state.settings.supportEmail,'');assert.equal('password' in state.requests[0],false);
  assert.equal(C.escapeHTML('<img src=x onerror="alert(1)">'), '&lt;img src=x onerror=&quot;alert(1)&quot;&gt;');
});
test('CSV export escapes quotes and neutralizes spreadsheet formulas',()=>{
  const csv=C.csv([{...sample(),title:'=HYPERLINK("test")'}]);assert.match(csv,/"'=HYPERLINK\(""test""\)"/);
  for(const title of ['+1','-2','@foo','\t=1','\r=2'])assert.ok(C.csv([{...sample(),title}]).includes('"\''+title));
  assert.match(C.requestText(sample()),/has not been sent to a help desk/);
});
test('Dashboard categories and totals are derived from local records',()=>{
  assert.equal(C.stats([]).total,0);assert.equal(C.stats([]).categories.reduce((n,x)=>n+x.count,0),0);
  const s=C.stats([sample(),{...sample(),id:'SK-TEST-2345',category:'Printing',status:'Resolved'}]);
  assert.equal(s.total,2);assert.equal(s.open,1);assert.equal(s.resolved,1);assert.equal(s.categories.find(x=>x.name==='Network').count,1);
});
test('All guided paths terminate and reference real guides',()=>{
  const slugs=new Set(D.guides.map(g=>g.slug));
  for(const flow of Object.values(D.flows)){
    const visited=new Set();
    function walk(id,stack=[]){assert.ok(flow.nodes[id],`Missing node ${id}`);assert.ok(!stack.includes(id),'Diagnostic flow cannot contain a loop');visited.add(id);const node=flow.nodes[id];if(node.result){assert.ok(slugs.has(node.guide));assert.ok(node.detail);return;}assert.ok(node.answers.length>0);for(const [label,next] of node.answers){assert.ok(label);walk(next,[...stack,id]);}}
    walk(flow.start);assert.equal(visited.size,Object.keys(flow.nodes).length,'All nodes should be reachable');
  }
  assert.equal(new Set(D.guides.map(g=>g.id)).size,D.guides.length);
  for(const g of D.guides){assert.ok(C.CATEGORIES.includes(g.category));assert.equal(g.steps.length,5);assert.ok(g.stop);assert.ok(g.tech.length>0);for(const [,url] of g.sources)assert.ok(url.startsWith('https://'));}
});
