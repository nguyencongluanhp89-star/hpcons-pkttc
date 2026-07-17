/* === js/data.js (du lieu + danh muc, vung KB do xu_ly_du_lieu.py ghi) === Tu dong tach tu app goc. Cac file nap theo thu tu: data -> utils -> features -> render === */
/* ==KB_DATA_START== Du lieu tu dong tu knowledge_base (xu_ly_du_lieu.py). KHONG sua tay. */
var KB_SCHED = [["15/04/26", "24/04/26", 10], ["25/04/26", "09/05/26", 15], ["07/05/26", "21/05/26", 15], ["15/05/26", "19/05/26", 5], ["20/05/26", "26/05/26", 7], ["27/05/26", "05/06/26", 10], ["06/06/26", "15/06/26", 10], ["16/06/26", "25/06/26", 10], ["25/05/26", "31/05/26", 7], ["01/06/26", "07/06/26", 7], ["08/06/26", "14/06/26", 7], ["15/06/26", "23/06/26", 9], ["24/06/26", "28/06/26", 5], ["29/06/26", "08/07/26", 10], ["09/07/26", "16/07/26", 8], ["17/07/26", "27/07/26", 11], ["28/07/26", "04/08/26", 8], ["05/08/26", "15/08/26", 11], ["23/08/26", "29/08/26", 7], ["15/08/26", "02/11/26", 80], ["25/08/26", "07/11/26", 75], ["04/09/26", "17/11/26", 75], ["19/09/26", "17/11/26", 60], ["22/09/26", "25/11/26", 65], ["15/05/26", "29/05/26", 15], ["22/05/26", "10/06/26", 20], ["25/05/26", "13/06/26", 20], ["28/05/26", "16/06/26", 20], ["02/06/26", "21/06/26", 20], ["30/05/26", "13/06/26", 15], ["09/06/26", "03/07/26", 25], ["16/06/26", "10/07/26", 25], ["23/06/26", "17/07/26", 25], ["30/06/26", "24/07/26", 25], ["01/06/26", "22/10/26", 144], ["01/06/26", "05/08/26", 66], ["02/07/26", "20/08/26", 50], ["21/08/26", "04/09/26", 15], ["05/09/26", "20/09/26", 16], ["21/09/26", "07/10/26", 17], ["08/10/26", "22/10/26", 15], ["01/07/26", "24/11/26", 147], ["01/07/26", "10/09/26", 72], ["07/08/26", "25/09/26", 50], ["26/09/26", "10/10/26", 15], ["11/10/26", "25/10/26", 15], ["26/10/26", "09/11/26", 15], ["10/11/26", "24/11/26", 15], ["15/07/26", "02/10/26", 80], ["15/08/26", "02/11/26", 80], ["30/08/26", "17/11/26", 80], ["01/10/26", "19/11/26", 50], ["20/10/26", "24/11/26", 36], ["20/11/26", "27/11/26", 8], ["28/11/26", "30/11/26", 3]];
var KB_GLOSSARY = {"BÊ TÔNG MÓNG": "基础混疑土", "BÊ TÔNG NỀN": "混疑土地板", "BÊ TÔNG PHẦN MÓNG": "基础混疑土", "BÊ TÔNG PHẦN MÓNG + CỔ CỘT": "基础混凝土 + 柱基", "BÊ TÔNG PHẦN SÀN NẮP": "盖板部份的混疑土", "BÊ TÔNG PHẦN VÁCH + CỘT": "侧牆+柱子混疑土", "BÊ TÔNG ĐÀ KIỀNG": "地樑部份混疑土", "CCLD CANOPY": "供应安装遮雨棚", "CCLD TOLE MÁI + VÁCH": "供应安装屋顶浪板+墙壁浪板", "CCLD XÀ GỒ MÁI + VÁCH": "供应安装屋顶檩条+墙壁檩条", "CLLD CỬA": "供应安装门", "CỐT THÉP, CỐT PHA MÓNG": "基础铁钢筋，模板", "CỐT THÉP, CỐT PHA MÓNG + CỔ CỘT": "基础+柱颈铁钢筋，模板", "CỐT THÉP, CỐT PHA PHẦN MÓNG": "基础铁钢筋，模板", "CỐT THÉP, CỐT PHA PHẦN SÀN NẮP": "盖板部份的铁钢筋，模板", "CỐT THÉP, CỐT PHA PHẦN VÁCH + CỘT": "侧壁+柱子铁钢筋，模板", "CỐT THÉP, CỐT PHA ĐÀ KIỀNG": "地樑部份铁钢筋，模板", "GCLD KHO BÃI, VĂN PHÒNG BAN CHỈ HUY": "加工安装工地仓储，工地管理办公室的工作", "GCSX KẾT CẤU THÉP": "加工生产钢结构", "HOÀN THIỆN": "完善", "HT THOÁT NƯỚC MƯA TỔNG THỂ": "整体排放雨水系统", "HT THOÁT NƯỚC THẢI SINH HOẠT TỔNG THỂ": "整体生活污水排放系统", "HÀNG RÀO, BẢNG HIỆU + CỔNG CHÍNH": "围墙，招牌 +正大门", "HẠ TẦNG KỸ THUẬT": "技术下层", "HỒ PCCC": "消防水池", "LẮP DỰNG KHUNG CHÍNH": "安装主框架", "LẮP DỰNG KHUNG LƯỚI THÉP HÀN": "安装焊接钢丝网框架", "LẮP ĐẶT ĐIỆN NƯỚC PHỤC VỤ THI CÔNG": "安装水电服务施工的工作", "NGHIỆM THU BÀN GIAO ĐƯA VÀO SỬ DỤNG": "验收移交投入使用", "NHÀ XƯỞNG 01": "厂房", "NHÀ XƯỞNG 02": "厂房", "NỀN XI MĂNG ĐẤT": "水泥土基础", "PHẦN KẾT CẤU THÉP": "钢结构部份", "PHẦN MÓNG - ĐÀ KIỀNG": "基础部分 - 地梁", "SƠN NƯỚC": "涂水性漆", "TRÁT TƯỜNG": "墙壁抹灰", "TỔNG TIẾN ĐỘ DỰ ÁN PHẦN XÂY DỰNG": "工程", "VẬN CHUYỂN TẬP KẾT": "运输集结", "XDCB HẠNG MỤC PHỤ TRỢ": "基本建设", "XDCB NHÀ BƠM": "泵房基础施工", "XÂY TƯỜNG": "砌墙壁", "ĐÀO ĐẤT MÓNG": "基础开挖土", "ĐÀO ĐẤT PHẦN MÓNG": "基础开挖土", "ĐƯỜNG NỘI BỘ": "内部道路", "NHÀ VĂN PHÒNG": "办公室", "VĂN PHÒNG CHUYÊN GIA": "专家办公室", "NHÀ XE": "车库", "NHÀ BẢO VỆ": "警卫室", "HỆ THỐNG PCCC": "消防系统", "HỆ THỐNG THOÁT NƯỚC MƯA": "雨水排水系统", "HỆ THỐNG THOÁT NƯỚC THẢI": "污水排水系统", "ÉP CỌC THỬ": "试打桩", "ÉP CỌC ĐẠI TRÀ": "大批量压桩", "CỐT THÉP, CỐP PHA CỔ CỘT": "柱基钢筋、模板", "ĐỔ BÊ TÔNG CỔ CỘT": "柱基混凝土浇筑", "NHÀ ĂN": "食堂", "TRẠM XỬ LÝ NƯỚC THẢI": "污水处理站"};
var KB_META = {"generated_at": "2026-06-18T15:29:37", "report_date": "2026-06-16", "nguon": "KNOWLEDGE/ (Howell PDF + 2 Excel HP CONS)", "luu_y": "pct_plan = % THEO KE HOACH, KHONG phai % thuc te."};
/* ==KB_DATA_END== */

