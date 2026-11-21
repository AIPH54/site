// ── PROGRESS BAR ────────────────────────────────────────
let scrollUpdatePending = false;
function updateScrollUI() {
  if (scrollUpdatePending) return;
  scrollUpdatePending = true;
  window.requestAnimationFrame(() => {
    const bar = document.getElementById('progress');
    const nav = document.getElementById('nav');
    const scrollY = window.scrollY;
    if (bar) {
      const total = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.width = (total > 0 ? (scrollY / total) * 100 : 0) + '%';
    }
    if (nav) {
      nav.classList.toggle('is-scrolled', scrollY > 12);
      if (!document.body.classList.contains('aiph-page')) {
        nav.style.boxShadow = scrollY > 20 ? '0 2px 24px rgba(0,0,0,0.06)' : 'none';
      }
    }
    scrollUpdatePending = false;
  });
}
window.addEventListener('scroll', updateScrollUI, { passive: true });

// ── BURGER ──────────────────────────────────────────────
const burger = document.getElementById('burger');
const mobileMenu = document.getElementById('mobileMenu');
if (burger && mobileMenu) {
  burger.addEventListener('click', () => {
    const isOpen = mobileMenu.classList.toggle('open');
    burger.setAttribute('aria-expanded', String(isOpen));
    burger.setAttribute('aria-label', isOpen ? 'Fermer le menu' : 'Ouvrir le menu');
  });
}
function closeMobile() {
  if (mobileMenu) mobileMenu.classList.remove('open');
  if (burger) {
    burger.setAttribute('aria-expanded', 'false');
    burger.setAttribute('aria-label', 'Ouvrir le menu');
  }
}

// ── VIDÉO EMPLOI : chargement à la demande ──────────────
// Le lecteur Canva n'est chargé qu'après une action volontaire du visiteur.
document.querySelectorAll('.emploi-video-launch').forEach(button => {
  button.addEventListener('click', () => {
    const frame = button.closest('.emploi-video-frame');
    const source = frame && frame.dataset.videoSrc;
    if (!frame || !source) return;

    const iframe = document.createElement('iframe');
    iframe.src = source;
    iframe.title = "Présentation vidéo de l'AIPH";
    iframe.loading = 'lazy';
    iframe.allow = 'fullscreen; autoplay';
    iframe.allowFullscreen = true;
    iframe.referrerPolicy = 'strict-origin-when-cross-origin';
    frame.replaceChildren(iframe);
  });
});

// ── FADE-UP OBSERVER ────────────────────────────────────
function observeFadeUps() {
  const elements = document.querySelectorAll('.fade-up');
  if (!('IntersectionObserver' in window)) {
    elements.forEach(el => el.classList.add('visible'));
    return;
  }
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });
  elements.forEach(el => obs.observe(el));
}
observeFadeUps();

// ── HISTOIRE AIPH : rail qui progresse au défilement ────
(function initHistoryRail() {
  const timeline = document.getElementById('historyTimeline');
  if (!timeline) return;
  const svg = document.getElementById('historyRail');
  const base = document.getElementById('historyRailBase');
  const progress = document.getElementById('historyRailProgress');
  const markers = Array.from(timeline.querySelectorAll('.history-marker'));
  if (!svg || !base || !progress || markers.length < 2) return;

  let totalLength = 0, markerLengths = [], resizeTimer = null, scrollPending = false;
  function segment(a, b) {
    const y = (a.y + b.y) / 2;
    const bend = Math.min(9, Math.max(4, Math.abs(b.y - a.y) * 0.035));
    return ' C ' + (a.x + bend) + ' ' + y + ' ' + (b.x + bend) + ' ' + y + ' ' + b.x + ' ' + b.y;
  }
  function build() {
    const box = timeline.getBoundingClientRect();
    if (box.width < 10 || box.height < 10) return;
    const points = markers.map(marker => {
      const r = marker.getBoundingClientRect();
      return { x: r.left - box.left + r.width / 2, y: r.top - box.top + r.height / 2 };
    });
    svg.setAttribute('viewBox', '0 0 ' + Math.max(1, box.width) + ' ' + Math.max(1, box.height));
    let d = 'M ' + points[0].x + ' 0 L ' + points[0].x + ' ' + points[0].y;
    for (let i = 1; i < points.length; i++) d += segment(points[i - 1], points[i]);
    d += ' L ' + points[points.length - 1].x + ' ' + box.height;
    base.setAttribute('d', d);
    progress.setAttribute('d', d);
    totalLength = progress.getTotalLength();
    progress.style.strokeDasharray = String(totalLength);

    const temp = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    temp.style.display = 'none';
    svg.appendChild(temp);
    markerLengths = [0];
    let partial = 'M ' + points[0].x + ' 0 L ' + points[0].x + ' ' + points[0].y;
    for (let i = 1; i < points.length; i++) {
      partial += segment(points[i - 1], points[i]);
      temp.setAttribute('d', partial);
      markerLengths.push(temp.getTotalLength());
    }
    svg.removeChild(temp);
    update();
  }
  function update() {
    if (!totalLength) return;
    const box = timeline.getBoundingClientRect();
    const vh = window.innerHeight || document.documentElement.clientHeight;
    const amount = Math.min(1, Math.max(0, (vh * 0.78 - box.top) / box.height));
    progress.style.strokeDashoffset = String(totalLength * (1 - amount));
    markers.forEach((marker, i) => marker.classList.toggle('is-active', markerLengths[i] <= totalLength * amount + 1));
  }
  function schedule() {
    if (scrollPending) return;
    scrollPending = true;
    requestAnimationFrame(() => { update(); scrollPending = false; });
  }
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(build, 160);
  }, { passive: true });
  window.addEventListener('load', build, { once: true });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(build);
  build();
})();

