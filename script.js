const toggle = document.querySelector('#language');
let language = 'zh';

const menuToggle = document.querySelector('#menu-toggle');
const wheelOverlay = document.querySelector('#wheel-overlay');
const optionWheel = document.querySelector('#option-wheel');
const wheelItems = [...document.querySelectorAll('.wheel-item')];
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


toggle.addEventListener('click', () => {
  language = language === 'zh' ? 'en' : 'zh';
  document.documentElement.lang = language === 'zh' ? 'zh-CN' : 'en';
  document.querySelectorAll('[data-zh]').forEach((element) => {
    element.innerHTML = element.dataset[language];
  });
  toggle.textContent = language === 'zh' ? 'EN' : '中';
  toggle.setAttribute('aria-label', language === 'zh' ? '切换语言' : 'Switch language');
});
