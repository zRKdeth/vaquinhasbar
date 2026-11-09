/* Vaquinha's Bar — lógica do site (JavaScript puro, sem bibliotecas). */
const STORAGE_KEY = 'tavernaDoBlues_v1';
const WELCOME_KEY = 'vaquinhasBar_welcome_seen_v1';

const products = [
  { id: 1, name: 'Cerveja da Casa', category: 'Bebidas', price: 8.50, description: 'Cerveja bem gelada para começar a noite.', icon: '🍺', art: 'art-beer', tag: 'A queridinha' },
  { id: 2, name: 'Drink Old Fashioned', category: 'Drinks', price: 22.00, description: 'Um clássico com notas cítricas e aromáticas.', icon: '🥃', art: 'art-drink', tag: 'Clássico' },
  { id: 3, name: 'Porção da Casa', category: 'Petiscos', price: 29.90, description: 'Petiscos crocantes para dividir com a mesa.', icon: '🍟', art: 'art-snack', tag: 'Para compartilhar' },
  { id: 4, name: 'Refrigerante', category: 'Bebidas', price: 6.00, description: 'Lata gelada. Consulte os sabores disponíveis.', icon: '🥤', art: 'art-soda', tag: 'Sem álcool' },
  { id: 5, name: 'Brownie da Casa', category: 'Doces', price: 12.00, description: 'Brownie macio para fechar a noite.', icon: '🍫', art: 'art-sweet', tag: 'Feito com carinho' },
  { id: 6, name: 'Café do Balcão', category: 'Bebidas', price: 5.50, description: 'Café passado na hora, forte e saboroso.', icon: '☕', art: 'art-coffee', tag: 'Depois do jantar' },
  { id: 7, name: 'Batata Rústica', category: 'Petiscos', price: 19.00, description: 'Batatas douradas com ervas e molho da casa.', icon: '🥔', art: 'art-snack', tag: 'Favorito' },
  { id: 8, name: 'Soda de Limão', category: 'Drinks', price: 14.00, description: 'Bebida refrescante sem álcool com limão.', icon: '🍋', art: 'art-soda', tag: 'Sem álcool' },
  { id: 9, name: 'Amendoim Temperado', category: 'Petiscos', price: 7.00, description: 'Porção para beliscar enquanto a música toca.', icon: '🥜', art: 'art-sweet', tag: 'Para acompanhar' }
];

const defaultState = {
  profileName: 'Viajante',
  cart: [],
  ledger: [],
  orders: []
};
let state = loadState();
let activeCategory = 'Todos';
let toastTimer;

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return saved ? { ...defaultState, ...saved } : structuredClone(defaultState);
  } catch (error) {
    console.warn('Não foi possível ler os dados salvos:', error);
    return structuredClone(defaultState);
  }
}
function saveState() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
  catch (error) { console.warn('Não foi possível salvar os dados:', error); showToast('Não foi possível salvar neste navegador.'); }
}
const money = value => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value) || 0);
const dateLabel = date => new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(date));
const escapeHTML = value => String(value).replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
const totalDebt = () => Math.max(0, state.ledger.reduce((sum, item) => sum + (item.type === 'debit' ? item.amount : -item.amount), 0));
const cartTotal = () => state.cart.reduce((sum, item) => {
  const product = products.find(p => p.id === item.id);
  return sum + (product ? product.price * item.quantity : 0);
}, 0);

function showToast(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2600);
}
function initials(name) {
  return name.trim().split(/\s+/).slice(0, 2).map(part => part[0] || '').join('').toUpperCase() || 'V';
}
function updateProfile() {
  document.getElementById('profileName').textContent = state.profileName;
  document.getElementById('avatarInitials').textContent = initials(state.profileName);
}
function updateBadges() {
  document.getElementById('sidebarDebt').textContent = money(totalDebt());
  document.getElementById('debtBalance').textContent = money(totalDebt());
  document.getElementById('cartCount').textContent = state.cart.reduce((sum, item) => sum + item.quantity, 0);
}

