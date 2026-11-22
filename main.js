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

// ── MENU MOBILE : ouverture, fermeture et interactions ──
const burger = document.getElementById('burger');
const mobileMenu = document.getElementById('mobileMenu');

function setMobileMenuState(isOpen) {
  if (!burger || !mobileMenu) return;
  mobileMenu.classList.toggle('open', isOpen);
  burger.classList.toggle('open', isOpen);
  burger.setAttribute('aria-expanded', String(isOpen));
  burger.setAttribute('aria-label', isOpen ? 'Fermer le menu' : 'Ouvrir le menu');
  mobileMenu.setAttribute('aria-hidden', String(!isOpen));
  mobileMenu.inert = !isOpen;
  document.body.classList.toggle('menu-open', isOpen);
}

if (burger && mobileMenu) {
  setMobileMenuState(false);

  burger.addEventListener('click', () => {
    setMobileMenuState(!mobileMenu.classList.contains('open'));
  });

  // Un clic/toucher en dehors du bouton et du panneau ferme le menu.
  document.addEventListener('pointerdown', event => {
    if (!mobileMenu.classList.contains('open')) return;
    if (burger.contains(event.target) || mobileMenu.contains(event.target)) return;
    closeMobile();
  });

  // Escape ferme le menu et rend le focus au bouton.
  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape' || !mobileMenu.classList.contains('open')) return;
    closeMobile();
    burger.focus();
  });
}

function closeMobile() {
  setMobileMenuState(false);
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

// ── HISTOIRE AIPH : barre droite au centre, progression au scroll ──
(function initHistoryRail() {
  const timeline = document.getElementById('historyTimeline');
  if (!timeline) return;

  const svg = document.getElementById('historyRail');
  const base = document.getElementById('historyRailBase');
  const progress = document.getElementById('historyRailProgress');
  const markers = Array.from(timeline.querySelectorAll('.history-marker'));
  if (!svg || !base || !progress || markers.length < 2) return;

  let totalLength = 0;
  let markerPositions = [];
  let resizeTimer = null;
  let scrollPending = false;

  function buildRail() {
    const bounds = timeline.getBoundingClientRect();
    if (bounds.width < 10 || bounds.height < 10) return;

    // Une seule ligne droite au centre, quel que soit l'écran.
    const centerX = bounds.width / 2;
    const height = Math.max(1, bounds.height);
    const path = 'M ' + centerX + ' 0 L ' + centerX + ' ' + height;

    svg.setAttribute('viewBox', '0 0 ' + Math.max(1, bounds.width) + ' ' + height);
    base.setAttribute('d', path);
    progress.setAttribute('d', path);
    totalLength = progress.getTotalLength();
    progress.style.strokeDasharray = String(totalLength);

    markerPositions = markers.map(marker => {
      const rect = marker.getBoundingClientRect();
      return rect.top - bounds.top + rect.height / 2;
    });

    updateRail();
  }

  function updateRail() {
    if (!totalLength) return;
    const bounds = timeline.getBoundingClientRect();
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
    const progressPoint = viewportHeight * 0.68 - bounds.top;
    const amount = Math.min(1, Math.max(0, progressPoint / bounds.height));

    progress.style.strokeDashoffset = String(totalLength * (1 - amount));
    markers.forEach((marker, index) => {
      marker.classList.toggle('is-active', markerPositions[index] <= totalLength * amount + 1);
    });
  }

  function scheduleUpdate() {
    if (scrollPending) return;
    scrollPending = true;
    window.requestAnimationFrame(() => {
      updateRail();
      scrollPending = false;
    });
  }

  window.addEventListener('scroll', scheduleUpdate, { passive: true });
  window.addEventListener('resize', () => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(buildRail, 160);
  }, { passive: true });
  window.addEventListener('load', buildRail, { once: true });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(buildRail);
  buildRail();
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
      name: "Abdelhamid Drif", rating: 5
    },
    {
      quote: "Super satisfait de la prestation effectuée ce jour chez-moi. Personnel très sympathique et surtout très très consciencieux. Merci.",
      name: "Guy Clement", rating: 5
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
      const stars = addText(card, 'div', 'google-review-stars', '★'.repeat(review.rating));
      stars.setAttribute('role', 'img');
      stars.setAttribute('aria-label', review.rating + ' étoiles sur 5');
      const quote = addText(card, 'blockquote', 'google-review-quote', '« ' + review.quote + ' »');
      quote.setAttribute('lang', 'fr');
      const footer = document.createElement('div');
      footer.className = 'google-review-footer';
      const person = document.createElement('div');
      person.className = 'google-review-person';
      addText(person, 'strong', '', review.name);
      footer.append(person);
      card.append(stars, quote, footer);
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