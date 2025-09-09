// Плавный скролл
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            window.scrollTo({
                top: target.offsetTop - 80,
                behavior: 'smooth'
            });
        }
    });
});

// Анимация шагов при скролле
function animateSteps() {
    const steps = document.querySelectorAll('.step-item');
    const triggerBottom = window.innerHeight * 0.8;

    steps.forEach(step => {
        const stepTop = step.getBoundingClientRect().top;
        if (stepTop < triggerBottom) {
            step.classList.add('animate');
        }
    });
}

// Слоты (имитация)
function updateSlots() {
    const saved = localStorage.getItem('slotsUsed');
    const used = saved ? parseInt(saved) : 0;
    const total = 5;
    const remaining = Math.max(0, total - used);
    document.getElementById('slots-counter').textContent = remaining;

    if (remaining <= 1) {
        document.querySelector('.slots-box').style.background = 'rgba(230, 57, 70, 0.3)';
    }
}

// Onboarding подсветка кнопки при первом заходе
function showOnboarding() {
    if (localStorage.getItem('visited')) return;

    setTimeout(() => {
        const tooltip = document.getElementById('onboarding');
        const cta = document.getElementById('main-cta');
        if (cta && tooltip) {
            const rect = cta.getBoundingClientRect();
            tooltip.style.display = 'block';
            tooltip.style.top = (rect.top + window.scrollY - 80) + 'px';
            tooltip.style.left = (rect.left + window.scrollX - 300) + 'px';

            setTimeout(() => {
                tooltip.style.display = 'none';
                localStorage.setItem('visited', 'true');
            }, 3000);
        }
    }, 2000);
}

// Горячая линия мигает, если пользователь бездействует
let inactivityTimer;
function startInactivityTimer() {
    resetInactivityTimer();
    document.addEventListener('mousemove', resetInactivityTimer);
    document.addEventListener('keypress', resetInactivityTimer);
    document.addEventListener('touchstart', resetInactivityTimer);
}

function resetInactivityTimer() {
    clearTimeout(inactivityTimer);
    const hotline = document.querySelector('.hotline');
    if (hotline) hotline.classList.remove('blink');

    inactivityTimer = setTimeout(() => {
        if (hotline) hotline.classList.add('blink');
    }, 5000);
}

// Звук при наведении
const hoverSound = document.getElementById('hover-sound');
document.querySelectorAll('.btn').forEach(btn => {
    btn.addEventListener('mouseenter', () => {
        hoverSound.currentTime = 0;
        hoverSound.play().catch(e => console.log("Audio play failed:", e));
    });
});

// Маршрут
document.getElementById('build-route')?.addEventListener('click', function(e) {
    e.preventDefault();
    window.open('https://yandex.ru/maps/?whatshere[point]=37.6176,55.7558&whatshere[zoom]=17', '_blank');
});

// Инициализация
document.addEventListener('DOMContentLoaded', function() {
    // Анимация шагов
    window.addEventListener('scroll', animateSteps);
    animateSteps();

    // Слоты
    updateSlots();
    setInterval(() => {
        const counter = document.getElementById('slots-counter');
        if (counter && parseInt(counter.textContent) > 0) {
            localStorage.setItem('slotsUsed', (parseInt(localStorage.getItem('slotsUsed') || '0') + 1));
            updateSlots();
        }
    }, 120000); // каждые 2 минуты "уходит" 1 слот

    // Onboarding
    showOnboarding();

    // Inactivity blink
    startInactivityTimer();
});
