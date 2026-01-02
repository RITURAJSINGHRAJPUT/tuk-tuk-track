
import { auth, db, doc, collection, addDoc, serverTimestamp, query, where, orderBy, onSnapshot, getDoc } from '../firebase-config.js';

lucide.createIcons();

const contactForm = document.getElementById('contact-form');
const ticketsList = document.getElementById('tickets-list');
const profileSection = document.getElementById('user-profile-section');

// Auth Check
auth.onAuthStateChanged(async (user) => {
    if (user) {
        // Double check if actually a driver is useful but UI links handles it mostly?
        // Let's just run. Driver logic is identical to User logic honestly, but separate file requested.

        // Update Profile in Sidebar
        if (profileSection) {
            profileSection.innerHTML = `
                <a href="#" class="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                    <div class="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center text-purple-600 dark:text-purple-400 font-bold">
                        ${user.email.charAt(0).toUpperCase()}
                    </div>
                    <div class="overflow-hidden">
                        <p class="text-sm font-bold text-gray-900 dark:text-white truncate">${user.displayName || 'Driver'}</p>
                        <p class="text-xs text-gray-500 dark:text-gray-400 truncate">${user.email}</p>
                    </div>
                </a>
            `;
        }

        setupForm(user);
        setupRealtimeTickets(user);
    } else {
        window.location.href = 'login.html';
    }
});

function setupForm(user) {
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
            await addDoc(collection(db, "contact_messages"), {
                userId: user.uid,
                userEmail: user.email,
                userName: user.displayName || 'Driver',
                subject,
                priority,
                message,
                status: 'new',
                createdAt: serverTimestamp(),
                targetRole: 'driver' // useful metadata
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

function createTicketCard(data) {
    const isResolved = data.status === 'resolved' || data.status === 'replied';
    const statusColor = isResolved ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
    const dateStr = data.createdAt ? new Date(data.createdAt.toDate()).toLocaleDateString() : 'Just now';

    let replyContent = '';
    if (data.reply) {
        replyContent = `
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

    return `
        <div class="bg-gray-50 dark:bg-gray-700/20 border border-gray-100 dark:border-gray-700 rounded-xl p-5">
            <div class="flex justify-between items-start mb-3">
                <div class="flex items-center gap-3">
                     <div class="w-10 h-10 rounded-full ${isResolved ? 'bg-green-100 text-green-600' : 'bg-purple-100 text-purple-600'} flex items-center justify-center font-bold text-sm">
                        ${data.subject.charAt(0)}
                     </div>
                     <div>
                        <h4 class="font-bold text-gray-900 dark:text-white text-sm md:text-base">${data.subject}</h4>
                        <p class="text-xs text-gray-500 dark:text-gray-400">${dateStr}</p>
                     </div>
                </div>
                <span class="px-2.5 py-1 rounded-full text-xs font-bold ${statusColor} border border-opacity-20 uppercase tracking-wide scale-90 origin-right">${data.status}</span>
            </div>
            <p class="text-sm text-gray-600 dark:text-gray-300 mb-2 pl-[52px] leading-relaxed">${data.message}</p>
            <div class="pl-[52px]">${replyContent}</div>
        </div>
    `;
}

function showToast(title, message) {
    const toast = document.getElementById('toast');
    document.getElementById('toast-title').innerText = title;
    document.getElementById('toast-message').innerText = message;

    toast.classList.remove('translate-y-24');
    setTimeout(() => {
        toast.classList.add('translate-y-24');
    }, 3000);
}
