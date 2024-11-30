// // src/popup/popup.js

// document.getElementById('startTestBtn').addEventListener('click', async () => {
//     const status = document.getElementById('status');
//     status.textContent = 'Requesting microphone access...';
  
//     try {
//       // Query the active tab
//       const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
//       // Inject the content script into the active tab
//       await chrome.scripting.executeScript({
//         target: { tabId: tab.id },
//         files: ['src/content/contentScript.js']
//       });
  
//       // Send a message to the content script to initiate microphone access
//       chrome.tabs.sendMessage(tab.id, { action: 'requestMic' }, (response) => {
//         if (chrome.runtime.lastError) {
//           console.error('Error sending message:', chrome.runtime.lastError);
//           status.textContent = 'An error occurred. Check console for details.';
//           return;
//         }
  
//         if (response && response.success) {
//           status.textContent = 'Microphone access granted. Check console.';
//           console.log('Microphone access has been granted.');
//         } else {
//           status.textContent = 'Microphone access denied or an error occurred.';
//           console.log('Microphone access was denied or an error occurred.');
//         }
//       });
//     } catch (error) {
//       console.error('Error during microphone access request:', error);
//       status.textContent = 'An error occurred during the request.';
//     }
//   });
  


// document.getElementById('startRecordingBtn').addEventListener('click', async () => {
//   const status = document.getElementById('status');
//   status.textContent = 'Starting recording...';

//   try {
//     // Query the active tab
//     const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

//     // Inject the content script into the active tab
//     await chrome.scripting.executeScript({
//       target: { tabId: tab.id },
//       files: ['src/content/contentScript.js']
//     });

//     // Send a message to the content script to start recording
//     chrome.tabs.sendMessage(tab.id, { action: 'startRecording' }, (response) => {
//       if (chrome.runtime.lastError) {
//         console.error('Error sending message:', chrome.runtime.lastError);
//         status.textContent = 'An error occurred. Check console for details.';
//         return;
//       }

//       if (response && response.success) {
//         status.textContent = 'Recording started.';
//         console.log('Recording has been started.');
//         document.getElementById('startRecordingBtn').disabled = true;
//         document.getElementById('stopRecordingBtn').disabled = false;
//       } else {
//         status.textContent = 'Failed to start recording.';
//         console.log('Failed to start recording.');
//       }
//     });
//   } catch (error) {
//     console.error('Error during recording start:', error);
//     status.textContent = 'An error occurred during the request.';
//   }
// });

document.getElementById('stopRecordingBtn').addEventListener('click', async () => {
  const status = document.getElementById('status');
  status.textContent = 'Stopping recording...';

  try {
    // Query the active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    // Send a message to the content script to stop recording
    chrome.tabs.sendMessage(tab.id, { action: 'stopRecording' }, async (response) => {
      if (chrome.runtime.lastError) {
        console.error('Error sending message:', chrome.runtime.lastError);
        status.textContent = 'An error occurred. Check console for details.';
        return;
      }

      if (response && response.success) {
        status.textContent = 'Recording stopped.';
        console.log('Recording has been stopped.');
        document.getElementById('startRecordingBtn').disabled = false;
        document.getElementById('stopRecordingBtn').disabled = true;

        // Handle the recorded audio data
        const audioData = response.audioData; // This is a base64-encoded string
        // Do something with audioData, e.g., play it or send it to a server

        // Example: Play the recorded audio
        const audio = new Audio(audioData);
        audio.play();

        // Example: Store the audio data in a variable for later use
        window.recordedAudioData = audioData;

        // If you plan to send it to Cloudflare later, you can store it or send it here
      } else {
        status.textContent = 'Failed to stop recording.';
        console.log('Failed to stop recording.');
      }
    });
  } catch (error) {
    console.error('Error during recording stop:', error);
    status.textContent = 'An error occurred during the request.';
  }
});