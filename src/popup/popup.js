function updateStatusMessage(message, isError = false) {
    const statusElement = document.getElementById("statusMessage");
    statusElement.textContent = message;
    statusElement.style.color = isError ? "red" : "green";
}

function storeApiKey() {
    const key = document.getElementById("apiKeyInput").value.trim();

    if (!key) {
        updateStatusMessage("Please enter an API key.", true);
        return;
    }

    chrome.storage.sync.set({ todoistApiKey: key }, () => {
        if (chrome.runtime.lastError) {
            updateStatusMessage("Error saving API key.", true);
        } else {
            updateStatusMessage("API key saved successfully Refresh page!");
        }
    });
}

function refreshApiKey() {
    document.getElementById("apiKeyInput").value = "";
    updateStatusMessage("Enter a new API key if needed.");
}

function deleteApiKey() {
    chrome.storage.sync.remove(["todoistApiKey"], () => {
        if (chrome.runtime.lastError) {
            updateStatusMessage("Error deleting API key.", true);
        } else {
            updateStatusMessage("API key deleted successfully.");
            document.getElementById("apiKeyInput").value = ""; // Clear input field
        }
    });
}

function loadExistingApiKey() {
    chrome.storage.sync.get(["todoistApiKey", "hotkey"], (result) => {
        const apiKeyInput = document.getElementById("apiKeyInput");
        if (result.todoistApiKey) {
            apiKeyInput.value = result.todoistApiKey;
            updateStatusMessage("You already have an API key saved.");
        } else {
            updateStatusMessage("No API key found. Please enter one.");
        }

        
        
    });

    
}

function initPopup() {
    document.getElementById("saveKeyBtn").addEventListener("click", storeApiKey);
    document.getElementById("refreshKeyBtn").addEventListener("click", refreshApiKey);
    document.getElementById("deleteKeyBtn").addEventListener("click", deleteApiKey);
    loadExistingApiKey();



}

document.addEventListener("DOMContentLoaded", initPopup);