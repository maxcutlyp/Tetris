// https://stackoverflow.com/a/22313621/8457833
function SeedRandom(state1?: any,state2?: any){
    var mod1=4294967087
    var mul1=65539
    var mod2=4294965887
    var mul2=65537
    if(typeof state1!="number"){
        state1=+new Date()
    }
    if(typeof state2!="number"){
        state2=state1
    }
    state1=state1%(mod1-1)+1
    state2=state2%(mod2-1)+1
    function random(limit: number): number{
        state1=(state1*mul1)%mod1
        state2=(state2*mul2)%mod2
        if(state1<limit && state2<limit && state1<mod1%limit && state2<mod2%limit){
            return random(limit)
        }
        return (state1+state2)%limit
    }
    return random
}

class Shape {
    structures: string[][];
    color: string;
    spawnCol: number;

    constructor(structures: string[][], color: string) {
        this.color = color;
        this.structures = structures;
        this.spawnCol = this.getCenteredColumn(0);
    }

    public draw(top: number, left: number, rotation: number) {
        const structure: string[] = this.structures[rotation];
        // console.log(structure);
        const div: HTMLDivElement = document.createElement('div');
        // console.log(div.innerHTML);
        for (var row=0; row<structure.length; row++) {
            for (var col=0; col<structure[row].length; col++) {
                if (structure[row][col] === '1') {
                    // console.log(row, col);
                    const cell: HTMLDivElement = createEmptyCell();
                    cell.style.top = String(CELL_SIZE * row) + 'px';
                    cell.style.left = String(CELL_SIZE * col) + 'px';
                    cell.style.backgroundColor = this.color;
                    div.appendChild(cell);
                    // console.log(div.innerHTML);
                }
            }
        }
        div.style.position = 'absolute';
        div.style.top = String(top) + 'px';
        div.style.left = String(left) + 'px';
        // console.log(div);
        return div;
    }

    public calculateWidth(rotation: number): number {
        var minCol: number | undefined;
        var maxCol: number | undefined;
        for (var row=0; row<this.structures[rotation].length; row++) {
            for (var col=0; col<this.structures[rotation][row].length; col++) {
                if (this.structures[rotation][row][col] === '1') {
                    if (minCol === undefined || col < minCol) {
                        minCol = col;
                    }
                    if (maxCol === undefined || col > maxCol) {
                        maxCol = col;
                    }
                }
            }
        }
        if (minCol === undefined || maxCol === undefined) {
            return 0;
        }
        return maxCol - minCol + 1;
    }

    public getZeroColumns(rotation: number): number {
        var cols = 0;
        const structure = this.structures[rotation];
        for (var col=0; col<structure[0].length; col++) {
            if (structure.every(row => row[col] === '0')) {
                cols++;
            } else {
                break;
            }
        }
        return cols;
    }

    public getCenteredColumn(rotation: number): number {
        const zeroCols: number = this.getZeroColumns(rotation);
        const width: number = this.calculateWidth(rotation);
        return Math.floor((COLS - width)/2 - zeroCols);
    }

/*
    // public getRotatedVersion(rotation: number) {
    //     console.log('rotating to ' + String(rotation));
    //     var rotated: number[][] = this.structure;
    //     for (var i=0; i<rotation; i++) {
    //         const newDims: number[] = [rotated[0].length, rotated.length];
    //         console.log(newDims);
    //         const newRotated: number[][] = new Array(newDims[0]);
    //         console.log(newRotated);
    //         for (var j=0; j<newDims[1]; j++) {
    //             const row: number[] = new Array(newDims[1]);
    //             console.log(row);
    //             console.log(newRotated);
    //             newRotated[j] = row;
    //             console.log(newRotated);
    //         }
    //         console.log(newRotated);
    //         for (var baseRowNewCol=newDims[1]-1; baseRowNewCol>=0; baseRowNewCol--) {
    //             const col: number[] = [];
    //             for (var row=0; row<newDims[0]; row++) {
    //                 col.push(rotated[row][baseRowNewCol]);
    //             }
    //             col.reverse();
    //             newRotated[baseRowNewCol] = col;
    //         }
    //         rotated = newRotated;
    //     }

    //     return rotated;
    // }

    // public draw(top: number, left: number, rotation: number) { // todo: rotation
    //     const bitmask: number = 0b1; // mask all but the right-most bit
    //     const div: HTMLDivElement = document.createElement('div');
    //     for (var i=0; i<this.binArray.length; i++) {
    //         var rmb: number;
    //         var row: number = this.binArray[i];
    //         var col: number = 0;
    //         while (row > 0) {
    //             rmb = row & bitmask;
    //             if (rmb) {
    //                 const cell: HTMLDivElement = createEmptyCell();
    //                 cell.style.top = String(CELL_SIZE * i) + 'px';
    //                 cell.style.left = String(CELL_SIZE * col) + 'px';
    //                 cell.style.backgroundColor = this.color;
    //                 div.appendChild(cell);
    //             }
    //             row = row >> 1;
    //             col++;
    //         }
    //     }
    //     div.style.position = 'absolute';
    //     div.style.top = String(top) + 'px';
    //     div.style.left = String(left) + 'px';
    //     return div;
    // }
*/
}

