

let starting = null;
let ending = null;
(function initAudioRecorder() {
  // Encapsulate variables to prevent global scope pollution
  let mediaRecorder = null;
  let audioChunks = [];
  let audioStream = null;
  let isRecording = false; // Track recording state
  


  // Function to create the recorder UI
  function createRecorderUI(apiKeyAvailable) {
    // Create the recorder UI container

    
    
    const recorderContainer = document.createElement('div');
    recorderContainer.id = 'todoist-mic-recorder';
    
    
    // const redContainer = document.createElement('div');
    // redContainer.style.backgroundColor = 'red';
    // redContainer.style.width = '100px'; // Set a default width
    // redContainer.style.height = '100px'; // Set a default height
    // redContainer.style.margin = '10px'; // Add some margin for spacing
   
    makeContainerDraggable(recorderContainer);
    // makeContainerDraggable(redContainer);

    // Create the recording toggle button
    const recButton = document.createElement('button');
    recButton.id = 'recButton';
    recButton.classList.add('notRec'); // Initial state

      
  
    // Create status display
    const statusDisplay = document.createElement('div');
    statusDisplay.id = 'status';
    statusDisplay.textContent = 'Idle!';


    // Append elements to the container
    recorderContainer.appendChild(recButton);
    recorderContainer.appendChild(statusDisplay);


    // Append the container to the body
    document.body.appendChild(recorderContainer);
    //  document.body.appendChild(redContainer);
    if (!apiKeyAvailable) {
      recButton.style.display = 'none'; // Hide the recording button if API key is not available
      statusDisplay.textContent = 'API key not available. Recording disabled.';
  }
    // Create notification container
    // Create notification container
    const notificationContainer = document.createElement('div');
    notificationContainer.id = 'notification-container';
    notificationContainer.style.position = 'absolute'; // adjust as needed
    notificationContainer.style.top = '0';
    notificationContainer.style.right = '0';
    notificationContainer.style.width = '300px';
    // You can set z-index, padding, etc., if desired

    notificationContainer.style.display = 'flex';
    // notificationContainer.style.flexDirection = 'column-reverse';  // CHANGED HERE
    notificationContainer.style.flexDirection = 'column';            // CHANGED HERE

    // Append it to the recorderContainer (or document.body)
    recorderContainer.appendChild(notificationContainer);
    document.body.appendChild(recorderContainer);

    // Return references to the UI elements
    return {
      recButton,
      statusDisplay,
      notificationContainer 
      
    };
  }

  // Function to update UI state
  function updateUI(isRecording, uiElements) {
    const { recButton, statusDisplay, transcriptBox, submitButton } = uiElements;
    if (isRecording) {
      statusDisplay.textContent = 'Rec..';
      recButton.classList.remove('notRec');
      recButton.classList.add('Rec');
      
    } else {
      // statusDisplay.textContent = 'Idle';
      recButton.classList.remove('Rec');
      recButton.classList.add('notRec');
     
    }
  }

  
  // Function to start recording
  async function startRecording(uiElements) {
    const { statusDisplay } = uiElements;
    try {
      statusDisplay.textContent = 'Accessing\n mic...';
      audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder = new MediaRecorder(audioStream);
      audioChunks = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      mediaRecorder.onstart = () => {
        isRecording = true;
        updateUI(isRecording, uiElements);
        document.getElementById('todoist-mic-recorder').classList.add('forced-open');
      };

      mediaRecorder.onstop = async () => {
        starting = new Date();
        
        // console.log('Recording stopped.');
        handleRecordingStop(uiElements);
      };

      mediaRecorder.start();
    } catch (error) {
      console.error('Error accessing microphone:', error);
      statusDisplay.textContent = `Error: ${error.message}`;
    }
  }

  function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const dataUrl = reader.result;
            // Extract Base64 string from Data URL
            const base64 = dataUrl.split(',')[1];
            resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

  // Function to handle recording stop
  async function handleRecordingStop(uiElements) {
    const { statusDisplay } = uiElements;
    const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });

    if (!audioBlob) {
      console.error('audioBlob is null or undefined');
      return;
    }

    // console.log('audioBlob size:', audioBlob.size);
    // console.log("Current time:", new Date().toLocaleTimeString());
    // console.log("Sending the message to test Background script!");
    const base64Audio = await blobToBase64(audioBlob);
    chrome.runtime.sendMessage({ action: 'sendAudio', audioData: base64Audio })
      .then(response => {
        if (response) {

          const extractedActions = extractJson(response.actions);
          // console.log("completed extraction")
          extractedActions.forEach((action, index) => {
            
            const action_object = new Action('create', null, action.content, action.due_string, 'en');
            
            setTimeout(() => {
              action_object.performAction(API_KEY, uiElements);
            }, index * 1600); // Add a delay of 1 second for each subsequent task
            
          });
          
        } else {
          // console.log('No response received from background script.');
          return Promise.reject('No response received');
        }
      })
      .then(() => {
        uiElements.statusDisplay.textContent = "added";
        setTimeout(() => {
          uiElements.statusDisplay.textContent = "Idle!";
        }, 3000); // 3000 milliseconds = 3 seconds

        setTimeout(() => {
          document.getElementById('todoist-mic-recorder').classList.remove('forced-open');
        }, 5000); // 5000 milliseconds = 5 seconds
        
      })
      .catch(error => {
        console.error('Error processing actions:', error);
      });

    audioStream.getTracks().forEach((track) => track.stop());

    isRecording = false;
    updateUI(isRecording, uiElements);
  }

  // Function to stop recording
  function stopRecording(uiElements) {
    const { statusDisplay } = uiElements;
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop();
      statusDisplay.textContent = 'Adding..';
      
    }
  }


