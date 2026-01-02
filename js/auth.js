import { auth, db, createUserWithEmailAndPassword, signInWithEmailAndPassword, doc, setDoc, getDoc, updateProfile, signOut, setPersistence, browserLocalPersistence, browserSessionPersistence } from '../firebase-config.js';

// Register Form Handler
const registerForm = document.getElementById('register-form');
if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const name = document.getElementById('name').value;
        const email = document.getElementById('email').value.toLowerCase();
        const phone = document.getElementById('phone').value;
        const password = document.getElementById('password').value;

        let role = 'user';
        let status = 'approved';

        if (email.endsWith('.driver@tuktuk.com')) {
            role = 'driver';
            status = 'pending';
        }

        const submitBtn = registerForm.querySelector('button[type="submit"]');

        try {
            submitBtn.innerHTML = 'Creating Account...';
            submitBtn.disabled = true;

            // Ensure Local Persistence for new accounts too
            await setPersistence(auth, browserLocalPersistence);

            // Create Auth User
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Update Profile Display Name
            await updateProfile(user, {
                displayName: name
            });

            // Store User Data in Firestore
            await setDoc(doc(db, "users", user.uid), {
                uid: user.uid,
                name: name,
                email: email,
                phone: phone,
                role: role,
                status: status, // pending or approved
                createdAt: new Date().toISOString()
            });

            // If pending, sign out immediately
            if (status === 'pending') {
                await signOut(auth);
                showNotification('info', 'Verification Required', 'Account created! Please wait for admin approval.');
                window.location.href = 'login.html';
            } else {
                await signOut(auth); // Force re-login or auto-login? Original code had signOut then login.html
                showNotification('success', 'Account Created', 'Registration successful! Please log in.');
                window.location.href = 'login.html';
            }

        } catch (error) {
            console.error("Error registering user:", error);
            showNotification('error', 'Registration Failed', error.message);
            submitBtn.innerHTML = 'Sign Up';
            submitBtn.disabled = false;
        }
    });
}

// Login Form Handler
const loginForm = document.getElementById('login-form');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const submitBtn = loginForm.querySelector('button[type="submit"]');

        try {
            submitBtn.innerHTML = 'Logging In...';
            submitBtn.disabled = true;

            // 1. Determine Persistence (Session vs Local)
            const rememberMe = document.getElementById('remember-me').checked;
            const persistenceType = rememberMe ? browserLocalPersistence : browserSessionPersistence;

            await setPersistence(auth, persistenceType);

            // 2. Sign In
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // 3. Check Firestore for Verification Status
            const userDocSnap = await getDoc(doc(db, "users", user.uid));
            if (userDocSnap.exists()) {
                const userData = userDocSnap.data();

                // Check if driver is pending
                // We check role explicitly or assume restricted status applies to anyone labeled pending
                if (userData.status === 'pending') {
                    await signOut(auth);
                    throw new Error("Your account is pending verification. Please contact admin.");
                }

                // Redirect based on role
                const role = userData.role || (user.email.endsWith('.driver@tuktuk.com') ? 'driver' : 'user');

                if (role === 'driver') {
                    window.location.href = 'driver-dashboard.html';
                } else {
                    window.location.href = 'dashboard.html';
                }
            } else {
                // Fallback if no doc
                window.location.href = 'dashboard.html';
            }

        } catch (error) {
            console.error("Error logging in:", error);
            showNotification('error', 'Login Failed', error.message || "Invalid email or password.");
            submitBtn.innerHTML = 'Log In';
            submitBtn.disabled = false;
        }
    });
}
