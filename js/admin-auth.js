import { adminAuth as auth, db, signInWithEmailAndPassword, doc, getDoc, signOut, setPersistence, browserSessionPersistence } from '../firebase-config.js';

const loginForm = document.getElementById('admin-login-form');

if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const submitBtn = loginForm.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn.innerHTML;

        try {
            submitBtn.innerHTML = 'Verifying Access...';
            submitBtn.disabled = true;

            // 1. Set Persistence to SESSION (forces isolation from LocalStorage users)
            await setPersistence(auth, browserSessionPersistence);

            // 2. Authenticate with Firebase Auth
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // 2. Check User Role in Firestore
            const userDocRef = doc(db, "users", user.uid);
            const userDoc = await getDoc(userDocRef);

            if (userDoc.exists()) {
                const userData = userDoc.data();
                if (userData.role === 'admin') {
                    // Success: Redirect to Admin Dashboard
                    window.location.href = 'admindashboard.html';
                } else {
                    // Failure: Not an admin
                    throw new Error("Access Denied: You do not have administrator privileges.");
                }
            } else {
                // Failure: User record not found
                throw new Error("Access Denied: User record not found.");
            }

        } catch (error) {
            console.error("Admin Login Error:", error);

            // Sign out if authentication succeeded but role check failed
            if (auth.currentUser) {
                await signOut(auth);
            }

            alert(error.message || "Invalid email or password.");
            submitBtn.innerHTML = originalBtnText;
            submitBtn.disabled = false;
        }
    });
}
