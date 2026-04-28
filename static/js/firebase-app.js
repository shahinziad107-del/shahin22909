import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut, updateProfile } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, query, orderBy, where, serverTimestamp, doc, deleteDoc, getDoc, updateDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

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

    const ADMIN_EMAIL = "shahinziad107@gmail.com";

    // --- Auth Protection ---
    onAuthStateChanged(auth, (user) => {
        if (!user && !defaultPage && !isRegisterPage) {
            // Not logged in but trying to access protected page
            window.location.href = "index.html"; 
        } else if (user && (defaultPage || isRegisterPage)) {
            // Logged in but visiting login or register page
            window.location.href = "home.html";
        }

        // --- Admin Authorization ---
        if (path.includes('admin_panel.html')) {
            if (!user || user.email !== ADMIN_EMAIL) {
                window.location.href = "home.html"; // Kick unauthorized
            }
        }

        if (user && user.email === ADMIN_EMAIL && !path.includes('admin_panel.html')) {
            // Add Admin button to navbar automatically
            const navAuthButtons = document.querySelector('.d-flex.gx-2');
            if (navAuthButtons && !document.getElementById('admin-nav-btn')) {
                const adminBtn = document.createElement('a');
                adminBtn.href = 'admin_panel.html';
                adminBtn.id = 'admin-nav-btn';
                adminBtn.className = 'btn btn-danger rounded-pill px-4 shadow-sm active me-2 fw-bold text-white';
                adminBtn.innerHTML = '<i class="fa-solid fa-shield-halved ms-1"></i> الإدارة';
                navAuthButtons.prepend(adminBtn);
            }
            
            // On account page, hide 'My Properties' and show 'Admin Panel'
            if (path.includes('account.html')) {
                const myPropsBtn = document.querySelector('a[href="my_properties.html"]');
                if (myPropsBtn) myPropsBtn.style.display = 'none';
                
                const adminPanelLink = document.getElementById('admin-panel-link');
                if (adminPanelLink) adminPanelLink.classList.remove('d-none');
                if (adminPanelLink) adminPanelLink.classList.add('d-flex');
            }
        }

        // Display user email in account
        if (user && path.includes("account.html")) {
            const emailEl = document.getElementById('user-email');
            if (emailEl) emailEl.innerText = user.email;
            const nameEl = document.getElementById('user-name');
            if (nameEl) nameEl.innerText = user.displayName || user.email.split('@')[0];
            
            const avatarPreview = document.getElementById('account-avatar');
            const navAvatar = document.getElementById('nav-avatar');
            
            if (avatarPreview || navAvatar) {
                getDoc(doc(db, "users", user.uid)).then((docSnap) => {
                    const photo = (docSnap.exists() && docSnap.data().photo) ? docSnap.data().photo : user.photoURL;
                    if (photo) {
                        if (avatarPreview) {
                            avatarPreview.style.backgroundImage = `url('${photo}')`;
                            avatarPreview.innerHTML = '';
                        }
                        if (navAvatar) {
                            navAvatar.style.backgroundImage = `url('${photo}')`;
                            navAvatar.innerHTML = '';
                        }
                    }
                }).catch(e => console.log(e));
            }
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
                    
                    // Create user document with device tracking
                    await setDoc(doc(db, "users", userCredential.user.uid), {
                        email: email,
                        name: name,
                        userAgent: navigator.userAgent,
                        createdAt: serverTimestamp()
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
    const handleLogout = async (e) => {
        e.preventDefault();
        await signOut(auth);
        window.location.href = 'index.html';
    };

    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);

    const topLogoutBtn = document.getElementById('top-logout-btn');
    if (topLogoutBtn) topLogoutBtn.addEventListener('click', handleLogout);

    // --- Settings Logic ---
    if (path.includes('settings.html')) {
        const settingsForm = document.getElementById('settings-form');
        const picInput = document.getElementById('profile-pic-input');
        const avatarPreview = document.getElementById('avatar-preview');
        const nameInput = document.getElementById('display-name');
        
        let selectedBase64 = null;

        if (settingsForm) {
            onAuthStateChanged(auth, async (user) => {
                if (user) {
                    nameInput.value = user.displayName || '';
                    try {
                        const docSnap = await getDoc(doc(db, "users", user.uid));
                        if (docSnap.exists() && docSnap.data().photo) {
                            avatarPreview.style.backgroundImage = `url('${docSnap.data().photo}')`;
                            avatarPreview.innerHTML = '';
                        } else if (user.photoURL) {
                            avatarPreview.style.backgroundImage = `url('${user.photoURL}')`;
                            avatarPreview.innerHTML = '';
                        }
                    } catch (e) { console.log(e); }
                }
            });

            picInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (!file) return;

                const reader = new FileReader();
                reader.onload = (event) => {
                    const img = new Image();
                    img.onload = () => {
                        const canvas = document.createElement('canvas');
                        const MAX_SIZE = 150;
                        let width = img.width;
                        let height = img.height;

                        if (width > height) {
                            if (width > MAX_SIZE) {
                                height *= MAX_SIZE / width;
                                width = MAX_SIZE;
                            }
                        } else {
                            if (height > MAX_SIZE) {
                                width *= MAX_SIZE / height;
                                height = MAX_SIZE;
                            }
                        }
                        
                        canvas.width = width;
                        canvas.height = height;
                        const ctx = canvas.getContext('2d');
                        ctx.drawImage(img, 0, 0, width, height);
                        
                        selectedBase64 = canvas.toDataURL('image/webp', 0.8);
                        avatarPreview.style.backgroundImage = `url('${selectedBase64}')`;
                        avatarPreview.innerHTML = '';
                    };
                    img.src = event.target.result;
                };
                reader.readAsDataURL(file);
            });

            settingsForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const btn = document.getElementById('save-settings-btn');
                btn.disabled = true;
                btn.innerHTML = 'جاري الحفظ... <i class="fa-solid fa-spinner fa-spin ms-2"></i>';
                
                const user = auth.currentUser;
                if (!user) return;

                try {
                    const newName = nameInput.value;
                    const updates = {};
                    if(newName) updates.displayName = newName;
                    
                    if (Object.keys(updates).length > 0) {
                        await updateProfile(user, updates);
                    }
                    
                    const docSnap = await getDoc(doc(db, "users", user.uid));
                    const currentPhoto = docSnap.exists() ? docSnap.data().photo : null;
                    const finalPhoto = selectedBase64 || currentPhoto || user.photoURL || null;

                    await setDoc(doc(db, "users", user.uid), {
                        name: newName,
                        photo: finalPhoto,
                        userAgent: navigator.userAgent
                    }, { merge: true });

                    const q = query(collection(db, "properties"), where("owner", "==", user.uid));
                    const querySnapshot = await getDocs(q);
                    const updatePromises = [];
                    querySnapshot.forEach((documentSnap) => {
                        updatePromises.push(updateDoc(doc(db, "properties", documentSnap.id), {
                            authorName: newName,
                            authorPhoto: finalPhoto
                        }));
                    });
                    await Promise.all(updatePromises);

                    alert("تم حفظ بياناتك بنجاح!");
                    window.location.href = 'account.html';
                } catch (error) {
                    alert("خطأ: " + error.message);
                    btn.disabled = false;
                    btn.innerHTML = 'حفظ التعديلات <i class="fa-regular fa-floppy-disk ms-2"></i>';
                }
            });
        }
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
                    const selectedGov = addForm.governorate.value;
                    const selectedCity = addForm.city.value;
                    
                    const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
                    const userPhoto = userDoc.exists() ? userDoc.data().photo : (auth.currentUser.photoURL || null);

                    await addDoc(collection(db, "properties"), {
                        title: addForm.title.value,
                        price: parseFloat(addForm.price.value),
                        property_type: addForm.property_type.value,
                        rooms: parseInt(addForm.rooms.value),
                        bathrooms: parseInt(addForm.bathrooms.value),
                        governorate: selectedGov,
                        city: selectedCity,
                        location: `${selectedCity}، ${selectedGov}`,
                        whatsappNum: addForm.whatsapp.value,
                        description: addForm.description.value,
                        owner: auth.currentUser.uid,
                        authorName: auth.currentUser.displayName || auth.currentUser.email.split('@')[0],
                        authorPhoto: userPhoto,
                        authorDevice: navigator.userAgent,
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

    // --- Edit Property Logic ---
    if (path.includes('edit_property.html')) {
        const editForm = document.getElementById('edit-property-form');
        const urlParams = new URLSearchParams(window.location.search);
        const propId = urlParams.get('id');

        if (!propId) {
            window.location.href = 'my_properties.html';
        }

        if (editForm) {
            // Load existing data
            onAuthStateChanged(auth, async (user) => {
                if (user) {
                    try {
                        const docRef = doc(db, "properties", propId);
                        const docSnap = await getDoc(docRef);
                        
                        if (docSnap.exists() && docSnap.data().owner === user.uid) {
                            const data = docSnap.data();
                            editForm.title.value = data.title || '';
                            editForm.price.value = data.price || '';
                            editForm.property_type.value = data.property_type || '';
                            editForm.rooms.value = data.rooms || '';
                            editForm.bathrooms.value = data.bathrooms || '';
                            editForm.whatsapp.value = data.whatsappNum || '';
                            editForm.description.value = data.description || '';
                            
                            if (data.governorate) {
                                editForm.governorate.value = data.governorate;
                                editForm.governorate.dispatchEvent(new Event('change'));
                                if (data.city) {
                                    editForm.city.value = data.city;
                                }
                            }
                        } else {
                            alert("لا تملك صلاحية لتعديل هذا العقار أو العقار غير موجود");
                            window.location.href = 'my_properties.html';
                        }
                    } catch (err) {
                        console.error(err);
                    }
                }
            });

            editForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const btn = editForm.querySelector('button[type="submit"]');
                btn.disabled = true;
                btn.innerHTML = 'جاري الحفظ...';

                try {
                    const selectedGov = editForm.governorate.value;
                    const selectedCity = editForm.city.value;
                    
                    const docRef = doc(db, "properties", propId);
                    await updateDoc(docRef, {
                        title: editForm.title.value,
                        price: parseFloat(editForm.price.value),
                        property_type: editForm.property_type.value,
                        rooms: parseInt(editForm.rooms.value),
                        bathrooms: parseInt(editForm.bathrooms.value),
                        governorate: selectedGov,
                        city: selectedCity,
                        location: `${selectedCity}، ${selectedGov}`,
                        whatsappNum: editForm.whatsapp.value,
                        description: editForm.description.value
                    });
                    window.location.href = 'my_properties.html';
                } catch (error) {
                    alert('خطأ في التعديل: ' + error.message);
                    btn.disabled = false;
                    btn.innerHTML = 'حفظ التعديلات <i class="fa-regular fa-floppy-disk ms-2"></i>';
                }
            });
        }
    }

    // --- Property Detail Logic ---
    if (path.includes('property_detail.html')) {
        const container = document.getElementById('detail-container');
        const urlParams = new URLSearchParams(window.location.search);
        const propId = urlParams.get('id');

        if (!propId) {
            window.location.href = 'home.html';
        }

        if (container) {
            const loadDetail = async () => {
                try {
                    const docRef = doc(db, "properties", propId);
                    const docSnap = await getDoc(docRef);
                    
                    if (docSnap.exists()) {
                        const prop = docSnap.data();
                        const timeStr = prop.createdAt ? new Date(prop.createdAt.toDate()).toLocaleDateString('ar-EG') : 'اليوم';
                        
                        let whatsappBtn = '';
                        if (prop.whatsappNum) {
                            let formattedNum = prop.whatsappNum;
                            if(formattedNum.startsWith('0')) formattedNum = '2' + formattedNum;
                            whatsappBtn = `<a href="https://wa.me/${formattedNum}" target="_blank" class="btn btn-success btn-lg w-100 mt-4 shadow-sm fw-bold rounded-pill"><i class="fa-brands fa-whatsapp fs-3 ms-2 align-middle"></i> تواصل مع المالك واتساب</a>`;
                        }

                        container.innerHTML = `
                        <div class="property-card h-100 d-flex flex-column mb-4 pb-3" style="border:none; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
                            <div class="card-img-wrapper rounded-top" style="height: 350px;">
                                <span class="price-tag bg-primary fs-5 px-4 py-2">${prop.price} ج.م</span>
                                <div class="property-image bg-secondary d-flex justify-content-center align-items-center text-white h-100">
                                    <i class="fa-solid fa-image opacity-50" style="font-size: 5rem;"></i>
                                </div>
                            </div>
                            
                            <div class="card-body p-4 p-md-5 bg-white rounded-bottom">
                                <div class="d-flex justify-content-between align-items-start mb-3">
                                    <h1 class="card-title fw-bold fs-3 mb-0">${prop.title}</h1>
                                    <span class="badge ${prop.property_type === 'إيجار' ? 'bg-success' : 'bg-primary'} fs-6 px-3 py-2">${prop.property_type || 'غير محدد'}</span>
                                </div>
                                
                                <div class="location-text mb-4 text-muted fs-5">
                                    <i class="fa-solid fa-location-dot ms-1 text-danger"></i> ${prop.location}
                                </div>
                                <hr>
                                
                                <div class="row text-center mb-4 g-3">
                                    <div class="col-6 col-md-3">
                                        <div class="p-3 border rounded-3 bg-light shadow-sm">
                                            <i class="fa-solid fa-bed text-primary fs-3 mb-2"></i>
                                            <div class="fw-bold">الغرف</div>
                                            <div class="text-muted fs-5">${prop.rooms || '-'}</div>
                                        </div>
                                    </div>
                                    <div class="col-6 col-md-3">
                                        <div class="p-3 border rounded-3 bg-light shadow-sm">
                                            <i class="fa-solid fa-bath text-primary fs-3 mb-2"></i>
                                            <div class="fw-bold">الحمامات</div>
                                            <div class="text-muted fs-5">${prop.bathrooms || '-'}</div>
                                        </div>
                                    </div>
                                    <div class="col-6 col-md-3">
                                        <div class="p-3 border rounded-3 bg-light shadow-sm">
                                            <i class="fa-solid fa-calendar-days text-primary fs-3 mb-2"></i>
                                            <div class="fw-bold">تاريخ النشر</div>
                                            <div class="text-muted fs-6 mt-1">${timeStr}</div>
                                        </div>
                                    </div>
                                    <div class="col-6 col-md-3">
                                        <div class="p-3 border rounded-3 bg-light shadow-sm">
                                            <i class="fa-solid fa-tag text-primary fs-3 mb-2"></i>
                                            <div class="fw-bold">النوع</div>
                                            <div class="text-muted fs-6 mt-1">${prop.property_type || '-'}</div>
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="d-flex align-items-center mb-4 bg-light p-3 rounded-3 shadow-sm border border-light-subtle">
                                    <div style="width: 55px; height: 55px; border-radius: 50%; background-image: url('${prop.authorPhoto || ''}'); background-color: var(--secondary-color); background-size: cover; background-position: center; color: white; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; flex-shrink: 0;" class="me-3 ms-3">
                                        ${!prop.authorPhoto ? '<i class="fa-regular fa-user"></i>' : ''}
                                    </div>
                                    <div>
                                        <small class="text-muted d-block mb-1" style="font-size: 0.85rem;">تم النشر بواسطة</small>
                                        <span class="fw-bold fs-5 d-block lh-1 text-primary">${prop.authorName || 'مستخدم غير معروف'}</span>
                                    </div>
                                </div>
                                <h3 class="fw-bold border-bottom pb-2 mb-3 mt-4">تفاصيل العقار</h3>
                                <p class="text-muted lh-lg fs-5" style="white-space: pre-wrap;">${prop.description || 'لم يتم إضافة وصف لهذه المنشأة.'}</p>
                                
                                ${whatsappBtn}
                            </div>
                        </div>`;
                    } else {
                        container.innerHTML = '<div class="alert alert-danger text-center fs-5">عذراً، هذا العقار لم يعد متوفراً.</div>';
                    }
                } catch (err) {
                    console.error(err);
                    container.innerHTML = '<div class="alert alert-danger text-center fs-5">حدث خطأ في تحميل بيانات العقار.</div>';
                }
            };
            loadDetail();
        }
    }

    // --- Admin Panel Logic ---
    if (path.includes('admin_panel.html')) {
        const container = document.getElementById('admin-properties-container');
        const countEl = document.getElementById('total-properties-count');
        if (container) {
            onAuthStateChanged(auth, async (user) => {
                // Double check safety
                if (user && user.email === "shahinziad107@gmail.com") {
                    try {
                        const q = query(collection(db, "properties"), orderBy("createdAt", "desc"));
                        const querySnapshot = await getDocs(q);
                        
                        if (countEl) countEl.innerText = querySnapshot.size;

                        if (querySnapshot.empty) {
                           container.innerHTML = '<div class="col-12 text-center py-5 w-100"><p class="text-muted fs-5">لا توجد عقارات في الموقع.</p></div>';
                           return;
                        }

                        let html = '';
                        querySnapshot.forEach((docSnap) => {
                            const prop = docSnap.data();
                            const id = docSnap.id;
                            const timeStr = prop.createdAt ? new Date(prop.createdAt.toDate()).toLocaleDateString('ar-EG') : 'غير معروف';
                            html += `
                            <div class="col">
                                <div class="card h-100 shadow-sm border-0 border-top border-4 border-danger">
                                    <div class="card-body">
                                        <h5 class="fw-bold text-truncate">${prop.title}</h5>
                                        <p class="text-muted small mb-3"><i class="fa-solid fa-location-dot ms-1"></i> ${prop.location}</p>
                                        <p class="mb-1"><span class="fw-bold">السعر:</span> ${prop.price} ج.م</p>
                                        <p class="mb-1"><span class="fw-bold">النوع:</span> ${prop.property_type || '-'}</p>
                                        <p class="mb-0 text-muted small"><i class="fa-solid fa-clock ms-1"></i> أضيف في: ${timeStr}</p>
                                        <hr class="my-2 text-danger">
                                        <div class="d-flex align-items-center mb-2">
                                            <div style="width: 30px; height: 30px; border-radius: 50%; background-image: url('${prop.authorPhoto || ''}'); background-color: var(--secondary-color); background-size: cover; background-position: center; color: white; display: flex; align-items: center; justify-content: center; font-size: 0.9rem;" class="me-2 ms-2">
                                                ${!prop.authorPhoto ? '<i class="fa-regular fa-user"></i>' : ''}
                                            </div>
                                            <span class="fw-bold small text-primary text-truncate">${prop.authorName || 'مستخدم'}</span>
                                        </div>
                                        <p class="mb-0 text-muted" style="font-size: 0.7rem;"><i class="fa-solid fa-mobile-screen-button ms-1"></i> جهاز الدخول:</p>
                                        <p class="mb-0 text-muted text-break" style="font-size: 0.65rem; direction: ltr; text-align: left;">${prop.authorDevice || 'غير معروف'}</p>
                                    </div>
                                    <div class="card-footer bg-white border-0 p-3 pt-0 text-start">
                                        <button class="btn btn-danger btn-sm w-100 fw-bold admin-delete-btn" data-id="${id}">
                                            <i class="fa-solid fa-trash-can ms-1"></i> حذف هذا العقار
                                        </button>
                                    </div>
                                </div>
                            </div>
                            `;
                        });
                        container.innerHTML = html;

                        // Attach delete handlers
                        document.querySelectorAll('.admin-delete-btn').forEach(btn => {
                            btn.addEventListener('click', async (e) => {
                                if (confirm("تحذير: هل أنت متأكد من حذف هذا العقار بشكل نهائي من الموقع؟ لا يمكن التراجع!")) {
                                    const id = e.currentTarget.getAttribute('data-id');
                                    const cardEl = e.currentTarget.closest('.col');
                                    const currentBtn = e.currentTarget;
                                    
                                    currentBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin ms-1"></i> جاري الحذف...';
                                    currentBtn.disabled = true;
                                    try {
                                        await deleteDoc(doc(db, "properties", id));
                                        cardEl.remove();
                                        if (countEl) countEl.innerText = parseInt(countEl.innerText) - 1;
                                    } catch (err) {
                                        alert("خطأ أثناء الحذف: " + err.message);
                                        currentBtn.innerHTML = '<i class="fa-solid fa-trash-can ms-1"></i> حذف هذا العقار';
                                        currentBtn.disabled = false;
                                    }
                                }
                            });
                        });

                    } catch (error) {
                        console.error(error);
                        container.innerHTML = '<div class="alert alert-danger w-100 text-center mx-auto">حدث خطأ في جلب بيانات الموقع</div>';
                    }
                }
            });
        }
    }

    // --- Load Properties in Home ---
    if (path.includes('home.html')) {
        const container = document.getElementById('properties-container');
        if (container) {
            loadProperties(container, false);
            
            const searchForm = document.getElementById('search-form');
            if (searchForm) {
                searchForm.addEventListener('submit', (e) => {
                    e.preventDefault();
                    const govFilter = document.getElementById('search-governorate').value;
                    const cityFilter = document.getElementById('search-city').value;
                    const minPriceFilter = document.getElementById('search-min-price').value;
                    const maxPriceFilter = document.getElementById('search-max-price').value;
                    
                    loadProperties(container, false, null, {
                        governorate: govFilter,
                        city: cityFilter,
                        minPrice: minPriceFilter ? parseFloat(minPriceFilter) : null,
                        maxPrice: maxPriceFilter ? parseFloat(maxPriceFilter) : null
                    });
                    
                    // Close the modal
                    const searchModalEl = document.getElementById('searchModal');
                    if (searchModalEl) {
                        // Using bootstrap global object if available
                        if (typeof bootstrap !== 'undefined') {
                            const modalInstance = bootstrap.Modal.getInstance(searchModalEl);
                            if (modalInstance) modalInstance.hide();
                        } else {
                            const closeBtn = searchModalEl.querySelector('.btn-close');
                            if (closeBtn) closeBtn.click();
                        }
                    }
                    
                    setTimeout(() => {
                        const target = document.getElementById('properties-container');
                        if (target) {
                            const y = target.getBoundingClientRect().top + window.scrollY - 100;
                            window.scrollTo({top: y, behavior: 'smooth'});
                        }
                    }, 400);
                });
            }
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

async function loadProperties(container, userOnly, uid=null, filters=null) {
    container.innerHTML = '<div class="col-12 text-center py-5"><div class="spinner-border text-primary"></div></div>';
    try {
        let q;
        if (userOnly) {
            // Bypassing composite index requirement for user properties
            q = query(collection(db, "properties"), where("owner", "==", uid));
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

        // Convert to array for local sorting (avoiding composite index error)
        let properties = [];
        querySnapshot.forEach(doc => properties.push({ id: doc.id, ...doc.data() }));
        
        if (userOnly) {
            properties.sort((a, b) => {
                const timeA = a.createdAt ? a.createdAt.toMillis() : 0;
                const timeB = b.createdAt ? b.createdAt.toMillis() : 0;
                return timeB - timeA; // Descending
            });
        }

        if (filters) {
            properties = properties.filter(prop => {
                let match = true;
                if (filters.governorate) {
                    if (prop.governorate !== filters.governorate) {
                        match = false;
                    }
                }
                if (filters.city) {
                    if (prop.city !== filters.city) {
                        match = false;
                    }
                }
                if (filters.minPrice !== null && !isNaN(filters.minPrice)) {
                    if (prop.price < filters.minPrice) match = false;
                }
                if (filters.maxPrice !== null && !isNaN(filters.maxPrice)) {
                    if (prop.price > filters.maxPrice) match = false;
                }
                return match;
            });

            if (properties.length === 0) {
                container.innerHTML = `
                <div class="col-12 text-center py-5 reveal active">
                    <i class="fa-solid fa-magnifying-glass fs-1 text-muted mb-3"></i>
                    <p class="text-muted fs-5">لا توجد عقارات مطابقة لعملية البحث.</p>
                </div>`;
                return;
            }
        }

        let html = '';
        properties.forEach((prop) => {
            const timeStr = prop.createdAt ? new Date(prop.createdAt.toDate()).toLocaleDateString('ar-EG') : 'اليوم';
            let actionButtons = `<a href="property_detail.html?id=${prop.id}" class="btn btn-outline-primary btn-sm flex-grow-1 fw-bold shadow-sm rounded-pill"><i class="fa-solid fa-circle-info ms-1"></i> التفاصيل</a>`;
            
            if (prop.whatsappNum && !userOnly) {
                let formattedNum = prop.whatsappNum;
                if(formattedNum.startsWith('0')) {
                    formattedNum = '2' + formattedNum;
                }
                actionButtons += `<a href="https://wa.me/${formattedNum}" target="_blank" class="btn btn-success btn-sm flex-grow-1 fw-bold shadow-sm rounded-pill"><i class="fa-brands fa-whatsapp fs-5 ms-1"></i> واتساب</a>`;
            }

            let controlsHtml = '';
            if (userOnly) {
                controlsHtml = `
                <div class="card-footer bg-light border-top-0 d-flex justify-content-between align-items-center p-3 gap-2">
                    <a href="edit_property.html?id=${prop.id}" class="btn btn-sm btn-warning rounded-pill flex-grow-1 text-white fw-bold">
                        <i class="fa-regular fa-pen-to-square ms-1"></i> تعديل
                    </a>
                    <button class="btn btn-sm btn-danger rounded-pill delete-prop-btn shadow-sm" data-id="${prop.id}">
                        <i class="fa-regular fa-trash-can"></i>
                    </button>
                </div>`;
            } else {
                controlsHtml = `
                <div class="card-footer bg-light border-top-0 p-3">
                    <div class="text-muted small mb-3"><i class="fa-regular fa-clock ms-1"></i> ${timeStr}</div>
                    <div class="d-flex gap-2">
                        ${actionButtons}
                    </div>
                </div>`;
            }

            html += `
            <div class="col reveal active mb-4">
                <div class="property-card h-100 d-flex flex-column">
                    <div class="card-img-wrapper" style="height: 180px;">
                        <span class="price-tag bg-primary">${prop.price} ج.م</span>
                        <div class="property-image bg-secondary d-flex justify-content-center align-items-center text-white flex-column h-100">
                            <i class="fa-solid fa-image fs-1 mb-2 opacity-50"></i>
                        </div>
                    </div>
                    
                    <div class="card-body container-fluid p-3 flex-grow-1">
                        <div class="d-flex align-items-center mb-3 pb-2 border-bottom">
                            <div style="width: 35px; height: 35px; border-radius: 50%; background-image: url('${prop.authorPhoto || ''}'); background-color: var(--secondary-color); background-size: cover; background-position: center; color: white; display: flex; align-items: center; justify-content: center; font-size: 1rem; flex-shrink: 0;" class="me-2 ms-2">
                                ${!prop.authorPhoto ? '<i class="fa-regular fa-user"></i>' : ''}
                            </div>
                            <div class="text-truncate">
                                <small class="text-muted d-block lh-1 mb-1" style="font-size: 0.7rem;">ناشر العقار</small>
                                <span class="fw-bold d-block lh-1 text-primary text-truncate" style="font-size: 0.9rem;">${prop.authorName || 'مستخدم غير معروف'}</span>
                            </div>
                        </div>
                        <h4 class="card-title text-truncate mb-2 fs-5">${prop.title}</h4>
                        <div class="location-text mb-2 small text-muted">
                            <i class="fa-solid fa-location-dot"></i> ${prop.location}
                        </div>
                        <div class="d-flex justify-content-between align-items-center border-top pt-2 mt-2 small text-muted">
                            <span title="عدد الغرف" class="fw-bold"><i class="fa-solid fa-bed text-primary ms-1"></i>${prop.rooms || '-'}</span>
                            <span title="عدد الحمامات" class="fw-bold"><i class="fa-solid fa-bath text-primary ms-1"></i>${prop.bathrooms || '-'}</span>
                            <span class="badge ${prop.property_type === 'إيجار' ? 'bg-success' : 'bg-primary'}">${prop.property_type || 'غير محدد'}</span>
                        </div>
                    </div>
                    
                    ${controlsHtml}
                </div>
            </div>`;
        });
        container.innerHTML = html;

        if (userOnly) {
            document.querySelectorAll('.delete-prop-btn').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    if(confirm("هل أنت متأكد من حذف هذا العقار حقاً؟ لا يمكن التراجع عن هذا الإجراء.")) {
                        const id = e.currentTarget.getAttribute('data-id');
                        const cardElement = e.currentTarget.closest('.col');
                        try {
                            // Using the imported doc, deleteDoc
                            await deleteDoc(doc(db, "properties", id));
                            cardElement.remove();
                        } catch (err) {
                            alert("حدث خطأ أثناء الحذف: " + err.message);
                        }
                    }
                });
            });
        }
    } catch (error) {
        console.error("Error getting documents: ", error);
        container.innerHTML = '<div class="col-12 text-center py-5 text-danger">حدث خطأ أثناء تحميل العقارات</div>';
    }
}
