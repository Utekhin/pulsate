/**
 * Session Management - Tracks user sessions and circle counts
 * Uses localStorage to persist session data
 */
function initializeUserSession() {
    let sessionData = localStorage.getItem('waveSynthSession');
    let session;

    if (!sessionData) {
        // Create new session
        session = {
            id: Date.now() + Math.random().toString(36).substring(2),
            createdAt: new Date().toISOString(),
            circleCount: 0
        };
        localStorage.setItem('waveSynthSession', JSON.stringify(session));
    } else {
        // Load existing session
        session = JSON.parse(sessionData);
    }

    /**
     * Update session statistics with current circle count
     */
    function updateSessionStats(circles) {
        session.circleCount = circles.length;
        localStorage.setItem('waveSynthSession', JSON.stringify(session));
    }

    /**
     * Clean up old sessions (older than 1 hour)
     */
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
                } catch (e) {
                    localStorage.removeItem(key);
                }
            });
    }

    // Run cleanup every 30 minutes
    setInterval(cleanupOldSessions, 30 * 60 * 1000);

    // Check if current session is older than 2 hours
    const sessionCreatedAt = new Date(session.createdAt);
    const sessionDuration = new Date() - sessionCreatedAt;

    if (sessionDuration > 2 * 60 * 60 * 1000) {
        localStorage.removeItem('waveSynthSession');
        // Re-initialize instead of calling clearField here, avoid reference issues
        initializeUserSession();
        return;
    }

    console.log(`Session initialized: ${session.id}`);
    console.log(`Session created at: ${session.createdAt}`);

    // Return an object containing methods to interact with the session
    return {
        updateSessionStats: updateSessionStats,
        getSessionData: () => JSON.parse(localStorage.getItem('waveSynthSession'))
    };
}

// Save session data before page unload
window.addEventListener('beforeunload', () => {
    if (window.sessionManager) {
        const sessionData = window.sessionManager.getSessionData();
        if (sessionData && window.circles) {
            sessionData.circleCount = window.circles.length;
            localStorage.setItem('waveSynthSession', JSON.stringify(sessionData));
        }
    }
});

export default initializeUserSession;