document.addEventListener('DOMContentLoaded', main);

const CELL_SIZE: number = 35;
const ROWS: number = 20;
const COLS: number = 10;
const CURRENT_GRID: number[][] = [];
const BG_COLOR: string = '#555';
const FLASH_COLOR: string = '#fff';
const FLASHES = 5;
const FLASH_DURATION = 50;
const CUR_ID: string = 'current';
const PRE_ID: string = 'preview';
const NEXT_ID: string = 'next-block';
const HOLD_ID: string = 'hold-block';

var generator: any;
var seed: number;
var TMP_OLD_GRID: number[][] = []; // use this while flashing
var IS_FLASHING: boolean = false;
var rotation = 0;
var currentBlock: number;
var heldBlock: number;
var time;
var next: number; // timeout
var paused: boolean = false;
var hasSetBinds = false;
var keydownEvent: EventListener;
var events: number[];
var score: number;
var lines: number;

const SHAPES: Shape[] = [new Shape([['11', '11'],
                                    ['11', '11'],
                                    ['11', '11'],
                                    ['11', '11']], '#ff0000'), 
                         new Shape([['0100', '0100', '0100', '0100'],
                                    ['0000', '0000', '1111', '0000'],
                                    ['0100', '0100', '0100', '0100'],
                                    ['0000', '0000', '1111', '0000']], '#ff7f00'),
                         new Shape([['100', '110', '010'],
                                    ['000', '011', '110'],
                                    ['100', '110', '010'],
                                    ['000', '011', '110']], '#00ffff'), 
                         new Shape([['010', '110', '100'],
                                    ['000', '110', '011'],
                                    ['010', '110', '100'],
                                    ['000', '110', '011']], '#00ff00'), 
                         new Shape([['010', '010', '011'],
                                    ['000', '111', '100'],
                                    ['110', '010', '010'],
                                    ['001', '111', '000']], '#0000ff'), 
                         new Shape([['010', '010', '110'],
                                    ['100', '111', '000'],
                                    ['011', '010', '010'],
                                    ['000', '111', '001']], '#ff00ff'), 
                         new Shape([['000', '111', '010'],
                                    ['010', '110', '010'],
                                    ['010', '111', '000'],
                                    ['010', '011', '010']], '#ffff00')];

function main() {
    setupGrid(ROWS, COLS);
    buildBackground(ROWS, COLS);
    renderGrid();
    setupForm();
}

