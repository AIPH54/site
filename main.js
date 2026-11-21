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
    if (nav) nav.style.boxShadow = scrollY > 20 ? '0 2px 24px rgba(0,0,0,0.06)' : 'none';
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

// ── CONTACT MAP : chargement à la demande ───────────────
// Les scripts de Google Maps ne sont pas chargés avant un clic volontaire.
document.querySelectorAll('.contact-map-launch').forEach(button => {
  button.addEventListener('click', () => {
    const container = button.closest('.contact-map-placeholder');
    const source = container && container.dataset.mapSrc;
    if (!container || !source) return;

    const iframe = document.createElement('iframe');
    iframe.src = source;
    iframe.title = "Carte Google Maps - Villers-la-Montagne";
    iframe.width = "420";
    iframe.height = "280";
    iframe.loading = "lazy";
    iframe.referrerPolicy = "no-referrer-when-downgrade";
    iframe.allowFullscreen = true;
    container.replaceChildren(iframe);
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