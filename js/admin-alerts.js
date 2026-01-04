import { adminAuth, adminDb, collection, query, where, onSnapshot, addDoc, getDocs, updateDoc, doc, Timestamp } from '../firebase-config.js';

// Auth Check (Simple Admin Guard)
adminAuth.onAuthStateChanged((user) => {
    if (!user) {
        window.location.href = 'adminlogin.html';
    } else {
        console.log("Admin Authenticated for Alerts");
        initAlertSystem();
    }
});

let unsubscribeShipments = null;

// Refresh Logic (loops restart listener)
window.refreshAlerts = () => {
    if (unsubscribeShipments) unsubscribeShipments();
    initAlertSystem();
};

function initAlertSystem() {
    const tableBody = document.getElementById('alerts-table-body');
    const vehicleFilter = document.getElementById('vehicle-filter');
    const typeFilter = document.getElementById('type-filter');
    const dateFilter = document.getElementById('date-filter');

    // Stats Elements (Logic kept for Chart updates)
    let countCritical = 0;
    let countWarning = 0;
    let countInfo = 0;

    tableBody.innerHTML = `
        <tr>
            <td colspan="5" class="px-6 py-12 text-center text-gray-500">
                <i data-lucide="loader-2" class="w-6 h-6 animate-spin mx-auto mb-2 text-purple-500"></i>
                Connecting to Live Sensor Data...
            </td>
        </tr>
    `;
    lucide.createIcons();

    try {
        // Real-time Listener on Active Shipments
        const q = query(
            collection(adminDb, "shipments"),
            where("status", "==", "In Transit")
        );

        unsubscribeShipments = onSnapshot(q, (snapshot) => {
            let alerts = [];
            const now = new Date();
            const vehicles = new Set();

            // Reset Counts
            countCritical = 0;
            countWarning = 0;
            countInfo = 0;

            snapshot.forEach(docSnap => {
                const data = docSnap.data();
                const lastUpdate = data.updatedAt ? new Date(data.updatedAt) : new Date(data.createdAt); // Fallback
                const diffMs = now - lastUpdate;
                const diffMins = Math.floor(diffMs / 60000);
                const diffHours = Math.floor(diffMins / 60);

                // Collect Vehicle IDs
                const vehicleId = data.trackingId || '#' + docSnap.id.slice(0, 8);
                vehicles.add(vehicleId);

                // 1. STALENESS ALERTS
                if (diffHours >= 24) {
                    alerts.push({
                        time: lastUpdate,
                        shipmentId: vehicleId,
                        shipmentDocId: docSnap.id,
                        goodsType: data.goodsType,
                        type: 'Connection Lost',
                        value: `${diffHours} hours offline`,
                        priority: 'Critical',
                        details: 'Device has stopped sending updates for over 24 hours.'
                    });
                    countCritical++;
                } else if (diffHours >= 1) {
                    alerts.push({
                        time: lastUpdate,
                        shipmentId: vehicleId,
                        shipmentDocId: docSnap.id,
                        goodsType: data.goodsType,
                        type: 'Signal Weak',
                        value: `${diffHours}h ${diffMins % 60}m offline`,
                        priority: 'Warning',
                        details: 'Intermittent signal or temporary disconnection.'
                    });
                    countWarning++;
                }

                // 2. DELAY ALERTS
                if (data.isDelayed) {
                    alerts.push({
                        time: new Date(),
                        shipmentId: vehicleId,
                        shipmentDocId: docSnap.id,
                        goodsType: data.goodsType,
                        type: 'Delay',
                        value: 'Schedule Risk',
                        priority: 'Warning',
                        details: 'Shipment is marked as delayed.'
                    });
                    countWarning++;
                }
            });

            // Update Vehicle Filter Options
            if (vehicleFilter && vehicleFilter.options.length <= 1) {
                vehicles.forEach(v => {
                    const opt = document.createElement('option');
                    opt.value = v;
                    opt.innerText = v;
                    vehicleFilter.appendChild(opt);
                });
            }

            // FILTERING LOGIC
            const selectedVehicle = vehicleFilter ? vehicleFilter.value : 'all';
            const selectedType = typeFilter ? typeFilter.value : 'all';
            const selectedDate = dateFilter ? dateFilter.value : '';

            const filteredAlerts = alerts.filter(alert => {
                if (selectedVehicle !== 'all' && alert.shipmentId !== selectedVehicle) return false;
                if (selectedType !== 'all') {
                    if (selectedType === 'Connection' && !alert.type.includes('Connection')) return false;
                    if (selectedType === 'Signal' && !alert.type.includes('Signal')) return false;
                    if (selectedType === 'Temp' && !alert.type.includes('Temp')) return false;
                    if (selectedType === 'Delay' && !alert.type.includes('Delay')) return false;
                }
                if (selectedDate) {
                    const alertDate = alert.time.toISOString().split('T')[0];
                    if (alertDate !== selectedDate) return false;
                }
                return true;
            });

            // RENDER TABLE
            renderTable(filteredAlerts, tableBody);

            // UPDATE CHARTS
            initCharts(countCritical, countWarning, countInfo);

            // SYNC WITH DB (Save Alerts)
            syncAlertsWithDb(alerts);

        }, (error) => {
            console.error("Error in shipment listener:", error);
            tableBody.innerHTML = `<tr class="col-span-full"><td class="text-center text-red-500 py-4">Live Data Error: ${error.message}</td></tr>`;
        });

    } catch (e) {
        console.error("Error initializing alert system:", e);
    }
}

