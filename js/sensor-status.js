import { initAuthUI } from './auth-ui.js';
import { auth, db, rtdb, adminAuth, adminDb, adminRtdb, ref, onValue, collection, query, where, onSnapshot } from '../firebase-config.js';

lucide.createIcons();

const sensorGrid = document.getElementById('sensor-grid');
const activeSensors = new Map(); // Store metadata for active listeners

// Auto-detect Role based on URL
const path = window.location.pathname;
let currentRole = 'user';
if (path.includes('admin-sensor-status')) currentRole = 'admin';
if (path.includes('driver-sensor-status')) currentRole = 'driver';

// Target Firebase Instances
let targetAuth = auth;
let targetDb = db;
let targetRtdb = rtdb;

if (currentRole === 'admin') {
    targetAuth = adminAuth;
    targetDb = adminDb;
    targetRtdb = adminRtdb;
}

// Only init standard Auth UI for users
if (currentRole === 'user') {
    initAuthUI();
}
lucide.createIcons();

// Initialize
targetAuth.onAuthStateChanged((user) => {
    if (user) {
        console.log(`Initializing Sensor Status for role: ${currentRole}`);
        // Monitor shipments based on role
        fetchShipments(currentRole, user);

        // Start Heartbeat Loop
        setInterval(checkSensorHealth, 1000);
    } else {
        // Redirection handled by guards in Admin/Driver pages.
        // For User page:
        if (currentRole === 'user') window.location.href = 'login.html';
        if (currentRole === 'admin') window.location.href = 'adminlogin.html'; // Fallback
    }
});

function fetchShipments(role, user) {
    let q;

    if (role === 'admin') {
        // Admin: Active shipments (In Transit) - ALL
        q = query(
            collection(targetDb, "shipments"),
            where("status", "==", "In Transit")
        );
    } else if (role === 'driver') {
        // Driver: Active shipments assigned to this driver
        q = query(
            collection(targetDb, "shipments"),
            where("driver.email", "==", user.email),
            where("status", "==", "In Transit")
        );
    } else {
        // User: Active shipments provided by this user
        q = query(
            collection(targetDb, "shipments"),
            where("userId", "==", user.uid),
            where("status", "==", "In Transit")
        );
    }

    onSnapshot(q, (snapshot) => {
        if (snapshot.empty) {
            sensorGrid.innerHTML = `
                <div class="col-span-full py-12 flex flex-col items-center justify-center text-gray-400">
                    <div class="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                        <i data-lucide="activity" class="w-8 h-8 text-gray-400"></i>
                    </div>
                    <p class="text-lg font-medium text-gray-500">No active shipments to monitor</p>
                    <p class="text-sm">${role === 'admin' ? 'System is idle.' : 'Start a shipment to see sensor data.'}</p>
                </div>
            `;
            lucide.createIcons();
            return;
        }

        const currentIds = [];

        snapshot.forEach(doc => {
            const data = doc.data();
            data.id = doc.id;
            currentIds.push(data.id);

            let deviceId = data.deviceId || 'esp32_live';
            if (deviceId.toLowerCase() === 'root') deviceId = '/';

            if (!document.getElementById(`card-${data.id}`)) {
                createSensorCard(data, deviceId);
                setupRealtimeListener(data.id, deviceId);
            }
        });

        // Remove old cards
        document.querySelectorAll('[id^="card-"]').forEach(el => {
            const id = el.id.replace('card-', '');
            if (!currentIds.includes(id)) {
                el.remove();
            }
        });

        if (currentIds.length === 0) {
            sensorGrid.innerHTML = `...`;
        }

    }, (err) => {
        console.error("Error fetching shipments:", err);
        let msg = err.message;
        if (err.code === 'failed-precondition') {
            msg = "Missing database index. Please notify admin/developer.";
        }
        sensorGrid.innerHTML = `<p class="text-red-500 col-span-full text-center">Error: ${msg}</p>`;
    });
}

