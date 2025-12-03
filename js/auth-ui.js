import { auth, onAuthStateChanged, signOut } from '../firebase-config.js';

export function initAuthUI() {
    // Check Auth
    onAuthStateChanged(auth, (user) => {
        if (!user) {
            window.location.href = 'login.html';
        } else {
            // Update Sidebar User Info
            const sidebarNames = document.querySelectorAll('.sidebar-user-name');
            const sidebarRoles = document.querySelectorAll('.sidebar-user-role');
            const sidebarImgs = document.querySelectorAll('.sidebar-user-img');

            sidebarNames.forEach(el => el.textContent = user.displayName || 'User');
            sidebarRoles.forEach(el => el.textContent = user.email);
            sidebarImgs.forEach(el => el.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || 'User')}&background=3b82f6&color=fff`);
        }
    });

    // Logout
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            signOut(auth).then(() => {
                window.location.href = 'login.html';
            });
        });
    }
}
