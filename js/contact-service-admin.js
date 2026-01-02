import { adminAuth as auth, adminDb as db, updateDoc, deleteDoc, doc, collection, serverTimestamp, query, orderBy, onSnapshot } from '../firebase-config.js';

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

window.currentTickets = {}; // ID -> Data map
window.currentFilter = 'all';

function setupRealtimeInbox() {
    // Admin sees ALL tickets
    const q = query(collection(db, "contact_messages"), orderBy("createdAt", "desc"));

    onSnapshot(q, (snapshot) => {
        // Update Cache
        window.currentTickets = {};
        snapshot.forEach(doc => {
            window.currentTickets[doc.id] = doc.data();
        });

        renderTickets();
    }, (error) => {
        console.error("Tickets Error", error);
        ticketsList.innerHTML = `<div class="text-center py-6 text-gray-500 col-span-full">Error loading tickets.</div>`;
    });
}

function renderTickets() {
    ticketsList.innerHTML = '';

    // Sort logic (descending by createdAt) - manual sort since map doesn't preserve order from snapshot perfectly
    const sortedIds = Object.keys(window.currentTickets).sort((a, b) => {
        const tA = window.currentTickets[a].createdAt?.toDate().getTime() || 0;
        const tB = window.currentTickets[b].createdAt?.toDate().getTime() || 0;
        return tB - tA;
    });

    let hasTickets = false;

    sortedIds.forEach(id => {
        const data = window.currentTickets[id];

        // Filter Logic
        let shouldShow = false;
        const isResolved = data.reply || data.status === 'resolved';

        if (window.currentFilter === 'all') shouldShow = true;
        else if (window.currentFilter === 'open' && !isResolved) shouldShow = true;
        else if (window.currentFilter === 'resolved' && isResolved) shouldShow = true;

        if (shouldShow) {
            ticketsList.innerHTML += createTicketCard(id, data);
            hasTickets = true;
        }
    });

    if (!hasTickets) {
        ticketsList.innerHTML = `<div class="text-center py-12 text-gray-400 col-span-full flex flex-col items-center">
            <i data-lucide="inbox" class="w-12 h-12 mb-3 opacity-20"></i>
            <p>No tickets found for this filter.</p>
        </div>`;
    }

    lucide.createIcons();
}

window.setFilter = (type) => {
    window.currentFilter = type;

    // Update UI Buttons
    const buttons = {
        'all': document.getElementById('filter-all'),
        'open': document.getElementById('filter-open'),
        'resolved': document.getElementById('filter-resolved')
    };

    // Reset all
    Object.values(buttons).forEach(btn => {
        btn.classList.remove('active');
    });

    // Set Active
    if (buttons[type]) {
        buttons[type].classList.add('active');
    }

    renderTickets();
};

function createTicketCard(id, data) {
    const dateStr = data.createdAt ? new Date(data.createdAt.toDate()).toLocaleDateString() : 'Just now';
    // Use targetRole if available, else infer generic
    const role = data.targetRole ? data.targetRole.toUpperCase() : 'USER';

    // Determine badge class
    let badgeClass = 'cs-badge-user';
    let avatarBg = 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400';

    if (role === 'DRIVER') {
        badgeClass = 'cs-badge-driver';
        avatarBg = 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400';
    } else if (role === 'ADMIN') {
        badgeClass = 'cs-badge-admin';
        avatarBg = 'bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400';
    } else {
        // Default User
        badgeClass = 'cs-badge-user';
        avatarBg = 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400';
    }

    return `
        <div class="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all duration-300 cs-card">
            
            <!-- Actions (Delete) -->
            <div class="cs-card-actions">
                <button onclick="window.deleteTicket('${id}')" class="cs-action-btn cs-btn-delete" title="Delete Ticket">
                    <i data-lucide="trash-2" class="w-4 h-4"></i>
                </button>
            </div>

            <!-- Header: Avatar + Info + Badge -->
            <div class="cs-card-header">
                 <div class="cs-avatar ${avatarBg}">
                    ${data.userName ? data.userName.charAt(0).toUpperCase() : 'U'}
                 </div>
                 <div class="flex flex-col min-w-0">
                    <div class="flex items-center gap-2 mb-1">
                        <h4 class="font-bold text-gray-900 dark:text-white text-base truncate max-w-[120px]" title="${data.userName}">${data.userName || 'Unknown User'}</h4>
                    </div>
                    <span class="cs-role-badge ${badgeClass}">${role}</span>
                 </div>
            </div>
            
            <!-- Body: Email -->
             <div class="mb-6 pl-1">
                <div class="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-2">
                    <i data-lucide="mail" class="w-3.5 h-3.5"></i>
                    <span class="truncate block max-w-full" title="${data.userEmail}">${data.userEmail || 'No Email'}</span>
                </div>
                <div class="flex items-center gap-2 text-xs text-gray-400 font-medium">
                     <i data-lucide="calendar" class="w-3.5 h-3.5"></i>
                     ${dateStr}
                </div>
            </div>

            <!-- Footer: View Details -->
            <div class="flex items-center justify-end pt-4 border-t border-gray-100 dark:border-gray-700">
                <button onclick="window.openTicketModal('${id}')" class="text-sm font-bold text-purple-600 hover:text-purple-700 dark:hover:text-purple-400 flex items-center gap-1 transition-colors cursor-pointer group">
                    View Details
                    <i data-lucide="arrow-right" class="w-4 h-4 transform group-hover:translate-x-1 transition-transform"></i>
                </button>
            </div>
        </div>
    `;
}

