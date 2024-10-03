console.log("Content script loaded on WhatsApp Web");

// Get user and friend languages from Chrome storage
chrome.storage.sync.get(['userLanguage', 'friendLanguage'], async ({ userLanguage, friendLanguage }) => {
    console.log('userLanguage:', userLanguage);
    console.log('friendLanguage:', friendLanguage);

    if (!userLanguage || !friendLanguage) {
        console.error("Languages not found in Chrome storage");
        return;
    }

    // Observer to monitor new messages
    const chatObserver = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
            if (mutation.addedNodes.length > 0) {
                const newMessage = mutation.addedNodes[0];
                translateMessage(newMessage);
            }
        });
    });

    const targetNode = document.querySelector('#main .copyable-area');
    const config = { childList: true, subtree: true };
    if (targetNode) {
        chatObserver.observe(targetNode, config);
    } else {
        console.error('Target node not found');
    }

    // Function to fetch translations
    async function fetchTranslation(text, userLanguage, targetLanguage) {
        try {
            console.log("Original text:", text);
            console.log("Translating from:", userLanguage, "to:", targetLanguage);

            const response = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${userLanguage}|${targetLanguage}`);
            const data = await response.json();

            if (data?.responseData?.translatedText) {
                return data.responseData.translatedText;
            } else {
                console.error('Translation failed or returned unexpected data:', data);
                return null;
            }
        } catch (error) {
            console.error('Error during translation API call:', error);
            return null;
        }
    }

    // Function to translate new messages
    async function translateMessage(messageNode) {
        const messageText = messageNode.querySelector('.selectable-text')?.innerText;
        if (!messageText) {
            console.error('Message text not found');
            return;
        }

        try {
            const translation = await fetchTranslation(messageText, friendLanguage, userLanguage);
            if (translation) {
                messageNode.querySelector('.selectable-text').innerText = translation;
                console.log('Translated message:', translation);
            }
        } catch (error) {
            console.error('Error translating message:', error);
        }
    }

    // Check for input box presence
    checkForInputBox();

    function checkForInputBox() {
        const checkInputBox = setInterval(() => {
            const inputBox = document.querySelector('div[aria-placeholder="Type a message"]');
            if (inputBox) {
                console.log("Input box found!");
                attachInputListener(inputBox);
                clearInterval(checkInputBox);
            } else {
                console.log("Input box not found, retrying...");
            }
        }, 1000);
    }

    // Attach input listener to the input box
    function attachInputListener(inputBox) {
        let timeout;
        let lastTypedMessage = "";

        inputBox.addEventListener('input', function () {
            const userTypedMessage = inputBox.innerText;
            console.log("User typed:", userTypedMessage);

            clearTimeout(timeout);

            timeout = setTimeout(async () => {
                if (userTypedMessage !== lastTypedMessage) {
                    lastTypedMessage = userTypedMessage;
                    await handleMessageTranslation(userTypedMessage, inputBox);
                }
            }, 500);
        });
    }

    // Create a Translate button
    const btn = document.createElement('button');
    btn.innerText = "Translate";
    btn.style.position = "fixed";
    btn.style.bottom = "20px";
    btn.style.right = "20px";
    btn.style.zIndex = 1;
    btn.style.padding = "10px 20px";
    btn.style.backgroundColor = "#25D366";
    btn.style.color = "#fff";
    btn.style.border = "none";
    btn.style.borderRadius = "5px";
    btn.style.cursor = "pointer";
    btn.style.fontSize = "16px";

    document.body.appendChild(btn);

    btn.addEventListener('click', async () => {
        console.log("Translate button clicked!");

        const { userLanguage, friendLanguage } = await chrome.storage.sync.get(['userLanguage', 'friendLanguage']);

        if (!userLanguage || !friendLanguage) {
            console.error("Languages not set. Please set user and friend languages.");
            return;
        }

        const lastMessageNode = document.querySelector('#main .copyable-area .selectable-text:last-of-type');

        if (lastMessageNode) {
            const messageText = lastMessageNode.innerText;
            console.log("Translating message:", messageText);

            const translatedText = await fetchTranslation(messageText, friendLanguage, userLanguage);
            if (translatedText) {
                console.log("Translated message:", translatedText);
                alert(`Translated: ${translatedText}`);
            } else {
                console.error("Translation failed or returned null.");
            }
        } else {
            console.error("No messages found to translate.");
        }
    });

    // Handle message translation during input
    async function handleMessageTranslation(userTypedMessage, inputBox) {
        await chrome.storage.sync.get('friendLanguage', async ({ friendLanguage }) => {
            console.log("Fetched friendLanguage during input:", friendLanguage);

            if (userTypedMessage && friendLanguage) {
                const translatedText = await fetchTranslation(userTypedMessage, userLanguage, friendLanguage);
                if (translatedText) {
                    // Update the input box with the translated text
                    inputBox.innerText = translatedText;
                    const spanElement = document.querySelector("span.selectable-text[data-lexical-text]");
                    // Select all text in the input box
                    const range = document.createRange();
                    range.selectNodeContents(inputBox);
                    const selection = window.getSelection();
                    selection.removeAllRanges();
                    selection.addRange(range);

                    spanElement.focus();
                    

                    // Replace the selected text with the translated one
                    document.execCommand('insertText', false, translatedText);
                    
                    console.log('Translated typed message:', translatedText);

                    // Dispatch input event to notify WhatsApp of the update
                    const inputEvent = new Event('change', { bubbles: true });
                    inputBox.dispatchEvent(inputEvent);

                    // Optionally trigger keyup event to simulate sending (if needed)
                    const keyupEvent = new KeyboardEvent('keyup', {
                        bubbles: true,
                        cancelable: true,
                        keyCode: 13 // Enter key
                    });
                    inputBox.dispatchEvent(keyupEvent);
                } else {
                    console.error('Translation returned null or failed');
                }
            }
        });
    }
});

// Insert the button next to the PTT button
const pttButtonSpan = document.querySelector('span[data-icon="ptt"]');
if (pttButtonSpan) {
    pttButtonSpan.insertAdjacentElement('afterend', btn);
} else {
    console.error('PTT button span not found');
}
