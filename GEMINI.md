# YouTube Rightclick Link Collector

## Project Overview
**YouTube Rightclick** is a Chrome browser extension (Manifest V3) designed for content curators and researchers to effortlessly organize YouTube videos and channels into custom lists. It allows saving URLs directly via a right-click context menu or a popup interface, managing separate categories for videos and channels, and exporting data in spreadsheet-friendly formats.

## Tech Stack & Architecture
*   **Platform:** Web Extension (Chrome)
*   **Manifest Version:** 3.5
*   **Core Technologies:**
    *   **HTML/CSS:** `popup.html` (UI structure and inline styles).
    *   **JavaScript:** Vanilla JS (ES6+).
    *   **Storage:** `chrome.storage.local` (persistent data).
    *   **Scripting:** `chrome.scripting` (DOM scraping for titles/URLs).
*   **Build System:** None (Load unpacked).

## Key Files & Structure

*   `manifest.json`: Entry point. Defines permissions (`contextMenus`, `storage`, `scripting`, `tabs`, `downloads`), host permissions (`*://www.youtube.com/*`), and the background service worker.
*   `background.js`: Service Worker. Handles context menu creation, event listeners for clicks, and script injection for background saving.
*   `popup.html`: The UI for the extension popup.
*   `popup.js`: Core logic for the popup UI. Manages list rendering, mode switching (Videos/Channels), adding/deleting lists, and record-level actions via an internal context menu.
*   `README.md`: User-facing documentation.
*   `images/`: Extension icons and UI assets (`google-sheets.svg`).
*   `LEGAL/`: Contains `PRIVACY.md` and `cws_permissions_justification.txt`.

## Key Features
*   **Context Menu Integration:** Right-click any YouTube video link or thumbnail to "Add video to active list".
*   **Dual Mode Support:** Toggle between **Video Lists** and **Channel Lists** by clicking the popup title.
*   **Intelligent Scraping:** Automatically detects video or channel details depending on the current page (Watch page, Channel page, etc.) using robust multi-strategy selectors.
*   **Visual Feedback:** Injects a non-blocking UI notification into the active tab upon successful saving.
*   **Customizable Sort Order:** Toggle between "Add to Top" and "Add to Bottom" for new entries.
*   **Advanced Popup Management:**
    *   Manage multiple named lists.
    *   In-list context menu: Go to URL, Edit title, Copy TSV, Move Up/Down, and Delete.
    *   Bulk actions: Copy all as TSV, Download as `.txt`, or Clear list.
*   **Privacy-First:** All data remains local; no external tracking or data transmission.

## Installation & Usage (Developers)
1.  Navigate to `chrome://extensions/`.
2.  Enable "Developer mode".
3.  Click "Load unpacked" and select the project root directory.

## Development Conventions
*   **State Management:** State is synchronized with `chrome.storage.local`. `popup.js` uses a `render()` function to update the UI based on the current state.
*   **Permissions:** Minimal permissions used (`scripting` for metadata extraction, `downloads` for exporting).
*   **Data Migration:** `background.js` and `popup.js` include logic to handle legacy data structures from older versions.