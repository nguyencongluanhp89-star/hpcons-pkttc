// Idempotent legacy data migrations. Keep markers and execution order unchanged.
// --- AUTO IMPORT SCRIPT (RUNS ONCE) ---
setTimeout(async () => {
    if(CUR && CUR.project) {
        const imported = await metaGet("hr_imported_v2", false);
        if(!imported) {
            const newTeam = [
    {
        "id":  "7da2168a-47be-41a8-b11b-75e1bd448ce8",
        "title":  "P.TGĐ",
        "name":  "Hồ Văn Thi",
        "status":  "active",
        "phone":  "",
        "role":  "director",
        "added_at":  "2026-06-24",
        "department":  "Quản lý"
    },
    {
        "id":  "9b0c8a97-3c8d-465f-a5ee-6edab2386d19",
        "title":  "",
        "name":  "Huỳnh Thanh Phương",
        "status":  "active",
        "phone":  "",
        "role":  "director",
        "added_at":  "2026-06-24",
        "department":  "Quản lý"
    },
    {
        "id":  "78236f45-8794-4a59-86a3-609741e29065",
        "title":  "Thủ kho",
        "name":  "Nguyễn Hữu Phước",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "bf456e50-ecd7-4a0e-8b83-53a1e36614df",
        "title":  "CHT",
        "name":  "Lê Hiếu",
        "status":  "active",
        "phone":  "",
        "role":  "site_manager",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "f72be685-699d-4b00-bae7-2d63cfd55141",
        "title":  "CHT",
        "name":  "Thiều Quang Minh",
        "status":  "active",
        "phone":  "",
        "role":  "site_manager",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "894f4cd6-e836-46c0-8a90-18be941abd50",
        "title":  "CHT",
        "name":  "Phan Lê Duy",
        "status":  "active",
        "phone":  "",
        "role":  "site_manager",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "e3171621-051a-47da-b4d7-2d2f37c69fc3",
        "title":  "CHT",
        "name":  "Phan Thành Vũ",
        "status":  "active",
        "phone":  "",
        "role":  "site_manager",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "70c65025-3fd2-4928-af2f-b91b3ee13943",
        "title":  "Kỹ sư",
        "name":  "Nguyễn Thanh Lâm",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "d549beec-ae12-4a7d-8af6-f9d72c9a7e11",
        "title":  "Thủ kho",
        "name":  "Nguyễn Thanh Bình",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "36f1eb27-b395-46bb-902d-c62d79e0c21d",
        "title":  "Kỹ sư",
        "name":  "Điều Anh Quốc",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "58a3f626-b197-4579-b7f8-71036aabce6c",
        "title":  "Thủ kho",
        "name":  "Phan Tiến Sĩ",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "aa144fa4-fd23-4ec8-b463-66edff6b39c8",
        "title":  "Kỹ sư",
        "name":  "Phạm Ngọc Vũ",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "ca0cbd94-a295-42af-a537-c4d2a9bf14be",
        "title":  "CHT",
        "name":  "Trương Văn Vũ Em",
        "status":  "active",
        "phone":  "",
        "role":  "site_manager",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "c18cf22b-a063-45d3-baca-f04925458849",
        "title":  "CHT",
        "name":  "Nguyễn Sư Hoài Anh Đức",
        "status":  "active",
        "phone":  "",
        "role":  "site_manager",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "3feb4094-dd65-4854-8876-7ac935550185",
        "title":  "Trắc đạc",
        "name":  "Trương Hoài Ngọc",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "b8d8d55b-f3c7-4d8c-80b3-8bb713de61d4",
        "title":  "Thủ kho",
        "name":  "Nguyễn Trọng Khuê",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "07b233ed-4c9c-4f6e-9774-1d6ae614d9ab",
        "title":  "Thủ kho",
        "name":  "Trần Văn Trưởng",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "aa3227b7-7466-47fc-8b45-72813d0c95b3",
        "title":  "Thủ kho",
        "name":  "Trần Ngọc Giàu",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "d621ece9-ded4-48e6-af7d-7595abe801c9",
        "title":  "Thủ kho",
        "name":  "Phạm Thanh Hoài",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "4b76bed5-fe55-4b90-9f08-913537556b01",
        "title":  "Thủ kho",
        "name":  "Nguyễn Minh Khánh",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "8e839c88-4b7a-4441-9031-ca17fd8d3bc5",
        "title":  "Kỹ sư",
        "name":  "Nguyễn Văn Thành",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "5de6b666-9497-4ae4-ade1-cb3fe25cd4b9",
        "title":  "Kỹ sư",
        "name":  "Nguyễn Khắc Điệp",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "78a55374-67c9-49ce-b0fe-530a8a8d2d1d",
        "title":  "Thủ kho",
        "name":  "Nguyễn Trọng Việt",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "8607c999-17fc-4933-b992-6aa121b2c8d7",
        "title":  "Kỹ sư",
        "name":  "Nguyễn Thanh Luân",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "c6c927ec-846f-495b-8014-6bf8ea570bc5",
        "title":  "Kỹ sư",
        "name":  "Trần Trung Kiên",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "6106cfc8-d77f-4b85-abe3-d01853e774d1",
        "title":  "CHT",
        "name":  "Võ Xuân Triệu",
        "status":  "active",
        "phone":  "",
        "role":  "site_manager",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "c822abd1-1a13-4740-96dc-bf647ab3b489",
        "title":  "CHT",
        "name":  "Từ Minh Đạo",
        "status":  "active",
        "phone":  "",
        "role":  "site_manager",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "f3d3a811-2ae6-4d82-8d70-50374befc993",
        "title":  "Kỹ sư",
        "name":  "Từ Trọng Hoài",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "2c80c1a7-6da0-4289-8993-6c4dff5c5154",
        "title":  "Kỹ sư",
        "name":  "Trần Anh",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "33b2f4f3-3418-497f-8194-de3c7a50eebc",
        "title":  "CHT",
        "name":  "Phan Bá Nam",
        "status":  "active",
        "phone":  "",
        "role":  "site_manager",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "ef7be1ef-db72-4c52-ae95-5e3cc973347d",
        "title":  "Kỹ sư",
        "name":  "Trần Hùng",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "50bc0eda-c2d8-4fa4-8306-62013301527c",
        "title":  "Trắc đạc",
        "name":  "Lê Trung Hậu",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "12791698-3216-4dee-9627-7f699bfa9273",
        "title":  "ME",
        "name":  "Bùi Đức Thắng",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "255f5997-18c3-46c3-8815-a9ac169c5e76",
        "title":  "Kỹ sư",
        "name":  "Nguyễn Văn Đại",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "d9cf462f-ac88-4545-bd78-7a4bd459b00b",
        "title":  "Kỹ sư",
        "name":  "Trần Sơn Anh",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "adf19be9-b78a-4895-bc85-08fbacfd2b89",
        "title":  "Kỹ sư",
        "name":  "Trần Thanh Hậu",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "9b9cd828-4154-4fd1-87ea-d207fb9c780c",
        "title":  "CHT",
        "name":  "Nguyễn Tuấn Huy",
        "status":  "active",
        "phone":  "",
        "role":  "site_manager",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "399b97f3-8753-4279-8587-6c1ef3c8005d",
        "title":  "Kỹ sư",
        "name":  "Trương Phước Danh",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "280ed8bd-e7bf-4e3e-8be8-7d101afcff3c",
        "title":  "Kỹ sư",
        "name":  "Cao Xuân Thắng",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "46fec556-e311-4daf-a303-2bbe75420e3a",
        "title":  "CHT",
        "name":  "Từ Hoàng Anh",
        "status":  "active",
        "phone":  "",
        "role":  "site_manager",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "7142ed39-6462-4b9f-b98b-de74dd62f62f",
        "title":  "Kỹ sư",
        "name":  "Nguyễn Văn Trọng",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "e592e0be-d2d0-4a0d-bae8-b111bc37e7f7",
        "title":  "Kỹ sư",
        "name":  "Dương Văn Tiến",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "24b7c37a-5385-4a5f-bff5-550359e8a3cd",
        "title":  "Kỹ sư",
        "name":  "Đinh Văn Cường",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "bb071b8d-3b67-4221-934a-19ecd1ce5a51",
        "title":  "Kỹ sư",
        "name":  "Nguyễn Hồng Hạnh",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "6ed3e1e1-9f15-4c32-b6d0-195b588b5900",
        "title":  "Nhân viên QA - QC",
        "name":  "Phan Đình Trí",
        "status":  "active",
        "phone":  "",
        "role":  "qc_staff",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận QA-QC"
    },
    {
        "id":  "939f45a6-bfb1-4bd4-b996-2360d9a8d0a3",
        "title":  "Nhân viên QA - QC",
        "name":  "Nguyễn Đức Tiến",
        "status":  "active",
        "phone":  "",
        "role":  "qc_staff",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận QA-QC"
    },
    {
        "id":  "0e7791b8-a870-4a30-87d9-230dacdd1188",
        "title":  "Nhân viên QA - QC",
        "name":  "Phạm Ngọc Cầm",
        "status":  "active",
        "phone":  "",
        "role":  "qc_staff",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận QA-QC"
    },
    {
        "id":  "7003053b-7528-4d6a-b1ce-cefe8f641c2b",
        "title":  "Nhân viên QA - QC",
        "name":  "Nguyễn Ngọc Quốc",
        "status":  "active",
        "phone":  "",
        "role":  "qc_staff",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận QA-QC"
    },
    {
        "id":  "fd7dccc9-ec75-4cbf-bb2d-07b217e7745d",
        "title":  "Nhân viên QA - QC",
        "name":  "Lê Minh Khoa",
        "status":  "active",
        "phone":  "",
        "role":  "qc_staff",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận QA-QC"
    },
    {
        "id":  "7a23fbbb-a5bf-46fe-9a3b-2194577e926b",
        "title":  "Nhân viên QA - QC",
        "name":  "Nguyễn Khắc Vũ",
        "status":  "active",
        "phone":  "",
        "role":  "qc_staff",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận QA-QC"
    },
    {
        "id":  "84bf3485-6370-443f-822a-75f6c2e9402f",
        "title":  "Quản lý Bộ phận",
        "name":  "Phan Khánh Phương",
        "status":  "active",
        "phone":  "",
        "role":  "qc_manager",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận QA-QC"
    },
    {
        "id":  "b5b56cfe-4818-4e87-9b5f-b6ad1c7b4ae6",
        "title":  "",
        "name":  "Nguyễn Tấn Hoanh",
        "status":  "active",
        "phone":  "",
        "role":  "hse_staff",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận HSE"
    },
    {
        "id":  "d209f527-c9d1-4cfa-b6f3-521232a44152",
        "title":  "Quản lý Bộ phận",
        "name":  "Lê Thanh Tuấn",
        "status":  "active",
        "phone":  "",
        "role":  "hse_manager",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận HSE"
    },
    {
        "id":  "491cc13b-4033-47ec-a43b-50e49a8536d3",
        "title":  "",
        "name":  "Phạm Duy Tài",
        "status":  "active",
        "phone":  "",
        "role":  "hse_staff",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận HSE"
    },
    {
        "id":  "e5e2204c-cae0-465a-a889-48aa6bfb0cb1",
        "title":  "Quản lý Bộ phận",
        "name":  "Nguyễn Công Luận",
        "status":  "active",
        "phone":  "",
        "role":  "sd_manager",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Shopdrawing"
    },
    {
        "id":  "e394a159-56ec-44df-834b-087a4d192e5b",
        "title":  "Nhân viên Shopdrawing",
        "name":  "Đặng Thanh Quang",
        "status":  "active",
        "phone":  "",
        "role":  "sd_staff",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Shopdrawing"
    },
    {
        "id":  "09e6cf4e-a350-4eb2-ae94-967e9bf8dd7d",
        "title":  "Nhân viên Shopdrawing",
        "name":  "Trần Quốc Trung",
        "status":  "active",
        "phone":  "",
        "role":  "sd_staff",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Shopdrawing"
    },
    {
        "id":  "6d04c992-56d6-46db-ba2c-5d612d61249d",
        "title":  "Quản lý Bộ phận",
        "name":  "Nguyễn Hoài Nam",
        "status":  "active",
        "phone":  "",
        "role":  "mt_manager",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Bảo trì"
    },
    {
        "id":  "234c0de0-4b02-4f69-a396-f299c6074d6e",
        "title":  "Công nhân",
        "name":  "Lâm Văn Tiến",
        "status":  "active",
        "phone":  "",
        "role":  "mt_staff",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Bảo trì"
    },
    {
        "id":  "b274ab9f-0c43-4de8-83bd-2995c3fad60c",
        "title":  "Công nhân",
        "name":  "Võ Sơn Tùng",
        "status":  "active",
        "phone":  "",
        "role":  "mt_staff",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Bảo trì"
    },
    {
        "id":  "7f3e562f-f61b-4d75-9215-07f304d86c98",
        "title":  "Công nhân",
        "name":  "Hồ Văn Chanh Em",
        "status":  "active",
        "phone":  "",
        "role":  "mt_staff",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Bảo trì"
    },
    {
        "id":  "6d9c77e5-1ec6-4aa7-a778-61f6dcaf370f",
        "title":  "Công nhân",
        "name":  "Nguyễn Văn Vũ Trường",
        "status":  "active",
        "phone":  "",
        "role":  "mt_staff",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Bảo trì"
    }
];
            
            // Xóa sạch team cũ (nếu muốn) hoặc hợp nhất. Yêu cầu là "đưa từng vào từng bộ phận, theo đúng file a cung cấp"
            // Nên ghi đè để đảm bảo chính xác như file Excel.
            await metaSet("team:"+CUR.project, newTeam);
            await metaSet("hr_imported_v2", true);
            
            console.log("Đã import thành công 62 nhân sự từ file DANH SACH NHAN SU.xlsx vào hệ thống!");
            location.reload();
        }
    }
}, 3000);
// --------------------------------------

