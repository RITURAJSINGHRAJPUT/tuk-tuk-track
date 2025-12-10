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
