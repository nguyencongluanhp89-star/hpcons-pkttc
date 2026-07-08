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

    // Export các đối tượng Firebase ra window
    window.fb = { app, db, auth };

    console.log("Firebase connected");
  } catch (error) {
    console.error("Firebase connection error:", error);
  }
})();
