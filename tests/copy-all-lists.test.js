const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

const popupSource = fs.readFileSync(path.join(__dirname, '../youtube-rightclick/popup.js'), 'utf8');
const popupHtml = fs.readFileSync(path.join(__dirname, '../youtube-rightclick/popup.html'), 'utf8');

function openPopup(storedData, clipboardWrite = async () => {}, downloadError = null, promptValue = null) {
    const elements = new Map();
    const listeners = {};
    const alerts = [];
    const timers = [];
    const downloads = [];
    const blobs = [];
    const revokedUrls = [];
    const updates = [];
    const prompts = [];
    const element = id => {
        if (!elements.has(id)) {
            const handlers = {};
            elements.set(id, {
                id, handlers, value: '', textContent: id === 'copyAllListsButton' ? 'Copy All Lists' : '',
                disabled: id === 'copyAllListsButton', style: {},
                addEventListener(event, handler) { handlers[event] = handler; },
                appendChild() {}, querySelector() { return { textContent: '' }; },
                contains() { return false; },
                select() {}
            });
        }
        return elements.get(id);
    };
    let storageChange;
    const document = {
        addEventListener(event, handler) { listeners[event] = handler; },
        getElementById: element,
        createElement: () => ({})
    };
    const chrome = {
        storage: {
            local: { get(defaults, callback) { callback({ ...defaults, ...storedData }); }, set(value) { updates.push(value); } },
            onChanged: { addListener(handler) { storageChange = handler; } }
        },
        tabs: { query(query, callback) { callback([]); } },
        runtime: { lastError: null },
        downloads: { download(options, callback) {
            downloads.push(options);
            chrome.runtime.lastError = downloadError;
            callback();
            chrome.runtime.lastError = null;
        } }
    };
    const context = {
        document, chrome, Blob,
        URL: {
            createObjectURL(blob) { blobs.push(blob); return `blob:test-${blobs.length}`; },
            revokeObjectURL(url) { revokedUrls.push(url); }
        },
        navigator: { clipboard: { writeText: clipboardWrite } },
        alert: message => alerts.push(message),
        prompt: (message, value) => { prompts.push({ message, value }); return promptValue; },
        setTimeout: callback => timers.push(callback),
        console: { error() {} }
    };
    vm.runInNewContext(popupSource, context);
    listeners.DOMContentLoaded();
    return { element, alerts, timers, storageChange, downloads, blobs, revokedUrls, updates, prompts };
}

test('exports every video and channel list as one TSV table without modifying data', async () => {
    const stored = {
        videoLists: {
            'First list': [{ title: 'One', url: 'https://youtube.com/watch?v=1' }, { title: 'Same', url: 'https://youtube.com/watch?v=2' }],
            'Empty': [],
            'Another\tlist': [{ title: 'A "quoted"\ntitle', url: 'https://youtube.com/watch?v=2' }]
        },
        activeVideoList: 'Empty',
        channelLists: { 'First list': [{ title: 'Channel', url: 'https://youtube.com/@channel' }] },
        activeChannelList: 'First list',
        mode: 'channel'
    };
    const before = JSON.stringify(stored);
    let copied;
    const popup = openPopup(stored, async value => { copied = value; });
    assert.equal(popup.element('copyAllListsButton').disabled, false);
    await popup.element('copyAllListsButton').handlers.click();
    assert.equal(copied, [
        'Type\tList\tTitle\tURL',
        'Video\tFirst list\tOne\thttps://youtube.com/watch?v=1',
        'Video\tFirst list\tSame\thttps://youtube.com/watch?v=2',
        'Video\t"Another\tlist"\t"A ""quoted""\ntitle"\thttps://youtube.com/watch?v=2',
        'Channel\tFirst list\tChannel\thttps://youtube.com/@channel'
    ].join('\n'));
    assert.equal(JSON.stringify(stored), before);
    assert.equal(popup.element('copyAllListsButton').textContent, 'Copied!');
    popup.timers[0]();
    assert.equal(popup.element('copyAllListsButton').textContent, 'Copy All Lists');
});

