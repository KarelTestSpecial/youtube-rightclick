// --- Helper Functions ---

function isChannelUrl(url) {
  try {
    const u = new URL(url);
    if (!u.hostname.includes('youtube.com')) return false;
    return u.pathname.startsWith('/@') ||
      u.pathname.startsWith('/channel/') ||
      u.pathname.startsWith('/c/') ||
      u.pathname.startsWith('/user/');
  } catch (e) { return false; }
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

        // VISUAL FEEDBACK: Inject a non-blocking notification into the active tab.
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (tabs && tabs[0]) {
            chrome.scripting.executeScript({
              target: { tabId: tabs[0].id },
              func: (msg) => {
                const div = document.createElement('div');
                div.textContent = msg;
                div.style.cssText = 'position:fixed;top:20px;right:20px;background-color:#61dafb;color:#2a2a2e;padding:12px 20px;border-radius:8px;z-index:999999;box-shadow:0 4px 12px rgba(0,0,0,0.3);font-weight:bold;font-family:sans-serif;transition:opacity 0.5s ease-in-out;';
                document.body.appendChild(div);
                setTimeout(() => {
                  div.style.opacity = '0';
                  setTimeout(() => div.remove(), 500);
                }, 2500);
              },
              args: [`Added to "${activeList}":\n${finalDetails.title}`]
            });
          }
        });
      });
    } else {
      console.log(`${mode === 'video' ? 'Video' : 'Channel'} already in list:`, finalDetails.title);
    }
  });
}

// --- Injected Scripts ---

function getVideoDetailsFromWatchPage() {
  const isVisible = (el) => !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length);
  
  const selectors = [
    'h1.ytd-watch-metadata #title',
    'h1.title.ytd-video-primary-info-renderer',
    'ytd-watch-metadata h1'
  ];

  for (const selector of selectors) {
    const el = document.querySelector(selector);
    if (el && isVisible(el) && el.innerText.trim()) {
      return { title: el.innerText.trim(), url: window.location.href };
    }
  }

  // Fallback: document.title
  if (document.title) {
    return { title: document.title.replace(" - YouTube", "").trim(), url: window.location.href };
  }

  return null;
}

function getChannelDetailsFromPage() {
  const isVisible = (el) => !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length);

  // 1. If on a watch page, get the channel of the video
  if (window.location.pathname === '/watch' || window.location.pathname.startsWith('/shorts/')) {
    const selectors = [
      'ytd-watch-metadata #owner a',
      'ytd-video-owner-renderer #channel-name a',
      '#owner #channel-name a',
      '.ytd-video-owner-renderer a'
    ];
    for (const selector of selectors) {
      const el = document.querySelector(selector);
      if (el && isVisible(el) && el.href && el.innerText.trim()) {
        return { title: el.innerText.trim(), url: el.href };
      }
    }
  }

  // 2. If on a channel page
  const channelHeader = document.querySelector('ytd-browse[page-subtype="channels"] #channel-header, ytd-browse #channel-header, #channel-header-container');
  if (channelHeader && isVisible(channelHeader)) {
    const nameEl = channelHeader.querySelector('#text, #channel-name, .dynamic-text-view-model-wiz__h1 span');
    if (nameEl && isVisible(nameEl) && nameEl.innerText.trim()) {
       let url = window.location.href;
       try {
         const u = new URL(url);
         url = u.origin + u.pathname;
       } catch (e) { }
       return { title: nameEl.innerText.trim(), url: url };
    }
  }

  // 3. Fallback to document title if it looks like a channel page
  if (window.location.pathname.startsWith('/@') || window.location.pathname.includes('/channel/') || window.location.pathname.includes('/c/') || window.location.pathname.includes('/user/')) {
    const title = document.title.replace(" - YouTube", "").trim();
    if (title && title !== "YouTube") {
      return { title: title, url: window.location.href.split('?')[0].split('#')[0] };
    }
  }

  return null;
}

// DEFINITIVE, TWO-STEP SEARCH FUNCTION
function getTitleForVideoId(videoId) {
  // Strategy 1: The most robust method via the container.
  const allRenderers = document.querySelectorAll('ytd-rich-item-renderer, ytd-compact-video-renderer, ytd-video-renderer, ytd-grid-video-renderer, ytd-playlist-video-renderer');
  for (const renderer of allRenderers) {
    if (renderer.querySelector(`a[href*="/watch?v=${videoId}"]`)) {
      const titleElement = renderer.querySelector('#video-title');
      if (titleElement && titleElement.innerText && titleElement.innerText.trim() !== "") {
        return titleElement.innerText.trim();
      }
    }
  }

  // Strategy 2: Fallback via aria-label.
  const allLinks = document.querySelectorAll(`a[href*="/watch?v=${videoId}"]`);
  for (const link of allLinks) {
    if (link.ariaLabel) {
      return link.ariaLabel;
    }
  }

  return null;
}

