import { auth, db, createUserWithEmailAndPassword, signInWithEmailAndPassword, doc, setDoc, updateProfile, signOut, setPersistence, browserLocalPersistence } from '../firebase-config.js';

// Register Form Handler
const registerForm = document.getElementById('register-form');
if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const name = document.getElementById('name').value;
        const email = document.getElementById('email').value;
        const phone = document.getElementById('phone').value;
        const password = document.getElementById('password').value;
        const role = 'user'; // Default role
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
                createdAt: new Date().toISOString()
            });

            await signOut(auth);
            alert('Account created successfully! Please log in.');
            window.location.href = 'login.html';

        } catch (error) {
            console.error("Error registering user:", error);
            alert(error.message);
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

            // Ensure Local Persistence for login
            await setPersistence(auth, browserLocalPersistence);

            await signInWithEmailAndPassword(auth, email, password);

            // Redirect based on role could be added here, for now go to dashboard
            window.location.href = 'dashboard.html';

        } catch (error) {
            console.error("Error logging in:", error);
            alert("Invalid email or password.");
            submitBtn.innerHTML = 'Log In';
            submitBtn.disabled = false;
        }
    });
}
