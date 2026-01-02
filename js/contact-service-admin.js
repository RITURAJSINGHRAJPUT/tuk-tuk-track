
import { adminAuth as auth, adminDb as db, updateDoc, doc, collection, serverTimestamp, query, orderBy, onSnapshot } from '../firebase-config.js';

lucide.createIcons();

const ticketsList = document.getElementById('tickets-list');
const profileSection = document.getElementById('user-profile-section');

// Auth Check (Strictly Admin Auth)
auth.onAuthStateChanged(async (user) => {
    if (user) {
        // Update Profile in Sidebar
        if (profileSection) {
            profileSection.innerHTML = `
                <a href="#" class="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                    <div class="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center text-purple-600 dark:text-purple-400 font-bold">
                        A
                    </div>
                    <div class="overflow-hidden">
                        <p class="text-sm font-bold text-gray-900 dark:text-white truncate">Administrator</p>
                        <p class="text-xs text-gray-500 dark:text-gray-400 truncate">${user.email}</p>
                    </div>
                </a>
            `;
        }

        setupRealtimeInbox();
    } else {
        window.location.href = 'admin-login.html'; // Admin login redirect
    }
});

function setupRealtimeInbox() {
    // Admin sees ALL tickets
    const q = query(collection(db, "contact_messages"), orderBy("createdAt", "desc"));

    onSnapshot(q, (snapshot) => {
        if (snapshot.empty) {
            ticketsList.innerHTML = `<div class="text-center py-6 text-gray-500">No tickets found.</div>`;
            return;
        }

        ticketsList.innerHTML = '';
        snapshot.forEach(doc => {
            const data = doc.data();
            const id = doc.id;
            const card = createTicketCard(id, data);
            ticketsList.innerHTML += card;
        });
        lucide.createIcons();
    }, (error) => {
        console.error("Tickets Error", error);
    });
}

function createTicketCard(id, data) {
    const isNew = data.status === 'new';
    const statusColor = isNew ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
    const dateStr = data.createdAt ? new Date(data.createdAt.toDate()).toLocaleDateString() + ' ' + new Date(data.createdAt.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now';

    let actionArea = '';

    // Admin Actions
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
                <p class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Replied</p>
                <div class="bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-900/30 rounded-lg p-3">
                     <p class="text-gray-700 dark:text-gray-300">${data.reply}</p>
                     <p class="text-xs text-green-600 dark:text-green-400 font-bold mt-2 flex items-center gap-1">
                        <i data-lucide="check-circle" class="w-3 h-3"></i> Resolved
                     </p>
                </div>
            </div>
        `;
    }

    return `
        <div class="bg-gray-50 dark:bg-gray-700/20 border border-gray-100 dark:border-gray-700 rounded-xl p-5 hover:border-purple-200 dark:hover:border-purple-800 transition-colors">
            <div class="flex justify-between items-start mb-3">
                <div class="flex items-center gap-3">
                     <div class="w-10 h-10 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center font-bold text-sm text-gray-600 dark:text-gray-400">
                        ${data.userName ? data.userName.charAt(0).toUpperCase() : 'U'}
                     </div>
                     <div>
                        <h4 class="font-bold text-gray-900 dark:text-white text-sm md:text-base">${data.subject}</h4>
                        <p class="text-xs text-gray-500 dark:text-gray-400">${data.userName} (${data.userEmail}) • ${dateStr}</p>
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
        await updateDoc(doc(db, "contact_messages", id), {
            reply: replyText,
            status: 'resolved',
            repliedAt: serverTimestamp()
        });
        showNotification('success', "Ticket Resolved", "Reply sent and ticket marked as resolved.");
    } catch (e) {
        console.error("Reply Error", e);
        showNotification('error', "Reply Failed", e.message);
    }
};


