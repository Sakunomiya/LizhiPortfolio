const toggle = document.querySelector('#language');
let language = 'zh';

const menuToggle = document.querySelector('#menu-toggle');
const wheelOverlay = document.querySelector('#wheel-overlay');
const optionWheel = document.querySelector('#option-wheel');
const wheelItems = [...document.querySelectorAll('.wheel-item')];
const projectBackgrounds = [...document.querySelectorAll('.project-background')];
let selectedWheelIndex = 2;
let wheelPosition = 2;
let wheelTarget = 2;
let wheelFrame;
let dragStart;
let wheelCloseTimer;
const renderWheel = () => {
  wheelItems.forEach((item, index) => {
    const distance = index - wheelPosition;
    const absoluteDistance = Math.abs(distance);
    const angle = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, distance * Math.PI / 30));
    const radius = 640;
    const x = radius * (1 - Math.cos(angle)) * .5;
    const y = radius * Math.sin(angle);
    item.style.transform = `translate(${x.toFixed(1)}px, calc(${y.toFixed(1)}px - 50%)) rotate(${(-angle * 180 / Math.PI).toFixed(1)}deg)`;
    item.style.opacity = String(Math.max(.05, 1 - absoluteDistance * .25));
    item.style.filter = `blur(${(absoluteDistance * 2).toFixed(1)}px)`;
  });
};
const animateWheel = () => {
  wheelPosition += (wheelTarget - wheelPosition) * .11;
  if (Math.abs(wheelTarget - wheelPosition) < .002) wheelPosition = wheelTarget;
  renderWheel();
  if (wheelPosition !== wheelTarget) wheelFrame = requestAnimationFrame(animateWheel);
};
const selectWheelItem = (index) => {
  selectedWheelIndex = Math.max(0, Math.min(wheelItems.length - 1, index));
  wheelTarget = selectedWheelIndex;
  wheelItems.forEach((item, itemIndex) => item.classList.toggle('is-selected', itemIndex === selectedWheelIndex));
  projectBackgrounds.forEach((background, backgroundIndex) => background.classList.toggle('is-active', backgroundIndex === selectedWheelIndex));
  cancelAnimationFrame(wheelFrame);
  animateWheel();
};
const closeMenu = () => {
  if (!wheelOverlay.classList.contains('is-open')) return;
  wheelOverlay.classList.remove('is-open');
  wheelOverlay.classList.add('is-closing');
  menuToggle.setAttribute('aria-expanded', 'false');
  clearTimeout(wheelCloseTimer);
  wheelCloseTimer = setTimeout(() => {
    wheelOverlay.classList.remove('is-closing');
    wheelOverlay.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }, 960);
};
menuToggle.addEventListener('click', () => {
  const opening = !wheelOverlay.classList.contains('is-open');
  if (!opening) return closeMenu();
  clearTimeout(wheelCloseTimer);
  wheelOverlay.classList.remove('is-closing');
  wheelOverlay.classList.add('is-open');
  wheelOverlay.setAttribute('aria-hidden', 'false');
  menuToggle.setAttribute('aria-expanded', 'true');
  document.body.style.overflow = 'hidden';
});
wheelOverlay.querySelector('.wheel-backdrop').addEventListener('click', closeMenu);
wheelItems.forEach((item, index) => item.addEventListener('click', (event) => { if (selectedWheelIndex !== index) { event.preventDefault(); selectWheelItem(index); } else closeMenu(); }));
optionWheel.addEventListener('wheel', (event) => { event.preventDefault(); selectWheelItem(selectedWheelIndex + (event.deltaY > 0 ? 1 : -1)); }, { passive: false });
optionWheel.addEventListener('keydown', (event) => { if (event.key === 'ArrowDown' || event.key === 'ArrowRight') { event.preventDefault(); selectWheelItem(selectedWheelIndex + 1); } if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') { event.preventDefault(); selectWheelItem(selectedWheelIndex - 1); } });
optionWheel.addEventListener('pointerdown', (event) => { dragStart = { y: event.clientY, index: selectedWheelIndex }; optionWheel.setPointerCapture(event.pointerId); });
optionWheel.addEventListener('pointermove', (event) => { if (!dragStart) return; const step = Math.round((dragStart.y - event.clientY) / 67); selectWheelItem(dragStart.index + step); });
optionWheel.addEventListener('pointerup', () => { dragStart = null; });
document.addEventListener('keydown', (event) => { if (event.key === 'Escape') closeMenu(); });
selectWheelItem(selectedWheelIndex);

const particleCanvas = document.querySelector('#particle-field');
const particleContext = particleCanvas.getContext('2d');
const particleColor = '#738cff';
const particleCount = 200;
let particles = [];
let pointer = { x: -9999, y: -9999 };

function resizeParticles() {
  const bounds = particleCanvas.getBoundingClientRect();
  const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
  particleCanvas.width = Math.floor(bounds.width * pixelRatio);
  particleCanvas.height = Math.floor(bounds.height * pixelRatio);
  particleContext.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  particles = Array.from({ length: particleCount }, () => ({
    x: Math.random() * bounds.width,
    y: Math.random() * bounds.height,
    size: 1.45 + Math.random() * 1.35,
    drift: .03 + Math.random() * .1,
    phase: Math.random() * Math.PI * 2
  }));
}

function drawParticles(time) {
  const bounds = particleCanvas.getBoundingClientRect();
  particleContext.clearRect(0, 0, bounds.width, bounds.height);
  particles.forEach((particle) => {
    particle.y -= particle.drift;
    particle.x += Math.sin(time * .00035 + particle.phase) * .08;
    if (particle.y < -4) particle.y = bounds.height + 4;
    if (particle.x < -4) particle.x = bounds.width + 4;
    if (particle.x > bounds.width + 4) particle.x = -4;
    const dx = particle.x - pointer.x;
    const dy = particle.y - pointer.y;
    const distance = Math.hypot(dx, dy);
    const influence = Math.max(0, 1 - distance / 100);
    particleContext.beginPath();
    particleContext.fillStyle = particleColor;
    particleContext.globalAlpha = .28 + influence * .48;
    particleContext.arc(particle.x + dx * influence * .08, particle.y + dy * influence * .08, particle.size * (1 + influence * .5), 0, Math.PI * 2);
    particleContext.fill();
  });
  particleContext.globalAlpha = 1;
  requestAnimationFrame(drawParticles);
}

window.addEventListener('resize', resizeParticles);
document.querySelector('.hero').addEventListener('pointermove', (event) => {
  const bounds = particleCanvas.getBoundingClientRect();
  pointer = { x: event.clientX - bounds.left, y: event.clientY - bounds.top };
});
document.querySelector('.hero').addEventListener('pointerleave', () => { pointer = { x: -9999, y: -9999 }; });
resizeParticles();
requestAnimationFrame(drawParticles);


toggle.addEventListener('click', () => {
  language = language === 'zh' ? 'en' : 'zh';
  document.documentElement.lang = language === 'zh' ? 'zh-CN' : 'en';
  document.querySelectorAll('[data-zh]').forEach((element) => {
    element.innerHTML = element.dataset[language];
  });
  toggle.textContent = language === 'zh' ? 'EN' : '中';
  toggle.setAttribute('aria-label', language === 'zh' ? '切换语言' : 'Switch language');
});
