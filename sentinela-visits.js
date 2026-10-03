/* Daily anonymous browser count. No fingerprint, IP, referrer or page URL collected. */
(function () {
  if (navigator.webdriver || navigator.doNotTrack === '1' || navigator.globalPrivacyControl) return;
  if (document.visibilityState !== 'visible') {
    document.addEventListener('visibilitychange', function visible() {
      if (document.visibilityState === 'visible') { document.removeEventListener('visibilitychange', visible); count(); }
    });
  } else count();
  function count() {
    try {
      var day = new Intl.DateTimeFormat('en-CA', {timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
      var item = JSON.parse(localStorage.getItem('sentinela-daily-browser') || 'null');
      if (!item || item.day !== day || typeof item.id !== 'string') {
        item = {day:day,id:crypto.randomUUID()};
        localStorage.setItem('sentinela-daily-browser',JSON.stringify(item));
      }
      fetch('/.netlify/functions/sentinela-visits',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:item.id}),credentials:'omit',keepalive:true}).catch(function(){});
    } catch (_) { /* Storage unavailable: skip instead of overcounting repeated visits. */ }
  }
})();
