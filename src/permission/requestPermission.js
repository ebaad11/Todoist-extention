// src/permission/requestPermission.js

(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log('Microphone access granted in iframe.');
  
      // Stop all tracks to release the microphone immediately
      stream.getTracks().forEach(track => track.stop());
  
      // Optionally, communicate back to the content script
      // Note: Direct communication between iframe and content scripts is restricted
      // If needed, consider using DOM events or other methods
    } catch (error) {
      console.error('Microphone access denied in iframe:', error);
    } finally {
      // Remove the iframe after the permission request to clean up
      const iframe = document.getElementById('micPermissionIframe');
      if (iframe) {
        iframe.remove();
        console.log('Permission iframe removed.');
      }
    }
  })();
  