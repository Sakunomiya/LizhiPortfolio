const toggle = document.querySelector('#language');
let language = 'zh';

const menuToggle = document.querySelector('#menu-toggle');
const wheelOverlay = document.querySelector('#wheel-overlay');
const optionWheel = document.querySelector('#option-wheel');
const wheelItems = [...document.querySelectorAll('.wheel-item')];
const projectBackgrounds = [...document.querySelectorAll('.project-background')];
const contactBackgrounds = [...document.querySelectorAll('.contact-background')];
const backgroundChoices = [...projectBackgrounds.map((_, index) => index), -1];
const randomBackgroundIndex = backgroundChoices[Math.floor(Math.random() * backgroundChoices.length)];

const hydrateBackground = (element) => {
  if (!element?.dataset.bg || element.dataset.bgLoaded === 'true') return;
  const image = `url("${element.dataset.bg}")`;
  element.style.backgroundImage = element.dataset.bgOverlay ? `${element.dataset.bgOverlay}, ${image}` : image;
  element.dataset.bgLoaded = 'true';
};

const lazyBackgroundObserver = 'IntersectionObserver' in window
  ? new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        hydrateBackground(entry.target);
        observer.unobserve(entry.target);
      });
    }, { rootMargin: '500px 0px' })
  : null;

document.querySelectorAll('[data-bg]:not(.project-background):not(.contact-background)').forEach((element) => {
  if (lazyBackgroundObserver) lazyBackgroundObserver.observe(element);
  else hydrateBackground(element);
});
let selectedWheelIndex = randomBackgroundIndex === -1 ? wheelItems.length - 1 : randomBackgroundIndex;
let wheelPosition = selectedWheelIndex;
let wheelTarget = selectedWheelIndex;
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
  const isBlank = selectedWheelIndex === wheelItems.length - 1;
  projectBackgrounds.forEach((background, backgroundIndex) => {
    const active = !isBlank && backgroundIndex === selectedWheelIndex;
    background.classList.toggle('is-active', active);
    if (active) hydrateBackground(background);
  });
  contactBackgrounds.forEach((background, backgroundIndex) => {
    const active = !isBlank && backgroundIndex === selectedWheelIndex;
    background.classList.toggle('is-active', active);
    if (active) hydrateBackground(background);
  });
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

