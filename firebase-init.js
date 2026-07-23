// firebase-init.js
// Script khởi tạo Firebase chạy song song với Supabase dưới dạng feature flag

const FIREBASE_ENABLED = true; // Bật thật 2026-07-08: cho phép firebaseAuthSync (FB-M3) tạo tài khoản
// Firebase Auth song song khi người dùng đăng nhập bình thường — mục đích DUY NHẤT lúc này là thu thập
// uid Firebase thật để gán member_uids cho từng dự án (điều kiện của FB-M5). CHƯA đồng bộ dữ liệu dự án
// nào cả (FirebaseSync chưa được nối vào luồng tự động) — rủi ro production ở mức tối thiểu.

const firebaseConfig = {
  apiKey: "AIzaSyAL-qFpea0U6qe5DLYpJJw2kulVKGxDQqE",
  authDomain: "hpcons-pkttc.firebaseapp.com",
  projectId: "hpcons-pkttc",
  storageBucket: "hpcons-pkttc.firebasestorage.app",
  messagingSenderId: "975254920581",
  appId: "1:975254920581:web:2fb9f47103e0572cb738ec",
  measurementId: "G-9HZH6Q6PRZ"
};

(function() {
  if (!FIREBASE_ENABLED) {
    // Nếu cờ tắt -> không làm gì cả, return sớm (an toàn tuyệt đối)
    return;
  }

  try {
    // Khởi tạo Firebase App (compat mode)
    const app = firebase.initializeApp(firebaseConfig);
    // Khởi tạo các service cần thiết
    const db = firebase.firestore();
    const auth = firebase.auth();
    let storage = null;
    try { storage = firebase.storage(); } catch(e) { console.warn("Firebase Storage chưa sẵn sàng:", e); }

    // Export các đối tượng Firebase ra window
    window.fb = { app, db, auth, storage };

    console.log("Firebase connected");

    // Badge đồng bộ TỰ CẬP NHẬT theo trạng thái đăng nhập Firebase Auth.
    // Trước đây badge (SyncEngine.setPill) vẽ NGAY lúc đăng nhập, nhưng firebaseAuthSync signIn chạy NỀN
    // (async, xong sau 1-2s) nên lúc vẽ chưa có currentUser -> kẹt "Offline (local)" dù Firebase đã kết nối.
    // onAuthStateChanged bắt cả: signIn nền xong + phiên tự khôi phục khi mở lại app -> vẽ lại badge đúng.
    try {
      auth.onAuthStateChanged(function () {
        if (typeof SyncEngine !== "undefined" && SyncEngine.setPill) SyncEngine.setPill();
      });
    } catch (e) { console.warn("onAuthStateChanged (badge) lỗi:", e); }
  } catch (error) {
    console.error("Firebase connection error:", error);
  }
})();