// --- AUTO IMPORT DEPARTMENTS (RUNS ONCE) ---
setTimeout(async () => {
    if(CUR && CUR.project) {
        const importedDepts = await metaGet("hr_imported_depts_v3", false);
        if(!importedDepts) {
            const rawUsers = [
    {
        "id":  "7da2168a-47be-41a8-b11b-75e1bd448ce8",
        "title":  "P.TGĐ",
        "name":  "Hồ Văn Thi",
        "status":  "active",
        "phone":  "",
        "role":  "director",
        "added_at":  "2026-06-24",
        "department":  "Quản lý"
    },
    {
        "id":  "9b0c8a97-3c8d-465f-a5ee-6edab2386d19",
        "title":  "",
        "name":  "Huỳnh Thanh Phương",
        "status":  "active",
        "phone":  "",
        "role":  "director",
        "added_at":  "2026-06-24",
        "department":  "Quản lý"
    },
    {
        "id":  "78236f45-8794-4a59-86a3-609741e29065",
        "title":  "Thủ kho",
        "name":  "Nguyễn Hữu Phước",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "bf456e50-ecd7-4a0e-8b83-53a1e36614df",
        "title":  "CHT",
        "name":  "Lê Hiếu",
        "status":  "active",
        "phone":  "",
        "role":  "site_manager",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "f72be685-699d-4b00-bae7-2d63cfd55141",
        "title":  "CHT",
        "name":  "Thiều Quang Minh",
        "status":  "active",
        "phone":  "",
        "role":  "site_manager",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "894f4cd6-e836-46c0-8a90-18be941abd50",
        "title":  "CHT",
        "name":  "Phan Lê Duy",
        "status":  "active",
        "phone":  "",
        "role":  "site_manager",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "e3171621-051a-47da-b4d7-2d2f37c69fc3",
        "title":  "CHT",
        "name":  "Phan Thành Vũ",
        "status":  "active",
        "phone":  "",
        "role":  "site_manager",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "70c65025-3fd2-4928-af2f-b91b3ee13943",
        "title":  "Kỹ sư",
        "name":  "Nguyễn Thanh Lâm",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "d549beec-ae12-4a7d-8af6-f9d72c9a7e11",
        "title":  "Thủ kho",
        "name":  "Nguyễn Thanh Bình",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "36f1eb27-b395-46bb-902d-c62d79e0c21d",
        "title":  "Kỹ sư",
        "name":  "Điều Anh Quốc",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "58a3f626-b197-4579-b7f8-71036aabce6c",
        "title":  "Thủ kho",
        "name":  "Phan Tiến Sĩ",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "aa144fa4-fd23-4ec8-b463-66edff6b39c8",
        "title":  "Kỹ sư",
        "name":  "Phạm Ngọc Vũ",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "ca0cbd94-a295-42af-a537-c4d2a9bf14be",
        "title":  "CHT",
        "name":  "Trương Văn Vũ Em",
        "status":  "active",
        "phone":  "",
        "role":  "site_manager",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "c18cf22b-a063-45d3-baca-f04925458849",
        "title":  "CHT",
        "name":  "Nguyễn Sư Hoài Anh Đức",
        "status":  "active",
        "phone":  "",
        "role":  "site_manager",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "3feb4094-dd65-4854-8876-7ac935550185",
        "title":  "Trắc đạc",
        "name":  "Trương Hoài Ngọc",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "b8d8d55b-f3c7-4d8c-80b3-8bb713de61d4",
        "title":  "Thủ kho",
        "name":  "Nguyễn Trọng Khuê",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "07b233ed-4c9c-4f6e-9774-1d6ae614d9ab",
        "title":  "Thủ kho",
        "name":  "Trần Văn Trưởng",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "aa3227b7-7466-47fc-8b45-72813d0c95b3",
        "title":  "Thủ kho",
        "name":  "Trần Ngọc Giàu",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "d621ece9-ded4-48e6-af7d-7595abe801c9",
        "title":  "Thủ kho",
        "name":  "Phạm Thanh Hoài",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "4b76bed5-fe55-4b90-9f08-913537556b01",
        "title":  "Thủ kho",
        "name":  "Nguyễn Minh Khánh",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "8e839c88-4b7a-4441-9031-ca17fd8d3bc5",
        "title":  "Kỹ sư",
        "name":  "Nguyễn Văn Thành",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "5de6b666-9497-4ae4-ade1-cb3fe25cd4b9",
        "title":  "Kỹ sư",
        "name":  "Nguyễn Khắc Điệp",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "78a55374-67c9-49ce-b0fe-530a8a8d2d1d",
        "title":  "Thủ kho",
        "name":  "Nguyễn Trọng Việt",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "8607c999-17fc-4933-b992-6aa121b2c8d7",
        "title":  "Kỹ sư",
        "name":  "Nguyễn Thanh Luân",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "c6c927ec-846f-495b-8014-6bf8ea570bc5",
        "title":  "Kỹ sư",
        "name":  "Trần Trung Kiên",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "6106cfc8-d77f-4b85-abe3-d01853e774d1",
        "title":  "CHT",
        "name":  "Võ Xuân Triệu",
        "status":  "active",
        "phone":  "",
        "role":  "site_manager",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "c822abd1-1a13-4740-96dc-bf647ab3b489",
        "title":  "CHT",
        "name":  "Từ Minh Đạo",
        "status":  "active",
        "phone":  "",
        "role":  "site_manager",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "f3d3a811-2ae6-4d82-8d70-50374befc993",
        "title":  "Kỹ sư",
        "name":  "Từ Trọng Hoài",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "2c80c1a7-6da0-4289-8993-6c4dff5c5154",
        "title":  "Kỹ sư",
        "name":  "Trần Anh",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "33b2f4f3-3418-497f-8194-de3c7a50eebc",
        "title":  "CHT",
        "name":  "Phan Bá Nam",
        "status":  "active",
        "phone":  "",
        "role":  "site_manager",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "ef7be1ef-db72-4c52-ae95-5e3cc973347d",
        "title":  "Kỹ sư",
        "name":  "Trần Hùng",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "50bc0eda-c2d8-4fa4-8306-62013301527c",
        "title":  "Trắc đạc",
        "name":  "Lê Trung Hậu",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "12791698-3216-4dee-9627-7f699bfa9273",
        "title":  "ME",
        "name":  "Bùi Đức Thắng",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "255f5997-18c3-46c3-8815-a9ac169c5e76",
        "title":  "Kỹ sư",
        "name":  "Nguyễn Văn Đại",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "d9cf462f-ac88-4545-bd78-7a4bd459b00b",
        "title":  "Kỹ sư",
        "name":  "Trần Sơn Anh",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "adf19be9-b78a-4895-bc85-08fbacfd2b89",
        "title":  "Kỹ sư",
        "name":  "Trần Thanh Hậu",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "9b9cd828-4154-4fd1-87ea-d207fb9c780c",
        "title":  "CHT",
        "name":  "Nguyễn Tuấn Huy",
        "status":  "active",
        "phone":  "",
        "role":  "site_manager",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "399b97f3-8753-4279-8587-6c1ef3c8005d",
        "title":  "Kỹ sư",
        "name":  "Trương Phước Danh",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "280ed8bd-e7bf-4e3e-8be8-7d101afcff3c",
        "title":  "Kỹ sư",
        "name":  "Cao Xuân Thắng",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "46fec556-e311-4daf-a303-2bbe75420e3a",
        "title":  "CHT",
        "name":  "Từ Hoàng Anh",
        "status":  "active",
        "phone":  "",
        "role":  "site_manager",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "7142ed39-6462-4b9f-b98b-de74dd62f62f",
        "title":  "Kỹ sư",
        "name":  "Nguyễn Văn Trọng",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "e592e0be-d2d0-4a0d-bae8-b111bc37e7f7",
        "title":  "Kỹ sư",
        "name":  "Dương Văn Tiến",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "24b7c37a-5385-4a5f-bff5-550359e8a3cd",
        "title":  "Kỹ sư",
        "name":  "Đinh Văn Cường",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "bb071b8d-3b67-4221-934a-19ecd1ce5a51",
        "title":  "Kỹ sư",
        "name":  "Nguyễn Hồng Hạnh",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "6ed3e1e1-9f15-4c32-b6d0-195b588b5900",
        "title":  "Nhân viên QA - QC",
        "name":  "Phan Đình Trí",
        "status":  "active",
        "phone":  "",
        "role":  "qc_staff",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận QA-QC"
    },
    {
        "id":  "939f45a6-bfb1-4bd4-b996-2360d9a8d0a3",
        "title":  "Nhân viên QA - QC",
        "name":  "Nguyễn Đức Tiến",
        "status":  "active",
        "phone":  "",
        "role":  "qc_staff",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận QA-QC"
    },
    {
        "id":  "0e7791b8-a870-4a30-87d9-230dacdd1188",
        "title":  "Nhân viên QA - QC",
        "name":  "Phạm Ngọc Cầm",
        "status":  "active",
        "phone":  "",
        "role":  "qc_staff",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận QA-QC"
    },
    {
        "id":  "7003053b-7528-4d6a-b1ce-cefe8f641c2b",
        "title":  "Nhân viên QA - QC",
        "name":  "Nguyễn Ngọc Quốc",
        "status":  "active",
        "phone":  "",
        "role":  "qc_staff",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận QA-QC"
    },
    {
        "id":  "fd7dccc9-ec75-4cbf-bb2d-07b217e7745d",
        "title":  "Nhân viên QA - QC",
        "name":  "Lê Minh Khoa",
        "status":  "active",
        "phone":  "",
        "role":  "qc_staff",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận QA-QC"
    },
    {
        "id":  "7a23fbbb-a5bf-46fe-9a3b-2194577e926b",
        "title":  "Nhân viên QA - QC",
        "name":  "Nguyễn Khắc Vũ",
        "status":  "active",
        "phone":  "",
        "role":  "qc_staff",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận QA-QC"
    },
    {
        "id":  "84bf3485-6370-443f-822a-75f6c2e9402f",
        "title":  "Quản lý Bộ phận",
        "name":  "Phan Khánh Phương",
        "status":  "active",
        "phone":  "",
        "role":  "qc_manager",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận QA-QC"
    },
    {
        "id":  "b5b56cfe-4818-4e87-9b5f-b6ad1c7b4ae6",
        "title":  "",
        "name":  "Nguyễn Tấn Hoanh",
        "status":  "active",
        "phone":  "",
        "role":  "hse_staff",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận HSE"
    },
    {
        "id":  "d209f527-c9d1-4cfa-b6f3-521232a44152",
        "title":  "Quản lý Bộ phận",
        "name":  "Lê Thanh Tuấn",
        "status":  "active",
        "phone":  "",
        "role":  "hse_manager",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận HSE"
    },
    {
        "id":  "491cc13b-4033-47ec-a43b-50e49a8536d3",
        "title":  "",
        "name":  "Phạm Duy Tài",
        "status":  "active",
        "phone":  "",
        "role":  "hse_staff",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận HSE"
    },
    {
        "id":  "e5e2204c-cae0-465a-a889-48aa6bfb0cb1",
        "title":  "Quản lý Bộ phận",
        "name":  "Nguyễn Công Luận",
        "status":  "active",
        "phone":  "",
        "role":  "sd_manager",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Shopdrawing"
    },
    {
        "id":  "e394a159-56ec-44df-834b-087a4d192e5b",
        "title":  "Nhân viên Shopdrawing",
        "name":  "Đặng Thanh Quang",
        "status":  "active",
        "phone":  "",
        "role":  "sd_staff",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Shopdrawing"
    },
    {
        "id":  "09e6cf4e-a350-4eb2-ae94-967e9bf8dd7d",
        "title":  "Nhân viên Shopdrawing",
        "name":  "Trần Quốc Trung",
        "status":  "active",
        "phone":  "",
        "role":  "sd_staff",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Shopdrawing"
    },
    {
        "id":  "6d04c992-56d6-46db-ba2c-5d612d61249d",
        "title":  "Quản lý Bộ phận",
        "name":  "Nguyễn Hoài Nam",
        "status":  "active",
        "phone":  "",
        "role":  "mt_manager",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Bảo trì"
    },
    {
        "id":  "234c0de0-4b02-4f69-a396-f299c6074d6e",
        "title":  "Công nhân",
        "name":  "Lâm Văn Tiến",
        "status":  "active",
        "phone":  "",
        "role":  "mt_staff",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Bảo trì"
    },
    {
        "id":  "b274ab9f-0c43-4de8-83bd-2995c3fad60c",
        "title":  "Công nhân",
        "name":  "Võ Sơn Tùng",
        "status":  "active",
        "phone":  "",
        "role":  "mt_staff",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Bảo trì"
    },
    {
        "id":  "7f3e562f-f61b-4d75-9215-07f304d86c98",
        "title":  "Công nhân",
        "name":  "Hồ Văn Chanh Em",
        "status":  "active",
        "phone":  "",
        "role":  "mt_staff",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Bảo trì"
    },
    {
        "id":  "6d9c77e5-1ec6-4aa7-a778-61f6dcaf370f",
        "title":  "Công nhân",
        "name":  "Nguyễn Văn Vũ Trường",
        "status":  "active",
        "phone":  "",
        "role":  "mt_staff",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Bảo trì"
    }
];
            let deptsData = await metaGet("departments", {});
            
            // Khởi tạo các mảng
            if(!deptsData.banql) deptsData.banql = [];
            if(!deptsData.thicong) deptsData.thicong = [];
            if(!deptsData.qaqc) deptsData.qaqc = [];
            if(!deptsData.hse) deptsData.hse = [];
            if(!deptsData.shopdrawing) deptsData.shopdrawing = [];
            if(!deptsData.baotri) deptsData.baotri = [];
            
            rawUsers.forEach(u => {
                let key = "";
                if(u.department === "Quản lý") key = "banql";
                else if(u.department === "Bộ phận Thi công") key = "thicong";
                else if(u.department === "Bộ phận QA-QC") key = "qaqc";
                else if(u.department === "Bộ phận HSE") key = "hse";
                else if(u.department === "Bộ phận Shopdrawing") key = "shopdrawing";
                else if(u.department === "Bộ phận Bảo trì") key = "baotri";
                
                if(key) {
                    deptsData[key].push({ name: u.name, position: u.title });
                }
            });
            
            await metaSet("departments", deptsData);
            await metaSet("hr_imported_depts_v3", true);
            
            console.log("Đã phân bổ 62 nhân sự vào từng phòng ban tương ứng!");
            location.reload();
        }
    }
}, 3000);
// --------------------------------------

