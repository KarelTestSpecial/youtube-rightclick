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

    // --- State & Render ---
    let state = {
        lists: {},
        activeList: ''
    };

    const render = () => {
        const { lists, activeList } = state;
        const listNames = Object.keys(lists);
        const currentVideos = lists[activeList] || [];

        // 1. Populate Dropdown
        listSelector.innerHTML = '';
        listNames.forEach(name => {
            const option = document.createElement('option');
            option.value = name;
            option.textContent = name;
            listSelector.appendChild(option);
        });
        listSelector.value = activeList;

        // 2. Display Videos
        if (currentVideos.length > 0) {
            videoOutput.value = currentVideos.map(v => `${v.title}\n${v.url}`).join('\n\n');
        } else {
            videoOutput.value = '';
        }

        // 3. Update Button States
        const isListEmpty = currentVideos.length === 0;
        copyButton.disabled = isListEmpty;
        downloadButton.disabled = isListEmpty;
        clearButton.disabled = isListEmpty;
        deleteListButton.disabled = listNames.length <= 1; // Can't delete the last list
        videoOutput.placeholder = `List "${activeList}" is empty.`;
    };

    // --- Initialization ---
    // 1. Get initial data from storage
    chrome.storage.local.get({ lists: { 'A List': [] }, activeList: 'A List' }, (data) => {
        state.lists = data.lists;
        state.activeList = data.activeList;
        render();
    });

    // 2. Enable 'Add' button if on a YouTube watch page
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const currentTab = tabs[0];
        if (currentTab && currentTab.url && currentTab.url.includes("youtube.com/watch")) {
            addCurrentVideoButton.disabled = false;
        }
    });

    // --- Event Listeners ---
    // Listen for storage changes from other parts of the extension (e.g., background script)
    chrome.storage.onChanged.addListener((changes, namespace) => {
        if (namespace === 'local') {
            if (changes.lists) {
                state.lists = changes.lists.newValue;
            }
            if (changes.activeList) {
                state.activeList = changes.activeList.newValue;
            }
            render();
        }
    });

    // Change active list
    listSelector.addEventListener('change', (e) => {
        const newActiveList = e.target.value;
        chrome.storage.local.set({ activeList: newActiveList });
        // The storage.onChanged listener will handle the re-render
    });

    // Add a new list
    addListButton.addEventListener('click', () => {
        const newName = newListNameInput.value.trim();
        if (newName && !state.lists[newName]) {
            const newLists = { ...state.lists, [newName]: [] };
            chrome.storage.local.set({ lists: newLists, activeList: newName }, () => {
                newListNameInput.value = ''; // Clear input on success
            });
        }
    });

    // Delete the selected list
    deleteListButton.addEventListener('click', () => {
        const listToDelete = state.activeList;
        if (Object.keys(state.lists).length <= 1) {
            alert("You cannot delete the last list.");
            return;
        }
        if (confirm(`Are you sure you want to delete the list "${listToDelete}"?`)) {
            const newLists = { ...state.lists };
            delete newLists[listToDelete];
            const newActiveList = Object.keys(newLists)[0]; // Switch to the first available list
            chrome.storage.local.set({ lists: newLists, activeList: newActiveList });
        }
    });

    // Add current video to the active list
    addCurrentVideoButton.addEventListener('click', () => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            chrome.scripting.executeScript({
                target: { tabId: tabs[0].id },
                func: () => {
                    const titleElement = document.querySelector('h1.ytd-watch-metadata #title, h1.title.ytd-video-primary-info-renderer');
                    return titleElement ? { title: titleElement.innerText, url: window.location.href } : null;
                }
            }, (injectionResults) => {
                if (!chrome.runtime.lastError && injectionResults && injectionResults[0] && injectionResults[0].result) {
                    chrome.runtime.sendMessage({ type: "SAVE_VIDEO", details: injectionResults[0].result });
                }
            });
        });
    });

    // Copy videos from the active list as TSV
    copyButton.addEventListener('click', () => {
        const { activeList, lists } = state;
        const videos = lists[activeList] || [];
        if (videos.length === 0) return;

        const tsvContent = videos.map(v => `${v.title}\t${v.url}`).join('\n');

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
        const { activeList, lists } = state;
        const videos = lists[activeList] || [];
        if (videos.length === 0) return;

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

    // Clear all videos from the active list
    clearButton.addEventListener('click', () => {
        if (confirm(`Are you sure you want to clear all videos from "${state.activeList}"?`)) {
            const newLists = { ...state.lists, [state.activeList]: [] };
            chrome.storage.local.set({ lists: newLists });
        }
    });

    // --- Context Menu Logic ---
    const contextMenu = document.getElementById('contextMenu');
    const menuGoToButton = document.getElementById('menuGoToButton');
    const menuCopyButton = document.getElementById('menuCopyButton');
    const menuDeleteButton = document.getElementById('menuDeleteButton');
    let selectedRecordIndex = -1;

    // Show context menu on click
    videoOutput.addEventListener('click', (e) => {
        const text = videoOutput.value;
        if (!text) return;

        const cursorPosition = videoOutput.selectionStart;
        const lineNumber = text.substr(0, cursorPosition).split('\n').length - 1;
        selectedRecordIndex = Math.floor(lineNumber / 3);

        const currentVideos = state.lists[state.activeList];
        if (selectedRecordIndex < 0 || selectedRecordIndex >= currentVideos.length) {
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

    // Action: Go to video
    menuGoToButton.addEventListener('click', () => {
        if (selectedRecordIndex !== -1) {
            const video = state.lists[state.activeList][selectedRecordIndex];
            if (video && video.url) {
                chrome.tabs.create({ url: video.url });
            }
        }
        contextMenu.style.display = 'none';
    });

    // Action: Copy record
    menuCopyButton.addEventListener('click', () => {
        if (selectedRecordIndex !== -1) {
            const video = state.lists[state.activeList][selectedRecordIndex];
            if (video) {
                const tsvContent = `${video.title}\t${video.url}`;
                navigator.clipboard.writeText(tsvContent).then(() => {
                     // Feedback could be added here (e.g. brief text change), but standard copy behavior is usually silent or system-managed.
                }).catch(err => {
                    console.error('Failed to copy text: ', err);
                });
            }
        }
        contextMenu.style.display = 'none';
    });

    // Action: Delete record
    menuDeleteButton.addEventListener('click', () => {
        if (selectedRecordIndex !== -1) {
            // Hide the menu before showing the confirmation dialog to prevent rendering issues.
            contextMenu.style.display = 'none';

            if (confirm('Are you sure you want to delete this record?')) {
                const updatedVideos = [...state.lists[state.activeList]];
                updatedVideos.splice(selectedRecordIndex, 1);
                const newLists = { ...state.lists, [state.activeList]: updatedVideos };
                chrome.storage.local.set({ lists: newLists });
            }
        }
    });
});