const STORAGE_KEY = 'kittylol.workspace.v1';
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
let scripts = readScripts();
let activeDetailId = null;
let toastTimer;
const startedAt = Date.now();

function readScripts() {
  try { const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); return Array.isArray(saved) ? saved : []; }
  catch { return []; }
}
function saveScripts() { localStorage.setItem(STORAGE_KEY, JSON.stringify(scripts)); render(); }
function escapeHTML(value = '') { return String(value).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch])); }
function shortDate(timestamp) { const date = new Date(timestamp); return date.toLocaleDateString('vi-VN', {day:'2-digit', month:'short', year:'numeric'}); }
function showToast(message) { const toast = $('#toast'); toast.textContent = message; toast.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.remove('show'), 2400); }
function render() {
  $('#statScripts').textContent = String(scripts.length).padStart(2, '0');
  $('#statPublic').textContent = String(scripts.filter(script => script.isPublic).length).padStart(2, '0');
  $('#navScriptCount').textContent = scripts.length;
  const recent = [...scripts].sort((a,b) => b.updatedAt - a.updatedAt).slice(0, 5);
  $('#dashboardEmpty').classList.toggle('hidden', recent.length > 0);
  $('#recentScripts').innerHTML = recent.map(script => `<tr><td class="script-name-cell"><span class="script-mini-icon">⌘</span>${escapeHTML(script.name)}</td><td><span class="visibility-badge ${script.isPublic ? 'public' : ''}">${script.isPublic ? 'CÔNG KHAI' : 'RIÊNG TƯ'}</span></td><td>${shortDate(script.updatedAt)}</td><td><button class="row-more" data-open="${script.id}" aria-label="Mở script">···</button></td></tr>`).join('');
  const query = ($('#scriptSearch')?.value || '').trim().toLowerCase();
  const filtered = [...scripts].sort((a,b) => b.updatedAt - a.updatedAt).filter(script => `${script.name} ${script.notes}`.toLowerCase().includes(query));
  $('#scriptsEmpty').classList.toggle('hidden', filtered.length > 0);
  $('#scriptGrid').innerHTML = filtered.map(script => `<article class="script-card" data-open="${script.id}" tabindex="0"><div class="card-top"><span class="card-icon">⌘</span><button class="card-menu" data-menu="${script.id}" aria-label="Tùy chọn">···</button></div><h3>${escapeHTML(script.name)}</h3><p>${escapeHTML(script.notes || 'Chưa có ghi chú')}</p><div class="card-bottom"><span>${shortDate(script.updatedAt)}</span><span class="visibility-badge ${script.isPublic ? 'public' : ''}">${script.isPublic ? 'CÔNG KHAI' : 'RIÊNG TƯ'}</span></div></article>`).join('');
}
function switchView(view) {
  const dashboard = view === 'dashboard';
  $('#dashboardView').classList.toggle('hidden', !dashboard);
  $('#scriptsView').classList.toggle('hidden', dashboard);
  $$('.nav-item').forEach(button => button.classList.toggle('active', button.dataset.view === view));
  $('#currentCrumb').textContent = dashboard ? 'Tổng quan' : 'Scripts';
}
function openScriptForm(script = null) {
  $('#scriptForm').reset(); $('#formError').classList.add('hidden'); $('#selectedFile').classList.add('hidden');
  $('#editingId').value = script?.id || '';
  $('#modalTitle').textContent = script ? 'Chỉnh sửa script' : 'Tạo script mới';
  $('#scriptName').value = script?.name || '';
  $('#scriptNotes').value = script?.notes || '';
  $('#scriptCode').value = script?.code || '';
  if (script?.fileName) { $('#selectedFile').textContent = `File đã đính kèm: ${script.fileName} (tệp chỉ được giữ trong phiên trình duyệt)`; $('#selectedFile').classList.remove('hidden'); }
  $('#scriptModal').classList.remove('hidden'); $('#scriptName').focus();
}
function closeModals() { $$('.modal-backdrop').forEach(modal => modal.classList.add('hidden')); }
function openDetail(id) {
  const script = scripts.find(item => item.id === id); if (!script) return;
  activeDetailId = id;
  $('#detailTitle').textContent = script.name;
  $('#detailNotes').textContent = script.notes || 'Chưa có ghi chú.';
  $('#detailUpdated').textContent = `CẬP NHẬT ${shortDate(script.updatedAt).toUpperCase()}`;
  const badge = $('#detailVisibility'); badge.textContent = script.isPublic ? 'CÔNG KHAI' : 'RIÊNG TƯ'; badge.classList.toggle('public', script.isPublic);
  const panel = $('.protected-panel'); panel.classList.remove('show-code');
  $('#protectedTitle').textContent = script.isPublic ? 'Bản xem trước được bảo vệ' : 'Script riêng tư';
  $('#protectedMessage').textContent = script.isPublic ? 'Nội dung không được hiển thị trên trang xem trước công khai.' : 'Chỉ bạn có thể xem nội dung trong workspace này.';
  $('#protectedCode').textContent = script.isPublic ? '🔒  KITTYLOL\n\nScript được bảo vệ. Nội dung nguồn không được cung cấp trên bản xem trước.' : (script.code || 'Không có nội dung văn bản.');
  $('#detailActions').innerHTML = script.isPublic
    ? `<button class="button button-secondary" data-action="copy">⧉ Sao chép liên kết</button><button class="button button-secondary" data-action="preview">⌑ Xem bảo vệ</button><button class="button button-secondary" data-action="edit">Chỉnh sửa</button><button class="button button-secondary" data-action="delete">Xóa</button><button class="button button-secondary" data-action="unpublish">Gỡ công khai</button>`
    : `<button class="button button-primary" data-action="publish">◉ Công khai</button><button class="button button-secondary" data-action="edit">Chỉnh sửa</button><button class="button button-secondary" data-action="delete">Xóa</button>`;
  $('#detailModal').classList.remove('hidden');
}
function publicPreviewUrl(script) { return `${location.origin}/public/${encodeURIComponent(script.token)}.html`; }

