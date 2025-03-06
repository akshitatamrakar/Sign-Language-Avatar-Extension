(function () {
  function sendCaptionsToBackground(captions, futureCaptions) {
    chrome.runtime.sendMessage({
      action: "setCaptions",
      captions: captions,
      futureCaptions: futureCaptions,
    });
  }

  function injectCaptionScript() {
    const script = document.createElement("script");
    script.src = chrome.runtime.getURL("captionsExtractor.js");
    script.onload = function () {
      this.remove();
    };
    (document.head || document.documentElement).appendChild(script);
  }

  window.addEventListener("message", (event) => {
    if (event.source === window && event.data.type === "YOUTUBE_CAPTIONS") {
      sendCaptionsToBackground(event.data.captions, event.data.futureCaptions);
    }
  });

  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "refreshCaptions") {
      window.postMessage({ type: "YOUTUBE_CAPTIONS" }, "*");
      sendResponse({ status: "success" });
    }
    return true;
  });

  injectCaptionScript();
})();
