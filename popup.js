document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const listSelector = document.getElementById('listSelector');
    const deleteListButton = document.getElementById('deleteListButton');
    const newListNameInput = document.getElementById('newListName');
    const addListButton = document.getElementById('addListButton');
    const addCurrentVideoButton = document.getElementById('addCurrentVideoButton');
    const videoOutput = document.getElementById('videoOutput');
    const copyButton = document.getElementById('copyButton');
    const downloadButton = document.getElementById('downloadButton');
    const clearButton = document.getElementById('clearButton');
    const addPositionToggle = document.getElementById('addPositionToggle');
    const toggleLabel = document.getElementById('toggleLabel');
    const mainTitle = document.getElementById('mainTitle');
    const modeSwitchIcon = document.getElementById('modeSwitchIcon');
    const menuGoToButton = document.getElementById('menuGoToButton');

    // --- State & Render ---
    let state = {
        videoLists: {},
        activeVideoList: '',
        channelLists: {},
        activeChannelList: '',
        mode: 'video',
        addAtTop: true
    };

    const getLists = () => state.mode === 'video' ? state.videoLists : state.channelLists;
    const getActiveListName = () => state.mode === 'video' ? state.activeVideoList : state.activeChannelList;

    const render = () => {
        const lists = getLists();
        const activeList = getActiveListName();
        const listNames = Object.keys(lists);
        const currentItems = lists[activeList] || [];

        // 1. Update Mode-specific UI
        mainTitle.textContent = state.mode === 'video' ? 'My Video Lists' : 'My Channel Lists';
        addCurrentVideoButton.textContent = state.mode === 'video' ? 'Add Current Video to Selected List' : 'Add Current Channel to Selected List';
        menuGoToButton.querySelector('span').textContent = state.mode === 'video' ? 'Go to Video' : 'Go to Channel';

        // 2. Populate Dropdown
        listSelector.innerHTML = '';
        listNames.forEach(name => {
            const option = document.createElement('option');
            option.value = name;
            option.textContent = name;
            listSelector.appendChild(option);
        });
        listSelector.value = activeList;

        // 3. Display Items
        if (currentItems.length > 0) {
            videoOutput.value = currentItems.map(item => `${item.title}\n${item.url}`).join('\n\n');
        } else {
            videoOutput.value = '';
        }

        // 4. Update Button States
        const isListEmpty = currentItems.length === 0;
        copyButton.disabled = isListEmpty;
        downloadButton.disabled = isListEmpty;
        clearButton.disabled = isListEmpty;
        deleteListButton.disabled = listNames.length <= 1;
        videoOutput.placeholder = `List "${activeList}" is empty.`;

        // 5. Update Toggle Switch UI
        addPositionToggle.checked = state.addAtTop;
        toggleLabel.textContent = state.addAtTop ? 'Add to Top' : 'Add to Bottom';
    };

    // --- Initialization ---
    // 1. Get initial data from storage
    chrome.storage.local.get({
        lists: { 'A List': [] },
        activeList: 'A List',
        videoLists: null,
        activeVideoList: '',
        channelLists: { 'A Channel List': [] },
        activeChannelList: 'A Channel List',
        mode: 'video',
        addAtTop: true
    }, (data) => {
        // Migration logic for immediate UI consistency
        if (data.videoLists === null) {
            state.videoLists = data.lists;
            state.activeVideoList = data.activeList;
        } else {
            state.videoLists = data.videoLists;
            state.activeVideoList = data.activeVideoList;
        }
        state.channelLists = data.channelLists;
        state.activeChannelList = data.activeChannelList;
        state.mode = data.mode;
        state.addAtTop = data.addAtTop;
        render();
    });

    // 2. Enable 'Add' button if on a YouTube page
    const checkTab = () => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            const currentTab = tabs[0];
            if (currentTab && currentTab.url && currentTab.url.includes("youtube.com")) {
                addCurrentVideoButton.disabled = false;
            } else {
                addCurrentVideoButton.disabled = true;
            }
        });
    };
    checkTab();

    // --- Event Listeners ---
    // Listen for storage changes from other parts of the extension
    chrome.storage.onChanged.addListener((changes, namespace) => {
        if (namespace === 'local') {
            if (changes.videoLists) state.videoLists = changes.videoLists.newValue;
            if (changes.activeVideoList) state.activeVideoList = changes.activeVideoList.newValue;
            if (changes.channelLists) state.channelLists = changes.channelLists.newValue;
            if (changes.activeChannelList) state.activeChannelList = changes.activeChannelList.newValue;
            if (changes.mode) state.mode = changes.mode.newValue;
            if (changes.addAtTop) state.addAtTop = changes.addAtTop.newValue;

            // Legacy support during migration
            if (changes.lists) state.videoLists = changes.lists.newValue;
            if (changes.activeList) state.activeVideoList = changes.activeList.newValue;

            render();
            checkTab(); // Re-check tab in case URL changed
        }
    });

    // Toggle Mode
    const toggleMode = () => {
        const newMode = state.mode === 'video' ? 'channel' : 'video';
        state.mode = newMode;
        chrome.storage.local.set({ mode: newMode });
        render();
    };

    mainTitle.addEventListener('click', toggleMode);
    modeSwitchIcon.addEventListener('click', toggleMode);

    // Toggle add position
    addPositionToggle.addEventListener('change', (e) => {
        const newAddAtTop = e.target.checked;
        state.addAtTop = newAddAtTop;
        chrome.storage.local.set({ addAtTop: newAddAtTop });
        render();
    });

    // Change active list
    listSelector.addEventListener('change', (e) => {
        const newActiveList = e.target.value;
        const key = state.mode === 'video' ? 'activeVideoList' : 'activeChannelList';
        chrome.storage.local.set({ [key]: newActiveList });
    });

    // Add a new list
    addListButton.addEventListener('click', () => {
        const newName = newListNameInput.value.trim();
        const lists = getLists();
        if (newName && !lists[newName]) {
            const newLists = { ...lists, [newName]: [] };
            const listsKey = state.mode === 'video' ? 'videoLists' : 'channelLists';
            const activeKey = state.mode === 'video' ? 'activeVideoList' : 'activeChannelList';
            chrome.storage.local.set({ [listsKey]: newLists, [activeKey]: newName }, () => {
                newListNameInput.value = '';
            });
        }
    });

    // Delete the selected list
    deleteListButton.addEventListener('click', () => {
        const lists = getLists();
        const activeList = getActiveListName();
        if (Object.keys(lists).length <= 1) {
            alert("You cannot delete the last list.");
            return;
        }
        if (confirm(`Are you sure you want to delete the list "${activeList}"?`)) {
            const newLists = { ...lists };
            delete newLists[activeList];
            const newActiveList = Object.keys(newLists)[0];
            const listsKey = state.mode === 'video' ? 'videoLists' : 'channelLists';
            const activeKey = state.mode === 'video' ? 'activeVideoList' : 'activeChannelList';
            chrome.storage.local.set({ [listsKey]: newLists, [activeKey]: newActiveList });
        }
    });

    // Add current record to the active list
    addCurrentVideoButton.addEventListener('click', () => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            const tab = tabs[0];
            if (state.mode === 'video') {
                chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    func: () => {
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
                        if (document.title) return { title: document.title.replace(" - YouTube", "").trim(), url: window.location.href };
                        return null;
                    }
                }, (injectionResults) => {
                    if (!chrome.runtime.lastError && injectionResults && injectionResults[0] && injectionResults[0].result) {
                        chrome.runtime.sendMessage({
                            type: "SAVE_VIDEO",
                            details: injectionResults[0].result,
                            addAtTop: state.addAtTop
                        });
                        // Visual feedback
                        const originalText = addCurrentVideoButton.textContent;
                        addCurrentVideoButton.textContent = 'Added!';
                        setTimeout(() => {
                            addCurrentVideoButton.textContent = originalText;
                        }, 1500);
                    } else {
                        alert("Could not detect video details on this page.");
                    }
                });
            } else {
                chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    func: () => {
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
                }, (results) => {
                    if (!chrome.runtime.lastError && results && results[0] && results[0].result) {
                        chrome.runtime.sendMessage({
                            type: "SAVE_VIDEO",
                            details: results[0].result,
                            addAtTop: state.addAtTop
                        });
                        // Visual feedback
                        const originalText = addCurrentVideoButton.textContent;
                        addCurrentVideoButton.textContent = 'Added!';
                        setTimeout(() => {
                            addCurrentVideoButton.textContent = originalText;
                        }, 1500);
                    } else {
                        alert("Could not detect channel details on this page.");
                    }
                });
            }
        });
    });

    // Copy items from the active list as TSV
    copyButton.addEventListener('click', () => {
        const lists = getLists();
        const activeList = getActiveListName();
        const items = lists[activeList] || [];
        if (items.length === 0) return;

        const tsvContent = items.map(item => `${item.title}\t${item.url}`).join('\n');

        navigator.clipboard.writeText(tsvContent).then(() => {
            // Optional: Provide user feedback
            const originalText = copyButton.textContent;
            copyButton.textContent = 'Copied!';
            setTimeout(() => {
                copyButton.textContent = originalText;
            }, 1500);
        }).catch(err => {
            console.error('Failed to copy text: ', err);
            // Fallback for older browsers by temporarily modifying the textarea
            const originalContent = videoOutput.value;
            videoOutput.value = tsvContent;
            videoOutput.select();
            document.execCommand('copy');
            videoOutput.value = originalContent; // Restore original view
        });
    });

    // Download the active list as a text file
    downloadButton.addEventListener('click', () => {
        const activeList = getActiveListName();
        const items = getLists()[activeList] || [];
        if (items.length === 0) return;

        const content = videoOutput.value;
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);

        // Sanitize filename
        const safeFilename = activeList.replace(/[^a-z0-9- ._]/gi, '_') + '.txt';

        chrome.downloads.download({
            url: url,
            filename: safeFilename,
            saveAs: true // Ask user where to save
        }, () => {
            // After the download API is called, revoke the URL to free up memory.
            URL.revokeObjectURL(url);
        });
    });

    // Clear all items from the active list
    clearButton.addEventListener('click', () => {
        const activeList = getActiveListName();
        const type = state.mode === 'video' ? 'videos' : 'channels';
        if (confirm(`Are you sure you want to clear all ${type} from "${activeList}"?`)) {
            const lists = getLists();
            const newLists = { ...lists, [activeList]: [] };
            const key = state.mode === 'video' ? 'videoLists' : 'channelLists';
            chrome.storage.local.set({ [key]: newLists });
        }
    });

    // --- Context Menu Logic ---
    const contextMenu = document.getElementById('contextMenu');
    const menuEditButton = document.getElementById('menuEditButton');
    const menuCopyButton = document.getElementById('menuCopyButton');
    const menuMoveUpButton = document.getElementById('menuMoveUpButton');
    const menuMoveDownButton = document.getElementById('menuMoveDownButton');
    const menuDeleteButton = document.getElementById('menuDeleteButton');
    let selectedRecordIndex = -1;

    // Show context menu on click
    videoOutput.addEventListener('click', (e) => {
        const text = videoOutput.value;
        if (!text) return;

        const cursorPosition = videoOutput.selectionStart;
        const lineNumber = text.substr(0, cursorPosition).split('\n').length - 1;
        selectedRecordIndex = Math.floor(lineNumber / 3);

        const currentItems = getLists()[getActiveListName()];
        if (selectedRecordIndex < 0 || selectedRecordIndex >= currentItems.length) {
            contextMenu.style.display = 'none';
            return;
        }

        // Highlight the clicked record
        const recordsAsText = text.split('\n\n');
        let startPos = 0;
        for (let i = 0; i < selectedRecordIndex; i++) {
            startPos += recordsAsText[i].length + 2;
        }
        const endPos = startPos + recordsAsText[selectedRecordIndex].length;
        videoOutput.setSelectionRange(startPos, endPos);

        // Position and show the menu
        contextMenu.style.left = `${e.clientX}px`;
        contextMenu.style.top = `${e.clientY}px`;
        contextMenu.style.display = 'block';
    });

    // Hide context menu when clicking elsewhere
    document.addEventListener('click', (e) => {
        // Hide if the click is NOT on the textarea and NOT inside the context menu
        if (e.target !== videoOutput && !contextMenu.contains(e.target)) {
            contextMenu.style.display = 'none';
        }
    });

    // Action: Go to item
    menuGoToButton.addEventListener('click', () => {
        if (selectedRecordIndex !== -1) {
            const item = getLists()[getActiveListName()][selectedRecordIndex];
            if (item && item.url) {
                chrome.tabs.create({ url: item.url });
            }
        }
        contextMenu.style.display = 'none';
    });

    // Action: Edit record
    menuEditButton.addEventListener('click', () => {
        if (selectedRecordIndex !== -1) {
            const listName = getActiveListName();
            const list = getLists()[listName];
            const item = list[selectedRecordIndex];

            const newTitle = prompt("Enter the new title:", item.title);

            if (newTitle !== null && newTitle.trim() !== '') {
                const updatedItem = { ...item, title: newTitle.trim() };
                const updatedList = [
                    ...list.slice(0, selectedRecordIndex),
                    updatedItem,
                    ...list.slice(selectedRecordIndex + 1)
                ];

                const lists = getLists();
                const newLists = { ...lists, [listName]: updatedList };
                const key = state.mode === 'video' ? 'videoLists' : 'channelLists';
                chrome.storage.local.set({ [key]: newLists });
            }
        }
        contextMenu.style.display = 'none';
    });

    // Action: Copy record
    menuCopyButton.addEventListener('click', () => {
        if (selectedRecordIndex !== -1) {
            const item = getLists()[getActiveListName()][selectedRecordIndex];
            if (item) {
                const tsvContent = `${item.title}\t${item.url}`;
                navigator.clipboard.writeText(tsvContent).catch(err => {
                    console.error('Failed to copy text: ', err);
                });
            }
        }
        contextMenu.style.display = 'none';
    });

    // Action: Move record up
    menuMoveUpButton.addEventListener('click', () => {
        if (selectedRecordIndex > 0) {
            const listName = getActiveListName();
            const list = getLists()[listName];
            const updatedItems = [...list];
            [updatedItems[selectedRecordIndex], updatedItems[selectedRecordIndex - 1]] =
                [updatedItems[selectedRecordIndex - 1], updatedItems[selectedRecordIndex]];

            const lists = getLists();
            const newLists = { ...lists, [listName]: updatedItems };
            const key = state.mode === 'video' ? 'videoLists' : 'channelLists';
            chrome.storage.local.set({ [key]: newLists });
            contextMenu.style.display = 'none';
        }
    });

    // Action: Move record down
    menuMoveDownButton.addEventListener('click', () => {
        const listName = getActiveListName();
        const list = getLists()[listName];
        if (selectedRecordIndex !== -1 && selectedRecordIndex < list.length - 1) {
            const updatedItems = [...list];
            [updatedItems[selectedRecordIndex], updatedItems[selectedRecordIndex + 1]] =
                [updatedItems[selectedRecordIndex + 1], updatedItems[selectedRecordIndex]];

            const lists = getLists();
            const newLists = { ...lists, [listName]: updatedItems };
            const key = state.mode === 'video' ? 'videoLists' : 'channelLists';
            chrome.storage.local.set({ [key]: newLists });
            contextMenu.style.display = 'none';
        }
    });

    // Action: Delete record
    menuDeleteButton.addEventListener('click', () => {
        if (selectedRecordIndex !== -1) {
            contextMenu.style.display = 'none';
            const listName = getActiveListName();
            if (confirm('Are you sure you want to delete this record?')) {
                const list = getLists()[listName];
                const updatedItems = [...list];
                updatedItems.splice(selectedRecordIndex, 1);

                const lists = getLists();
                const newLists = { ...lists, [listName]: updatedItems };
                const key = state.mode === 'video' ? 'videoLists' : 'channelLists';
                chrome.storage.local.set({ [key]: newLists });
            }
        }
    });
});