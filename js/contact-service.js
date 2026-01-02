
import { initAuthUI } from './auth-ui.js';
import { auth, db, adminAuth, adminDb, doc, getDoc, collection, addDoc, updateDoc, serverTimestamp, query, where, orderBy, onSnapshot } from '../firebase-config.js';

// Initialize Lucide icons
lucide.createIcons();

const sidebarContainer = document.getElementById('sidebar');
const contactsGrid = document.getElementById('contacts-grid');
const contactForm = document.getElementById('contact-form');
const ticketsSection = document.getElementById('tickets-section');
const ticketsList = document.getElementById('tickets-list');
const ticketsTitle = document.getElementById('tickets-title');
const adminFilters = document.getElementById('admin-filters');

// Role-based Sidebar Content
const sidebars = {
    user: `
        <div class="p-6 flex items-center justify-between gap-3 mb-2">
            <div class="flex items-center gap-3">
                <div class="w-10 h-10 bg-gradient-to-tr from-blue-600 to-blue-400 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                    <i data-lucide="truck" class="text-white w-6 h-6"></i>
                </div>
                <div>
                    <h1 class="text-xl font-bold tracking-tight text-gray-900 dark:text-white leading-none">TukTuk</h1>
                    <span class="text-xs font-bold text-blue-500 tracking-widest uppercase">Track</span>
                </div>
            </div>
            <button id="sidebar-close-btn" class="md:hidden p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
                <i data-lucide="x" class="w-6 h-6"></i>
            </button>
        </div>
        <nav class="flex-1 px-4 space-y-2">
            <p class="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 mt-4">Menu</p>
            <a href="dashboard.html" class="flex items-center gap-3 px-4 py-3.5 text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-800 hover:shadow-md hover:shadow-gray-200/50 dark:hover:shadow-black/20 rounded-xl transition-all group">
                <i data-lucide="layout-dashboard" class="w-5 h-5 group-hover:text-blue-500 transition-colors"></i>
                <span class="font-medium group-hover:text-gray-900 dark:group-hover:text-white transition-colors">Dashboard</span>
            </a>
            <a href="request.html" class="flex items-center gap-3 px-4 py-3.5 text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-800 hover:shadow-md hover:shadow-gray-200/50 dark:hover:shadow-black/20 rounded-xl transition-all group">
                <i data-lucide="package-plus" class="w-5 h-5 group-hover:text-blue-500 transition-colors"></i>
                <span class="font-medium group-hover:text-gray-900 dark:group-hover:text-white transition-colors">Request Shipment</span>
            </a>
            <a href="contact-service.html" class="flex items-center gap-3 px-4 py-3.5 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl shadow-lg shadow-blue-500/20 transition-all group">
                <i data-lucide="life-buoy" class="w-5 h-5"></i>
                <span class="font-medium">Contact Service</span>
            </a>
        </nav>
    `,
    driver: `
        <div class="p-6 flex items-center justify-between gap-3 mb-2">
             <div class="flex items-center gap-3">
                <div class="w-10 h-10 bg-gradient-to-tr from-purple-600 to-purple-400 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20">
                    <i data-lucide="truck" class="text-white w-6 h-6"></i>
                </div>
                <div>
                    <h1 class="text-xl font-bold tracking-tight text-gray-900 dark:text-white leading-none">TukTuk</h1>
                    <span class="text-xs font-bold text-purple-500 tracking-widest uppercase">Driver</span>
                </div>
            </div>
             <button id="sidebar-close-btn" class="md:hidden p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
                <i data-lucide="x" class="w-6 h-6"></i>
            </button>
        </div>
        <nav class="flex-1 px-4 space-y-2">
            <p class="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 mt-4">Menu</p>
            <a href="driver-dashboard.html" class="flex items-center gap-3 px-4 py-3.5 text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-800 hover:shadow-md hover:shadow-gray-200/50 dark:hover:shadow-black/20 rounded-xl transition-all group">
                <i data-lucide="layout-dashboard" class="w-5 h-5 group-hover:text-purple-500 transition-colors"></i>
                <span class="font-medium group-hover:text-gray-900 dark:group-hover:text-white transition-colors">My Assignments</span>
            </a>
             <a href="contact-service.html" class="flex items-center gap-3 px-4 py-3.5 bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-xl shadow-lg shadow-purple-500/20 transition-all group">
                <i data-lucide="life-buoy" class="w-5 h-5"></i>
                <span class="font-medium">Contact Service</span>
            </a>
        </nav>
    `,
    admin: `
        <div class="p-6 flex items-center justify-between gap-3 mb-2">
             <div class="flex items-center gap-3">
                <div class="w-10 h-10 bg-gradient-to-tr from-purple-600 to-purple-400 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20">
                    <i data-lucide="truck" class="text-white w-6 h-6"></i>
                </div>
                <div>
                    <h1 class="text-xl font-bold tracking-tight text-gray-900 dark:text-white leading-none">TukTuk</h1>
                    <span class="text-xs font-bold text-purple-500 tracking-widest uppercase">Admin</span>
                </div>
            </div>
             <button id="sidebar-close-btn" class="md:hidden p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
                <i data-lucide="x" class="w-6 h-6"></i>
            </button>
        </div>
        <nav class="flex-1 px-4 space-y-2">
            <p class="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 mt-4">Overview</p>
            <a href="admindashboard.html" class="flex items-center gap-3 px-4 py-3.5 text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-800 hover:shadow-md hover:shadow-gray-200/50 dark:hover:shadow-black/20 rounded-xl transition-all group">
                <i data-lucide="layout-dashboard" class="w-5 h-5 group-hover:text-purple-500 transition-colors"></i>
                <span class="font-medium group-hover:text-gray-900 dark:group-hover:text-white transition-colors">Dashboard</span>
            </a>
            <a href="contact-service.html" class="flex items-center gap-3 px-4 py-3.5 bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-xl shadow-lg shadow-purple-500/20 transition-all group">
                <i data-lucide="life-buoy" class="w-5 h-5"></i>
                <span class="font-medium">Contact Service</span>
            </a>
        </nav>
    `
};