/* ---------- dynamic default data ---------- */

/* Tổ đội / Nhà thầu phụ: [{name, n}] */
let units=[];
let works = [
  {c:"var(--green)", t:"NHÀ VĂN PHÒNG", d:"Đổ bê tông đá kiềng: 40%\nGCLD coffa, thép đá kiềng: 80%"},
  {c:"var(--navy2)", t:"NHÀ XƯỞNG 1", d:"Số lượng lũy kế cọc đã ép: 158/210 tim\nNghiệm thu coffa, thép đổ bê tông móng"},
  {c:"var(--orange)", t:"NHÀ XƯỞNG 2", d:"Số lượng lũy kế cọc đã ép: 3/246 tim"},
  {c:"var(--teal)", t:"XÂY HÀNG RÀO GẠCH BLOCK", d:""},
  {c:"var(--purple)", t:"ĐỔ BÊ HỐ GA, MỐI NỐI CỐNG BẰNG ĐƯỜNG", d:""},
];
/* ===== THƯ VIỆN CÔNG TÁC (Việt / Trung / Anh) — nguồn: KNOWLEDGE dự án HOWELL =====
   keys = từ khóa (không dấu) dò trong TÊN FILE ảnh để tự gán công tác */
const CONGTAC=[
 {vi:"Thi công ép cọc đại trà", cn:"大批量压桩施工", en:"Mass pile driving", keys:["epcoc","ep-coc","ep_coc","epcocdaitra","coc","pile","yacoc","maycoc","maypcoc","mayepcoc","压桩","打桩"]},
 {vi:"Thi công khoan cọc nhồi", cn:"钻孔灌注桩施工", en:"Bored pile", keys:["khoancoc","cocnhoi","khoan","bored","灌注桩"]},
 {vi:"Định vị tim cọc", cn:"桩位定位", en:"Pile setting-out", keys:["dinhvicoc","timcoc","dinhvi","setout"]},
 {vi:"Đào đất móng", cn:"基础开挖土", en:"Foundation excavation", keys:["daodat","dao-dat","daomong","dao","excavat","mongdao","开挖"]},
 {vi:"Thi công cốt thép, cốt pha móng", cn:"基础钢筋，模板施工", en:"Foundation rebar & formwork", keys:["cotthepmong","cotpha","coppha","thepmong","copphamong","rebar","formwork","钢筋"]},
 {vi:"Đổ bê tông lót móng", cn:"基础垫层混凝土", en:"Foundation blinding concrete", keys:["lotmong","betonglot","btlot","lot","dabetonglot","垫层"]},
 {vi:"Đổ bê tông móng", cn:"基础混凝土浇筑", en:"Foundation concrete", keys:["betongmong","bt-mong","btmong","dobetongmong","domong","concretemong","混凝土基础"]},
 {vi:"Thi công cổ cột", cn:"柱基施工", en:"Column-neck", keys:["cocot","co-cot","cot","column"]},
 {vi:"Thi công cốt thép, cốt pha đà kiềng", cn:"地梁钢筋，模板施工", en:"Ground beam rebar & formwork", keys:["thepdakieng","copphadakieng","cotphakieng","dakiengthep","钢筋地梁"]},
 {vi:"Thi công đà kiềng", cn:"地梁施工", en:"Ground beam", keys:["dakieng","da-kieng","da_kieng","kieng","dakieng","地梁"]},
 {vi:"Đổ bê tông đà kiềng", cn:"地梁混凝土浇筑", en:"Ground beam concrete", keys:["btdakieng","bt-da-kieng","betongdakieng","dobetongkieng"]},
 {vi:"Thi công lắp dựng thép sàn", cn:"楼板钢筋安装施工", en:"Slab rebar installation", keys:["thepsan","thep-san","lapthepsan","sanrebar","slabrebar","san","slab"]},
 {vi:"Đổ bê tông sàn", cn:"楼板混凝土浇筑", en:"Slab concrete", keys:["btsan","betongsan","dobetongsan","concretesan"]},
 {vi:"Gia công sản xuất kết cấu thép", cn:"加工生产钢结构", en:"Steel structure fabrication", keys:["ketcauthep","gcsx","kct","steelfab","giacongthep","钢结构"]},
 {vi:"Lắp dựng khung kết cấu thép chính", cn:"安装主钢框架", en:"Main steel frame erection", keys:["lapdungkhung","khungchinh","khung","erection","lapkhung","lapdungkhung","主框架"]},
 {vi:"Lắp dựng xà gồ mái + vách", cn:"安装屋顶+墙壁檩条", en:"Roof & wall purlin", keys:["xago","xa-go","purlin","檩条"]},
 {vi:"Lắp dựng tole mái + vách", cn:"安装屋顶+墙壁浪板", en:"Roof & wall cladding", keys:["tole","ton","mai-vach","cladding","loptole","浪板"]},
 {vi:"Thi công xây tường", cn:"砌墙壁施工", en:"Brick laying", keys:["xaytuong","xay-tuong","xay","tuong","gach","masonry","brick","砌墙"]},
 {vi:"Xây hàng rào gạch block", cn:"砌围墙砌块", en:"Block wall fence", keys:["hangrao","hang-rao","rao","block","fence","围墙"]},
 {vi:"Thi công trát (tô) tường", cn:"墙壁抹灰施工", en:"Wall plastering", keys:["trattuong","trat","totuong","to-tuong","plaster","抹灰"]},
 {vi:"Thi công sơn nước", cn:"涂水性漆施工", en:"Painting", keys:["sonnuoc","son","paint","涂漆"]},
 {vi:"Đổ bê tông nền", cn:"混凝土地板浇筑", en:"Floor concrete", keys:["btnen","betongnen","nen","floor","dobetongnen","地板"]},
 {vi:"Thi công nền xi măng đất", cn:"水泥土基础施工", en:"Cement-soil base", keys:["ximangdat","nenximang","cementsoil"]},
 {vi:"Lắp đặt cửa", cn:"安装门", en:"Door installation", keys:["cua","door","lapcua","门"]},
 {vi:"Thi công hệ thống thoát nước mưa", cn:"整体排放雨水系统施工", en:"Stormwater drainage", keys:["thoatnuocmua","nuocmua","mua","stormwater","雨水"]},
 {vi:"Thi công hệ thống thoát nước thải", cn:"整体生活污水排放系统施工", en:"Wastewater drainage", keys:["nuocthai","thoatnuocthai","wastewater","污水"]},
 {vi:"Đổ bê hố ga, mối nối cống bằng đường", cn:"检查井及管路混凝土浇筑", en:"Manhole & culvert concrete", keys:["hoga","ho-ga","cong","moinoi","manhole","culvert","检查井"]},
 {vi:"Thi công đường nội bộ", cn:"内部道路施工", en:"Internal road", keys:["duong","road","duongnoibo","noibo","道路"]},
 {vi:"Tập kết vật tư tại công trường", cn:"材料运输集结到工地", en:"Material delivery to site", keys:["vattu","vat-tu","tapket","material","vattuve","vatlieu","材料"]},
 {vi:"GCLD kho bãi, văn phòng BCH", cn:"加工安装工地仓储，管理办公室", en:"Site office & storage", keys:["khobai","vanphong","bch","office","kho","仓储"]},
 {vi:"Lắp đặt điện nước phục vụ thi công", cn:"安装水电服务施工", en:"Temporary M&E", keys:["diennuoc","dien-nuoc","electric","mep","水电"]},
 {vi:"Thi công hồ PCCC", cn:"消防水池施工", en:"Fire-fighting water tank", keys:["pccc","hopccc","firewater","消防"]},
 {vi:"Nghiệm thu công tác", cn:"工作验收", en:"Inspection / acceptance", keys:["nghiemthu","nghiem-thu","inspect","acceptance","验收"]},
];
function normTxt(s){return (s||"").toLowerCase()
  .normalize("NFD").replace(/[̀-ͯ]/g,"").replace(/đ/g,"d")
  .replace(/[^a-z0-9一-鿿]/g,"");}
