# YouTube Rightclick

**Effortless Video Curation for YouTube**

A powerful browser extension designed for content curators, researchers, and anyone who needs to quickly collect and organize YouTube videos. Save videos to multiple custom lists without ever interrupting your workflow.

## Key Features

- **One-Click Saving:** Instantly add YouTube videos to your active list using a simple right-click context menu.
- **Save From Anywhere:** Works seamlessly across YouTube—on the homepage, in subscription feeds, search results, and on video watch pages.
- **Multi-List Organization:** Go beyond a single list. Create, name, and switch between multiple lists to organize your videos by topic, project, or any system you choose.
- **Intuitive Popup Interface:** A clean and efficient popup to manage your lists and videos.
    - View all videos in the currently selected list.
    - Create new lists and delete old ones.
    - Manually add the video you're currently watching.
- **Flexible Export Options:**
    - **Copy to Clipboard:** Copies your list in a spreadsheet-friendly TSV (Tab-Separated Values) format (`Title\tURL`).
    - **Download as File:** Save your current video list as a `.txt` file for your records.
- **In-List Actions:** Click any video in the popup to open a context menu to either navigate to the video's URL or remove it from the list.
- **Privacy-Focused:** All your data is stored locally and privately on your computer. Nothing is ever tracked or sent to a server.

## How to Use

1.  **Adding a Video:**
    - **Right-Click:** On any YouTube page, right-click a video link or thumbnail and select "Add video to active list" from the context menu.
    - **Popup Button:** While watching a video, click the extension icon in your browser's toolbar and then click "Add Current Video to Selected List".

2.  **Managing Your Lists:**
    - Click the extension icon to open the popup.
    - **Switch Lists:** Use the dropdown menu to select your active list. Videos you save will be added here.
    - **Create a List:** Type a name in the "Create new list..." input field and click the `+` button.
    - **Delete a List:** Select a list from the dropdown and click "Delete List". You will be asked to confirm.

3.  **Viewing and Exporting:**
    - **View:** Your saved videos for the active list are displayed in the text area.
    - **Copy:** Click "Copy to Clipboard" to copy the entire list.
    - **Download:** Click "Download List" to save the list as a `.txt` file.
    - **Clear:** Click "Clear This List" to permanently delete all videos from the active list.

## Installation

### For Users
This extension can be installed from the Chrome Web Store (link to be added here).

### For Developers
1.  Clone this repository or download the source code.
2.  Open Google Chrome and navigate to `chrome://extensions`.
3.  Enable "Developer mode" using the toggle in the top right corner.
4.  Click the "Load unpacked" button and select the directory containing the extension's files.

## Privacy

This extension respects your privacy. It does not collect any personal data. All data is stored locally on your device. For more details, please see the [Privacy Policy](PRIVACY.md).

## Repository history note

The `v1.0` tag in this repository points to a commit from **January 2026 that
belongs to a different project** (the `bestelSolucious` web app, which lives in
its own repository). It predates the extraction of this extension into its own
repository and was never pushed to the remote.

It is intentionally left unpushed. If a sync-audit reports "45 unpushed
commits" here, that is this tag and not lost work: `main` is in sync with
`origin/main`, and the actual history of this extension is on `main`.