function productCard(product, featured = false) {
  if (featured) {
    return `<article class="promo-card">
      <div class="product-art ${product.art}" aria-hidden="true">${product.icon}</div>
      <div class="promo-info"><small>${escapeHTML(product.tag)}</small><h3>${escapeHTML(product.name)}</h3><p>${escapeHTML(product.description)}</p>
        <div class="promo-bottom"><span class="product-price">${money(product.price)}</span><button class="add-mini" data-add="${product.id}" aria-label="Adicionar ${escapeHTML(product.name)} à sacola" type="button">+</button></div>
      </div>
    </article>`;
  }
  return `<article class="catalog-card">
    <div class="product-art ${product.art}" aria-hidden="true">${product.icon}</div>
    <div class="catalog-info"><span class="product-category">${escapeHTML(product.category)}</span><h3>${escapeHTML(product.name)}</h3><p>${escapeHTML(product.description)}</p>
      <div class="catalog-footer"><strong class="product-price">${money(product.price)}</strong><button class="add-button" data-add="${product.id}" type="button">＋ Adicionar</button></div>
    </div>
  </article>`;
}
function renderFeatured() {
  const featured = [products[0], products[2], products[4]];
  document.getElementById('featuredProducts').innerHTML = featured.map(product => productCard(product, true)).join('');
}
function renderProducts() {
  const term = document.getElementById('productSearch').value.trim().toLocaleLowerCase('pt-BR');
  const filtered = products.filter(product => {
    const matchesCategory = activeCategory === 'Todos' || product.category === activeCategory;
    const matchesTerm = `${product.name} ${product.description} ${product.category}`.toLocaleLowerCase('pt-BR').includes(term);
    return matchesCategory && matchesTerm;
  });
  document.getElementById('allProducts').innerHTML = filtered.length
    ? filtered.map(product => productCard(product)).join('')
    : '<p class="empty-message">Não encontramos produtos com esse nome ou filtro.</p>';
}
function addToCart(id) {
  const product = products.find(item => item.id === Number(id));
  if (!product) return;
  // Para esta demonstração, produtos com álcool exigem confirmação de maioridade.
  if (product.id === 1 || product.id === 2) {
    const confirmed = window.confirm('A compra de bebidas alcoólicas é permitida somente para maiores de 18 anos. Você confirma que tem 18 anos ou mais?');
    if (!confirmed) return;
  }
  const existing = state.cart.find(item => item.id === product.id);
  if (existing) existing.quantity += 1;
  else state.cart.push({ id: product.id, quantity: 1 });
  saveState(); renderCart(); updateBadges(); showToast(`${product.name} adicionado à sacola.`);
}
function changeCartQuantity(id, delta) {
  const item = state.cart.find(entry => entry.id === Number(id));
  if (!item) return;
  item.quantity += delta;
  if (item.quantity <= 0) state.cart = state.cart.filter(entry => entry.id !== Number(id));
  saveState(); renderCart(); updateBadges();
}
function renderCart() {
  const container = document.getElementById('checkoutItems');
  const clearCartButton = document.getElementById('clearCartButton');
  if (clearCartButton) clearCartButton.disabled = state.cart.length === 0;
  if (!state.cart.length) {
    container.innerHTML = '<p class="empty-message">Sua sacola está vazia. Adicione produtos pelo cardápio.</p>';
  } else {
    container.innerHTML = state.cart.map(item => {
      const product = products.find(p => p.id === item.id);
      if (!product) return '';
      return `<div class="checkout-line"><span><strong>${escapeHTML(product.name)}</strong><small>× ${item.quantity} · ${money(product.price)} cada</small></span><span><strong>${money(product.price * item.quantity)}</strong> <button type="button" data-remove="${product.id}" aria-label="Remover uma unidade de ${escapeHTML(product.name)}">−</button> <button type="button" data-plus="${product.id}" aria-label="Adicionar uma unidade de ${escapeHTML(product.name)}">＋</button></span></div>`;
    }).join('');
  }
  document.getElementById('checkoutTotal').textContent = money(cartTotal());
}
function clearCart() {
  if (!state.cart.length) return showToast('Sua sacola já está vazia.');
  state.cart = [];
  saveState();
  renderCart();
  updateBadges();
  showToast('Sacola esvaziada.');
}