// ── AVIS GOOGLE MAPS : navigation des témoignages ────────
(function initGoogleReviews() {
  const card = document.getElementById('googleReviewCard');
  const prev = document.getElementById('googleReviewPrev');
  const next = document.getElementById('googleReviewNext');
  const index = document.getElementById('googleReviewIndex');
  const total = document.getElementById('googleReviewTotal');
  if (!card || !prev || !next || !index || !total) return;

  const reviews = [
    {
      quote: "J’ai fait appel aux services de AIPH pour un enlèvement à destination de la déchèterie. Je les ai appelés ce matin à 8 h et ils étaient là une heure plus tard ! L’équipe est extrêmement réactive et les collaborateurs sont sympathiques et compétents. Je recommande !",
      name: "Abdelhamid Drif", details: "Local Guide · 12 avis · 5 photos", date: "Il y a 3 semaines", isNew: true
    },
    {
      quote: "Super satisfait de la prestation effectuée ce jour chez-moi. Personnel très sympathique et surtout très très consciencieux. Merci.",
      name: "Guy Clement", details: "Local Guide · 16 avis · 3 photos", date: "Il y a 3 ans", isNew: false
    }
  ];
  let current = 0;
  total.textContent = String(reviews.length).padStart(2, '0');

  function addText(parent, tag, className, value) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    el.textContent = value;
    parent.appendChild(el);
    return el;
  }
  function render() {
    const review = reviews[current];
    card.classList.add('is-changing');
    window.setTimeout(() => {
      card.replaceChildren();
      const quote = addText(card, 'blockquote', 'google-review-quote', '« ' + review.quote + ' »');
      quote.setAttribute('lang', 'fr');
      const footer = document.createElement('div');
      footer.className = 'google-review-footer';
      const person = document.createElement('div');
      person.className = 'google-review-person';
      addText(person, 'strong', '', review.name);
      addText(person, 'span', '', review.details);
      const meta = document.createElement('div');
      meta.className = 'google-review-meta';
      if (review.isNew) addText(meta, 'span', 'google-review-new', 'Nouveau');
      addText(meta, 'time', '', review.date);
      footer.append(person, meta);
      card.append(quote, footer);
      index.textContent = String(current + 1).padStart(2, '0');
      card.classList.remove('is-changing');
    }, 160);
  }
  function move(direction) {
    current = (current + direction + reviews.length) % reviews.length;
    render();
  }
  prev.addEventListener('click', () => move(-1));
  next.addEventListener('click', () => move(1));
})();

// ── PRESTA TABS (prestations.html only) ─────────────────
document.querySelectorAll('.presta-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.presta-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.presta-panel').forEach(p => p.classList.remove('active'));
    tab.classList.add('active');
    const panel = document.getElementById('panel-' + tab.dataset.panel);
    if (panel) panel.classList.add('active');
  });
});

// ── CONTACT FORM (contact.html only) ────────────────────
async function submitForm() {
  const req = ['f_prenom', 'f_nom', 'f_email', 'f_objet', 'f_msg'];
  let valid = true;
  req.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    if (!el.value.trim()) { el.style.borderColor = '#e24b4a'; valid = false; }
    else el.style.borderColor = '';
  });
  if (!valid) return;

  const submitBtn = document.querySelector('#formContent .btn-primary');
  const originalText = submitBtn ? submitBtn.textContent : '';
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = 'Envoi en cours...';
  }

  const formData = new FormData();
  formData.append('access_key', 'a1c37fc6-4e8b-47f1-8fe7-ea66a23f6a88');
  formData.append('prenom', document.getElementById('f_prenom').value.trim());
  formData.append('nom', document.getElementById('f_nom').value.trim());
  formData.append('email', document.getElementById('f_email').value.trim());
  formData.append('telephone', document.getElementById('f_tel') ? document.getElementById('f_tel').value.trim() : '');
  formData.append('objet', document.getElementById('f_objet').value);
  formData.append('message', document.getElementById('f_msg').value.trim());
  formData.append('subject', 'Nouveau message depuis le site AIPH54');
  formData.append('from_name', 'Formulaire de contact AIPH54');

  try {
    const response = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      body: formData
    });
    const data = await response.json();

    if (response.ok && data.success) {
      document.getElementById('formContent').style.display = 'none';
      document.getElementById('formSuccess').style.display = 'block';
    } else {
      throw new Error(data.message || 'Erreur inconnue renvoyée par Web3Forms');
    }
  } catch (error) {
    alert("Une erreur est survenue lors de l'envoi. Merci de réessayer ou de nous contacter directement par téléphone.");
    console.error('Erreur envoi formulaire :', error);
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  }
}

function resetForm() {
  ['f_prenom','f_nom','f_email','f_tel','f_objet','f_msg'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  document.getElementById('formContent').style.display = 'block';
  document.getElementById('formSuccess').style.display = 'none';
}