// State
let state = {
    currentScreen: 'home', // home, checkout, ticket, scanner
    sourceStop: null,
    destStop: null,
    activeTicket: null,
};

// Data
const BRTS_STOPS = [
    "Dharwad BRTS Terminal", "Jubilee Circle", "Court Circle", "NTTF", "Hosa Yellapur Cross",
    "Toll Naka", "Vidyagiri", "Gandhinagar", "Lakmanahalli", "Sattur",
    "SDM Medical College", "Navluru Railway Station", "KMF", "Rayapur", "ISKCON Temple",
    "RTO", "Navanagara", "APMC 3rd Gate", "Shantinikethan", "Bairidevarakoppa",
    "Unakal Lake", "Unakal Village", "Unakal Cross", "BVB", "Vidyanagar",
    "KIMS", "Hosur Regional Terminal", "Hosur Cross", "Hubballi Central Bus Terminal",
    "HDMC", "DR. B R Ambedkar Circle", "CBT Hubballi"
];

function calculateFare(source, dest) {
    if (!source || !dest || source === dest) return 0;
    let sIdx = BRTS_STOPS.indexOf(source);
    let dIdx = BRTS_STOPS.indexOf(dest);
    let distance = Math.abs(sIdx - dIdx);

    // Base fare Rs 10 + Rs 3 per stop
    return 10 + (distance * 3);
}

// Render Engine
function render() {
    const app = document.getElementById('app-container');

    // Create screens HTML
    let content = `
        ${renderHomeScreen()}
        ${renderCheckoutScreen()}
        ${renderTicketScreen()}
        ${renderScannerScreen()}
        ${renderNavigation()}
    `;

    app.innerHTML = content;

    // Re-initialize Lucide icons
    if (window.lucide) {
        window.lucide.createIcons();
    }

    attachEventListeners();

    // If ticket screen, generate QR
    if (state.currentScreen === 'ticket' && state.activeTicket) {
        generateQR();
    }
}

