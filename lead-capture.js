/* MedHome — перехват WhatsApp + отправка заявки боту (Cloudflare Worker).
   Конфиг задаётся на странице через window.MEDHOME_LEAD = { worker, secret, site, wa, city }.
   Логика: клик по WhatsApp -> модалка с номером -> заявка боту + конверсия Google -> переход в WhatsApp. */
(function () {
  'use strict';
  var C = window.MEDHOME_LEAD || {};
  var WORKER = C.worker || '';
  var SECRET = C.secret || '';
  var SITE   = C.site   || 'MedHome';
  var CITY   = C.city   || '';

  /* ---- Отправка заявки боту (+ конверсия Google Ads, если нужно) ---- */
  window.medhomeSendLead = function (fields) {
    fields = fields || {};
    var lines = ['🟢 Заявка с сайта: ' + SITE];
    if (fields.phone)   lines.push('Телефон: ' + fields.phone);
    if (fields.name)    lines.push('Имя: ' + fields.name);
    if (fields.service) lines.push('Услуга: ' + fields.service);
    var city = fields.city || CITY;
    if (city)           lines.push('Город: ' + city);
    if (fields.source)  lines.push('Источник: ' + fields.source);
    lines.push('Страница: ' + location.href);
    if (WORKER && SECRET) {
      try {
        fetch(WORKER + '/lead', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ secret: SECRET, text: lines.join('\n') }),
          keepalive: true
        }).catch(function () {});
      } catch (e) {}
    }
    if (fields.fireConversion && typeof window.gtag_report_lead === 'function') {
      try { window.gtag_report_lead(); } catch (e) {}
    }
  };

  /* ---- Стили модалки ---- */
  var css = '' +
    '.mh-ov{position:fixed;inset:0;z-index:9999;display:none;align-items:center;justify-content:center;padding:20px;background:rgba(8,43,51,.55);backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px)}' +
    '.mh-ov.open{display:flex}' +
    '.mh-card{width:100%;max-width:400px;background:#fff;border-radius:22px;padding:26px 24px 22px;box-shadow:0 20px 60px rgba(11,59,68,.28);font-family:inherit;position:relative;animation:mhpop .25s ease}' +
    '@keyframes mhpop{from{opacity:0;transform:translateY(14px) scale(.98)}to{opacity:1;transform:none}}' +
    '.mh-x{position:absolute;top:12px;right:14px;width:34px;height:34px;border:0;background:#f0f5f5;border-radius:50%;font-size:20px;color:#5A7278;cursor:pointer;line-height:1}' +
    '.mh-x:hover{background:#e4eded}' +
    '.mh-h{font-family:inherit;font-size:1.28rem;font-weight:800;color:#0E7C7B;margin:2px 0 6px}' +
    '.mh-p{font-size:.92rem;color:#5A7278;line-height:1.45;margin:0 0 16px}' +
    '.mh-f{display:block;margin:0 0 12px}' +
    '.mh-f span{display:block;font-size:.82rem;font-weight:600;color:#143A40;margin:0 0 5px}' +
    '.mh-f input{width:100%;box-sizing:border-box;padding:13px 14px;border:1.5px solid #d6e2e2;border-radius:12px;font-size:1rem;font-family:inherit;color:#143A40;outline:none;transition:border-color .2s}' +
    '.mh-f input:focus{border-color:#0E7C7B}' +
    '.mh-f input.mh-bad{border-color:#e0564f;background:#fff6f5}' +
    '.mh-btn{width:100%;border:0;cursor:pointer;padding:15px;border-radius:12px;font-size:1rem;font-weight:700;font-family:inherit;color:#0B3B44;background:linear-gradient(135deg,#E3C68C,#C6A15B);display:flex;align-items:center;justify-content:center;gap:9px;transition:filter .2s,transform .05s}' +
    '.mh-btn:hover{filter:brightness(1.05)}.mh-btn:active{transform:translateY(1px)}' +
    '.mh-note{font-size:.76rem;color:#8aa0a4;text-align:center;margin:12px 0 0;line-height:1.4}' +
    '.mh-btn svg{width:19px;height:19px;fill:#0B3B44}';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  /* ---- Разметка модалки ---- */
  var WA_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M17.47 14.38c-.3-.15-1.77-.87-2.04-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51l-.57-.01c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.5 0 1.47 1.07 2.89 1.22 3.09.15.2 2.11 3.22 5.1 4.51.71.31 1.27.49 1.7.63.72.23 1.37.2 1.88.12.58-.09 1.77-.72 2.02-1.42.25-.7.25-1.3.17-1.42-.07-.12-.27-.2-.57-.35M12.05 21.79h-.01a9.8 9.8 0 0 1-4.98-1.36l-.36-.21-3.7.97.99-3.61-.24-.37a9.77 9.77 0 0 1-1.5-5.22c0-5.4 4.4-9.79 9.81-9.79a9.75 9.75 0 0 1 9.79 9.8c0 5.4-4.4 9.79-9.8 9.79m8.33-18.11A11.7 11.7 0 0 0 12.04 0C5.5 0 .16 5.33.16 11.88c0 2.1.55 4.14 1.59 5.94L.06 24l6.33-1.66a11.85 11.85 0 0 0 5.65 1.44h.01c6.54 0 11.87-5.33 11.87-11.88 0-3.18-1.24-6.16-3.49-8.4"/></svg>';
  var ov = document.createElement('div');
  ov.className = 'mh-ov';
  ov.innerHTML =
    '<div class="mh-card" role="dialog" aria-modal="true" aria-label="Оставить заявку">' +
      '<button class="mh-x" type="button" aria-label="Закрыть">&times;</button>' +
      '<h3 class="mh-h">Оставьте номер телефона</h3>' +
      '<p class="mh-p">Мы примем заявку и свяжемся с вами. После отправки откроется WhatsApp.</p>' +
      '<label class="mh-f"><span>Ваше имя</span><input type="text" name="mh-name" autocomplete="name" placeholder="Как к вам обращаться"></label>' +
      '<label class="mh-f"><span>Телефон *</span><input type="tel" name="mh-phone" inputmode="tel" autocomplete="tel" placeholder="+7 ___ ___ __ __"></label>' +
      '<button class="mh-btn" type="button">' + WA_SVG + 'Написать в WhatsApp</button>' +
      '<p class="mh-note">Нажимая кнопку, вы соглашаетесь на обработку контактных данных. Обращения конфиденциальны.</p>' +
    '</div>';
  document.addEventListener('DOMContentLoaded', function () { document.body.appendChild(ov); });

  var pendingHref = '';
  var pendingCtx = {};
  var phoneInput = function () { return ov.querySelector('input[name="mh-phone"]'); };
  var nameInput  = function () { return ov.querySelector('input[name="mh-name"]'); };

  function openModal() { ov.classList.add('open'); document.body.style.overflow = 'hidden'; setTimeout(function () { phoneInput().focus(); }, 60); }
  function closeModal() { ov.classList.remove('open'); document.body.style.overflow = ''; }

  function openWhatsApp(href, phone, name) {
    var out = href;
    try {
      var u = new URL(href, location.href);
      var t = u.searchParams.get('text') || ('Здравствуйте! Заявка с сайта ' + SITE + '.');
      t += '\nМой телефон: ' + phone + (name ? '\nИмя: ' + name : '');
      u.searchParams.set('text', t);
      out = u.toString();
    } catch (e) {
      out = href + (href.indexOf('?') > -1 ? '&' : '?') + 'text=' + encodeURIComponent('Заявка. Телефон: ' + phone);
    }
    window.open(out, '_blank', 'noopener');
  }

  /* ---- Перехват кликов по WhatsApp (фаза capture, чтобы опередить старые обработчики) ---- */
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href*="wa.me"], a[href*="api.whatsapp"]');
    if (!a) return;
    if (a.hasAttribute('data-no-gate') || a.closest('.mh-ov')) return;
    e.preventDefault();
    e.stopPropagation();
    pendingHref = a.getAttribute('href');
    var card = a.closest('[data-city]');
    pendingCtx = { city: card ? card.getAttribute('data-city') : '' };
    openModal();
  }, true);

  /* ---- Кнопки модалки ---- */
  ov.addEventListener('click', function (e) {
    if (e.target.classList.contains('mh-x') || e.target === ov) { closeModal(); return; }
    if (e.target.closest('.mh-btn')) {
      var ph = phoneInput(), nm = nameInput();
      var phone = ph.value.trim(), name = nm.value.trim();
      var digits = phone.replace(/\D/g, '');
      if (digits.length < 10) { ph.classList.add('mh-bad'); ph.focus(); return; }
      ph.classList.remove('mh-bad');
      window.medhomeSendLead({ phone: phone, name: name, city: pendingCtx.city, source: 'WhatsApp-кнопка', fireConversion: true });
      openWhatsApp(pendingHref || ('https://wa.me/' + (C.wa || '')), phone, name);
      closeModal();
      ph.value = ''; nm.value = '';
    }
  });
  ov.addEventListener('input', function (e) {
    if (e.target.classList.contains('mh-bad') && e.target.value.trim()) e.target.classList.remove('mh-bad');
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeModal(); });
})();