function startGame() {
    const startTime = new Date().getTime();
    seed = startTime & 0x7fffffff;
    generator = SeedRandom(seed);

    var startNextBlockFlag = true;
    var lineup = generateBag();
    var drawnBlock: HTMLDivElement;
    var flashTimeModifier = 0;
    var height;
    var distance;
    var softResetBlock = true;
    var hasHeld = false;
    var eventFlag = false;

    score = 0;
    lines = 0;
    time = timeProgression(lines);
    heldBlock = undefined;
    drawnBlock = undefined;

    events = [];

    hideAllMenus()

    keydownEvent = function(event: KeyboardEvent) {
        switch (event.code) {
            case 'ArrowLeft':
            if (!paused && !IS_FLASHING) {
                // console.log('left');
                attemptMoveBlock(0, -1);
                events.push(1);
            }
            break;
            case 'ShiftRight':
            if (!paused && !IS_FLASHING) {
                events.push(7);
                hold();
            }
            break;
            case 'ArrowRight':
            if (!paused && !IS_FLASHING) {
                attemptMoveBlock(0, 1);
                events.push(2);
            }
            break;
            case 'ArrowDown':
            if (!paused && !IS_FLASHING && attemptMoveBlock(1, 0)) {
                window.clearTimeout(next);
                next = window.setTimeout(loopCallback, time + flashTimeModifier);
                // interestingly, this is the only time we conditionally push an event.
                // the reason for this is that it means i don't have to touch the simulator code.
                events.push(5);
            }
            break;
            case 'KeyQ': // rotate counter clockwise
            if (!paused && !IS_FLASHING) {
                attemptRotate(false);
                events.push(4);
                preparePreview();
            }
            break;
            case 'ArrowUp':
            case 'KeyW': // rotate clockwise
            if (!paused && !IS_FLASHING) {
                attemptRotate(true);
                events.push(3);
                preparePreview();
            }
            break;
            case 'KeyP':
            pause();
            break;
            case 'Space':
            if (!paused && !IS_FLASHING) {
                events.push(6);
                hardDrop();
            }
            break;
        }
        updatePreview();
    }

    if (!hasSetBinds) {
        window.addEventListener('keydown', keydownEvent);

        document.getElementById('pauseBtn').onclick = pause;
    }

    function hold() {
        if (!hasHeld) {
            hasHeld = true;
            if (heldBlock === undefined) {
                heldBlock = currentBlock;
                startNextBlockFlag = true;
            } else {
                [currentBlock, heldBlock] = [heldBlock, currentBlock];
                softResetBlock = true;
            }
            setHold();
            document.getElementById(CUR_ID).remove();
            window.clearTimeout(next);
            loopCallback();
        }
    }

    function hardDrop() {
        while (attemptMoveBlock(1, 0)) { }
        window.clearTimeout(next);
        loopCallback();
    }

    function pause() {
        paused = !paused;
        updatePauseScreen();
        if (paused) {
            window.clearTimeout(next);
        } else {
            loopCallback();
        }
    }

    function updateLinesAndScore(): void {
        document.getElementById('score').innerHTML = String(score);
        document.getElementById('lines').innerHTML = String(lines);
    }

    function loopCallback() { // todo: animations
        if (drawnBlock !== undefined && document.getElementById(CUR_ID) !== null) {
            events.push(0);
            if (!attemptMoveBlock(1, 0)) {
                startNextBlockFlag = true;
                hasHeld = false;
                merge(currentBlock);
                renderGrid();
                removeAllChildren(document.getElementById(PRE_ID));
                const [scoreToAdd, linesToAdd] = clearLines(height);
                score += scoreToAdd;
                lines += linesToAdd;
                time = timeProgression(lines);
                updateLinesAndScore();
                if (linesToAdd > 0) {
                    flashTimeModifier = FLASHES*2*FLASH_DURATION;
                    // console.log('flashing');
                }
            }
        }

        if (startNextBlockFlag && flashTimeModifier === 0) {
            currentBlock = lineup.pop();
            events.push(currentBlock + 1);
            IS_FLASHING = false;
            // console.log(events);
            setNext(lineup[lineup.length - 1]);
        }

        if (softResetBlock || (startNextBlockFlag && flashTimeModifier === 0)) {
            softResetBlock = false;
            startNextBlockFlag = false;
            rotation = 0;
            drawnBlock = SHAPES[currentBlock].draw(0, 0, rotation);
            drawnBlock.style.left = String(CELL_SIZE * SHAPES[currentBlock].spawnCol) + 'px';
            drawnBlock.style.top = '0';
            drawnBlock.id = CUR_ID;
            document.getElementById('canvas').appendChild(drawnBlock);
            preparePreview();

            if (lineup.length <= 6) {
                lineup.unshift(...generateBag());
            }
        }

        updatePreview();

        distance = Math.floor((parseFloat(document.getElementById(PRE_ID).style.top) - parseFloat(drawnBlock.style.top))/CELL_SIZE);
        height = ROWS - Math.floor(parseFloat(drawnBlock.style.top)/CELL_SIZE);

        if (flashTimeModifier > 0 || !isColliding(getPotentialMergeLocations())) {
            // console.log(flashTimeModifier);
            flashTimeModifier = 0;
            // console.log('ftm = 0');
            next = window.setTimeout(loopCallback, time + flashTimeModifier);
        } else {
            end();
        }
    }

    loopCallback();
}