function addLedgerEntry(description, amount, type) {
  state.ledger.unshift({ id: Date.now(), description, amount, type, date: new Date().toISOString() });
  saveState(); renderLedger(); updateBadges();
}
function renderLedger() {
  const ledger = document.getElementById('debtLedger');
  if (!state.ledger.length) {
    ledger.innerHTML = '<p class="empty-message">Nenhuma movimentação registrada. Sua conta está limpa por aqui. ✦</p>';
    return;
  }
  ledger.innerHTML = state.ledger.map(item => `<div class="ledger-row">
    <span class="ledger-symbol">${item.type === 'debit' ? '＋' : '✓'}</span>
    <span class="ledger-description"><strong>${escapeHTML(item.description)}</strong><small>${dateLabel(item.date)}</small></span>
    <span class="ledger-amount ${item.type}">${item.type === 'debit' ? '+' : '−'} ${money(item.amount)}</span>
  </div>`).join('');
}

function renderOrders() {
  const container = document.getElementById('orderHistory');
  if (!state.orders.length) {
    container.innerHTML = '<p class="empty-message">Você ainda não fez solicitações por aqui.</p>';
    return;
  }
  container.innerHTML = state.orders.map(order => {
    const status = order.status || 'Solicitado';
    const cancelled = status === 'Cancelado';
    return `<div class="order-item ${cancelled ? 'is-cancelled' : ''}">
      <div class="order-description"><strong>Pedido #${escapeHTML(order.id)}</strong><small>${escapeHTML(order.items)} · ${dateLabel(order.date)}</small></div>
      <div class="order-controls"><span class="order-status ${cancelled ? 'cancelled' : ''}">${status} · ${money(order.total)}</span>
      ${cancelled ? '' : `<button class="button button-muted button-small" type="button" data-cancel-order="${escapeHTML(order.id)}">Cancelar pedido</button>`}</div>
    </div>`;
  }).join('');
}
function cancelOrder(id) {
  const order = state.orders.find(item => String(item.id) === String(id));
  if (!order || order.status === 'Cancelado') return;
  if (!window.confirm(`Deseja cancelar o pedido #${id}?`)) return;
  order.status = 'Cancelado';
  order.cancelledAt = new Date().toISOString();
  saveState();
  renderOrders();
  showToast(`Pedido #${id} cancelado.`);
}

function navigate(page) {
  const validPages = ['inicio', 'produtos', 'fiado', 'entregas'];
  if (!validPages.includes(page)) return;
  document.querySelectorAll('.page').forEach(section => section.classList.toggle('active', section.id === `page-${page}`));
  document.querySelectorAll('.nav-link').forEach(button => button.classList.toggle('active', button.dataset.page === page));
  window.scrollTo({ top: 0, behavior: 'smooth' });
  if (page === 'produtos') renderProducts();
  if (page === 'fiado') { renderLedger(); updateBadges(); }
  if (page === 'entregas') { renderCart(); renderOrders(); }
}

