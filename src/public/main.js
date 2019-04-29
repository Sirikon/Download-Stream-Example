const NEWLINE_CHARCODE = 10;

const state = {
    chunkCount: 0,
    expectedLines: 0,
    data: [],
    rest: [],
    timers: {
        start: 0,
        download: 0,
        end: 0
    },
    getProgress() {
        return state.data.length / state.expectedLines;
    }
};

const domElements = {
    progressInner: document.querySelector('.progress-bar-inner'),
    progressText: document.querySelector('.progress-bar-text'),
    chunkCount: document.getElementById('chunkCount'),
    lines: document.getElementById('lines')
}

function render() {
    domElements.progressInner.setAttribute('style', 'right: ' + (100 - (state.getProgress() * 100)) + '%');
    domElements.progressText.textContent = Math.floor(state.getProgress() * 100) + '%';
    domElements.chunkCount.textContent = state.chunkCount;
    domElements.lines.textContent = state.data.length;
}

setInterval(() => {
    render();
}, 1000);

function downloadCSV() {
    download('/csv-generator', parseCSVLine)
}

function downloadJSON() {
    download('/json-generator', JSON.parse)
}

function download(url, itemParser) {
    console.log('Start');
    state.timers.start = performance.now();
    return fetch(url)
        .then(response => {
            state.timers.download = performance.now();
            readExpectedLinesHeader(response);
            return readBody(response.body, itemParser);
        })
        .then(() => {
            state.timers.end = performance.now();
            console.log('Done!')
            console.log('Time to headers:', state.timers.download - state.timers.start);
            console.log('From headers to full read:', state.timers.end - state.timers.download);
        });
}

function readExpectedLinesHeader(response) {
    const value = response.headers.get('X-Lines');
    if (!value) return;
    state.expectedLines = parseInt(value);
}

function readBody(body, itemParser) {
    const reader = body.getReader();
    return reader.read()
        .then(function processData({ done, value }) {
            if (done) return;
            state.chunkCount++;
            processChunk(value, itemParser);
            // render();
            return reader.read().then(processData);
        });
}

function processChunk(value, itemParser) {
    const chunk = prependRestToChunk(value);
    let item = [];
    for(var i = 0; i < chunk.length; i++) {
        // CSV was sent from the server in UTF-8,
        // so, each byte is a character.
        var charCode = chunk[i];
        if (charCode === NEWLINE_CHARCODE) {
            const rawLine = item.map(c => String.fromCharCode(c)).join('');
            const line = itemParser(rawLine);
            state.data.push(line);
            item = [];
        } else {
            item.push(charCode);
        }
    }
    state.rest = item;
}

function prependRestToChunk(value) {
    const restLength = state.rest.length;
    const chunk = new Uint8Array(restLength + value.length);
    chunk.set(state.rest);
    chunk.set(value, restLength);
    state.rest = [];
    return chunk;
}

function parseCSVLine(line) {
    const cols = line.split(';');
    return cols.map(c => c.substr(1, c.length - 2));
}