function setupForm() {
    const form: HTMLFormElement = document.querySelector('form');
    form.addEventListener('submit', e => {
        e.preventDefault();

        const name = (<HTMLInputElement>document.querySelector('[type=text]')).value;
        document.cookie = `name=${name}; max-age=2147483648; expires=Tue, 19 Jan 2038 03:14:08 GMT`;

        const formData = new FormData();
        formData.append('name', name);
        formData.append('score', score.toString())
        formData.append('validate', getPrintableEncodedEvents());

        const headers = new Headers();
        headers.append('pragma', 'no-cache');
        headers.append('cache-control', 'no-cache');

        fetch('highscore.php', {
            method: 'POST',
            body: formData,
            headers: headers
        })
            .then((response: Response) => response.text())
            .then((text: string) => {
                const out: string[] = text.split('\n');
                if (out[out.length - 2] === 'success') {
                    const row: number = parseInt(out[out.length - 1]);
                    showHighscores(showMenuScreen, row);
                } else {
                    showErrorsMenu(showGameOverScreen, 'error submitting highscore');
                }
            });
    });
}

function parseHighscoresCSV(str: string): [string, number][] {
    const csv: string[][] = [];
    const rows: string[] = str.split('\n');
    for (const row of rows) {
        if (row.length > 0) {
            const items: string[] = [];
            var item: string = '';
            var isQuoted: boolean = false;
            for (var i=0; i<row.length; i++) { // this is so janky but it works i guess
                if (i === 0 && row[i] === '"') {
                    isQuoted = true;
                    continue;
                }
                if (isQuoted && row[i] === '"') {
                    if (i > 1 && row[i-1] === '"' && row[i+1] !== ',') {
                        item += '"';
                    }
                    continue;
                }
                if ((row[i] === ',' && (!isQuoted || row[i-1] === '"'))) {
                    items.push(item);
                    item = '';
                    continue;
                }
                item += row[i];
            }
            items.push(item);
            csv.push(items);
        }
    }
    const highscores: [string, number][] = csv.map(row => [row[0], parseInt(row[1])]);
    return highscores;
}

function getHighscore(name: string, highscores: [string, number][]): number {
    for (var i=0; i<highscores.length; i++) {
        if (highscores[i][0] === name) {
            return i;
        }
    }
    return -1;
}

function hideAllMenus() {
    document.getElementById('pause').style.display = 'none';
    document.getElementById('main-menu').style.display = 'none';
    document.getElementById('submit-menu').style.display = 'none';
    document.getElementById('errors-menu').style.display = 'none';
    document.getElementById('highscores').style.display = 'none';
    document.getElementById('game-over').style.display = 'none';
}

