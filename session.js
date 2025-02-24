// session.js
function initializeUserSession() {
    let sessionData = localStorage.getItem('waveSynthSession');
    let session;

    if (!sessionData) {
        session = {
            id: Date.now() + Math.random().toString(36).substring(2),
            createdAt: new Date().toISOString(),
            circleCount: 0
        };
        localStorage.setItem('waveSynthSession', JSON.stringify(session));
    } else {
        session = JSON.parse(sessionData);
    }

    function updateSessionStats(circles) {
        session.circleCount = circles.length;
        localStorage.setItem('waveSynthSession', JSON.stringify(session));
    }

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

    setInterval(cleanupOldSessions, 30 * 60 * 1000);

    const sessionCreatedAt = new Date(session.createdAt);
    const sessionDuration = new Date() - sessionCreatedAt;

    if (sessionDuration > 2 * 60 * 60 * 1000) {
        localStorage.removeItem('waveSynthSession');
        //  Re-initialize instead of calling clearField here, avoid reference issues
        initializeUserSession();
        return; // Exit this execution to prevent further actions on the old session.
    }

    console.log(`Session initialized: ${session.id}`);
    console.log(`Session created at: ${session.createdAt}`);


    // Return an object containing methods to interact with the session
    return {
        updateSessionStats: updateSessionStats,
        getSessionData: () => JSON.parse(localStorage.getItem('waveSynthSession'))  //Get current session data
    };
}


window.addEventListener('beforeunload', () => {
    // Get the current session data from the session manager (if initialized)
    if (window.sessionManager) {
        const sessionData = window.sessionManager.getSessionData();
       if(sessionData && window.circles){
            sessionData.circleCount = window.circles.length; //Update with current circle count
            localStorage.setItem('waveSynthSession', JSON.stringify(sessionData)); //Save to local storage
       }

    }
});
export default initializeUserSession;