// --- AUTO FIX NAMES (RUNS ONCE) ---
setTimeout(async () => {
    if(CUR && CUR.project) {
        const fixedNames = await metaGet("hr_fixed_names_v1_correct", false);
        if(!fixedNames) {
            const fixMap = {
                "Từ Minh Đạo": "Tô Minh Đạo",
                "Từ Trọng Hoài": "Tô Trọng Hoài",
                "Từ Hoàng Anh": "Tô Hoàng Anh",
                "Diệu Anh Quốc": "Điều Anh Quốc"
            };

            // 1. Fix in departments
            let deptsData = await metaGet("departments", {});
            let updatedDepts = false;
            Object.keys(deptsData).forEach(key => {
                deptsData[key].forEach(m => {
                    if(fixMap[m.name]) {
                        m.name = fixMap[m.name];
                        updatedDepts = true;
                    }
                });
            });
            if(updatedDepts) await metaSet("departments", deptsData);

            // 2. Fix in team
            let teamData = await metaGet("team:" + CUR.project, []);
            let updatedTeam = false;
            teamData.forEach(u => {
                if(fixMap[u.name]) {
                    u.name = fixMap[u.name];
                    updatedTeam = true;
                }
            });
            if(updatedTeam) await metaSet("team:" + CUR.project, teamData);

            // 3. Fix in users
            let usersData = await metaGet("users", []);
            let updatedUsers = false;
            usersData.forEach(u => {
                if(fixMap[u.full_name]) {
                    u.full_name = fixMap[u.full_name];
                    updatedUsers = true;
                }
                if(fixMap[u.name]) {
                    u.name = fixMap[u.name];
                    updatedUsers = true;
                }
            });
            if(updatedUsers) await metaSet("users", usersData);

            await metaSet("hr_fixed_names_v1_correct", true);
            console.log("Hệ thống đã sửa lỗi chính tả tên các nhân sự (Tô Hoàng Anh, Điều Anh Quốc...) thành công!");
            location.reload();
        }
    }
}, 3000);
// --------------------------------------

// --- AUTO FIX NAMES V2 (RUNS ONCE) ---
setTimeout(async () => {
    if(CUR && CUR.project) {
        const fixedNamesV2 = await metaGet("hr_fixed_names_v2", false);
        if(!fixedNamesV2) {
            const fixMap = {
                "Tô Minh Đạo": "Tạ Minh Đạo",
                "Từ Minh Đạo": "Tạ Minh Đạo",
                "Nguyễn Văn Đại": "Nguyễn Văn Đới",
                "Trần Văn Trưởng": "Trần Văn Trường",
                "Bùi Đức Thắng": "Bá Đức Thông",
                "Nguyễn Khắc Vũ": "Nguyễn Khắc Vụ"
            };

            // 1. Fix in departments
            let deptsData = await metaGet("departments", {});
            let updatedDepts = false;
            Object.keys(deptsData).forEach(key => {
                deptsData[key].forEach(m => {
                    if(fixMap[m.name]) {
                        m.name = fixMap[m.name];
                        updatedDepts = true;
                    }
                });
            });
            if(updatedDepts) await metaSet("departments", deptsData);

            // 2. Fix in team
            let teamData = await metaGet("team:" + CUR.project, []);
            let updatedTeam = false;
            teamData.forEach(u => {
                if(fixMap[u.name]) {
                    u.name = fixMap[u.name];
                    updatedTeam = true;
                }
            });
            if(updatedTeam) await metaSet("team:" + CUR.project, teamData);

            // 3. Fix in users
            let usersData = await metaGet("users", []);
            let updatedUsers = false;
            usersData.forEach(u => {
                if(fixMap[u.full_name]) {
                    u.full_name = fixMap[u.full_name];
                    updatedUsers = true;
                }
                if(fixMap[u.name]) {
                    u.name = fixMap[u.name];
                    updatedUsers = true;
                }
            });
            if(updatedUsers) await metaSet("users", usersData);

            await metaSet("hr_fixed_names_v2", true);
            console.log("Hệ thống đã cập nhật sửa lỗi tên (Tạ Minh Đạo, Nguyễn Văn Đới...) thành công!");
            location.reload();
        }
    }
}, 3500);
// --------------------------------------

// --- AUTO FIX NAMES V3 (RUNS ONCE) ---
setTimeout(async () => {
    if(CUR && CUR.project) {
        const fixedNamesV3 = await metaGet("hr_fixed_names_v3", false);
        if(!fixedNamesV3) {
            const fixMap = {
                "Đinh Văn Cường": "Đinh Văn Cương",
                "Võ Xuân Triệu": "Võ Xuân Triều",
                "Phạm Ngọc Cầm": "Phạm Ngọc Cẩm"
            };

            // 1. Fix in departments
            let deptsData = await metaGet("departments", {});
            let updatedDepts = false;
            Object.keys(deptsData).forEach(key => {
                deptsData[key].forEach(m => {
                    if(fixMap[m.name]) {
                        m.name = fixMap[m.name];
                        updatedDepts = true;
                    }
                });
            });
            if(updatedDepts) await metaSet("departments", deptsData);

            // 2. Fix in team
            let teamData = await metaGet("team:" + CUR.project, []);
            let updatedTeam = false;
            teamData.forEach(u => {
                if(fixMap[u.name]) {
                    u.name = fixMap[u.name];
                    updatedTeam = true;
                }
            });
            if(updatedTeam) await metaSet("team:" + CUR.project, teamData);

            // 3. Fix in users
            let usersData = await metaGet("users", []);
            let updatedUsers = false;
            usersData.forEach(u => {
                if(fixMap[u.full_name]) {
                    u.full_name = fixMap[u.full_name];
                    updatedUsers = true;
                }
                if(fixMap[u.name]) {
                    u.name = fixMap[u.name];
                    updatedUsers = true;
                }
            });
            if(updatedUsers) await metaSet("users", usersData);

            await metaSet("hr_fixed_names_v3", true);
            console.log("Hệ thống đã cập nhật sửa đổi: Đinh Văn Cương, Võ Xuân Triều, Phạm Ngọc Cẩm thành công!");
            location.reload();
        }
    }
}, 3500);
// --------------------------------------