test('button tracks all lists, not just the active list or mode', () => {
    const popup = openPopup({
        videoLists: { Empty: [] }, activeVideoList: 'Empty',
        channelLists: { Other: [{ title: 'Channel', url: 'url' }] }, activeChannelList: 'Other',
        mode: 'video'
    });
    assert.equal(popup.element('copyButton').disabled, true);
    assert.equal(popup.element('copyAllListsButton').disabled, false);
    popup.storageChange({ channelLists: { newValue: { Other: [] } } }, 'local');
    assert.equal(popup.element('copyAllListsButton').disabled, true);
    popup.storageChange({ videoLists: { newValue: { Empty: [{ title: 'Video', url: 'url' }] } } }, 'local');
    assert.equal(popup.element('copyAllListsButton').disabled, false);
});

test('legacy lists are included and an empty export does not touch clipboard', async () => {
    let calls = 0;
    const clipboard = async () => { calls++; };
    const empty = openPopup({}, clipboard);
    assert.equal(empty.element('copyAllListsButton').disabled, true);
    await empty.element('copyAllListsButton').handlers.click();
    assert.equal(calls, 0);
    const legacy = openPopup({ lists: { Old: [{ title: 'Legacy', url: 'url' }] }, activeList: 'Old' }, clipboard);
    assert.equal(legacy.element('copyAllListsButton').disabled, false);
    await legacy.element('copyAllListsButton').handlers.click();
    assert.equal(calls, 1);
});

test('clipboard failures are reported instead of showing success', async () => {
    const popup = openPopup({ videoLists: { List: [{ title: 'One', url: 'url' }] }, activeVideoList: 'List' },
        async () => { throw new Error('denied'); });
    await popup.element('copyAllListsButton').handlers.click();
    assert.equal(popup.element('copyAllListsButton').textContent, 'Copy All Lists');
    assert.equal(popup.alerts.length, 1);
});

test('both all-list actions are initially disabled in the popup markup', () => {
    assert.match(popupHtml, /<button id="copyAllListsButton" disabled\b/);
    assert.match(popupHtml, /<button id="downloadAllListsButton" disabled\b/);
});

test('export actions share an equal-width three-column grid in the requested order', () => {
    assert.match(popupHtml, /\.export-actions\s*\{[^}]*display:\s*grid;[^}]*grid-template-columns:\s*repeat\(3,\s*minmax\(0,\s*1fr\)\);/);
    const grid = popupHtml.match(/<div class="export-actions">([\s\S]*?)<\/div>/);
    assert.ok(grid);
    const buttons = [...grid[1].matchAll(/<button id="([^"]+)"[^>]*>([^<]+)<\/button>/g)]
        .map(([, id, label]) => [id, label]);
    assert.deepEqual(buttons, [
        ['downloadButton', 'Download List'], ['copyButton', 'Copy List'], ['clearButton', 'Clear List'],
        ['downloadAllListsButton', 'Download All Lists'], ['copyAllListsButton', 'Copy All Lists'],
        ['renameListButton', 'Rename List']
    ]);
});

test('disabled grid buttons keep the common background and distinct text color', () => {
    assert.match(popupHtml, /button\s*\{[^}]*background-color:\s*var\(--secondary-color\);/);
    assert.match(popupHtml, /\.export-actions button:disabled\s*\{[^}]*background-color:\s*var\(--secondary-color\);[^}]*color:\s*#c2c2c6;/);
});

test('rename button and context menu rename the selected list in both modes', () => {
    const stored = {
        videoLists: { Before: [{ title: 'Video', url: 'v' }], Other: [] }, activeVideoList: 'Before',
        channelLists: { Channel: [{ title: 'Channel', url: 'c' }] }, activeChannelList: 'Channel', mode: 'video'
    };
    for (const [mode, button, activeKey, listsKey, oldName] of [
        ['video', 'renameListButton', 'activeVideoList', 'videoLists', 'Before'],
        ['channel', 'renameListButton', 'activeChannelList', 'channelLists', 'Channel'],
        ['video', 'menuRenameButton', 'activeVideoList', 'videoLists', 'Before']
    ]) {
        const popup = openPopup({ ...stored, mode }, undefined, null, ' New name ');
        assert.equal(popup.element('renameListButton').disabled, false);
        popup.element(button).handlers.click();
        assert.equal(popup.prompts[0].value, oldName);
        assert.equal(popup.updates.length, 1);
        assert.equal(popup.updates[0][activeKey], 'New name');
        assert.deepEqual(JSON.parse(JSON.stringify(popup.updates[0][listsKey]['New name'])), stored[listsKey][oldName]);
        assert.equal(Object.hasOwn(popup.updates[0][listsKey], oldName), false);
        assert.deepEqual(Object.keys(popup.updates[0][listsKey]), Object.keys(stored[listsKey]).map(key => key === oldName ? 'New name' : key));
    }
});