function createSensorCard(data, deviceId) {
    const loader = sensorGrid.querySelector('.animate-spin');
    if (loader && loader.parentElement.tagName === 'DIV' && sensorGrid.children.length <= 1) {
        sensorGrid.innerHTML = '';
    }

    const card = document.createElement('div');
    card.id = `card-${data.id}`;
    card.className = "bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 relative overflow-hidden group";

    card.innerHTML = `
        <div class="flex justify-between items-start mb-6">
            <div>
                <span class="text-xs font-mono text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-md">ID: ${data.trackingId || '...'}</span>
                <h3 class="font-bold text-lg text-gray-900 dark:text-white mt-2 capitalize">${data.goodsType}</h3>
                <p class="text-xs text-blue-500 mt-1">Device: ${deviceId === '/' ? 'Root' : deviceId}</p>
            </div>
            <div class="status-indicator w-3 h-3 rounded-full bg-gray-300"></div>
        </div>

        <div class="space-y-4">
            <!-- GPS Status -->
            <div class="p-4 bg-gray-50 dark:bg-gray-700/30 rounded-xl border border-gray-100 dark:border-gray-700 relative" id="gps-box-${data.id}">
                <div class="flex items-center justify-between mb-2">
                    <div class="flex items-center gap-2">
                        <i data-lucide="satellite" class="w-4 h-4 text-blue-500"></i>
                        <span class="text-sm font-semibold text-gray-700 dark:text-gray-200">GPS</span>
                    </div>
                    <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-200 text-gray-600" id="gps-status-${data.id}">WAITING</span>
                </div>
                <div class="grid grid-cols-2 gap-2 text-xs">
                     <div>
                        <p class="text-gray-500">Lat</p>
                        <p class="font-mono font-medium dark:text-gray-300" id="gps-lat-${data.id}">--</p>
                     </div>
                     <div>
                        <p class="text-gray-500">Lng</p>
                        <p class="font-mono font-medium dark:text-gray-300" id="gps-lng-${data.id}">--</p>
                     </div>
                </div>
                 <!-- Warning Overlay -->
                <div id="gps-warning-${data.id}" class="hidden absolute inset-0 bg-red-500/10 backdrop-blur-[1px] rounded-xl flex items-center justify-center border-2 border-red-500/50">
                    <div class="bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 shadow-sm">
                        <i data-lucide="alert-triangle" class="w-3 h-3"></i> NO SIGNAL
                    </div>
                </div>
            </div>

            <!-- DHT Sensor Status -->
            <div class="p-4 bg-gray-50 dark:bg-gray-700/30 rounded-xl border border-gray-100 dark:border-gray-700 relative" id="dht-box-${data.id}">
                 <div class="flex items-center justify-between mb-2">
                    <div class="flex items-center gap-2">
                        <i data-lucide="thermometer" class="w-4 h-4 text-orange-500"></i>
                        <span class="text-sm font-semibold text-gray-700 dark:text-gray-200">Environment</span>
                    </div>
                    <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-200 text-gray-600" id="dht-status-${data.id}">WAITING</span>
                </div>
                 <div class="grid grid-cols-2 gap-2 text-xs">
                     <div>
                        <p class="text-gray-500">Temp</p>
                        <p class="font-mono font-medium dark:text-gray-300"><span id="dht-temp-${data.id}">--</span> °C</p>
                     </div>
                     <div>
                        <p class="text-gray-500">Humidity</p>
                        <p class="font-mono font-medium dark:text-gray-300"><span id="dht-hum-${data.id}">--</span> %</p>
                     </div>
                </div>
                 <!-- Warning Overlay -->
                <div id="dht-warning-${data.id}" class="hidden absolute inset-0 bg-red-500/10 backdrop-blur-[1px] rounded-xl flex items-center justify-center border-2 border-red-500/50">
                    <div class="bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 shadow-sm">
                        <i data-lucide="wifi-off" class="w-3 h-3"></i> CONNECTION LOST
                    </div>
                </div>
            </div>
            
             <div class="text-[10px] text-gray-400 text-right font-mono" id="last-update-${data.id}">
                Last Update: Never
            </div>
        </div>
    `;

    sensorGrid.appendChild(card);
    lucide.createIcons();

    // Init metadata
    activeSensors.set(data.id, {
        gpsLast: 0,
        dhtLast: 0,
        deviceId: deviceId
    });
}

