import { adminAuth as auth, db, onAuthStateChanged, doc, getDoc, signOut } from '../firebase-config.js';

export function initAdminGuard() {
    // Check Auth State
    onAuthStateChanged(auth, async (user) => {
        if (!user) {
            // Not logged in -> Redirect to Admin Login
            window.location.href = 'admin-login.html';
        } else {
            // Logged in -> Verify Admin Role
            try {
                const userDocRef = doc(db, "users", user.uid);
                const userDoc = await getDoc(userDocRef);

                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    if (userData.role !== 'admin') {
                        // Not an admin -> Redirect, do NOT sign out (preserves user session if shared)
                        alert("Access Denied: Administrator privileges required.");
                        window.location.href = 'index.html'; // Or login.html
                    } else {
                        // Is Admin -> Update UI (Sidebar, etc.)
                        updateAdminUI(user, userData);
                    }
                } else {
                    // No user record -> Redirect
                    window.location.href = 'index.html';
                }
            } catch (error) {
                console.error("Error verifying admin role:", error);
                // On error, redirect
                window.location.href = 'index.html';
            }
        }
    });

    // Handle Logout
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            signOut(auth).then(() => {
                window.location.href = 'admin-login.html';
            });
        });
    }
}

function updateAdminUI(user, userData) {
    // Update Sidebar User Info if elements exist
    // Note: admindashboard.html might have hardcoded "Admin", we can make it dynamic

    // Example selectors based on typical sidebar structure
    // We might need to add specific IDs or classes to the sidebar elements in the HTML if they don't have them
    // For now, let's try to find them by context or assume they might be static "Admin" for now, 
    // but updating them is better.

    // Looking at admindashboard.html, the sidebar user info is static:
    // <img src="..." alt="Admin">
    // <p>Admin</p>
    // <p>admin@tuktuk.com</p>

    // We can try to select them if we add IDs or specific classes in the HTML update step.
    // For now, I will leave this function ready to be expanded or use generic selectors if possible,
    // but since I am going to edit the HTML files anyway, I will add IDs there.
}
