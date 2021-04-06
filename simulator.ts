export {}; // avoid duplicate functions

// https://stackoverflow.com/a/22313621/8457833
// woulda used fun new deno stuff but it has to be the same as browser version
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
    spawnCol: number;

    constructor(structures: string[][]) {
        this.structures = structures;
        this.spawnCol = this.getCenteredColumn(0);
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
}

const DEBUG = false;

const ROWS = 20;
const COLS = 10;
const CURRENT_GRID: number[][] = [];

const SHAPES: Shape[] = [new Shape([['11', '11'],
                                    ['11', '11'],
                                    ['11', '11'],
                                    ['11', '11']]), 
                         new Shape([['0100', '0100', '0100', '0100'],
                                    ['0000', '0000', '1111', '0000'],
                                    ['0100', '0100', '0100', '0100'],
                                    ['0000', '0000', '1111', '0000']]),
                         new Shape([['100', '110', '010'],
                                    ['000', '011', '110'],
                                    ['100', '110', '010'],
                                    ['000', '011', '110']]), 
                         new Shape([['010', '110', '100'],
                                    ['000', '110', '011'],
                                    ['010', '110', '100'],
                                    ['000', '110', '011']]), 
                         new Shape([['010', '010', '011'],
                                    ['000', '111', '100'],
                                    ['110', '010', '010'],
                                    ['001', '111', '000']]), 
                         new Shape([['010', '010', '110'],
                                    ['100', '111', '000'],
                                    ['011', '010', '010'],
                                    ['000', '111', '001']]), 
                         new Shape([['000', '111', '010'],
                                    ['010', '110', '010'],
                                    ['010', '111', '000'],
                                    ['010', '011', '010']])];

var y: number;
var x: number;
var shape: number;
var rotation: number = 0;
var hasHeld: boolean = false;
var justHeld: boolean = false;
var heldBlock: number;
var height: number;
var generator: any;

// old node.js code
// b.toString does something really fucky here that took me about an hour to diagnose
// const b = Buffer.from('', 'base64');
// const arr = Array.from(b);
// const mapped = arr.map(val => String.fromCharCode(val)).join('');
// const eventSequence = decode(mapped);

// new, flashy deno code (read: atob)
// const base64: string = "AAAOWAwpgNCAkkk4FJDDEsMhtW2222220hPCtsJEYNIDDlsPBIBJDAj9MYTnCsgkkknDAhkkknBskjDpNDDMNsEkk4JJJJJYFEE4RYUBhtkHBoJYZhkkkkk4UNgtkEkk4dsPAoYREDBIJJJJLBpIYMJBYIJYEIcjC8kYYdlhlsM4QEkHphlhsgkknDsLBJJJJIYNJDAg4UNhsgnCBIEsBsFgjDhBsNoYYW22222kQgjDAsMkkgkkkYFDCpsJIYdIBoBhsMg4NBYJBJJJJDCkkkkjDgYQAgkJBIIkjBhIYEEkYIJILDJBYQEYNIEhEDkYJIJJJJYUJhtC222222kYNoLDphsYEkg4YNhthJDAgAAkkkkEkkgADBIEkYcEsNJBthYUEklhtBtjBhJDCIYEkEknBlg4QgIkYUkgkkk4YAABBBLgDDphphtBYIFBJJJJJYFBYMYYINtDBEJJJBJYdhsgkYUgjCEYMBgkYFAhYVBIYcNsEkkkYQEINgEgAYYhIYIdsYYNgjCBAkjDkMEkkEk4EDCphpBYNJJJAdJIJJJYJBJJJIDkIIIEgcFBJAcBDCAkEjChhpBYMhBILDBhoDAgYIAAkkkkjDkNsEjAjpJJBJYcDkjBhAhAsEEkknDANhgYQEgkkYIJBIYUNhIBYME4IIJJJJYEYQAkkkg4YBsNBYUBhsJBYcMjBBBBJJLCgBBMELAhBLDhjCAAgYYBDBhBAAAEEkkhYYJhkYFBIYUABINsIYIgkknBkEjDgBtggYQIMgjDAIMYIEJJBJJLCAgkkkkAAdkEAAYMBADCgkBAAJBIYEEYcgBBsNoIYIEkAjCglhkYcAMMJDAkELBkEkhIJjCEFDDEEkkkhhsMAYYJBhsHBEEAYcEIhA9AhBg4MgkDAkIIJJJBJJAYQAIMIcJBhDCkEgAAAIAcEEYYdBJJJEEkkgkkkknAhBIJJJLCABkYUBBjggkDDhIYMBEhjgJMNBJJJIYcBBIAhsEEYQIJgjBgsEYEIDDAlgMgkkkkYIJIJAgAYUJBhoJJJJDAgABIIgkHBoIFBAAYQIMEYYFkEkkkFg4IAkDhkgkkkg4fpBJJJJIYUAEMgkkkjChhsEkkjBgJIYIAgcEDCANAADDAhgghhsgkjDhBMAsEgYEIDCAggJDDggoJJJJBhAYEIEEkDCghINoJB8JBIYYAsNgkYMIEjBBIIYcIMBINgjBBEEkkkg4YEMchkEkkjCgsNggjAggkkkYQIDBoEjCoJBsJDDAAjhBIJhgAhsBMcIIJDCAIIEDApBDBBJIJJIYMAgADCkEIJJJBJJhsYMEIYQBMYcBBJJIYEBIJJIAgYYEFhgsEYIADgsEEkknAgEEhIJDBgg4UAMBhJBJJLBAEggAADDjkEkkkYQAsEYYMNgkYYBoYMEEHDgBhoJBAjBAJAcFgMBhABsEYQFDCgMEgkk4EEEkk4boJJJJYcBoJBDAgggAgkkjCAAADBhAEMggDCgIEMgYIIIDBhAgAEEjDhBMNhDChAAgjAoYYABsEEkkk4IBIJJJYQAAMEMgYMIIIYUBsNDCAAEMMDgEMgkkg4cIJhIDDAYIBBJBJJYEBIYEBAgkkEIYMBIIYYMMjBAADggYQAgkkkkkjCgAEjDhhBDCgAEIAEYNBIYYADoJJJYcBBBsMEYEBIEEJADBAAgkkkDCEEjDgNhjBBBBIYMBhBDAgJBDCBDDAgABBILCgDsNBBYEAEFBBDggAAIBBDAEgDghIIBAADhBkMhgABBJIJJJJJIJJJJJIMEEYIEEgADCAggBAcEFhjCgAgDBgJgjDkEMYQAkEYUBoDAgkDBBIEEkjEkkkgEMMg4I=";
const base64: string = Deno.args[0];
// console.log(base64);
const byteString: string = atob(base64);
// console.log(`decoding ${byteString.length} bytes...`);
const [seed, eventSequence]: [number, number[]] = decode(byteString);
// console.log(`simulating ${eventSequence.length} events...`);
const [simScore, simLines, shapeEvents]: [number, number, number[]] = simulate(eventSequence);
const rngWorks: boolean = verifyRNG(seed, shapeEvents);
// console.log(`Checks - RNG: ${rngWorks}`);
// console.log(`${simScore} points, ${simLines} lines cleared.`);
console.log(rngWorks.toString());
console.log(simScore.toString());

