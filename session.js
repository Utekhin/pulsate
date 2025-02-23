// Функция для инициализации и управления пользовательской сессией
function initializeUserSession() {
    // Проверяем существующую сессию или создаем новую
    let sessionData = localStorage.getItem('waveSynthSession');
    
    if (!sessionData) {
        // Создаем новую сессию с уникальным идентификатором
        sessionData = JSON.stringify({
            id: Date.now() + Math.random().toString(36).substring(2),
            createdAt: new Date().toISOString(),
            circleCount: 0
        });
        
        localStorage.setItem('waveSynthSession', sessionData);
    }

    // Парсим существующие данные сессии
    const session = JSON.parse(sessionData);

    // Функция для обновления статистики сессии
    function updateSessionStats() {
        session.circleCount = circles.length;
        localStorage.setItem('waveSynthSession', JSON.stringify(session));
    }

    // Переопределяем существующие функции для отслеживания сессии
    const originalMousePressed = mousePressed;
    mousePressed = function() {
        originalMousePressed();
        updateSessionStats();
    };

    const originalClearField = clearField;
    clearField = function() {
        originalClearField();
        session.circleCount = 0;
        localStorage.setItem('waveSynthSession', JSON.stringify(session));
    };

    // Очистка старых сессий (старше 1 часа)
    function cleanupOldSessions() {
        const currentTime = new Date();
        const oneHourAgo = new Date(currentTime - 60 * 60 * 1000);
        
        Object.keys(localStorage)
            .filter(key => key.startsWith('waveSynthSession'))
            .forEach(key => {
                try {
                    const sessionData = JSON.parse(localStorage.getItem(key));
                    const sessionCreatedAt = new Date(sessionData.createdAt);
                    
                    if (sessionCreatedAt < oneHourAgo) {
                        localStorage.removeItem(key);
                    }
                } catch(e) {
                    // Удаляем некорректные записи
                    localStorage.removeItem(key);
                }
            });
    }

    // Периодическая очистка сессий
    setInterval(cleanupOldSessions, 30 * 60 * 1000); // Каждые 30 минут

    // Максимальная длительность сессии - 2 часа
    const sessionCreatedAt = new Date(session.createdAt);
    const sessionDuration = new Date() - sessionCreatedAt;
    
    if (sessionDuration > 2 * 60 * 60 * 1000) {
        // Принудительный сброс сессии по истечении 2 часов
        clearField();
        localStorage.removeItem('waveSynthSession');
        initializeUserSession();
    }

    // Логирование состояния сессии
    console.log(`Session initialized: ${session.id}`);
    console.log(`Session created at: ${session.createdAt}`);
}

// Вызываем инициализацию сессии при загрузке страницы
window.addEventListener('load', initializeUserSession);

// Обработка закрытия/перезагрузки страницы
window.addEventListener('beforeunload', () => {
    const sessionData = localStorage.getItem('waveSynthSession');
    if (sessionData) {
        const session = JSON.parse(sessionData);
        session.circleCount = circles.length;
        localStorage.setItem('waveSynthSession', JSON.stringify(session));
    }
});