function setupRealtimeListener(cardId, deviceId) {
    const gpsRef = ref(targetRtdb, `${deviceId}/gps`);
    const sensorRef = ref(targetRtdb, `${deviceId}/sensor`);

    // GPS Listener
    onValue(gpsRef, (snapshot) => {
        if (snapshot.exists()) {
            const val = snapshot.val();
            updateGPSUI(cardId, val);
            recordHeartbeat(cardId, 'gps');
        }
    });

    // Sensor Listener
    onValue(sensorRef, (snapshot) => {
        if (snapshot.exists()) {
            const val = snapshot.val();
            updateSensorUI(cardId, val);
            recordHeartbeat(cardId, 'dht');
        }
    });
}

function updateGPSUI(cardId, data) {
    const latEl = document.getElementById(`gps-lat-${cardId}`);
    const lngEl = document.getElementById(`gps-lng-${cardId}`);
    const statusEl = document.getElementById(`gps-status-${cardId}`);
    const warningEl = document.getElementById(`gps-warning-${cardId}`);
    const boxEl = document.getElementById(`gps-box-${cardId}`);

    if (latEl) latEl.innerText = data.latitude ? data.latitude.toFixed(4) : '--';
    if (lngEl) lngEl.innerText = data.longitude ? data.longitude.toFixed(4) : '--';

    // Reset Box Style
    if (boxEl) {
        boxEl.className = "p-4 rounded-xl border relative transition-colors duration-300";
    }

    if (statusEl) {
        statusEl.innerText = data.status || 'UNKNOWN';
        // Color coding
        if (data.status === 'FIXED' || data.fix === true) {
            statusEl.className = "text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
            if (boxEl) boxEl.classList.add("bg-gray-50", "dark:bg-gray-700/30", "border-gray-100", "dark:border-gray-700");
        } else if (data.status === 'SEARCHING') {
            statusEl.className = "text-[10px] font-bold px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";
            if (boxEl) boxEl.classList.add("bg-yellow-50", "dark:bg-yellow-900/10", "border-yellow-100", "dark:border-yellow-700");
        } else {
            // Inactive / Unknown / Offline
            statusEl.className = "text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
            if (boxEl) boxEl.classList.add("bg-red-50", "dark:bg-red-900/20", "border-red-200", "dark:border-red-800");
        }
    }

    // Hide warning immediately on update
    if (warningEl) warningEl.classList.add('hidden');

    updateTimestamp(cardId);
}

function updateSensorUI(cardId, data) {
    const tempEl = document.getElementById(`dht-temp-${cardId}`);
    const humEl = document.getElementById(`dht-hum-${cardId}`);
    const statusEl = document.getElementById(`dht-status-${cardId}`);
    const warningEl = document.getElementById(`dht-warning-${cardId}`);
    const boxEl = document.getElementById(`dht-box-${cardId}`);

    if (tempEl) tempEl.innerText = data.temperature ? data.temperature.toFixed(1) : '--';
    if (humEl) humEl.innerText = data.humidity ? data.humidity.toFixed(1) : '--';

    // Reset Box Style
    if (boxEl) {
        boxEl.className = "p-4 rounded-xl border relative transition-colors duration-300";
    }

    if (statusEl) {
        statusEl.innerText = data.status || 'UNKNOWN';
        if (data.status === 'ACTIVE') {
            statusEl.className = "text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
            if (boxEl) boxEl.classList.add("bg-gray-50", "dark:bg-gray-700/30", "border-gray-100", "dark:border-gray-700");
        } else {
            // INACTIVE or others
            statusEl.className = "text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
            if (boxEl) boxEl.classList.add("bg-red-50", "dark:bg-red-900/20", "border-red-200", "dark:border-red-800");
        }
    }

    // Hide warning immediately on update
    if (warningEl) warningEl.classList.add('hidden');

    updateTimestamp(cardId);
}

function recordHeartbeat(cardId, type) {
    const meta = activeSensors.get(cardId);
    if (meta) {
        if (type === 'gps') meta.gpsLast = Date.now();
        if (type === 'dht') meta.dhtLast = Date.now();
        activeSensors.set(cardId, meta);
    }
}

function updateTimestamp(cardId) {
    const el = document.getElementById(`last-update-${cardId}`);
    if (el) {
        const now = new Date();
        el.innerText = `Last Update: ${now.toLocaleTimeString()}`;
    }
}