// --- AUTO MIGRATE 62 USERS TO GLOBAL USERS TABLE (RUNS ONCE) ---
setTimeout(async () => {
    const migrated = await metaGet("hr_migrated_global_users", false);
    if(!migrated) {
        const rawUsers = [
    {
        "id":  "7da2168a-47be-41a8-b11b-75e1bd448ce8",
        "title":  "P.TGĐ",
        "name":  "Hồ Văn Thi",
        "status":  "active",
        "phone":  "",
        "role":  "director",
        "added_at":  "2026-06-24",
        "department":  "Quản lý"
    },
    {
        "id":  "9b0c8a97-3c8d-465f-a5ee-6edab2386d19",
        "title":  "",
        "name":  "Huỳnh Thanh Phương",
        "status":  "active",
        "phone":  "",
        "role":  "director",
        "added_at":  "2026-06-24",
        "department":  "Quản lý"
    },
    {
        "id":  "78236f45-8794-4a59-86a3-609741e29065",
        "title":  "Thủ kho",
        "name":  "Nguyễn Hữu Phước",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "bf456e50-ecd7-4a0e-8b83-53a1e36614df",
        "title":  "CHT",
        "name":  "Lê Hiếu",
        "status":  "active",
        "phone":  "",
        "role":  "site_manager",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "f72be685-699d-4b00-bae7-2d63cfd55141",
        "title":  "CHT",
        "name":  "Thiều Quang Minh",
        "status":  "active",
        "phone":  "",
        "role":  "site_manager",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "894f4cd6-e836-46c0-8a90-18be941abd50",
        "title":  "CHT",
        "name":  "Phan Lê Duy",
        "status":  "active",
        "phone":  "",
        "role":  "site_manager",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "e3171621-051a-47da-b4d7-2d2f37c69fc3",
        "title":  "CHT",
        "name":  "Phan Thành Vũ",
        "status":  "active",
        "phone":  "",
        "role":  "site_manager",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "70c65025-3fd2-4928-af2f-b91b3ee13943",
        "title":  "Kỹ sư",
        "name":  "Nguyễn Thanh Lâm",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "d549beec-ae12-4a7d-8af6-f9d72c9a7e11",
        "title":  "Thủ kho",
        "name":  "Nguyễn Thanh Bình",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "36f1eb27-b395-46bb-902d-c62d79e0c21d",
        "title":  "Kỹ sư",
        "name":  "Điều Anh Quốc",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "58a3f626-b197-4579-b7f8-71036aabce6c",
        "title":  "Thủ kho",
        "name":  "Phan Tiến Sĩ",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "aa144fa4-fd23-4ec8-b463-66edff6b39c8",
        "title":  "Kỹ sư",
        "name":  "Phạm Ngọc Vũ",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "ca0cbd94-a295-42af-a537-c4d2a9bf14be",
        "title":  "CHT",
        "name":  "Trương Văn Vũ Em",
        "status":  "active",
        "phone":  "",
        "role":  "site_manager",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "c18cf22b-a063-45d3-baca-f04925458849",
        "title":  "CHT",
        "name":  "Nguyễn Sư Hoài Anh Đức",
        "status":  "active",
        "phone":  "",
        "role":  "site_manager",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "3feb4094-dd65-4854-8876-7ac935550185",
        "title":  "Trắc đạc",
        "name":  "Trương Hoài Ngọc",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "b8d8d55b-f3c7-4d8c-80b3-8bb713de61d4",
        "title":  "Thủ kho",
        "name":  "Nguyễn Trọng Khuê",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "07b233ed-4c9c-4f6e-9774-1d6ae614d9ab",
        "title":  "Thủ kho",
        "name":  "Trần Văn Trường",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "aa3227b7-7466-47fc-8b45-72813d0c95b3",
        "title":  "Thủ kho",
        "name":  "Trần Ngọc Giàu",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "d621ece9-ded4-48e6-af7d-7595abe801c9",
        "title":  "Thủ kho",
        "name":  "Phạm Thanh Hoài",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "4b76bed5-fe55-4b90-9f08-913537556b01",
        "title":  "Thủ kho",
        "name":  "Nguyễn Minh Khánh",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "8e839c88-4b7a-4441-9031-ca17fd8d3bc5",
        "title":  "Kỹ sư",
        "name":  "Nguyễn Văn Thành",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "5de6b666-9497-4ae4-ade1-cb3fe25cd4b9",
        "title":  "Kỹ sư",
        "name":  "Nguyễn Khắc Điệp",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "78a55374-67c9-49ce-b0fe-530a8a8d2d1d",
        "title":  "Thủ kho",
        "name":  "Nguyễn Trọng Việt",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "8607c999-17fc-4933-b992-6aa121b2c8d7",
        "title":  "Kỹ sư",
        "name":  "Nguyễn Thanh Luân",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "c6c927ec-846f-495b-8014-6bf8ea570bc5",
        "title":  "Kỹ sư",
        "name":  "Trần Trung Kiên",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "6106cfc8-d77f-4b85-abe3-d01853e774d1",
        "title":  "CHT",
        "name":  "Võ Xuân Triều",
        "status":  "active",
        "phone":  "",
        "role":  "site_manager",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "c822abd1-1a13-4740-96dc-bf647ab3b489",
        "title":  "CHT",
        "name":  "Tạ Minh Đạo",
        "status":  "active",
        "phone":  "",
        "role":  "site_manager",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "f3d3a811-2ae6-4d82-8d70-50374befc993",
        "title":  "Kỹ sư",
        "name":  "Tô Trọng Hoài",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "2c80c1a7-6da0-4289-8993-6c4dff5c5154",
        "title":  "Kỹ sư",
        "name":  "Trần Anh",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "33b2f4f3-3418-497f-8194-de3c7a50eebc",
        "title":  "CHT",
        "name":  "Phan Bá Nam",
        "status":  "active",
        "phone":  "",
        "role":  "site_manager",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "ef7be1ef-db72-4c52-ae95-5e3cc973347d",
        "title":  "Kỹ sư",
        "name":  "Trần Hùng",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "50bc0eda-c2d8-4fa4-8306-62013301527c",
        "title":  "Trắc đạc",
        "name":  "Lê Trung Hậu",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "12791698-3216-4dee-9627-7f699bfa9273",
        "title":  "ME",
        "name":  "Bá Đức Thông",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "255f5997-18c3-46c3-8815-a9ac169c5e76",
        "title":  "Kỹ sư",
        "name":  "Nguyễn Văn Đới",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "d9cf462f-ac88-4545-bd78-7a4bd459b00b",
        "title":  "Kỹ sư",
        "name":  "Trần Sơn Anh",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "adf19be9-b78a-4895-bc85-08fbacfd2b89",
        "title":  "Kỹ sư",
        "name":  "Trần Thanh Hậu",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "9b9cd828-4154-4fd1-87ea-d207fb9c780c",
        "title":  "CHT",
        "name":  "Nguyễn Tuấn Huy",
        "status":  "active",
        "phone":  "",
        "role":  "site_manager",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "399b97f3-8753-4279-8587-6c1ef3c8005d",
        "title":  "Kỹ sư",
        "name":  "Trương Phước Danh",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "280ed8bd-e7bf-4e3e-8be8-7d101afcff3c",
        "title":  "Kỹ sư",
        "name":  "Cao Xuân Thắng",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "46fec556-e311-4daf-a303-2bbe75420e3a",
        "title":  "CHT",
        "name":  "Tô Hoàng Anh",
        "status":  "active",
        "phone":  "",
        "role":  "site_manager",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "7142ed39-6462-4b9f-b98b-de74dd62f62f",
        "title":  "Kỹ sư",
        "name":  "Nguyễn Văn Trọng",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "e592e0be-d2d0-4a0d-bae8-b111bc37e7f7",
        "title":  "Kỹ sư",
        "name":  "Dương Văn Tiến",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "24b7c37a-5385-4a5f-bff5-550359e8a3cd",
        "title":  "Kỹ sư",
        "name":  "Đinh Văn Cương",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "bb071b8d-3b67-4221-934a-19ecd1ce5a51",
        "title":  "Kỹ sư",
        "name":  "Nguyễn Hồng Hạnh",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "6ed3e1e1-9f15-4c32-b6d0-195b588b5900",
        "title":  "Nhân viên QA - QC",
        "name":  "Phan Đình Trí",
        "status":  "active",
        "phone":  "",
        "role":  "qc_staff",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận QA-QC"
    },
    {
        "id":  "939f45a6-bfb1-4bd4-b996-2360d9a8d0a3",
        "title":  "Nhân viên QA - QC",
        "name":  "Nguyễn Đức Tiến",
        "status":  "active",
        "phone":  "",
        "role":  "qc_staff",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận QA-QC"
    },
    {
        "id":  "0e7791b8-a870-4a30-87d9-230dacdd1188",
        "title":  "Nhân viên QA - QC",
        "name":  "Phạm Ngọc Cẩm",
        "status":  "active",
        "phone":  "",
        "role":  "qc_staff",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận QA-QC"
    },
    {
        "id":  "7003053b-7528-4d6a-b1ce-cefe8f641c2b",
        "title":  "Nhân viên QA - QC",
        "name":  "Nguyễn Ngọc Quốc",
        "status":  "active",
        "phone":  "",
        "role":  "qc_staff",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận QA-QC"
    },
    {
        "id":  "fd7dccc9-ec75-4cbf-bb2d-07b217e7745d",
        "title":  "Nhân viên QA - QC",
        "name":  "Lê Minh Khoa",
        "status":  "active",
        "phone":  "",
        "role":  "qc_staff",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận QA-QC"
    },
    {
        "id":  "7a23fbbb-a5bf-46fe-9a3b-2194577e926b",
        "title":  "Nhân viên QA - QC",
        "name":  "Nguyễn Khắc Vụ",
        "status":  "active",
        "phone":  "",
        "role":  "qc_staff",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận QA-QC"
    },
    {
        "id":  "84bf3485-6370-443f-822a-75f6c2e9402f",
        "title":  "Quản lý Bộ phận",
        "name":  "Phan Khánh Phương",
        "status":  "active",
        "phone":  "",
        "role":  "qc_manager",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận QA-QC"
    },
    {
        "id":  "b5b56cfe-4818-4e87-9b5f-b6ad1c7b4ae6",
        "title":  "",
        "name":  "Nguyễn Tấn Hoanh",
        "status":  "active",
        "phone":  "",
        "role":  "hse_staff",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận HSE"
    },
    {
        "id":  "d209f527-c9d1-4cfa-b6f3-521232a44152",
        "title":  "Quản lý Bộ phận",
        "name":  "Lê Thanh Tuấn",
        "status":  "active",
        "phone":  "",
        "role":  "hse_manager",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận HSE"
    },
    {
        "id":  "491cc13b-4033-47ec-a43b-50e49a8536d3",
        "title":  "",
        "name":  "Phạm Duy Tài",
        "status":  "active",
        "phone":  "",
        "role":  "hse_staff",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận HSE"
    },
    {
        "id":  "e5e2204c-cae0-465a-a889-48aa6bfb0cb1",
        "title":  "Quản lý Bộ phận",
        "name":  "Nguyễn Công Luận",
        "status":  "active",
        "phone":  "",
        "role":  "sd_manager",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Shopdrawing"
    },
    {
        "id":  "e394a159-56ec-44df-834b-087a4d192e5b",
        "title":  "Nhân viên Shopdrawing",
        "name":  "Đặng Thanh Quang",
        "status":  "active",
        "phone":  "",
        "role":  "sd_staff",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Shopdrawing"
    },
    {
        "id":  "09e6cf4e-a350-4eb2-ae94-967e9bf8dd7d",
        "title":  "Nhân viên Shopdrawing",
        "name":  "Trần Quốc Trung",
        "status":  "active",
        "phone":  "",
        "role":  "sd_staff",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Shopdrawing"
    },
    {
        "id":  "6d04c992-56d6-46db-ba2c-5d612d61249d",
        "title":  "Quản lý Bộ phận",
        "name":  "Nguyễn Hoài Nam",
        "status":  "active",
        "phone":  "",
        "role":  "mt_manager",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Bảo trì"
    },
    {
        "id":  "234c0de0-4b02-4f69-a396-f299c6074d6e",
        "title":  "Công nhân",
        "name":  "Lâm Văn Tiến",
        "status":  "active",
        "phone":  "",
        "role":  "mt_staff",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Bảo trì"
    },
    {
        "id":  "b274ab9f-0c43-4de8-83bd-2995c3fad60c",
        "title":  "Công nhân",
        "name":  "Võ Sơn Tùng",
        "status":  "active",
        "phone":  "",
        "role":  "mt_staff",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Bảo trì"
    },
    {
        "id":  "7f3e562f-f61b-4d75-9215-07f304d86c98",
        "title":  "Công nhân",
        "name":  "Hồ Văn Chanh Em",
        "status":  "active",
        "phone":  "",
        "role":  "mt_staff",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Bảo trì"
    },
    {
        "id":  "6d9c77e5-1ec6-4aa7-a778-61f6dcaf370f",
        "title":  "Công nhân",
        "name":  "Nguyễn Văn Vũ Trường",
        "status":  "active",
        "phone":  "",
        "role":  "mt_staff",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Bảo trì"
    }
];
        let globalUsers = await metaGet("users", []);

        const removeAccents = (str) => {
            return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase();
        };
        const genUsername = (name) => {
            let parts = removeAccents(name).trim().split(/\s+/);
            if(parts.length === 1) return parts[0];
            let last = parts.pop();
            let initials = parts.map(p => p[0]).join('');
            return last + initials;
        };

        let countAdded = 0;
        rawUsers.forEach(u => {
            // Check if already exists by id
            let exists = globalUsers.find(g => g.id === u.id);
            if(!exists) {
                // Determine base username
                let baseUsername = genUsername(u.name);
                let finalUsername = baseUsername;
                let counter = 1;
                // Ensure unique username
                while(globalUsers.find(g => g.username === finalUsername)) {
                    finalUsername = baseUsername + counter;
                    counter++;
                }

                globalUsers.push({
                    id: u.id,
                    full_name: u.name,
                    username: finalUsername,
                    role: u.role,
                    pw: "" // FIX 18/07: khong cap mat khau mac dinh — lan dau dang nhap tu dat
                });
                countAdded++;
            }
        });

        if(countAdded > 0) {
            await metaSet("users", globalUsers);
        }
        await metaSet("hr_migrated_global_users", true);
        console.log("Đã khởi tạo thành công " + countAdded + " tài khoản người dùng với tên đăng nhập tương ứng! (Mật khẩu mặc định: 123456)");
        location.reload();
    }
}, 4000);
// --------------------------------------