const defaultContacts = {
    user: [
        { title: "Customer Support", phone: "+1 (555) 123-4567", email: "support@tuktuk.com", icon: "headphones" },
        { title: "Sales Inquiry", phone: "+1 (555) 987-6543", email: "sales@tuktuk.com", icon: "briefcase" }
    ],
    driver: [
        { title: "Fleet Manager", phone: "+1 (555) 222-3333", email: "fleet@tuktuk.com", icon: "truck" },
        { title: "Emergency Dispatch", phone: "+1 (555) 911-0000", email: "sos@tuktuk.com", icon: "alert-triangle", color: "red" }
    ],
    admin: [
        { title: "System Admin", phone: "+1 (555) 000-1111", email: "sysadmin@tuktuk.com", icon: "server" },
        { title: "HR Department", phone: "+1 (555) 000-2222", email: "hr@tuktuk.com", icon: "users" }
    ]
};

// -----------------------------------------------------------
// DUAL AUTH CHECK (Admin vs User/Driver)
// -----------------------------------------------------------

// Check Admin Auth First
adminAuth.onAuthStateChanged((adminUser) => {
    if (adminUser) {
        // Logged in as Admin
        // Use adminDb for all operations
        initPage('admin', adminUser, adminDb);
    } else {
        // Not Admin, check Standard Auth
        auth.onAuthStateChanged((user) => {
            if (user) {
                // Logged in as User or Driver
                // Use standard db
                determineUserRoleAndInit(user, db);
            } else {
                // Not logged in at all
                // Only redirect if we are SURE. 
                // Since this is the fallback, it's safe to assume no session.
                window.location.href = 'login.html';
            }
        });
    }
});

async function determineUserRoleAndInit(user, database) {
    let role = 'user'; // Default

    // 1. Check Email Pattern
    if (user.email.endsWith('.driver@tuktuk.com')) {
        role = 'driver';
    } else {
        // 2. Check Firestore
        try {
            const docSnap = await getDoc(doc(database, "users", user.uid));
            if (docSnap.exists()) {
                const data = docSnap.data();
                if (data.role) role = data.role;
            }
        } catch (e) {
            console.log("Role fetch error/skip", e);
        }
    }

    initPage(role, user, database);
}

// Global variable to hold current DB instance (for sendReply/sendForm)
let currentDb = db;

async function initPage(role, user, database) {
    currentDb = database; // Set for global functions

    // 1. Render Sidebar
    renderSidebar(role, user);

    // 2. Render Contacts
    await renderContacts(role, database);

    // 3. Setup UI
    if (role === 'admin') {
        // Admin View
        const formContainer = contactForm.closest('.bg-white');
        if (formContainer) formContainer.classList.add('hidden');

        if (ticketsSection) {
            ticketsSection.classList.remove('hidden');
            ticketsTitle.innerHTML = `<i data-lucide="inbox" class="w-5 h-5 text-purple-500"></i><span>Support Inbox</span>`;
            if (adminFilters) adminFilters.classList.remove('hidden');
        }

        setupRealtimeTickets(role, user, database);

    } else {
        // User/Driver View
        setupForm(user, database);
        if (ticketsSection) ticketsSection.classList.remove('hidden');
        setupRealtimeTickets(role, user, database);
    }
}

