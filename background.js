// --- Helper Functions ---

function isChannelUrl(url) {
  try {
    const u = new URL(url);
    if (!u.hostname.includes('youtube.com')) return false;
    return u.pathname.startsWith('/@') ||
           u.pathname.startsWith('/channel/') ||
           u.pathname.startsWith('/c/') ||
           u.pathname.startsWith('/user/');
  } catch(e) { return false; }
}

function normalizeAndSave(details, addAtTop = true) {
  if (!details || !details.url || !details.title) {
    console.error("Invalid or incomplete details received.", details);
    return;
  }

  chrome.storage.local.get({
    mode: 'video',
    videoLists: { 'A List': [] },
    activeVideoList: 'A List',
    channelLists: { 'A Channel List': [] },
    activeChannelList: 'A Channel List'
  }, (data) => {
    const { mode } = data;
    let lists, activeList, storageKey;

    if (mode === 'video') {
      lists = data.videoLists;
      activeList = data.activeVideoList;
      storageKey = 'videoLists';

      // Video specific normalization
      try {
        const urlObject = new URL(details.url);
        const videoId = urlObject.searchParams.get('v');
        if (videoId) {
          details.url = `https://www.youtube.com/watch?v=${videoId}`;
        }
      } catch (e) { /* ignore */ }
    } else {
      lists = data.channelLists;
      activeList = data.activeChannelList;
      storageKey = 'channelLists';
    }

    if (!lists[activeList]) {
      lists[activeList] = [];
    }

    const finalDetails = { title: details.title.trim(), url: details.url };

    if (!lists[activeList].some(item => item.url === finalDetails.url)) {
      if (addAtTop) {
        lists[activeList].unshift(finalDetails);
      } else {
        lists[activeList].push(finalDetails);
      }

      chrome.storage.local.set({ [storageKey]: lists }, () => {
        console.log(`Added to "${activeList}" (Mode: ${mode}):`, finalDetails.title);
      });
    } else {
      console.log(`${mode === 'video' ? 'Video' : 'Channel'} already in list:`, finalDetails.title);
    }
  });
}

// --- Injected Scripts ---

function getVideoDetailsFromWatchPage() {
  const titleElement = document.querySelector('h1.ytd-watch-metadata #title, h1.title.ytd-video-primary-info-renderer');
  if (titleElement) { return { title: titleElement.innerText, url: window.location.href }; }
  return null;
}

function getChannelDetailsFromPage() {
  // If on a watch page, get the channel of the video
  const channelLink = document.querySelector('ytd-video-owner-renderer #channel-name a, #owner #channel-name a');
  if (channelLink) {
    return { title: channelLink.innerText, url: channelLink.href };
  }
  // If on a channel page
  const channelNameElement = document.querySelector('#channel-header-container #text, ytd-channel-name#channel-name');
  if (channelNameElement) {
    return { title: channelNameElement.innerText, url: window.location.href };
  }
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

function getTitleForChannelUrl(url) {
    const allLinks = document.querySelectorAll(`a[href*="${url}"]`);
    for (const link of allLinks) {
        if (link.innerText && link.innerText.trim() !== "") {
            return link.innerText.trim();
        }
    }
    return null;
}


// --- Event Listeners ---

chrome.runtime.onInstalled.addListener(() => {
  // 1. Create Context Menu
  chrome.storage.local.get({ mode: 'video' }, (data) => {
    chrome.contextMenus.create({
      id: "addToList",
      title: data.mode === 'video' ? "Add video to active list" : "Add channel to active list",
      contexts: ["page", "link", "image", "video"],
      documentUrlPatterns: ["*://www.youtube.com/*"]
    });
  });

  // 2. Data Migration and Structure Setup
  chrome.storage.local.get(['videoList', 'lists', 'activeList', 'videoLists', 'mode'], (data) => {
    let updates = {};

    // Migration from very old 'videoList'
    if (data.videoList) {
      console.log("Old videoList found, migrating.");
      const oldList = data.videoList;
      let lists = data.lists || { 'Imported List': [] };
      lists['Imported List'] = [...(lists['Imported List'] || []), ...oldList];
      updates.lists = lists;
      updates.activeList = 'Imported List';
      chrome.storage.local.remove('videoList');
    }

    // Migration from 'lists' to 'videoLists' (Multi-mode structure)
    if ((data.lists || updates.lists) && !data.videoLists) {
      console.log("Migrating 'lists' to 'videoLists'.");
      updates.videoLists = updates.lists || data.lists;
      updates.activeVideoList = updates.activeList || data.activeList || 'A List';
      updates.channelLists = { 'A Channel List': [] };
      updates.activeChannelList = 'A Channel List';
      updates.mode = data.mode || 'video';

      // We'll keep 'lists' and 'activeList' for now to avoid breaking older popups
      // until they are also updated, but eventually we should remove them.
    }

    // First time install
    if (!data.lists && !data.videoLists && !data.videoList) {
      console.log("First time installation. Setting up defaults.");
      updates.videoLists = { 'A List': [] };
      updates.activeVideoList = 'A List';
      updates.channelLists = { 'A Channel List': [] };
      updates.activeChannelList = 'A Channel List';
      updates.mode = 'video';
    }

    if (Object.keys(updates).length > 0) {
      chrome.storage.local.set(updates);
    }
  });
});

chrome.storage.onChanged.addListener((changes) => {
  if (changes.mode) {
    chrome.contextMenus.update("addToList", {
      title: changes.mode.newValue === 'video' ? "Add video to active list" : "Add channel to active list"
    });
  }
});


chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId !== "addToList") return;

    chrome.storage.local.get({ mode: 'video', addAtTop: true }, (data) => {
        const { mode, addAtTop } = data;

        if (mode === 'video') {
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
                } catch (e) { /* Ignore */ }
            }

            if (videoId) {
                const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
                chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    func: getTitleForVideoId,
                    args: [videoId]
                }, (injectionResults) => {
                    if (!chrome.runtime.lastError && injectionResults && injectionResults[0] && injectionResults[0].result) {
                        normalizeAndSave({ title: injectionResults[0].result, url: videoUrl }, addAtTop);
                    } else {
                        normalizeAndSave({ title: `Video (ID: ${videoId})`, url: videoUrl }, addAtTop);
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
                        normalizeAndSave(watchPageResults[0].result, addAtTop);
                    }
                });
            }
        } else {
            // Channel Mode
            let channelUrl = null;
            if (info.linkUrl && isChannelUrl(info.linkUrl)) {
                channelUrl = info.linkUrl;
            }

            if (channelUrl) {
                chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    func: getTitleForChannelUrl,
                    args: [channelUrl]
                }, (results) => {
                    if (!chrome.runtime.lastError && results && results[0] && results[0].result) {
                        normalizeAndSave({ title: results[0].result, url: channelUrl }, addAtTop);
                    } else {
                        normalizeAndSave({ title: "Channel", url: channelUrl }, addAtTop);
                    }
                });
            } else {
                chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    func: getChannelDetailsFromPage
                }, (results) => {
                    if (!chrome.runtime.lastError && results && results[0] && results[0].result) {
                        normalizeAndSave(results[0].result, addAtTop);
                    }
                });
            }
        }
    });
});

chrome.runtime.onMessage.addListener((message) => {
    if (message.type === "SAVE_VIDEO" && message.details) {
        normalizeAndSave(message.details, message.addAtTop);
    }
});