// --- AUTO FIX GLOBAL USERS (RUNS ONCE) ---
setTimeout(async () => {
    const fixedGlobal = await metaGet("hr_fixed_global_users_v2", false);
    if(!fixedGlobal) {
        const rawUsers = [
    {
        "id":  "7da2168a-47be-41a8-b11b-75e1bd448ce8",
        "title":  "P.TGĐ",
        "name":  "Hồ Văn Thi",
        "status":  "active",
        "phone":  "",
        "role":  "director",
        "added_at":  "2026-06-24",
        "department":  "Quản lý"
    },
    {
        "id":  "9b0c8a97-3c8d-465f-a5ee-6edab2386d19",
        "title":  "",
        "name":  "Huỳnh Thanh Phương",
        "status":  "active",
        "phone":  "",
        "role":  "director",
        "added_at":  "2026-06-24",
        "department":  "Quản lý"
    },
    {
        "id":  "78236f45-8794-4a59-86a3-609741e29065",
        "title":  "Thủ kho",
        "name":  "Nguyễn Hữu Phước",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "bf456e50-ecd7-4a0e-8b83-53a1e36614df",
        "title":  "CHT",
        "name":  "Lê Hiếu",
        "status":  "active",
        "phone":  "",
        "role":  "site_manager",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "f72be685-699d-4b00-bae7-2d63cfd55141",
        "title":  "CHT",
        "name":  "Thiều Quang Minh",
        "status":  "active",
        "phone":  "",
        "role":  "site_manager",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "894f4cd6-e836-46c0-8a90-18be941abd50",
        "title":  "CHT",
        "name":  "Phan Lê Duy",
        "status":  "active",
        "phone":  "",
        "role":  "site_manager",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "e3171621-051a-47da-b4d7-2d2f37c69fc3",
        "title":  "CHT",
        "name":  "Phan Thành Vũ",
        "status":  "active",
        "phone":  "",
        "role":  "site_manager",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "70c65025-3fd2-4928-af2f-b91b3ee13943",
        "title":  "Kỹ sư",
        "name":  "Nguyễn Thanh Lâm",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "d549beec-ae12-4a7d-8af6-f9d72c9a7e11",
        "title":  "Thủ kho",
        "name":  "Nguyễn Thanh Bình",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "36f1eb27-b395-46bb-902d-c62d79e0c21d",
        "title":  "Kỹ sư",
        "name":  "Điều Anh Quốc",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "58a3f626-b197-4579-b7f8-71036aabce6c",
        "title":  "Thủ kho",
        "name":  "Phan Tiến Sĩ",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "aa144fa4-fd23-4ec8-b463-66edff6b39c8",
        "title":  "Kỹ sư",
        "name":  "Phạm Ngọc Vũ",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "ca0cbd94-a295-42af-a537-c4d2a9bf14be",
        "title":  "CHT",
        "name":  "Trương Văn Vũ Em",
        "status":  "active",
        "phone":  "",
        "role":  "site_manager",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "c18cf22b-a063-45d3-baca-f04925458849",
        "title":  "CHT",
        "name":  "Nguyễn Sư Hoài Anh Đức",
        "status":  "active",
        "phone":  "",
        "role":  "site_manager",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "3feb4094-dd65-4854-8876-7ac935550185",
        "title":  "Trắc đạc",
        "name":  "Trương Hoài Ngọc",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "b8d8d55b-f3c7-4d8c-80b3-8bb713de61d4",
        "title":  "Thủ kho",
        "name":  "Nguyễn Trọng Khuê",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "07b233ed-4c9c-4f6e-9774-1d6ae614d9ab",
        "title":  "Thủ kho",
        "name":  "Trần Văn Trường",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "aa3227b7-7466-47fc-8b45-72813d0c95b3",
        "title":  "Thủ kho",
        "name":  "Trần Ngọc Giàu",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "d621ece9-ded4-48e6-af7d-7595abe801c9",
        "title":  "Thủ kho",
        "name":  "Phạm Thanh Hoài",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "4b76bed5-fe55-4b90-9f08-913537556b01",
        "title":  "Thủ kho",
        "name":  "Nguyễn Minh Khánh",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "8e839c88-4b7a-4441-9031-ca17fd8d3bc5",
        "title":  "Kỹ sư",
        "name":  "Nguyễn Văn Thành",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "5de6b666-9497-4ae4-ade1-cb3fe25cd4b9",
        "title":  "Kỹ sư",
        "name":  "Nguyễn Khắc Điệp",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "78a55374-67c9-49ce-b0fe-530a8a8d2d1d",
        "title":  "Thủ kho",
        "name":  "Nguyễn Trọng Việt",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "8607c999-17fc-4933-b992-6aa121b2c8d7",
        "title":  "Kỹ sư",
        "name":  "Nguyễn Thanh Luân",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "c6c927ec-846f-495b-8014-6bf8ea570bc5",
        "title":  "Kỹ sư",
        "name":  "Trần Trung Kiên",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "6106cfc8-d77f-4b85-abe3-d01853e774d1",
        "title":  "CHT",
        "name":  "Võ Xuân Triều",
        "status":  "active",
        "phone":  "",
        "role":  "site_manager",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "c822abd1-1a13-4740-96dc-bf647ab3b489",
        "title":  "CHT",
        "name":  "Tạ Minh Đạo",
        "status":  "active",
        "phone":  "",
        "role":  "site_manager",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "f3d3a811-2ae6-4d82-8d70-50374befc993",
        "title":  "Kỹ sư",
        "name":  "Tô Trọng Hoài",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "2c80c1a7-6da0-4289-8993-6c4dff5c5154",
        "title":  "Kỹ sư",
        "name":  "Trần Anh",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "33b2f4f3-3418-497f-8194-de3c7a50eebc",
        "title":  "CHT",
        "name":  "Phan Bá Nam",
        "status":  "active",
        "phone":  "",
        "role":  "site_manager",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "ef7be1ef-db72-4c52-ae95-5e3cc973347d",
        "title":  "Kỹ sư",
        "name":  "Trần Hùng",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "50bc0eda-c2d8-4fa4-8306-62013301527c",
        "title":  "Trắc đạc",
        "name":  "Lê Trung Hậu",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "12791698-3216-4dee-9627-7f699bfa9273",
        "title":  "ME",
        "name":  "Bá Đức Thông",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "255f5997-18c3-46c3-8815-a9ac169c5e76",
        "title":  "Kỹ sư",
        "name":  "Nguyễn Văn Đới",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "d9cf462f-ac88-4545-bd78-7a4bd459b00b",
        "title":  "Kỹ sư",
        "name":  "Trần Sơn Anh",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "adf19be9-b78a-4895-bc85-08fbacfd2b89",
        "title":  "Kỹ sư",
        "name":  "Trần Thanh Hậu",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "9b9cd828-4154-4fd1-87ea-d207fb9c780c",
        "title":  "CHT",
        "name":  "Nguyễn Tuấn Huy",
        "status":  "active",
        "phone":  "",
        "role":  "site_manager",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "399b97f3-8753-4279-8587-6c1ef3c8005d",
        "title":  "Kỹ sư",
        "name":  "Trương Phước Danh",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "280ed8bd-e7bf-4e3e-8be8-7d101afcff3c",
        "title":  "Kỹ sư",
        "name":  "Cao Xuân Thắng",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "46fec556-e311-4daf-a303-2bbe75420e3a",
        "title":  "CHT",
        "name":  "Tô Hoàng Anh",
        "status":  "active",
        "phone":  "",
        "role":  "site_manager",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "7142ed39-6462-4b9f-b98b-de74dd62f62f",
        "title":  "Kỹ sư",
        "name":  "Nguyễn Văn Trọng",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "e592e0be-d2d0-4a0d-bae8-b111bc37e7f7",
        "title":  "Kỹ sư",
        "name":  "Dương Văn Tiến",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "24b7c37a-5385-4a5f-bff5-550359e8a3cd",
        "title":  "Kỹ sư",
        "name":  "Đinh Văn Cương",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "bb071b8d-3b67-4221-934a-19ecd1ce5a51",
        "title":  "Kỹ sư",
        "name":  "Nguyễn Hồng Hạnh",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "6ed3e1e1-9f15-4c32-b6d0-195b588b5900",
        "title":  "Nhân viên QA - QC",
        "name":  "Phan Đình Trí",
        "status":  "active",
        "phone":  "",
        "role":  "qc_staff",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận QA-QC"
    },
    {
        "id":  "939f45a6-bfb1-4bd4-b996-2360d9a8d0a3",
        "title":  "Nhân viên QA - QC",
        "name":  "Nguyễn Đức Tiến",
        "status":  "active",
        "phone":  "",
        "role":  "qc_staff",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận QA-QC"
    },
    {
        "id":  "0e7791b8-a870-4a30-87d9-230dacdd1188",
        "title":  "Nhân viên QA - QC",
        "name":  "Phạm Ngọc Cẩm",
        "status":  "active",
        "phone":  "",
        "role":  "qc_staff",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận QA-QC"
    },
    {
        "id":  "7003053b-7528-4d6a-b1ce-cefe8f641c2b",
        "title":  "Nhân viên QA - QC",
        "name":  "Nguyễn Ngọc Quốc",
        "status":  "active",
        "phone":  "",
        "role":  "qc_staff",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận QA-QC"
    },
    {
        "id":  "fd7dccc9-ec75-4cbf-bb2d-07b217e7745d",
        "title":  "Nhân viên QA - QC",
        "name":  "Lê Minh Khoa",
        "status":  "active",
        "phone":  "",
        "role":  "qc_staff",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận QA-QC"
    },
    {
        "id":  "7a23fbbb-a5bf-46fe-9a3b-2194577e926b",
        "title":  "Nhân viên QA - QC",
        "name":  "Nguyễn Khắc Vụ",
        "status":  "active",
        "phone":  "",
        "role":  "qc_staff",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận QA-QC"
    },
    {
        "id":  "84bf3485-6370-443f-822a-75f6c2e9402f",
        "title":  "Quản lý Bộ phận",
        "name":  "Phan Khánh Phương",
        "status":  "active",
        "phone":  "",
        "role":  "qc_manager",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận QA-QC"
    },
    {
        "id":  "b5b56cfe-4818-4e87-9b5f-b6ad1c7b4ae6",
        "title":  "",
        "name":  "Nguyễn Tấn Hoanh",
        "status":  "active",
        "phone":  "",
        "role":  "hse_staff",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận HSE"
    },
    {
        "id":  "d209f527-c9d1-4cfa-b6f3-521232a44152",
        "title":  "Quản lý Bộ phận",
        "name":  "Lê Thanh Tuấn",
        "status":  "active",
        "phone":  "",
        "role":  "hse_manager",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận HSE"
    },
    {
        "id":  "491cc13b-4033-47ec-a43b-50e49a8536d3",
        "title":  "",
        "name":  "Phạm Duy Tài",
        "status":  "active",
        "phone":  "",
        "role":  "hse_staff",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận HSE"
    },
    {
        "id":  "e5e2204c-cae0-465a-a889-48aa6bfb0cb1",
        "title":  "Quản lý Bộ phận",
        "name":  "Nguyễn Công Luận",
        "status":  "active",
        "phone":  "",
        "role":  "sd_manager",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Shopdrawing"
    },
    {
        "id":  "e394a159-56ec-44df-834b-087a4d192e5b",
        "title":  "Nhân viên Shopdrawing",
        "name":  "Đặng Thanh Quang",
        "status":  "active",
        "phone":  "",
        "role":  "sd_staff",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Shopdrawing"
    },
    {
        "id":  "09e6cf4e-a350-4eb2-ae94-967e9bf8dd7d",
        "title":  "Nhân viên Shopdrawing",
        "name":  "Trần Quốc Trung",
        "status":  "active",
        "phone":  "",
        "role":  "sd_staff",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Shopdrawing"
    },
    {
        "id":  "6d04c992-56d6-46db-ba2c-5d612d61249d",
        "title":  "Quản lý Bộ phận",
        "name":  "Nguyễn Hoài Nam",
        "status":  "active",
        "phone":  "",
        "role":  "mt_manager",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Bảo trì"
    },
    {
        "id":  "234c0de0-4b02-4f69-a396-f299c6074d6e",
        "title":  "Công nhân",
        "name":  "Lâm Văn Tiến",
        "status":  "active",
        "phone":  "",
        "role":  "mt_staff",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Bảo trì"
    },
    {
        "id":  "b274ab9f-0c43-4de8-83bd-2995c3fad60c",
        "title":  "Công nhân",
        "name":  "Võ Sơn Tùng",
        "status":  "active",
        "phone":  "",
        "role":  "mt_staff",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Bảo trì"
    },
    {
        "id":  "7f3e562f-f61b-4d75-9215-07f304d86c98",
        "title":  "Công nhân",
        "name":  "Hồ Văn Chanh Em",
        "status":  "active",
        "phone":  "",
        "role":  "mt_staff",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Bảo trì"
    },
    {
        "id":  "6d9c77e5-1ec6-4aa7-a778-61f6dcaf370f",
        "title":  "Công nhân",
        "name":  "Nguyễn Văn Vũ Trường",
        "status":  "active",
        "phone":  "",
        "role":  "mt_staff",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Bảo trì"
    }
];
        let globalUsers = await metaGet("users", []);

        const removeAccents = (str) => {
            return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase();
        };
        const genUsername = (name) => {
            let parts = removeAccents(name).trim().split(/\s+/);
            if(parts.length === 1) return parts[0];
            let last = parts.pop();
            let initials = parts.map(p => p[0]).join('');
            return last + initials;
        };

        rawUsers.forEach(u => {
            // Find existing user by ID or by full_name
            let existing = globalUsers.find(g => g.id === u.id || g.full_name === u.name);
            
            let targetUsername = genUsername(u.name);
            // Deduplicate username
            let counter = 1;
            let finalUsername = targetUsername;
            while(globalUsers.find(g => g.username === finalUsername && g !== existing)) {
                finalUsername = targetUsername + counter;
                counter++;
            }

            if(existing) {
                // Force update
                existing.full_name = u.name;
                existing.username = finalUsername;
                existing.role = u.role;
                // FIX 18/07: khong tu dien mat khau mac dinh — pw rong de nguoi dung tu dat lan dau
            } else {
                // Create new
                globalUsers.push({
                    id: u.id,
                    full_name: u.name,
                    username: finalUsername,
                    role: u.role,
                    pw: "" // FIX 18/07: khong cap mat khau mac dinh — lan dau dang nhap tu dat
                });
            }
        });

        await metaSet("users", globalUsers);
        await metaSet("hr_fixed_global_users_v2", true);
        console.log("Đã CẬP NHẬT CHÍNH XÁC vai trò và tên đăng nhập cho tất cả nhân sự trong Quản lý Người dùng!");
        location.reload();
    }
}, 1500);
// --------------------------------------

