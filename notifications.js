(()=>{
  const enableButton=document.querySelector('#notificationEnable');
  if(!enableButton) return;

  const STORAGE_KEY='luxprint-known-order-keys-v1';
  let initialized=false;
  let knownKeys=new Set();

  function orderKey(order){
    return String(order?.order_number||'')+'|'+String(order?.created_at||'');
  }

  function updateButton(){
    if(!('Notification' in window)){
      enableButton.textContent='Уведомления не поддерживаются';
      enableButton.disabled=true;
      return;
    }
    enableButton.classList.remove('is-enabled','is-blocked');
    if(Notification.permission==='granted'){
      enableButton.textContent='Уведомления включены';
      enableButton.classList.add('is-enabled');
    }else if(Notification.permission==='denied'){
      enableButton.textContent='Уведомления заблокированы';
      enableButton.classList.add('is-blocked');
    }else{
      enableButton.textContent='Включить уведомления';
    }
  }

  function playSignal(urgent=false){
    try{
      const AudioContext=window.AudioContext||window.webkitAudioContext;
      if(!AudioContext) return;
      const ctx=new AudioContext();
      const beep=(delay,frequency)=>{
        const osc=ctx.createOscillator();
        const gain=ctx.createGain();
        osc.type='triangle';
        osc.frequency.value=frequency;
        gain.gain.setValueAtTime(0.0001,ctx.currentTime+delay);
        gain.gain.exponentialRampToValueAtTime(0.22,ctx.currentTime+delay+0.02);
        gain.gain.exponentialRampToValueAtTime(0.09,ctx.currentTime+delay+0.34);
        gain.gain.exponentialRampToValueAtTime(0.0001,ctx.currentTime+delay+0.68);
        osc.connect(gain); gain.connect(ctx.destination);
        osc.start(ctx.currentTime+delay); osc.stop(ctx.currentTime+delay+0.7);
      };
      beep(0,1320);
      beep(0.18,1760);
      if(urgent){
        beep(0.72,1568);
        beep(0.90,2093);
      }
      setTimeout(()=>ctx.close().catch(()=>{}),1900);
    }catch(error){console.warn('Notification sound error',error);}
  }

  function notifyOrder(order){
    if(Notification.permission!=='granted') return;
    const urgent=order.urgent===true;
    const title=urgent
      ? '⚡ LuxPrint — СРОЧНЫЙ заказ №'+(order.order_number||'—')
      : 'LuxPrint — новый заказ №'+(order.order_number||'—');
    const lines=[
      order.title||'Без названия',
      'Размер: '+(order.dimensions||'не указан'),
      'Заказчик: '+(order.customer||'не указан'),
      'Сдать: '+formatDeadline(order.deadline)
    ];
    const notification=new Notification(title,{
      body:lines.join('\n'),
      tag:'luxprint-order-'+orderKey(order),
      renotify:true,
      requireInteraction:false
    });
    const timer=setTimeout(()=>notification.close(),60000);
    notification.onclick=()=>{
      clearTimeout(timer);
      window.focus();
      notification.close();
    };
    playSignal(urgent);
  }

  function saveKnown(){
    try{localStorage.setItem(STORAGE_KEY,JSON.stringify([...knownKeys].slice(-1000)));}catch(_){}
  }

  function processOrders(orders){
    const currentNew=(orders||[]).filter((order)=>order.status==='new');
    if(!initialized){
      try{
        const saved=JSON.parse(localStorage.getItem(STORAGE_KEY)||'[]');
        knownKeys=new Set(Array.isArray(saved)?saved:[]);
      }catch(_){knownKeys=new Set();}
      currentNew.forEach((order)=>knownKeys.add(orderKey(order)));
      initialized=true;
      saveKnown();
      return;
    }

    const fresh=currentNew.filter((order)=>!knownKeys.has(orderKey(order)));
    currentNew.forEach((order)=>knownKeys.add(orderKey(order)));
    saveKnown();
    fresh.slice().reverse().forEach(notifyOrder);
  }

  const originalRenderOrders=window.renderOrders;
  window.renderOrders=function(orders){
    originalRenderOrders(orders);
    processOrders(orders);
  };

  enableButton.addEventListener('click',async()=>{
    if(!('Notification' in window)) return;
    if(Notification.permission==='default'){
      await Notification.requestPermission();
    }
    updateButton();
    if(Notification.permission==='granted') playSignal(false);
  });

  updateButton();
})();