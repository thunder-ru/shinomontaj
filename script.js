// 3D Карусель
let currentIndex = 0;
const items = document.querySelectorAll('.carousel-item');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');

function updateCarousel() {
    items.forEach((item, index) => {
        item.classList.remove('active', 'prev', 'next');
        if (index === currentIndex) {
            item.classList.add('active');
        } else if (index === (currentIndex - 1 + items.length) % items.length) {
            item.classList.add('prev');
        } else if (index === (currentIndex + 1) % items.length) {
            item.classList.add('next');
        }
    });
}

prevBtn?.addEventListener('click', () => {
    currentIndex = (currentIndex - 1 + items.length) % items.length;
    updateCarousel();
});

nextBtn?.addEventListener('click', () => {
    currentIndex = (currentIndex + 1) % items.length;
    updateCarousel();
});

updateCarousel();

// Генерация дат в строчку
function generateDates() {
    const datePicker = document.getElementById('date-picker');
    if (!datePicker) return;

    datePicker.innerHTML = '';
    const today = new Date();
    
    for (let i = 0; i < 14; i++) {
        const date = new Date();
        date.setDate(today.getDate() + i);
        const dateString = date.toISOString().split('T')[0];
        const dayName = date.toLocaleDateString('ru-RU', { weekday: 'short' });
        const dayNumber = date.getDate();

        const div = document.createElement('div');
        div.className = 'date-item';
        div.textContent = `${dayName} ${dayNumber}`;
        div.dataset.date = dateString;
        div.addEventListener('click', function() {
            document.querySelectorAll('.date-item').forEach(d => d.classList.remove('active'));
            this.classList.add('active');
            generateTimeSlots(dateString);
        });
        datePicker.appendChild(div);
    }

    // Активируем сегодня
    const todayItem = datePicker.querySelector(`[data-date="${today.toISOString().split('T')[0]}"]`);
    if (todayItem) todayItem.classList.add('active');
    generateTimeSlots(today.toISOString().split('T')[0]);
}

// Генерация временных слотов
function generateTimeSlots(dateString) {
    const timeSelect = document.getElementById('booking-time');
    if (!timeSelect) return;

    timeSelect.innerHTML = '<option value="">— Выберите время —</option>';
    const bookedSlots = JSON.parse(localStorage.getItem('bookedSlots') || '{}');

    for (let hour = 9; hour < 21; hour++) {
        for (let minutes of ['00', '30']) {
            const timeStr = `${hour.toString().padStart(2, '0')}:${minutes}`;
            const slotKey = `${dateString}_${timeStr}`;
            if (!bookedSlots[slotKey]) {
                const option = document.createElement('option');
                option.value = timeStr;
                option.textContent = timeStr;
                timeSelect.appendChild(option);
            }
        }
    }
}

// Голосовой помощник
const voiceBtn = document.getElementById('voice-btn');
if (voiceBtn && window.SpeechRecognition) {
    const recognition = new webkitSpeechRecognition();
    recognition.lang = 'ru-RU';
    recognition.interimResults = false;

    voiceBtn.addEventListener('click', () => {
        recognition.start();
        voiceBtn.innerHTML = '<i class="fas fa-microphone-slash"></i>';
    });

    recognition.onresult = function(event) {
        const transcript = event.results[0][0].transcript.toLowerCase();
        voiceBtn.innerHTML = '<i class="fas fa-microphone"></i>';

        if (transcript.includes('запишите меня')) {
            // Пример: "запишите меня на завтра в 15:00"
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            const dateString = tomorrow.toISOString().split('T')[0];
            
            const timeMatch = transcript.match(/(\d{1,2}):(\d{2})/);
            if (timeMatch) {
                const timeStr = `${timeMatch[1].padStart(2, '0')}:${timeMatch[2]}`;
                const dateItem = document.querySelector(`.date-item[data-date="${dateString}"]`);
                if (dateItem) {
                    document.querySelectorAll('.date-item').forEach(d => d.classList.remove('active'));
                    dateItem.classList.add('active');
                    generateTimeSlots(dateString);
                    const timeSelect = document.getElementById('booking-time');
                    timeSelect.value = timeStr;
                }
            }
        }
    };

    recognition.onerror = function() {
        voiceBtn.innerHTML = '<i class="fas fa-microphone"></i>';
    };
}

// Слоты в реальном времени
function updateSlotsCounter() {
    const counter = document.getElementById('realtime-slots');
    const hotBadge = document.getElementById('hot-badge');
    if (!counter) return;

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const bookedSlots = JSON.parse(localStorage.getItem('bookedSlots') || '{}');
    let bookedToday = 0;

    for (let key in bookedSlots) {
        if (key.startsWith(todayStr)) bookedToday++;
    }

    const totalSlots = 24;
    const available = totalSlots - bookedToday;
    counter.textContent = Math.max(0, available);

    if (available <= 3 && available > 0) {
        hotBadge.textContent = "🔥 HOT";
    } else {
        hotBadge.textContent = "";
    }
}