// --- AUTO DEDUPLICATE USERS (RUNS ONCE) ---
setTimeout(async () => {
    const fixedGlobal = await metaGet("hr_dedupe_global_users", false);
    if(!fixedGlobal) {
        const rawUsers = [
    {
        "id":  "7da2168a-47be-41a8-b11b-75e1bd448ce8",
        "title":  "P.TGĐ",
        "name":  "Hồ Văn Thi",
        "status":  "active",
        "phone":  "",
        "role":  "director",
        "added_at":  "2026-06-24",
        "department":  "Quản lý"
    },
    {
        "id":  "9b0c8a97-3c8d-465f-a5ee-6edab2386d19",
        "title":  "",
        "name":  "Huỳnh Thanh Phương",
        "status":  "active",
        "phone":  "",
        "role":  "director",
        "added_at":  "2026-06-24",
        "department":  "Quản lý"
    },
    {
        "id":  "78236f45-8794-4a59-86a3-609741e29065",
        "title":  "Thủ kho",
        "name":  "Nguyễn Hữu Phước",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "bf456e50-ecd7-4a0e-8b83-53a1e36614df",
        "title":  "CHT",
        "name":  "Lê Hiếu",
        "status":  "active",
        "phone":  "",
        "role":  "site_manager",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "f72be685-699d-4b00-bae7-2d63cfd55141",
        "title":  "CHT",
        "name":  "Thiều Quang Minh",
        "status":  "active",
        "phone":  "",
        "role":  "site_manager",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "894f4cd6-e836-46c0-8a90-18be941abd50",
        "title":  "CHT",
        "name":  "Phan Lê Duy",
        "status":  "active",
        "phone":  "",
        "role":  "site_manager",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "e3171621-051a-47da-b4d7-2d2f37c69fc3",
        "title":  "CHT",
        "name":  "Phan Thành Vũ",
        "status":  "active",
        "phone":  "",
        "role":  "site_manager",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "70c65025-3fd2-4928-af2f-b91b3ee13943",
        "title":  "Kỹ sư",
        "name":  "Nguyễn Thanh Lâm",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "d549beec-ae12-4a7d-8af6-f9d72c9a7e11",
        "title":  "Thủ kho",
        "name":  "Nguyễn Thanh Bình",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "36f1eb27-b395-46bb-902d-c62d79e0c21d",
        "title":  "Kỹ sư",
        "name":  "Điều Anh Quốc",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "58a3f626-b197-4579-b7f8-71036aabce6c",
        "title":  "Thủ kho",
        "name":  "Phan Tiến Sĩ",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "aa144fa4-fd23-4ec8-b463-66edff6b39c8",
        "title":  "Kỹ sư",
        "name":  "Phạm Ngọc Vũ",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "ca0cbd94-a295-42af-a537-c4d2a9bf14be",
        "title":  "CHT",
        "name":  "Trương Văn Vũ Em",
        "status":  "active",
        "phone":  "",
        "role":  "site_manager",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "c18cf22b-a063-45d3-baca-f04925458849",
        "title":  "CHT",
        "name":  "Nguyễn Sư Hoài Anh Đức",
        "status":  "active",
        "phone":  "",
        "role":  "site_manager",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "3feb4094-dd65-4854-8876-7ac935550185",
        "title":  "Trắc đạc",
        "name":  "Trương Hoài Ngọc",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "b8d8d55b-f3c7-4d8c-80b3-8bb713de61d4",
        "title":  "Thủ kho",
        "name":  "Nguyễn Trọng Khuê",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "07b233ed-4c9c-4f6e-9774-1d6ae614d9ab",
        "title":  "Thủ kho",
        "name":  "Trần Văn Trường",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "aa3227b7-7466-47fc-8b45-72813d0c95b3",
        "title":  "Thủ kho",
        "name":  "Trần Ngọc Giàu",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "d621ece9-ded4-48e6-af7d-7595abe801c9",
        "title":  "Thủ kho",
        "name":  "Phạm Thanh Hoài",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "4b76bed5-fe55-4b90-9f08-913537556b01",
        "title":  "Thủ kho",
        "name":  "Nguyễn Minh Khánh",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "8e839c88-4b7a-4441-9031-ca17fd8d3bc5",
        "title":  "Kỹ sư",
        "name":  "Nguyễn Văn Thành",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "5de6b666-9497-4ae4-ade1-cb3fe25cd4b9",
        "title":  "Kỹ sư",
        "name":  "Nguyễn Khắc Điệp",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "78a55374-67c9-49ce-b0fe-530a8a8d2d1d",
        "title":  "Thủ kho",
        "name":  "Nguyễn Trọng Việt",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "8607c999-17fc-4933-b992-6aa121b2c8d7",
        "title":  "Kỹ sư",
        "name":  "Nguyễn Thanh Luân",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "c6c927ec-846f-495b-8014-6bf8ea570bc5",
        "title":  "Kỹ sư",
        "name":  "Trần Trung Kiên",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "6106cfc8-d77f-4b85-abe3-d01853e774d1",
        "title":  "CHT",
        "name":  "Võ Xuân Triều",
        "status":  "active",
        "phone":  "",
        "role":  "site_manager",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "c822abd1-1a13-4740-96dc-bf647ab3b489",
        "title":  "CHT",
        "name":  "Tạ Minh Đạo",
        "status":  "active",
        "phone":  "",
        "role":  "site_manager",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "f3d3a811-2ae6-4d82-8d70-50374befc993",
        "title":  "Kỹ sư",
        "name":  "Tô Trọng Hoài",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "2c80c1a7-6da0-4289-8993-6c4dff5c5154",
        "title":  "Kỹ sư",
        "name":  "Trần Anh",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "33b2f4f3-3418-497f-8194-de3c7a50eebc",
        "title":  "CHT",
        "name":  "Phan Bá Nam",
        "status":  "active",
        "phone":  "",
        "role":  "site_manager",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "ef7be1ef-db72-4c52-ae95-5e3cc973347d",
        "title":  "Kỹ sư",
        "name":  "Trần Hùng",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "50bc0eda-c2d8-4fa4-8306-62013301527c",
        "title":  "Trắc đạc",
        "name":  "Lê Trung Hậu",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "12791698-3216-4dee-9627-7f699bfa9273",
        "title":  "ME",
        "name":  "Bá Đức Thông",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "255f5997-18c3-46c3-8815-a9ac169c5e76",
        "title":  "Kỹ sư",
        "name":  "Nguyễn Văn Đới",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "d9cf462f-ac88-4545-bd78-7a4bd459b00b",
        "title":  "Kỹ sư",
        "name":  "Trần Sơn Anh",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "adf19be9-b78a-4895-bc85-08fbacfd2b89",
        "title":  "Kỹ sư",
        "name":  "Trần Thanh Hậu",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "9b9cd828-4154-4fd1-87ea-d207fb9c780c",
        "title":  "CHT",
        "name":  "Nguyễn Tuấn Huy",
        "status":  "active",
        "phone":  "",
        "role":  "site_manager",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "399b97f3-8753-4279-8587-6c1ef3c8005d",
        "title":  "Kỹ sư",
        "name":  "Trương Phước Danh",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "280ed8bd-e7bf-4e3e-8be8-7d101afcff3c",
        "title":  "Kỹ sư",
        "name":  "Cao Xuân Thắng",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "46fec556-e311-4daf-a303-2bbe75420e3a",
        "title":  "CHT",
        "name":  "Tô Hoàng Anh",
        "status":  "active",
        "phone":  "",
        "role":  "site_manager",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "7142ed39-6462-4b9f-b98b-de74dd62f62f",
        "title":  "Kỹ sư",
        "name":  "Nguyễn Văn Trọng",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "e592e0be-d2d0-4a0d-bae8-b111bc37e7f7",
        "title":  "Kỹ sư",
        "name":  "Dương Văn Tiến",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "24b7c37a-5385-4a5f-bff5-550359e8a3cd",
        "title":  "Kỹ sư",
        "name":  "Đinh Văn Cương",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "bb071b8d-3b67-4221-934a-19ecd1ce5a51",
        "title":  "Kỹ sư",
        "name":  "Nguyễn Hồng Hạnh",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "6ed3e1e1-9f15-4c32-b6d0-195b588b5900",
        "title":  "Nhân viên QA - QC",
        "name":  "Phan Đình Trí",
        "status":  "active",
        "phone":  "",
        "role":  "qc_staff",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận QA-QC"
    },
    {
        "id":  "939f45a6-bfb1-4bd4-b996-2360d9a8d0a3",
        "title":  "Nhân viên QA - QC",
        "name":  "Nguyễn Đức Tiến",
        "status":  "active",
        "phone":  "",
        "role":  "qc_staff",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận QA-QC"
    },
    {
        "id":  "0e7791b8-a870-4a30-87d9-230dacdd1188",
        "title":  "Nhân viên QA - QC",
        "name":  "Phạm Ngọc Cẩm",
        "status":  "active",
        "phone":  "",
        "role":  "qc_staff",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận QA-QC"
    },
    {
        "id":  "7003053b-7528-4d6a-b1ce-cefe8f641c2b",
        "title":  "Nhân viên QA - QC",
        "name":  "Nguyễn Ngọc Quốc",
        "status":  "active",
        "phone":  "",
        "role":  "qc_staff",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận QA-QC"
    },
    {
        "id":  "fd7dccc9-ec75-4cbf-bb2d-07b217e7745d",
        "title":  "Nhân viên QA - QC",
        "name":  "Lê Minh Khoa",
        "status":  "active",
        "phone":  "",
        "role":  "qc_staff",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận QA-QC"
    },
    {
        "id":  "7a23fbbb-a5bf-46fe-9a3b-2194577e926b",
        "title":  "Nhân viên QA - QC",
        "name":  "Nguyễn Khắc Vụ",
        "status":  "active",
        "phone":  "",
        "role":  "qc_staff",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận QA-QC"
    },
    {
        "id":  "84bf3485-6370-443f-822a-75f6c2e9402f",
        "title":  "Quản lý Bộ phận",
        "name":  "Phan Khánh Phương",
        "status":  "active",
        "phone":  "",
        "role":  "qc_manager",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận QA-QC"
    },
    {
        "id":  "b5b56cfe-4818-4e87-9b5f-b6ad1c7b4ae6",
        "title":  "",
        "name":  "Nguyễn Tấn Hoanh",
        "status":  "active",
        "phone":  "",
        "role":  "hse_staff",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận HSE"
    },
    {
        "id":  "d209f527-c9d1-4cfa-b6f3-521232a44152",
        "title":  "Quản lý Bộ phận",
        "name":  "Lê Thanh Tuấn",
        "status":  "active",
        "phone":  "",
        "role":  "hse_manager",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận HSE"
    },
    {
        "id":  "491cc13b-4033-47ec-a43b-50e49a8536d3",
        "title":  "",
        "name":  "Phạm Duy Tài",
        "status":  "active",
        "phone":  "",
        "role":  "hse_staff",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận HSE"
    },
    {
        "id":  "e5e2204c-cae0-465a-a889-48aa6bfb0cb1",
        "title":  "Quản lý Bộ phận",
        "name":  "Nguyễn Công Luận",
        "status":  "active",
        "phone":  "",
        "role":  "sd_manager",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Shopdrawing"
    },
    {
        "id":  "e394a159-56ec-44df-834b-087a4d192e5b",
        "title":  "Nhân viên Shopdrawing",
        "name":  "Đặng Thanh Quang",
        "status":  "active",
        "phone":  "",
        "role":  "sd_staff",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Shopdrawing"
    },
    {
        "id":  "09e6cf4e-a350-4eb2-ae94-967e9bf8dd7d",
        "title":  "Nhân viên Shopdrawing",
        "name":  "Trần Quốc Trung",
        "status":  "active",
        "phone":  "",
        "role":  "sd_staff",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Shopdrawing"
    },
    {
        "id":  "6d04c992-56d6-46db-ba2c-5d612d61249d",
        "title":  "Quản lý Bộ phận",
        "name":  "Nguyễn Hoài Nam",
        "status":  "active",
        "phone":  "",
        "role":  "mt_manager",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Bảo trì"
    },
    {
        "id":  "234c0de0-4b02-4f69-a396-f299c6074d6e",
        "title":  "Công nhân",
        "name":  "Lâm Văn Tiến",
        "status":  "active",
        "phone":  "",
        "role":  "mt_staff",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Bảo trì"
    },
    {
        "id":  "b274ab9f-0c43-4de8-83bd-2995c3fad60c",
        "title":  "Công nhân",
        "name":  "Võ Sơn Tùng",
        "status":  "active",
        "phone":  "",
        "role":  "mt_staff",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Bảo trì"
    },
    {
        "id":  "7f3e562f-f61b-4d75-9215-07f304d86c98",
        "title":  "Công nhân",
        "name":  "Hồ Văn Chanh Em",
        "status":  "active",
        "phone":  "",
        "role":  "mt_staff",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Bảo trì"
    },
    {
        "id":  "6d9c77e5-1ec6-4aa7-a778-61f6dcaf370f",
        "title":  "Công nhân",
        "name":  "Nguyễn Văn Vũ Trường",
        "status":  "active",
        "phone":  "",
        "role":  "mt_staff",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Bảo trì"
    }
];
        let globalUsers = await metaGet("users", []);

        const removeAccents = (str) => {
            return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase();
        };
        const genUsername = (name) => {
            let parts = removeAccents(name).trim().split(/\s+/);
            if(parts.length === 1) return parts[0];
            let last = parts.pop();
            let initials = parts.map(p => p[0]).join('');
            return last + initials;
        };

        // Keep system defaults
        let newUsers = globalUsers.filter(u => ['u_admin','u_dir','u_pm','u_sm','u_eng','u_view'].includes(u.id));

        // Re-add 62 users from temp_team.json exactly
        rawUsers.forEach(u => {
            let targetUsername = genUsername(u.name);
            let counter = 1;
            let finalUsername = targetUsername;
            while(newUsers.find(g => g.username === finalUsername)) {
                finalUsername = targetUsername + counter;
                counter++;
            }

            // check if there's an existing pw from global users we can preserve
            let existing = globalUsers.find(g => g.full_name === u.name && g.pw);

            newUsers.push({
                id: u.id,
                full_name: u.name,
                username: finalUsername,
                role: u.role,
                pw: existing ? existing.pw : "" // FIX 18/07: het mat khau mac dinh 123456
            });
        });

        await metaSet("users", newUsers);
        await metaSet("hr_dedupe_global_users", true);
        console.log("Đã khởi tạo, làm sạch rác và cập nhật chính xác quyền CHT, Giám đốc, Kỹ sư cho toàn bộ người dùng!");
        location.reload();
    }
}, 1500);
// --------------------------------------