/* dò công tác từ tên file: trả index trong CONGTAC hoặc -1 */
function matchCongTac(filename){
  const n=normTxt(filename); if(!n) return -1;
  let best=-1,bestLen=0;
  CONGTAC.forEach((c,i)=>c.keys.forEach(k=>{
    const kk=normTxt(k);
    if(kk.length>=2 && n.includes(kk) && kk.length>bestLen){best=i;bestLen=kk.length;}
  }));
  return best;
}
let photos = [
  {tm:"14:19", vi:"Tập kết vật tư tại công trường", cn:"材料运输集结到工地", img:null},
  {tm:"15:29", vi:"Thi công đà kiềng", cn:"地梁施工", img:null},
  {tm:"16:02", vi:"Đổ bê tông lót móng", cn:"基础垫层混凝土", img:null},
  {tm:"15:36", vi:"Đổ bê tông móng", cn:"基础混凝土浇筑", img:null},
  {tm:"18:04", vi:"Thi công ép cọc đại trà", cn:"大批量压桩施工", img:null},
  {tm:"14:19", vi:"Thi công lắp dựng thép sàn", cn:"楼板钢筋安装施工", img:null},
];
let draws = [
  {t:"MẶT BẰNG ĐÁ KIỀNG", c:"Mặt bằng đá đổ bê tông NVP", img:null},
  {t:"MẶT BẰNG ÉP CỌC XƯỞNG 1&2", c:"Mặt bằng ép cọc đại trà xưởng 1&2", img:null},
  {t:"MẶT BẰNG ĐỊNH VỊ CỌC", c:"Mặt bằng định vị cọc xưởng 1&2", img:null},
  {t:"MẶT BẰNG KẾT CẤU MÓNG", c:"Mặt bằng kết cấu móng xưởng 1&2", img:null},
];
let logoImg=null, ovMain=null, ovSub1=null, ovSub2=null;

/* ---------- form builders ---------- */
