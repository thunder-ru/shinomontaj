// Параллакс для видео в герое
window.addEventListener('scroll', function() {
    const parallax = document.querySelector('.parallax');
    if (parallax) {
        const scrollY = window.scrollY;
        parallax.style.transform = `translateY(${scrollY * 0.5}px)`;
    }
});

// Анимация блока "Как это работает" при скролле
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

// Таймер в шапке (до 21:00)
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

// Показ срочной записи (если после 18:00 и есть свободные слоты)
function checkUrgentBooking() {
    const now = new Date();
    const urgentBox = document.getElementById('urgent-booking');
    if (!urgentBox) return;

    if (now.getHours() >= 18) {
        const bookedSlots = JSON.parse(localStorage.getItem('bookedSlots') || '{}');
        const today = now.toISOString().split('T')[0];
        let hasFreeSlot = false;

        for (let hour = now.getHours(); hour < 21; hour++) {
            for (let min of ['00', '30']) {
                if (hour === now.getHours() && min === '00' && now.getMinutes() >= 30) continue;
                if (hour === now.getHours() && min === '30' && now.getMinutes() >= 30) continue;
                const timeStr = `${hour.toString().padStart(2, '0')}:${min}`;
                const slotKey = `${today}_${timeStr}`;
                if (!bookedSlots[slotKey]) {
                    hasFreeSlot = true;
                    break;
                }
            }
            if (hasFreeSlot) break;
        }

        if (hasFreeSlot) {
            urgentBox.style.display = 'flex';
        }
    }
}