const particleTitle = document.querySelector('#particle-title');
if (particleTitle) {
  const titleContext = particleTitle.getContext('2d');
  const titleSource = document.createElement('canvas');
  const sourceContext = titleSource.getContext('2d');
  let titleParticles = [];
  let titlePointer = { x: -9999, y: -9999 };
  let titleActive = false;
  let titleLanguage = 'zh';
  // Unicode escapes keep the canvas source independent of file encoding.
  const titleLines = () => titleLanguage === 'zh' ? ['\u674e\u690d', '\u4e2a\u4eba\u7f51\u7ad9'] : ['LI ZHI', 'PORTFOLIO'];
  const setupParticleTitle = () => {
    const bounds = particleTitle.getBoundingClientRect();
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    particleTitle.width = Math.floor(bounds.width * ratio);
    particleTitle.height = Math.floor(bounds.height * ratio);
    titleContext.setTransform(ratio, 0, 0, ratio, 0, 0);
    titleSource.width = Math.floor(bounds.width * ratio);
    titleSource.height = Math.floor(bounds.height * ratio);
    sourceContext.setTransform(ratio, 0, 0, ratio, 0, 0);
    sourceContext.clearRect(0, 0, bounds.width, bounds.height);
    const lines = titleLines();
    const fontSize = Math.min(bounds.width * .145, 116);
    sourceContext.fillStyle = '#fff';
    sourceContext.textAlign = 'center';
    sourceContext.textBaseline = 'middle';
    sourceContext.font = `900 ${fontSize}px "Microsoft YaHei", "PingFang SC", "Noto Sans CJK SC", sans-serif`;
    const lineGap = fontSize * .94;
    lines.forEach((line, index) => sourceContext.fillText(line, bounds.width / 2, bounds.height / 2 - 24 + (index - .5) * lineGap));
    const pixels = sourceContext.getImageData(0, 0, particleTitle.width, particleTitle.height).data;
    const density = 2 * ratio;
    titleParticles = [];
    for (let y = 0; y < particleTitle.height; y += density) {
      for (let x = 0; x < particleTitle.width; x += density) {
        if (pixels[(y * particleTitle.width + x) * 4 + 3] > 110) {
          const targetX = x / ratio;
          const targetY = y / ratio;
          // A restrained initial scatter makes the loading-time gathering visible without obscuring the Chinese glyphs for long.
          const angle = Math.random() * Math.PI * 2;
          const scatter = 105 * (0.4 + Math.random() * 0.6);
          titleParticles.push({ targetX, targetY, x: targetX + Math.cos(angle) * scatter, y: targetY + Math.sin(angle) * scatter, phase: Math.random() * Math.PI * 2 });
        }
      }
    }
  };
  const drawParticleTitle = (time) => {
    const bounds = particleTitle.getBoundingClientRect();
    titleContext.clearRect(0, 0, bounds.width, bounds.height);
    titleParticles.forEach((particle) => {
      const driftX = Math.sin(time * .0007 + particle.phase) * .7;
      const driftY = Math.cos(time * .0006 + particle.phase) * .7;
      const dx = particle.x - titlePointer.x;
      const dy = particle.y - titlePointer.y;
      const distance = Math.hypot(dx, dy);
      const repel = titleActive ? Math.max(0, 1 - distance / 105) * 40 : 0;
      const repelX = distance ? (dx / distance) * repel : 0;
      const repelY = distance ? (dy / distance) * repel : 0;
      const targetX = particle.targetX + driftX + repelX;
      const targetY = particle.targetY + driftY + repelY;
      // A slower easing curve makes the initial gather last roughly 2.2 seconds.
      particle.x += (targetX - particle.x) * .025;
      particle.y += (targetY - particle.y) * .025;
      titleContext.fillStyle = '#fff';
      titleContext.globalAlpha = .9;
      titleContext.fillRect(particle.x - .9, particle.y - .9, 1.8, 1.8);
    });
    titleContext.globalAlpha = 1;
    requestAnimationFrame(drawParticleTitle);
  };
  particleTitle.addEventListener('pointermove', (event) => { const bounds = particleTitle.getBoundingClientRect(); titlePointer = { x: event.clientX - bounds.left, y: event.clientY - bounds.top }; titleActive = true; });
  particleTitle.addEventListener('pointerleave', () => { titlePointer = { x: -9999, y: -9999 }; titleActive = false; });
  window.addEventListener('resize', setupParticleTitle);
  window.setParticleTitleLanguage = (nextLanguage) => { titleLanguage = nextLanguage; setupParticleTitle(); };
  setupParticleTitle();
  requestAnimationFrame(drawParticleTitle);
}

const heroSubcopy = document.querySelector('.hero-copy .subcopy');
if (heroSubcopy) {
  heroSubcopy.classList.add('stroke-reveal');
}

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

