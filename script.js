const roadmapButton = document.querySelector('.ghost-btn');
const startButtons = document.querySelectorAll('.primary-btn');

if (roadmapButton) {
  roadmapButton.addEventListener('click', () => {
    const roadmapSection = document.querySelector('.two-column');
    roadmapSection?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
}

startButtons.forEach((btn) => {
  btn.addEventListener('click', () => {
    const preview = document.querySelector('.callout-card');
    preview?.classList.add('pulse');
    setTimeout(() => preview?.classList.remove('pulse'), 600);
  });
});
