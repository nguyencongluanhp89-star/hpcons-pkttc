// ---------- XUẤT EXCEL (xlsx khi online; fallback CSV khi offline) ----------
function downloadBlob(content, filename, mime){
  const blob=new Blob([content],{type:mime});
  const a=document.createElement("a"); a.href=URL.createObjectURL(blob); a.download=filename;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(()=>URL.revokeObjectURL(a.href), 2000);
}
async function exportReportExcel(){
  const date=$("r-date").value; if(!date){ alert("Chưa có báo cáo để xuất"); return; }
  const subs=(await DataService.listSubmissions()).filter(s=>s.project_id===CUR.project && s.log_date===date);
  if(!subs.length){ alert("Không có dữ liệu cho ngày này"); return; }
  const c=consolidate(subs);
  const proj=(await DataService.listProjects()).find(p=>p.id===CUR.project);
  const base="BaoCao_"+(proj.name||"CT").replace(/[^A-Za-z0-9]+/g,"_")+"_"+date;
  const manRows=[["Nhà thầu","Số người","Công tác thi công"]]
    .concat(c.manpower.map(m=>[m.contractor, m.total, (m.works||[]).join("\n")]))
    .concat([["TỔNG NHÂN LỰC", c.total, ""]]);
  const workRows=[["Công việc hoàn thành","Đã","Tổng"]].concat(c.completed.map(x=>[x.description, x.qty_done, x.qty_total]));
  const issueRows=[["Vấn đề phát sinh","Mức độ"]].concat(c.issues.map(x=>[x.description, x.severity]));
  if(typeof XLSX!=="undefined"){
    const wb=XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(manRows), "Nhân lực");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(workRows), "Công việc");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(issueRows), "Vấn đề");
    XLSX.writeFile(wb, base+".xlsx");
  } else {
    const cell=v=>'"'+String(v==null?"":v).replace(/"/g,'""').replace(/\r?\n/g,"; ")+'"';
    const L=[];
    L.push("NHÂN LỰC THEO NHÀ THẦU"); manRows.forEach(r=>L.push(r.map(cell).join(",")));
    L.push(""); L.push("CÔNG VIỆC HOÀN THÀNH"); workRows.forEach(r=>L.push(r.map(cell).join(",")));
    L.push(""); L.push("VẤN ĐỀ PHÁT SINH"); issueRows.forEach(r=>L.push(r.map(cell).join(",")));
    downloadBlob("﻿"+L.join("\r\n"), base+".csv", "text/csv;charset=utf-8");
  }
}