document.querySelectorAll('.section-particles').forEach((canvas) => {
  const context = canvas.getContext('2d');
  let sectionParticles = [];
  let sectionPointer = { x: -9999, y: -9999 };
  const host = canvas.parentElement;
  const resize = () => {
    const bounds = canvas.getBoundingClientRect();
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(bounds.width * ratio);
    canvas.height = Math.floor(bounds.height * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    sectionParticles = Array.from({ length: 200 }, () => ({ x: Math.random() * bounds.width, y: Math.random() * bounds.height, size: 1.45 + Math.random() * 1.35, drift: .03 + Math.random() * .1, phase: Math.random() * Math.PI * 2 }));
  };
  const draw = (time) => {
    const bounds = canvas.getBoundingClientRect();
    context.clearRect(0, 0, bounds.width, bounds.height);
    sectionParticles.forEach((particle) => {
      particle.y -= particle.drift; particle.x += Math.sin(time * .00035 + particle.phase) * .08;
      if (particle.y < -4) particle.y = bounds.height + 4;
      const dx = particle.x - sectionPointer.x; const dy = particle.y - sectionPointer.y; const influence = Math.max(0, 1 - Math.hypot(dx, dy) / 100);
      context.beginPath(); context.fillStyle = particleColor; context.globalAlpha = .28 + influence * .48;
      context.arc(particle.x + dx * influence * .08, particle.y + dy * influence * .08, particle.size * (1 + influence * .5), 0, Math.PI * 2); context.fill();
    });
    context.globalAlpha = 1; requestAnimationFrame(draw);
  };
  window.addEventListener('resize', resize);
  host.addEventListener('pointermove', (event) => { const bounds = canvas.getBoundingClientRect(); sectionPointer = { x: event.clientX - bounds.left, y: event.clientY - bounds.top }; });
  host.addEventListener('pointerleave', () => { sectionPointer = { x: -9999, y: -9999 }; });
  resize(); requestAnimationFrame(draw);
});

document.querySelectorAll('.category-card').forEach((card) => {
  card.addEventListener('pointermove', (event) => {
    const bounds = card.getBoundingClientRect();
    card.style.setProperty('--shine-x', `${((event.clientX - bounds.left) / bounds.width) * 100}%`);
    card.style.setProperty('--shine-y', `${((event.clientY - bounds.top) / bounds.height) * 100}%`);
  });
});

document.querySelectorAll('.exchange-button').forEach((button) => {
  button.addEventListener('pointermove', (event) => {
    const bounds = button.getBoundingClientRect();
    button.style.setProperty('--spec-x', `${event.clientX - bounds.left}px`);
    button.style.setProperty('--spec-y', `${event.clientY - bounds.top}px`);
  });
});

function fitGameTitles() {
  document.querySelectorAll('.gallery-card strong').forEach((title) => {
    const card = title.closest('.gallery-card');
    const baseSize = Math.min(Math.max(window.innerWidth * .018, 18), 29);
    title.style.fontSize = `${baseSize}px`;
    const availableWidth = card.clientWidth - 24;
    const titleWidth = title.getBoundingClientRect().width;
    if (titleWidth > availableWidth) {
      title.style.fontSize = `${Math.max(7, baseSize * availableWidth / titleWidth)}px`;
    }
  });
}

window.addEventListener('resize', fitGameTitles);
fitGameTitles();

const depthCarousel = document.querySelector('#depth-carousel');
if (depthCarousel) {
  const depthCards = [...depthCarousel.querySelectorAll('.depth-card')];
  depthCards.forEach((card) => {
    card.addEventListener('pointermove', (event) => {
      const bounds = card.getBoundingClientRect();
      const x = (event.clientX - bounds.left) / bounds.width;
      const y = (event.clientY - bounds.top) / bounds.height;
      card.style.setProperty('--glow-x', `${x * 100}%`);
      card.style.setProperty('--glow-y', `${y * 100}%`);
      card.style.transform = `perspective(900px) rotateX(${(0.5 - y) * 5}deg) rotateY(${(x - 0.5) * 5}deg) translate(${(x - 0.5) * 9}px, ${(y - 0.5) * 9}px)`;
    });
    card.addEventListener('pointerleave', () => { card.style.transform = ''; });
    card.addEventListener('click', () => {
      card.classList.remove('is-clicked');
      void card.offsetWidth;
      card.classList.add('is-clicked');
    });
  });
}

const circularGallery = document.querySelector('#circular-gallery');
if (circularGallery) {
  const circularItems = [...circularGallery.querySelectorAll('.circular-item')];
  let circularOffset = 0;
  let dragOrigin = null;
  let circularDragged = false;
  const renderCircularGallery = () => {
    circularItems.forEach((item, index) => {
      let offset = index - circularOffset;
      while (offset > circularItems.length / 2) offset -= circularItems.length;
      while (offset < -circularItems.length / 2) offset += circularItems.length;
      const x = offset * 255;
      const depth = Math.abs(offset) * -120;
      const tilt = offset * -7;
      const rise = Math.abs(offset) * 22;
      item.style.transform = `translate3d(calc(-50% + ${x}px), calc(-50% + ${rise}px), ${depth}px) rotateY(${tilt}deg)`;
      item.style.opacity = String(Math.max(.26, 1 - Math.abs(offset) * .22));
      item.style.filter = `blur(${Math.abs(offset) * 1.5}px)`;
      item.style.zIndex = String(10 - Math.round(Math.abs(offset)));
    });
  };
  const shiftGallery = (direction) => {
    circularOffset = (circularOffset + direction + circularItems.length) % circularItems.length;
    renderCircularGallery();
  };
  circularGallery.addEventListener('wheel', (event) => {
    const rect = circularGallery.getBoundingClientRect();
    const withinCards = event.clientX >= rect.left + rect.width * .25 && event.clientX <= rect.right - rect.width * .25 && event.clientY >= rect.top + 28 && event.clientY <= rect.bottom - 28;
    if (!withinCards) return;
    event.preventDefault();
    shiftGallery(event.deltaY > 0 ? 1 : -1);
  }, { passive: false });
  circularGallery.addEventListener('pointerdown', (event) => {
    if (event.target.closest('.circular-item')) return;
    dragOrigin = { x: event.clientX, offset: circularOffset };
    circularDragged = false;
    circularGallery.setPointerCapture(event.pointerId);
  });
  circularGallery.addEventListener('pointermove', (event) => { if (!dragOrigin) return; if (Math.abs(dragOrigin.x - event.clientX) > 8) { circularDragged = true; circularGallery.classList.add('is-dragging'); } const step = Math.round((dragOrigin.x - event.clientX) / 120); circularOffset = (dragOrigin.offset + step + circularItems.length) % circularItems.length; renderCircularGallery(); });
  circularGallery.addEventListener('pointerup', () => { dragOrigin = null; circularGallery.classList.remove('is-dragging'); });
  circularGallery.addEventListener('pointercancel', () => { dragOrigin = null; circularGallery.classList.remove('is-dragging'); });
  renderCircularGallery();
}

const otherCircularGallery = document.querySelector('#other-circular-gallery');
if (otherCircularGallery) {
  const otherItems = [...otherCircularGallery.querySelectorAll('.other-circular-item')];
  let otherOffset = 0;
  let otherDragOrigin = null;
  let otherDragged = false;
  const renderOtherGallery = () => {
    otherItems.forEach((item, index) => {
      let offset = index - otherOffset;
      while (offset > otherItems.length / 2) offset -= otherItems.length;
      while (offset < -otherItems.length / 2) offset += otherItems.length;
      const x = offset * 285;
      const depth = Math.abs(offset) * -120;
      const tilt = offset * -8;
      const lift = Math.abs(offset) * 68;
      item.style.transform = `translate3d(calc(-50% + ${x}px), calc(-50% + ${lift}px), ${depth}px) rotateY(${tilt}deg)`;
      item.style.opacity = String(Math.max(.28, 1 - Math.abs(offset) * .25));
      item.style.filter = `blur(${Math.abs(offset) * 1.6}px)`;
      item.style.zIndex = String(10 - Math.round(Math.abs(offset)));
    });
  };
  const shiftOtherGallery = (direction) => { otherOffset = (otherOffset + direction + otherItems.length) % otherItems.length; renderOtherGallery(); };
  otherCircularGallery.addEventListener('wheel', (event) => {
    const rect = otherCircularGallery.getBoundingClientRect();
    const withinCards = event.clientX >= rect.left + rect.width * .2 && event.clientX <= rect.right - rect.width * .2 && event.clientY >= rect.top + 18 && event.clientY <= rect.bottom - 18;
    if (!withinCards) return;
    event.preventDefault();
    shiftOtherGallery(event.deltaY > 0 ? 1 : -1);
  }, { passive: false });
  otherCircularGallery.addEventListener('pointerdown', (event) => {
    if (event.target.closest('.other-circular-item')) return;
    otherDragOrigin = { x: event.clientX, offset: otherOffset };
    otherDragged = false;
    otherCircularGallery.setPointerCapture(event.pointerId);
  });
  otherCircularGallery.addEventListener('pointermove', (event) => { if (!otherDragOrigin) return; if (Math.abs(otherDragOrigin.x - event.clientX) > 8) { otherDragged = true; otherCircularGallery.classList.add('is-dragging'); } const step = Math.round((otherDragOrigin.x - event.clientX) / 120); otherOffset = (otherDragOrigin.offset + step + otherItems.length) % otherItems.length; renderOtherGallery(); });
  otherCircularGallery.addEventListener('pointerup', () => { otherDragOrigin = null; otherCircularGallery.classList.remove('is-dragging'); });
  otherCircularGallery.addEventListener('pointercancel', () => { otherDragOrigin = null; otherCircularGallery.classList.remove('is-dragging'); });
  renderOtherGallery();
}

const profileCard = document.querySelector('#profile-card');
if (profileCard) {
  profileCard.addEventListener('pointermove', (event) => {
    const bounds = profileCard.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width - .5;
    const y = (event.clientY - bounds.top) / bounds.height - .5;
    profileCard.style.setProperty('--profile-x', `${x * 7}deg`);
    profileCard.style.setProperty('--profile-y', `${-y * 7}deg`);
  });
  profileCard.addEventListener('pointerleave', () => {
    profileCard.style.setProperty('--profile-x', '0deg');
    profileCard.style.setProperty('--profile-y', '0deg');
  });
}

const profileContactButton = document.querySelector('#profile-contact');
const contactChannels = document.querySelector('#contact-channels');
if (profileContactButton && contactChannels) {
  profileContactButton.addEventListener('click', () => {
    contactChannels.classList.remove('is-highlighted');
    void contactChannels.offsetWidth;
    contactChannels.classList.add('is-highlighted');
    setTimeout(() => contactChannels.classList.remove('is-highlighted'), 1600);
  });
}

const advantagesWheel = document.querySelector('#advantages-wheel');
if (advantagesWheel) {
  const advantageItems = [...advantagesWheel.querySelectorAll('.advantage-item')];
  let advantagePosition = 2;
  let advantageTarget = 2;
  let advantageFrame;
  let advantageDrag = null;
  const renderAdvantages = () => {
    advantageItems.forEach((item, index) => {
      let distance = index - advantagePosition;
      while (distance > advantageItems.length / 2) distance -= advantageItems.length;
      while (distance < -advantageItems.length / 2) distance += advantageItems.length;
      const absoluteDistance = Math.abs(distance);
      const angle = Math.max(-1.1, Math.min(1.1, distance * .23));
      const radius = 310;
      const x = radius * (1 - Math.cos(angle));
      const y = radius * Math.sin(angle);
      item.style.transform = `translate(${x.toFixed(1)}px, calc(${y.toFixed(1)}px - 50%)) rotate(${(-angle * 180 / Math.PI).toFixed(1)}deg)`;
      item.style.opacity = String(Math.max(.08, 1 - absoluteDistance * .33));
      item.style.filter = `blur(${(absoluteDistance * 2.5).toFixed(1)}px)`;
      item.classList.toggle('is-selected', absoluteDistance < .18);
    });
  };
  const animateAdvantages = () => {
    advantagePosition += (advantageTarget - advantagePosition) * .045;
    if (Math.abs(advantageTarget - advantagePosition) < .002) advantagePosition = advantageTarget;
    renderAdvantages();
    if (advantagePosition !== advantageTarget) advantageFrame = requestAnimationFrame(animateAdvantages);
  };
  const selectAdvantage = (index) => {
    advantageTarget = ((index % advantageItems.length) + advantageItems.length) % advantageItems.length;
    const delta = advantageTarget - advantagePosition;
    if (delta > advantageItems.length / 2) advantageTarget -= advantageItems.length;
    if (delta < -advantageItems.length / 2) advantageTarget += advantageItems.length;
    cancelAnimationFrame(advantageFrame);
    animateAdvantages();
  };
  advantageItems.forEach((item, index) => item.addEventListener('click', () => selectAdvantage(index)));
  advantagesWheel.addEventListener('wheel', (event) => { event.preventDefault(); selectAdvantage(Math.round(advantageTarget) + (event.deltaY > 0 ? 1 : -1)); }, { passive: false });
  advantagesWheel.addEventListener('pointerdown', (event) => { advantageDrag = { y: event.clientY, target: advantageTarget }; advantagesWheel.classList.add('is-dragging'); advantagesWheel.setPointerCapture(event.pointerId); });
  advantagesWheel.addEventListener('pointermove', (event) => { if (!advantageDrag) return; const step = Math.round((advantageDrag.y - event.clientY) / 56); selectAdvantage(advantageDrag.target + step); });
  advantagesWheel.addEventListener('pointerup', () => { advantageDrag = null; advantagesWheel.classList.remove('is-dragging'); });
  advantagesWheel.addEventListener('keydown', (event) => { if (event.key === 'ArrowDown' || event.key === 'ArrowRight') { event.preventDefault(); selectAdvantage(Math.round(advantageTarget) + 1); } if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') { event.preventDefault(); selectAdvantage(Math.round(advantageTarget) - 1); } });
  renderAdvantages();
}


toggle.addEventListener('click', () => {
  language = language === 'zh' ? 'en' : 'zh';
  document.documentElement.lang = language === 'zh' ? 'zh-CN' : 'en';
  document.querySelectorAll('[data-zh]').forEach((element) => {
    element.innerHTML = element.dataset[language];
  });
  window.setParticleTitleLanguage?.(language);
  toggle.textContent = language === 'zh' ? 'EN' : '中';
  toggle.setAttribute('aria-label', language === 'zh' ? '切换语言' : 'Switch language');
});