// Modal Functions
window.openTicketModal = (id) => {
    const data = window.currentTickets[id];
    if (!data) return;

    const modal = document.getElementById('ticket-modal');
    const content = document.getElementById('modal-content');

    const isResolved = data.reply || data.status === 'resolved';
    const statusColor = isResolved ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
    const statusText = isResolved ? 'RESOLVED' : 'NEW';
    const createdDate = data.createdAt ? new Date(data.createdAt.toDate()).toLocaleString() : 'N/A';
    const priority = data.priority ? data.priority.toUpperCase() : '-';

    let actionArea = '';

    // Admin Actions Logic (Same as before but wrapped in modal)
    if (!data.reply) {
        actionArea = `
            <div>
                <label class="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2 ml-1">Reply to User</label>
                <div class="relative">
                    <textarea id="reply-${id}" class="w-full p-4 text-sm bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-purple-500 outline-none min-h-[100px] resize-none pr-12" placeholder="Write a professional reply..."></textarea>
                    <button onclick="window.sendReply('${id}')" class="absolute bottom-3 right-3 p-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg shadow-md transition-colors" title="Send Reply">
                        <i data-lucide="send" class="w-4 h-4"></i>
                    </button>
                </div>
            </div>
        `;
    } else {
        actionArea = `
            <div class="mt-8 pt-6 border-t border-gray-100 dark:border-gray-700">
                <p class="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Response History</p>
                <div class="bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-900/30 rounded-xl p-5">
                     <div class="flex items-start gap-3">
                         <div class="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 flex items-center justify-center shrink-0">
                            <i data-lucide="check" class="w-4 h-4"></i>
                         </div>
                         <div>
                             <p class="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">${data.reply}</p>
                             <div class="mt-3 flex items-center gap-2">
                                <span class="text-xs font-bold text-green-600 dark:text-green-400 uppercase">Resolved</span>
                                <span class="text-gray-300">•</span>
                                <span class="text-xs text-gray-500">${data.repliedAt ? new Date(data.repliedAt.toDate()).toLocaleString() : ''}</span>
                             </div>
                         </div>
                     </div>
                </div>
            </div>
        `;
    }

    content.innerHTML = `
        <div class="flex flex-col h-full">
            <!-- Header Info -->
            <div class="px-6 py-4 border-b border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 flex items-center justify-between">
                <div class="flex items-center gap-3">
                     <div class="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-lg font-bold text-purple-600 dark:text-purple-400">
                        ${data.userName ? data.userName.charAt(0).toUpperCase() : 'U'}
                     </div>
                     <div>
                        <h4 class="text-sm font-bold text-gray-900 dark:text-white leading-tight">${data.userName}</h4>
                        <div class="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            <span class="font-medium text-gray-900 dark:text-gray-300">${data.subject}</span>
                            <span>•</span>
                            <span class="${priority === 'High' ? 'text-red-500' : 'text-gray-500'}">${priority}</span>
                        </div>
                     </div>
                </div>
                <div class="flex flex-col items-end">
                    <span class="px-2.5 py-1 rounded-full text-[10px] font-bold ${statusColor} border border-current border-opacity-20 uppercase tracking-wide mb-1">${statusText}</span>
                    <span class="text-[10px] text-gray-400">${createdDate}</span>
                </div>
            </div>

            <!-- Chat Area -->
            <div class="p-6 space-y-6 bg-gray-50/50 dark:bg-gray-900/20 max-h-[60vh] overflow-y-auto">
                
                <!-- Incoming Ticket (User) -->
                <div class="flex flex-col items-start max-w-[85%]">
                    <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 rounded-2xl rounded-tl-sm shadow-sm text-gray-800 dark:text-gray-200 text-sm leading-relaxed">
                        <p class="text-xs font-bold text-gray-400 uppercase mb-1 tracking-wide">Customer Issue</p>
                        ${data.message}
                    </div>
                    ${data.attachmentUrl ? `
                    <a href="${data.attachmentUrl}" target="_blank" class="mt-2 inline-flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 transition-colors shadow-sm">
                        <i data-lucide="paperclip" class="w-3 h-3"></i> View Attachment
                    </a>` : ''}
                </div>

                <!-- Admin Reply (Outgoing) -->
                ${data.reply ? `
                <div class="flex flex-col items-end self-end max-w-[85%] ml-auto">
                    <div class="cs-bubble-admin text-sm leading-relaxed">
                         <div class="flex items-center gap-2 mb-1 justify-end opacity-80">
                            <i data-lucide="check-circle" class="w-3 h-3"></i>
                            <span class="text-[10px] font-bold uppercase tracking-wide">Our Response</span>
                         </div>
                        ${data.reply}
                    </div>
                    <span class="text-[10px] text-gray-400 mt-1">${data.repliedAt ? new Date(data.repliedAt.toDate()).toLocaleString() : ''}</span>
                </div>
                ` : ''}
                
            </div>

            <!-- Action Area (Reply Box) -->
            ${!data.reply ? `
            <div class="p-4 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700">
                 ${actionArea}
            </div>
            ` : ''}
        </div>
    `;

    modal.classList.remove('hidden');
    // Prevent body scroll
    // document.body.style.overflow = 'hidden';
    lucide.createIcons();
};

