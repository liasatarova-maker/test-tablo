(()=> {
  const button=document.querySelector('#notificationEnable');
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

  button.addEventListener('click',()=>{
    window.setTimeout(()=>{
      if(Notification.permission==='granted'){
        registerPush().catch(error=>console.warn('Push registration failed',error));
      }
    },0);
  });
})();