function renderSidebar(role, user) {
    let content = sidebars[role] || sidebars['user'];
    const profileHtml = `
        <div class="p-4 border-t border-gray-200 dark:border-gray-800 mt-auto">
            <a href="profile.html" class="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                <div class="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold">
                    ${user.email ? user.email.charAt(0).toUpperCase() : 'U'}
                </div>
                <div class="overflow-hidden">
                    <p class="text-sm font-bold text-gray-900 dark:text-white truncate">${user.displayName || 'User'}</p>
                    <p class="text-xs text-gray-500 dark:text-gray-400 truncate">${user.email}</p>
                </div>
            </a>
        </div>
    `;
    sidebarContainer.innerHTML = content + profileHtml;
    const closeBtn = document.getElementById('sidebar-close-btn');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            document.getElementById('sidebar').classList.add('hidden');
            document.getElementById('sidebar-backdrop').classList.add('hidden');
        });
    }
    lucide.createIcons();
}

async function renderContacts(role, database) {
    contactsGrid.innerHTML = '';
    const contactsToShow = defaultContacts[role];
    contactsToShow.forEach(contact => {
        const colorClass = contact.color === 'red' ? 'text-red-600 bg-red-100 dark:bg-red-900/30' : 'text-blue-600 bg-blue-100 dark:bg-blue-900/30';
        contactsGrid.innerHTML += `
            <div class="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all">
                <div class="w-12 h-12 ${colorClass} rounded-2xl flex items-center justify-center mb-4">
                    <i data-lucide="${contact.icon || 'phone'}" class="w-6 h-6"></i>
                </div>
                <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-2">${contact.title}</h3>
                <div class="space-y-2">
                    <a href="tel:${contact.phone}" class="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                        <i data-lucide="phone" class="w-4 h-4"></i>
                        ${contact.phone}
                    </a>
                    <a href="mailto:${contact.email}" class="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                        <i data-lucide="mail" class="w-4 h-4"></i>
                        ${contact.email}
                    </a>
                </div>
            </div>
        `;
    });
    lucide.createIcons();
}

function setupForm(user, database) {
    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const subject = document.getElementById('subject').value;
        const priority = document.getElementById('priority').value;
        const message = document.getElementById('message').value;
        const submitBtn = contactForm.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = `<i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i> Sending...`;
        lucide.createIcons();

        try {
            await addDoc(collection(database, "contact_messages"), {
                userId: user.uid,
                userEmail: user.email,
                userName: user.displayName || 'Unknown',
                subject,
                priority,
                message,
                status: 'new', // new, replied, resolved
                createdAt: serverTimestamp()
            });
            showToast("Message Sent", "We'll get back to you shortly.");
            contactForm.reset();
        } catch (error) {
            console.error("Error sending message:", error);
            showToast("Error", "Failed to send message. Please try again.");
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnText;
            lucide.createIcons();
        }
    });
}

function setupRealtimeTickets(role, user, database) {
    let q;
    if (role === 'admin') {
        q = query(collection(database, "contact_messages"), orderBy("createdAt", "desc"));
    } else {
        q = query(collection(database, "contact_messages"), where("userId", "==", user.uid));
    }

    onSnapshot(q, (snapshot) => {
        if (snapshot.empty) {
            ticketsList.innerHTML = `<div class="text-center py-6 text-gray-500">No tickets found.</div>`;
            return;
        }

        ticketsList.innerHTML = '';

        let tickets = [];
        snapshot.forEach(doc => {
            tickets.push({ id: doc.id, ...doc.data() });
        });

        // Client-side sort if it's not admin (Admin query already has orderBy)
        // Actually, safer to just sort all client side if mixed results, 
        // but admin query has orderBy working (single field).
        // For user/driver, we removed orderBy, so we sort here.
        if (role !== 'admin') {
            tickets.sort((a, b) => {
                const timeA = a.createdAt ? a.createdAt.toMillis() : Date.now();
                const timeB = b.createdAt ? b.createdAt.toMillis() : Date.now();
                return timeB - timeA;
            });
        }

        tickets.forEach(data => {
            // createTicketCard expects (id, data, role)
            const id = data.id;
            const card = createTicketCard(id, data, role);
            ticketsList.innerHTML += card;
        });
        lucide.createIcons();
    }, (error) => {
        console.error("Tickets Error", error);
        ticketsList.innerHTML = `<div class="text-center text-red-500 py-4">Error loading tickets.</div>`;
    });
}

