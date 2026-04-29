import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut, updateProfile } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, query, orderBy, where, serverTimestamp, doc, deleteDoc, getDoc, updateDoc, setDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

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

// Image Processing Helpers
function resizeAndConvertToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 800;
                const MAX_HEIGHT = 800;
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > MAX_WIDTH) {
                        height *= MAX_WIDTH / width;
                        width = MAX_WIDTH;
                    }
                } else {
                    if (height > MAX_HEIGHT) {
                        width *= MAX_HEIGHT / height;
                        height = MAX_HEIGHT;
                    }
                }
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                // Compress to JPEG with 0.6 quality to save space
                resolve(canvas.toDataURL('image/jpeg', 0.6));
            };
            img.onerror = (err) => reject(err);
        };
        reader.onerror = (err) => reject(err);
    });
}

function setupImageUpload(inputEl, previewContainerEl) {
    inputEl.base64Images = []; // store base64 array here
    inputEl.addEventListener('change', async (e) => {
        const files = Array.from(e.target.files);
        if (files.length > 3) {
            alert("الحد الأقصى هو 3 صور فقط.");
            e.target.value = '';
            previewContainerEl.innerHTML = '';
            inputEl.base64Images = [];
            return;
        }
        
        previewContainerEl.innerHTML = '<div class="w-100 text-center"><i class="fa-solid fa-spinner fa-spin"></i> جاري معالجة و ضغط الصور...</div>';
        const base64Images = [];
        
        for (let file of files) {
            try {
                const b64 = await resizeAndConvertToBase64(file);
                base64Images.push(b64);
            } catch (err) {
                console.error("Error processing image", err);
            }
        }
        
        previewContainerEl.innerHTML = '';
        base64Images.forEach((b64) => {
            const imgWrap = document.createElement('div');
            imgWrap.style.width = '100px';
            imgWrap.style.height = '100px';
            imgWrap.style.backgroundImage = `url('${b64}')`;
            imgWrap.style.backgroundSize = 'cover';
            imgWrap.style.backgroundPosition = 'center';
            imgWrap.className = 'border rounded shadow-sm';
            previewContainerEl.appendChild(imgWrap);
        });
        
        inputEl.base64Images = base64Images;
    });
}

