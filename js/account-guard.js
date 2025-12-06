import { auth, db, doc, getDoc, signOut } from '../firebase-config.js';

export function initAccountGuard() {
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            try {
                const userDocRef = doc(db, "users", user.uid);
                const userDoc = await getDoc(userDocRef);

                if (!userDoc.exists()) {
                    console.warn("User authenticated but no Firestore record found. Logging out (Account Deleted).");
                    await signOut(auth);
                    alert("Your account has been deleted by an administrator.");
                    window.location.href = 'login.html';
                }
            } catch (error) {
                console.error("Error checking account status:", error);
                // If we can't check, we probably shouldn't kick them out immediately to avoid false positives on network errors,
                // but for strict security, you might. For now, we log it.
            }
        }
    });
}
