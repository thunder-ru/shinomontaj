// Плавающая кнопка — звук при наведении
document.querySelectorAll('.floating-help, .btn').forEach(el => {
    el.addEventListener('mouseenter', () => {
        const sound = document.getElementById('click-sound');
        sound.currentTime = 0;
        sound.play().catch(e => console.log("Audio play failed:", e));
    });
});

// Слоты
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

// Генерация слотов
function initBooking() {
    const dateInput = document.getElementById('booking-date');
    const timeSelect = document.getElementById('booking-time');
    const submitBtn = document.getElementById('booking-submit');
    const resultDiv = document.getElementById('booking-result');
    const thankyouPopup = document.getElementById('popup-thankyou');
    const thankyouDate = document.getElementById('thankyou-date');
    const thankyouTime = document.getElementById('thankyou-time');
    const closeThankyou = document.getElementById('close-thankyou');

    const today = new Date().toISOString().split('T')[0];
    dateInput.min = today;

    function generateTimeSlots() {
        const selectedDate = dateInput.value;
        if (!selectedDate) {
            timeSelect.innerHTML = '<option value="">— Выберите дату —</option>';
            return;
        }

        const bookedSlots = JSON.parse(localStorage.getItem('bookedSlots') || '{}');
        timeSelect.innerHTML = '<option value="">— Выберите время —</option>';

        for (let hour = 9; hour < 21; hour++) {
            for (let minutes of ['00', '30']) {
                const timeStr = `${hour.toString().padStart(2, '0')}:${minutes}`;
                const slotKey = `${selectedDate}_${timeStr}`;
                if (!bookedSlots[slotKey]) {
                    const option = document.createElement('option');
                    option.value = timeStr;
                    option.textContent = timeStr;
                    timeSelect.appendChild(option);
                }
            }
        }
    }

    dateInput.addEventListener('change', generateTimeSlots);

    submitBtn.addEventListener('click', function(e) {
        e.preventDefault();

        const name = document.getElementById('booking-name').value.trim();
        const phone = document.getElementById('booking-phone').value.trim();
        const date = dateInput.value;
        const time = timeSelect.value;

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
        thankyouDate.textContent = date;
        thankyouTime.textContent = time;
        thankyouPopup.style.display = 'flex';

        // Звук
        const sound = document.getElementById('success-sound');
        sound.currentTime = 0;
        sound.play().catch(e => console.log("Audio play failed:", e));

        // Сброс
        document.getElementById('booking-name').value = '';
        document.getElementById('booking-phone').value = '';
        generateTimeSlots();

        resultDiv.className = 'success';
        resultDiv.innerHTML = `✅ Записаны на ${date} в ${time}!`;
        resultDiv.style.display = 'block';
        setTimeout(() => { resultDiv.style.display = 'none'; }, 5000);
    });

    if (closeThankyou) {
        closeThankyou.addEventListener('click', () => {
            thankyouPopup.style.display = 'none';
        });
    }

    generateTimeSlots();
}

// Маршрут до меня
document.getElementById('route-btn')?.addEventListener('click', function(e) {
    e.preventDefault();
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(position) {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            window.open(`https://yandex.ru/maps/?rtext=${lat},${lng}~55.900000,37.840000&rtt=auto`, '_blank');
        });
    } else {
        alert('Геолокация не поддерживается вашим браузером.');
    }
});

// Инициализация
document.addEventListener('DOMContentLoaded', function() {
    updateSlotsCounter();
    initBooking();
});