const dialog = document.getElementById('appDialog');
function openDialog({ eyebrow = "VAQUINHA'S BAR", title, content, actions }) {
  document.getElementById('dialogEyebrow').textContent = eyebrow;
  document.getElementById('dialogTitle').textContent = title;
  document.getElementById('dialogContent').innerHTML = content;
  document.getElementById('dialogActions').innerHTML = actions;
  dialog.showModal();
}
function openProfileDialog() {
  openDialog({
    eyebrow: 'SUA CONTA', title: 'Como devemos chamar você?',
    content: `<label class="dialog-field">Seu nome<input id="newProfileName" type="text" maxlength="50" value="${escapeHTML(state.profileName)}" required></label>`,
    actions: '<button class="button button-muted" type="button" data-dialog-cancel>Cancelar</button><button class="button button-gold" id="saveProfileButton" type="button">Salvar perfil</button>'
  });
  document.getElementById('saveProfileButton').addEventListener('click', () => {
    const name = document.getElementById('newProfileName').value.trim();
    if (!name) return showToast('Digite seu nome para continuar.');
    state.profileName = name; saveState(); updateProfile(); dialog.close(); showToast('Perfil atualizado.');
  });
}
function openAddDebtDialog() {
  openDialog({
    eyebrow: 'CONTA DA CASA', title: 'Anotar uma compra',
    content: '<label class="dialog-field">Descrição<input id="debtDescription" type="text" maxlength="70" placeholder="Ex.: Porção e refrigerante" required></label><label class="dialog-field">Valor (R$)<input id="debtAmount" type="number" min="0.01" step="0.01" placeholder="0,00" required></label>',
    actions: '<button class="button button-muted" type="button" data-dialog-cancel>Cancelar</button><button class="button button-gold" id="saveDebtButton" type="button">Anotar no fiado</button>'
  });
  document.getElementById('saveDebtButton').addEventListener('click', () => {
    const description = document.getElementById('debtDescription').value.trim();
    const amount = Number(document.getElementById('debtAmount').value);
    if (!description || !Number.isFinite(amount) || amount <= 0) return showToast('Preencha a descrição e um valor válido.');
    addLedgerEntry(description, amount, 'debit'); dialog.close(); showToast('Compra anotada no fiado.');
  });
}
function openPaymentDialog() {
  const balance = totalDebt();
  if (balance <= 0) return showToast('Você não tem saldo pendente.');
  openDialog({
    eyebrow: 'ACERTO DE CONTA', title: 'Registrar pagamento',
    content: `<p style="color:#777269;font-size:11px;margin-top:0">Saldo atual: <strong>${money(balance)}</strong></p><label class="dialog-field">Valor pago (R$)<input id="paymentAmount" type="number" min="0.01" max="${balance.toFixed(2)}" step="0.01" value="${balance.toFixed(2)}" required></label>`,
    actions: '<button class="button button-muted" type="button" data-dialog-cancel>Cancelar</button><button class="button button-gold" id="savePaymentButton" type="button">Registrar pagamento</button>'
  });
  document.getElementById('savePaymentButton').addEventListener('click', () => {
    const amount = Number(document.getElementById('paymentAmount').value);
    if (!Number.isFinite(amount) || amount <= 0 || amount > totalDebt() + .001) return showToast('Informe um valor válido, até o saldo atual.');
    addLedgerEntry('Pagamento registrado', amount, 'credit'); dialog.close(); showToast('Pagamento registrado no histórico.');
  });
}

function openWelcomeGuide() {
  const welcomeDialog = document.getElementById('welcomeDialog');
  if (!welcomeDialog.open) welcomeDialog.showModal();
}
function markWelcomeAsSeen() {
  try { localStorage.setItem(WELCOME_KEY, 'true'); }
  catch (error) { console.warn('Não foi possível salvar a preferência de boas-vindas:', error); }
}
function showWelcomeForNewVisitor() {
  let alreadySeen = false;
  try { alreadySeen = localStorage.getItem(WELCOME_KEY) === 'true'; }
  catch (error) { console.warn('Não foi possível consultar a preferência de boas-vindas:', error); }
  if (!alreadySeen) openWelcomeGuide();
}

