const menuButton = document.querySelector('.menu-button');
const mobileMenu = document.querySelector('#mobile-menu');
const searchInput = document.querySelector('#equipment-search');
const categoryButtons = [...document.querySelectorAll('.category-card')];
const equipmentCards = [...document.querySelectorAll('.equipment-card')];
const resultCount = document.querySelector('#result-count');
const emptyState = document.querySelector('#empty-state');
const requestDialog = document.querySelector('#request-dialog');
const requestTitle = document.querySelector('#request-title');

let activeCategory = 'all';

menuButton?.addEventListener('click', () => {
  const isOpen = menuButton.getAttribute('aria-expanded') === 'true';
  menuButton.setAttribute('aria-expanded', String(!isOpen));
  mobileMenu.hidden = isOpen;
});

mobileMenu?.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => {
    mobileMenu.hidden = true;
    menuButton.setAttribute('aria-expanded', 'false');
  });
});

function updateCatalog() {
  const query = (searchInput?.value || '').trim().toLowerCase();
  let visibleCount = 0;

  equipmentCards.forEach((card) => {
    const matchesCategory = activeCategory === 'all' || card.dataset.category === activeCategory;
    const matchesSearch = !query || (card.dataset.search || '').includes(query) || card.textContent.toLowerCase().includes(query);
    const shouldShow = matchesCategory && matchesSearch;
    card.hidden = !shouldShow;
    if (shouldShow) visibleCount += 1;
  });

  resultCount.textContent = `Showing ${visibleCount} ${visibleCount === 1 ? 'piece' : 'pieces'} of equipment`;
  emptyState.hidden = visibleCount !== 0;
}

categoryButtons.forEach((button) => {
  button.addEventListener('click', () => {
    activeCategory = button.dataset.category;
    categoryButtons.forEach((item) => item.classList.toggle('active', item === button));
    updateCatalog();
    document.querySelector('#equipment')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});

searchInput?.addEventListener('input', updateCatalog);

document.querySelectorAll('.request-button').forEach((button) => {
  button.addEventListener('click', () => {
    requestTitle.textContent = `Request ${button.dataset.equipment}`;
    if (typeof requestDialog.showModal === 'function') requestDialog.showModal();
  });
});

updateCatalog();
