import re

with open('static/js/firebase-app.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Update import
import_str = 'import { getFirestore, collection, addDoc, getDocs, query, orderBy, where, serverTimestamp, doc, deleteDoc, getDoc, updateDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";'
new_import_str = 'import { getFirestore, collection, addDoc, getDocs, query, orderBy, where, serverTimestamp, doc, deleteDoc, getDoc, updateDoc, setDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";'
content = content.replace(import_str, new_import_str)

# Inject initChatWidget
hook_str = """        } else if (user && (defaultPage || isRegisterPage)) {
            // Logged in but visiting login or register page
            window.location.href = "home.html";
        }"""
new_hook_str = """        } else if (user && (defaultPage || isRegisterPage)) {
            // Logged in but visiting login or register page
            window.location.href = "home.html";
        }
        
        if (user) {
            if (typeof initChatWidget === "function") {
                initChatWidget(user);
            }
        }"""
if "initChatWidget(user)" not in content:
    content = content.replace(hook_str, new_hook_str)

# Add startChatWith button to property detail logic
detail_str = """                                <p class="text-muted lh-lg fs-5" style="white-space: pre-wrap;">${prop.description || 'لم يتم إضافة وصف لهذه المنشأة.'}</p>
                                
                                ${whatsappBtn}
                            </div>"""
new_detail_str = """                                <p class="text-muted lh-lg fs-5" style="white-space: pre-wrap;">${prop.description || 'لم يتم إضافة وصف لهذه المنشأة.'}</p>
                                
                                ${whatsappBtn}
                                <button onclick="startChatWith('${prop.owner}', '${(prop.authorName || 'مستخدم غير معروف').replace(/'/g, "\\\\'")}', '${(prop.authorPhoto || '').replace(/'/g, "\\\\'")}')" class="btn btn-primary btn-lg w-100 mt-3 shadow-sm fw-bold rounded-pill">
                                    <i class="fa-solid fa-comment-dots fs-4 ms-2 align-middle"></i> تواصل عبر الموقع
                                </button>
                            </div>"""
if "startChatWith" not in content:
    content = content.replace(detail_str, new_detail_str)

with open('chat_logic.js', 'r', encoding='utf-8') as f:
    chat_logic = f.read()

if "let chatInitialized = false;" not in content:
    content += "\n" + chat_logic

with open('static/js/firebase-app.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("firebase-app.js updated successfully.")
