const test=require('node:test'),assert=require('node:assert/strict'),http=require('node:http'),fs=require('node:fs/promises'),os=require('node:os'),path=require('node:path');
test('HTTP 공유 저장은 다른 출처 쓰기와 오래된 개정 번호를 거절한다',async()=>{
  const dir=await fs.mkdtemp(path.join(os.tmpdir(),'familyboard-http-'));process.env.FAMILYBOARD_DATA_DIR=dir;
  const server=http.createServer(require('./server.cjs').handler);await new Promise(r=>server.listen(0,'127.0.0.1',r));
  const base='http://127.0.0.1:'+server.address().port,state={controls:{locked:true},members:{},published:{},draft:{},alarms:[]};
  const put=(revision,origin=base)=>fetch(base+'/api/state',{method:'PUT',headers:{'Content-Type':'application/json',Origin:origin},body:JSON.stringify({revision,state})});
  try{
    assert.equal((await (await fetch(base+'/api/state')).json()).revision,0);
    assert.equal((await put(0,'https://unrelated.example')).status,403);
    assert.equal((await put(0)).status,200);
    assert.equal((await put(0)).status,409);
    assert.equal((await (await fetch(base+'/api/state')).json()).state.controls.locked,true);
  }finally{await new Promise(r=>server.close(r));await fs.rm(dir,{recursive:true,force:true});}
});