function showHighscores(back: (() => void), highlight?: number) {
    document.getElementById('hs-back').onclick = back;
    hideAllMenus();

    const headers = new Headers();
    headers.append('pragma', 'no-cache');
    headers.append('cache-control', 'no-cache');

    document.getElementById('highscores').style.display = 'block';
    const scrolldiv = document.getElementById('hs-scroll');
    removeAllChildren(scrolldiv);
    fetch('highscores.csv', { headers: headers })
        .then((r: Response) => r.text())
        .then((t: string) => {
            const highscores: [string, number][] = parseHighscoresCSV(t);
            if (highlight === undefined) {
                highlight = getHighscore(getCookie('name'), highscores);
            }
            const table: HTMLTableElement = document.createElement('table');
            var newRow: HTMLTableRowElement;
            for (var i=0; i<highscores.length; i++) {
                const [name, score] = highscores[i];
                const row: HTMLTableRowElement = document.createElement('tr');
                const numTD: HTMLTableDataCellElement = document.createElement('td');
                numTD.classList.add('left');
                numTD.innerHTML = String(i+1);
                row.appendChild(numTD);
                const nameTD: HTMLTableDataCellElement = document.createElement('td');
                nameTD.classList.add('mid');
                nameTD.innerHTML = name;
                row.appendChild(nameTD);
                const scoreTD: HTMLTableDataCellElement = document.createElement('td');
                scoreTD.classList.add('right');
                scoreTD.innerHTML = String(score);
                row.appendChild(scoreTD);
                if (i === highlight) {
                    numTD.classList.add('highlight');
                    nameTD.classList.add('highlight');
                    scoreTD.classList.add('highlight');
                    newRow = row;
                }
                if (i%2 === 1) {
                    row.classList.add('rh');
                }
                table.appendChild(row);
            }
            scrolldiv.appendChild(table);
            if (newRow !== undefined) {
                newRow.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
            }
        });
}

function showErrorsMenu(back: (() => void), error: string) {
    document.getElementById('error').innerHTML = error;
    document.getElementById('er-back').onclick = back;
    hideAllMenus();
    document.getElementById('errors-menu').style.display = 'block';
}

function showSubmitScreen() {
    hideAllMenus();
    document.getElementById('submit-menu').style.display = 'block';
    (<HTMLInputElement>document.querySelector('[type=text]')).value = getCookie('name') ?? '';
}

function showGameOverScreen() {
    hideAllMenus();
    document.getElementById('game-over').style.display = 'block';
}

function showMenuScreen() {
    hideAllMenus();
    document.getElementById('main-menu').style.display = 'block';
    paused = false;
    clearEverything();
    window.clearTimeout(next);
}

// why is this not already a thing? - https://stackoverflow.com/a/21125098/8457833
function getCookie(name: string) {
    var match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    if (match) return match[2];
}

function encode(eventSequence: number[]) {
    const bitmasks = [0x00ff0000, 0x0000ff00, 0x000000ff];
    var stream = new Uint8Array(Math.ceil(eventSequence.length/8 * 3));
    var streamCount: number = 0;
    for (var i=0; i<eventSequence.length; i+=8) {
        var chunk = 0;
        const end = Math.min(eventSequence.length - i, 8);
        for (var j=0; j<end; j++) {
            const positioned = eventSequence[i+j] << (3 * (7-j));
            chunk |= positioned;
        }
        stream[streamCount+0] = (chunk & bitmasks[0]) >>> 16
        stream[streamCount+1] = (chunk & bitmasks[1]) >>> 8
        stream[streamCount+2] = (chunk & bitmasks[2])
        streamCount += 3;
    }
    const length = eventSequence.length;
    const byteLength: string = intToBytesString(length, 4);
    const byteSeed: string = intToBytesString(seed, 4);
    var result: string = byteLength + byteSeed;
    for (var i=0; i<stream.length; i++) {
        result += String.fromCharCode(stream[i]);
    }
    return result;
}

function intToBytesString(int: number, size: number): string {
    var str: string = '';
    for (var i = size - 1; i >= 0; i--) {
        str += String.fromCharCode((int & (0xff << i*8)) >> i*8);
    }
    return str;
}

function timeProgression(linesCleared) {
    const a = 20000;
    const b = 100;
    const c = 800;
    return a/(linesCleared + (a/(c - b))) + b;
}

function end() {
    showGameOverScreen();
    window.clearTimeout(next);
    paused = false;
    window.removeEventListener('keydown', keydownEvent);
    hasSetBinds = false;
    // console.log(getPrintableEncodedEvents());
}

function getPrintableEncodedEvents() {
    return btoa(encode(events));
}

function restart() {
    clearEverything();
    paused = false;
    startGame();
}

function clearEverything() {
    var cur;
    if ((cur = document.getElementById(CUR_ID)) !== null) {
        cur.remove();
    }
    removeAllChildren(document.getElementById(PRE_ID));
    removeAllChildren(document.getElementById(NEXT_ID));
    removeAllChildren(document.getElementById(HOLD_ID));
    document.getElementById('score').innerHTML = '0';
    document.getElementById('lines').innerHTML = '0';
    window.removeEventListener('keydown', keydownEvent);
    hasSetBinds = false;
    setupGrid(ROWS, COLS);
    renderGrid();
}

