(function () {
  function extractYoutubeCaptions() {
    let captionsText = "";
    let futureCaptionsText = "";
    const videoElement = document.querySelector("video");

    if (!videoElement) {
      console.error("Video element not found");
      return;
    }

    const captionElements = document.querySelectorAll(".ytp-caption-segment");

    if (captionElements.length > 0) {
      captionsText = Array.from(captionElements)
        .filter((el) => {
          const parentRect = el.parentElement.getBoundingClientRect();
          return parentRect.width > 0 && parentRect.height > 0;
        })
        .map((el) => el.textContent.trim())
        .join("\n\n");

      const allCaptionText = Array.from(captionElements).map((el) =>
        el.textContent.trim()
      );

      const currentIndex = allCaptionText.findIndex(
        (text) => text.length > 0 && captionsText.includes(text)
      );

      if (currentIndex !== -1) {
        futureCaptionsText = allCaptionText
          .slice(currentIndex + 1, currentIndex + 3)
          .filter((text) => text.length > 0)
          .join("\n\n");
      }
    }

    window.postMessage(
      {
        type: "YOUTUBE_CAPTIONS",
        captions: captionsText || "No captions found",
        futureCaptions: futureCaptionsText || "No future captions found",
      },
      "*"
    );
  }

  extractYoutubeCaptions();

  const observer = new MutationObserver(extractYoutubeCaptions);
  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
})();
