(async () => {
    const webchatElement = document.getElementById('webchat');
    if (!webchatElement) return;

    try {
        const response = await fetch('/api/directline-token', {
            method: 'POST',
            headers: { 'Accept': 'application/json' }
        });

        if (!response.ok) {
            throw new Error(`Direct Line token request failed: ${response.status}`);
        }

        const { token } = await response.json();
        if (!token) {
            throw new Error('Direct Line token response did not include a token');
        }

        window.WebChat.renderWebChat({
            directLine: window.WebChat.createDirectLine({ token })
        }, webchatElement);
    } catch (error) {
        console.error(error);
        webchatElement.textContent = 'The chat is temporarily unavailable.';
    }
})();
