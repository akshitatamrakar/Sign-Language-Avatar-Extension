# Sign-Language-Avatar-Extension

## Overview
Sign-Language-Avatar-Extension is a browser extension that enhances accessibility by converting YouTube captions into sign language animations using an avatar. The extension extracts live captions, fetches future captions, and displays sign language using Three.js.

## Features
- Extracts live captions and 20 seconds of future captions from YouTube videos.
- Uses MediaPipe to generate JSON-based hand pose data.
- Stores JSON data in IndexedDB for efficient retrieval.
- Sends captions to a Flask server for word-wise pose data.
- Renders an avatar using Three.js to perform sign language in real-time.

## Usage
1. Open a YouTube video with captions.
2. The extension will automatically extract captions and animate the avatar.
3. JSON data is stored in IndexedDB for a lag-free experience.

## Technologies Used
- **MediaPipe** – Extracts hand pose key points.
- **Three.js** – Renders the avatar.
- **Flask** – Backend for processing future captions.
- **IndexedDB** – Stores JSON data efficiently.

## Demo Video
Watch the demo video below to see the extension in action:

[![Sign Language Avatar Extension Demo](https://img.youtube.com/vi/TQWyeZsmVPk/0.jpg)](https://youtu.be/TQWyeZsmVPk)

## References
- [Handspeak](https://www.handspeak.com/)
- [Three.js](https://threejs.org/)
- [MediaPipe](https://mediapipe.dev/)
- [YouTube Video](https://youtu.be/TQWyeZsmVPk)
