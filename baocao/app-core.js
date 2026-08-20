// BAO-CAO-APP/app-core.js
// Firebase Data Layer + Adapters cho app báo cáo độc lập

(function() {
  const firebaseConfig = {
    apiKey: "AIzaSyAL-qFpea0U6qe5DLYpJJw2kulVKGxDQqE",
    authDomain: "hpcons-pkttc.firebaseapp.com",
    projectId: "hpcons-pkttc",
    storageBucket: "hpcons-pkttc.firebasestorage.app",
    messagingSenderId: "975254920581",
    appId: "1:975254920581:web:2fb9f47103e0572cb738ec",
    measurementId: "G-9HZH6Q6PRZ"
  };

  // Khởi tạo Firebase App
  const app = firebase.initializeApp(firebaseConfig);
  const db = firebase.firestore();
  const auth = firebase.auth();
  const storage = firebase.storage();

  const AppCore = {
    db,
    auth,
    storage,
    currentUser: null, // Lưu thông tin {uid, email, full_name, role, app_user_id}
    currentProject: null, // Lưu dự án đang chọn
    _lastFailedImages: [], // Ảnh tải lên KHÔNG được ở lần lưu gần nhất (để báo người dùng biết)
    projectsList: [], // Danh sách dự án người dùng thấy
    
    // Đối tượng giả lập CUR & DataService giống app chính để đánh lừa form báo cáo
    CUR: {
      get project() {
        return AppCore.currentProject ? AppCore.currentProject.id : "";
      }
    },

    DataService: {
      async listDailyReports() {
        if (!AppCore.currentProject) return [];
        try {
          const snap = await db.collection("daily_reports")
            .where("project_id", "==", AppCore.currentProject.id)
            .get();
          return snap.docs.map(doc => doc.data());
        } catch (e) {
          console.error("Lỗi tải daily_reports:", e);
          throw e;
        }
      },

      async listProjects() {
        return AppCore.projectsList;
      }
    },

    // Quản lý trạng thái auth
    onAuthStateChanged(callback) {
      auth.onAuthStateChanged(async (user) => {
        if (user) {
          try {
            // Tải thông tin người dùng từ Firestore users/{uid}
            const userDoc = await db.collection("users").doc(user.uid).get();
            const uData = userDoc.exists ? userDoc.data() : {};
            
            AppCore.currentUser = {
              uid: user.uid,
              email: user.email,
              full_name: uData.full_name || user.email.split("@")[0],
              role: uData.role || "engineer",
              app_user_id: uData.app_user_id || "x",
              admin_like: !!uData.admin_like
            };
            
            // Tự ghi/cập nhật hồ sơ người dùng khi đăng nhập (upsert users/{uid})
            try {
              const writeData = {
                email: user.email,
                last_login: new Date().toISOString()
              };
              if (!uData.full_name) {
                writeData.full_name = user.email.split("@")[0];
              }
              if (!uData.role) {
                writeData.role = "engineer";
              }
              
              db.collection("users").doc(user.uid).set(writeData, { merge: true }).catch(err => {
                console.warn("Lỗi ghi profile user (Firebase rules có thể chặn):", err);
              });
            } catch (writeErr) {
              console.warn("Lỗi chuẩn bị ghi profile user:", writeErr);
            }
            
            // Đặt biến global giống app chính
            window.CURRENT_USER_NAME = AppCore.currentUser.full_name;
            window.CURRENT_USER_ROLE = AppCore.currentUser.role;
            window.CURRENT_COMMANDER = AppCore.currentProject ? AppCore.currentProject.commander : "";

            callback(AppCore.currentUser);
          } catch (err) {
            console.error("Lỗi lấy thông tin user:", err);
            callback(null);
          }
        } else {
          AppCore.currentUser = null;
          callback(null);
        }
      });
    },

    async login(email, password) {
      if (!email.includes("@")) {
        email = email.trim() + "@hpcons.local";
      }
      return auth.signInWithEmailAndPassword(email, password);
    },

    async logout() {
      return auth.signOut();
    },

    // Tải danh sách dự án được phân quyền
    async loadProjects() {
      if (!AppCore.currentUser) return [];
      try {
        const role = AppCore.currentUser.role;
        const uid = AppCore.currentUser.uid;
        let snap;
        
        if (role === "admin" || role === "director" || role === "pm" || AppCore.currentUser.admin_like) {
          // Admin/Director/PM thấy toàn bộ dự án
          snap = await db.collection("projects").get();
        } else {
          // CHT và Kỹ sư chỉ thấy dự án mình thuộc danh sách member_uids
          snap = await db.collection("projects").where("member_uids", "array-contains", uid).get();
        }
        
        AppCore.projectsList = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        return AppCore.projectsList;
      } catch (e) {
        console.error("Lỗi tải danh sách dự án:", e);
        throw e;
      }
    },

    // Giao tiếp postMessage giả lập
    postMessage(msg) {
      console.log("[AppCore.postMessage]", msg);
      if (msg && msg.type === 'REQUEST_KB_SYNC') {
        const projectId = AppCore.currentProject ? AppCore.currentProject.id : "";
        if (!projectId) return;
        
        /* Sếp báo 20/08: "danh sách nhà thầu không đúng với danh sách khai trong dự án — có
           những nhà thầu không khai vẫn hiển thị". Gốc: trước đây danh sách chọn được GỘP hai
           nguồn — nhà thầu đã khai cho DỰ ÁN (config/contractors, lọc theo project_id) CỘNG
           thêm một danh mục dùng chung mọi dự án (config/kb_contractors). Chính danh mục chung
           đó đẩy vào các tên chưa từng khai cho dự án này.
           Nay CHỈ lấy nhà thầu đã khai cho dự án hiện tại và chưa bị Ẩn. Dữ liệu
           config/kb_contractors trên Firebase KHÔNG bị xóa, chỉ thôi dùng để đổ vào ô chọn.
           Nhà thầu đã nằm trong báo cáo cũ mà không còn trong danh mục vẫn được giữ (ô chọn
           tự thêm mục "(ngoài danh mục)") nên không mất dữ liệu báo cáo nào. */
        Promise.all([
          db.collection("config").doc("contractors").get()
        ]).then(([doc1]) => {
          const contractors = doc1.exists ? (doc1.data().value || []) : [];

          // Chỉ nhà thầu của DỰ ÁN HIỆN TẠI và đang hiện (không bị Ẩn)
          const projContractors = contractors
            .filter(c => c.project_id === projectId && c.status !== 'inactive')
            .map(c => c.name);

          window.ALL_PROJECT_CONTRACTORS = Array.from(new Set(projContractors));
          console.log("Nhà thầu đã khai của dự án:", window.ALL_PROJECT_CONTRACTORS.length);
          
          // Cập nhật lại form tổ đội
          if (typeof renderUnitForm === 'function') {
            renderUnitForm();
          }
        }).catch(err => console.warn("Lỗi sync Contractors & KB:", err));
      }
    },

    // Đổi hướng request từ requestParent
    async handleRequest(type, data) {
      console.log("[AppCore.handleRequest]", type, data);
      
      if (type === 'GET_DAILY_REPORTS') {
        const reports = await AppCore.DataService.listDailyReports();
        return {
          reports: reports,
          project: AppCore.currentProject ? AppCore.currentProject.id : null
        };
      }

      if (type === 'SAVE_REPORT') {
        return await AppCore.saveReport(data);
      }

      throw new Error("Không hỗ trợ request type: " + type);
    },

    // Nén ảnh base64 sang Blob (JPEG, max 1600px, quality 0.8)
    compressImage(base64Str, maxW = 1600, quality = 0.8) {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = base64Str;
        img.onload = () => {
          let w = img.width;
          let h = img.height;
          if (w > maxW) {
            h = Math.round(h * maxW / w);
            w = maxW;
          }
          const canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, w, h);
          canvas.toBlob(blob => {
            if (blob) resolve(blob);
            else reject(new Error("Không thể xuất Blob từ canvas"));
          }, 'image/jpeg', quality);
        };
        img.onerror = (err) => reject(new Error("Lỗi load ảnh: " + err));
      });
    },

    // Lưu báo cáo trực tiếp (không offline queue)
    async saveReport(reportData) {
      if (!AppCore.currentProject) throw new Error("Chưa chọn dự án!");
      if (!AppCore.currentUser) throw new Error("Chưa đăng nhập!");

      const projectId = AppCore.currentProject.id;
      const date = reportData.date;
      const createdBy = AppCore.currentUser.app_user_id || "x";
      AppCore._lastFailedImages = [];   // đếm ảnh tải lên KHÔNG được của lần lưu này

      // 1. Kiểm tra mạng
      if (!navigator.onLine) {
        throw new Error("Mất mạng, bấm thử lại");
      }

      // Xử lý nén và upload ảnh lên Storage (mảng photos với cấu trúc {tm, vi, cn, img})
      const photos = reportData.photos || [];
      const updatedPhotos = [];

      for (let i = 0; i < photos.length; i++) {
        const p = { ...photos[i] };
        if (p.img && p.img.startsWith("data:image/")) {
          try {
            // Nén ảnh
            const compressedBlob = await AppCore.compressImage(p.img);
            
            // Đặt tên file ngẫu nhiên dựa trên timestamp
            const filename = `img_${Date.now()}_${Math.round(Math.random()*1000)}.jpg`;
            const storagePath = `reports/${projectId}/${date}/${createdBy}/${filename}`;
            
            // Upload lên Storage
            const ref = storage.ref().child(storagePath);
            const uploadTask = await ref.put(compressedBlob, { contentType: 'image/jpeg' });
            const downloadUrl = await uploadTask.ref.getDownloadURL();
            
            p.img = downloadUrl;
            console.log(`Đã upload thành công ảnh ${i + 1}/${photos.length}: ${downloadUrl}`);
          } catch (uploadErr) {
            // 16/08 — TRƯỚC ĐÂY throw ở đây làm MẤT TRẮNG cả báo cáo (kể cả phần chữ) chỉ vì 1 ảnh
            // lỗi mạng. Thực tế: báo cáo HOWELL 14/08 (91 nhân lực) không hề lên hệ thống.
            // NAY: bỏ qua đúng ảnh lỗi, VẪN LƯU phần còn lại, và đếm lại để báo cho người dùng.
            console.error(`Lỗi upload ảnh ${i + 1}:`, uploadErr);
            AppCore._lastFailedImages.push('ảnh công trường ' + (i + 1));
            p.img = null;
          }
        }
        updatedPhotos.push(p);
      }

      // Xử lý nén và upload ảnh bản vẽ lên Storage (mảng draws với cấu trúc {t, img})
      const draws = reportData.draws || [];
      const updatedDraws = [];

      for (let i = 0; i < draws.length; i++) {
        const d = { ...draws[i] };
        if (d.img && d.img.startsWith("data:image/")) {
          try {
            // Nén ảnh bản vẽ
            const compressedBlob = await AppCore.compressImage(d.img);
            
            // Đặt tên file ngẫu nhiên dựa trên timestamp
            const filename = `draw_${Date.now()}_${Math.round(Math.random()*1000)}.jpg`;
            const storagePath = `reports/${projectId}/${date}/${createdBy}/${filename}`;
            
            // Upload lên Storage
            const ref = storage.ref().child(storagePath);
            const uploadTask = await ref.put(compressedBlob, { contentType: 'image/jpeg' });
            const downloadUrl = await uploadTask.ref.getDownloadURL();
            
            d.img = downloadUrl;
            console.log(`Đã upload thành công bản vẽ ${i + 1}/${draws.length}: ${downloadUrl}`);
          } catch (uploadErr) {
            // Như trên: KHÔNG để 1 bản vẽ lỗi làm mất cả báo cáo
            console.error(`Lỗi upload bản vẽ ${i + 1}:`, uploadErr);
            AppCore._lastFailedImages.push('bản vẽ ' + (i + 1));
            d.img = null;
          }
        }
        updatedDraws.push(d);
      }

      // Nén + upload 1 ảnh đơn (logo/ảnh tổng quan) nếu là dataURL; nếu đã là URL cũ thì giữ nguyên
      const uploadField = async (val, name) => {
        if (val && typeof val === "string" && val.startsWith("data:image/")) {
          try {
            const blob = await AppCore.compressImage(val);
            const filename = `${name}_${Date.now()}_${Math.round(Math.random()*1000)}.jpg`;
            const storagePath = `reports/${projectId}/${date}/${createdBy}/${filename}`;
            const ref = storage.ref().child(storagePath);
            const up = await ref.put(blob, { contentType: 'image/jpeg' });
            return await up.ref.getDownloadURL();
          } catch (e) {
            // Logo / ảnh tổng quan lỗi cũng KHÔNG được làm hỏng cả báo cáo
            console.error("Lỗi upload " + name + ":", e);
            AppCore._lastFailedImages.push(name);
            return null;
          }
        }
        return val || null;
      };

      // Tạo bản ghi hoàn chỉnh
      const finalReport = {
        ...reportData,
        project_id: projectId,
        created_by: createdBy,
        created_by_uid: AppCore.currentUser.uid,
        photos: updatedPhotos,
        draws: updatedDraws,
        logo_cdt: await uploadField(reportData.logo_cdt, "logo_cdt"),
        logo_ntc: await uploadField(reportData.logo_ntc, "logo_ntc"),
        ov_main:  await uploadField(reportData.ov_main, "ov_main"),
        ov_sub1:  await uploadField(reportData.ov_sub1, "ov_sub1"),
        ov_sub2:  await uploadField(reportData.ov_sub2, "ov_sub2"),
        updated_at: new Date().toISOString()
      };

      // Sinh id document
      const docId = [projectId, date].join("_").replace(/[^a-zA-Z0-9_.-]/g, "-");

      try {
        await db.collection("daily_reports").doc(docId).set(finalReport, { merge: true });
        console.log("Đã lưu Firestore document:", docId);
        return finalReport;
      } catch (dbErr) {
        console.error("Lỗi ghi Firestore:", dbErr);
        throw new Error("Lỗi ghi dữ liệu lên máy chủ: " + dbErr.message);
      }
    },

    async loadProjectProgress(pid) {
      if (!pid) return null;
      try {
        const doc = await db.collection("projects").doc(pid)
          .collection("data").doc("progress").get();
        if (!doc.exists) return null;
        const items = doc.data().items;
        return Array.isArray(items) ? items : null;
      } catch (e) { console.warn("loadProjectProgress lỗi:", e); return null; }
    }
  };

  // Xuất ra window
  window.AppCore = AppCore;
})();