function setBlockChildren(blockNum, rot, div) {
    const children: HTMLDivElement[] = [].slice.call(SHAPES[blockNum].draw(0, 0, rot).children);
    removeAllChildren(div);
    children.forEach(cell => {
        div.appendChild(cell);
    });
}

function setHold() {
    const holdBlockDiv: HTMLElement = document.getElementById(HOLD_ID);
    setBlockChildren(heldBlock, 0, holdBlockDiv);
    const transform = 'translate(-' + String(Math.floor(SHAPES[heldBlock].structures[0][0].length/2 * CELL_SIZE)) + 
                            'px, -' + String(Math.floor(SHAPES[heldBlock].structures[0].length/2 * CELL_SIZE)) + 'px)';
    holdBlockDiv.style.transform = transform;
}

function setNext(nextBlock: number) {
    const nextBlockDiv: HTMLElement = document.getElementById(NEXT_ID);
    setBlockChildren(nextBlock, 0, nextBlockDiv);
    const transform = 'translate(-' + String(Math.floor(SHAPES[nextBlock].structures[0][0].length/2 * CELL_SIZE)) + 
                            'px, -' + String(Math.floor(SHAPES[nextBlock].structures[0].length/2 * CELL_SIZE)) + 'px)';
    nextBlockDiv.style.transform = transform;
}

function preparePreview() {
    setBlockChildren(currentBlock, rotation, document.getElementById(PRE_ID));
}

function removeAllChildren(element: HTMLElement) {
    for (;element.children.length > 0;) {
        element.removeChild(element.children[0])
    }
}

function updatePreview() {
    const preview: HTMLElement = document.getElementById(PRE_ID);
    const current: HTMLElement = document.getElementById(CUR_ID);

    if (preview === null || current === null) {
        return;
    }

    const potentialMergeLocations: number[][] = getPotentialMergeLocations();
    const droppedCellLocations: number[][]  = getDroppedCellLocations(potentialMergeLocations);
    const vCellDistance: number = droppedCellLocations[0][0] - potentialMergeLocations[0][0];

    preview.style.top = String(parseFloat(current.style.top) + vCellDistance*CELL_SIZE) + 'px';
    preview.style.left = current.style.left;
}

function getDroppedCellLocations(locations?: number[][]) {
    if (locations === undefined) {
        locations = getPotentialMergeLocations();
    }
    while (isOkToMerge(locations)) {
        locations = locations.map(location => [location[0]+1, location[1]]);
    }
    locations.forEach(location => location[0]--);
    return locations;
}

function updatePauseScreen() {
    if (paused) {
        hideAllMenus();
        document.getElementById('pause').style.display = 'block';
    } else {
        document.getElementById('pause').style.display = 'none';
    }
}

function clearLines(height: number) {
    var scoreToAdd = 15;
    const rowsToChange: number[] = [];
    for (var row=CURRENT_GRID.length-1; row>=0; row--) {
        if (CURRENT_GRID[row].every(cell => cell > 0)) {
            rowsToChange.push(row);
            flash(row);
        }
    }
    switch (rowsToChange.length) {
        case 0: break;
        case 1:
        scoreToAdd += 100;
        break;
        case 2:
        scoreToAdd += 250;
        break;
        case 3:
        scoreToAdd += 500;
        break;
        case 4:
        default:
        scoreToAdd += 1500;
        break;
    }
    setTempGrid();
    scoreToAdd += Math.floor(scoreToAdd * (height/ROWS) * 800/time);
    var flag = false;
    var rowDiff = 0;
    for (var row=CURRENT_GRID.length-1; row>=0; row--) {
        if (rowsToChange.includes(row - rowDiff)) {
            rowDiff++;
            flag = true;
        }
        if (rowDiff > row) {
            CURRENT_GRID[row] = new Array<number>(COLS).fill(0);
        } else {
            CURRENT_GRID[row] = CURRENT_GRID[row - rowDiff];
        }
        if (flag) {
            row++;
            flag = false;
        }
    }

    // window.setTimeout(() => {
    //     var flag = false;
    //     var rowDiff = 0;
    //     for (var row=CURRENT_GRID.length-1; row>=0; row--) {
    //         if (rowsToChange.includes(row - rowDiff)) {
    //             rowDiff++;
    //             flag = true;
    //         }
    //         if (rowDiff > row) {
    //             CURRENT_GRID[row] = new Array<number>(COLS).fill(0);
    //         } else {
    //             CURRENT_GRID[row] = CURRENT_GRID[row - rowDiff];
    //         }
    //         if (flag) {
    //             row++;
    //             flag = false;
    //         }
    //     }
    //     renderGrid();
    // }, FLASHES*2*FLASH_DURATION);
    return [scoreToAdd, rowsToChange.length];
}

