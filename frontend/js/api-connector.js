// ── The Hole in the Wall Café — Frontend API Connector ──
// This file bridges the static frontend with the Node.js backend.
// Include this AFTER your main scripts in index.html

(function () {
  'use strict';

  const API = '/api';

  // ── HELPERS ──────────────────────────────────────────
  const fetchAPI = async (path, opts = {}) => {
    const res = await fetch(API + path, {
      headers: { 'Content-Type': 'application/json' },
      ...opts,
      body: opts.body ? JSON.stringify(opts.body) : undefined,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Request failed');
    return data;
  };

  // ── MENU: Load from API and render ─────────────────
  const loadMenuFromAPI = async () => {
    try {
      const data = await fetchAPI('/menu?available=true');
      if (!data.items?.length) return;

      const grid = document.getElementById('menuGrid');
      if (!grid) return;

      // Clear static cards
      grid.innerHTML = '';

      data.items.forEach(item => {
        const card = document.createElement('article');
        card.className = 'menu-card active';
        card.dataset.cat = item.category;
        card.dataset.id = item._id;

        const tag = item.tags?.[0] || (item.isVeg ? 'Vegetarian' : 'Non-Veg');
        const tagClass = item.isVeg ? 'tag-veg' : 'tag-chef';

        card.innerHTML = `
          <div style="overflow:hidden;height:180px">
            <img class="menu-card-img" src="${item.image || 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&q=75'}"
              alt="${item.name}" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&q=75'"/>
          </div>
          <div class="menu-card-body">
            <h3 class="menu-card-name">${item.name}</h3>
            <p class="menu-card-desc">${item.description}</p>
            <div class="menu-card-footer">
              <span class="menu-price">₹ ${item.price}</span>
              <div style="display:flex;gap:0.5rem;align-items:center">
                <span class="menu-tag ${tagClass}">${tag}</span>
                <button class="add-to-cart-btn" data-id="${item._id}" data-name="${item.name}" data-price="${item.price}"
                  style="background:var(--brown-deep);color:white;border:none;padding:0.3rem 0.75rem;border-radius:2px;font-size:0.72rem;font-weight:700;letter-spacing:0.05em;cursor:pointer;transition:background 0.2s">
                  + Add
                </button>
              </div>
            </div>
          </div>`;
        grid.appendChild(card);
      });

      // Re-attach tab filtering
      initMenuTabs();
      // Re-attach cart buttons
      initCartButtons();
    } catch (err) {
      console.warn('Menu API unavailable, using static content:', err.message);
    }
  };

  const initMenuTabs = () => {
    const tabs = document.querySelectorAll('.menu-tab');
    const cards = document.querySelectorAll('.menu-card');
    tabs.forEach(tab => {
      tab.onclick = () => {
        const cat = tab.dataset.cat;
        tabs.forEach(t => { t.classList.remove('active'); t.setAttribute('aria-selected', 'false'); });
        tab.classList.add('active'); tab.setAttribute('aria-selected', 'true');
        cards.forEach(c => c.classList.toggle('active', c.dataset.cat === cat));
      };
    });
  };

  // ── CART ─────────────────────────────────────────────
  let cart = [];

  const initCartButtons = () => {
    document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const { id, name, price } = e.currentTarget.dataset;
        addToCart(id, name, Number(price));
      });
    });
  };

  const addToCart = (id, name, price) => {
    const existing = cart.find(i => i.menuItem === id);
    if (existing) { existing.quantity += 1; }
    else { cart.push({ menuItem: id, name, price, quantity: 1 }); }
    updateCartUI();
    showCartToast(name);
  };

  const updateCartUI = () => {
    let bar = document.getElementById('cartBar');
    if (!bar) {
      bar = document.createElement('div');
      bar.id = 'cartBar';
      bar.style.cssText = `
        position:fixed;bottom:1.5rem;right:1.5rem;z-index:900;
        background:var(--brown-deep);color:white;
        padding:0.85rem 1.25rem;border-radius:4px;
        box-shadow:0 8px 24px rgba(0,0,0,0.3);
        cursor:pointer;font-family:'Lato',sans-serif;
        font-size:0.82rem;font-weight:700;letter-spacing:0.05em;
        display:flex;align-items:center;gap:0.75rem;
        transition:transform 0.2s,box-shadow 0.2s;
      `;
      bar.addEventListener('mouseenter', () => bar.style.transform = 'translateY(-2px)');
      bar.addEventListener('mouseleave', () => bar.style.transform = '');
      bar.addEventListener('click', openCartModal);
      document.body.appendChild(bar);
    }
    const total = cart.reduce((s, i) => s + i.price * i.quantity, 0);
    const qty = cart.reduce((s, i) => s + i.quantity, 0);
    if (qty === 0) { bar.style.display = 'none'; return; }
    bar.style.display = 'flex';
    bar.innerHTML = `🛒 ${qty} item${qty > 1 ? 's' : ''} · <strong>₹ ${total}</strong> &nbsp;→ Checkout`;
  };

  const showCartToast = (name) => {
    const t = document.createElement('div');
    t.style.cssText = `
      position:fixed;bottom:5rem;right:1.5rem;z-index:901;
      background:var(--caramel);color:white;
      padding:0.6rem 1rem;border-radius:4px;
      font-family:'Lato',sans-serif;font-size:0.82rem;font-weight:700;
      opacity:0;transform:translateY(8px);
      transition:opacity 0.3s,transform 0.3s;
    `;
    t.textContent = `✓ ${name} added`;
    document.body.appendChild(t);
    requestAnimationFrame(() => { t.style.opacity = '1'; t.style.transform = 'translateY(0)'; });
    setTimeout(() => {
      t.style.opacity = '0';
      setTimeout(() => t.remove(), 400);
    }, 1800);
  };

  // ── CART MODAL ───────────────────────────────────────
  const openCartModal = () => {
    let modal = document.getElementById('cartModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'cartModal';
      modal.style.cssText = `
        position:fixed;inset:0;z-index:1100;background:rgba(0,0,0,0.6);
        display:flex;align-items:flex-end;justify-content:center;
      `;
      modal.addEventListener('click', e => { if (e.target === modal) closeCartModal(); });
      document.body.appendChild(modal);
    }
    modal.style.display = 'flex';
    modal.innerHTML = `
      <div id="cartSheet" style="
        background:#faf6f0;width:100%;max-width:520px;margin:0 auto;
        border-radius:12px 12px 0 0;padding:2rem;max-height:85vh;overflow-y:auto;
        font-family:'Lato',sans-serif;
      ">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1.5rem">
          <h2 style="font-family:'Playfair Display',serif;font-size:1.3rem;color:var(--brown-deep)">Your Order</h2>
          <button onclick="window._closeCart()" style="background:none;border:none;font-size:1.5rem;cursor:pointer;color:var(--text-light)">✕</button>
        </div>
        ${cart.length === 0 ? '<p style="text-align:center;color:var(--text-light);padding:2rem 0">Your cart is empty</p>' : `
          ${cart.map((item, idx) => `
            <div style="display:flex;justify-content:space-between;align-items:center;padding:0.75rem 0;border-bottom:1px solid #ede8e0">
              <div>
                <strong style="font-size:0.9rem;color:var(--brown-deep)">${item.name}</strong>
                <div style="font-size:0.8rem;color:var(--text-light);margin-top:2px">₹${item.price} × ${item.quantity}</div>
              </div>
              <div style="display:flex;align-items:center;gap:0.5rem">
                <button onclick="window._cartQty(${idx},-1)" style="width:28px;height:28px;border-radius:50%;border:1px solid var(--caramel-light);background:none;cursor:pointer;font-size:0.9rem;color:var(--caramel)">−</button>
                <span style="font-weight:700;min-width:20px;text-align:center">${item.quantity}</span>
                <button onclick="window._cartQty(${idx},1)" style="width:28px;height:28px;border-radius:50%;border:1px solid var(--caramel-light);background:none;cursor:pointer;font-size:0.9rem;color:var(--caramel)">+</button>
              </div>
            </div>
          `).join('')}
          <div style="margin-top:1rem;padding:1rem;background:white;border-radius:6px">
            <div style="display:flex;justify-content:space-between;font-size:0.85rem;color:var(--text-light);margin-bottom:0.4rem">
              <span>Subtotal</span><span>₹${cart.reduce((s,i)=>s+i.price*i.quantity,0)}</span>
            </div>
            <div style="display:flex;justify-content:space-between;font-size:0.85rem;color:var(--text-light);margin-bottom:0.75rem">
              <span>GST (5%)</span><span>₹${Math.round(cart.reduce((s,i)=>s+i.price*i.quantity,0)*0.05)}</span>
            </div>
            <div style="display:flex;justify-content:space-between;font-weight:700;font-size:1rem;color:var(--brown-deep)">
              <span>Total</span><span>₹${Math.round(cart.reduce((s,i)=>s+i.price*i.quantity,0)*1.05)}</span>
            </div>
          </div>
          <div style="margin-top:1rem">
            <input id="cartName" placeholder="Your Name *" style="width:100%;padding:0.65rem 0.85rem;border:1.5px solid #ede8e0;border-radius:4px;font-size:0.88rem;margin-bottom:0.5rem;outline:none"/>
            <input id="cartPhone" placeholder="Phone Number *" style="width:100%;padding:0.65rem 0.85rem;border:1.5px solid #ede8e0;border-radius:4px;font-size:0.88rem;margin-bottom:0.5rem;outline:none"/>
            <select id="cartType" style="width:100%;padding:0.65rem 0.85rem;border:1.5px solid #ede8e0;border-radius:4px;font-size:0.88rem;margin-bottom:1rem;outline:none">
              <option value="dine-in">Dine In</option>
              <option value="takeaway">Takeaway</option>
            </select>
            <button onclick="window._placeOrder()" style="
              width:100%;padding:0.9rem;background:var(--caramel);color:white;
              border:none;border-radius:4px;font-weight:700;font-size:0.88rem;
              letter-spacing:0.08em;cursor:pointer;transition:background 0.2s;
            ">Place Order & Pay →</button>
          </div>
        `}
      </div>`;
  };

  const closeCartModal = () => {
    const m = document.getElementById('cartModal');
    if (m) m.style.display = 'none';
  };

  window._closeCart = closeCartModal;

  window._cartQty = (idx, delta) => {
    cart[idx].quantity += delta;
    if (cart[idx].quantity <= 0) cart.splice(idx, 1);
    updateCartUI();
    openCartModal();
  };

  // ── PLACE ORDER + RAZORPAY ────────────────────────────
  window._placeOrder = async () => {
    const name = document.getElementById('cartName')?.value.trim();
    const phone = document.getElementById('cartPhone')?.value.trim();
    const orderType = document.getElementById('cartType')?.value || 'dine-in';
    if (!name || !phone) { alert('Please enter your name and phone number'); return; }

    const btn = document.querySelector('#cartSheet button:last-child');
    btn.textContent = 'Processing…'; btn.disabled = true;

    try {
      // 1. Create order in DB
      const orderData = await fetchAPI('/orders', {
        method: 'POST',
        body: { customerName: name, customerPhone: phone, items: cart, orderType },
      });
      const orderId = orderData.order._id;

      // 2. Create Razorpay payment order
      const payData = await fetchAPI('/payments/create-order', {
        method: 'POST', body: { orderId },
      });

      // DEV MODE — skip Razorpay UI
      if (payData.devMode) {
        await fetchAPI('/payments/verify', {
          method: 'POST',
          body: { razorpay_order_id: payData.razorpayOrderId, orderId, razorpay_payment_id: 'dev' },
        });
        cart = []; updateCartUI(); closeCartModal();
        showSuccessMessage(orderId);
        return;
      }

      // 3. Open Razorpay checkout
      const options = {
        key: payData.key,
        amount: payData.amount,
        currency: payData.currency,
        name: 'The Hole in the Wall Café',
        description: 'Breakfast Order',
        order_id: payData.razorpayOrderId,
        handler: async (response) => {
          await fetchAPI('/payments/verify', {
            method: 'POST',
            body: { ...response, orderId },
          });
          cart = []; updateCartUI(); closeCartModal();
          showSuccessMessage(orderId);
        },
        prefill: { name, contact: phone },
        theme: { color: '#c8885a' },
      };
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      alert('Order failed: ' + err.message);
      btn.textContent = 'Place Order & Pay →'; btn.disabled = false;
    }
  };

  const showSuccessMessage = (orderId) => {
    const shortId = orderId.toString().slice(-6).toUpperCase();
    const div = document.createElement('div');
    div.style.cssText = `
      position:fixed;inset:0;z-index:1200;background:rgba(59,35,20,0.85);
      display:flex;align-items:center;justify-content:center;font-family:'Lato',sans-serif;
    `;
    div.innerHTML = `
      <div style="background:#faf6f0;border-radius:8px;padding:2.5rem;text-align:center;max-width:360px;width:90%">
        <div style="font-size:3rem;margin-bottom:1rem">✅</div>
        <h2 style="font-family:'Playfair Display',serif;color:var(--brown-deep);margin-bottom:0.5rem">Order Confirmed!</h2>
        <p style="color:var(--text-light);font-size:0.9rem;margin-bottom:0.5rem">Order #${shortId}</p>
        <p style="color:var(--text-mid);font-size:0.85rem;line-height:1.6">We've received your order and sent a confirmation to your phone. Your food will be ready shortly!</p>
        <button onclick="this.closest('div[style]').remove()" style="margin-top:1.5rem;padding:0.75rem 2rem;background:var(--caramel);color:white;border:none;border-radius:4px;font-weight:700;cursor:pointer">
          Done
        </button>
      </div>`;
    document.body.appendChild(div);
  };

  // ── RESERVATION: Connect form to API ─────────────────
  const connectReservationForm = () => {
    const btn = document.getElementById('resSubmit');
    if (!btn) return;
    btn.addEventListener('click', async () => {
      const name = document.getElementById('resName')?.value.trim();
      const phone = document.getElementById('resPhone')?.value.trim();
      const date = document.getElementById('resDate')?.value;
      const time = document.getElementById('resTime')?.value;
      const guests = document.getElementById('resGuests')?.value;
      const specialNote = document.getElementById('resNote')?.value.trim();
      if (!name || !phone || !date || !time || !guests) return; // existing validation handles this

      btn.textContent = 'Sending…'; btn.disabled = true;
      try {
        await fetchAPI('/reservations', {
          method: 'POST',
          body: { name, phone, date, time, guests: Number(guests), specialNote },
        });
        document.getElementById('resFormContent').style.display = 'none';
        document.getElementById('formSuccess').style.display = 'block';
      } catch (err) {
        alert('Reservation failed: ' + err.message);
        btn.textContent = 'Confirm Reservation →'; btn.disabled = false;
      }
    }, { once: true }); // replace existing listener
  };

  // ── INIT ─────────────────────────────────────────────
  const init = () => {
    loadMenuFromAPI();
    connectReservationForm();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