test('rename button rejects duplicates, cancellations, and missing selected lists', () => {
    const stored = { videoLists: { Before: [], Other: [] }, activeVideoList: 'Before' };
    const duplicate = openPopup(stored, undefined, null, 'Other');
    duplicate.element('renameListButton').handlers.click();
    assert.equal(duplicate.updates.length, 0);
    assert.equal(duplicate.alerts.length, 1);
    const cancelled = openPopup(stored);
    cancelled.element('renameListButton').handlers.click();
    assert.equal(cancelled.updates.length, 0);
    const missing = openPopup({ videoLists: {}, activeVideoList: '' });
    assert.equal(missing.element('renameListButton').disabled, true);
    missing.element('renameListButton').handlers.click();
    assert.equal(missing.prompts.length, 0);
    assert.equal(missing.updates.length, 0);
});

test('download uses the same TSV as copy for all video and channel lists', async () => {
    const stored = {
        videoLists: {
            Empty: [],
            'List\tA': [{ title: 'A "quoted"\ntitle', url: 'https://youtube.com/watch?v=1' }]
        },
        activeVideoList: 'Empty',
        channelLists: { 'List A': [{ title: 'Kanaal é', url: 'https://youtube.com/@channel' }] },
        activeChannelList: 'List A', mode: 'video'
    };
    const original = JSON.stringify(stored);
    let copied;
    const popup = openPopup(stored, async text => { copied = text; });
    assert.equal(popup.element('downloadButton').disabled, true);
    assert.equal(popup.element('downloadAllListsButton').disabled, false);
    await popup.element('copyAllListsButton').handlers.click();
    popup.element('downloadAllListsButton').handlers.click();
    assert.equal(popup.downloads.length, 1);
    assert.equal(popup.downloads[0].filename, 'all-lists.tsv');
    assert.equal(popup.downloads[0].saveAs, true);
    assert.equal(popup.downloads[0].url, 'blob:test-1');
    assert.equal(popup.blobs[0].type, 'text/tab-separated-values;charset=utf-8');
    assert.equal(await popup.blobs[0].text(), copied);
    assert.deepEqual(popup.revokedUrls, ['blob:test-1']);
    assert.equal(JSON.stringify(stored), original);
});

test('download button follows changes in both modes and skips empty exports', () => {
    const popup = openPopup({
        videoLists: { Empty: [] }, activeVideoList: 'Empty',
        channelLists: { Other: [{ title: 'Channel', url: 'url' }] }, activeChannelList: 'Other',
        mode: 'video'
    });
    assert.equal(popup.element('downloadAllListsButton').disabled, false);
    popup.storageChange({ channelLists: { newValue: { Other: [] } } }, 'local');
    assert.equal(popup.element('downloadAllListsButton').disabled, true);
    popup.element('downloadAllListsButton').handlers.click();
    assert.equal(popup.downloads.length, 0);
    popup.storageChange({ videoLists: { newValue: { Empty: [{ title: 'Video', url: 'url' }] } }, mode: { newValue: 'channel' } }, 'local');
    assert.equal(popup.element('downloadAllListsButton').disabled, false);
});

test('download includes legacy video lists and reports download errors', async () => {
    const popup = openPopup({ lists: { Old: [{ title: 'Legacy', url: 'url' }] }, activeList: 'Old' },
        async () => {}, { message: 'Download failed' });
    assert.equal(popup.element('downloadAllListsButton').disabled, false);
    popup.element('downloadAllListsButton').handlers.click();
    assert.equal(await popup.blobs[0].text(), 'Type\tList\tTitle\tURL\nVideo\tOld\tLegacy\turl');
    assert.equal(popup.alerts.length, 1);
    assert.deepEqual(popup.revokedUrls, ['blob:test-1']);
});