function getChannelDetailsForVideoId(videoId) {
  // 1. Find the link to the video (could be watch or shorts)
  const videoSelector = `a[href*="/watch?v=${videoId}"], a[href*="/shorts/${videoId}"]`;
  const videoLinks = Array.from(document.querySelectorAll(videoSelector));
  
  if (videoLinks.length === 0) return null;

  // Prefer visible links if possible
  const isVisible = (el) => !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length);
  const bestLink = videoLinks.find(isVisible) || videoLinks[0];

  // 2. Traverse up to find a container that likely holds the channel info
  const container = bestLink.closest(
    'ytd-rich-item-renderer, ' +
    'ytd-rich-grid-media, ' +
    'ytd-rich-grid-video-renderer, ' +
    'ytd-compact-video-renderer, ' +
    'ytd-video-renderer, ' +
    'ytd-grid-video-renderer, ' +
    'ytd-playlist-video-renderer, ' +
    'ytd-reel-item-renderer, ' +
    'ytd-shorts-lockup-view-model'
  );

  if (container) {
    // 3. Inside the container, look for channel links
    const channelSelector =
      'ytd-channel-name a, ' +
      '#channel-name a, ' +
      '#byline-container a, ' +
      '#byline-container #text a, ' +
      '.ytd-channel-name a, ' +
      'a[href^="/@"], ' +
      'a[href^="/channel/"], ' +
      'a[href^="/c/"], ' +
      'a[href^="/user/"]';

    const channelLinks = Array.from(container.querySelectorAll(channelSelector));

    for (const link of channelLinks) {
      if (link.href) {
        // Validation logic must be inside the injected function
        const url = link.href;
        const isChannel = url.includes('/@') || url.includes('/channel/') || url.includes('/c/') || url.includes('/user/');
        
        if (isChannel) {
          let title = link.innerText.trim();
          
          // Fallback if link text is empty (e.g. avatar link)
          if (!title) {
             const titleEl = container.querySelector('ytd-channel-name #text, #channel-name #text, #byline-container #text');
             if (titleEl) title = titleEl.innerText.trim();
          }
          
          if (title) {
            return { title: title, url: url };
          }
        }
      }
    }
  }

  return null;
}

function getTitleForChannelUrl(url) {
  let cleanUrl = url;
  try {
    const u = new URL(url);
    cleanUrl = u.pathname;
  } catch (e) { }

  const allLinks = document.querySelectorAll(`a[href*="${cleanUrl}"]`);
  for (const link of allLinks) {
    if (link.innerText && link.innerText.trim() !== "") {
      return link.innerText.trim();
    }
    const container = link.closest('ytd-channel-name, #channel-name, #byline-container');
    if (container && container.innerText.trim()) {
      return container.innerText.trim();
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

    // Common video ID extraction logic
    let videoId = null;
    if (info.mediaType === 'image' && info.srcUrl && info.srcUrl.includes('ytimg.com/vi/')) {
      const parts = info.srcUrl.split('/');
      if (parts.length > 4) videoId = parts[4];
    }

    // If videoId wasn't found from image (or it wasn't an image), try the link
    if (!videoId && info.linkUrl) {
      try {
        const url = new URL(info.linkUrl);
        if (url.hostname.includes('youtube.com')) {
          if (url.pathname === '/watch') {
            videoId = url.searchParams.get('v');
          } else if (url.pathname.startsWith('/shorts/')) {
            videoId = url.pathname.split('/')[2];
          }
        }
      } catch (e) { /* Ignore */ }
    }

    if (mode === 'video') {
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

      if (tab.url && (tab.url.includes("youtube.com/watch") || tab.url.includes("youtube.com/shorts"))) {
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
      } else if (videoId) {
        // If we have a videoId but we are in channel mode, try to find the channel for that video
        chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: getChannelDetailsForVideoId,
          args: [videoId]
        }, (results) => {
          if (!chrome.runtime.lastError && results && results[0] && results[0].result) {
            normalizeAndSave(results[0].result, addAtTop);
          } else {
             // If we specifically targeted a video but couldn't find its channel, show notification
             chrome.scripting.executeScript({
               target: { tabId: tab.id },
               func: (msg) => {
                 const div = document.createElement('div');
                 div.textContent = msg;
                 div.style.cssText = 'position:fixed;top:20px;right:20px;background-color:#fa2121;color:white;padding:12px 20px;border-radius:8px;z-index:999999;box-shadow:0 4px 12px rgba(0,0,0,0.3);font-weight:bold;font-family:sans-serif;transition:opacity 0.5s ease-in-out;';
                 document.body.appendChild(div);
                 setTimeout(() => {
                   div.style.opacity = '0';
                   setTimeout(() => div.remove(), 500);
                 }, 3000);
               },
               args: ["Could not detect channel for this video thumbnail."]
             });
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