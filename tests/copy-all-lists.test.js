const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

const popupSource = fs.readFileSync(path.join(__dirname, '../youtube-rightclick/popup.js'), 'utf8');
const popupHtml = fs.readFileSync(path.join(__dirname, '../youtube-rightclick/popup.html'), 'utf8');

function openPopup(storedData, clipboardWrite = async () => {}, downloadError = null) {
    const elements = new Map();
    const listeners = {};
    const alerts = [];
    const timers = [];
    const downloads = [];
    const blobs = [];
    const revokedUrls = [];
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
            local: { get(defaults, callback) { callback({ ...defaults, ...storedData }); }, set() {} },
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
        setTimeout: callback => timers.push(callback),
        console: { error() {} }
    };
    vm.runInNewContext(popupSource, context);
    listeners.DOMContentLoaded();
    return { element, alerts, timers, storageChange, downloads, blobs, revokedUrls };
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

test('export actions appear in the requested two rows', () => {
    const rows = [...popupHtml.matchAll(/<div class="export-actions-row">([\s\S]*?)<\/div>/g)];
    assert.equal(rows.length, 2);
    const buttons = row => [...row.matchAll(/<button id="([^"]+)"[^>]*>([^<]+)<\/button>/g)]
        .map(([, id, label]) => [id, label]);
    assert.deepEqual(buttons(rows[0][1]), [
        ['downloadButton', 'Download List'], ['copyButton', 'Copy List'], ['clearButton', 'Clear List']
    ]);
    assert.deepEqual(buttons(rows[1][1]), [
        ['downloadAllListsButton', 'Download All Lists'], ['copyAllListsButton', 'Copy All Lists']
    ]);
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
