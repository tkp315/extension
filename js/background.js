// This file handles background processes for the extension

// Listen for storage changes in the extension
chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'sync') {
        // Example: Check if preferredLanguage is updated
        if (changes.preferredLanguage) {
            console.log("Preferred Language changed:", changes.preferredLanguage.newValue);
        }
    }
});

// Listen for messages from content scripts or popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    // Handle different types of messages
    if (request.action === "getPreferredLanguage") {
        chrome.storage.sync.get("preferredLanguage", (data) => {
            sendResponse({ preferredLanguage: data.preferredLanguage });
        });
        return true; // Keeps the message channel open for async response
    }
    return false; // No async response for other message types
});

// Initialize default values when the extension is installed or updated
chrome.runtime.onInstalled.addListener(() => {
    // Set a default preferred language if none exists
    chrome.storage.sync.get("preferredLanguage", (data) => {
        if (!data.preferredLanguage) {
            chrome.storage.sync.set({ preferredLanguage: "en" }, () => {
                console.log("Default preferred language set to English.");
            });
        }
    });
});

// Execute content.js when the user clicks on the extension icon
chrome.action.onClicked.addListener((tab) => {
    // Check if the current tab is WhatsApp Web
    if (tab.url.includes("web.whatsapp.com")) {
        chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ['./js/content.js']  // Ensure this path is correct relative to your extension's root directory
        }, () => {
            if (chrome.runtime.lastError) {
                console.error("Script injection failed: " + chrome.runtime.lastError.message);
            } else {
                console.log("Content script injected into WhatsApp Web.");
            }
        });
    } else {
        console.log("Extension clicked on a non-WhatsApp tab.");
    }
});