function setTempGrid() {
    for (var row=0; row<CURRENT_GRID.length; row++) {
        for (var col=0; col<CURRENT_GRID[row].length; col++) {
            TMP_OLD_GRID[row][col] = CURRENT_GRID[row][col];
        }
    }
}

function flash(row: number) {
    const cells = [].slice.call(document.getElementsByClassName('r' + String(row)));
    var flashCount = 0;
    IS_FLASHING = true;
    const flasher = window.setInterval(() => {
        if (flashCount >= FLASHES*2) {
            window.clearInterval(flasher);
            renderGrid();
            return;
        }
        flashCount++;
        for (const cell of cells) {
            if (flashCount % 2 == 0) {
                cell.style.backgroundColor = FLASH_COLOR;
            } else {
                const col: number = parseInt(Array.from<string>(cell.classList).filter(className => className[0] === 'c')[0].slice(1));
                cell.style.backgroundColor = SHAPES[TMP_OLD_GRID[row][col]-1].color;
            }
        }
    }, FLASH_DURATION);
}

function isOkToMerge(locations: number[][]) {
    if (locations.length > 0) {
        return locations.every(location => location[0] >= 0 && location[1] >= 0 &&
                                           CURRENT_GRID.length > location[0] && 
                                           CURRENT_GRID[location[0]].length > location[1] &&
                                           CURRENT_GRID[location[0]][location[1]] === 0);
    }
    return false;
}

function attemptRotate(clockwise: boolean) {
    var newRotation;
    if (clockwise) {
        newRotation = (rotation + 1) % 4;
    } else {
        newRotation = (rotation + 3) % 4;
    }
    const current: HTMLElement = document.getElementById(CUR_ID);
    const rotated: HTMLElement = SHAPES[currentBlock].draw(0, 0, newRotation);
    rotated.style.top = current.style.top;
    rotated.style.left = current.style.left;
    const locations = getPotentialMergeLocations(rotated);
    if (isOkToMerge(locations)) {
        rotate(clockwise);
        return true;
    }
    return false;
}

function rotate(clockwise: boolean) {
    if (clockwise) {
        rotation = (rotation + 1) % 4;
    } else {
        rotation = (rotation + 3) % 4;
    }
    const current: HTMLElement = document.getElementById(CUR_ID);
    removeAllChildren(current);
    const rotatedChildren = [].slice.call(SHAPES[currentBlock].draw(0, 0, rotation).children);
    for (var i=0; i<rotatedChildren.length; i++) {
        current.appendChild(rotatedChildren[i]);
    }
}

function getPotentialMergeLocations(drawnBlock?: HTMLElement) {
    const locations: number[][] = [];

    if (drawnBlock === undefined) {
        drawnBlock = document.getElementById(CUR_ID);
    }
    if (drawnBlock === null) {
        return locations;
    }
    const cells: HTMLCollection = drawnBlock.children;
    const globalTop: number = parseFloat(drawnBlock.style.top);
    const globalLeft: number = parseFloat(drawnBlock.style.left);
    for (var i = 0; i < cells.length; i++) {
        const top = globalTop + parseFloat((<HTMLDivElement> cells[i]).style.top);
        const left = globalLeft + parseFloat((<HTMLDivElement> cells[i]).style.left);
        const row = Math.floor(top/CELL_SIZE);
        const col = Math.floor(left/CELL_SIZE);
        locations.push([row, col]);
    }
    return locations;
}

