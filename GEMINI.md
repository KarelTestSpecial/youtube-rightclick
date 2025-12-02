# YouTube Rightclick Link Collector

## Project Overview
**YouTube Rightclick** is a Chrome browser extension (Manifest V3) designed to help users curate YouTube videos into custom lists. It allows saving video URLs directly from the context menu or a popup interface, managing multiple lists, and exporting them to the clipboard or a file.

## Tech Stack & Architecture
*   **Platform:** Web Extension (Chrome)
*   **Manifest Version:** 3
*   **Core Technologies:**
    *   **HTML/CSS:** `popup.html` (contains inline CSS).
    *   **JavaScript:** Vanilla JS (ES6+).
    *   **Storage:** `chrome.storage.local`.
*   **Build System:** None (Load unpacked).

## Key Files & Structure

*   `manifest.json`: The extension's entry point. Defines permissions (`contextMenus`, `storage`, `scripting`, `tabs`, `downloads`), background service worker, and popup.
*   `background.js`: The Service Worker. Handles:
    *   Context menu creation (`chrome.contextMenus`).
    *   Event listeners for context menu clicks.
    *   Script injection (`chrome.scripting`) to scrape video titles from the YouTube DOM.
    *   Data normalization and saving to `chrome.storage.local`.
    *   Data migration from older versions.
*   `popup.html`: The UI for the extension popup. Contains the structure and inline styles for managing lists.
*   `popup.js`: (Implied) Logic for the popup UI (list rendering, adding/deleting lists, exporting). *Note: Explicitly referenced in `popup.html`.*
*   `images/`: Contains extension icons (`icon16.png`, `icon48.png`, `icon128.png`) and assets (`google-sheets.svg`).

## Installation & Usage

### For Developers
1.  **Navigate:** Go to `chrome://extensions/` in your Chromium-based browser.
2.  **Enable:** Toggle "Developer mode" in the top right.
3.  **Load:** Click "Load unpacked" and select the **root directory** of this project (`/home/kareltestspecial/a/rightclick/youtube-rightclick`).

### Key Features
*   **Context Menu:** Right-click any video on YouTube -> "Add video to active list".
*   **Popup:**
    *   Manage multiple lists (Create/Delete/Switch).
    *   "Add Current Video" button (active when on a YouTube watch page).
    *   Export lists (Copy to Clipboard / Download `.txt`).
    *   Deep link to Google Sheets.

## Development Conventions
*   **Formatting:** Standard JavaScript formatting.
*   **Styling:** CSS is currently located in the `<style>` block within `popup.html`.
*   **Data Persistence:** All user data is stored in `chrome.storage.local` under the `lists` and `activeList` keys.
*   **Privacy:** No external data transmission. All logic is client-side.

## Permissions Justification
*   `downloads`: Used for the "Download List" feature (exporting `.txt` files).
*   `scripting`: Used to inject code into YouTube pages to extract video titles when right-clicking links/thumbnails.
*   `contextMenus`: Adds the "Add to list" option to the browser context menu.