function extractJson(response) {
    const jsonStart = response.indexOf("[");
    const jsonEnd = response.lastIndexOf("]");
    return JSON.parse(response.slice(jsonStart, jsonEnd + 1));
}

function extractJsonGroq(response) {
  console.log(response,"this is the response")
  // const jsonStart = response.indexOf("[");
  // const jsonEnd = response.lastIndexOf("]");
  return JSON.parse(response);
}

  function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }
  
  // Function to set up recording functionality
  function setupRecording(uiElements) {
    const { recButton, submitButton } = uiElements;

    // Event listener for the recording button
    recButton.addEventListener('click', () => {
      if (isRecording) {
        stopRecording(uiElements);
      } else {
        startRecording(uiElements);
      }
    });

    
  }



  function getTodoistApiKey() {
    chrome.storage.sync.get(["todoistApiKey"], function(result) {
      API_KEY = result.todoistApiKey;
      apiKeyAvailable = false;
      // console.log("running");
      if (API_KEY) {
        // console.log("API Key found");
        apiKeyAvailable = true;
        const uiElements = createRecorderUI(apiKeyAvailable);
        setupRecording(uiElements); // Setup recording after UI has been initialized based on API key availability
      } else {
        // console.log("API Key not found");
        createRecorderUI(apiKeyAvailable); // API key is not available, disable recording functionality
      }
      // Initialize the recorder UI with the API key availability status
   
    });
  }
  getTodoistApiKey();
})();

// add the fetch instead of the actual library 



function makeContainerDraggable(container) {
  let offsetX = 0;
  let offsetY = 0;
  let isDragging = false;

  // Listen for mousedown on the entire container
  container.addEventListener('mousedown', (e) => {
    // If user clicked the red button, don't drag
    if (e.target.id === 'recButton') {
      return;
    }
    // container.classList.add('dragging');

    isDragging = true;
    offsetX = e.clientX - container.offsetLeft;
    offsetY = e.clientY - container.offsetTop;
    container.style.cursor = 'grabbing';
  });

  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    container.classList.remove('dragging');
    let newLeft = e.clientX - offsetX;
    let newTop = e.clientY - offsetY;

    // Constrain movement inside the viewport
    const maxLeft = window.innerWidth - container.offsetWidth;
    const maxTop = window.innerHeight - container.offsetHeight;

    newLeft = Math.min(Math.max(0, newLeft), maxLeft);
    newTop = Math.min(Math.max(0, newTop), maxTop);

    container.style.left = newLeft + 'px';
    container.style.top = newTop + 'px';
  });

  document.addEventListener('mouseup', () => {
    if (isDragging) {
        container.classList.remove('dragging'); // Ensure this line is added
        isDragging = false;
        container.style.cursor = 'grab';
    }
});
}
class Action {
  constructor(action_type, task_id = null, content = null, due_string = null, due_lang = null, original_content = null, original_due_string = null) {
    this.action_type = action_type;
    this.task_id = task_id;
    this.content = content;
    this.due_string = due_string;
    this.due_lang = due_lang;
    this.original_content = original_content;
    this.original_due_string = original_due_string;
  }

