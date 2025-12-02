// --- Helper Functions ---

function normalizeAndSave(videoDetails) {
  if (!videoDetails || !videoDetails.url || !videoDetails.title) {
    console.error("Invalid or incomplete video details received.", videoDetails);
    return;
  }
  try {
    const urlObject = new URL(videoDetails.url);
    const videoId = urlObject.searchParams.get('v');
    if (!videoId) { return; }
    const cleanUrl = `https://www.youtube.com/watch?v=${videoId}`;
    const finalDetails = { title: videoDetails.title.trim(), url: cleanUrl };

    // Get the current data structure
    chrome.storage.local.get({ lists: {}, activeList: 'A List' }, (data) => {
      let { lists, activeList } = data;

      // Ensure the active list exists
      if (!lists[activeList]) {
        lists[activeList] = [];
      }

      // Add video if it's not already in the list
      if (!lists[activeList].some(video => video.url === finalDetails.url)) {
        lists[activeList].unshift(finalDetails);
        chrome.storage.local.set({ lists }, () => {
          console.log(`Video added to list "${activeList}":`, finalDetails.title);
        });
      } else {
        console.log("Video already in list:", finalDetails.title);
      }
    });
  } catch (e) { console.error("Could not parse URL:", videoDetails.url, e); }
}

// --- Injected Scripts ---

function getVideoDetailsFromWatchPage() {
  const titleElement = document.querySelector('h1.ytd-watch-metadata #title, h1.title.ytd-video-primary-info-renderer');
  if (titleElement) { return { title: titleElement.innerText, url: window.location.href }; }
  return null;
}

// DEFINITIVE, TWO-STEP SEARCH FUNCTION
function getTitleForVideoId(videoId) {
    // Strategy 1: The most robust method via the container.
    const allRenderers = document.querySelectorAll('ytd-rich-item-renderer, ytd-compact-video-renderer, ytd-video-renderer, ytd-grid-video-renderer');
    for (const renderer of allRenderers) {
        if (renderer.querySelector(`a[href*="/watch?v=${videoId}"]`)) {
            const titleElement = renderer.querySelector('#video-title');
            if (titleElement && titleElement.innerText && titleElement.innerText.trim() !== "") {
                return titleElement.innerText;
            }
        }
    }

    // Strategy 2: Fallback via aria-label.
    const allLinks = document.querySelectorAll(`a[href*="/watch?v=${videoId}"]`);
    for (const link of allLinks) {
        if (link.ariaLabel) {
            // aria-label often contains the full title plus extra info, we need to clean this up.
            // Example: "Title of the video from Channel Name some time ago 5 minutes"
            // We try to get the raw data, which is already a huge improvement.
            return link.ariaLabel;
        }
    }

    return null; // No strategy could find a title.
}


// --- Event Listeners ---

chrome.runtime.onInstalled.addListener(() => {
  // 1. Create Context Menu
  chrome.contextMenus.create({
    id: "addToList", // Changed ID for clarity
    title: "Add video to active list",
    contexts: ["page", "link", "image", "video"],
    documentUrlPatterns: ["*://www.youtube.com/*"]
  });

  // 2. Data Migration from old format
  chrome.storage.local.get('videoList', (data) => {
    // If the old `videoList` exists, migrate it.
    if (data && data.videoList) {
      console.log("Old videoList found, migrating to new data structure.");
      const oldList = data.videoList;
      // Check if there's already a new structure
      chrome.storage.local.get({ lists: {}, activeList: '' }, (newData) => {
        let { lists } = newData;
        // To prevent data loss on re-installation/update, we merge.
        // A more robust migration might use a version flag.
        lists['Imported List'] = [...(lists['Imported List'] || []), ...oldList];

        const newStructure = {
          lists: lists,
          activeList: 'Imported List' // Set the imported list as active
        };

        chrome.storage.local.set(newStructure, () => {
          // Remove the old list after successful migration
          chrome.storage.local.remove('videoList', () => {
            console.log("Migration complete. Old videoList removed.");
          });
        });
      });
    } else {
       // If no old list, ensure a default list exists on first install
       chrome.storage.local.get({ lists: null }, (data) => {
        if (data.lists === null) { // Only run if 'lists' has never been set
            console.log("First time installation. Setting up default list.");
            chrome.storage.local.set({
                lists: { 'A List': [] },
                activeList: 'A List'
            });
        }
       });
    }
  });
});


chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId !== "addToList") return;
    let videoId = null;
    if (info.mediaType === 'image' && info.srcUrl && info.srcUrl.includes('ytimg.com/vi/')) {
        const parts = info.srcUrl.split('/');
        if (parts.length > 4) videoId = parts[4];
    } else if (info.linkUrl) {
        try {
            const url = new URL(info.linkUrl);
            if (url.hostname.includes('youtube.com') && url.pathname === '/watch') {
                videoId = url.searchParams.get('v');
            }
        } catch (e) { /* Negeer */ }
    }
    if (videoId) {
        const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
        chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: getTitleForVideoId,
            args: [videoId]
        }, (injectionResults) => {
            if (!chrome.runtime.lastError && injectionResults && injectionResults[0] && injectionResults[0].result) {
                normalizeAndSave({ title: injectionResults[0].result, url: videoUrl });
            } else {
                console.warn(`Could not find title for video ID ${videoId}. Using placeholder.`);
                normalizeAndSave({ title: `Video (ID: ${videoId})`, url: videoUrl });
            }
        });
        return;
    }
    if (tab.url && tab.url.includes("youtube.com/watch")) {
        chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: getVideoDetailsFromWatchPage
        }, (watchPageResults) => {
            if (!chrome.runtime.lastError && watchPageResults && watchPageResults[0] && watchPageResults[0].result) {
                normalizeAndSave(watchPageResults[0].result);
            }
        });
    }
});

chrome.runtime.onMessage.addListener((message) => {
    if (message.type === "SAVE_VIDEO" && message.details) {
        normalizeAndSave(message.details);
    }
});