function decode(eventStream: string): [number, number[]] {
    const length = bytesStringToInt(eventStream.slice(0, 4));
    const seed = bytesStringToInt(eventStream.slice(4, 8));
    eventStream = eventStream.slice(8);
    // log(length);
    // log(seed);
    const bitmask = 0b111;
    const sequence: number[] = [];
    for (var i=0; i<eventStream.length; i+=3) {
        const chunkArray = Uint8Array.from([eventStream.charCodeAt(i), eventStream.charCodeAt(i+1), eventStream.charCodeAt(i+2)]);
        // log(i, sequence.length, chunkArray);
        const chunk = (chunkArray[0] << 16) | (chunkArray[1] << 8) | (chunkArray[2]);
        for (var j=0; j<8; j++) {
            const shiftedMask: number = bitmask << 3*(7-j);
            const masked: number = chunk & shiftedMask;
            const num: number = masked >> 3*(7-j);
            sequence.push(num)
        }
    }
    return [seed, sequence.slice(0, length)];
}

function bytesStringToInt(str: string): number {
    var int = 0;
    for (var i=0; i<str.length; i++) {
        int += str.charCodeAt(i) << 8*(str.length - (i+1));
    }
    return int;
}

function verifyRNG(seed: number, shapeEvents: number[]): boolean {
    generator = SeedRandom(seed);
    const lineup: number[] = generateBag();
    for (var i=0; i<shapeEvents.length; i++) {
        var test;
        if ((test = lineup.pop()) !== shapeEvents[i]) {
            log(i, test, shapeEvents[i]);
            return false;
        }
        if (lineup.length <= 6) {
            lineup.unshift(...generateBag());
        }
    }
    return true;
}

function generateBag() {
    const bag: number[] = [0, 1, 2, 3, 4, 5, 6];
    shuffleArray(bag);
    return bag;
}

