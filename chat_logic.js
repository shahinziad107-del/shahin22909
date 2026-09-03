let chatInitialized = false;
let currentChatId = null;
let chatsUnsubscribe = null;
let currentChatUnsubscribe = null;

// Property Wizard Bot State
let botWizardState = {
    active: false,
    step: 0,
    messages: [],
    data: {
        title: '',
        property_type: 'إيجار',
        price: '',
        rooms: 2,
        bathrooms: 1,
        area: 100,
        governorate: '',
        city: '',
        whatsappNum: '',
        description: '',
        images: []
    }
};

function escapeHTML(str) {
    if (typeof str !== 'string') return str;
    return str.replace(/[&<>'"]/g, 
        tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag])
    );
}

function compressChatImage(file) {
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
                resolve(canvas.toDataURL('image/jpeg', 0.6));
            };
            img.onerror = (err) => reject(err);
        };
        reader.onerror = (err) => reject(err);
    });
}

function initChatWidget(user) {
    if (chatInitialized) return;
    chatInitialized = true;

    // Register Service Worker and Request Notification Permission
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js').catch(err => console.log('SW registration failed:', err));
    }
    if ("Notification" in window && Notification.permission !== "granted" && Notification.permission !== "denied") {
        Notification.requestPermission();
    }

    // Inject HTML
    const chatHtml = `
    <div id="global-chat-widget" class="chat-widget-container">
        <div class="chat-header">
            <div class="fw-bold" id="chat-header-title"><i class="fa-solid fa-comment-dots ms-2"></i> الرسائل</div>
            <div>
                <button class="chat-back-btn d-none text-danger me-1" id="chat-report-btn" title="إبلاغ"><i class="fa-solid fa-flag"></i></button>
                <button class="chat-back-btn d-none" id="chat-back-btn" title="رجوع"><i class="fa-solid fa-arrow-right"></i></button>
                <button class="chat-back-btn" id="chat-close-btn" title="إغلاق"><i class="fa-solid fa-times"></i></button>
            </div>
        </div>
        <div class="chat-body" id="chat-body">
            <div class="text-center text-muted mt-5"><i class="fa-solid fa-spinner fa-spin"></i> جاري التحميل...</div>
        </div>
        <div class="chat-footer d-none" id="chat-footer">
            <form id="chat-input-form" class="chat-input-group">
                <input type="file" id="chat-file-input" accept="image/*" multiple max="3" class="d-none">
                <button type="button" class="chat-image-attach-btn d-none" id="chat-attach-btn" title="إرفاق صور"><i class="fa-solid fa-camera"></i></button>
                <input type="text" id="chat-msg-input" class="chat-input" placeholder="اكتب رسالة..." required autocomplete="off">
                <button type="submit" class="chat-send-btn" title="إرسال"><i class="fa-solid fa-paper-plane"></i></button>
            </form>
        </div>
    </div>
    
    <!-- Toast Notification Container -->
    <div class="toast-container position-fixed bottom-0 start-0 p-3" style="z-index: 9999;">
        <div id="chat-notification-toast" class="toast shadow-lg border-0" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="toast-header bg-primary text-white border-0">
                <i class="fa-solid fa-comment-dots me-2 ms-2 fs-5"></i>
                <strong class="me-auto fs-6" id="chat-toast-sender">رسالة جديدة</strong>
                <small>الآن</small>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
            <div class="toast-body bg-white text-dark text-truncate fs-6" id="chat-toast-message" style="cursor: pointer;">
                ...
            </div>
        </div>
    </div>
    `;
    document.body.insertAdjacentHTML('beforeend', chatHtml);
    
    window.showChatNotification = function(senderName, message, chatId, otherUid) {
        const toastEl = document.getElementById('chat-notification-toast');
        if (!toastEl) return;
        document.getElementById('chat-toast-sender').innerText = senderName;
        document.getElementById('chat-toast-message').innerText = message;
        
        const toastBody = document.getElementById('chat-toast-message');
        toastBody.onclick = () => {
            const widget = document.getElementById('global-chat-widget');
            widget.classList.add('active');
            const body = document.getElementById('chat-body');
            const footer = document.getElementById('chat-footer');
            const backBtn = document.getElementById('chat-back-btn');
            const title = document.getElementById('chat-header-title');
            
            if (typeof bootstrap !== 'undefined') {
                const toastInstance = bootstrap.Toast.getInstance(toastEl);
                if(toastInstance) toastInstance.hide();
            }
            
            openChatThread(chatId, user.uid, otherUid, senderName, body, footer, backBtn, title);
        };
        
        if (typeof bootstrap !== 'undefined') {
            const toast = new bootstrap.Toast(toastEl, { delay: 5000 });
            toast.show();
        }

        if ("Notification" in window && Notification.permission === "granted") {
            if ('serviceWorker' in navigator && navigator.serviceWorker.ready) {
                navigator.serviceWorker.ready.then(function(registration) {
                    registration.showNotification("رسالة جديدة من " + senderName, {
                        body: message,
                        icon: './static/img/logo.png',
                        vibrate: [200, 100, 200],
                        tag: 'chat-message'
                    });
                });
            } else {
                const sysNotification = new Notification("رسالة جديدة من " + senderName, {
                    body: message,
                    icon: './static/img/logo.png'
                });
                sysNotification.onclick = function() {
                    window.focus();
                    this.close();
                };
            }
        }
    };

    const widget = document.getElementById('global-chat-widget');
    const closeBtn = document.getElementById('chat-close-btn');
    const backBtn = document.getElementById('chat-back-btn');
    const body = document.getElementById('chat-body');
    const footer = document.getElementById('chat-footer');
    const form = document.getElementById('chat-input-form');
    const input = document.getElementById('chat-msg-input');
    const title = document.getElementById('chat-header-title');
    const attachBtn = document.getElementById('chat-attach-btn');
    const fileInput = document.getElementById('chat-file-input');

    // Attach File Click Listener
    if (attachBtn && fileInput) {
        attachBtn.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', async (e) => {
            const files = Array.from(e.target.files).slice(0, 3);
            if (!files.length) return;

            appendUserChatMessage("📷 تم اختيار " + files.length + " صورة/صور", body);
            appendBotChatMessage("جاري معالجة ورفع الصور ⏳...", body);

            const b64List = [];
            for (let f of files) {
                try {
                    const b64 = await compressChatImage(f);
                    b64List.push(b64);
                } catch(err) { console.error(err); }
            }

            botWizardState.data.images = b64List;
            fileInput.value = '';
            
            setTimeout(() => {
                appendBotChatMessage("✅ تم استلام الصور بنجاح! ننتقل الآن للمراجعة النهائية.", body);
                botWizardState.step = 11;
                renderBotSummaryStep(body);
            }, 600);
        });
    }

    // Toggle logic
    document.querySelectorAll('.chat-toggle-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            widget.classList.toggle('active');
            if (widget.classList.contains('active')) {
                loadChatsList(user.uid, body, footer, backBtn, title);
            } else {
                if(chatsUnsubscribe) chatsUnsubscribe();
                if(currentChatUnsubscribe) currentChatUnsubscribe();
            }
        });
    });

    closeBtn.addEventListener('click', () => {
        widget.classList.remove('active');
        if(chatsUnsubscribe) chatsUnsubscribe();
        if(currentChatUnsubscribe) currentChatUnsubscribe();
    });

    backBtn.addEventListener('click', () => {
        if(currentChatUnsubscribe) {
            currentChatUnsubscribe();
            currentChatUnsubscribe = null;
        }
        currentChatId = null;
        loadChatsList(user.uid, body, footer, backBtn, title);
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const text = input.value.trim();
        if (!text || !currentChatId) return;

        input.value = '';

        // Check if user is in Bot Property Wizard thread
        if (currentChatId === 'bot_property_wizard') {
            handleUserBotInput(text, user, body, footer, backBtn, title);
            return;
        }

        try {
            await addDoc(collection(db, "chats", currentChatId, "messages"), {
                senderId: user.uid,
                text: text,
                createdAt: serverTimestamp()
            });
            await updateDoc(doc(db, "chats", currentChatId), {
                lastMessage: text,
                lastSenderId: user.uid,
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
    const reportBtn = document.getElementById('chat-report-btn');
    if (reportBtn) reportBtn.classList.add('d-none');
    
    title.innerHTML = '<i class="fa-solid fa-comment-dots ms-2"></i> الرسائل';
    body.innerHTML = '<div class="text-center text-muted mt-5"><i class="fa-solid fa-spinner fa-spin"></i> جاري التحميل...</div>';

    if(chatsUnsubscribe) chatsUnsubscribe();
    
    const q = query(collection(db, "chats"), where("participants", "array-contains", myUid));
    
    chatsUnsubscribe = onSnapshot(q, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
            if (change.type === "modified") {
                const data = change.doc.data();
                if (data.lastSenderId && data.lastSenderId !== myUid) {
                    if (currentChatId !== data.id) {
                        const otherUid = (data.participants || []).find(id => id !== myUid) || 'unknown';
                        const otherUser = data.participantDetails && data.participantDetails[otherUid] ? data.participantDetails[otherUid] : {name: 'مستخدم', photo: ''};
                        
                        if (typeof window.showChatNotification === 'function') {
                            window.showChatNotification(otherUser.name, data.lastMessage, data.id, otherUid);
                        }
                    }
                }
            }
        });

        if(currentChatId) return; 

        let chatsData = [];
        snapshot.forEach(docSnap => {
            chatsData.push({ id: docSnap.id, ...docSnap.data() });
        });
        
        chatsData.sort((a, b) => {
            const timeA = a.updatedAt ? a.updatedAt.toMillis() : 0;
            const timeB = b.updatedAt ? b.updatedAt.toMillis() : 0;
            return timeB - timeA;
        });

        let html = `
        <!-- Bot Property Addition Item -->
        <div class="chat-list-item bot-list-item" id="btn-open-property-bot">
            <div class="chat-list-avatar">
                <i class="fa-solid fa-robot"></i>
            </div>
            <div class="chat-list-info">
                <div class="chat-list-name">مساعد أجرلي (إضافة عقار)</div>
                <div class="chat-list-lastmsg">اضغط هنا لإضافة عقارك خطوة بخطوة ⚡</div>
            </div>
        </div>
        `;

        if (chatsData.length === 0) {
            html += '<div class="text-center text-muted mt-4">لا توجد محادثات شخصية أخرى.</div>';
        } else {
            chatsData.forEach(data => {
                const otherUid = (data.participants || []).find(id => id !== myUid) || 'unknown';
                const otherUser = data.participantDetails && data.participantDetails[otherUid] ? data.participantDetails[otherUid] : {name: 'مستخدم', photo: ''};
                
                html += `
                <div class="chat-list-item" data-id="${data.id}" data-other="${otherUid}">
                    <div class="chat-list-avatar" style="background-image: url('${otherUser.photo || ''}');">
                        ${!otherUser.photo ? '<i class="fa-regular fa-user"></i>' : ''}
                    </div>
                    <div class="chat-list-info">
                        <div class="chat-list-name">${escapeHTML(otherUser.name || 'مستخدم')}</div>
                        <div class="chat-list-lastmsg">${escapeHTML(data.lastMessage || '...')}</div>
                    </div>
                </div>
                `;
            });
        }

        body.innerHTML = html;

        // Bind Bot item
        const botBtn = body.querySelector('#btn-open-property-bot');
        if (botBtn) {
            botBtn.addEventListener('click', () => {
                openBotPropertyWizardThread(body, footer, backBtn, title);
            });
        }

        // Bind User Chat items
        body.querySelectorAll('.chat-list-item:not(.bot-list-item)').forEach(item => {
            item.addEventListener('click', () => {
                const chatId = item.getAttribute('data-id');
                const otherUid = item.getAttribute('data-other');
                const otherName = item.querySelector('.chat-list-name').innerText;
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
    
    const attachBtn = document.getElementById('chat-attach-btn');
    if (attachBtn) attachBtn.classList.add('d-none');

    const reportBtn = document.getElementById('chat-report-btn');
    if (reportBtn) {
        reportBtn.classList.remove('d-none');
        reportBtn.onclick = () => {
            if (typeof showReportModal === 'function') {
                showReportModal(otherUid);
            }
        };
    }
    
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
            html += `<div class="chat-message ${type}">${escapeHTML(msg.text || '')}</div>`;
        });
        
        if (snapshot.empty) {
            html = '<div class="text-center text-muted mt-5 mb-4">بداية المحادثة</div>';
        }
        
        body.innerHTML = html;
        body.scrollTop = body.scrollHeight;
    });
}

// --- BOT PROPERTY WIZARD LOGIC ---

function resetBotWizard() {
    botWizardState = {
        active: true,
        step: 0,
        messages: [],
        data: {
            title: '',
            property_type: 'إيجار',
            price: '',
            rooms: 2,
            bathrooms: 1,
            area: 100,
            governorate: '',
            city: '',
            whatsappNum: '',
            description: '',
            images: []
        }
    };
}

function openBotPropertyWizardThread(body, footer, backBtn, title) {
    currentChatId = 'bot_property_wizard';
    if(currentChatUnsubscribe) currentChatUnsubscribe();

    title.innerHTML = '<i class="fa-solid fa-robot text-warning ms-1"></i> مساعد إضافة العقارات';
    backBtn.classList.remove('d-none');
    
    const reportBtn = document.getElementById('chat-report-btn');
    if (reportBtn) reportBtn.classList.add('d-none');

    const attachBtn = document.getElementById('chat-attach-btn');
    if (attachBtn) attachBtn.classList.remove('d-none');

    footer.classList.remove('d-none');
    resetBotWizard();

    body.innerHTML = '';
    appendBotChatMessage("مرحباً بك في مساعد أجرلي الذكي! 🏠🤖\nسأساعدك في نشر إعلان عقارك بسهولة خطوة بخطوة.\n\nمن فضلك، اكتب **عنوان العقار** (مثال: شقة سوبر لوكس للإيجار بالمعادي):", body);
}

function appendUserChatMessage(text, body) {
    const msgDiv = document.createElement('div');
    msgDiv.className = 'chat-message sent';
    msgDiv.innerText = text;
    body.appendChild(msgDiv);
    body.scrollTop = body.scrollHeight;
}

function appendBotChatMessage(text, body, quickOptions = null) {
    const msgDiv = document.createElement('div');
    msgDiv.className = 'chat-message received';
    
    // Replace line breaks & bold formatting
    let formattedText = escapeHTML(text)
        .replace(/\n/g, '<br>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    let html = `<div>${formattedText}</div>`;
    
    if (quickOptions && quickOptions.length > 0) {
        html += `<div class="chat-quick-options">`;
        quickOptions.forEach(opt => {
            html += `<button type="button" class="chat-quick-btn" data-val="${escapeHTML(opt)}">${escapeHTML(opt)}</button>`;
        });
        html += `</div>`;
    }
    
    msgDiv.innerHTML = html;
    body.appendChild(msgDiv);
    
    // Bind quick option buttons
    msgDiv.querySelectorAll('.chat-quick-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const val = btn.dataset.val;
            const input = document.getElementById('chat-msg-input');
            if (input) input.value = val;
            const form = document.getElementById('chat-input-form');
            if (form) form.dispatchEvent(new Event('submit'));
        });
    });

    body.scrollTop = body.scrollHeight;
}

function renderBotSummaryStep(body) {
    const d = botWizardState.data;
    const summaryHtml = `
    <div class="bot-property-summary-card">
        <h6><i class="fa-solid fa-clipboard-check text-primary ms-1"></i> ملخص بيانات العقار:</h6>
        <div class="bot-summary-row"><span class="bot-summary-label">العنوان:</span><span class="bot-summary-val">${escapeHTML(d.title)}</span></div>
        <div class="bot-summary-row"><span class="bot-summary-label">النوع:</span><span class="bot-summary-val">${escapeHTML(d.property_type)}</span></div>
        <div class="bot-summary-row"><span class="bot-summary-label">السعر:</span><span class="bot-summary-val">${escapeHTML(String(d.price))} ج.م</span></div>
        <div class="bot-summary-row"><span class="bot-summary-label">الغرف / الحمامات:</span><span class="bot-summary-val">${d.rooms} غرف | ${d.bathrooms} حمام</span></div>
        <div class="bot-summary-row"><span class="bot-summary-label">المساحة:</span><span class="bot-summary-val">${d.area} م²</span></div>
        <div class="bot-summary-row"><span class="bot-summary-label">الموقع:</span><span class="bot-summary-val">${escapeHTML(d.city)}، ${escapeHTML(d.governorate)}</span></div>
        <div class="bot-summary-row"><span class="bot-summary-label">الواتساب:</span><span class="bot-summary-val">${escapeHTML(d.whatsappNum)}</span></div>
        <div class="bot-summary-row"><span class="bot-summary-label">الصور:</span><span class="bot-summary-val">${d.images.length > 0 ? d.images.length + ' صور مرفقة' : 'بدون صور'}</span></div>
    </div>
    `;
    
    appendBotChatMessage(`إليك ملخص الإعلان النهائي 👇:\n${summaryHtml}\n\nهل ترغب في نشر العقار الآن؟`, body, [
        '✅ تأكيد ونشر العقار الآن',
        '🔄 إعادة البداية',
        '❌ إلغاء'
    ]);
}

async function handleUserBotInput(text, user, body, footer, backBtn, title) {
    appendUserChatMessage(text, body);

    const step = botWizardState.step;
    const d = botWizardState.data;

    // Direct Keywords Interceptor
    if (text.includes('إلغاء') || text.includes('الغاء')) {
        appendBotChatMessage("تم إلغاء عملية إضافة العقار. يمكنك العودة في أي وقت بالنقر على 'مساعد إضافة العقار'.", body);
        botWizardState.active = false;
        return;
    }
    if (text.includes('إعادة') || text.includes('اعادة')) {
        resetBotWizard();
        appendBotChatMessage("تم البدء من جديد! 🔄\nما هو **عنوان العقار**؟ (مثال: شقة للبيع بـ 6 أكتوبر)", body);
        return;
    }

    // Step Processing
    switch (step) {
        case 0: // Title
            d.title = text;
            botWizardState.step = 1;
            appendBotChatMessage("ممتاز! ما هو **نوع العقار**؟", body, ['إيجار', 'تمليك (بيع)']);
            break;

        case 1: // Property Type
            d.property_type = (text.includes('بيع') || text.includes('تمليك')) ? 'تمليك' : 'إيجار';
            botWizardState.step = 2;
            appendBotChatMessage(`تم التحديد: **${d.property_type}** 👍\nكم **السعر المطلوب** (بالجنيه المصري)؟`, body, ['3000', '5000', '10000', '1500000']);
            break;

        case 2: // Price
            const priceNum = parseFloat(text.replace(/[^\d.]/g, ''));
            d.price = priceNum || 5000;
            botWizardState.step = 3;
            appendBotChatMessage(`تم تسجيل السعر: **${d.price} جنيه** 💵\nكم **عدد الغرف**؟`, body, ['1', '2', '3', '4', '5+']);
            break;

        case 3: // Rooms
            d.rooms = parseInt(text.replace(/[^\d]/g, '')) || 2;
            botWizardState.step = 4;
            appendBotChatMessage(`عدد الغرف: **${d.rooms}** 🛏️\nكم **عدد الحمامات**؟`, body, ['1', '2', '3', '4+']);
            break;

        case 4: // Bathrooms
            d.bathrooms = parseInt(text.replace(/[^\d]/g, '')) || 1;
            botWizardState.step = 5;
            appendBotChatMessage(`عدد الحمامات: **${d.bathrooms}** 🚿\nما هي **مساحة العقار** بالمتر المربع (م²)؟`, body, ['80', '100', '120', '150', '200']);
            break;

        case 5: // Area
            d.area = parseInt(text.replace(/[^\d]/g, '')) || 100;
            botWizardState.step = 6;
            appendBotChatMessage(`المساحة: **${d.area} م²** 📐\nفي أي **محافظة** يقع العقار؟`, body, [
                'القاهرة', 'الجيزة', 'الإسكندرية', 'القليوبية', 'الشرقية', 'المنوفية', 'الدقهلية', 'البحر الأحمر', 'مطروح'
            ]);
            break;

        case 6: // Governorate
            d.governorate = text.trim();
            botWizardState.step = 7;
            appendBotChatMessage(`المحافظة: **${d.governorate}** 📍\nما هي **المدينة أو المنطقة** بالتفصيل؟ (مثال: المعادي، الشيخ زايد، 6 أكتوبر، سموحة):`, body);
            break;

        case 7: // City
            d.city = text.trim();
            botWizardState.step = 8;
            appendBotChatMessage(`المنطقة: **${d.city}** 🏢\nما هو **رقم الواتساب** للتواصل مع الراغبين في العقار؟ (مثال: 01012345678):`, body);
            break;

        case 8: // WhatsApp
            d.whatsappNum = text.trim();
            botWizardState.step = 9;
            appendBotChatMessage(`رقم الواتساب: **${d.whatsappNum}** 📱\nاكتب **وصفاً وتفاصيل إضافية** حول العقار (المميزات، الدور، التشطيب، إلخ...):`, body);
            break;

        case 9: // Description
            d.description = text.trim();
            botWizardState.step = 10;
            appendBotChatMessage("تم حفظ الوصف! ✍️\nهل ترغب في إضافة صور للعقار الآن؟ 📷\nيمكنك رفع حتى 3 صور عبر زر الكاميرا أدناه، أو اضغط زر تخطي لاستكمال النشر الآن.", body, ['تخطي الصور والنشر الآن']);
            break;

        case 10: // Images Option / Skip
            botWizardState.step = 11;
            renderBotSummaryStep(body);
            break;

        case 11: // Confirm & Save to Firestore
            if (text.includes('نشر') || text.includes('تأكيد') || text.includes('نعم')) {
                appendBotChatMessage("جاري نشر العقار على المنصة... ⏳", body);
                
                try {
                    const userDoc = await getDoc(doc(db, "users", user.uid));
                    let userPhoto = null;
                    if (userDoc.exists() && userDoc.data().photo) {
                        userPhoto = userDoc.data().photo;
                    } else if (user.photoURL) {
                        userPhoto = user.photoURL;
                    }

                    const propertyData = {
                        title: d.title || 'عقار جديد',
                        price: parseFloat(d.price) || 0,
                        property_type: d.property_type || 'إيجار',
                        rooms: parseInt(d.rooms) || 1,
                        bathrooms: parseInt(d.bathrooms) || 1,
                        area: parseInt(d.area) || 100,
                        images: d.images || [],
                        governorate: d.governorate || 'غير محدد',
                        city: d.city || 'غير محدد',
                        location: `${d.city || ''}، ${d.governorate || ''}`,
                        whatsappNum: d.whatsappNum || '',
                        description: d.description || '',
                        owner: user.uid,
                        authorName: user.displayName || user.email.split('@')[0],
                        authorPhoto: userPhoto,
                        authorDevice: navigator.userAgent || 'unknown',
                        createdAt: serverTimestamp()
                    };

                    await addDoc(collection(db, "properties"), propertyData);

                    appendBotChatMessage("🎉 **تم نشر عقارك بنجاح على أجرلي!** 🎉\nيمكنك الآن مشاهدة العقار في الصفحة الرئيسية أو في صفحة حسابك.", body, [
                        '🏠 الرئيسية',
                        '📋 عقاراتي',
                        '➕ إضافة عقار آخر'
                    ]);

                    botWizardState.step = 12;

                } catch(err) {
                    console.error("Bot add property error", err);
                    appendBotChatMessage("عذراً، حدث خطأ أثناء الحفظ: " + err.message, body);
                }
            } else {
                appendBotChatMessage("من فضلك اختر أحد الأزرار أدناه للبدء أو النشر.", body, [
                    '✅ تأكيد ونشر العقار الآن',
                    '🔄 إعادة البداية',
                    '❌ إلغاء'
                ]);
            }
            break;

        case 12: // Post-Publish actions
            if (text.includes('الرئيسية')) {
                window.location.href = 'home.html';
            } else if (text.includes('عقاراتي')) {
                window.location.href = 'my_properties.html';
            } else if (text.includes('إضافة عقار آخر') || text.includes('اضافة')) {
                resetBotWizard();
                appendBotChatMessage("أهلاً بك مجدداً! ما هو **عنوان العقار الجديد**؟", body);
            }
            break;
    }
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
                lastSenderId: '',
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