window.closeTicketModal = () => {
    document.getElementById('ticket-modal').classList.add('hidden');
    // document.body.style.overflow = '';
};

// Edit Modal Functions
window.openEditTicketModal = (id) => {
    // Prevent event bubbling if clicked from card
    event.stopPropagation();

    const data = window.currentTickets[id];
    if (!data) return;

    document.getElementById('edit-ticket-id').value = id;
    document.getElementById('edit-ticket-status').value = data.status || 'new';
    document.getElementById('edit-ticket-priority').value = data.priority || 'low';

    document.getElementById('edit-ticket-modal').classList.remove('hidden');
};

window.closeEditTicketModal = () => {
    document.getElementById('edit-ticket-modal').classList.add('hidden');
};

window.saveTicketChanges = async () => {
    const id = document.getElementById('edit-ticket-id').value;
    const status = document.getElementById('edit-ticket-status').value;
    const priority = document.getElementById('edit-ticket-priority').value;

    try {
        await updateDoc(doc(db, "contact_messages", id), {
            status,
            priority,
            updatedAt: serverTimestamp()
        });
        showNotification('success', "Ticket Updated", "Status and priority updated successfully.");
        closeEditTicketModal();
    } catch (e) {
        console.error("Update Error", e);
        showNotification('error', "Update Failed", e.message);
    }
};

window.deleteTicket = async (id) => {
    // Prevent event bubbling
    event.stopPropagation();

    if (!confirm('Are you sure you want to delete this ticket? This action cannot be undone.')) return;

    try {
        await deleteDoc(doc(db, "contact_messages", id));
        showNotification('success', "Ticket Deleted", "The ticket has been permanently removed.");
    } catch (e) {
        console.error("Delete Error", e);
        showNotification('error', "Delete Failed", e.message);
    }
};

// Global Reply Function
window.sendReply = async (id) => {
    console.log("Attempting to send reply for ticket:", id);
    const textarea = document.getElementById(`reply-${id}`);

    if (!textarea) {
        console.error("Reply textarea not found for ID:", id);
        showNotification('error', "Error", "Reply input field not found. Please try refreshing the page.");
        return;
    }

    const replyText = textarea.value.trim();

    if (!replyText) {
        showNotification('error', "Validation Error", "Please enter a reply message.");
        return;
    }

    const sendBtn = textarea.nextElementSibling;
    const originalBtnContent = sendBtn.innerHTML;
    sendBtn.disabled = true;
    sendBtn.innerHTML = `<i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i>`;
    lucide.createIcons();

    try {
        await updateDoc(doc(db, "contact_messages", id), {
            reply: replyText,
            status: 'resolved',
            repliedAt: serverTimestamp()
        });
        showNotification('success', "Ticket Resolved", "Reply sent and ticket marked as resolved.");

        // Close modal after short delay
        setTimeout(() => {
            closeTicketModal();
        }, 1500);

    } catch (e) {
        console.error("Reply Error", e);
        if (e.code === 'permission-denied') {
            showNotification('error', "Permission Denied", "You do not have permission to reply. Ensure your account is set as 'admin' in the database.");
        } else {
            showNotification('error', "Reply Failed", "Could not send reply: " + e.message);
        }
    } finally {
        if (sendBtn) {
            sendBtn.disabled = false;
            sendBtn.innerHTML = originalBtnContent;
            lucide.createIcons();
        }
    }
};