function renderTable(alerts, tableBody) {
    if (alerts.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="5" class="px-6 py-12 text-center text-gray-500">
                    <div class="flex flex-col items-center">
                        <div class="p-3 bg-green-100 dark:bg-green-900/20 rounded-full mb-3">
                            <i data-lucide="check-circle-2" class="w-6 h-6 text-green-600 dark:text-green-400"></i>
                        </div>
                        <p class="font-medium text-gray-900 dark:text-white">All Systems Normal</p>
                        <p class="text-xs mt-1">No active alerts matching criteria.</p>
                    </div>
                </td>
            </tr>
        `;
    } else {
        alerts.sort((a, b) => {
            const pMap = { 'Critical': 3, 'Warning': 2, 'Info': 1 };
            if (pMap[b.priority] !== pMap[a.priority]) return pMap[b.priority] - pMap[a.priority];
            return b.time - a.time;
        });

        tableBody.innerHTML = alerts.map(alert => `
            <tr class="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group">
                <td class="px-6 py-4 text-gray-500 whitespace-nowrap">
                    ${alert.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    <div class="text-[10px] text-gray-400">${alert.time.toLocaleDateString()}</div>
                </td>
                <td class="px-6 py-4">
                    <div class="font-medium text-gray-900 dark:text-white">${alert.shipmentId}</div>
                    <div class="text-xs text-gray-500 capitalize">${alert.goodsType}</div>
                </td>
                <td class="px-6 py-4">
                    <div class="flex items-center gap-2 ${getPriorityColorText(alert.priority)}">
                        ${getPriorityIcon(alert.type)}
                        ${alert.type}
                    </div>
                </td>
                <td class="px-6 py-4">
                    <div class="text-sm text-gray-700 dark:text-gray-300 font-medium">${alert.value}</div>
                    <div class="text-xs text-gray-500 truncate max-w-[200px]">${alert.details}</div>
                </td>
                <td class="px-6 py-4">
                    <span class="px-2.5 py-1 ${getPriorityBadge(alert.priority)} rounded-full text-xs font-bold border border-opacity-20 animate-pulse">
                        ${alert.priority}
                    </span>
                </td>
            </tr>
        `).join('');
    }
    lucide.createIcons();
}

async function syncAlertsWithDb(currentAlerts) {
    const alertsRef = collection(adminDb, "system_alerts");

    for (const alert of currentAlerts) {
        // Only save Critical/Warning
        if (alert.priority === 'Info') continue;

        try {
            // Check if active alert exists for this shipment and type
            const q = query(
                alertsRef,
                where("shipmentId", "==", alert.shipmentId),
                where("type", "==", alert.type),
                where("status", "==", "Active")
            );
            const snaps = await getDocs(q);

            if (snaps.empty) {
                // SAVE NEW ALERT
                await addDoc(alertsRef, {
                    ...alert,
                    time: Timestamp.fromDate(alert.time), // Convert for Firestore
                    status: 'Active',
                    createdAt: Timestamp.now()
                });
                console.log("Saved new alert to DB:", alert.shipmentId);
            }
        } catch (e) {
            console.error("Error checking/saving alert:", e);
        }
    }
}

let distChart = null;
let trendChart = null;

function initCharts(critical, warning, info) {
    const distCtx = document.getElementById('alertDistChart');
    const trendCtx = document.getElementById('alertTrendChart');
    const isDark = document.documentElement.classList.contains('dark');

    if (distCtx) {
        if (distChart) distChart.destroy();
        distChart = new Chart(distCtx.getContext('2d'), {
            type: 'doughnut',
            data: {
                labels: ['Critical', 'Warning', 'Info'],
                datasets: [{
                    data: [critical, warning, info],
                    backgroundColor: ['#ef4444', '#f97316', '#3b82f6'],
                    borderWidth: 0,
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: {
                            usePointStyle: true,
                            padding: 20,
                            font: { family: 'Outfit' },
                            color: isDark ? '#fff' : '#374151'
                        }
                    }
                },
                cutout: '70%'
            }
        });
    }

    if (trendCtx) {
        if (trendChart) trendChart.destroy();
        trendChart = new Chart(trendCtx.getContext('2d'), {
            type: 'bar',
            data: {
                labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Today'],
                datasets: [{
                    label: 'Alerts',
                    data: [2, 5, 3, 8, 4, 2, critical + warning + info],
                    backgroundColor: '#3b82f6',
                    borderRadius: 6,
                    barThickness: 24
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { color: isDark ? '#374151' : '#e5e7eb', drawBorder: false },
                        ticks: { padding: 10, color: isDark ? '#9ca3af' : '#6b7280' }
                    },
                    x: {
                        grid: { display: false },
                        ticks: { font: { family: 'Outfit' }, color: isDark ? '#9ca3af' : '#6b7280' }
                    }
                }
            }
        });
    }
}

function getPriorityColorText(p) {
    if (p === 'Critical') return 'text-red-500';
    if (p === 'Warning') return 'text-orange-500';
    return 'text-blue-500';
}

function getPriorityBadge(p) {
    if (p === 'Critical') return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800';
    if (p === 'Warning') return 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800';
    return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800';
}

function getPriorityIcon(type) {
    if (type.includes('Connection') || type.includes('Signal')) return '<i data-lucide="wifi-off" class="w-4 h-4"></i>';
    if (type.includes('Temp')) return '<i data-lucide="thermometer" class="w-4 h-4"></i>';
    if (type.includes('Delay')) return '<i data-lucide="clock" class="w-4 h-4"></i>';
    return '<i data-lucide="alert-circle" class="w-4 h-4"></i>';
}
