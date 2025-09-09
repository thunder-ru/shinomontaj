// Параллакс
window.addEventListener('scroll', function() {
    const parallax = document.querySelector('.parallax');
    if (parallax) {
        const scrollY = window.scrollY;
        parallax.style.transform = `translateY(${scrollY * 0.5}px)`;
    }
});

// Анимация блоков при скролле
function animateOnScroll() {
    const elements = document.querySelectorAll('.step-card, .stat-card');
    const triggerBottom = window.innerHeight * 0.8;

    elements.forEach(el => {
        const elTop = el.getBoundingClientRect().top;
        if (elTop < triggerBottom) {
            el.classList.add('animate');
        }
    });
}

// Анимация статистики
function animateStats() {
    const statItems = document.querySelectorAll('.stat-number');
    statItems.forEach(item => {
        const target = +item.getAttribute('data-target');
        let count = 0;
        const duration = 2000;
        const step = target / (duration / 16);

        const timer = setInterval(() => {
            count += step;
            if (count >= target) {
                count = target;
                clearInterval(timer);
            }
            item.textContent = Math.floor(count);
        }, 16);
    });
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

// Мигающая горячая линия
function initHotlineBlink() {
    let inactivityTimer;
    function resetTimer() {
        clearTimeout(inactivityTimer);
        const hotline = document.getElementById('hotline-blink');
        if (hotline) hotline.classList.remove('blink');

        inactivityTimer = setTimeout(() => {
            if (hotline) hotline.classList.add('blink');
        }, 5000);
    }

    ['mousemove', 'keypress', 'touchstart', 'scroll'].forEach(event => {
        document.addEventListener(event, resetTimer);
    });

    resetTimer();
}

// Срочная запись
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

// Онлайн-запись
function initBooking() {
    const dateInput = document.getElementById('booking-date');
    const timeSelect = document.getElementById('booking-time');
    const submitBtn = document.getElementById('booking-submit');
    const resultDiv = document.getElementById('booking-result');
    const loadingSpinner = document.getElementById('loading-spinner');
    const returningUser = document.getElementById('returning-user');
    const existingBooking = document.getElementById('existing-booking');
    const thankyouPopup = document.getElementById('popup-thankyou');
    const thankyouDate = document.getElementById('thankyou-date');
    const thankyouTime = document.getElementById('thankyou-time');
    const closeThankyou = document.getElementById('close-thankyou');

    const today = new Date().toISOString().split('T')[0];
    dateInput.min = today;

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
        }, 800);
    }

    dateInput.addEventListener('change', generateTimeSlots);

    submitBtn.addEventListener('click', async function(e) {
        e.preventDefault();

        const name = document.getElementById('booking-name').value.trim();
        const phone = document.getElementById('booking-phone').value.trim();
        const date = dateInput.value;
        const time = timeSelect.value;

        if (!name || !phone || !date || !time || time === 'Нет свободных мест') {
            showError('Пожалуйста, заполните все поля корректно.');
            return;
        }

        const slotKey = `${date}_${time}`;
        const bookedSlots = JSON.parse(localStorage.getItem('bookedSlots') || '{}');

        if (bookedSlots[slotKey]) {
            showError('Это время уже занято. Выберите другое.');
            return;
        }

        bookedSlots[slotKey] = { name, phone, date, time };
        localStorage.setItem('bookedSlots', JSON.stringify(bookedSlots));
        localStorage.setItem('lastPhone', phone);

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
                updateSlotsCounter();
                showSuccess(`Вы записаны на ${date} в ${time}!`);

                // Показываем попап "Спасибо"
                thankyouDate.textContent = date;
                thankyouTime.textContent = time;
                thankyouPopup.style.display = 'flex';

                // Открываем WhatsApp
                const message = `Привет! Я записался на ${date} в ${time} через сайт. Подтвердите, пожалуйста!`;
                setTimeout(() => {
                    window.open(`https://wa.me/79991234567?text=${encodeURIComponent(message)}`, '_blank');
                }, 2000);

                // Звук
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

    function showError(message) {
        resultDiv.className = 'error';
        resultDiv.innerHTML = `❌ ${message}`;
        resultDiv.style.display = 'block';
        setTimeout(() => { resultDiv.style.display = 'none'; }, 5000);
    }

    function showSuccess(message) {
        resultDiv.className = 'success';
        resultDiv.innerHTML = `✅ ${message}<br>Через 2 секунды откроем WhatsApp.`;
        resultDiv.style.display = 'block';
    }

    // Закрытие попапа
    if (closeThankyou) {
        closeThankyou.addEventListener('click', () => {
            thankyouPopup.style.display = 'none';
        });
    }

    if (dateInput.value) generateTimeSlots();
    checkExistingBooking();
}

// Счётчик слотов
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

// Маршрут
document.getElementById('route-btn')?.addEventListener('click', function(e) {
    e.preventDefault();
    window.open('https://yandex.ru/maps/?whatshere[point]=37.6176,55.7558&whatshere[zoom]=17', '_blank');
});

// Звук при наведении
document.addEventListener('DOMContentLoaded', function() {
    const clickSound = document.getElementById('click-sound');
    document.querySelectorAll('.btn, .contact-btn').forEach(btn => {
        btn.addEventListener('mouseenter', () => {
            clickSound.currentTime = 0;
            clickSound.play().catch(e => console.log("Audio play failed:", e));
        });
    });
});

// Инициализация
window.addEventListener('DOMContentLoaded', function() {
    animateOnScroll();
    window.addEventListener('scroll', animateOnScroll);

    const statsSection = document.querySelector('.why-us');
    if (statsSection) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    animateStats();
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.5 });
        observer.observe(statsSection);
    }

    startHeaderTimer();
    initHotlineBlink();
    checkUrgentBooking();
    initBooking();
    updateSlotsCounter();
});
