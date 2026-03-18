let orders = [];
let currentFilter = 'pending';
// Ajout au début kitchen.js
let channel;
if (window.BroadcastChannel) {
    channel = new BroadcastChannel('restaurant_orders');
    channel.onmessage = function(event) {
        if (event.data.type === 'NEW_ORDER') {
            orders.unshift(event.data.order);
            renderOrders();
            updateStats();
            notifyNewOrder();
        }
    };
}

// Reste du code inchangé...

document.addEventListener('DOMContentLoaded', function() {
    loadOrders();
    setupEventListeners();
    updateStats();
    watchForNewOrders();
});

function setupEventListeners() {
    document.getElementById('filterStatus').addEventListener('change', function() {
        currentFilter = this.value;
        renderOrders();
    });
}

function loadOrders() {
    const saved = localStorage.getItem('kitchenOrders') || '[]';
    orders = JSON.parse(saved);
    renderOrders();
    updateStats();
}

function watchForNewOrders() {
    // Vérification toutes les 2 secondes (temps réel simulé)
    setInterval(() => {
        const saved = localStorage.getItem('kitchenOrders') || '[]';
        const newOrders = JSON.parse(saved);
        
        // Détecter nouvelles commandes
        const newOrderIds = newOrders.map(o => o.id).filter(id => 
            !orders.some(existing => existing.id === id)
        );
        
        if (newOrderIds.length > 0) {
            orders = newOrders;
            renderOrders();
            updateStats();
            newOrderIds.forEach(() => notifyNewOrder());
        }
    }, 2000);
}