// Router & Logic
document.addEventListener("DOMContentLoaded", () => {
    const isIntroPage = window.location.pathname.endsWith('/') || window.location.pathname.includes('index.html');
    const isLoginPage = window.location.pathname.includes('login.html');
    const isRegisterPage = window.location.pathname.includes('register.html');
    const isHomePage = window.location.pathname.includes('home.html');
    const path = window.location.pathname;

    const ADMIN_EMAIL = "shahinziad107@gmail.com";

    // --- Guest Mode Interceptor ---
    document.body.addEventListener('click', (e) => {
        if (document.body.classList.contains('guest-mode')) {
            const link = e.target.closest('a') || e.target.closest('button');
            if (link) {
                if (link.classList.contains('theme-btn') || link.closest('.glass-theme-toggle') || link.id === 'theme-toggle') {
                    return; 
                }
                const href = link.getAttribute('href');
                if (href && (href.includes('login.html') || href.includes('index.html') || href.includes('register.html') || href === '#')) {
                    // Check if it's a specific protected action disguised as a '#' link
                    const isSearchModal = link.getAttribute('data-bs-target') === '#searchModal';
                    const isChat = link.classList.contains('chat-toggle-btn') || link.getAttribute('data-action') === 'toggle-chat';
                    if (!isSearchModal && !isChat) {
                        return; // Allow generic # links if they aren't protected
                    }
                }
                
                const isProtectedHref = href && (href.includes('property_detail.html') || href.includes('add_property.html') || href.includes('account.html') || href.includes('my_properties.html'));
                const isSearchModal = link.getAttribute('data-bs-target') === '#searchModal';
                const isChat = link.classList.contains('chat-toggle-btn') || link.getAttribute('data-action') === 'toggle-chat';
                
                if (isProtectedHref || isSearchModal || isChat) {
                    e.preventDefault();
                    e.stopPropagation();
                    window.location.href = 'login.html';
                }
            }
        }
    }, true);

    // --- Auth Protection ---
    onAuthStateChanged(auth, (user) => {
        if (!user) {
            document.body.classList.add('guest-mode');
            if (!isIntroPage && !isLoginPage && !isRegisterPage && !isHomePage) {
                // Not logged in but trying to access protected page
                window.location.href = "login.html"; 
                return;
            }
        } else {
            document.body.classList.remove('guest-mode');
            if (isIntroPage || isLoginPage || isRegisterPage) {
                // Logged in but visiting login or register or intro page
                window.location.href = "home.html";
                return;
            }
        }
        
        if (user) {
            getDoc(doc(db, "users", user.uid)).then(docSnap => {
                if (docSnap.exists() && docSnap.data().banned) {
                    alert("عذراً، لقد تم حظر حسابك نهائياً من قبل الإدارة.");
                    signOut(auth).then(() => {
                        window.location.href = 'login.html';
                    });
                    return;
                }
                
                if (typeof initChatWidget === "function") {
                    initChatWidget(user);
                }
            }).catch(err => console.error("Error checking ban status", err));
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
    if (path.includes('login.html')) {
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
        window.location.href = 'login.html';
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
            const imagesInput = document.getElementById('images-input');
            const previewContainer = document.getElementById('image-preview-container');
            if (imagesInput && previewContainer) {
                setupImageUpload(imagesInput, previewContainer);
            }

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

                    const base64Images = imagesInput && imagesInput.base64Images ? imagesInput.base64Images : [];

                    await addDoc(collection(db, "properties"), {
                        title: addForm.title.value,
                        price: parseFloat(addForm.price.value),
                        property_type: addForm.property_type.value,
                        rooms: parseInt(addForm.rooms.value),
                        bathrooms: parseInt(addForm.bathrooms.value),
                        area: parseInt(addForm.area.value),
                        images: base64Images,
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
                            if (editForm.area) editForm.area.value = data.area || '';
                            editForm.whatsapp.value = data.whatsappNum || '';
                            editForm.description.value = data.description || '';
                            
                            const imagesInput = document.getElementById('images-input');
                            const previewContainer = document.getElementById('image-preview-container');
                            if (imagesInput && previewContainer) {
                                setupImageUpload(imagesInput, previewContainer);
                                if (data.images && data.images.length > 0) {
                                    imagesInput.base64Images = data.images;
                                    data.images.forEach(b64 => {
                                        const imgWrap = document.createElement('div');
                                        imgWrap.style.width = '100px';
                                        imgWrap.style.height = '100px';
                                        imgWrap.style.backgroundImage = `url('${b64}')`;
                                        imgWrap.style.backgroundSize = 'cover';
                                        imgWrap.style.backgroundPosition = 'center';
                                        imgWrap.className = 'border rounded shadow-sm';
                                        previewContainer.appendChild(imgWrap);
                                    });
                                }
                            }
                            
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
                    
                    const imagesInput = document.getElementById('images-input');
                    const base64Images = imagesInput && imagesInput.base64Images ? imagesInput.base64Images : [];
                    
                    const updateData = {
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
                    };
                    if (editForm.area && editForm.area.value) {
                        updateData.area = parseInt(editForm.area.value);
                    }
                    if (base64Images.length > 0) {
                        updateData.images = base64Images;
                    }
                    
                    await updateDoc(docRef, updateData);
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

                        let imagesHtml = '';
                        if (prop.images && prop.images.length > 0) {
                            if (prop.images.length === 1) {
                                imagesHtml = `<div class="property-image h-100 w-100" style="background-image: url('${prop.images[0]}'); background-size: cover; background-position: center;"></div>`;
                            } else {
                                let indicators = '';
                                let items = '';
                                prop.images.forEach((img, i) => {
                                    indicators += `<button type="button" data-bs-target="#propertyCarousel" data-bs-slide-to="${i}" class="${i===0?'active':''}"></button>`;
                                    items += `<div class="carousel-item h-100 w-100 ${i===0?'active':''}" style="background-image: url('${img}'); background-size: cover; background-position: center;"></div>`;
                                });
                                imagesHtml = `
                                <div id="propertyCarousel" class="carousel slide h-100 w-100" data-bs-ride="carousel">
                                    <div class="carousel-indicators">${indicators}</div>
                                    <div class="carousel-inner h-100 w-100">${items}</div>
                                    <button class="carousel-control-prev" type="button" data-bs-target="#propertyCarousel" data-bs-slide="prev">
                                        <span class="carousel-control-prev-icon" aria-hidden="true"></span>
                                        <span class="visually-hidden">السابق</span>
                                    </button>
                                    <button class="carousel-control-next" type="button" data-bs-target="#propertyCarousel" data-bs-slide="next">
                                        <span class="carousel-control-next-icon" aria-hidden="true"></span>
                                        <span class="visually-hidden">التالي</span>
                                    </button>
                                </div>`;
                            }
                        } else {
                            imagesHtml = `<div class="property-image bg-secondary d-flex justify-content-center align-items-center text-white h-100">
                                <i class="fa-solid fa-image opacity-50" style="font-size: 5rem;"></i>
                            </div>`;
                        }

                        container.innerHTML = `
                        <div class="property-card h-100 d-flex flex-column mb-4 pb-3" style="border:none; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
                            <div class="card-img-wrapper rounded-top position-relative" style="height: 350px; overflow: hidden;">
                                <span class="price-tag bg-primary fs-5 px-4 py-2">${prop.price} ج.م</span>
                                ${imagesHtml}
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
                                
                                <div class="row row-cols-2 row-cols-md-3 row-cols-lg-5 text-center mb-4 g-3">
                                    <div class="col">
                                        <div class="p-3 border rounded-3 bg-light shadow-sm h-100">
                                            <i class="fa-solid fa-bed text-primary fs-3 mb-2"></i>
                                            <div class="fw-bold">الغرف</div>
                                            <div class="text-muted fs-5">${prop.rooms || '-'}</div>
                                        </div>
                                    </div>
                                    <div class="col">
                                        <div class="p-3 border rounded-3 bg-light shadow-sm h-100">
                                            <i class="fa-solid fa-bath text-primary fs-3 mb-2"></i>
                                            <div class="fw-bold">الحمامات</div>
                                            <div class="text-muted fs-5">${prop.bathrooms || '-'}</div>
                                        </div>
                                    </div>
                                    <div class="col">
                                        <div class="p-3 border rounded-3 bg-light shadow-sm h-100">
                                            <i class="fa-solid fa-ruler-combined text-primary fs-3 mb-2"></i>
                                            <div class="fw-bold">المساحة</div>
                                            <div class="text-muted fs-5">${prop.area ? prop.area + ' م²' : '-'}</div>
                                        </div>
                                    </div>
                                    <div class="col">
                                        <div class="p-3 border rounded-3 bg-light shadow-sm h-100">
                                            <i class="fa-solid fa-calendar-days text-primary fs-3 mb-2"></i>
                                            <div class="fw-bold">النشر</div>
                                            <div class="text-muted fs-6 mt-1">${timeStr}</div>
                                        </div>
                                    </div>
                                    <div class="col">
                                        <div class="p-3 border rounded-3 bg-light shadow-sm h-100">
                                            <i class="fa-solid fa-tag text-primary fs-3 mb-2"></i>
                                            <div class="fw-bold">النوع</div>
                                            <div class="text-muted fs-6 mt-1">${prop.property_type || '-'}</div>
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="d-flex align-items-center mb-4 bg-light p-3 rounded-4 border">
                                    <a href="user_profile.html?id=${prop.owner}" style="width: 55px; height: 55px; border-radius: 50%; background-image: url('${prop.authorPhoto || ''}'); background-color: var(--secondary-color); background-size: cover; background-position: center; color: white; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; flex-shrink: 0; text-decoration:none;" class="me-3 ms-3">
                                        ${!prop.authorPhoto ? '<i class="fa-regular fa-user"></i>' : ''}
                                    </a>
                                    <div class="flex-grow-1">
                                        <span class="text-muted small d-block mb-1">صاحب الإعلان</span>
                                        <a href="user_profile.html?id=${prop.owner}" class="fw-bold fs-5 d-block lh-1 text-primary text-decoration-none">${prop.authorName || 'مستخدم غير معروف'}</a>
                                    </div>
                                </div>
                                <h3 class="fw-bold border-bottom pb-2 mb-3 mt-4">تفاصيل العقار</h3>
                                <p class="text-muted lh-lg fs-5" style="white-space: pre-wrap;">${prop.description || 'لم يتم إضافة وصف لهذه المنشأة.'}</p>
                                
                                ${whatsappBtn}
                                <button onclick="startChatWith('${prop.owner}', '${(prop.authorName || 'مستخدم غير معروف').replace(/'/g, "\\'")}', '${(prop.authorPhoto || '').replace(/'/g, "\\'")}')" class="btn btn-primary btn-lg w-100 mt-3 shadow-sm fw-bold rounded-pill">
                                    <i class="fa-solid fa-comment-dots fs-4 ms-2 align-middle"></i> تواصل عبر الموقع
                                </button>
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
            
            if (!userOnly) {
                actionButtons += `<button onclick="startChatWith('${prop.owner}', '${(prop.authorName || 'مستخدم غير معروف').replace(/'/g, "\\'")}', '${(prop.authorPhoto || '').replace(/'/g, "\\'")}')" class="btn btn-primary btn-sm flex-grow-1 fw-bold shadow-sm rounded-pill"><i class="fa-solid fa-comment-dots fs-5 ms-1"></i> تواصل بالموقع</button>`;
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
                    <div class="card-img-wrapper position-relative" style="height: 180px; overflow: hidden;">
                        <span class="price-tag bg-primary">${prop.price} ج.م</span>
                        ${(prop.images && prop.images.length > 0) ? `<div class="property-image h-100 w-100" style="background-image: url('${prop.images[0]}'); background-size: cover; background-position: center;"></div>` : `<div class="property-image bg-secondary d-flex justify-content-center align-items-center text-white flex-column h-100"><i class="fa-solid fa-image fs-1 mb-2 opacity-50"></i></div>`}
                    </div>
                    
                    <div class="card-body container-fluid p-3 flex-grow-1">
                        <div class="d-flex align-items-center mb-3 pb-2 border-bottom">
                            <a href="user_profile.html?id=${prop.owner}" style="width: 35px; height: 35px; border-radius: 50%; background-image: url('${prop.authorPhoto || ''}'); background-color: var(--secondary-color); background-size: cover; background-position: center; color: white; display: flex; align-items: center; justify-content: center; font-size: 1rem; flex-shrink: 0; text-decoration:none;" class="me-2 ms-2">
                                ${!prop.authorPhoto ? '<i class="fa-regular fa-user"></i>' : ''}
                            </a>
                            <div class="text-truncate">
                                <small class="text-muted d-block lh-1 mb-1" style="font-size: 0.7rem;">ناشر العقار</small>
                                <a href="user_profile.html?id=${prop.owner}" class="fw-bold d-block lh-1 text-primary text-truncate text-decoration-none" style="font-size: 0.9rem;">${prop.authorName || 'مستخدم غير معروف'}</a>
                            </div>
                        </div>
                        <h4 class="card-title text-truncate mb-2 fs-5">${prop.title}</h4>
                        <div class="location-text mb-2 small text-muted">
                            <i class="fa-solid fa-location-dot"></i> ${prop.location}
                        </div>
                        <div class="d-flex justify-content-between align-items-center border-top pt-2 mt-2 small text-muted">
                            <span title="عدد الغرف" class="fw-bold"><i class="fa-solid fa-bed text-primary ms-1"></i>${prop.rooms || '-'}</span>
                            <span title="عدد الحمامات" class="fw-bold"><i class="fa-solid fa-bath text-primary ms-1"></i>${prop.bathrooms || '-'}</span>
                            <span title="المساحة" class="fw-bold"><i class="fa-solid fa-ruler-combined text-primary ms-1"></i>${prop.area ? prop.area + 'م²' : '-'}</span>
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


let chatInitialized = false;
let currentChatId = null;
let chatsUnsubscribe = null;
let currentChatUnsubscribe = null;

function initChatWidget(user) {
    if (chatInitialized) return;
    chatInitialized = true;

    // Inject HTML
    const chatHtml = `
    <div id="global-chat-widget" class="chat-widget-container">
        <div class="chat-header">
            <div class="fw-bold" id="chat-header-title"><i class="fa-solid fa-comment-dots ms-2"></i> الرسائل</div>
            <div>
                <button class="chat-back-btn d-none" id="chat-back-btn" title="رجوع"><i class="fa-solid fa-arrow-right"></i></button>
                <button class="chat-back-btn" id="chat-close-btn" title="إغلاق"><i class="fa-solid fa-times"></i></button>
            </div>
        </div>
        <div class="chat-body" id="chat-body">
            <div class="text-center text-muted mt-5"><i class="fa-solid fa-spinner fa-spin"></i> جاري التحميل...</div>
        </div>
        <div class="chat-footer d-none" id="chat-footer">
            <form id="chat-input-form" class="chat-input-group">
                <input type="text" id="chat-msg-input" class="chat-input" placeholder="اكتب رسالة..." required autocomplete="off">
                <button type="submit" class="chat-send-btn" title="إرسال"><i class="fa-solid fa-paper-plane"></i></button>
            </form>
        </div>
    </div>
    `;
    document.body.insertAdjacentHTML('beforeend', chatHtml);

    const widget = document.getElementById('global-chat-widget');
    const closeBtn = document.getElementById('chat-close-btn');
    const backBtn = document.getElementById('chat-back-btn');
    const body = document.getElementById('chat-body');
    const footer = document.getElementById('chat-footer');
    const form = document.getElementById('chat-input-form');
    const input = document.getElementById('chat-msg-input');
    const title = document.getElementById('chat-header-title');

    // Load chats in background immediately!
    loadChatsList(user.uid, body, footer, backBtn, title);

    // Toggle logic
    document.querySelectorAll('.chat-toggle-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            widget.classList.toggle('active');
        });
    });

    closeBtn.addEventListener('click', () => {
        widget.classList.remove('active');
    });

    backBtn.addEventListener('click', () => {
        if(currentChatUnsubscribe) {
            currentChatUnsubscribe();
            currentChatUnsubscribe = null;
        }
        currentChatId = null;
        footer.classList.add('d-none');
        backBtn.classList.add('d-none');
        title.innerHTML = '<i class="fa-solid fa-comment-dots ms-2"></i> الرسائل';
        loadChatsList(user.uid, body, footer, backBtn, title);
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const text = input.value.trim();
        if (!text || !currentChatId) return;

        input.value = '';
        try {
            await addDoc(collection(db, "chats", currentChatId, "messages"), {
                senderId: user.uid,
                text: text,
                createdAt: serverTimestamp()
            });
            await updateDoc(doc(db, "chats", currentChatId), {
                lastMessage: text,
                updatedAt: serverTimestamp()
            });
        } catch(err) {
            console.error("Error sending message", err);
        }
    });
}

function loadChatsList(myUid, body, footer, backBtn, title) {
    footer.classList.add('d-none');
    backBtn.classList.add('d-none');
    title.innerHTML = '<i class="fa-solid fa-comment-dots ms-2"></i> الرسائل';
    body.innerHTML = '<div class="text-center text-muted mt-5"><i class="fa-solid fa-spinner fa-spin"></i> جاري التحميل...</div>';

    if(chatsUnsubscribe) chatsUnsubscribe();
    
    // Memory sorting (No orderBy means no composite index needed)
    const q = query(collection(db, "chats"), where("participants", "array-contains", myUid));
    
    chatsUnsubscribe = onSnapshot(q, (snapshot) => {
        if(currentChatId) return; 

        if (snapshot.empty) {
            body.innerHTML = '<div class="text-center text-muted mt-5">لا توجد محادثات حتى الآن.</div>';
            return;
        }

        let chatsData = [];
        snapshot.forEach(docSnap => {
            chatsData.push({ id: docSnap.id, ...docSnap.data() });
        });
        
        // Sort in memory (descending by updatedAt)
        chatsData.sort((a, b) => {
            const timeA = a.updatedAt ? a.updatedAt.toMillis() : 0;
            const timeB = b.updatedAt ? b.updatedAt.toMillis() : 0;
            return timeB - timeA;
        });

        let html = '';
        chatsData.forEach(data => {
            const otherUid = (data.participants || []).find(id => id !== myUid) || 'unknown';
            const otherUser = data.participantDetails && data.participantDetails[otherUid] ? data.participantDetails[otherUid] : {name: 'مستخدم', photo: ''};
            
            html += `
            <div class="chat-list-item" data-id="${data.id}" data-other="${otherUid}" data-name="${otherUser.name || 'مستخدم'}">
                <a href="user_profile.html?id=${otherUid}" class="chat-list-avatar" style="background-image: url('${otherUser.photo || ''}'); text-decoration:none;">
                    ${!otherUser.photo ? '<i class="fa-regular fa-user"></i>' : ''}
                </a>
                <div class="chat-list-info">
                    <a href="user_profile.html?id=${otherUid}" class="chat-list-name d-block text-decoration-none">${otherUser.name || 'مستخدم'}</a>
                    <div class="chat-list-lastmsg" style="cursor:pointer;">${data.lastMessage || '...'}</div>
                </div>
            </div>
            `;
        });
        body.innerHTML = html;

        body.querySelectorAll('.chat-list-item').forEach(item => {
            item.addEventListener('click', (e) => {
                if (e.target.closest('a')) return; // Allow normal navigation if clicked on avatar or name
                const chatId = item.getAttribute('data-id');
                const otherUid = item.getAttribute('data-other');
                const otherName = item.getAttribute('data-name');
                openChatThread(chatId, myUid, otherUid, otherName, body, footer, backBtn, title);
            });
        });
    }, (error) => {
        console.error("Error loading chats", error);
        body.innerHTML = '<div class="text-center text-danger mt-5">خطأ في تحميل المحادثات.</div>';
    });
}

function openChatThread(chatId, myUid, otherUid, otherName, body, footer, backBtn, title) {
    currentChatId = chatId;
    title.innerText = otherName;
    backBtn.classList.remove('d-none');
    footer.classList.remove('d-none');
    body.innerHTML = '<div class="text-center text-muted mt-5"><i class="fa-solid fa-spinner fa-spin"></i> جاري التحميل...</div>';

    if(currentChatUnsubscribe) currentChatUnsubscribe();

    const q = query(collection(db, "chats", chatId, "messages"), orderBy("createdAt", "asc"));
    
    currentChatUnsubscribe = onSnapshot(q, (snapshot) => {
        if(currentChatId !== chatId) return;
        
        let html = '';
        snapshot.forEach(docSnap => {
            const msg = docSnap.data();
            const type = msg.senderId === myUid ? 'sent' : 'received';
            html += `<div class="chat-message ${type}">${msg.text}</div>`;
        });
        
        if (snapshot.empty) {
            html = '<div class="text-center text-muted mt-5 mb-4">بداية المحادثة</div>';
        }
        
        body.innerHTML = html;
        body.scrollTop = body.scrollHeight;
    });
}

window.startChatWith = async function(otherUid, otherName, otherPhoto) {
    if (typeof auth === 'undefined' || !auth.currentUser) {
        alert("يرجى تسجيل الدخول أولاً للتمكن من المراسلة.");
        window.location.href = "index.html";
        return;
    }
    const user = auth.currentUser;
    if (user.uid === otherUid) {
        alert("لا يمكنك مراسلة نفسك!");
        return;
    }

    const widget = document.getElementById('global-chat-widget');
    if(!widget) return;

    const q1 = query(collection(db, "chats"), where("participants", "==", [user.uid, otherUid]));
    const q2 = query(collection(db, "chats"), where("participants", "==", [otherUid, user.uid]));
    
    let existingChatId = null;
    try {
        const snap1 = await getDocs(q1);
        if(!snap1.empty) existingChatId = snap1.docs[0].id;
        else {
            const snap2 = await getDocs(q2);
            if(!snap2.empty) existingChatId = snap2.docs[0].id;
        }

        if(!existingChatId) {
            const myUserDoc = await getDoc(doc(db, "users", user.uid));
            const myName = user.displayName || (myUserDoc.exists() ? myUserDoc.data().name : 'مستخدم');
            const myPhoto = myUserDoc.exists() ? myUserDoc.data().photo : (user.photoURL || '');

            const newChat = await addDoc(collection(db, "chats"), {
                participants: [user.uid, otherUid],
                participantDetails: {
                    [user.uid]: { name: myName, photo: myPhoto },
                    [otherUid]: { name: otherName, photo: otherPhoto || '' }
                },
                lastMessage: '',
                updatedAt: serverTimestamp()
            });
            existingChatId = newChat.id;
        }

        widget.classList.add('active');
        const body = document.getElementById('chat-body');
        const footer = document.getElementById('chat-footer');
        const backBtn = document.getElementById('chat-back-btn');
        const title = document.getElementById('chat-header-title');
        
        openChatThread(existingChatId, user.uid, otherUid, otherName, body, footer, backBtn, title);

    } catch(err) {
        console.error("Error starting chat", err);
        alert("حدث خطأ أثناء بدء المحادثة.");
    }
};

// --- User Profile Page Logic ---
if (window.location.pathname.includes('user_profile.html')) {
    const urlParams = new URLSearchParams(window.location.search);
    const targetUid = urlParams.get('id');
    
    if (!targetUid || targetUid === 'undefined') {
        alert("بيانات المالك غير متوفرة (قد يكون هذا العقار قديماً جداً).");
        window.location.href = 'home.html';
    } else {
        const profileHeader = document.getElementById('user-profile-header');
        const propertiesContainer = document.getElementById('user-properties-container');
        const totalCountEl = document.getElementById('user-total-properties');
        const chatBtn = document.getElementById('profile-chat-btn');

        async function loadUserProfile() {
            try {
                // Fetch User Info
                const userDoc = await getDoc(doc(db, "users", targetUid));
                let userName = 'مستخدم';
                let userPhoto = '';
                
                if (userDoc.exists()) {
                    userName = userDoc.data().name || 'مستخدم';
                    userPhoto = userDoc.data().photo || '';
                }

                // Render Header
                let banBtnHtml = '';
                if (auth.currentUser && auth.currentUser.email === "shahinziad107@gmail.com" && targetUid !== auth.currentUser.uid) {
                    banBtnHtml = `
                    <div class="mt-3 w-100">
                        <button id="admin-ban-btn" class="btn btn-danger btn-sm w-100 fw-bold rounded-pill shadow-sm">
                            <i class="fa-solid fa-ban ms-1"></i> حظر هذا المستخدم
                        </button>
                    </div>`;
                }

                if (profileHeader) {
                    profileHeader.innerHTML = `
                        <div class="d-flex align-items-center flex-column">
                            <div style="width: 120px; height: 120px; border-radius: 50%; background-image: url('${userPhoto}'); background-color: var(--secondary-color); background-size: cover; background-position: center; color: white; display: flex; align-items: center; justify-content: center; font-size: 3rem; margin-bottom: 15px; border: 4px solid white; box-shadow: 0 10px 20px rgba(0,0,0,0.1);">
                                ${!userPhoto ? '<i class="fa-regular fa-user"></i>' : ''}
                            </div>
                            <h2 class="fw-bold">${userName}</h2>
                            <p class="text-muted mb-4">عضو في أجرلي</p>
                            ${banBtnHtml}
                        </div>
                    `;

                    const adminBanBtn = document.getElementById('admin-ban-btn');
                    if (adminBanBtn) {
                        adminBanBtn.addEventListener('click', async () => {
                            if(confirm("هل أنت متأكد من حظر هذا المستخدم نهائياً؟ لن يتمكن من دخول الموقع أو نشر عقارات مرة أخرى.")) {
                                try {
                                    await updateDoc(doc(db, "users", targetUid), { banned: true });
                                    alert("تم حظر المستخدم بنجاح.");
                                    window.location.href = 'home.html';
                                } catch(err) {
                                    console.error("Error banning user", err);
                                    alert("حدث خطأ أثناء الحظر.");
                                }
                            }
                        });
                    }
                }

                // Setup Chat Button
                if (chatBtn) {
                    chatBtn.onclick = () => {
                        if (typeof startChatWith === 'function') {
                            startChatWith(targetUid, userName, userPhoto);
                        }
                    };
                }

                // Fetch Properties
                if (propertiesContainer) {
                    const q = query(collection(db, "properties"), where("owner", "==", targetUid));
                    const querySnapshot = await getDocs(q);
                    
                    if (totalCountEl) totalCountEl.innerText = querySnapshot.size;

                    if (querySnapshot.empty) {
                        propertiesContainer.innerHTML = '<div class="col-12 text-center text-muted mt-5 mb-5"><i class="fa-solid fa-folder-open fs-1 mb-3"></i><br>هذا المستخدم لم يقم بنشر أي عقارات بعد.</div>';
                        return;
                    }

                    let html = '';
                    querySnapshot.forEach((docSnap) => {
                        const prop = docSnap.data();
                        const firstImage = (prop.images && prop.images.length > 0) ? prop.images[0] : '';
                        const price = prop.price ? parseInt(prop.price).toLocaleString('ar-EG') : 'غير محدد';
                        
                        html += `
                        <div class="col reveal">
                            <div class="property-card">
                                <div class="card-img-wrapper" style="height: 200px;">
                                    <span class="price-tag">${price} ج.م</span>
                                    <div class="property-image h-100" style="background-image: url('${firstImage}'); background-size: cover; background-position: center; ${!firstImage ? 'background-color: var(--secondary-color); display:flex; justify-content:center; align-items:center;' : ''}">
                                        ${!firstImage ? '<i class="fa-solid fa-image fs-1 text-white opacity-50"></i>' : ''}
                                    </div>
                                </div>
                                <div class="card-body container-fluid p-3">
                                    <h5 class="card-title text-truncate fw-bold mb-2">${prop.title || 'بدون عنوان'}</h5>
                                    <div class="location-text mb-3 small text-muted">
                                        <i class="fa-solid fa-location-dot"></i>
                                        <span>${prop.governorate || ''}${prop.city ? '، ' + prop.city : ''}</span>
                                    </div>
                                    <a href="property_detail.html?id=${docSnap.id}" class="btn btn-outline-primary w-100 rounded-pill mt-2">التفاصيل</a>
                                </div>
                            </div>
                        </div>`;
                    });
                    propertiesContainer.innerHTML = html;
                }

            } catch (err) {
                console.error("Error loading user profile", err);
            }
        }
        
        loadUserProfile();
    }
}

