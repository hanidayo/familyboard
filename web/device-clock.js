(function(root,factory){const value=factory();if(typeof module==='object'&&module.exports)module.exports=value;else root.FamilyBoardClock=value;})(typeof globalThis!=='undefined'?globalThis:this,function(){
  function schedule(alarms,now=Date.now()){
    const seoul=new Date(now+9*3600000);const dayStart=Date.UTC(seoul.getUTCFullYear(),seoul.getUTCMonth(),seoul.getUTCDate())-9*3600000;
    let last=null;
    for(let back=0;back<8;back++){
      const weekday=(seoul.getUTCDay()-back+7)%7;
      for(const a of alarms||[]){if(!a.enabled||!a.days?.includes(weekday)||!/^\d{2}:\d{2}$/.test(a.time)||!['on','off'].includes(a.action))continue;
        const [h,m]=a.time.split(':').map(Number);if(h>23||m>59)continue;
        const at=dayStart-back*86400000+(h*60+m)*60000;
        if(at<=now&&(!last||at>last.at))last={at,action:a.action};
      }
    }
    return last||{at:0,action:'on'};
  }
  function blackout(state,wakeUntil=0,wakeStarted=0,now=Date.now()){
    const last=schedule(state.alarms,now);
    if(wakeUntil>now&&wakeStarted>=last.at)return false;
    return !!state.controls.blackout||last.action==='off';
  }
  return {schedule,blackout};
});
