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
            sidebarImgs.forEach(el => {
                if (user.photoURL) {
                    el.src = user.photoURL;
                } else {
                    el.src = "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/People/Man%20Technologist.png";
                }
            });
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
