// Theme Toggle & Sidebar Logic
document.addEventListener('DOMContentLoaded', () => {
    // -------------------------------------------------------------------------
    // Theme Toggle Logic
    // -------------------------------------------------------------------------
    const themeToggleBtn = document.getElementById('theme-toggle');
    const htmlElement = document.documentElement;

    // Check for saved user preference, if any, on load of the website
    if (localStorage.getItem('color-theme') === 'dark' || (!('color-theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        htmlElement.classList.add('dark');
    } else {
        htmlElement.classList.remove('dark');
    }

    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', function () {
            // if set via local storage previously
            if (localStorage.getItem('color-theme')) {
                if (localStorage.getItem('color-theme') === 'light') {
                    htmlElement.classList.add('dark');
                    localStorage.setItem('color-theme', 'dark');
                } else {
                    htmlElement.classList.remove('dark');
                    localStorage.setItem('color-theme', 'light');
                }

                // if NOT set via local storage previously
            } else {
                if (htmlElement.classList.contains('dark')) {
                    htmlElement.classList.remove('dark');
                    localStorage.setItem('color-theme', 'light');
                } else {
                    htmlElement.classList.add('dark');
                    localStorage.setItem('color-theme', 'dark');
                }
            }
        });
    }

    // -------------------------------------------------------------------------
    // Sidebar Toggle Logic
    // -------------------------------------------------------------------------
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const sidebar = document.getElementById('sidebar');
    const sidebarBackdrop = document.getElementById('sidebar-backdrop');

    if (sidebarToggle && sidebar) {
        sidebarToggle.addEventListener('click', () => {
            // Toggle Logic
            sidebar.classList.toggle('hidden');

            // If showing sidebar on mobile
            if (!sidebar.classList.contains('hidden')) {
                sidebar.classList.add('flex', 'fixed', 'inset-0', 'z-[60]', 'shadow-2xl');
                sidebar.style.width = '100vw';
                sidebar.style.height = '100vh';
                sidebar.style.margin = '0';
                sidebar.style.borderRadius = '0';

                if (sidebarBackdrop) {
                    sidebarBackdrop.classList.remove('hidden');
                    sidebarBackdrop.classList.remove('md:hidden'); // Ensure visible even if md:hidden class persists
                }
            } else {
                // Close Logic
                sidebar.classList.remove('fixed', 'inset-0', 'z-[60]', 'shadow-2xl');
                sidebar.style.width = '';
                sidebar.style.height = '';
                sidebar.style.margin = '';
                sidebar.style.borderRadius = '';

                sidebar.classList.remove('flex'); // Go back to hidden state
                if (sidebarBackdrop) {
                    sidebarBackdrop.classList.add('hidden');
                }
            }
        });
    }

    // Close on X button click
    const sidebarClose = document.getElementById('sidebar-close');
    if (sidebarClose && sidebar) {
        sidebarClose.addEventListener('click', () => {
            sidebar.classList.add('hidden');
            sidebar.classList.remove('flex', 'fixed', 'inset-0', 'z-[60]', 'shadow-2xl');
            sidebar.style.width = '';
            sidebar.style.height = '';
            sidebar.style.margin = '';
            sidebar.style.borderRadius = '';

            if (sidebarBackdrop) {
                sidebarBackdrop.classList.add('hidden');
            }
        });
    }

    // Close on backdrop click
    if (sidebarBackdrop) {
        sidebarBackdrop.addEventListener('click', () => {
            if (sidebar) {
                sidebar.classList.add('hidden');
                sidebar.classList.remove('flex', 'fixed', 'inset-0', 'z-[60]', 'shadow-2xl');
                sidebar.style.width = '';
                sidebar.style.height = '';
                sidebar.style.margin = '';
                sidebar.style.borderRadius = '';
            }
            sidebarBackdrop.classList.add('hidden');
        });
    }

    // Safety check: Ensure sidebar is reset on resize to desktop
    window.addEventListener('resize', () => {
        if (window.innerWidth >= 768) {
            if (sidebar) {
                sidebar.classList.remove('hidden', 'fixed', 'inset-0', 'z-[60]', 'shadow-2xl');
                sidebar.style.width = '';
                sidebar.style.height = '';
                sidebar.style.margin = '';
                sidebar.style.borderRadius = '';
                sidebar.classList.add('flex'); // Ensure it's visible as flex in sidebar mode
            }
            if (sidebarBackdrop) {
                sidebarBackdrop.classList.add('hidden');
            }
        } else {
            // If resizing down to mobile, ensure it starts hidden
            if (sidebar && !sidebar.classList.contains('fixed')) {
                sidebar.classList.add('hidden');
                sidebar.classList.remove('flex');
            }
        }
    });

});

// -------------------------------------------------------------------------
// Global Notification System
// -------------------------------------------------------------------------
window.showNotification = function (type, title, message) {
    // Remove existing notifications to prevent stacking (optional, but cleaner for top-center)
    const existingNotifications = document.querySelectorAll('.notification-toast');
    existingNotifications.forEach(n => n.remove());

    // Create Notification Container
    const notification = document.createElement('div');
    notification.className = `notification-toast fixed top-4 left-1/2 transform -translate-x-1/2 z-[100] flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg shadow-gray-200/50 dark:shadow-black/20 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 transition-all duration-300 opacity-0 min-w-[300px] max-w-md`;

    // Define Icons and Colors based on Type
    let icon = '';
    let iconColor = '';
    let iconBg = '';

    switch (type) {
        case 'success':
            icon = '<i data-lucide="check-circle-2" class="w-5 h-5 text-green-500"></i>';
            iconBg = 'bg-green-50 dark:bg-green-900/20';
            break;
        case 'error':
            icon = '<i data-lucide="x-circle" class="w-5 h-5 text-red-500"></i>';
            iconBg = 'bg-red-50 dark:bg-red-900/20';
            break;
        case 'info':
            icon = '<i data-lucide="info" class="w-5 h-5 text-blue-500"></i>';
            iconBg = 'bg-blue-50 dark:bg-blue-900/20';
            break;
        case 'warning':
            icon = '<i data-lucide="alert-triangle" class="w-5 h-5 text-orange-500"></i>';
            iconBg = 'bg-orange-50 dark:bg-orange-900/20';
            break;
        default:
            icon = '<i data-lucide="bell" class="w-5 h-5 text-purple-500"></i>';
            iconBg = 'bg-purple-50 dark:bg-purple-900/20';
    }

    // Inner HTML
    notification.innerHTML = `
        <div class="p-2 rounded-lg ${iconBg} shrink-0">
            ${icon}
        </div>
        <div class="flex-1 min-w-0">
            <h4 class="text-sm font-bold text-gray-900 dark:text-white leading-tight">${title}</h4>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">${message}</p>
        </div>
        <button onclick="this.parentElement.remove()" class="p-1 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors">
            <i data-lucide="x" class="w-4 h-4"></i>
        </button>
    `;

    // Append to Body
    document.body.appendChild(notification);

    // Initialize Icons
    if (window.lucide) {
        window.lucide.createIcons();
    }

    // Animate In via CSS classes
    requestAnimationFrame(() => {
        notification.classList.remove('opacity-0', '-translate-y-4');
        notification.classList.add('translate-y-0', 'opacity-100');
    });

    // Auto Dismiss after 3 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.classList.add('opacity-0', '-translate-y-4');
            notification.classList.remove('translate-y-0', 'opacity-100');
            setTimeout(() => {
                if (notification.parentElement) notification.remove();
            }, 300); // Wait for transition
        }
    }, 3000);
};
