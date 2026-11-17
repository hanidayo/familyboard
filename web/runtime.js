/* Server-backed state, optimistic revision control, no silent overwrite on conflict. */
window.FamilyBoardSync=(()=>{
  let revision=0,pending=null,saving=false,conflicted=false,online=false,writeTimer;
  const key='familyboard-prototype-v1';
  const status=document.createElement('div');status.className='sync-status';status.setAttribute('role','status');
  function message(value){status.textContent=value;if(!status.isConnected)document.body.append(status);}
  function apply(data){revision=data.revision;if(data.state){localStorage.setItem(key,JSON.stringify(data.state));window.dispatchEvent(new CustomEvent('familyboard-state',{detail:data.state}));}}
  async function request(method,body){const response=await fetch('/api/state',{method,headers:{'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(10000)});if(!response.ok){const e=new Error('sync');e.status=response.status;throw e;}return response.json();}
  async function flush(){
    if(saving||!pending||conflicted)return;saving=true;const value=pending;pending=null;
    try{const data=await request('PUT',{revision,state:value});revision=data.revision;online=true;message('서버 저장됨');}
    catch(e){pending=pending||value;online=false;if(e.status===409){conflicted=true;message('다른 기기에서 수정됨 · 새로고침 후 다시 수정해 주세요. 현재 수정본은 이 기기에 보관됩니다.');}else message('서버 저장 대기 · 연결을 확인해 주세요.');}
    finally{saving=false;if(pending&&!conflicted)setTimeout(flush,3000);}
  }
  async function poll(){if(pending||saving||conflicted)return;try{const data=await request('GET');if(pending||saving||conflicted)return;online=true;if(data.revision!==revision){if(window.FamilyBoardCanSync?.()===false||document.querySelector('dialog[open]')||document.querySelector('input:focus,textarea:focus,select:focus'))return;apply(data);message('서버와 연결됨');}}catch{online=false;message('서버 연결 끊김 · 마지막 저장 자료 표시');}}
  return {
    async start(){try{const data=await request('GET');online=true;apply(data);message('서버와 연결됨');}catch{message('서버 연결 전 · 이 기기에 저장된 자료 표시');}setInterval(poll,2000);},
    save(value){pending=JSON.parse(JSON.stringify(value));clearTimeout(writeTimer);writeTimer=setTimeout(flush,250);message('서버 저장 중…');},
    status(){return {online,revision,pending:!!pending,conflicted};}
  };
})();
