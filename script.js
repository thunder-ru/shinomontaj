// Параллакс для видео
window.addEventListener('scroll', function() {
    const parallax = document.querySelector('.parallax');
    if (parallax) {
        const scrollY = window.scrollY;
        parallax.style.transform = `translateY(${scrollY * 0.5}px)`;
    }
});

// Анимация шагов при скролле
function animateSteps() {
    const steps = document.querySelectorAll('.step-card');
    const triggerBottom = window.innerHeight * 0.8;

    steps.forEach(step => {
        const stepTop = step.getBoundingClientRect().top;
        if (stepTop < triggerBottom) {
            step.classList.add('animate');
        }
    });
}

// Инициализация календаря
function initBooking() {
    const dateInput = document.getElementById('booking-date');
    const timeSelect = document.getElementById('booking-time');
    const submitBtn = document.getElementById('booking-submit');
    const resultDiv = document.getElementById('booking-result');

    // Установка минимальной даты (сегодня)
    const today = new Date().toISOString().split('T')[0];
    dateInput.min = today;

    // Генерация временных слотов (каждые 30 минут с 8:00 до 22:00)
    function generateTimeSlots() {
        timeSelect.innerHTML = '<option value="">— Выберите время —</option>';
        for (let hour = 8; hour < 22; hour++) {
            for (let minutes of ['00', '30']) {
                const timeStr = `${hour.toString().padStart(2, '0')}:${minutes}`;
                const slotKey = `${dateInput.value}_${timeStr}`;
                const isBooked = JSON.parse(localStorage.getItem('bookedSlots') || '{}')[slotKey];
                if (!isBooked) {
                    const option = document.createElement('option');
                    option.value = timeStr;
                    option.textContent = timeStr;
                    timeSelect.appendChild(option);
                }
            }
        }
    }

    // Обновление слотов при изменении даты
    dateInput.addEventListener('change', generateTimeSlots);

    // Обработка отправки формы
    submitBtn.addEventListener('click', function() {
        const name = document.getElementById('booking-name').value;
        const phone = document.getElementById('booking-phone').value;
        const date = dateInput.value;
        const time = timeSelect.value;

        if (!name || !phone || !date || !time) {
            resultDiv.className = 'error';
            resultDiv.textContent = 'Пожалуйста, заполните все поля.';
            resultDiv.style.display = 'block';
            return;
        }

        const slotKey = `${date}_${time}`;
        const bookedSlots = JSON.parse(localStorage.getItem('bookedSlots') || '{}');
        bookedSlots[slotKey] = { name, phone, date, time };
        localStorage.setItem('bookedSlots', JSON.stringify(bookedSlots));

        // Обновление счётчика слотов
        updateSlotsCounter();

        resultDiv.className = 'success';
        resultDiv.innerHTML = `✅ Вы успешно записаны!<br>Ждём вас ${date} в ${time}.<br>За час напомним по WhatsApp.`;
        resultDiv.style.display = 'block';

        // Воспроизведение звука
        const sound = document.getElementById('click-sound');
        sound.currentTime = 0;
        sound.play().catch(e => console.log("Audio play failed:", e));

        // Сброс формы
        setTimeout(() => {
            document.getElementById('booking-name').value = '';
            document.getElementById('booking-phone').value = '';
            timeSelect.innerHTML = '<option value="">— Выберите время —</option>';
        }, 3000);
    });

    // Инициализация
    if (dateInput.value) generateTimeSlots();
}

// Счётчик слотов в реальном времени
function updateSlotsCounter() {
    const counter = document.getElementById('realtime-slots');
    if (!counter) return;

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const bookedSlots = JSON.parse(localStorage.getItem('bookedSlots') || '{}');
    let bookedToday = 0;

    for (let key in bookedSlots) {
        if (key.startsWith(todayStr)) bookedToday++;
    }

    const totalSlots = 28; // 14 часов * 2 слота
    const available = totalSlots - bookedToday;
    counter.textContent = Math.max(0, available);

    if (available <= 3) {
        counter.parentElement.style.color = '#e63946';
        counter.parentElement.innerHTML = `<i class="fas fa-fire"></i> Осталось: <span>${available}</span>`;
    }
}

// Обновление слотов каждые 2 минуты
setInterval(updateSlotsCounter, 120000);

// Маршрут
document.getElementById('route-btn')?.addEventListener('click', function(e) {
    e.preventDefault();
    window.open('https://yandex.ru/maps/?whatshere[point]=37.6176,55.7558&whatshere[zoom]=17', '_blank');
});

// Инициализация
document.addEventListener('DOMContentLoaded', function() {
    // Анимация шагов
    window.addEventListener('scroll', animateSteps);
    animateSteps();

    // Онлайн-запись
    initBooking();

    // Счётчик слотов
    updateSlotsCounter();

    // Звук при наведении на кнопки
    const sound = document.getElementById('click-sound');
    document.querySelectorAll('.btn').forEach(btn => {
        btn.addEventListener('mouseenter', () => {
            sound.currentTime = 0;
            sound.play().catch(e => console.log("Audio play failed:", e));
        });
    });
});