$('#discordLogin').addEventListener('click', () => { $('#loginScreen').classList.add('hidden'); $('#app').classList.remove('hidden'); showToast('Đang ở chế độ xem trước — Discord OAuth chưa được kết nối.'); });
$$('.nav-item').forEach(button => button.addEventListener('click', () => switchView(button.dataset.view)));
['#newScriptTop','#newScriptButton','#emptyCreate','#scriptsEmptyCreate'].forEach(selector => $(selector).addEventListener('click', () => openScriptForm()));
$('#viewAllScripts').addEventListener('click', () => switchView('scripts'));
$('#scriptSearch').addEventListener('input', render);
$('#dismissNotice').addEventListener('click', () => $('.notice-bar').remove());
$('#helpButton').addEventListener('click', () => showToast('Bản demo tĩnh: đăng nhập Discord và đồng bộ máy chủ cần được cấu hình.'));
$('#profileButton').addEventListener('click', () => showToast('Tài khoản demo Kittylol'));
$$('.close-modal').forEach(button => button.addEventListener('click', closeModals));
$$('.modal-backdrop').forEach(backdrop => backdrop.addEventListener('click', event => { if (event.target === backdrop) closeModals(); }));
document.addEventListener('keydown', event => { if (event.key === 'Escape') closeModals(); });
$('#scriptFile').addEventListener('change', event => { const file = event.target.files?.[0]; if (!file) return; $('#selectedFile').textContent = `${file.name} · ${(file.size / 1024).toFixed(1)} KB (bản demo chỉ lưu tên file)`; $('#selectedFile').classList.remove('hidden'); });
$('#scriptForm').addEventListener('submit', event => {
  event.preventDefault();
  const name = $('#scriptName').value.trim();
  if (!name) return;
  const id = $('#editingId').value;
  const prior = scripts.find(script => script.id === id);
  const file = $('#scriptFile').files?.[0];
  const script = { id: id || crypto.randomUUID(), name, notes: $('#scriptNotes').value.trim(), code: $('#scriptCode').value, fileName: file?.name || prior?.fileName || '', isPublic: prior?.isPublic || false, token: prior?.token || crypto.randomUUID().replaceAll('-', '').slice(0, 20), createdAt: prior?.createdAt || Date.now(), updatedAt: Date.now() };
  if (id) scripts = scripts.map(item => item.id === id ? script : item); else scripts.push(script);
  saveScripts(); closeModals(); showToast(id ? 'Đã cập nhật script.' : 'Đã tạo script.');
});
$('#detailActions').addEventListener('click', async event => {
  const button = event.target.closest('[data-action]'); if (!button) return;
  const script = scripts.find(item => item.id === activeDetailId); if (!script) return;
  const action = button.dataset.action;
  if (action === 'publish') { script.isPublic = true; script.updatedAt = Date.now(); saveScripts(); openDetail(script.id); showToast('Đã bật chế độ công khai cho bản xem trước.'); }
  if (action === 'unpublish') { script.isPublic = false; script.updatedAt = Date.now(); saveScripts(); openDetail(script.id); showToast('Đã gỡ công khai. Liên kết xem trước không còn khả dụng.'); }
  if (action === 'edit') { closeModals(); openScriptForm(script); }
  if (action === 'delete') { if (confirm(`Xóa “${script.name}” khỏi trình duyệt này?`)) { scripts = scripts.filter(item => item.id !== script.id); saveScripts(); closeModals(); showToast('Đã xóa script.'); } }
  if (action === 'copy') { try { await navigator.clipboard.writeText(publicPreviewUrl(script)); showToast('Đã sao chép liên kết xem trước.'); } catch { showToast(publicPreviewUrl(script)); } }
  if (action === 'preview') { $('.protected-panel').classList.toggle('show-code'); }
});
document.addEventListener('click', event => {
  const target = event.target.closest('[data-open]');
  if (target && !event.target.closest('[data-menu]')) { openDetail(target.dataset.open); return; }
  const menu = event.target.closest('[data-menu]');
  if (menu) { event.stopPropagation(); openDetail(menu.dataset.menu); }
});
function updateSessionTime() { const elapsed = Math.floor((Date.now() - startedAt) / 1000); $('#sessionTime').innerHTML = `${String(Math.floor(elapsed / 60)).padStart(2,'0')}<span class="stat-unit">:${String(elapsed % 60).padStart(2,'0')}</span>`; }
setInterval(updateSessionTime, 1000);
render();