// --- AUTO FIX ROLES AND TITLES (RUNS ONCE) ---
setTimeout(async () => {
    const fixedRoles = await metaGet("hr_fixed_roles_titles", false);
    if(!fixedRoles) {
        const rawUsers = [
    {
        "id":  "7da2168a-47be-41a8-b11b-75e1bd448ce8",
        "title":  "P.TGĐ",
        "name":  "Hồ Văn Thi",
        "status":  "active",
        "phone":  "",
        "role":  "director",
        "added_at":  "2026-06-24",
        "department":  "Quản lý"
    },
    {
        "id":  "9b0c8a97-3c8d-465f-a5ee-6edab2386d19",
        "title":  "",
        "name":  "Huỳnh Thanh Phương",
        "status":  "active",
        "phone":  "",
        "role":  "director",
        "added_at":  "2026-06-24",
        "department":  "Quản lý"
    },
    {
        "id":  "78236f45-8794-4a59-86a3-609741e29065",
        "title":  "Thủ kho",
        "name":  "Nguyễn Hữu Phước",
        "status":  "active",
        "phone":  "",
        "role":  "storekeeper",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "bf456e50-ecd7-4a0e-8b83-53a1e36614df",
        "title":  "CHT",
        "name":  "Lê Hiếu",
        "status":  "active",
        "phone":  "",
        "role":  "site_manager",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "f72be685-699d-4b00-bae7-2d63cfd55141",
        "title":  "CHT",
        "name":  "Thiều Quang Minh",
        "status":  "active",
        "phone":  "",
        "role":  "site_manager",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "894f4cd6-e836-46c0-8a90-18be941abd50",
        "title":  "CHT",
        "name":  "Phan Lê Duy",
        "status":  "active",
        "phone":  "",
        "role":  "site_manager",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "e3171621-051a-47da-b4d7-2d2f37c69fc3",
        "title":  "CHT",
        "name":  "Phan Thành Vũ",
        "status":  "active",
        "phone":  "",
        "role":  "site_manager",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "70c65025-3fd2-4928-af2f-b91b3ee13943",
        "title":  "Kỹ sư",
        "name":  "Nguyễn Thanh Lâm",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "d549beec-ae12-4a7d-8af6-f9d72c9a7e11",
        "title":  "Thủ kho",
        "name":  "Nguyễn Thanh Bình",
        "status":  "active",
        "phone":  "",
        "role":  "storekeeper",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "36f1eb27-b395-46bb-902d-c62d79e0c21d",
        "title":  "Kỹ sư",
        "name":  "Điều Anh Quốc",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "58a3f626-b197-4579-b7f8-71036aabce6c",
        "title":  "Thủ kho",
        "name":  "Phan Tiến Sĩ",
        "status":  "active",
        "phone":  "",
        "role":  "storekeeper",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "aa144fa4-fd23-4ec8-b463-66edff6b39c8",
        "title":  "Kỹ sư",
        "name":  "Phạm Ngọc Vũ",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "ca0cbd94-a295-42af-a537-c4d2a9bf14be",
        "title":  "CHT",
        "name":  "Trương Văn Vũ Em",
        "status":  "active",
        "phone":  "",
        "role":  "site_manager",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "c18cf22b-a063-45d3-baca-f04925458849",
        "title":  "CHT",
        "name":  "Nguyễn Sư Hoài Anh Đức",
        "status":  "active",
        "phone":  "",
        "role":  "site_manager",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "3feb4094-dd65-4854-8876-7ac935550185",
        "title":  "Trắc đạc",
        "name":  "Trương Hoài Ngọc",
        "status":  "active",
        "phone":  "",
        "role":  "surveyor",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "b8d8d55b-f3c7-4d8c-80b3-8bb713de61d4",
        "title":  "Thủ kho",
        "name":  "Nguyễn Trọng Khuê",
        "status":  "active",
        "phone":  "",
        "role":  "storekeeper",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "07b233ed-4c9c-4f6e-9774-1d6ae614d9ab",
        "title":  "Thủ kho",
        "name":  "Trần Văn Trường",
        "status":  "active",
        "phone":  "",
        "role":  "storekeeper",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "aa3227b7-7466-47fc-8b45-72813d0c95b3",
        "title":  "Thủ kho",
        "name":  "Trần Ngọc Giàu",
        "status":  "active",
        "phone":  "",
        "role":  "storekeeper",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "d621ece9-ded4-48e6-af7d-7595abe801c9",
        "title":  "Thủ kho",
        "name":  "Phạm Thanh Hoài",
        "status":  "active",
        "phone":  "",
        "role":  "storekeeper",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "4b76bed5-fe55-4b90-9f08-913537556b01",
        "title":  "Thủ kho",
        "name":  "Nguyễn Minh Khánh",
        "status":  "active",
        "phone":  "",
        "role":  "storekeeper",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "8e839c88-4b7a-4441-9031-ca17fd8d3bc5",
        "title":  "Kỹ sư",
        "name":  "Nguyễn Văn Thành",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "5de6b666-9497-4ae4-ade1-cb3fe25cd4b9",
        "title":  "Kỹ sư",
        "name":  "Nguyễn Khắc Điệp",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "78a55374-67c9-49ce-b0fe-530a8a8d2d1d",
        "title":  "Thủ kho",
        "name":  "Nguyễn Trọng Việt",
        "status":  "active",
        "phone":  "",
        "role":  "storekeeper",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "8607c999-17fc-4933-b992-6aa121b2c8d7",
        "title":  "Kỹ sư",
        "name":  "Nguyễn Thanh Luân",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "c6c927ec-846f-495b-8014-6bf8ea570bc5",
        "title":  "Kỹ sư",
        "name":  "Trần Trung Kiên",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "6106cfc8-d77f-4b85-abe3-d01853e774d1",
        "title":  "CHT",
        "name":  "Võ Xuân Triều",
        "status":  "active",
        "phone":  "",
        "role":  "site_manager",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "c822abd1-1a13-4740-96dc-bf647ab3b489",
        "title":  "CHT",
        "name":  "Tạ Minh Đạo",
        "status":  "active",
        "phone":  "",
        "role":  "site_manager",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "f3d3a811-2ae6-4d82-8d70-50374befc993",
        "title":  "Kỹ sư",
        "name":  "Tô Trọng Hoài",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "2c80c1a7-6da0-4289-8993-6c4dff5c5154",
        "title":  "Kỹ sư",
        "name":  "Trần Anh",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "33b2f4f3-3418-497f-8194-de3c7a50eebc",
        "title":  "CHT",
        "name":  "Phan Bá Nam",
        "status":  "active",
        "phone":  "",
        "role":  "site_manager",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "ef7be1ef-db72-4c52-ae95-5e3cc973347d",
        "title":  "Kỹ sư",
        "name":  "Trần Hùng",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "50bc0eda-c2d8-4fa4-8306-62013301527c",
        "title":  "Trắc đạc",
        "name":  "Lê Trung Hậu",
        "status":  "active",
        "phone":  "",
        "role":  "surveyor",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "12791698-3216-4dee-9627-7f699bfa9273",
        "title":  "ME",
        "name":  "Bá Đức Thông",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "255f5997-18c3-46c3-8815-a9ac169c5e76",
        "title":  "Kỹ sư",
        "name":  "Nguyễn Văn Đới",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "d9cf462f-ac88-4545-bd78-7a4bd459b00b",
        "title":  "Kỹ sư",
        "name":  "Trần Sơn Anh",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "adf19be9-b78a-4895-bc85-08fbacfd2b89",
        "title":  "Kỹ sư",
        "name":  "Trần Thanh Hậu",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "9b9cd828-4154-4fd1-87ea-d207fb9c780c",
        "title":  "CHT",
        "name":  "Nguyễn Tuấn Huy",
        "status":  "active",
        "phone":  "",
        "role":  "site_manager",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "399b97f3-8753-4279-8587-6c1ef3c8005d",
        "title":  "Kỹ sư",
        "name":  "Trương Phước Danh",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "280ed8bd-e7bf-4e3e-8be8-7d101afcff3c",
        "title":  "Kỹ sư",
        "name":  "Cao Xuân Thắng",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "46fec556-e311-4daf-a303-2bbe75420e3a",
        "title":  "CHT",
        "name":  "Tô Hoàng Anh",
        "status":  "active",
        "phone":  "",
        "role":  "site_manager",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "7142ed39-6462-4b9f-b98b-de74dd62f62f",
        "title":  "Kỹ sư",
        "name":  "Nguyễn Văn Trọng",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "e592e0be-d2d0-4a0d-bae8-b111bc37e7f7",
        "title":  "Kỹ sư",
        "name":  "Dương Văn Tiến",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "24b7c37a-5385-4a5f-bff5-550359e8a3cd",
        "title":  "Kỹ sư",
        "name":  "Đinh Văn Cương",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "bb071b8d-3b67-4221-934a-19ecd1ce5a51",
        "title":  "Kỹ sư",
        "name":  "Nguyễn Hồng Hạnh",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "6ed3e1e1-9f15-4c32-b6d0-195b588b5900",
        "title":  "Nhân viên QA - QC",
        "name":  "Phan Đình Trí",
        "status":  "active",
        "phone":  "",
        "role":  "qc_staff",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận QA-QC"
    },
    {
        "id":  "939f45a6-bfb1-4bd4-b996-2360d9a8d0a3",
        "title":  "Nhân viên QA - QC",
        "name":  "Nguyễn Đức Tiến",
        "status":  "active",
        "phone":  "",
        "role":  "qc_staff",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận QA-QC"
    },
    {
        "id":  "0e7791b8-a870-4a30-87d9-230dacdd1188",
        "title":  "Nhân viên QA - QC",
        "name":  "Phạm Ngọc Cẩm",
        "status":  "active",
        "phone":  "",
        "role":  "qc_staff",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận QA-QC"
    },
    {
        "id":  "7003053b-7528-4d6a-b1ce-cefe8f641c2b",
        "title":  "Nhân viên QA - QC",
        "name":  "Nguyễn Ngọc Quốc",
        "status":  "active",
        "phone":  "",
        "role":  "qc_staff",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận QA-QC"
    },
    {
        "id":  "fd7dccc9-ec75-4cbf-bb2d-07b217e7745d",
        "title":  "Nhân viên QA - QC",
        "name":  "Lê Minh Khoa",
        "status":  "active",
        "phone":  "",
        "role":  "qc_staff",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận QA-QC"
    },
    {
        "id":  "7a23fbbb-a5bf-46fe-9a3b-2194577e926b",
        "title":  "Nhân viên QA - QC",
        "name":  "Nguyễn Khắc Vụ",
        "status":  "active",
        "phone":  "",
        "role":  "qc_staff",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận QA-QC"
    },
    {
        "id":  "84bf3485-6370-443f-822a-75f6c2e9402f",
        "title":  "Quản lý Bộ phận",
        "name":  "Phan Khánh Phương",
        "status":  "active",
        "phone":  "",
        "role":  "qc_manager",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận QA-QC"
    },
    {
        "id":  "b5b56cfe-4818-4e87-9b5f-b6ad1c7b4ae6",
        "title":  "",
        "name":  "Nguyễn Tấn Hoanh",
        "status":  "active",
        "phone":  "",
        "role":  "hse_staff",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận HSE"
    },
    {
        "id":  "d209f527-c9d1-4cfa-b6f3-521232a44152",
        "title":  "Quản lý Bộ phận",
        "name":  "Lê Thanh Tuấn",
        "status":  "active",
        "phone":  "",
        "role":  "hse_manager",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận HSE"
    },
    {
        "id":  "491cc13b-4033-47ec-a43b-50e49a8536d3",
        "title":  "",
        "name":  "Phạm Duy Tài",
        "status":  "active",
        "phone":  "",
        "role":  "hse_staff",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận HSE"
    },
    {
        "id":  "e5e2204c-cae0-465a-a889-48aa6bfb0cb1",
        "title":  "Quản lý Bộ phận",
        "name":  "Nguyễn Công Luận",
        "status":  "active",
        "phone":  "",
        "role":  "sd_manager",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Shopdrawing"
    },
    {
        "id":  "e394a159-56ec-44df-834b-087a4d192e5b",
        "title":  "Nhân viên Shopdrawing",
        "name":  "Đặng Thanh Quang",
        "status":  "active",
        "phone":  "",
        "role":  "sd_staff",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Shopdrawing"
    },
    {
        "id":  "09e6cf4e-a350-4eb2-ae94-967e9bf8dd7d",
        "title":  "Nhân viên Shopdrawing",
        "name":  "Trần Quốc Trung",
        "status":  "active",
        "phone":  "",
        "role":  "sd_staff",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Shopdrawing"
    },
    {
        "id":  "6d04c992-56d6-46db-ba2c-5d612d61249d",
        "title":  "Quản lý Bộ phận",
        "name":  "Nguyễn Hoài Nam",
        "status":  "active",
        "phone":  "",
        "role":  "mt_manager",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Bảo trì"
    },
    {
        "id":  "234c0de0-4b02-4f69-a396-f299c6074d6e",
        "title":  "Công nhân",
        "name":  "Lâm Văn Tiến",
        "status":  "active",
        "phone":  "",
        "role":  "mt_staff",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Bảo trì"
    },
    {
        "id":  "b274ab9f-0c43-4de8-83bd-2995c3fad60c",
        "title":  "Công nhân",
        "name":  "Võ Sơn Tùng",
        "status":  "active",
        "phone":  "",
        "role":  "mt_staff",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Bảo trì"
    },
    {
        "id":  "7f3e562f-f61b-4d75-9215-07f304d86c98",
        "title":  "Công nhân",
        "name":  "Hồ Văn Chanh Em",
        "status":  "active",
        "phone":  "",
        "role":  "mt_staff",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Bảo trì"
    },
    {
        "id":  "6d9c77e5-1ec6-4aa7-a778-61f6dcaf370f",
        "title":  "Công nhân",
        "name":  "Nguyễn Văn Vũ Trường",
        "status":  "active",
        "phone":  "",
        "role":  "mt_staff",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Bảo trì"
    }
];
        
        let globalUsers = await metaGet("users", []);
        let deptsData = await metaGet("departments", {});
        let teamData = await metaGet("team:" + CUR.project, []);

        rawUsers.forEach(u => {
            // Update users
            let user = globalUsers.find(g => g.id === u.id);
            if(user) user.role = u.role;

            // Update team
            let tUser = teamData.find(g => g.id === u.id);
            if(tUser) {
                tUser.role = u.role;
                tUser.title = u.title;
            }

            // Update departments
            Object.keys(deptsData).forEach(key => {
                let dUser = deptsData[key].find(m => m.id === u.id);
                if(dUser) {
                    dUser.role = u.role;
                    dUser.position = u.title;
                    dUser.title = u.title;
                }
            });
        });

        await metaSet("users", globalUsers);
        await metaSet("team:" + CUR.project, teamData);
        await metaSet("departments", deptsData);
        await metaSet("hr_fixed_roles_titles", true);
        
        console.log("Đã CẬP NHẬT CHÍNH XÁC vai trò Thủ Kho, Trắc Đạc và chức vụ Nhân viên HSE!");
        location.reload();
    }
}, 1500);
// --------------------------------------