function renderOrders() {
    const container = document.getElementById('ordersContainer');
    const filteredOrders = orders.filter(order => 
        currentFilter === 'all' || order.status === currentFilter
    );

    if (filteredOrders.length === 0) {
        container.innerHTML = `
            <div class="text-center py-5">
                <i class="fas fa-clipboard-list fa-4x text-muted mb-4"></i>
                <h4 class="text-muted">Aucune commande 
                    ${currentFilter === 'pending' ? 'en attente' : 
                      currentFilter === 'preparing' ? 'en préparation' : 
                      currentFilter === 'ready' ? 'prête' : 'annulée'}
                </h4>
                <p class="text-muted">Les tables passent leurs commandes</p>
            </div>
        `;
        return;
    }

    container.innerHTML = filteredOrders.map(order => `
        <div class="order-card mb-4 p-4 rounded-4 shadow-lg animate-slide-in
            ${getOrderClass(order.status)} position-relative">
            <!-- Badge Table -->
            <div class="position-absolute top-0 start-0 badge fs-6 fw-bold p-3 rounded-bottom-4 shadow"
                 style="background: linear-gradient(135deg, var(--bs-primary), #dc3545); z-index: 2;">
                Table ${order.table}
            </div>
            
            <!-- Header -->
            <div class="d-flex justify-content-between align-items-start mb-4 pb-3 border-bottom">
                <div>
                    <h4 class="mb-1 fw-bold">#${order.id}</h4>
                    <small class="text-muted">
                        <i class="fas fa-clock me-1"></i>
                        ${new Date(order.timestamp).toLocaleString('fr-FR')}
                    </small>
                </div>
                <span class="badge fs-5 p-3 rounded-pill shadow ${getStatusBadgeClass(order.status)}">
                    ${getStatusLabel(order.status)}
                </span>
            </div>

            <!-- Items -->
            <div class="row mb-4">
                ${order.items.map(item => `
                    <div class="col-lg-6 col-md-12 mb-3">
                        <div class="item-card p-3 rounded-3">
                            <div class="d-flex align-items-center">
                                <span class="emoji fs-2 me-3">${item.image}</span>
                                <div class="flex-grow-1">
                                    <div class="fw-bold">${item.name}</div>
                                    <small class="text-muted">${item.desc}</small>
                                </div>
                                <div class="text-end ms-3">
                                    <div class="h6 mb-0 fw-bold">${item.quantity}x</div>
                                    <div class="text-primary">${(item.price * item.quantity).toFixed(2)}€</div>
                                </div>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>

            <!-- Footer -->
            <div class="d-flex justify-content-between align-items-center pt-3 border-top">
                <div>
                    <strong class="h4 text-primary mb-0">TOTAL ${order.total.toFixed(2)}€</strong>
                </div>
                <div class="btn-group btn-group-lg" role="group">
                    ${order.status === 'pending' ? 
                        `<button class="btn btn-outline-warning" onclick="updateStatus('${order.id}', 'preparing')">
                            <i class="fas fa-play-circle"></i><br><small>Préparer</small>
                        </button>` : 
                        ''
                    }
                    ${order.status === 'pending' || order.status === 'preparing' ? 
                        `<button class="btn btn-outline-success" onclick="updateStatus('${order.id}', 'ready')">
                            <i class="fas fa-check-circle"></i><br><small>Prêt</small>
                        </button>` : 
                        `<button class="btn btn-success" disabled><i class="fas fa-check"></i> Prêt</button>`
                    }
                    <button class="btn btn-outline-danger" onclick="deleteOrder('${order.id}')">
                        <i class="fas fa-times-circle"></i><br><small>Annuler</small>
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

function updateStats() {
    const pending = orders.filter(o => o.status === 'pending').length;
    const preparing = orders.filter(o => o.status === 'preparing').length;
    
    document.getElementById('pendingCount').textContent = pending;
    document.getElementById('preparingCount').textContent = preparing;
}

function updateStatus(orderId, status) {
    const order = orders.find(o => o.id == orderId);
    if (order) {
        order.status = status;
        localStorage.setItem('kitchenOrders', JSON.stringify(orders));
        renderOrders();
        updateStats();
        showToast(`Table ${order.table} → ${getStatusLabel(status)}`);
    }
}

function deleteOrder(orderId) {
    if (confirm('Annuler cette commande ?')) {
        orders = orders.filter(o => o.id != orderId);
        localStorage.setItem('kitchenOrders', JSON.stringify(orders));
        renderOrders();
        updateStats();
        showToast('Commande annulée');
    }
}

function clearAllOrders() {
    if (confirm('Vider TOUTES les commandes ?')) {
        orders = [];
        localStorage.removeItem('kitchenOrders');
        renderOrders();
        updateStats();
    }
}

function exportOrders() {
    const data = orders.map(o => ({
        table: o.table,
        id: o.id,
        status: o.status,
        total: o.total,
        timestamp: o.timestamp
    }));
    const blob = new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `commandes_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
}

// Notifications
function notifyNewOrder() {
    const audio = document.getElementById('notifySound');
    audio.play().catch(() => {});
    
    // Animation globale
    document.body.classList.add('new-order-flash');
    setTimeout(() => document.body.classList.remove('new-order-flash'), 1000);
    
    showKitchenToast('🔔 Nouvelle commande !');
}

function showKitchenToast(message) {
    // Toast simple
    const toast = document.createElement('div');
    toast.className = 'toast align-items-center text-white bg-success border-0 position-fixed top-0 end-0 m-4';
    toast.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">${message}</div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
        </div>
    `;
    document.body.appendChild(toast);
    const bsToast = new bootstrap.Toast(toast);
    bsToast.show();
    toast.addEventListener('hidden.bs.toast', () => toast.remove());
}

// Helpers
function getOrderClass(status) {
    return status === 'pending' ? 'border-start border-warning border-5 bg-warning-subtle' :
           status === 'preparing' ? 'border-start border-info border-5 bg-info-subtle' :
           status === 'ready' ? 'border-start border-success border-5 bg-success-subtle' :
           'border-start border-danger border-5 bg-danger-subtle';
}

function getStatusBadgeClass(status) {
    return status === 'pending' ? 'bg-warning text-dark' :
           status === 'preparing' ? 'bg-info' :
           status === 'ready' ? 'bg-success' : 'bg-danger';
}

function getStatusLabel(status) {
    return status === 'pending' ? 'ATTENTE' :
           status === 'preparing' ? 'PRÉPA' :
           status === 'ready' ? 'PRÊT' : 'ANNULÉ';
}
