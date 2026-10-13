(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.ToolkitCore = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const STATUSES = ['Draft', 'Investigating', 'Waiting', 'Resolved'];
  const CATEGORIES = ['Network', 'Account access', 'Endpoint performance', 'Printing', 'Applications', 'Security'];
  const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const priority = (impact, urgency) => {
    const matrix = {individual:{normal:'P4',blocked:'P3',critical:'P2'},team:{normal:'P3',blocked:'P2',critical:'P1'},organization:{normal:'P2',blocked:'P1',critical:'P1'}};
    return matrix[impact]?.[urgency] || 'P4';
  };
  const toIPv4 = value => {
    if (!/^\d{1,3}(\.\d{1,3}){3}$/.test(value)) throw new Error('Enter an IPv4 address, such as 192.168.10.25.');
    const octets = value.split('.').map(Number);
    if (octets.some(n => n > 255)) throw new Error('Each IPv4 octet must be between 0 and 255.');
    return octets.reduce((n, v) => n * 256 + v, 0);
  };
  const fromIPv4 = n => [24,16,8,0].map(shift => (n >>> shift) & 255).join('.');
  function subnet(address, prefix) {
    const ip = toIPv4(address.trim());
    if (!/^\d{1,2}$/.test(String(prefix)) || Number(prefix) > 32) throw new Error('Enter a prefix from 0 to 32.');
    const bits = Number(prefix), block = 2 ** (32 - bits), network = Math.floor(ip / block) * block;
    const last = network + block - 1;
    return {network:fromIPv4(network),mask:fromIPv4(4294967296 - block),broadcast:bits>=31?'Not applicable':fromIPv4(last),first:fromIPv4(network+(bits<31?1:0)),last:fromIPv4(last-(bits<31?1:0)),hosts:bits<31?block-2:block,prefix:bits,note:bits===31?'Two addresses for a point-to-point /31 link; verify peer support.':bits===32?'A /32 identifies one host.':'Traditional IPv4 subnet; network and broadcast addresses excluded.'};
  }
  function emptyState() { return {schemaVersion:1,requests:[],checks:{},bookmarks:[],settings:{supportEmail:'',organization:'My workspace',rememberRequests:false}}; }
  function cleanText(value, max=2000) { return typeof value === 'string' ? value.slice(0,max) : ''; }
  function validDate(value) { return typeof value === 'string' && !Number.isNaN(Date.parse(value)); }
  function validateState(input, guideIds=[]) {
    if (!input || input.schemaVersion !== 1 || !Array.isArray(input.requests) || input.requests.length>500) throw new Error('This is not a supported SupportKit backup (version 1, maximum 500 requests).');
    const base = emptyState(), ids = new Set();
    base.requests = input.requests.map(r => {
      if (!r || !/^SK-[A-Za-z0-9-]{4,60}$/.test(r.id) || ids.has(r.id) || !STATUSES.includes(r.status) || !CATEGORIES.includes(r.category) || !validDate(r.createdAt) || !validDate(r.updatedAt) || !cleanText(r.title,120).trim()) throw new Error('A request has missing or invalid fields. Nothing was imported.');
      ids.add(r.id);
      const impact=['individual','team','organization'].includes(r.impact)?r.impact:'individual';
      const urgency=['normal','blocked','critical'].includes(r.urgency)?r.urgency:'normal';
      const resolvedAt=r.status==='Resolved'&&validDate(r.resolvedAt)?r.resolvedAt:null;
      if(r.status==='Resolved' && (!resolvedAt || !cleanText(r.resolution).trim())) throw new Error('Resolved requests need a resolution note and date.');
      if(Date.parse(r.updatedAt)<Date.parse(r.createdAt) || (resolvedAt && Date.parse(resolvedAt)<Date.parse(r.createdAt))) throw new Error('Request dates are inconsistent.');
      return {id:r.id,title:cleanText(r.title,120),category:r.category,impact,urgency,priority:priority(impact,urgency),asset:cleanText(r.asset,80),task:cleanText(r.task),error:cleanText(r.error),steps:cleanText(r.steps),notes:cleanText(r.notes),resolution:cleanText(r.resolution),status:r.status,createdAt:r.createdAt,updatedAt:r.updatedAt,resolvedAt};
    });
    base.bookmarks=Array.isArray(input.bookmarks)?[...new Set(input.bookmarks.filter(x=>guideIds.includes(x)))]:[];
    const email=cleanText(input.settings?.supportEmail,200);
    base.settings={supportEmail:/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(email)?email:'',organization:cleanText(input.settings?.organization,80)||'My workspace',rememberRequests:input.settings?.rememberRequests===true};
    if (input.checks && typeof input.checks==='object') for(const key of Object.keys(input.checks)) if(/^([a-z0-9-]+):([0-9]{1,3})$/.test(key)&& typeof input.checks[key]==='boolean') base.checks[key]=input.checks[key];
    return base;
  }
  function makeRequest(fields, now = new Date().toISOString(), id) {
    const impact=fields.impact||'individual', urgency=fields.urgency||'normal';
    return {id:id||`SK-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2,7).toUpperCase()}`,title:cleanText(fields.title,120).trim(),category:fields.category,impact,urgency,priority:priority(impact,urgency),asset:cleanText(fields.asset,80).trim(),task:cleanText(fields.task).trim(),error:cleanText(fields.error).trim(),steps:cleanText(fields.steps).trim(),notes:'',resolution:'',status:'Draft',createdAt:now,updatedAt:now,resolvedAt:null};
  }
  function updateStatus(request, status, resolution, now=new Date().toISOString()) {
    if (!STATUSES.includes(status)) throw new Error('Choose a supported status.');
    if (status==='Resolved' && !String(resolution||'').trim()) throw new Error('Add a resolution note explaining how the original task was verified.');
    return {...request,status,resolution:cleanText(resolution),updatedAt:now,resolvedAt:status==='Resolved'?(request.resolvedAt||now):null};
  }
  function requestText(r) {
    return [`# ${r.id}: ${r.title}`,'',`Category: ${r.category}`,`Suggested priority: ${r.priority}`,`Local status: ${r.status}`,`Impact: ${r.impact}`,`Urgency: ${r.urgency}`,`Device / asset: ${r.asset || 'Not provided'}`,`Created: ${r.createdAt}`,'','## Task that failed',r.task,'','## Error or observation',r.error||'Not provided','','## Steps already tried',r.steps||'None recorded','','## Technician notes',r.notes||'None recorded','','## Resolution and validation',r.resolution||'Not yet recorded','','Prepared with SupportKit. This draft has not been sent to a help desk.'].join('\n');
  }
  function csv(requests) {
    const cell = value => {let v=String(value??'');if(/^[\s]*[=+@-]/.test(v))v="'"+v;return '"'+v.replace(/"/g,'""')+'"';};
    const keys=['id','title','category','priority','status','createdAt','updatedAt','resolvedAt'];
    return [keys,...requests.map(r=>keys.map(k=>r[k]||''))].map(row=>row.map(cell).join(',')).join('\r\n');
  }
  function stats(requests) {
    const resolved = requests.filter(r=>r.status==='Resolved');
    return {total:requests.length,open:requests.length-resolved.length,resolved:resolved.length,categories:CATEGORIES.map(name=>({name,count:requests.filter(r=>r.category===name).length}))};
  }
  return {STATUSES,CATEGORIES,escapeHTML,priority,subnet,emptyState,validateState,makeRequest,updateStatus,requestText,csv,stats};
});
