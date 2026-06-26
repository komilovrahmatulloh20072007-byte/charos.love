const loginCard = document.getElementById('loginCard');
const dashboard = document.getElementById('dashboard');
const passwordInput = document.getElementById('passwordInput');
const loginBtn = document.getElementById('loginBtn');
const loginError = document.getElementById('loginError');
const list = document.getElementById('list');
const countText = document.getElementById('countText');
const refreshBtn = document.getElementById('refreshBtn');
const deleteAllBtn = document.getElementById('deleteAllBtn');
const modal = document.getElementById('modal');
const modalContent = document.getElementById('modalContent');
const closeModal = document.getElementById('closeModal');

let password = localStorage.getItem('love_admin_password') || '';
let items = [];

const labels = {
  name: 'Ismi', birthday: 'Tug‘ilgan kuni', color: 'Sevimli rangi', flower: 'Sevimli guli', sweet: 'Sevimli shirinligi', song: 'Sevimli qo‘shig‘i', movie: 'Sevimli filmi', treatment: 'Qanday muomala yoqadi', comfort: 'Xafa bo‘lsa qanday ovutish kerak', dream: 'Eng katta orzusi', place: 'Borishni xohlagan joyi', future: 'Kelajak tasavvuri', like_me: 'Rahmatullohda yoqtirgan jihati', first_feeling: 'Birinchi taassuroti', one_word: 'Bir so‘z bilan', memory_day: 'Eng esda qolgan kun', funny_memory: 'Kulgili/shirin voqea', love_answer: 'Meni sevasanmi?', finished_at: 'Yakunlangan vaqt'
};

function esc(v=''){
  return String(v).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
}

function formatDate(value){
  try { return new Date(value).toLocaleString('uz-UZ'); } catch { return value || '—'; }
}

async function loadAnswers(){
  list.innerHTML = '<div class="empty">Yuklanmoqda...</div>';
  const res = await fetch(`/api/answers?password=${encodeURIComponent(password)}`);
  const data = await res.json();
  if(!data.ok){
    loginCard.classList.remove('hidden');
    dashboard.classList.add('hidden');
    loginError.textContent = data.message || 'Xatolik';
    return;
  }
  items = data.items || [];
  renderList();
}

function renderList(){
  countText.textContent = `${items.length} ta javob`;
  if(!items.length){
    list.innerHTML = '<div class="empty">Hali javob yo‘q</div>';
    return;
  }

  list.innerHTML = items.map((item) => {
    const a = item.answers || {};
    return `
      <article class="item">
        <div class="item-top">
          <div>
            <div class="name">${esc(a.name || 'Charos')}</div>
            <div class="date">${esc(formatDate(item.created_at))}</div>
          </div>
          <div class="love">${esc(a.love_answer || '—')}</div>
        </div>
        <div class="item-actions">
          <button onclick="openDetails(${item.id})">Ko‘rish</button>
          <button class="danger" onclick="deleteOne(${item.id})">Delete</button>
        </div>
      </article>
    `;
  }).join('');
}

window.openDetails = function(id){
  const item = items.find((x) => Number(x.id) === Number(id));
  if(!item) return;
  const a = item.answers || {};
  modalContent.innerHTML = `
    <h2>💖 ${esc(a.name || 'Charos')}</h2>
    <p><b>Sana:</b> ${esc(formatDate(item.created_at))}</p>
    <div class="details">
      ${Object.entries(labels).map(([key,label]) => `
        <div class="detail-row">
          <b>${esc(label)}</b>
          <span>${esc(a[key] || '—')}</span>
        </div>
      `).join('')}
    </div>
  `;
  modal.classList.remove('hidden');
}

window.deleteOne = async function(id){
  if(!confirm('Rostdan o‘chirasanmi?')) return;
  const res = await fetch(`/api/answers/${id}?password=${encodeURIComponent(password)}`, { method:'DELETE' });
  const data = await res.json();
  if(!data.ok){ alert(data.message || 'O‘chirilmadi'); return; }
  items = items.filter((x) => Number(x.id) !== Number(id));
  renderList();
}

loginBtn.addEventListener('click', async () => {
  password = passwordInput.value.trim();
  if(!password) return;
  localStorage.setItem('love_admin_password', password);
  loginError.textContent = '';
  loginCard.classList.add('hidden');
  dashboard.classList.remove('hidden');
  await loadAnswers();
});

passwordInput.addEventListener('keydown', (e) => {
  if(e.key === 'Enter') loginBtn.click();
});

refreshBtn.addEventListener('click', loadAnswers);

deleteAllBtn.addEventListener('click', async () => {
  if(!confirm('HAMMASINI o‘chirishni xohlaysanmi?')) return;
  const res = await fetch(`/api/answers?password=${encodeURIComponent(password)}`, { method:'DELETE' });
  const data = await res.json();
  if(!data.ok){ alert(data.message || 'O‘chirilmadi'); return; }
  items = [];
  renderList();
});

closeModal.addEventListener('click', () => modal.classList.add('hidden'));
modal.addEventListener('click', (e) => {
  if(e.target === modal) modal.classList.add('hidden');
});

if(password){
  passwordInput.value = password;
  loginCard.classList.add('hidden');
  dashboard.classList.remove('hidden');
  loadAnswers();
}