// Screens
function renderHomeScreen() {
    return `
        <div class="screen ${state.currentScreen === 'home' ? 'active' : ''}" id="screen-home">
            <div class="header">
                <i data-lucide="bus" class="text-primary"></i>
                <div class="header-title">Chigari Ticketing</div>
            </div>
            <div class="content">
                <div class="card">
                    <h2 style="margin-bottom: 1.5rem; font-size: 1.25rem;">Buy Ticket</h2>
                    
                    <div class="input-group" style="margin-bottom: 1rem;">
                        <label>Start Stop</label>
                        <div class="select-wrapper">
                            <select id="source-stop">
                                <option value="" disabled ${!state.sourceStop ? 'selected' : ''}>Select Source Stop</option>
                                ${BRTS_STOPS.map(s => `<option value="${s}" ${state.sourceStop === s ? 'selected' : ''}>${s}</option>`).join('')}
                            </select>
                            <i data-lucide="map-pin" class="select-icon"></i>
                        </div>
                    </div>
                    
                    <div style="display: flex; justify-content: center; margin: 0.5rem 0; color: var(--primary);">
                        <i data-lucide="arrow-down-up" style="cursor:pointer;" id="swap-stops"></i>
                    </div>

                    <div class="input-group" style="margin-bottom: 2rem;">
                        <label>End Stop</label>
                        <div class="select-wrapper">
                            <select id="dest-stop">
                                <option value="" disabled ${!state.destStop ? 'selected' : ''}>Select Destination Stop</option>
                                ${BRTS_STOPS.map(s => `<option value="${s}" ${state.destStop === s ? 'selected' : ''}>${s}</option>`).join('')}
                            </select>
                            <i data-lucide="map-pin" class="select-icon"></i>
                        </div>
                    </div>

                    <button class="btn btn-primary" id="btn-proceed" ${(!state.sourceStop || !state.destStop || state.sourceStop === state.destStop) ? 'disabled style="opacity:0.5"' : ''}>
                        Proceed to Pay
                    </button>
                    ${state.sourceStop && state.destStop && state.sourceStop === state.destStop ? '<p style="color:var(--danger); font-size:0.875rem; margin-top:0.5rem; text-align:center;">Source and destination cannot be the same.</p>' : ''}
                </div>
                
                <div class="card" style="background: var(--primary-light); display: flex; align-items: center; gap: 1rem; cursor: pointer;" id="scan-code-entry">
                    <div style="background: white; padding: 0.75rem; border-radius: 50%; display: flex;">
                        <i data-lucide="qr-code" style="color: var(--primary)"></i>
                    </div>
                    <div>
                        <div style="font-weight: 600;">Scan Station QR</div>
                        <div style="font-size: 0.875rem; color: var(--text-muted);">Quickly select your starting stop</div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function renderCheckoutScreen() {
    let fare = calculateFare(state.sourceStop, state.destStop);
    return `
        <div class="screen ${state.currentScreen === 'checkout' ? 'active' : ''}" id="screen-checkout">
             <div class="header">
                <i data-lucide="arrow-left" id="back-to-home" style="cursor:pointer;"></i>
                <div class="header-title">Payment</div>
            </div>
            <div class="content">
                <div class="card" style="text-align: center;">
                    <p style="color: var(--text-muted); font-size: 0.875rem;">Total Fare</p>
                    <div class="fare-display">
                        <span class="fare-amount">${fare}</span>
                    </div>
                    
                    <div style="background: var(--bg-light); border-radius: var(--radius-md); padding: 1rem; display: flex; align-items: center; justify-content: space-between; margin-top: 1rem;">
                        <div style="text-align: left;">
                            <div style="font-weight: 600;">${state.sourceStop || '-'}</div>
                            <div style="font-size: 0.75rem; color: var(--text-muted);">Source</div>
                        </div>
                        <i data-lucide="arrow-right" style="color: var(--text-muted); width: 16px;"></i>
                         <div style="text-align: right;">
                            <div style="font-weight: 600;">${state.destStop || '-'}</div>
                            <div style="font-size: 0.75rem; color: var(--text-muted);">Destination</div>
                        </div>
                    </div>
                </div>
                
                <h3 style="margin-top: 1rem; font-size: 1rem;">Pay via UPI</h3>
                <div class="payment-options">
                    <div class="payment-btn" onclick="executePayment('Google Pay')">
                        <div style="background:#fff; border-radius:50%; padding:4px;">
                            <img src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" width="24" height="24" alt="GPay">
                        </div>
                        <span style="font-size: 0.75rem; font-weight: 600;">GPay</span>
                    </div>
                    <div class="payment-btn" onclick="executePayment('PhonePe')">
                         <div style="background:#5f259f; border-radius:50%; padding:4px; width:32px; height:32px; display:flex; align-items:center; justify-content:center; color:white; font-weight:bold; font-size:12px;">
                            Pe
                        </div>
                        <span style="font-size: 0.75rem; font-weight: 600;">PhonePe</span>
                    </div>
                    <div class="payment-btn" onclick="executePayment('Paytm')">
                         <div style="background:#00b9f5; border-radius:50%; padding:4px; width:32px; height:32px; display:flex; align-items:center; justify-content:center; color:white; font-weight:bold; font-size:12px;">
                            P
                        </div>
                        <span style="font-size: 0.75rem; font-weight: 600;">Paytm</span>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function renderTicketScreen() {
    if (!state.activeTicket) {
        return `
            <div class="screen ${state.currentScreen === 'ticket' ? 'active' : ''}" id="screen-ticket">
                <div class="header">
                    <div class="header-title">My Ticket</div>
                </div>
                <div class="content" style="align-items:center; justify-content:center;">
                    <i data-lucide="ticket" style="width: 48px; height: 48px; color: var(--text-muted); margin-bottom:1rem;"></i>
                    <p style="color: var(--text-muted);">No active ticket.</p>
                    <button class="btn btn-primary" style="margin-top:1rem; width:auto;" onclick="navigate('home')">Buy Ticket</button>
                </div>
            </div>
         `;
    }

    const t = state.activeTicket;
    const isExpired = new Date() > new Date(t.expiresAt);

    return `
        <div class="screen ${state.currentScreen === 'ticket' ? 'active' : ''}" id="screen-ticket">
            <div class="header">
                <div class="header-title">My Ticket</div>
            </div>
            <div class="content">
                <div class="ticket-container">
                    <div class="ticket-inner">
                        <div class="status-badge ${isExpired ? 'status-expired' : 'status-active'}">
                            <i data-lucide="${isExpired ? 'x-circle' : 'check-circle'}" style="width:16px;"></i>
                            ${isExpired ? 'Expired' : 'Active Ticket'}
                        </div>
                        
                        <div id="qr-code-el" class="qr-placeholder">
                             <!-- QR code generated here -->
                        </div>
                        <p style="font-size:0.75rem; color: var(--text-muted); font-family: monospace;">${t.id}</p>
                        
                        <div style="width: 100%; border-top: 1px dashed var(--border-color); margin: 1.5rem 0; position:relative;">
                            <div style="position:absolute; width: 20px; height: 20px; background:var(--bg-light); border-radius:50%; left:-25px; top:-10px;"></div>
                            <div style="position:absolute; width: 20px; height: 20px; background:var(--bg-light); border-radius:50%; right:-25px; top:-10px;"></div>
                        </div>

                        <div style="width:100%; display:flex; justify-content:space-between; margin-bottom:1rem;">
                            <div>
                                <div style="font-size:0.75rem; color:var(--text-muted);">From</div>
                                <div style="font-weight:600;">${t.source}</div>
                            </div>
                            <div style="text-align:right;">
                                <div style="font-size:0.75rem; color:var(--text-muted);">To</div>
                                <div style="font-weight:600;">${t.dest}</div>
                            </div>
                        </div>
                        
                        <div style="width:100%; display:grid; grid-template-columns: 1fr 1fr; gap: 1rem; background: var(--bg-light); padding:1rem; border-radius: var(--radius-md);">
                             <div>
                                <div style="font-size:0.75rem; color:var(--text-muted);">Issued</div>
                                <div style="font-weight:600; font-size:0.875rem;">${new Date(t.issuedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                            </div>
                            <div>
                                <div style="font-size:0.75rem; color:var(--text-muted);">Valid Until</div>
                                <div style="font-weight:600; font-size:0.875rem; color: ${isExpired ? 'var(--danger)' : 'var(--text-main)'}">${new Date(t.expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                            </div>
                             <div>
                                <div style="font-size:0.75rem; color:var(--text-muted);">Fare</div>
                                <div style="font-weight:600; font-size:0.875rem;">₹${t.fare}</div>
                            </div>
                            <div>
                                <div style="font-size:0.75rem; color:var(--text-muted);">Passengers</div>
                                <div style="font-weight:600; font-size:0.875rem;">1 Adult</div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    `;
}

function renderScannerScreen() {
    return `
        <div class="screen ${state.currentScreen === 'scanner' ? 'active' : ''}" id="screen-scanner">
            <div class="header">
                <i data-lucide="scan-line" class="text-primary"></i>
                <div class="header-title" style="margin-left: 0.5rem">Conductor Device</div>
            </div>
            <div class="content" style="align-items: center; justify-content: center; background: #000;">
                
                <div style="position:relative; width: 250px; height: 250px; border: 2px solid rgba(255,255,255,0.2); border-radius: var(--radius-lg); overflow: hidden;">
                    <div style="position: absolute; top:0; left:0; width: 100%; height: 2px; background: var(--success); box-shadow: 0 0 10px var(--success); animation: scanLine 2s infinite linear;"></div>
                    <div style="position:absolute; inset:0; display:flex; align-items:center; justify-content:center; color:rgba(255,255,255,0.5);">Camera Input Fake</div>
                </div>
                
                <p style="color: white; margin-top: 1.5rem; text-align: center;">Align QR code within the frame</p>

                <div style="margin-top: 2rem; display: flex; gap: 1rem; flex-wrap:wrap; justify-content:center;">
                    <button class="btn btn-success" onclick="simulateScan(true)" style="width:auto;">Simulate Valid Scan</button>
                    <button class="btn btn-outline" style="border-color:var(--danger); color:var(--danger); width:auto;" onclick="simulateScan(false)">Simulate Expired</button>
                </div>
            </div>
            
            <style>
                @keyframes scanLine {
                    0% { top: 0; }
                    50% { top: 100%; }
                    100% { top: 0; }
                }
            </style>
        </div>
    `;
}

function renderNavigation() {
    if (state.currentScreen === 'checkout' || state.currentScreen === 'scanner') return '';
    return `
        <div class="bottom-nav">
            <button class="nav-item ${state.currentScreen === 'home' ? 'active' : ''}" onclick="navigate('home')">
                <i data-lucide="home"></i>
                <span>Home</span>
            </button>
            <button class="nav-item ${state.currentScreen === 'ticket' ? 'active' : ''}" onclick="navigate('ticket')">
                <i data-lucide="ticket"></i>
                <span>Ticket</span>
            </button>
             <button class="nav-item ${state.currentScreen === 'history' ? 'active' : ''}" onclick="showToast('History coming soon')">
                <i data-lucide="clock"></i>
                <span>History</span>
            </button>
            <div style="width: 1px; background: var(--border-color); height: 30px; align-self:center;"></div>
            <button class="nav-item" onclick="navigate('scanner')">
                <i data-lucide="smartphone"></i>
                <span>Conductor App</span>
            </button>
        </div>
    `;
}

// Logic
function attachEventListeners() {
    const srcEl = document.getElementById('source-stop');
    const destEl = document.getElementById('dest-stop');

    if (srcEl) srcEl.addEventListener('change', (e) => { state.sourceStop = e.target.value; render(); });
    if (destEl) destEl.addEventListener('change', (e) => { state.destStop = e.target.value; render(); });

    const swapEl = document.getElementById('swap-stops');
    if (swapEl) {
        swapEl.addEventListener('click', () => {
            let temp = state.sourceStop;
            state.sourceStop = state.destStop;
            state.destStop = temp;
            render();
        });
    }

    const btnProceed = document.getElementById('btn-proceed');
    if (btnProceed) {
        btnProceed.addEventListener('click', () => {
            if (state.sourceStop && state.destStop && state.sourceStop !== state.destStop) {
                navigate('checkout');
            }
        });
    }

    const backBtn = document.getElementById('back-to-home');
    if (backBtn) {
        backBtn.addEventListener('click', () => navigate('home'));
    }

    const scanCodeEntry = document.getElementById('scan-code-entry');
    if (scanCodeEntry) {
        scanCodeEntry.addEventListener('click', () => {
            state.sourceStop = "Dharwad BRTS Terminal"; // Simulate scanning a station QR code at Dharwad
            showToast("📍 Location detected: Dharwad BRTS Terminal via QR");
            render();
        });
    }
}

function navigate(screen) {
    state.currentScreen = screen;
    render();
}

function showToast(msg) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerText = msg;
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(-10px)';
        toast.style.transition = 'all 0.3s';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

window.executePayment = function (app) {
    if (app === 'PhonePe' || app === 'Paytm' || app === 'Google Pay') {
        const fare = calculateFare(state.sourceStop, state.destStop);
        const upiUrl = `upi://pay?pa=6360607023@ybl&pn=SAMEER%20GUDUSAB%20NADAF&am=${fare}&cu=INR&mode=02`;

        // Check if user is on a mobile device
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

        if (isMobile) {
            // Direct deep link to UPI app
            showToast(`Opening ${app}...`);
            window.location.href = upiUrl;

            // Allow them to confirm payment after returning to the app
            setTimeout(() => {
                document.body.insertAdjacentHTML('beforeend', `
                    <div id="payment-confirm-modal" style="position:fixed; inset:0; background:rgba(0,0,0,0.8); z-index:100; display:flex; align-items:center; justify-content:center; animation:fadeIn 0.2s; padding:1rem;">
                        <div style="background:white; padding:1.5rem; border-radius:var(--radius-lg); width:100%; max-width:320px; text-align:center;">
                            <h2 style="margin-bottom:0.5rem; color:var(--text-main); font-size:1.25rem;">Payment Started</h2>
                            <p style="color:var(--text-muted); font-size:0.875rem; margin-bottom:1rem;">Please complete the payment in your UPI app, then click below.</p>
                            <button class="btn btn-success" style="width:100%; margin-bottom: 0.5rem;" onclick="completePayment('payment-confirm-modal')">I have paid</button>
                            <button class="btn btn-outline" style="width:100%;" onclick="document.getElementById('payment-confirm-modal').remove()">Cancel</button>
                        </div>
                    </div>
                `);
            }, 1000);
        } else {
            // Desktop fallback: Show QR Code
            document.body.insertAdjacentHTML('beforeend', `
                <div id="payment-modal" style="position:fixed; inset:0; background:rgba(0,0,0,0.8); z-index:100; display:flex; align-items:center; justify-content:center; animation:fadeIn 0.2s; padding:1rem;">
                    <div style="background:white; padding:1.5rem; border-radius:var(--radius-lg); width:100%; max-width:320px; text-align:center;">
                        <div style="margin-bottom: 1rem; display: flex; align-items: center; justify-content: center; gap: 0.5rem;">
                            <img src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" width="20" height="20" style="${app !== 'Google Pay' ? 'opacity:0.3; filter:grayscale(1);' : ''}">
                            <div style="background:#5f259f; border-radius:50%; width:20px; height:20px; display:flex; align-items:center; justify-content:center; color:white; font-weight:bold; font-size:10px; ${app !== 'PhonePe' ? 'opacity:0.3; filter:grayscale(1);' : ''}">Pe</div>
                            <div style="background:#00b9f5; border-radius:50%; width:20px; height:20px; display:flex; align-items:center; justify-content:center; color:white; font-weight:bold; font-size:10px; ${app !== 'Paytm' ? 'opacity:0.3; filter:grayscale(1);' : ''}">P</div>
                        </div>
                        
                        <h2 style="margin-bottom:0.5rem; color:var(--text-main); font-size:1.25rem;">Pay ₹${fare} for Ticket</h2>
                        <p style="color:var(--text-muted); font-size:0.875rem; margin-bottom:1rem;">Scan with ${app} to pay EXACTLY ₹${fare}</p>
                        
                        <div id="payment-qr" style="display:flex; justify-content:center; padding: 1rem; border: 2px dashed var(--border-color); border-radius: var(--radius-md); margin-bottom: 1rem;">
                            <!-- QR Code Generated Here -->
                        </div>
                        
                        <button class="btn btn-success" style="width:100%; margin-bottom: 0.5rem;" onclick="completePayment('payment-modal')">I have paid</button>
                        <button class="btn btn-outline" style="width:100%;" onclick="document.getElementById('payment-modal').remove()">Cancel</button>
                    </div>
                </div>
            `);

            setTimeout(() => {
                new QRCode(document.getElementById("payment-qr"), {
                    text: upiUrl,
                    width: 200,
                    height: 200,
                    colorDark: "#0f172a",
                    colorLight: "#ffffff",
                    correctLevel: QRCode.CorrectLevel.M
                });
            }, 100);
        }
    } else {
        showToast(`Opening ${app}...`);
        setTimeout(() => {
            completePayment();
        }, 1500);
    }
};

window.completePayment = function (modalId) {
    if (modalId) {
        const modal = document.getElementById(modalId);
        if (modal) modal.remove();
    }

    // Issue Ticket
    const now = new Date();
    const expires = new Date();
    expires.setHours(expires.getHours() + 3); // 3 Hour validity

    state.activeTicket = {
        id: 'TKT-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
        source: state.sourceStop,
        dest: state.destStop,
        fare: calculateFare(state.sourceStop, state.destStop),
        issuedAt: now.toISOString(),
        expiresAt: expires.toISOString(),
        status: 'ACTIVE'
    };

    showToast("Payment Successful! Ticket Generated.");
    state.sourceStop = null;
    state.destStop = null;
    navigate('ticket');
};

function generateQR() {
    const qrContainer = document.getElementById('qr-code-el');
    if (!qrContainer || !state.activeTicket) return;

    qrContainer.innerHTML = '';

    // QR data encodes basic ticket info for conductor app
    const qrData = JSON.stringify({
        id: state.activeTicket.id,
        exp: state.activeTicket.expiresAt,
        s: state.activeTicket.source,
        d: state.activeTicket.dest
    });

    try {
        new QRCode(qrContainer, {
            text: qrData,
            width: 160,
            height: 160,
            colorDark: "#000000",
            colorLight: "#ffffff",
            correctLevel: QRCode.CorrectLevel.H
        });
    } catch (e) {
        console.error("QR Code Error:", e);
        qrContainer.innerText = "[QR CODE]";
    }
}

// Conductor Scanner Simulation
window.simulateScan = function (isValid) {
    document.body.insertAdjacentHTML('beforeend', `
        <div id="scan-modal" style="position:fixed; inset:0; background:rgba(0,0,0,0.8); z-index:100; display:flex; align-items:center; justify-content:center; animation:fadeIn 0.2s;">
            <div style="background:white; padding:2rem; border-radius:var(--radius-lg); width:90%; max-width:320px; text-align:center;">
                <div style="margin-bottom:1rem; display:inline-flex; border-radius:50%; padding:1rem; background:${isValid ? 'var(--success)' : 'var(--danger)'}; color:white;">
                    <i data-lucide="${isValid ? 'check' : 'x'}" style="width:32px; height:32px;"></i>
                </div>
                <h2 style="margin-bottom:0.5rem; color:${isValid ? 'var(--success)' : 'var(--danger)'}; font-size:1.5rem;">
                    ${isValid ? 'Ticket Valid' : 'Ticket Expired'}
                </h2>
                ${isValid ? '<p style="color:var(--text-muted); font-size:0.875rem;">1 Adult • Dharwad to CBT</p>' : '<p style="color:var(--text-muted); font-size:0.875rem;">This ticket has exceeded its 3-hour limit.</p>'}
                <button class="btn btn-outline" style="margin-top:2rem;" onclick="document.getElementById('scan-modal').remove()">Close</button>
            </div>
        </div>
    `);
    if (window.lucide) window.lucide.createIcons();
};

// Start App
render();
