const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

const popupSource = fs.readFileSync(path.join(__dirname, '../youtube-rightclick/popup.js'), 'utf8');
const popupHtml = fs.readFileSync(path.join(__dirname, '../youtube-rightclick/popup.html'), 'utf8');

function openPopup(storedData, clipboardWrite = async () => {}) {
    const elements = new Map();
    const listeners = {};
    const alerts = [];
    const timers = [];
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
        tabs: { query(query, callback) { callback([]); } }
    };
    const context = {
        document, chrome, navigator: { clipboard: { writeText: clipboardWrite } },
        alert: message => alerts.push(message),
        setTimeout: callback => timers.push(callback),
        console: { error() {} }
    };
    vm.runInNewContext(popupSource, context);
    listeners.DOMContentLoaded();
    return { element, alerts, timers, storageChange };
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

test('the new action is initially disabled in the popup markup', () => {
    assert.match(popupHtml, /<button id="copyAllListsButton" disabled\b/);
});
