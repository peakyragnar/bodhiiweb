document.addEventListener('DOMContentLoaded', () => {
    const messageInput = document.querySelector('.message-input');
    const voiceButton = document.querySelector('.voice-button');
    const actionButtons = document.querySelectorAll('.action-btn');
    const featureButtons = document.querySelectorAll('.feature-btn');

    // Handle message input
    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            const message = messageInput.value.trim();
            if (message) {
                console.log('Message sent:', message);
                messageInput.value = '';
            }
        }
    });

    // Handle voice button click
    voiceButton.addEventListener('click', () => {
        console.log('Voice input requested');
    });

    // Add hover effect to buttons
    [...actionButtons, ...featureButtons].forEach(button => {
        button.addEventListener('click', (e) => {
            console.log('Button clicked:', e.target.textContent.trim());
        });
    });
}); 