function createTicketCard(id, data, role) {
    const isNew = data.status === 'new';
    const statusColor = isNew ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
    const dateStr = data.createdAt ? new Date(data.createdAt.toDate()).toLocaleDateString() + ' ' + new Date(data.createdAt.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now';

    let actionArea = '';

    if (role === 'admin') {
        // Admin Reply Area
        if (!data.reply) {
            actionArea = `
                <div class="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                    <textarea id="reply-${id}" class="w-full p-3 text-sm bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-purple-500 outline-none mb-2" placeholder="Write a reply to resolve this ticket..."></textarea>
                    <button onclick="window.sendReply('${id}')" class="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold rounded-lg transition-colors shadow-lg shadow-purple-500/20 flex items-center gap-2">
                        <i data-lucide="check-circle" class="w-4 h-4"></i>
                        Reply & Resolve
                    </button>
                </div>
            `;
        } else {
            actionArea = `
                <div class="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                    <p class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Admin Reply</p>
                    <div class="bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-900/30 rounded-lg p-3">
                         <p class="text-gray-700 dark:text-gray-300">${data.reply}</p>
                         <p class="text-xs text-green-600 dark:text-green-400 font-bold mt-2 flex items-center gap-1">
                            <i data-lucide="check-circle" class="w-3 h-3"></i> Resolved
                         </p>
                    </div>
                </div>
            `;
        }
    } else {
        // User View: Show Reply if exists
        if (data.reply) {
            actionArea = `
                <div class="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 animate-fade-in-up">
                    <div class="flex items-start gap-3">
                         <div class="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 flex items-center justify-center shrink-0">
                            <i data-lucide="check" class="w-4 h-4"></i>
                         </div>
                         <div class="flex-1">
                            <p class="text-xs font-bold text-green-600 dark:text-green-400 mb-1">Support Team • Resolved</p>
                            <p class="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">${data.reply}</p>
                         </div>
                    </div>
                </div>
            `;
        }
    }

    return `
        <div class="bg-gray-50 dark:bg-gray-700/20 border border-gray-100 dark:border-gray-700 rounded-xl p-5 hover:border-blue-200 dark:hover:border-blue-800 transition-colors">
            <div class="flex justify-between items-start mb-3">
                <div class="flex items-center gap-3">
                     <div class="w-10 h-10 rounded-full ${isNew ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'} flex items-center justify-center font-bold text-sm">
                        ${data.userName ? data.userName.charAt(0).toUpperCase() : 'U'}
                     </div>
                     <div>
                        <h4 class="font-bold text-gray-900 dark:text-white text-sm md:text-base">${data.subject}</h4>
                        <p class="text-xs text-gray-500 dark:text-gray-400">${role === 'admin' ? data.userName + ' • ' : ''}${dateStr}</p>
                     </div>
                </div>
                <span class="px-2.5 py-1 rounded-full text-xs font-bold ${statusColor} border border-opacity-20 uppercase tracking-wide scale-90 origin-right">${data.status}</span>
            </div>
            
            <p class="text-sm text-gray-600 dark:text-gray-300 mb-2 pl-[52px] leading-relaxed">${data.message}</p>
            
            <div class="pl-[52px]">
               ${actionArea}
            </div>
        </div>
    `;
}

// Global Reply Function
window.sendReply = async (id) => {
    const textarea = document.getElementById(`reply-${id}`);
    const replyText = textarea.value.trim();

    if (!replyText) return;

    try {
        // Use currentDb which is set to adminDb when logged in as admin
        await updateDoc(doc(currentDb, "contact_messages", id), {
            reply: replyText,
            status: 'resolved', // Changed to resolved
            repliedAt: serverTimestamp()
        });
        showToast("Ticket Resolved", "Reply sent and ticket marked as resolved.");
    } catch (e) {
        console.error("Reply Error", e);
        alert("Failed to send reply: " + e.message);
    }
};

function showToast(title, message) {
    const toast = document.getElementById('toast');
    document.getElementById('toast-title').innerText = title;
    document.getElementById('toast-message').innerText = message;

    toast.classList.remove('translate-y-24');
    setTimeout(() => {
        toast.classList.add('translate-y-24');
    }, 3000);
}