function checkSensorHealth() {
    const now = Date.now();
    const TIMEOUT_MS = 12000; // 12 Seconds

    activeSensors.forEach((meta, cardId) => {
        // Initialize alerted state if not present
        if (typeof meta.gpsAlerted === 'undefined') meta.gpsAlerted = false;
        if (typeof meta.dhtAlerted === 'undefined') meta.dhtAlerted = false;

        // Check GPS
        const gpsDiff = now - meta.gpsLast;
        const gpsWarning = document.getElementById(`gps-warning-${cardId}`);
        const gpsBox = document.getElementById(`gps-box-${cardId}`);

        if (gpsDiff > TIMEOUT_MS && meta.gpsLast > 0) {
            // STALE
            if (gpsWarning) gpsWarning.classList.remove('hidden');
            if (gpsBox) {
                gpsBox.className = "p-4 rounded-xl border relative transition-colors duration-300 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800";
            }

            // Trigger Alert if not already alerted
            if (!meta.gpsAlerted) {
                playAlertSound();
                if (window.showNotification) {
                    window.showNotification('error', 'Connection Lost', `GPS Signal lost for device: ${meta.deviceId}`);
                }
                meta.gpsAlerted = true;
                activeSensors.set(cardId, meta);
            }
        } else if (meta.gpsLast > 0 && gpsDiff <= TIMEOUT_MS) {
            // RECOVERED
            if (meta.gpsAlerted) {
                if (window.showNotification) {
                    window.showNotification('success', 'Connection Restored', `GPS Signal restored for device: ${meta.deviceId}`);
                }
                meta.gpsAlerted = false;
                activeSensors.set(cardId, meta);
            }
        }

        // Check DHT
        const dhtDiff = now - meta.dhtLast;
        const dhtWarning = document.getElementById(`dht-warning-${cardId}`);
        const dhtBox = document.getElementById(`dht-box-${cardId}`);

        if (dhtDiff > TIMEOUT_MS && meta.dhtLast > 0) {
            // STALE
            if (dhtWarning) dhtWarning.classList.remove('hidden');
            if (dhtBox) {
                dhtBox.className = "p-4 rounded-xl border relative transition-colors duration-300 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800";
            }

            // Trigger Alert if not already alerted
            if (!meta.dhtAlerted) {
                playAlertSound();
                if (window.showNotification) {
                    window.showNotification('error', 'Connection Lost', `Sensor data lost for device: ${meta.deviceId}`);
                }
                meta.dhtAlerted = true;
                activeSensors.set(cardId, meta);
            }
        } else if (meta.dhtLast > 0 && dhtDiff <= TIMEOUT_MS) {
            // RECOVERED
            if (meta.dhtAlerted) {
                if (window.showNotification) {
                    window.showNotification('success', 'Connection Restored', `Sensor data restored for device: ${meta.deviceId}`);
                }
                meta.dhtAlerted = false;
                activeSensors.set(cardId, meta);
            }
        }

        // Combined Status Indicator on Card
        const card = document.getElementById(`card-${cardId}`);
        const indicator = card?.querySelector('.status-indicator');

        if (indicator) {
            if (gpsDiff > TIMEOUT_MS || dhtDiff > TIMEOUT_MS) {
                // One or both failing
                indicator.className = 'status-indicator w-3 h-3 rounded-full bg-red-500 animate-pulse';
            } else if (meta.gpsLast > 0 && meta.dhtLast > 0) {
                // Both Active
                indicator.className = 'status-indicator w-3 h-3 rounded-full bg-green-500';
            }
        }
    });
}

// Simple Beep using AudioContext
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playAlertSound() {
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }

    const now = audioCtx.currentTime;

    // Play 3 beeps
    for (let i = 0; i < 3; i++) {
        const startTime = now + (i * 0.3); // 300ms interval
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(880, startTime); // A5
        oscillator.frequency.exponentialRampToValueAtTime(440, startTime + 0.2); // Drop pitch over 200ms

        gainNode.gain.setValueAtTime(0.1, startTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.2);

        oscillator.start(startTime);
        oscillator.stop(startTime + 0.2);
    }
}