// --- AUTO FIX NAME TIEN AND ROLES (RUNS ONCE) ---
setTimeout(async () => {
    const fixedTien = await metaGet("hr_fixed_tien_congnhan", false);
    if(!fixedTien) {
        
        let globalUsers = await metaGet("users", []);
        let deptsData = await metaGet("departments", {});
        let teamData = await metaGet("team:" + CUR.project, []);

        const fixName = (arr) => {
            let u = arr.find(g => g.full_name === "Lâm Văn Tiến" || g.name === "Lâm Văn Tiến");
            if(u) {
                if(u.full_name) u.full_name = "Lâm Văn Tiền";
                if(u.name) u.name = "Lâm Văn Tiền";
            }
        };

        fixName(globalUsers);
        fixName(teamData);
        Object.keys(deptsData).forEach(key => fixName(deptsData[key]));

        await metaSet("users", globalUsers);
        await metaSet("team:" + CUR.project, teamData);
        await metaSet("departments", deptsData);
        await metaSet("hr_fixed_tien_congnhan", true);
        
        console.log("Đã SỬA LỖI TÊN Lâm Văn Tiền và cập nhật lại chính xác danh xưng Công nhân, Nhân viên Shopdrawing!");
        location.reload();
    }
}, 1500);
// --------------------------------------

// --- AUTO FIX BLANK POSITIONS (RUNS ONCE) ---
setTimeout(async () => {
    const fixedPos = await metaGet("hr_fixed_blank_pos", false);
    if(!fixedPos) {
        
        let deptsData = await metaGet("departments", {});
        
        // Hoanh
        if(deptsData["hse"]) {
            let hoanh = deptsData["hse"].find(m => m.name.includes("Hoanh"));
            if(hoanh && !hoanh.position) hoanh.position = "Nhân viên HSE";
            
            let tai = deptsData["hse"].find(m => m.name.includes("Tài"));
            if(tai && !tai.position) tai.position = "Nhân viên HSE";
        }

        await metaSet("departments", deptsData);
        await metaSet("hr_fixed_blank_pos", true);
        
        console.log("Đã cập nhật hiển thị chức vụ Nhân viên HSE trên bảng Bộ phận!");
        location.reload();
    }
}, 1500);
// --------------------------------------

// --- AUTO FIX NAME DIEP (RUNS ONCE) ---
setTimeout(async () => {
    const fixedDiep = await metaGet("hr_fixed_name_diep_correct", false);
    if(!fixedDiep) {
        
        let globalUsers = await metaGet("users", []);
        let deptsData = await metaGet("departments", {});
        let teamData = await metaGet("team:" + CUR.project, []);

        const fixName = (arr) => {
            let u = arr.find(g => g.full_name === "Nguyễn Khắc Diệp" || g.name === "Nguyễn Khắc Diệp");
            if(u) {
                if(u.full_name) u.full_name = "Nguyễn Khắc Điệp";
                if(u.name) u.name = "Nguyễn Khắc Điệp";
            }
        };

        fixName(globalUsers);
        fixName(teamData);
        Object.keys(deptsData).forEach(key => fixName(deptsData[key]));

        await metaSet("users", globalUsers);
        await metaSet("team:" + CUR.project, teamData);
        await metaSet("departments", deptsData);
        await metaSet("hr_fixed_name_diep_correct", true);
        
        console.log("Đã sửa đúng chính tả tên Nguyễn Khắc Điệp!");
        location.reload();
    }
}, 1500);
// --------------------------------------

// --- AUTO FIX ROLE LUAN (RUNS ONCE) ---
setTimeout(async () => {
    const fixedLuan = await metaGet("hr_fixed_role_luan", false);
    if(!fixedLuan) {
        
        let globalUsers = await metaGet("users", []);
        let deptsData = await metaGet("departments", {});
        let teamData = await metaGet("team:" + CUR.project, []);

        const fixRole = (arr, isUserArray) => {
            let u = arr.find(g => g.full_name === "Nguyễn Thanh Luân" || g.name === "Nguyễn Thanh Luân");
            if(u) {
                u.role = "storekeeper";
                if(!isUserArray) {
                    if(u.title !== undefined) u.title = "Thủ kho";
                    if(u.position !== undefined) u.position = "Thủ kho";
                }
            }
        };

        fixRole(globalUsers, true);
        fixRole(teamData, false);
        Object.keys(deptsData).forEach(key => fixRole(deptsData[key], false));

        await metaSet("users", globalUsers);
        await metaSet("team:" + CUR.project, teamData);
        await metaSet("departments", deptsData);
        await metaSet("hr_fixed_role_luan", true);
        
        console.log("Đã CẬP NHẬT CHÍNH XÁC vai trò và chức vụ Thủ Kho cho Nguyễn Thanh Luân!");
        location.reload();
    }
}, 1500);
// --------------------------------------

// --- AUTO FIX SPELLING FOR DIỆU ANH QUỐC & NGUYỄN KHẮC DIỆP ---
setTimeout(async () => {
    const fixedSpelling = await metaGet("hr_fixed_spelling_vietnamese_2026", false);
    if (!fixedSpelling) {
        // 1. Fix in users
        let globalUsers = await metaGet("users", []);
        let updatedUsers = false;
        globalUsers.forEach(u => {
            if (u.full_name === "Diệu Anh Quốc") { u.full_name = "Điều Anh Quốc"; updatedUsers = true; }
            if (u.name === "Diệu Anh Quốc") { u.name = "Điều Anh Quốc"; updatedUsers = true; }
            if (u.full_name === "Nguyễn Khắc Diệp") { u.full_name = "Nguyễn Khắc Điệp"; updatedUsers = true; }
            if (u.name === "Nguyễn Khắc Diệp") { u.name = "Nguyễn Khắc Điệp"; updatedUsers = true; }
        });
        if (updatedUsers) {
            await metaSet("users", globalUsers);
        }

        // 2. Fix in departments
        let deptsData = await metaGet("departments", {});
        let updatedDepts = false;
        Object.keys(deptsData).forEach(key => {
            if (Array.isArray(deptsData[key])) {
                deptsData[key].forEach(m => {
                    if (m.name === "Diệu Anh Quốc") { m.name = "Điều Anh Quốc"; updatedDepts = true; }
                    if (m.name === "Nguyễn Khắc Diệp") { m.name = "Nguyễn Khắc Điệp"; updatedDepts = true; }
                });
            }
        });
        if (updatedDepts) {
            await metaSet("departments", deptsData);
        }

        // 3. Fix in all project teams
        const projects = await DataService.listProjects();
        for (const p of projects) {
            let teamData = await metaGet("team:" + p.id, []);
            let updatedTeam = false;
            teamData.forEach(u => {
                if (u.name === "Diệu Anh Quốc") { u.name = "Điều Anh Quốc"; updatedTeam = true; }
                if (u.name === "Nguyễn Khắc Diệp") { u.name = "Nguyễn Khắc Điệp"; updatedTeam = true; }
            });
            if (updatedTeam) {
                await metaSet("team:" + p.id, teamData);
            }
        }

        // 4. Mark as fixed and reload
        await metaSet("hr_fixed_spelling_vietnamese_2026", true);
        console.log("Đã cập nhật chính tả cho nhân sự: Điều Anh Quốc & Nguyễn Khắc Điệp thành công!");
        location.reload();
    }
}, 2000);
