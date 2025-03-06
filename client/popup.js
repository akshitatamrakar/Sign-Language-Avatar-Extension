const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const wordDisplay = document.getElementById('wordDisplay');

let sentenceData = [];
let currentWordIndex = 0;
let currentFrame = 0;
let animationId = null;
let isPlaying = false;

const dbPromise = indexedDB.open('SignDataDB', 1);
let db;

dbPromise.onsuccess = (event) => {
    db = event.target.result;
    startCaptionListener();
};

dbPromise.onerror = (event) => {
    console.error('IndexedDB error:', event.target.error);
};

async function getStoredSignData(word) {
    return new Promise((resolve) => {
        const transaction = db.transaction(['signData'], 'readonly');
        const store = transaction.objectStore('signData');
        const request = store.get(`sign_data_${word.toLowerCase()}`);

        request.onsuccess = () => {
            resolve(request.result ? request.result.data : null);
        };
        request.onerror = () => resolve(null);
    });
}

async function processSentence(sentence) {
    sentenceData = [];
    currentWordIndex = 0;
    currentFrame = 0;

    const words = sentence.toLowerCase().split(/\s+/).filter(word => word);
    
    for (const word of words) {
        const signData = await getStoredSignData(word);
        if (signData) {
            sentenceData.push({
                word: word,
                data: signData
            });
        }
    }

    if (sentenceData.length > 0 && !isPlaying) {
        isPlaying = true;
        animate();
    }
}

function drawAvatar() {
    if (!sentenceData.length || !sentenceData[currentWordIndex]) return;

    const currentWordData = sentenceData[currentWordIndex];
    const data = currentWordData.data;

    if (!data || !data.points[currentFrame]) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const frame = data.points[currentFrame];

    wordDisplay.textContent = `Current Word: ${currentWordData.word}`;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    // Circular Head
    ctx.beginPath();
    ctx.arc(centerX, centerY - 200, 60, 0, 2 * Math.PI);
    ctx.fillStyle = '#333';
    ctx.fill();
    ctx.strokeStyle = '#000';
    ctx.stroke();

    // Trapezoidal Body
    ctx.beginPath();
    ctx.moveTo(centerX - 100, centerY - 100);
    ctx.lineTo(centerX + 100, centerY - 100);
    ctx.lineTo(centerX + 70, centerY + 150);
    ctx.lineTo(centerX - 70, centerY + 150);
    ctx.closePath();
    ctx.fillStyle = '#444';
    ctx.fill();
    ctx.strokeStyle = '#000';
    ctx.stroke();

    // Hands
    const handColors = ['#00FF00', '#00FF00'];
    frame.hands.forEach((hand, idx) => {
        const handConnections = [
            [0, 1, 2, 3, 4],   // Thumb
            [0, 5, 6, 7, 8],   // Index
            [0, 9, 10, 11, 12], // Middle
            [0, 13, 14, 15, 16],// Ring
            [0, 17, 18, 19, 20] // Pinky
        ];

        ctx.strokeStyle = handColors[idx];
        ctx.lineWidth = 4;

        handConnections.forEach(connection => {
            for (let i = 0; i < connection.length - 1; i++) {
                const start = hand[connection[i]];
                const end = hand[connection[i + 1]];
                const startX = centerX + (start.x - 0.5) * 300;
                const startY = centerY + (start.y - 0.5) * 350;
                const endX = centerX + (end.x - 0.5) * 300;
                const endY = centerY + (end.y - 0.5) * 350;

                ctx.beginPath();
                ctx.moveTo(startX, startY);
                ctx.lineTo(endX, endY);
                ctx.stroke();
            }
        });

        hand.forEach(point => {
            const pointX = centerX + (point.x - 0.5) * 300;
            const pointY = centerY + (point.y - 0.5) * 350;
            ctx.beginPath();
            ctx.arc(pointX, pointY, 3, 0, 2 * Math.PI);
            ctx.fillStyle = handColors[idx];
            ctx.fill();
        });
    });
}

function animate() {
    if (!sentenceData.length) {
        isPlaying = false;
        return;
    }

    drawAvatar();
    currentFrame++;

    const currentWordData = sentenceData[currentWordIndex];
    if (currentFrame >= currentWordData.data.points.length) {
        currentWordIndex++;
        currentFrame = 0;

        if (currentWordIndex >= sentenceData.length) {
            isPlaying = false;
            currentWordIndex = 0;
            drawAvatar();
            return;
        }
    }

    animationId = requestAnimationFrame(animate);
}

function startCaptionListener() {
    chrome.storage.onChanged.addListener((changes, namespace) => {
        if (namespace === 'local' && changes.youtubeFutureCaptions) {
            const newSentence = changes.youtubeFutureCaptions.newValue;
            if (newSentence) {
                processSentence(newSentence);
            }
        }
    });

    // Initial load
    chrome.storage.local.get(['youtubeFutureCaptions'], (result) => {
        if (result.youtubeFutureCaptions) {
            processSentence(result.youtubeFutureCaptions);
        }
    });

    // Trigger content script
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]?.url.includes('youtube.com')) {
            chrome.scripting.executeScript({
                target: { tabId: tabs[0].id },
                files: ['content.js']
            }, () => {
                chrome.tabs.sendMessage(tabs[0].id, { action: 'refreshCaptions' });
            });
        }
    });
}