function submitDelivery(event) {
  event.preventDefault();
  if (!state.cart.length) { showToast('Adicione pelo menos um produto à sacola.'); navigate('produtos'); return; }
  const name = document.getElementById('customerName').value.trim();
  const phone = document.getElementById('customerPhone').value.trim();
  const address = document.getElementById('customerAddress').value.trim();
  const neighborhood = document.getElementById('customerNeighborhood').value.trim();
  if (!name || !phone || !address || !neighborhood) { showToast('Preencha os campos obrigatórios da entrega.'); return; }
  const order = {
    id: String(Date.now()).slice(-6), date: new Date().toISOString(), total: cartTotal(),
    items: state.cart.map(item => `${item.quantity}× ${products.find(p => p.id === item.id)?.name || 'Produto'}`).join(', '),
    customer: name, phone, address, neighborhood,
    zip: document.getElementById('customerZip').value.trim(),
    complement: document.getElementById('customerComplement').value.trim(),
    notes: document.getElementById('customerNotes').value.trim()
  };
  state.orders.unshift(order); state.cart = []; saveState(); renderCart(); renderOrders(); updateBadges();
  document.getElementById('deliveryForm').reset();
  showToast(`Solicitação #${order.id} registrada neste navegador.`);
  renderOrders();
}

// Eventos globais: delegação permite que os cartões sejam redesenhados sem perder ações.
document.addEventListener('click', event => {
  const pageButton = event.target.closest('[data-page], [data-go], [data-page-link]');
  if (pageButton) { event.preventDefault(); navigate(pageButton.dataset.page || pageButton.dataset.go || pageButton.dataset.pageLink); return; }
  const addButton = event.target.closest('[data-add]');
  if (addButton) { addToCart(addButton.dataset.add); return; }
  const removeButton = event.target.closest('[data-remove]');
  if (removeButton) { changeCartQuantity(removeButton.dataset.remove, -1); return; }
  const plusButton = event.target.closest('[data-plus]');
  if (plusButton) { changeCartQuantity(plusButton.dataset.plus, 1); return; }
  const cancelOrderButton = event.target.closest('[data-cancel-order]');
  if (cancelOrderButton) { cancelOrder(cancelOrderButton.dataset.cancelOrder); return; }
});
document.getElementById('categoryFilters').addEventListener('click', event => {
  const button = event.target.closest('[data-category]');
  if (!button) return;
  activeCategory = button.dataset.category;
  document.querySelectorAll('.filter-pill').forEach(pill => pill.classList.toggle('active', pill === button));
  renderProducts();
});
document.getElementById('productSearch').addEventListener('input', renderProducts);
document.getElementById('profileButton').addEventListener('click', openProfileDialog);
document.getElementById('addDebtButton').addEventListener('click', openAddDebtDialog);
document.getElementById('payDebtButton').addEventListener('click', openPaymentDialog);
document.getElementById('cartShortcut').addEventListener('click', () => navigate('entregas'));
document.getElementById('deliveryForm').addEventListener('submit', submitDelivery);
document.getElementById('clearCartButton').addEventListener('click', clearCart);
document.getElementById('cancelDeliveryButton').addEventListener('click', () => {
  document.getElementById('deliveryForm').reset();
  showToast('Preenchimento cancelado. Sua sacola foi mantida.');
});

dialog.addEventListener('click', event => {
  if (event.target.closest('[data-dialog-cancel]')) {
    event.preventDefault();
    dialog.close();
  }
});

document.getElementById('openGuideButton').addEventListener('click', openWelcomeGuide);
document.getElementById('closeWelcomeButton').addEventListener('click', () => document.getElementById('welcomeDialog').close());
document.getElementById('skipWelcomeButton').addEventListener('click', () => document.getElementById('welcomeDialog').close());
document.getElementById('welcomeMenuButton').addEventListener('click', () => {
  document.getElementById('welcomeDialog').close();
  navigate('produtos');
});
document.getElementById('welcomeDialog').addEventListener('close', markWelcomeAsSeen);

// Inicialização
renderFeatured(); renderProducts(); renderLedger(); renderCart(); renderOrders(); updateProfile(); updateBadges();
document.getElementById('currentYear').textContent = new Date().getFullYear();
showWelcomeForNewVisitor();
