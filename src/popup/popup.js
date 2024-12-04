// document.getElementById('startRecording').addEventListener('click', async () => {
//   const status = document.getElementById('status');
//   status.textContent = 'Requesting microphone access...';

//   try {
//     // Query the active tab
//     const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

//     // Send a message to the content script to initiate microphone access
    
//     chrome.tabs.sendMessage(tab.id, { action: 'requestMic' }, (response) => {
      
//       if (chrome.runtime.lastError) {
//         console.error('Error sending message:', chrome.runtime.lastError);
//         status.textContent = 'An error occurred. Check console for details.';
//         return;
//       }

//       if (response && response.success) {
//         status.textContent = 'Microphone access granted. Check console.';
//         console.log('Microphone access has been granted.');
//       } else {
//         status.textContent = 'Microphone access denied or an error occurred.';
//         console.log('Microphone access was denied or an error occurred.');
//       }
//     });
//   } catch (error) {
//     console.error('Error during microphone access request:', error);
//     status.textContent = 'An error occurred during the request.';
//   }
// });



// document.addEventListener('DOMContentLoaded', () => {
//   const startButton = document.getElementById('startRecording');
//   const stopButton = document.getElementById('stopRecording');
//   const status = document.getElementById('status');

//   // Initialize UI
//   stopButton.disabled = true;

//   // Event listener for Start Recording button
//   startButton.addEventListener('click', () => {
//     status.textContent = 'Start button clicked.';
//     startButton.disabled = true;
//     stopButton.disabled = false;
//   });

//   // Event listener for Stop Recording button
//   stopButton.addEventListener('click', () => {
//     status.textContent = 'Stop button clicked.';
//     startButton.disabled = false;
//     stopButton.disabled = true;
//   });



//   // Function to send messages to the content script
// const sendMessageToContent = (action) => {
//   return new Promise((resolve, reject) => {
//     chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
//       const activeTab = tabs[0];
//       if (!activeTab) {
//         reject('No active tab found.');
//         return;
//       }

//       chrome.tabs.sendMessage(activeTab.id, { action }, (response) => {
//         if (chrome.runtime.lastError) {
//           reject(chrome.runtime.lastError.message);
//           return;
//         }

//         if (response && response.success) {
//           resolve(response);
//         } else {
//           reject(response.error || 'Unknown error');
//         }
//       });
//     });
//   });
// };

// // Update the Start Recording button event listener
// startButton.addEventListener('click', async () => {
//   status.textContent = 'Requesting microphone access...';
//   try {
//     const response = await sendMessageToContent('requestMic');
//     status.textContent = 'Microphone access granted.';
//   } catch (error) {
//     console.error('Error:', error);
//     status.textContent = `Error: ${error}`;
//   }
// });


// startButton.addEventListener('click', async () => {
//   status.textContent = 'Requesting microphone access...';
//   try {
//     await sendMessageToContent('requestMic');
//     status.textContent = 'Starting recording...';
//     await sendMessageToContent('startRecording');
//     status.textContent = 'Recording...';
//     startButton.disabled = true;
//     stopButton.disabled = false;
//   } catch (error) {
//     console.error('Error:', error);
//     status.textContent = `Error: ${error}`;
//     startButton.disabled = false;
//     stopButton.disabled = true;
//   }
// });

// stopButton.addEventListener('click', async () => {
//   status.textContent = 'Stopping recording...';
//   try {
//     await sendMessageToContent('stopRecording');
//     status.textContent = 'Recording stopped.';
//     startButton.disabled = false;
//     stopButton.disabled = true;
//   } catch (error) {
//     console.error('Error:', error);
//     status.textContent = `Error: ${error}`;
//     startButton.disabled = false;
//     stopButton.disabled = true;
//   }
// });

// });


