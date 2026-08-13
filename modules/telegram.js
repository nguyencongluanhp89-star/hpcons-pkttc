// Telegram configuration and app-to-group actions.
// ========== TELEGRAM — Đẩy thông báo từ app sang nhóm ==========
function saveTelegramConfig(){
  const t=($("tg-token")?$("tg-token").value:"").trim();
  const c=($("tg-chatid")?$("tg-chatid").value:"").trim();
  localStorage.setItem('tg_bot_token', t);
  localStorage.setItem('tg_chat_id', c);
  const m=$("tg-msg"); if(m){ m.style.color='var(--success)'; m.textContent='✅ Đã lưu cấu hình Telegram.'; setTimeout(()=>{ if(m) m.textContent=''; },3000); }
}
function loadTelegramConfig(){
  const t=localStorage.getItem('tg_bot_token'), c=localStorage.getItem('tg_chat_id');
  if(t && $("tg-token")) $("tg-token").value=t;
  if(c && $("tg-chatid")) $("tg-chatid").value=c;
}
// Gửi 1 tin nhắn tới nhóm Telegram. text hỗ trợ HTML (<b>, <i>). Trả {ok, ...}
async function tgNotify(text){
  const token=(localStorage.getItem('tg_bot_token')||'').trim();
  const chatId=(localStorage.getItem('tg_chat_id')||'').trim();
  if(!token||!chatId) return {ok:false, error:'Chưa cấu hình Telegram (Hệ thống → Thông báo qua Telegram)'};
  try{
    const params=new URLSearchParams({ chat_id:chatId, text:text, parse_mode:'HTML', disable_web_page_preview:'true' });
    const r=await fetch(`https://api.telegram.org/bot${token}/sendMessage`, { method:'POST', body:params });
    return await r.json();
  }catch(e){ return {ok:false, error:String(e)}; }
}
async function tgTest(){
  const m=$("tg-msg"); if(m){ m.style.color='var(--primary)'; m.textContent='Đang gửi…'; }
  saveTelegramConfig();
  const r=await tgNotify('✅ <b>P.KTTC</b> — Kết nối Telegram thành công từ app P.KTTC.');
  if(m){ if(r&&r.ok){ m.style.color='var(--success)'; m.textContent='✅ Đã gửi! Kiểm tra nhóm Telegram.'; } else { m.style.color='var(--danger)'; m.textContent='❌ Lỗi: '+((r&&(r.description||r.error))||JSON.stringify(r)); } }
}
// Chuyển text sang HTML an toàn cho Telegram (escape + **đậm**)
function tgFmt(t){ let s=(t||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); return s.replace(/\*\*([^*]+)\*\*/g,'<b>$1</b>'); }
// Gửi câu hỏi + câu trả lời AI Center hiện tại sang nhóm Telegram
async function tgSendAnswer(btn){
  const L=window._aiLast; if(!L) return;
  if(btn){ btn.disabled=true; btn.textContent='Đang gửi…'; }
  const text='🤖 <b>AI Center — P.KTTC</b>\n\n<b>Hỏi:</b> '+tgFmt(L.q)+'\n\n'+tgFmt(L.a);
  const r=await tgNotify(text);
  if(btn){ btn.disabled=false; btn.textContent = (r&&r.ok) ? '✅ Đã gửi sang Telegram' : '📤 Gửi sang Telegram'; }
  if(!(r&&r.ok)) alert('Lỗi gửi Telegram: '+((r&&(r.description||r.error))||JSON.stringify(r))+'\n(Kiểm tra cấu hình ở Hệ thống → Thông báo qua Telegram)');
}
