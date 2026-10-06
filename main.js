// ── PROGRESS BAR ────────────────────────────────────────
window.addEventListener('scroll', () => {
  const bar = document.getElementById('progress');
  if (!bar) return;
  const scrolled = window.scrollY;
  const total = document.body.scrollHeight - window.innerHeight;
  bar.style.width = (total > 0 ? (scrolled / total) * 100 : 0) + '%';

  // Nav shadow
  const nav = document.getElementById('nav');
  if (nav) nav.style.boxShadow = window.scrollY > 20 ? '0 2px 24px rgba(0,0,0,0.06)' : 'none';
});

// ── BURGER ──────────────────────────────────────────────
const burger = document.getElementById('burger');
const mobileMenu = document.getElementById('mobileMenu');
if (burger && mobileMenu) {
  burger.addEventListener('click', () => mobileMenu.classList.toggle('open'));
}
function closeMobile() { if (mobileMenu) mobileMenu.classList.remove('open'); }

// ── FADE-UP OBSERVER ────────────────────────────────────
function observeFadeUps() {
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
  }, { threshold: 0.1 });
  document.querySelectorAll('.fade-up').forEach(el => obs.observe(el));
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