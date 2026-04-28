
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
            <div class="chat-list-item" data-id="${data.id}" data-other="${otherUid}">
                <div class="chat-list-avatar" style="background-image: url('${otherUser.photo || ''}');">
                    ${!otherUser.photo ? '<i class="fa-regular fa-user"></i>' : ''}
                </div>
                <div class="chat-list-info">
                    <div class="chat-list-name">${otherUser.name || 'مستخدم'}</div>
                    <div class="chat-list-lastmsg">${data.lastMessage || '...'}</div>
                </div>
            </div>
            `;
        });
        body.innerHTML = html;

        body.querySelectorAll('.chat-list-item').forEach(item => {
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