  performAction(apiKey, uiElements) {
    const url = 'https://api.todoist.com/rest/v2/tasks';
    const payload = {
      content: this.content,
      due_string: this.due_string || "today",
      due_lang: this.due_lang
    };

    fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
       // Store the newly-created Task ID for potential revert
      this.task_id = data.id; 
      this.showSuccessNotification(`${payload.content}`, uiElements, apiKey, this.due_string);
    })
    .catch(error => {
      console.error('Error:', error.message);
    });
  }
  showSuccessNotification(message, uiElements, apiKey, dueString) {
    const { notificationContainer } = uiElements;
  
    // Create the outer notification div
    const notification = document.createElement('div');
    notification.className = 'notification';
  
    // 1. Create a container for the icon + text + time
    const notificationContent = document.createElement('div');
    notificationContent.className = 'notification-content';
  
    // 1a. Notification icon
    const iconContainer = document.createElement('div');
    iconContainer.className = 'notification-icon';
    // Insert your Todoist icon here:
    iconContainer.innerHTML = `
      <img width="50" height="50"
           src="https://img.icons8.com/color/50/todoist.png"
           alt="todoist" />
    `;
    notificationContent.appendChild(iconContainer);
  
    // 1b. Main text container
    const textContainer = document.createElement('div');
    textContainer.className = 'notification-text';
    textContainer.textContent = message.replace(/silence/gi, ''); // e.g. "Task X created!"
    notificationContent.appendChild(textContainer);
  
    // 1c. Due/time container (in a different color, if you like)
    const timeContainer = document.createElement('div');
    timeContainer.className = 'notification-time';
    // Dynamically add the due date
    timeContainer.textContent = `${dueString || 'Today'}`;
    notificationContent.appendChild(timeContainer);
    // Append the content to the main notification
    notification.appendChild(notificationContent);
  
    // 2. Create the progress bar container
    const progressBarContainer = document.createElement('div');
    progressBarContainer.className = 'progress-bar-container';
  
    // 2a. Create the progress bar
    const progressBar = document.createElement('div');
    progressBar.className = 'progress-bar'; // we’ll style this in CSS
    progressBarContainer.appendChild(progressBar);
  
    // Append progress-bar container to notification
    notification.appendChild(progressBarContainer);
  
    // 3. Create the close (X) button
    const closeButton = document.createElement('button');
    closeButton.className = 'close-button';
    closeButton.textContent = 'X';
    closeButton.addEventListener('click', () => {
      this.revertCreation(apiKey, notification);
    });
    notification.appendChild(closeButton);
  
    // 4. Append the entire notification to container
    notificationContainer.appendChild(notification);
  
    // 5. Trigger the progress bar animation to go from 0% to 100%
    setTimeout(() => {
      progressBar.style.width = '100%';
    }, 10);
  
    // 6. After 5s, fade out & remove the notification (if user hasn’t clicked X)
    setTimeout(() => {
      notification.style.opacity = '0';
      setTimeout(() => {
        if (notification.parentNode) {
          notificationContainer.removeChild(notification);
        }
      }, 1000);
    }, 5000);
  }
  
  revertCreation(apiKey, notification, progressBar) {
    if (!this.task_id) {
      console.error('No task_id to revert!');
      return;
    }
  
    const url = `https://api.todoist.com/rest/v2/tasks/${this.task_id}`;
    
    fetch(url, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    })
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      console.log(`Task ${this.task_id} reverted (deleted).`);
  
      // Overwrite the notification text:
      notification.textContent = 'Task Deleted';
      // If you still want to remove the progress bar separately:
      if (progressBar && progressBar.parentNode) {
        progressBar.remove();
      }
  
      // Fade out & remove the notification
      setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => {
          if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
          }
        }, 1000);
      }, 2000);
    })
    .catch(error => {
      console.error('Error reverting task:', error.message);
    });
  }
  

}


// so now what I want to do, is do is once the task is created I want to start a little progress bar that goes to the end of the notification, so this happens for a total of 5 seconds and then the task disapreas