// Инициализация онлайн-записи
function initBooking() {
    const dateInput = document.getElementById('booking-date');
    const timeSelect = document.getElementById('booking-time');
    const submitBtn = document.getElementById('booking-submit');
    const resultDiv = document.getElementById('booking-result');
    const loadingSpinner = document.getElementById('loading-spinner');
    const returningUser = document.getElementById('returning-user');
    const existingBooking = document.getElementById('existing-booking');

    // Установка минимальной даты — сегодня
    const today = new Date().toISOString().split('T')[0];
    dateInput.min = today;

    // Проверка, есть ли уже запись у пользователя
    function checkExistingBooking() {
        const phone = localStorage.getItem('lastPhone');
        if (!phone) return;

        const bookedSlots = JSON.parse(localStorage.getItem('bookedSlots') || '{}');
        for (let key in bookedSlots) {
            if (bookedSlots[key].phone === phone) {
                const slot = bookedSlots[key];
                existingBooking.textContent = `${slot.date} в ${slot.time}`;
                returningUser.style.display = 'block';
                return;
            }
        }
    }

    // Генерация временных слотов (09:00–21:00, шаг 30 мин)
    function generateTimeSlots() {
        loadingSpinner.style.display = 'flex';
        timeSelect.innerHTML = '<option value="">— Загрузка... —</option>';

        setTimeout(() => {
            const selectedDate = dateInput.value;
            if (!selectedDate) {
                loadingSpinner.style.display = 'none';
                timeSelect.innerHTML = '<option value="">— Выберите дату сначала —</option>';
                return;
            }

            const bookedSlots = JSON.parse(localStorage.getItem('bookedSlots') || '{}');
            timeSelect.innerHTML = '<option value="">— Выберите время —</option>';

            let slotCount = 0;
            for (let hour = 9; hour < 21; hour++) {
                for (let minutes of ['00', '30']) {
                    const timeStr = `${hour.toString().padStart(2, '0')}:${minutes}`;
                    const slotKey = `${selectedDate}_${timeStr}`;
                    if (!bookedSlots[slotKey]) {
                        const option = document.createElement('option');
                        option.value = timeStr;
                        option.textContent = timeStr;
                        timeSelect.appendChild(option);
                        slotCount++;
                    }
                }
            }

            loadingSpinner.style.display = 'none';

            if (slotCount === 0) {
                timeSelect.innerHTML = '<option value="">Нет свободных мест</option>';
            }
        }, 800); // Имитация загрузки
    }

    dateInput.addEventListener('change', generateTimeSlots);

    // Обработка отправки формы
    submitBtn.addEventListener('click', async function(e) {
        e.preventDefault();

        const name = document.getElementById('booking-name').value.trim();
        const phone = document.getElementById('booking-phone').value.trim();
        const date = dateInput.value;
        const time = timeSelect.value;

        // Валидация
        if (!name) {
            showError('Пожалуйста, введите ваше имя.');
            return;
        }
        if (!phone) {
            showError('Пожалуйста, введите ваш телефон.');
            return;
        }
        if (!date) {
            showError('Пожалуйста, выберите дату.');
            return;
        }
        if (!time || time === 'Нет свободных мест') {
            showError('Пожалуйста, выберите доступное время.');
            return;
        }

        const slotKey = `${date}_${time}`;
        const bookedSlots = JSON.parse(localStorage.getItem('bookedSlots') || '{}');

        if (bookedSlots[slotKey]) {
            showError('Это время уже занято. Выберите другое.');
            return;
        }

        // Сохраняем локально
        bookedSlots[slotKey] = { name, phone, date, time };
        localStorage.setItem('bookedSlots', JSON.stringify(bookedSlots));
        localStorage.setItem('lastPhone', phone);

        // Отправляем на сервер для SMS и Telegram
        try {
            const response = await fetch('https://your-server.com/api/booking', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name,
                    phone,
                    date,
                    time,
                    service: "Шиномонтаж"
                })
            });

            if (response.ok) {
                // Обновляем UI
                updateSlotsCounter();
                showSuccess(`Вы записаны на ${date} в ${time}!`);

                // Открываем WhatsApp для подтверждения
                const message = `Привет! Я записался на ${date} в ${time} через сайт Шиномонтажка 008. Подтвердите, пожалуйста!`;
                setTimeout(() => {
                    window.open(`https://wa.me/79991234567?text=${encodeURIComponent(message)}`, '_blank');
                }, 1500);

                // Воспроизведение звука успеха
                const sound = document.getElementById('success-sound');
                sound.currentTime = 0;
                sound.play().catch(e => console.log("Audio play failed:", e));

                // Сброс формы
                document.getElementById('booking-name').value = '';
                document.getElementById('booking-phone').value = '';
                generateTimeSlots();

            } else {
                throw new Error('Ошибка сервера');
            }
        } catch (error) {
            console.error("Ошибка отправки:", error);
            showError('Не удалось отправить заявку. Попробуйте WhatsApp или Telegram.');
        }
    });

    // Вспомогательные функции
    function showError(message) {
        resultDiv.className = 'error';
        resultDiv.innerHTML = `❌ ${message}`;
        resultDiv.style.display = 'block';
        setTimeout(() => { resultDiv.style.display = 'none'; }, 5000);
    }

    function showSuccess(message) {
        resultDiv.className = 'success';
        resultDiv.innerHTML = `✅ ${message}<br>Через 1 секунду откроем WhatsApp для подтверждения.`;
        resultDiv.style.display = 'block';
    }

    // Инициализация
    if (dateInput.value) generateTimeSlots();
    checkExistingBooking();
}

// Счётчик свободных слотов
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

    const totalSlots = 24; // 12 часов × 2 слота
    const available = totalSlots - bookedToday;
    counter.textContent = Math.max(0, available);

    if (available <= 3 && available > 0) {
        hotBadge.textContent = "🔥 HOT";
    } else {
        hotBadge.textContent = "";
    }
}

// Открытие карты
document.getElementById('route-btn')?.addEventListener('click', function(e) {
    e.preventDefault();
    window.open('https://yandex.ru/maps/?whatshere[point]=37.6176,55.7558&whatshere[zoom]=17', '_blank');
});

// Звук при наведении на кнопки
document.addEventListener('DOMContentLoaded', function() {
    const clickSound = document.getElementById('click-sound');
    document.querySelectorAll('.btn, .contact-btn').forEach(btn => {
        btn.addEventListener('mouseenter', () => {
            clickSound.currentTime = 0;
            clickSound.play().catch(e => console.log("Audio play failed:", e));
        });
    });
});

// Инициализация всего при загрузке страницы
window.addEventListener('DOMContentLoaded', function() {
    animateSteps();
    window.addEventListener('scroll', animateSteps);

    startHeaderTimer();
    checkUrgentBooking();
    initBooking();
    updateSlotsCounter();
});
