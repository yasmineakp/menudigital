let cart = [];
let tableNumber = localStorage.getItem('tableNumber');

// Initialisation
document.addEventListener('DOMContentLoaded', function() {
    if (!tableNumber) {
        new bootstrap.Modal(document.getElementById('tableModal')).show();
    } else {
        setTableDisplay();
        initMenu();
    }
    loadCart();
    updateCartDisplay();
});

function setTable() {
    const input = document.getElementById('tableInput');
    const tableNum = input.value.trim();
    
    if (!tableNum || tableNum < 1 || tableNum > 100) {
        input.classList.add('is-invalid');
        return;
    }
    
    tableNumber = tableNum;
    localStorage.setItem('tableNumber', tableNumber);
    setTableDisplay();
    bootstrap.Modal.getInstance(document.getElementById('tableModal')).hide();
    initMenu();
}

function setTableDisplay() {
    document.getElementById('tableNumber').textContent = `Table ${tableNumber}`;
    document.getElementById('tableConfirm').textContent = tableNumber;
    document.getElementById('sendTable').textContent = tableNumber;
}

function initMenu() {
    // Remplir chaque onglet
    renderCategory('entrees', MENU_ITEMS.filter(item => item.category === 'entrees'));
    renderCategory('plats', MENU_ITEMS.filter(item => item.category === 'plats'));
    renderCategory('desserts', MENU_ITEMS.filter(item => item.category === 'desserts'));
    renderCategory('boissons', MENU_ITEMS.filter(item => item.category === 'boissons'));
    
    setupEventListeners();
}

