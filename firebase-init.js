// firebase-init.js
// Khởi tạo Firebase — backend cloud duy nhất của app chính từ 28/07/2026.

const FIREBASE_ENABLED = true; // Bật thật 2026-07-08: cho phép firebaseAuthSync (FB-M3) tạo tài khoản
// Firebase Auth cung cấp uid thật để áp Firestore Rules và gán member_uids theo dự án.
// Đồng bộ dữ liệu được điều phối bởi SyncEngine (app.js) và FirebaseSync (firebase-sync.js).

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
      auth.onAuthStateChanged(function (u) {
        if (typeof SyncEngine !== "undefined" && SyncEngine.setPill) SyncEngine.setPill();
        // 16/08: có phiên rồi thì GỠ NGAY dải nhắc "Chưa kết nối máy chủ" (trước đây dải hiện xong
        // là nằm lì, dù sau đó đăng nhập Firebase đã xong -> Sếp tưởng đăng nhập lại không ăn thua).
        if (u && typeof window.hideReloginBanner === "function") window.hideReloginBanner();
      });
    } catch (e) { console.warn("onAuthStateChanged (badge) lỗi:", e); }
  } catch (error) {
    console.error("Firebase connection error:", error);
  }
})();