// https://stackoverflow.com/a/12646864/8457833 - these answers are interesting, you should read them
function shuffleArray(array: number[]) {
    for (var i = array.length-1; i > 0; i--) {
        // const j: number = Math.floor(Math.random() * (i+1));
        const j: number = generator(i+1);
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function simulate(events: number[]): [number, number, number[]] {
    setupGrid(ROWS, COLS);

    // log(events.length)

    const shapeEvents: number[] = [];

    var score: number = 0;
    var lines: number = 0;
    var time: number = timeProgression(lines);

    var phase: number = 0;
    for (var i=0; i<events.length; i++) {
        // logFormattedGrid();
        log('[ ' + events.slice(Math.max(0,i-4), i).join(', ') + ', \x1b[33m' + String(events[i]) + '\x1b[0m, ' + events.slice(i+1, i+5).join(', ') + ' ]');
        log(x, y, height, rotation, score);
        switch (phase) {
            case 0: // shape
            log('phase 0');
            shape = events[i] - 1;
            shapeEvents.push(shape);
            x = SHAPES[shape].spawnCol;
            y = 0;
            rotation = 0;
            updateHeight();
            if (!justHeld) {
                hasHeld = false;
            }
            justHeld = false;
            phase = 1;
            break;

            case 1: // events
            log('phase 1');
            switch (events[i]) {
                case 0:
                if (!attemptMoveBlock(1, 0)) {
                    merge(shape);
                    const [scoreToAdd, linesToAdd] = clearLines(height, time);
                    score += scoreToAdd;
                    lines += linesToAdd;
                    time = timeProgression(lines);
                    phase = 0;
                }
                updateHeight();
                break;
                case 1:
                attemptMoveBlock(0, -1);
                break;
                case 2:
                attemptMoveBlock(0, 1);
                break;
                case 3:
                attemptRotate(true);
                break;
                case 4:
                attemptRotate(false);
                break;
                case 5:
                attemptMoveBlock(1, 0);
                break;
                case 6:
                updateHeight();
                hardDrop();
                break;
                case 7:
                if (!hasHeld) {
                    phase = hold();
                    if (phase === 0) {
                        justHeld = true;
                    } else {
                        x = SHAPES[shape].spawnCol;
                        y = 0;
                        rotation = 0;
                        updateHeight();
                    }
                }
                break;
            }
            break;
        }
    }
    return [score, lines, shapeEvents];
}

function log(...content: any) {
    if (DEBUG) {
        console.log(...content);
    }
}

function timeProgression(linesCleared: number) {
    const a = 20000;
    const b = 100;
    const c = 800;
    return a/(linesCleared + (a/(c - b))) + b;
}

function updateHeight() {
    height = ROWS - y;
}

function merge(currentBlock: number) {
    const locations = getPotentialMergeLocations();
    log(locations);
    locations.forEach((location) => {
        CURRENT_GRID[location[0]][location[1]] = currentBlock + 1;
    });
}

function logFormattedGrid() {
    for (const row of CURRENT_GRID) {
        var formattedString = '';
        for (const cell of row) {
            switch (cell) {
                case 0:
                formattedString += '\x1b[2m';
                break;
                case 1:
                formattedString += '\x1b[31m';
                break;
                case 2:
                formattedString += '\x1b[1;31m';
                break;
                case 3:
                formattedString += '\x1b[36m';
                break;
                case 4:
                formattedString += '\x1b[32m';
                break;
                case 5:
                formattedString += '\x1b[34m';
                break;
                case 6:
                formattedString += '\x1b[35m';
                break;
                case 7:
                formattedString += '\x1b[33m';
                break;
            }
            formattedString += String(cell) + '\x1b[0m ';
        }
        log(formattedString);
    }
}

function clearLines(height: number, time: number): [number, number] {
    logFormattedGrid();
    // log(height);
    var scoreToAdd = 15;
    const rowsToChange: number[] = [];
    for (var row=CURRENT_GRID.length-1; row>=0; row--) {
        if (CURRENT_GRID[row].every(cell => cell > 0)) {
            rowsToChange.push(row);
        }
    }
    // log(rowsToChange);
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
    return [scoreToAdd, rowsToChange.length];
}

function hold() {
    if (!hasHeld) {
        hasHeld = true;
        if (heldBlock === undefined) {
            heldBlock = shape;
            return 0;
        } else {
            [shape, heldBlock] = [heldBlock, shape];
            return 1;
        }
        // log('new shape: ' + shape);
    }
    return 1;
}

function hardDrop() {
    while (attemptMoveBlock(1, 0)) { }
}

function attemptRotate(clockwise: boolean) {
    var newRotation;
    if (clockwise) {
        newRotation = (rotation + 1) % 4;
    } else {
        newRotation = (rotation + 3) % 4;
    }
    const rotated: string[] = SHAPES[shape].structures[newRotation];
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

function attemptMoveBlock(down: number, right: number) {
    if (!isCollidingDirection(down, right)) {
        moveBlock(down, right);
        return true;
    }
    return false;
}

function moveBlock(down: number, right: number) {
    x += right;
    y += down;
}

function isCollidingDirection(down: number, right: number) {
    const locations = getPotentialMergeLocations();
    for (var i=0; i<locations.length; i++) {
        locations[i][0] += down;
        locations[i][1] += right;
    }
    return isColliding(locations);
}

function getPotentialMergeLocations(structure?: string[]) {
    const locations: number[][] = [];
    if (structure === undefined) {
        // log(shape);
        structure = SHAPES[shape].structures[rotation];
    }

    for (var row=0; row<structure.length; row++) {
        for (var col=0; col<structure[row].length; col++) {
            // log(row, col, y, x);
            if (structure[row][col] === '1') {
                locations.push([y+row, x+col]);
            }
        }
    }

    return locations;
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

function setupGrid(rows: number, cols: number) {
    for (var row = 0; row < rows; ++row) {
        CURRENT_GRID[row] = [];
        for (var col = 0; col < cols; ++col) {
            CURRENT_GRID[row][col] = 0;
        }
    }
}
