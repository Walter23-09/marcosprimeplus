const menuToggle = document.querySelector('.menu-toggle');
const nav = document.querySelector('.nav');
const backTop = document.querySelector('.back-top');

menuToggle?.addEventListener('click', () => nav.classList.toggle('open'));

document.querySelectorAll('.nav a').forEach(link => {
  link.addEventListener('click', () => nav.classList.remove('open'));
});

window.addEventListener('scroll', () => {
  backTop.classList.toggle('show', window.scrollY > 500);
});

backTop.addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

document.getElementById('year').textContent = new Date().getFullYear();
