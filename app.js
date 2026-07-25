import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import { getFirestore, collection, onSnapshot } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBCYpQcTm0_37GAUy8FK_vfChk8seFCOKI",
  authDomain: "mcgriffsrental.firebaseapp.com",
  projectId: "mcgriffsrental",
  storageBucket: "mcgriffsrental.firebasestorage.app",
  messagingSenderId: "511623270295",
  appId: "1:511623270295:web:d326c6fd852bafa2e6fed2"
};

const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);
const STORE_PHONE = "641-637-4010";

const menuButton = document.querySelector('.menu-button');
const mobileMenu = document.querySelector('#mobile-menu');
const searchInput = document.querySelector('#equipment-search');
const categoryGrid = document.querySelector('#category-grid');
const equipmentGrid = document.querySelector('#equipment-grid');
const resultCount = document.querySelector('#result-count');
const emptyState = document.querySelector('#empty-state');
const catalogMessage = document.querySelector('#catalog-message');

let equipment = [];
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

function escapeHtml(value = '') {
  return String(value).replace(/[&<>'"]/g, (char) => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]));
}

function driveFileIdFromUrl(url) {
  const text = String(url || '').trim();
  const patterns = [/[?&]id=([^&]+)/i, /\/d\/([^/?#]+)/i, /googleusercontent\.com\/d\/([^=/?#]+)/i];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) return decodeURIComponent(match[1]);
  }
  return '';
}

function displayImageUrl(url) {
  const id = driveFileIdFromUrl(url);
  return id ? `https://lh3.googleusercontent.com/d/${encodeURIComponent(id)}=w1200` : String(url || '');
}

function categoryKey(value) {
  return String(value || 'Other').trim().toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'other';
}

function prettyCategory(value) {
  return String(value || 'Rental Equipment').trim() || 'Rental Equipment';
}

function toDate(value) {
  if (!value) return null;
  const date = value?.toDate ? value.toDate() : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDate(value) {
  const date = toDate(value);
  return date ? date.toLocaleString([], {weekday:'short', month:'short', day:'numeric', hour:'numeric', minute:'2-digit'}) : '';
}

function availabilityInfo(item) {
  const status = String(item.status || 'Available').trim().toLowerCase();
  if (status.includes('maintenance') || status.includes('service')) {
    return {className:'unavailable', label:'Currently unavailable', detail:'Temporarily unavailable while being serviced.'};
  }
  if (status.includes('rent')) {
    const due = formatDate(item.expectedBack);
    return {className:'limited', label:'Currently unavailable', detail: due ? `Expected availability: ${due}.` : 'Call the store for expected availability.'};
  }
  if (status.includes('reserv')) {
    return {className:'limited', label:'Limited availability', detail:'Contact the store to confirm available dates.'};
  }
  if (status.includes('unavailable')) {
    return {className:'unavailable', label:'Currently unavailable', detail:'Contact the store for expected availability.'};
  }
  return {className:'available', label:'Available', detail:'Submit a reservation request for your preferred dates.'};
}

function descriptionFor(item) {
  return item.publicDescription || item.description || item.quickStart || item.beforeYouStart || 'Contact McGriff\'s for details, recommended uses, and current availability.';
}

function searchText(item) {
  const resourceLabels = [...(item.manualUrls || []), ...(item.videoUrls || [])]
    .map((entry) => typeof entry === 'string' ? entry : entry?.label || '')
    .join(' ');
  return [item.name, item.category, descriptionFor(item), item.quickStart, item.beforeYouStart, item.includedAccessories, resourceLabels]
    .filter(Boolean).join(' ').toLowerCase();
}

function renderCategories() {
  const categories = [...new Set(equipment.map((item) => prettyCategory(item.category)))].sort((a,b) => a.localeCompare(b));
  categoryGrid.innerHTML = `
    <button class="category-card ${activeCategory === 'all' ? 'active' : ''}" type="button" data-category="all" role="listitem">
      <span>All</span><small>View everything</small>
    </button>
    ${categories.map((category) => `
      <button class="category-card ${activeCategory === categoryKey(category) ? 'active' : ''}" type="button" data-category="${escapeHtml(categoryKey(category))}" role="listitem">
        <span>${escapeHtml(category)}</span><small>Browse ${escapeHtml(category.toLowerCase())}</small>
      </button>`).join('')}`;

  categoryGrid.querySelectorAll('.category-card').forEach((button) => {
    button.addEventListener('click', () => {
      activeCategory = button.dataset.category;
      renderCategories();
      renderCatalog();
      document.querySelector('#equipment')?.scrollIntoView({behavior:'smooth', block:'start'});
    });
  });
}

function equipmentCard(item) {
  const availability = availabilityInfo(item);
  const imageUrl = displayImageUrl(item.photoUrl);
  const category = prettyCategory(item.category);
  const image = imageUrl
    ? `<img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(item.name || 'Rental equipment')}" loading="lazy" onerror="this.parentElement.classList.add('placeholder-photo');this.remove();this.parentElement.insertAdjacentHTML('beforeend','<span>Equipment photo coming soon</span>')">`
    : '<span>Equipment photo coming soon</span>';

  return `<article class="equipment-card" data-id="${escapeHtml(item.id)}">
    <a class="equipment-photo ${imageUrl ? '' : 'placeholder-photo'}" href="equipment.html?id=${encodeURIComponent(item.id)}" aria-label="View ${escapeHtml(item.name || 'equipment')}">${image}</a>
    <div class="equipment-content">
      <div class="card-topline"><span class="availability ${availability.className}">${escapeHtml(availability.label)}</span><span>${escapeHtml(category)}</span></div>
      <h3><a class="card-title-link" href="equipment.html?id=${encodeURIComponent(item.id)}">${escapeHtml(item.name || 'Rental Equipment')}</a></h3>
      <p>${escapeHtml(descriptionFor(item))}</p>
      <p class="availability-detail">${escapeHtml(availability.detail)}</p>
      <div class="card-actions">
        <a class="button button-primary request-button" href="reserve-request.html?id=${encodeURIComponent(item.id)}">Request reservation</a>
        <a class="text-link" href="equipment.html?id=${encodeURIComponent(item.id)}">View details</a>
      </div>
    </div>
  </article>`;
}

function renderCatalog() {
  const queryText = (searchInput?.value || '').trim().toLowerCase();
  const visible = equipment.filter((item) => {
    const matchesCategory = activeCategory === 'all' || categoryKey(item.category) === activeCategory;
    const matchesSearch = !queryText || searchText(item).includes(queryText);
    return matchesCategory && matchesSearch;
  });

  equipmentGrid.innerHTML = visible.map(equipmentCard).join('');
  resultCount.textContent = `Showing ${visible.length} ${visible.length === 1 ? 'piece' : 'pieces'} of equipment`;
  emptyState.hidden = visible.length !== 0;

}

function showCatalogError(error) {
  console.error(error);
  catalogMessage.hidden = false;
  catalogMessage.classList.add('catalog-error');
  catalogMessage.innerHTML = `<div><strong>The live equipment list could not be loaded.</strong><p>Please call <a href="tel:+16416374010">${STORE_PHONE}</a>. The website connection or Firebase read rules may need attention.</p></div>`;
  resultCount.textContent = 'Equipment temporarily unavailable online';
}

searchInput?.addEventListener('input', renderCatalog);

onSnapshot(collection(db, 'publicEquipment'), (snapshot) => {
  equipment = snapshot.docs
    .map((document) => ({id: document.id, ...document.data()}))
    .filter((item) => item.portalEnabled !== false && item.websitePublished !== false)
    .sort((a,b) => String(a.name || '').localeCompare(String(b.name || '')));

  catalogMessage.hidden = true;
  if (!equipment.length) {
    catalogMessage.hidden = false;
    catalogMessage.innerHTML = `<div><strong>No equipment has been published yet.</strong><p>Publish an equipment customer portal in the employee Rental Manager, then it will appear here automatically.</p></div>`;
  }
  renderCategories();
  renderCatalog();
}, showCatalogError);
