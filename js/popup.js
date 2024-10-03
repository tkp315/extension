document.addEventListener('DOMContentLoaded', () => {
    const languageSelect = document.getElementById('language-select');
    const friendLanguageSelect = document.getElementById('friend-language-select');
    const saveButton = document.getElementById('save-button');

    let language = 'en'; // Default value
    let friendLanguage = 'en'; // Default value
    let allLanguages = [];

    // Fetch available languages from the LibreTranslate API
    async function getLanguages() {
        try {
            const res = await fetch('https://libretranslate.com/languages', {
                headers: {
                    "Content-Type": "application/json",
                },
                cors: {
                    origin: '*'
                }
            });
            allLanguages = await res.json();
            populateLanguages();
        } catch (error) {
            console.error('Error fetching languages:', error);
        }
    }

    // Populate the dropdowns with available languages
    function populateLanguages() {
        allLanguages.forEach(language => {
            const option = document.createElement('option');
            option.value = language.code;
            option.textContent = language.name;
            languageSelect.appendChild(option);
            
            const friendOption = document.createElement('option');
            friendOption.value = language.code;
            friendOption.textContent = language.name;
            friendLanguageSelect.appendChild(friendOption);
        });
    }

    // Event listener for user's language selection
    languageSelect.addEventListener('change', (e) => {
        language = e.target.value;
    });

    // Event listener for friend's language selection
    friendLanguageSelect.addEventListener('change', (e) => {
        friendLanguage = e.target.value;
    });

    // Save button event listener to store the selected languages in Chrome storage
    saveButton.addEventListener('click', () => {
        chrome.storage.sync.set({
            userLanguage: language,
            friendLanguage: friendLanguage
        }, () => {
            console.log(`Languages saved! You: ${language}, Friend: ${friendLanguage}`);
        });
    });

    // Initialize the language list on popup load
    getLanguages();

    // Load and set previously saved languages
    chrome.storage.sync.get(['userLanguage', 'friendLanguage'], (result) => {
        if (result.userLanguage) {
            language = result.userLanguage;
            languageSelect.value = language;
        }
        if (result.friendLanguage) {
            friendLanguage = result.friendLanguage;
            friendLanguageSelect.value = friendLanguage;
        }
    });
});

console.log(chrome.storage.sync.get())