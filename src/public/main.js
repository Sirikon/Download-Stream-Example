const NEWLINE_CHARCODE = 10;

const state = {
    chunkCount: 0,
    expectedLines: 0,
    data: [],
    rest: [],
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

function download() {
    return fetch('/csv-generator')
        .then(response => {
            readExpectedLinesHeader(response);
            return readBody(response.body);
        })
        .then(() => {
            console.log('Done!')
        });
}

function readExpectedLinesHeader(response) {
    const value = response.headers.get('X-Lines');
    if (!value) return;
    state.expectedLines = parseInt(value);
}

function readBody(body) {
    const reader = body.getReader();
    return reader.read()
        .then(function processData({ done, value }) {
            if (done) return;
            state.chunkCount++;
            processChunk(value);
            render();
            return reader.read().then(processData);
        });
}

function processChunk(value) {
    const chunk = prependRestToChunk(value);
    let item = [];
    for(var i = 0; i < chunk.length; i++) {
        // CSV was sent from the server in UTF-8,
        // so, each byte is a character.
        var charCode = chunk[i];
        if (charCode === NEWLINE_CHARCODE) {
            const rawLine = item.map(c => String.fromCharCode(c)).join('');
            const line = parseCSVLine(rawLine);
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
    var cols = line.split(';');
    return cols.map(c => c.substr(1, c.length - 2));
}
