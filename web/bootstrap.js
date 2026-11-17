(() => {
  const now=new Date(),date=new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).format(now);
  const source=window.FB_SOURCE;source.referenceDate=date;
  const monday=new Date(date+'T12:00:00+09:00');monday.setDate(monday.getDate()-((monday.getDay()+6)%7));
  source.week=Array.from({length:5},(_,i)=>{const d=new Date(monday);d.setDate(d.getDate()+i);return new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).format(d);});
  const start=()=>{const script=document.createElement('script');script.src='app.js';document.body.append(script);};
  if(location.protocol==='file:')start();else window.FamilyBoardSync.start().finally(start);
})();