// Таймер в шапке
function startHeaderTimer() {
    const timerElement = document.getElementById('header-timer');
    if (!timerElement) return;

    function updateTimer() {
        const now = new Date();
        const target = new Date();
        target.setHours(21, 0, 0, 0);

        if (now > target) {
            timerElement.textContent = "Акция завершена";
            return;
        }

        const diff = target - now;
        const hours = String(Math.floor(diff / (1000 * 60 * 60))).padStart(2, '0');
        const minutes = String(Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))).padStart(2, '0');
        const seconds = String(Math.floor((diff % (1000 * 60)) / 1000)).padStart(2, '0');

        timerElement.textContent = `${hours}:${minutes}:${seconds}`;
    }

    updateTimer();
    setInterval(updateTimer, 1000);
}

// Онлайн-запись
function initBooking() {
    const submitBtn = document.getElementById('booking-submit');
    const resultDiv = document.getElementById('booking-result');
    const thankyouPopup = document.getElementById('popup-thankyou');
    const thankyouDate = document.getElementById('thankyou-date');
    const thankyouTime = document.getElementById('thankyou-time');
    const closeThankyou = document.getElementById('close-thankyou');

    submitBtn?.addEventListener('click', function(e) {
        e.preventDefault();

        const name = document.getElementById('booking-name')?.value.trim();
        const phone = document.getElementById('booking-phone')?.value.trim();
        const date = document.querySelector('.date-item.active')?.dataset.date;
        const time = document.getElementById('booking-time')?.value;

        if (!name || !phone || !date || !time) {
            resultDiv.className = 'error';
            resultDiv.textContent = 'Заполните все поля.';
            resultDiv.style.display = 'block';
            return;
        }

        const slotKey = `${date}_${time}`;
        const bookedSlots = JSON.parse(localStorage.getItem('bookedSlots') || '{}');
        bookedSlots[slotKey] = { name, phone, date, time };
        localStorage.setItem('bookedSlots', JSON.stringify(bookedSlots));

        updateSlotsCounter();

        // Показать попап
        thankyouDate.textContent = new Date(date).toLocaleDateString('ru-RU');
        thankyouTime.textContent = time;
        thankyouPopup.style.display = 'flex';

        // Звук
        const sound = document.getElementById('success-sound');
        sound.currentTime = 0;
        sound.play().catch(e => console.log("Audio play failed:", e));

        // Сброс
        document.getElementById('booking-name').value = '';
        document.getElementById('booking-phone').value = '';

        resultDiv.className = 'success';
        resultDiv.innerHTML = `✅ Записаны на ${new Date(date).toLocaleDateString('ru-RU')} в ${time}!`;
        resultDiv.style.display = 'block';
        setTimeout(() => { resultDiv.style.display = 'none'; }, 5000);
    });

    if (closeThankyou) {
        closeThankyou.addEventListener('click', () => {
            thankyouPopup.style.display = 'none';
        });
    }
}

// Секретный жест — 3 пальца вниз
let touchStartY = 0;
document.addEventListener('touchstart', function(e) {
    if (e.touches.length === 3) {
        touchStartY = e.touches[0].clientY;
    }
});

document.addEventListener('touchend', function(e) {
    if (e.changedTouches.length === 3) {
        const touchEndY = e.changedTouches[0].clientY;
        if (touchStartY - touchEndY > 100) { // свайп вниз > 100px
            document.getElementById('vip-popup').style.display = 'flex';
        }
    }
});

document.getElementById('close-vip')?.addEventListener('click', function() {
    document.getElementById('vip-popup').style.display = 'none';
});

// Маршрут
document.getElementById('route-btn')?.addEventListener('click', function(e) {
    e.preventDefault();
    window.open('https://yandex.ru/maps/?whatshere[point]=37.840000,55.900000&whatshere[zoom]=17', '_blank');
});

// Звук при наведении
document.querySelectorAll('.btn, .date-item, .service-card').forEach(el => {
    el.addEventListener('mouseenter', () => {
        const sound = document.getElementById('hover-sound');
        sound.currentTime = 0;
        sound.play().catch(e => console.log("Audio play failed:", e));
    });
});

// Инициализация
document.addEventListener('DOMContentLoaded', function() {
    generateDates();
    updateSlotsCounter();
    startHeaderTimer();
    initBooking();
});
