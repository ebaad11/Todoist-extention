// src/popup/popup.js

document.getElementById('startTestBtn').addEventListener('click', async () => {
  const status = document.getElementById('status');
  status.textContent = 'Requesting microphone access...';

  try {
    // Query the active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    // Send a message to the content script to initiate microphone access
    chrome.tabs.sendMessage(tab.id, { action: 'requestMic' }, (response) => {
      if (chrome.runtime.lastError) {
        console.error('Error sending message:', chrome.runtime.lastError);
        status.textContent = 'An error occurred. Check console for details.';
        return;
      }

      if (response && response.success) {
        status.textContent = 'Microphone access granted. Check console.';
        console.log('Microphone access has been granted.');
      } else {
        status.textContent = 'Microphone access denied or an error occurred.';
        console.log('Microphone access was denied or an error occurred.');
      }
    });
  } catch (error) {
    console.error('Error during microphone access request:', error);
    status.textContent = 'An error occurred during the request.';
  }
});
