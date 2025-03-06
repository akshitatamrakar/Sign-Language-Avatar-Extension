const API_ENDPOINT = 'http://localhost:5000/getSignJson/';

let previousSentence = '';
let currentSentence = '';

const dbPromise = indexedDB.open('SignDataDB', 1);

let db;
dbPromise.onupgradeneeded = (event) => {
    db = event.target.result;
    if (!db.objectStoreNames.contains('signData')) {
        db.createObjectStore('signData', { keyPath: 'word' });
    }
};

dbPromise.onsuccess = (event) => {
    db = event.target.result;
    console.log('IndexedDB initialized successfully');
};

dbPromise.onerror = (event) => {
    console.error('IndexedDB initialization error:', event.target.error);
};

async function fetchAndStoreSignJson(sentence) {
    if (!sentence || typeof sentence !== 'string') {
        console.log('No valid sentence provided');
        return;
    }

    try {
        const response = await fetch(`${API_ENDPOINT}${encodeURIComponent(sentence)}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(['signData'], 'readwrite');
            const store = transaction.objectStore('signData');
            
            let storedCount = 0;
            const totalWords = Object.keys(data.json_data).length;

            Object.entries(data.json_data).forEach(([word, jsonData]) => {
                const request = store.put({ word: `sign_data_${word}`, data: jsonData });
                
                request.onsuccess = () => {
                    storedCount++;
                    if (storedCount === totalWords) {
                        console.log(`Stored ${totalWords} JSON items in IndexedDB`);
                        resolve(true);
                    }
                };
                
                request.onerror = () => {
                    console.error('Error storing data for word:', word);
                    reject(request.error);
                };
            });

            transaction.onerror = () => {
                console.error('Transaction error:', transaction.error);
                reject(transaction.error);
            };
        });

    } catch (error) {
        console.error('Error fetching or storing sign JSON:', error);
        throw error;
    }
}

async function getStoredSignData(word) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['signData'], 'readonly');
        const store = transaction.objectStore('signData');
        const request = store.get(`sign_data_${word}`);

        request.onsuccess = () => {
            resolve(request.result ? request.result.data : null);
        };

        request.onerror = () => {
            console.error('Error retrieving sign data:', request.error);
            reject(request.error);
        };
    });
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "setCaptions") {
        chrome.storage.local.set(
            {
                youtubeCaptions: request.captions,
                youtubeFutureCaptions: request.futureCaptions,
            },
            async () => {
                if (chrome.runtime.lastError) {
                    console.error('Error setting captions:', chrome.runtime.lastError);
                    sendResponse({ 
                        status: "error", 
                        error: chrome.runtime.lastError.message 
                    });
                    return;
                }

                previousSentence = currentSentence;
                currentSentence = request.futureCaptions;

                if (currentSentence && currentSentence !== previousSentence) {
                    try {
                        await fetchAndStoreSignJson(currentSentence);
                        sendResponse({ 
                            status: "success", 
                            request 
                        });
                    } catch (error) {
                        sendResponse({ 
                            status: "error", 
                            error: error.message 
                        });
                    }
                } else {
                    sendResponse({ 
                        status: "success", 
                        request 
                    });
                }
            }
        );
        return true;
    }
});

async function clearSignData() {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['signData'], 'readwrite');
        const store = transaction.objectStore('signData');
        const request = store.clear();

        request.onsuccess = () => {
            console.log('Sign data cleared from IndexedDB');
            resolve(true);
        };

        request.onerror = () => {
            console.error('Error clearing sign data:', request.error);
            reject(request.error);
        };
    });
}

console.log('Background script loaded');