function renderCategory(category, items) {
    const container = document.getElementById(`${category}Items`);
    container.innerHTML = items.map(item => `
        <div class="col-xl-3 col-lg-4 col-md-6 col-sm-12 mb-4">
            <div class="card h-100 shadow menu-card" onclick="addToCart(${item.id})">
                <div class="card-body text-center p-4">
                    <div class="emoji mb-3 fs-1">${item.image}</div>
                    <h6 class="card-title fw-bold mb-2">${item.name}</h6>
                    <p class="text-muted small mb-3">${item.desc}</p>
                    <div class="h4 text-primary fw-bold mb-3">${item.price.toFixed(2)}€</div>
                    <button class="btn btn-primary w-100">
                        <i class="fas fa-plus me-2"></i>Ajouter
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

// Recherche dans TOUS les onglets
document.getElementById('searchInput')?.addEventListener('input', function(e) {
    const query = e.target.value.toLowerCase();
    
    ['entrees', 'plats', 'desserts', 'boissons'].forEach(category => {
        const items = MENU_ITEMS.filter(item => 
            item.category === category && (
                item.name.toLowerCase().includes(query) || 
                item.desc.toLowerCase().includes(query)
            )
        );
        renderCategory(category, items);
    });
});

// FONCTIONS PANIER (inchangées)
function addToCart(itemId) {
    const item = MENU_ITEMS.find(i => i.id === itemId);
    const existing = cart.find(c => c.id === itemId);
    
    if (existing) existing.quantity += 1;
    else cart.push({...item, quantity: 1});
    
    saveCart();
    updateCartDisplay();
    showToast(`${item.name} ajouté !`);
}

function updateCartDisplay() {
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    document.getElementById('cartCount').textContent = count;
    document.getElementById('cartTotal').textContent = `${total.toFixed(2)}€`;
    document.getElementById('modalTotal').textContent = `${total.toFixed(2)}€`;
}

function showCart() {
    renderCartModal();
    new bootstrap.Modal(document.getElementById('cartModal')).show();
}

function renderCartModal() {
    const container = document.getElementById('cartItems');
    if (cart.length === 0) {
        container.innerHTML = '<div class="text-center py-5"><i class="fas fa-shopping-cart fa-4x text-muted mb-3"></i><h6 class="text-muted">Panier vide</h6></div>';
        return;
    }
    
    container.innerHTML = cart.map((item, index) => `
        <div class="row align-items-center py-3 border-bottom">
            <div class="col-2"><span class="emoji fs-2">${item.image}</span></div>
            <div class="col-4">
                <h6>${item.name}</h6>
                <small class="text-muted">${item.desc}</small>
            </div>
            <div class="col-3">
                <div class="input-group input-group-sm">
                    <button class="btn btn-outline-secondary" onclick="updateQuantity(${index}, -1)">-</button>
                    <span class="form-control text-center fw-bold bg-white">${item.quantity}</span>
                    <button class="btn btn-outline-secondary" onclick="updateQuantity(${index}, 1)">+</button>
                </div>
            </div>
            <div class="col-3 text-end h5 mb-0 text-primary">${(item.price * item.quantity).toFixed(2)}€</div>
        </div>
    `).join('');
}

function updateQuantity(index, change) {
    cart[index].quantity += change;
    if (cart[index].quantity <= 0) cart.splice(index, 1);
    saveCart();
    updateCartDisplay();
    renderCartModal();
}

function clearCart() {
    cart = [];
    saveCart();
    updateCartDisplay();
    renderCartModal();
    showToast('Panier vidé !');
}

// ... tout le code existant ...

function sendOrder() {
    if (!tableNumber) return showToast('Indiquez votre table', 'warning');
    if (cart.length === 0) return showToast('Panier vide !', 'warning');
    
    const order = {
        table: tableNumber,
        id: Date.now(),
        items: [...cart],
        total: cart.reduce((sum, item) => sum + (item.price * item.quantity), 0),
        status: 'pending',
        timestamp: new Date().toISOString()
    };
    
    // ✅ SOLUTION GLOBALE : Broadcast vers tous
    if (window.BroadcastChannel) {
        const channel = new BroadcastChannel('restaurant_orders');
        channel.postMessage({type: 'NEW_ORDER', order});
        channel.close();
    }
    
    // Fallback localStorage
    let kitchenOrders = JSON.parse(localStorage.getItem('kitchenOrders') || '[]');
    kitchenOrders.unshift(order);
    localStorage.setItem('kitchenOrders', JSON.stringify(kitchenOrders));
    
    showToast(`✅ Table ${tableNumber} | ${order.total.toFixed(2)}€`);
    clearCart();
    bootstrap.Modal.getInstance(document.getElementById('cartModal')).hide();
}
    
    // Simulation temps réel
    let kitchenOrders = JSON.parse(localStorage.getItem('kitchenOrders') || '[]');
    kitchenOrders.unshift(order);
    localStorage.setItem('kitchenOrders', JSON.stringify(kitchenOrders));
    
    showToast(`✅ Table ${tableNumber} | ${order.total.toFixed(2)}€`);
    clearCart();
    bootstrap.Modal.getInstance(document.getElementById('cartModal')).hide();
}

function saveCart() { localStorage.setItem('cart', JSON.stringify(cart)); }
function loadCart() { 
    const saved = localStorage.getItem('cart');
    if (saved) cart = JSON.parse(saved);
}

function showToast(message, type = 'info') {
    const toast = document.getElementById('orderToast');
    toast.querySelector('.toast-body').textContent = message;
    const bsToast = new bootstrap.Toast(toast);
    bsToast.show();
}
document.getElementById('searchInput')?.addEventListener('input', function(e) {
    const query = e.target.value.toLowerCase().trim();
    
    if (query.length === 0) {
        // Pas de recherche → tous les plats
        renderCategory('entrees', MENU_ITEMS.filter(item => item.category === 'entrees'));
        renderCategory('plats', MENU_ITEMS.filter(item => item.category === 'plats'));
        renderCategory('desserts', MENU_ITEMS.filter(item => item.category === 'desserts'));
        renderCategory('boissons', MENU_ITEMS.filter(item => item.category === 'boissons'));
        return;
    }
    
    // Recherche floue dans TOUS les onglets
    ['entrees', 'plats', 'desserts', 'boissons'].forEach(category => {
        const items = MENU_ITEMS.filter(item => 
            item.category === category && (
                item.name.toLowerCase().includes(query) ||
                item.desc.toLowerCase().includes(query) ||
                item.name.toLowerCase().split(' ').some(word => word.includes(query)) ||
                item.desc.toLowerCase().split(' ').some(word => word.includes(query))
            )
        );
        renderCategory(category, items);
    });
});