function merge(currentBlock) {
    const locations = getPotentialMergeLocations();
    // console.log(locations);
    locations.forEach((location) => {
        CURRENT_GRID[location[0]][location[1]] = currentBlock + 1;
    });
    document.getElementById(CUR_ID).remove();
}

function attemptMoveBlock(down: number, right: number) {
    if (document.getElementById(CUR_ID) === null) {
        return false;
    }
    if (!isCollidingDirection(down, right)) {
        moveBlock(down, right);
        return true;
    }
    return false;
}

function moveBlock(down: number, right: number) {
    const drawnBlock = document.getElementById(CUR_ID);
    drawnBlock.style.top = String(parseFloat(drawnBlock.style.top) + down*CELL_SIZE) + 'px';
    drawnBlock.style.left = String(parseFloat(drawnBlock.style.left) + right*CELL_SIZE) + 'px';
}

function generateBag() {
    const bag: number[] = [0, 1, 2, 3, 4, 5, 6];
    shuffleArray(bag);
    // console.log(bag);
    return bag;
}

// https://stackoverflow.com/a/12646864/8457833 - these answers are interesting, you should read them
function shuffleArray(array) {
    for (var i = array.length-1; i > 0; i--) {
        // const j: number = Math.floor(Math.random() * (i+1));
        const j: number = generator(i+1);
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function isCollidingDirection(down: number, right: number) {
    const locations = getPotentialMergeLocations();
    for (var i=0; i<locations.length; i++) {
        locations[i][0] += down;
        locations[i][1] += right;
    }
    // console.log(locations);
    return isColliding(locations);
}

function isColliding(locations: number[][]) {
    for (const location of locations) {
        try {
            if (CURRENT_GRID[location[0]][location[1]] !== 0) {
                return true;
            }
        } catch (TypeError) { // index out of bounds
            return true;
        }
    }

    return false;
}

function renderGrid() {
    for (var row = 0; row < CURRENT_GRID.length; ++row) {
        for (var col = 0; col < CURRENT_GRID[row].length; ++col) { 
            const cell: HTMLElement = <HTMLElement> document.getElementsByClassName('r' + String(row) + ' c' + String(col))[0];
            if (CURRENT_GRID[row][col] === 0) {
                cell.style.backgroundColor = BG_COLOR;
            } else {
                cell.style.backgroundColor = SHAPES[CURRENT_GRID[row][col] - 1].color;
            }
        }
    }
}

function setupGrid(rows: number, cols: number) {
    for (var row = 0; row < rows; ++row) {
        CURRENT_GRID[row] = [];
        TMP_OLD_GRID[row] = [];
        for (var col = 0; col < cols; ++col) {
            CURRENT_GRID[row][col] = 0;
            TMP_OLD_GRID[row][col] = 0;
        }
    }
}

function createEmptyCell() {
    const cell: HTMLDivElement = document.createElement('div');
    cell.style.position = 'absolute';
    cell.style.margin = '0';
    cell.style.width = String(CELL_SIZE-1) + 'px';
    cell.style.height = String(CELL_SIZE-1) + 'px';
    cell.style.border = '1px solid black';
    return cell;
}

function buildBackground(rows: number, cols: number) {
    const main = document.getElementById('main')
    main.style.width = String(CELL_SIZE * cols + 20) + 'px';
    main.style.height = String(CELL_SIZE * rows + 20) + 'px';
    const canvas: HTMLElement = document.getElementById('canvas');
    canvas.style.width = String(CELL_SIZE * cols) + 'px';
    canvas.style.height = String(CELL_SIZE * rows) + 'px';
    for (var row = 0; row < rows; ++row) {
        for (var col = 0; col < cols; ++col) {
            const cell: HTMLDivElement = createEmptyCell();
            cell.style.top = String(CELL_SIZE * row) + 'px';
            cell.style.left = String(CELL_SIZE * col) + 'px';
            cell.classList.add('r' + String(row), 'c' + String(col));
            cell.style.backgroundColor = BG_COLOR;
            canvas.appendChild(cell);
        }
    }
}