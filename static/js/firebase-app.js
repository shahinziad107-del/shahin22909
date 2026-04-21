import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut, updateProfile } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, query, orderBy, where, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyB4m5vP4fCnNA8dGv1ZwVoR7cjVXzVsnF0",
  authDomain: "ajarli44c.firebaseapp.com",
  projectId: "ajarli44c",
  storageBucket: "ajarli44c.firebasestorage.app",
  messagingSenderId: "182083452883",
  appId: "1:182083452883:web:8abe75076a2b3834e0f926",
  measurementId: "G-G9FEH08PRN"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Router & Logic
document.addEventListener("DOMContentLoaded", () => {
    const defaultPage = window.location.pathname.endsWith('/') || window.location.pathname.includes('index.html');
    const isRegisterPage = window.location.pathname.includes('register.html');
    const path = window.location.pathname;

    // --- Auth Protection ---
    onAuthStateChanged(auth, (user) => {
        if (!user && !defaultPage && !isRegisterPage) {
            // Not logged in but trying to access protected page
            window.location.href = "index.html"; 
        } else if (user && (defaultPage || isRegisterPage)) {
            // Logged in but visiting login or register page
            window.location.href = "home.html";
        }

        // Display user email in account
        if (user && path.includes("account.html")) {
            const emailEl = document.getElementById('user-email');
            if (emailEl) emailEl.innerText = user.email;
            const nameEl = document.getElementById('user-name');
            if (nameEl) nameEl.innerText = user.displayName || user.email.split('@')[0];
        }
    });

    // --- Login Logic ---
    if (defaultPage) {
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const email = loginForm.querySelector('input[type="email"]').value;
                const password = loginForm.querySelector('input[type="password"]').value;
                try {
                    await signInWithEmailAndPassword(auth, email, password);
                } catch (error) {
                    alert("خطأ في تسجيل الدخول: البريد أو كلمة المرور غير صحيحة.");
                }
            });
        }
    }

    // --- Register Logic ---
    if (path.includes('register.html')) {
        const regForm = document.getElementById('register-form');
        if (regForm) {
            regForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const btn = regForm.querySelector('button[type="submit"]');
                btn.disabled = true;
                btn.innerHTML = 'جاري تسجيل الحساب... <i class="fa-solid fa-spinner fa-spin ms-2"></i>';

                const name = regForm.querySelector('#reg-name').value;
                const email = regForm.querySelector('#reg-email').value;
                const password = regForm.querySelector('#reg-password').value;
                
                try {
                    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                    // Update user profile with name
                    await updateProfile(userCredential.user, {
                        displayName: name
                    });
                    
                    // Redirect Handled by onAuthStateChanged globally!
                    window.location.href = "home.html";
                } catch (error) {
                    alert("حدث خطأ أثناء التسجيل: " + error.message);
                    btn.disabled = false;
                    btn.innerHTML = 'تسجيل الحساب <i class="fa-solid fa-user-plus ms-2"></i>';
                }
            });
        }
    }

    // --- Logout Logic ---
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            await signOut(auth);
            window.location.href = 'index.html';
        });
    }

    // --- Add Property Logic ---
    if (path.includes('add_property.html')) {
        const addForm = document.getElementById('add-property-form');
        if (addForm) {
            addForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                // Show loading
                const btn = addForm.querySelector('button[type="submit"]');
                btn.disabled = true;
                btn.innerHTML = 'جاري النشر...';

                try {
                    await addDoc(collection(db, "properties"), {
                        title: addForm.title.value,
                        price: parseFloat(addForm.price.value),
                        location: addForm.location.value,
                        description: addForm.description.value,
                        owner: auth.currentUser.uid,
                        createdAt: serverTimestamp()
                    });
                    window.location.href = 'home.html';
                } catch (error) {
                    alert('خطأ في إضافة العقار: ' + error.message);
                    btn.disabled = false;
                    btn.innerHTML = 'نشر العقار الآن <i class="fa-regular fa-paper-plane ms-2"></i>';
                }
            });
        }
    }

    // --- Load Properties in Home ---
    if (path.includes('home.html')) {
        const container = document.getElementById('properties-container');
        if (container) {
            loadProperties(container, false);
        }
    }

    // --- Load Properties in My Properties ---
    if (path.includes('my_properties.html')) {
        const container = document.getElementById('properties-container');
        if (container) {
            // Need to wait for auth state specifically for this
            const unsubscribe = onAuthStateChanged(auth, (user) => {
                if (user) {
                    loadProperties(container, true, user.uid);
                    unsubscribe();
                }
            });
        }
    }
});

async function loadProperties(container, userOnly, uid=null) {
    container.innerHTML = '<div class="col-12 text-center py-5"><div class="spinner-border text-primary"></div></div>';
    try {
        let q;
        if (userOnly) {
            q = query(collection(db, "properties"), where("owner", "==", uid), orderBy("createdAt", "desc"));
        } else {
            q = query(collection(db, "properties"), orderBy("createdAt", "desc"));
        }
        
        const querySnapshot = await getDocs(q);
        if (querySnapshot.empty) {
            container.innerHTML = `
            <div class="col-12 text-center py-5 reveal active">
                <i class="fa-solid fa-folder-open fs-1 text-muted mb-3"></i>
                <p class="text-muted fs-5">لا توجد عقارات مضافة حتى الآن.</p>
            </div>`;
            return;
        }

        let html = '';
        querySnapshot.forEach((doc) => {
            const prop = doc.data();
            const timeStr = prop.createdAt ? new Date(prop.createdAt.toDate()).toLocaleDateString('ar-EG') : 'اليوم';
            html += `
            <div class="col reveal active">
                <div class="property-card">
                    <div class="card-img-wrapper" style="height: 180px;">
                        <span class="price-tag bg-primary">${prop.price} ج.م</span>
                        <div class="property-image bg-secondary d-flex justify-content-center align-items-center text-white flex-column">
                            <i class="fa-solid fa-image fs-1 mb-2 opacity-50"></i>
                        </div>
                    </div>
                    
                    <div class="card-body container-fluid p-3">
                        <h4 class="card-title text-truncate mb-2 fs-5">${prop.title}</h4>
                        <div class="location-text mb-0 small">
                            <i class="fa-solid fa-location-dot"></i> ${prop.location}
                        </div>
                    </div>
                    
                    <div class="card-footer bg-light border-top-0 d-flex justify-content-between align-items-center p-3 gap-2">
                        <span class="text-muted small"><i class="fa-regular fa-clock ms-1"></i> ${timeStr}</span>
                    </div>
                </div>
            </div>`;
        });
        container.innerHTML = html;
    } catch (error) {
        console.error("Error getting documents: ", error);
        container.innerHTML = '<div class="col-12 text-center py-5 text-danger">حدث خطأ أثناء تحميل العقارات</div>';
    }
}
