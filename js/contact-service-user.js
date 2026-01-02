
import { auth, db, doc, collection, addDoc, serverTimestamp, query, where, orderBy, onSnapshot, getDoc, getDocs, storage, storageRef, uploadBytes, getDownloadURL } from '../firebase-config.js';
import { initAuthUI } from './auth-ui.js';

lucide.createIcons();
initAuthUI();

const contactForm = document.getElementById('contact-form');
const ticketsList = document.getElementById('tickets-list');
const profileSection = document.getElementById('user-profile-section');

// Auth Check
auth.onAuthStateChanged(async (user) => {
    if (user) {
        // ... (profile update logic kept implicit if not changing) ...
        // Profile update handled by auth-ui.js via classes


        setupForm(user);
        setupRealtimeTickets(user);
        loadUserShipments(user);


        // File Input Removed

    } else {
        window.location.href = 'login.html';
    }
});

async function loadUserShipments(user) {
    const shipmentSelect = document.getElementById('shipmentRef');
    if (!shipmentSelect) return;

    try {
        const q = query(
            collection(db, "shipments"),
            where("userId", "==", user.uid),
            orderBy("createdAt", "desc")
        );

        const querySnapshot = await getDocs(q);

        // Clear existing options except default
        while (shipmentSelect.options.length > 1) {
            shipmentSelect.remove(1);
        }

        if (querySnapshot.empty) {
            const option = document.createElement('option');
            option.text = "No active shipments found";
            option.disabled = true;
            shipmentSelect.add(option);
            return;
        }

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            const option = document.createElement('option');
            // Use trackingId for value and text, include status for clarity
            const text = `${data.trackingId || doc.id} (${data.status})`;
            option.value = data.trackingId || doc.id;
            option.text = text;
            shipmentSelect.add(option);
        });

    } catch (error) {
        console.error("Error loading shipments:", error);
    }
}

function setupForm(user) {
    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const subject = document.getElementById('subject').value;
        const priority = document.getElementById('priority').value;
        const message = document.getElementById('message').value;
        const shipmentRef = document.getElementById('shipmentRef').value;
        // Attachment Removed

        const submitBtn = contactForm.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn.innerHTML;

        submitBtn.disabled = true;
        submitBtn.innerHTML = `<i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i> Sending...`;
        lucide.createIcons();

        try {
            // Save Ticket
            await addDoc(collection(db, "contact_messages"), {
                userId: user.uid,
                userEmail: user.email,
                userName: user.displayName || 'User',
                subject,
                priority,
                shipmentRef: shipmentRef || null,
                message,
                status: 'new',
                createdAt: serverTimestamp(),
                targetRole: 'user'
            });

            showNotification('success', 'Message Sent', "We'll get back to you shortly.");
            contactForm.reset();
        } catch (error) {
            console.error("Error sending message:", error);
            showNotification('error', 'Error', "Failed to send message. Please try again.");
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnText;
            lucide.createIcons();
        }
    });
}

function setupRealtimeTickets(user) {
    const q = query(collection(db, "contact_messages"), where("userId", "==", user.uid));

    onSnapshot(q, (snapshot) => {
        if (snapshot.empty) {
            ticketsList.innerHTML = `<div class="text-center py-6 text-gray-500">No tickets found.</div>`;
            return;
        }

        ticketsList.innerHTML = '';

        let tickets = [];
        snapshot.forEach(doc => {
            tickets.push(doc.data());
        });

        // Client-side sort
        tickets.sort((a, b) => {
            const timeA = a.createdAt ? a.createdAt.toMillis() : Date.now();
            const timeB = b.createdAt ? b.createdAt.toMillis() : Date.now();
            return timeB - timeA;
        });

        tickets.forEach(data => {
            const card = createTicketCard(data);
            ticketsList.innerHTML += card;
        });
        lucide.createIcons();
    }, (error) => {
        console.error("Tickets Error", error);
        ticketsList.innerHTML = `<div class="text-center text-red-500 py-4">Error loading tickets. Please try refreshing.</div>`;
    });
}

// Cache for Modal
window.userTicketsCache = {};

function createTicketCard(data) {
    // Cache data
    const id = data.id || 'unknown'; // Ensure ID is passed or available
    window.userTicketsCache[id] = data;

    const isResolved = data.status === 'resolved' || data.status === 'replied';
    const statusColor = isResolved
        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
        : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';

    // Priority Badge
    const priorityColors = {
        'High': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
        'Medium': 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
        'Low': 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
    };
    const priorityColor = priorityColors[data.priority] || priorityColors['Medium'];

    const dateStr = data.createdAt ? new Date(data.createdAt.toDate()).toLocaleDateString() : 'Just now';

    // Status Icon
    const statusIcon = isResolved ? 'check-circle-2' : 'clock';

    return `
        <div onclick="window.openTicketModal('${id}')" class="flex flex-col md:flex-row md:items-center justify-between gap-4 py-4 border-b border-gray-100 dark:border-gray-700 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-all cursor-pointer group px-2 -mx-2 rounded-lg">
            
            <div class="flex items-center gap-4">
                <div class="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-base">
                    ${data.subject.charAt(0).toUpperCase()}
                </div>
                <div>
                    <h4 class="font-bold text-gray-900 dark:text-white text-sm md:text-base mb-0.5 group-hover:text-blue-600 transition-colors">${data.subject}</h4>
                    <p class="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2">
                        <span><i data-lucide="calendar" class="w-3 h-3 inline"></i> ${dateStr}</span>
                        <span class="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600"></span>
                        <span class="${priorityColor.split(' ')[1]} font-medium">${data.priority || 'Medium'}</span>
                    </p>
                </div>
            </div>

            <div class="flex items-center gap-3 pl-14 md:pl-0">
                <span class="px-2.5 py-1 ${statusColor} text-[10px] font-bold uppercase rounded-full tracking-wider">
                    ${data.status}
                </span>
                <i data-lucide="chevron-right" class="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors"></i>
            </div>
        </div>
    `;
}

window.openTicketModal = (id) => {
    const data = window.userTicketsCache[id];
    if (!data) return;

    // Populate Data
    document.getElementById('modal-subject').textContent = data.subject;
    document.getElementById('modal-date').textContent = data.createdAt ? new Date(data.createdAt.toDate()).toLocaleString() : 'Just now';
    document.getElementById('modal-message').textContent = data.message;
    document.getElementById('modal-avatar').textContent = data.subject.charAt(0).toUpperCase();

    // Status Badge
    const modalStatus = document.getElementById('modal-status');
    const isResolved = data.status === 'resolved' || data.status === 'replied';
    modalStatus.textContent = data.status;
    modalStatus.className = `ml-auto px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${isResolved
        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
        : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
        }`;

    // Attachment
    const attachContainer = document.getElementById('modal-attachment-container');
    const attachLink = document.getElementById('modal-attachment-link');
    if (data.attachmentUrl) {
        attachContainer.classList.remove('hidden');
        attachLink.href = data.attachmentUrl;
    } else {
        attachContainer.classList.add('hidden');
    }

    // Reply Logic
    const replySection = document.getElementById('modal-reply-section');
    const noReplySection = document.getElementById('modal-no-reply');

    if (data.reply) {
        replySection.classList.remove('hidden');
        noReplySection.classList.add('hidden');
        document.getElementById('modal-reply').textContent = data.reply;
    } else {
        replySection.classList.add('hidden');
        noReplySection.classList.remove('hidden');
    }

    document.getElementById('ticket-modal').classList.remove('hidden');
};

window.closeTicketModal = () => {
    document.getElementById('ticket-modal').classList.add('hidden');
};


