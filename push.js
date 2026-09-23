(()=> {
  const button=document.querySelector('#notificationEnable');
  const DISABLED_KEY='luxprint-push-disabled';
  if(!button || !('serviceWorker' in navigator)) return;

  async function registerPush(){
    if(Notification.permission!=='granted') return null;
    const registration=await navigator.serviceWorker.register('./firebase-messaging-sw.js');
    await navigator.serviceWorker.ready;
    const { initializeApp }=await import('https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js');
    const { getMessaging, getToken }=await import('https://www.gstatic.com/firebasejs/12.3.0/firebase-messaging.js');
    const app=initializeApp(LUXPRINT_FIREBASE_CONFIG);
    const messaging=getMessaging(app);
    const token=await getToken(messaging,{
      vapidKey:LUXPRINT_VAPID_KEY,
      serviceWorkerRegistration:registration
    });
    if(token){
      localStorage.setItem('luxprint-fcm-token',token);
      console.info('LuxPrint push token registered');
    }
    return token;
  }

  window.luxprintRegisterPush=registerPush;

  if(Notification.permission==='granted'){
    registerPush().catch(error=>console.warn('Push registration failed',error));
  }

  button.addEventListener('click',async()=>{
    if(Notification.permission!=='granted') return;
    const disabled=localStorage.getItem(DISABLED_KEY)==='1';
    if(disabled){
      localStorage.removeItem(DISABLED_KEY);
      await registerPush();
      button.textContent='Уведомления включены';
      button.classList.add('is-enabled');
    }else{
      localStorage.setItem(DISABLED_KEY,'1');
      localStorage.removeItem('luxprint-fcm-token');
      button.textContent='Уведомления выключены';
      button.classList.remove('is-enabled');
    }
  });

  if(Notification.permission==='granted' && localStorage.getItem(DISABLED_KEY)==='1'){
    button.textContent='Уведомления выключены';
    button.classList.remove('is-enabled');
  }
})();