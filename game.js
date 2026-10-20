const ROWS = 9;
const COLUMNS = 16;
const MAX_LEVEL = 6;
const INITIAL_LIVES = 5;
const INITIAL_HINTS = 3;
const INITIAL_SHUFFLES = 3;
const INITIAL_TIME = 300;
const MIN_TIME = 60;
const TIME_PER_LEVEL = 10;
const PAIRS_PER_CELL_LIMIT = 10;
const SHUFFLE_TRIES = 100;
const images = ["images/pikachu1.png", "images/pikachu2.png", "images/pikachu3.png",
                "images/pikachu4.png", "images/pikachu5.png", "images/pikachu6.png",
                "images/pikachu7.png", "images/pikachu8.png", "images/pikachu9.png",
                "images/pikachu10.png", "images/pikachu11.png", "images/pikachu12.png"];

const SKILL_TYPES = ["teleport", "destroy", "double", "freeze"];
const MEMORY_REVEAL_INITIAL_MIN_MS = 2200;
const MEMORY_REVEAL_INITIAL_MAX_MS = 6500;
const MEMORY_REVEAL_DURATION_MIN_MS = 1500;
const MEMORY_REVEAL_DURATION_MAX_MS = 4500;
const MEMORY_MAX_REVEALS_PER_CELL = 3;
const ICE_NEEDED_PAIRS = 2;
const ICE_COVER_RATIO = 0.35;
const ICE_STATUS_TEXT_ID = "iceStatusText";
const ICE_PROGRESS_FILL_ID = "iceProgressFill";

let board = [];
let score = 0;
let levelScore = 0;
let level = 1;
let lives = INITIAL_LIVES;
let hintCount = INITIAL_HINTS;
let shuffleCount = INITIAL_SHUFFLES;
let time = INITIAL_TIME;
let maxTime = INITIAL_TIME;
let timer = null;

let selected = null;
let gameEnded = false;
let paused = false;
let sound = true;
let moveCount = 0;

let obstacles = [];
let skillCells = [];
let skillActivated = 0;
let doubleScore = false;
let transformMoveCount = 0;

let nightCenterRow = 3;
let nightCenterCol = 6;
let nightRadius = 3;
let nightTimeCount = 0;

let memoryVisible = true;
let hiddenCells = [];
let memoryRevealCount = {};
let memoryRevealTimers = {};
let level5Selected = [];
let level5HiddenReveal = {};
let level5Processing = false;
let memoryHideTimer = null;

let boardShuffleTimer = null;

let iceBoard = [];
let iceProgress = 0;

const boardElement = document.getElementById("board");
const scoreElement = document.getElementById("score");
const levelElement = document.getElementById("level");
const levelScoreElement = document.getElementById("levelScore");
const messageElement = document.getElementById("message");
const pathElement = document.getElementById("path");
const timeElement = document.getElementById("time");
const timeProgress = document.getElementById("timeProgress");

const correctSound = document.getElementById("correctSound");
const wrongSound = document.getElementById("wrongSound");
const levelUpSound = document.getElementById("levelUpSound");
const shuffleSound = document.getElementById("shuffleSound");

const newButton = document.getElementById("newButton");
const hintButton = document.getElementById("hintButton");
const hintCountElement = document.querySelector(".hint-count");
const shuffleButton = document.getElementById("shuffleButton");
const shuffleCountElement = document.querySelector(".shuffle-count");
const pauseButton = document.getElementById("pauseButton");
const pauseIconElement = document.getElementById("pauseIcon");
const pauseTextElement = document.getElementById("pauseText");
const soundButton = document.getElementById("soundButton");
const soundIconElement = document.getElementById("soundIcon");
const soundTextElement = document.getElementById("soundText");
const iceBreakButton = document.getElementById("iceBreakButton");
const iceBreakCountElement = document.getElementById("iceBreakCount");
const iceStatusElement = document.getElementById("iceStatus");
const iceStatusTextElement = document.getElementById(ICE_STATUS_TEXT_ID);
const iceProgressFillElement = document.getElementById(ICE_PROGRESS_FILL_ID);
const exitButton = document.getElementById("exitButton");

const levelButton = document.getElementById("levelButton");
const levelModal = document.getElementById("levelModal");
const closeLevelButton = document.getElementById("closeLevelButton");
const levelSelectButtons = document.querySelectorAll(".level-select-button");
const heartIcons = document.querySelectorAll("#lives .heart-icon");

function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const swapIndex = Math.floor(Math.random() * (i + 1));
        const temp = array[i];
        array[i] = array[swapIndex];
        array[swapIndex] = temp;
    }
}

function playSound(audio) {
    if (!sound || !audio) return;
    audio.currentTime = 0;
    audio.play().catch(function () {});
}

function showMessage(text) {
    messageElement.textContent = text;
}

function sameCell(a, b) {
    return a.row === b.row && a.col === b.col;
}

function makeCell(row, col) {
    return { row: row, col: col };
}

function isInsideBoard(row, col) {
    return row >= 0 && row < ROWS && col >= 0 && col < COLUMNS;
}

function randomInt(maxExclusive) {
    return Math.floor(Math.random() * maxExclusive);
}

function countClosePairs() {
    let pairs = 0;
    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLUMNS; col++) {
            if (board[row][col] < 0) continue;
            if (col + 1 < COLUMNS && board[row][col] === board[row][col + 1]) pairs++;
            if (row + 1 < ROWS && board[row][col] === board[row + 1][col]) pairs++;
        }
    }
    return pairs;
}

function fillBoardFromValues(values) {
    let index = 0;
    for (let row = 0; row < ROWS; row++) {
        board[row] = [];
        for (let col = 0; col < COLUMNS; col++) {
            board[row][col] = values[index];
            index++;
        }
    }
}

function generatePairValues() {
    const values = [];
    for (let i = 0; i < ROWS * COLUMNS / 2; i++) {
        const imageIndex = i % images.length;
        values.push(imageIndex, imageIndex);
    }
    return values;
}

function createBoard() {
    const values = generatePairValues();
    let tries = 0;
    do {
        shuffle(values);
        fillBoardFromValues(values);
        tries++;
        if (countClosePairs() <= PAIRS_PER_CELL_LIMIT) break;
    } while (tries < SHUFFLE_TRIES);
    if (level !== 4) {
        while (!hasMove()) shuffleBoardData();
    }
}

function shuffleBoardData() {
    const values = [];
    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLUMNS; col++) {
            if (board[row][col] >= 0) values.push(board[row][col]);
        }
    }

    let tries = 0;
    do {
        shuffle(values);
        let index = 0;
        for (let row = 0; row < ROWS; row++) {
            for (let col = 0; col < COLUMNS; col++) {
                if (board[row][col] >= 0) {
                    board[row][col] = values[index];
                    index++;
                }
            }
        }
        tries++;
        if (countClosePairs() <= PAIRS_PER_CELL_LIMIT) break;
    } while (tries < SHUFFLE_TRIES);
}

function ensureHasMove() {
    let tries = 0;
    while (!hasMove() && tries < SHUFFLE_TRIES) {
        shuffleBoardData();
        tries++;
    }
}

function canGo(row, col, start, end) {
    if (row < -1 || row > ROWS || col < -1 || col > COLUMNS) return false;
    if (row === -1 || row === ROWS || col === -1 || col === COLUMNS) return true;
    if (sameCell({ row: row, col: col }, start)) return true;
    if (sameCell({ row: row, col: col }, end)) return true;
    if ((level === 2 || level === 3) && isObstacle(row, col)) return false;
    if (level === 3 && getSkill(row, col)) return false;
    if (level === 6 && isIce(row, col)) return false;
    return board[row][col] === -1;
}

function findPath(start, end) {
    const directions = [{ row: -1, col: 0 }, { row: 1, col: 0 }, { row: 0, col: -1 }, { row: 0, col: 1 }];
    const queue = [{ row: start.row, col: start.col, dir: -1, turns: 0, path: [makeCell(start.row, start.col)] }];
    const visited = {};

    while (queue.length > 0) {
        const current = queue.shift();
        for (let dir = 0; dir < 4; dir++) {
            let turns = current.turns;
            if (current.dir !== -1 && current.dir !== dir) turns++;
            if (turns > 2) continue;

            const newRow = current.row + directions[dir].row;
            const newCol = current.col + directions[dir].col;

            if (newRow === end.row && newCol === end.col) {
                return current.path.concat([makeCell(newRow, newCol)]);
            }

            if (!canGo(newRow, newCol, start, end)) continue;

            const key = newRow + "," + newCol + "," + dir;
            if (visited[key] !== undefined && visited[key] <= turns) continue;
            visited[key] = turns;

            queue.push({ row: newRow, col: newCol, dir: dir, turns: turns, path: current.path.concat([makeCell(newRow, newCol)]) });
        }
    }
    return null;
}

function hasMove() {
    for (let rowA = 0; rowA < ROWS; rowA++) {
        for (let colA = 0; colA < COLUMNS; colA++) {
            if (board[rowA][colA] < 0) continue;
            if (level === 4 && !inNightView(rowA, colA)) continue;

            for (let rowB = 0; rowB < ROWS; rowB++) {
                for (let colB = 0; colB < COLUMNS; colB++) {
                    if (rowA === rowB && colA === colB) continue;
                    if (board[rowA][colA] !== board[rowB][colB]) continue;
                    if (level === 4 && !inNightView(rowB, colB)) continue;
                    if (findPath(makeCell(rowA, colA), makeCell(rowB, colB)) !== null) return true;
                }
            }
        }
    }
    return false;
}

function drawPath(path) {
    clearPath();
    const cellSize = 56;
    let points = "";
    for (let i = 0; i < path.length; i++) {
        const point = path[i];
        let x = point.col * cellSize + 28;
        let y = point.row * cellSize + 28;
        if (point.col === -1) x = 0;
        if (point.col === COLUMNS) x = COLUMNS * cellSize;
        if (point.row === -1) y = 0;
        if (point.row === ROWS) y = ROWS * cellSize;
        points += x + "," + y + " ";
    }
    const line = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
    line.setAttribute("points", points);
    line.setAttribute("class", "path-line");
    pathElement.appendChild(line);
}

function clearPath() {
    pathElement.innerHTML = "";
}

function removeSelected() {
    const cells = document.querySelectorAll(".cell");
    cells.forEach(function (cell) {
        cell.classList.remove("selected");
    });
    selected = null;
}

function markPair(first, second, className) {
    const cells = document.querySelectorAll(".cell");
    cells.forEach(function (cellElement) {
        const row = Number(cellElement.dataset.row);
        const col = Number(cellElement.dataset.col);
        if (sameCell({ row: row, col: col }, first) || sameCell({ row: row, col: col }, second)) {
            cellElement.classList.remove("selected");
            cellElement.classList.add(className);
        }
    });
}

function clearPairMark(className) {
    const cells = document.querySelectorAll(".cell");
    cells.forEach(function (cellElement) {
        cellElement.classList.remove(className);
    });
}

function renderBoard() {
    boardElement.innerHTML = "";
    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLUMNS; col++) {
            const cell = document.createElement("div");
            cell.className = "cell";
            cell.dataset.row = row;
            cell.dataset.col = col;
            applyCellState(cell, row, col);
            cell.addEventListener("click", clickCell);
            boardElement.appendChild(cell);
        }
    }
}

function applyCellState(cell, row, col) {
    const showImage = shouldShowImage(row, col);
    const nightVisible = isVisibleAtNight(row, col);

    if (!nightVisible) cell.classList.add("night-hidden");
    if (!showImage) cell.classList.add("memory-hidden");
    if (isSelectedForMemory(row, col)) cell.classList.add("selected");
    if (level === 6 && isIce(row, col)) {
        cell.classList.add("ice-cell");
        cell.classList.add("ice-thawing");
    }

    if ((level === 2 || level === 3) && isObstacle(row, col)) {
        cell.classList.add("obstacle");
        return;
    }
    if (level === 3 && getSkill(row, col)) {
        const skill = getSkill(row, col);
        cell.classList.add("skill-cell", "skill-" + skill.type);
        return;
    }
    if (board[row][col] !== -1 && nightVisible && showImage) {
        const image = document.createElement("img");
        image.src = images[board[row][col]];
        image.alt = "pikachu";
        cell.appendChild(image);
    }
}

function isVisibleAtNight(row, col) {
    if (level !== 4) return true;
    return inNightView(row, col);
}

function shouldShowImage(row, col) {
    if (level !== 5 || memoryVisible) return true;
    const revealed = level5HiddenReveal.hasOwnProperty(memoryCellKey(row, col));
    if (revealed) return true;
    if (isSelectedForMemory(row, col)) return true;
    return !isHiddenMemoryCell(row, col);
}

function isHiddenMemoryCell(row, col) {
    return hiddenCells.some(function (cell) {
        return sameCell(cell, { row: row, col: col });
    });
}

function isSelectedForMemory(row, col) {
    return level5Selected.some(function (cell) {
        return sameCell(cell, { row: row, col: col });
    });
}

function memoryCellKey(row, col) {
    return row + "_" + col;
}

function clickCell(event) {
    if (paused || gameEnded) return;

    const cell = event.currentTarget;
    const row = Number(cell.dataset.row);
    const col = Number(cell.dataset.col);

    if (level === 5) {
        clickMemoryCell(row, col);
        return;
    }
    if (level === 6) {
        clickLevel6(row, col);
        return;
    }
    if (level === 4 && !inNightView(row, col)) {
        showMessage("Ô này đang nằm trong bóng tối");
        return;
    }
    if ((level === 2 || level === 3) && isObstacle(row, col)) return;
    if (level === 3 && getSkill(row, col)) {
        activateSkill(row, col);
        return;
    }
    if (board[row][col] === -1) return;

    handleNormalSelection(row, col, cell);
}

function handleNormalSelection(row, col, cell) {
    if (selected === null) {
        selected = makeCell(row, col);
        cell.classList.add("selected");
        return;
    }
    if (sameCell(selected, makeCell(row, col))) {
        removeSelected();
        return;
    }
    checkPair(selected, makeCell(row, col));
}

function checkPair(first, second) {
    if (board[first.row][first.col] !== board[second.row][second.col]) {
        markPair(first, second, "pair-wrong");
        handleWrongSelection("Hai hình không giống nhau");
        setTimeout(function () { clearPairMark("pair-wrong"); }, 700);
        return;
    }

    const path = findPath(first, second);
    if (path !== null) {
        markPair(first, second, "pair-correct");
        playSound(correctSound);
        drawPath(path);
        setTimeout(function () {
            clearPath();
            clearPairMark("pair-correct");
            removePair(first, second);
        }, 500);
        return;
    }

    markPair(first, second, "pair-wrong");
    handleWrongSelection("Không thể nối hai hình này");
    setTimeout(function () { clearPairMark("pair-wrong"); }, 700);
}

function removePair(first, second) {
    board[first.row][first.col] = -1;
    board[second.row][second.col] = -1;

    if (level === 2) afterLevel2Match(moveCount);
    if (level === 3) transformMoveCount++;
    if (level === 6) iceProgress++;

    if (doubleScore) {
        addScore(20);
        doubleScore = false;
    } else {
        addScore(10);
    }
    selected = null;
    clearPath();
    refreshAfterMatch();
}

function refreshAfterMatch() {
    if (level === 6) updateIceStatus();
    if (checkWin()) {
        renderBoard();
        winLevel();
        return;
    }
    if (level === 3 && transformMoveCount % 2 === 0) {
        transformLevel3Board();
    }
    renderBoard();
    if (level === 6) showIceProgressMessage();
    if (level === 4) handleLevel4AfterMatch();
}

function setupLevel2() {
    moveCount = 0;
    obstacles = [];
    createBoard();
    placeLevel2Obstacles();
}

function placeLevel2Obstacles() {
    obstacles = pickSpreadPositions(6);
    const values = [];
    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLUMNS; col++) {
            values.push(board[row][col]);
        }
    }

    const types = [];
    for (let i = 0; i < images.length; i++) types.push(i);
    shuffle(types);

    const removeMap = {};
    for (let i = 0; i < 3; i++) removeMap[types[i]] = 2;

    const remaining = [];
    values.forEach(function (value) {
        if (removeMap[value] > 0) removeMap[value]--;
        else remaining.push(value);
    });

    let tries = 0;
    do {
        shuffle(remaining);
        let index = 0;
        for (let row = 0; row < ROWS; row++) {
            for (let col = 0; col < COLUMNS; col++) {
                if (isObstacle(row, col)) continue;
                board[row][col] = remaining[index];
                index++;
            }
        }
        tries++;
        if (countClosePairs() <= PAIRS_PER_CELL_LIMIT) break;
    } while (tries < SHUFFLE_TRIES);
    obstacles.forEach(function (obstacle) {
        board[obstacle.row][obstacle.col] = -1;
    });
    ensureHasMove();
}

function afterLevel2Match(matchesSoFar) {
    moveCount = matchesSoFar + 1;
    if (moveCount % 6 === 0) {
        rotateLevel2Area();
        ensureHasMove();
        showMessage("Khu vực bản đồ đã được xoay");
        return;
    }
    if (moveCount % 3 === 0) {
        shiftRandomRow();
        ensureHasMove();
        showMessage("Một hàng đã được thay đổi vị trí");
    }
}

function rotateLevel2Area() {
    const startRow = 2;
    const startCol = 5;
    const size = 4;
    const positions = [];
    const values = [];
    for (let row = startRow; row < startRow + size; row++) {
        for (let col = startCol; col < startCol + size; col++) {
            if (!isObstacle(row, col)) {
                positions.push(makeCell(row, col));
                values.push(board[row][col]);
            }
        }
    }
    if (values.length <= 1) return;

    values.unshift(values.pop());
    for (let i = 0; i < positions.length; i++) {
        const cell = positions[i];
        board[cell.row][cell.col] = values[i];
    }
}

function shiftRandomRow() {
    const rowIndex = randomInt(ROWS);
    const cols = [];
    for (let col = 0; col < COLUMNS; col++) {
        if (!isObstacle(rowIndex, col)) cols.push(col);
    }
    if (cols.length <= 1) return;
    const values = cols.map(function (col) { return board[rowIndex][col]; });
    values.unshift(values.pop());
    for (let i = 0; i < cols.length; i++) {
        board[rowIndex][cols[i]] = values[i];
    }
}

function isObstacle(row, col) {
    return obstacles.some(function (cell) {
        return cell.row === row && cell.col === col;
    });
}

function pickSpreadPositions(count) {
    const positions = [];
    while (positions.length < count) {
        const row = randomInt(ROWS);
        const col = randomInt(COLUMNS);
        const tooClose = positions.some(function (existing) {
            const distance = Math.abs(existing.row - row) + Math.abs(existing.col - col);
            return distance < 3;
        });
        if (!tooClose) positions.push(makeCell(row, col));
    }
    return positions;
}

function setupLevel3() {
    transformMoveCount = 0;
    obstacles = [];
    skillCells = [];
    skillActivated = 0;
    doubleScore = false;
    createBoard();
    placeLevel3Elements();
}

function placeLevel3Elements() {
    const special = pickSpreadPositions(12);
    obstacles = [];
    skillCells = [];
    for (let i = 0; i < 8; i++) {
        obstacles.push(makeCell(special[i].row, special[i].col));
    }
    for (let i = 0; i < 4; i++) {
        skillCells.push({
            row: special[i + 8].row,
            col: special[i + 8].col,
            type: SKILL_TYPES[i]
        });
    }
    const pairCount = (ROWS * COLUMNS - obstacles.length - skillCells.length) / 2;
    const pairValues = [];
    for (let i = 0; i < pairCount; i++) {
        const imageIndex = i % images.length;
        pairValues.push(imageIndex, imageIndex);
    }
    let tries = 0;
    do {
        shuffle(pairValues);
        fillLevel3Board(pairValues);
        tries++;
        if (countClosePairs() <= PAIRS_PER_CELL_LIMIT) break;
    } while (tries < SHUFFLE_TRIES);
    ensureHasMove();
}

function fillLevel3Board(pairValues) {
    let index = 0;
    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLUMNS; col++) {
            if (isObstacle(row, col)) {
                board[row][col] = -1;
                continue;
            }
            const skill = getSkill(row, col);
            if (skill) {
                board[row][col] = skillValue(skill.type);
                continue;
            }
            board[row][col] = pairValues[index];
            index++;
        }
    }
}

function getSkill(row, col) {
    return skillCells.find(function (cell) {
        return cell.row === row && cell.col === col;
    });
}

function skillValue(type) {
    if (type === "teleport") return -2;
    if (type === "destroy") return -3;
    if (type === "double") return -4;
    if (type === "freeze") return -5;
    return -1;
}

function activateSkill(row, col) {
    if (paused || gameEnded) return;
    const skillIndex = skillCells.findIndex(function (cell) {
        return cell.row === row && cell.col === col;
    });
    if (skillIndex === -1) return;
    const skill = skillCells[skillIndex];
    skillCells.splice(skillIndex, 1);
    board[row][col] = -1;
    skillActivated++;

    runSkill(skill.type);
    renderBoard();
    showMessage("Đã kích hoạt " + skillActivated + "/4 kỹ năng");
}

function runSkill(type) {
    if (type === "teleport") useTeleport();
    else if (type === "destroy") useDestroy();
    else if (type === "double") useDouble();
    else if (type === "freeze") useFreeze();
}

function useTeleport() {
    const emptyCells = [];
    const imageCells = [];
    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLUMNS; col++) {
            if (isObstacle(row, col) || getSkill(row, col)) continue;
            if (board[row][col] === -1) emptyCells.push(makeCell(row, col));
            else if (board[row][col] >= 0) imageCells.push(makeCell(row, col));
        }
    }
    if (emptyCells.length === 0 || imageCells.length === 0) {
        showMessage("Không thể sử dụng Teleport");
        return;
    }
    const from = imageCells[randomInt(imageCells.length)];
    const to = emptyCells[randomInt(emptyCells.length)];
    board[to.row][to.col] = board[from.row][from.col];
    board[from.row][from.col] = -1;
    showMessage("Đã dịch chuyển một hình");
}

function useDestroy() {
    if (obstacles.length === 0) {
        showMessage("Không còn chướng ngại vật");
        return;
    }
    const index = randomInt(obstacles.length);
    const obstacle = obstacles[index];
    board[obstacle.row][obstacle.col] = -1;
    obstacles.splice(index, 1);
    showMessage("Phá chướng ngại vật thành công");
}

function useDouble() {
    doubleScore = true;
    showMessage("Lượt ghép tiếp theo được nhân đôi điểm");
}

function useFreeze() {
    paused = true;
    showMessage("Đóng băng thời gian trong 5 giây");
    setTimeout(function () {
        if (!gameEnded) {
            paused = false;
            showMessage("Thời gian tiếp tục chạy");
        }
    }, 5000);
}

function transformLevel3Board() {
    const typePositions = {};
    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLUMNS; col++) {
            const value = board[row][col];
            if (value < 0) continue;
            if (!typePositions[value]) typePositions[value] = [];
            typePositions[value].push(makeCell(row, col));
        }
    }

    const types = Object.keys(typePositions).map(Number);
    if (types.length < 2) return;

    shuffle(types);
    const typeA = types[0];
    const typeB = types[1];
    const positionsA = typePositions[typeA];
    const positionsB = typePositions[typeB];
    const changeCount = Math.min(
        Math.floor(positionsA.length / 2),
        Math.floor(positionsB.length / 2)
    );
    if (changeCount < 1) return;

    shuffle(positionsA);
    shuffle(positionsB);
    for (let i = 0; i < changeCount; i++) {
        board[positionsA[i].row][positionsA[i].col] = typeB;
        board[positionsB[i].row][positionsB[i].col] = typeA;
    }
    ensureHasMove();
    showMessage("Sau 2 cặp, một số hình trên bàn đã tự động biến đổi");
}

function setupLevel4() {
    let tries = 0;
    do {
        createBoard();
        nightCenterRow = 3;
        nightCenterCol = 6;
        tries++;
        if (findNightCenter(true)) return;
    } while (tries < 80);
    recoverLevel4Move();
}

function inNightView(row, col) {
    return Math.abs(row - nightCenterRow) <= nightRadius &&
        Math.abs(col - nightCenterCol) <= nightRadius;
}

function hasNonEmptyInNightZone() {
    for (let row = nightCenterRow - nightRadius; row <= nightCenterRow + nightRadius; row++) {
        for (let col = nightCenterCol - nightRadius; col <= nightCenterCol + nightRadius; col++) {
            if (!isInsideBoard(row, col)) continue;
            if (board[row][col] >= 0) return true;
        }
    }
    return false;
}

function findNightCenter(keepCurrentOk) {
    const centers = [];
    for (let row = 1; row < ROWS - 1; row++) {
        for (let col = 1; col < COLUMNS - 1; col++) {
            if (!keepCurrentOk && row === nightCenterRow && col === nightCenterCol) continue;
            const savedRow = nightCenterRow;
            const savedCol = nightCenterCol;
            nightCenterRow = row;
            nightCenterCol = col;
            const ok = hasMove();
            nightCenterRow = savedRow;
            nightCenterCol = savedCol;
            if (ok) centers.push(makeCell(row, col));
        }
    }
    if (centers.length === 0) return false;
    const chosen = centers[randomInt(centers.length)];
    nightCenterRow = chosen.row;
    nightCenterCol = chosen.col;
    return true;
}

function recoverLevel4Move() {
    let tries = 0;
    while (tries < 50) {
        shuffleBoardData();
        if (findNightCenter(true) && hasNonEmptyInNightZone()) return true;
        tries++;
    }
    return false;
}

function refreshLevel4View(preferOtherCenter) {
    if (preferOtherCenter && findNightCenter()) return true;
    if (findNightCenter(true) && hasNonEmptyInNightZone()) return true;
    if (recoverLevel4Move()) return true;
    let tries = 0;
    while (tries < 30) {
        shuffleBoardData();
        if (findNightCenter(true) && hasNonEmptyInNightZone()) return true;
        tries++;
    }
    return false;
}

function handleLevel4AfterMatch() {
    if (!hasMove()) {
        nightTimeCount = 0;
        showMessage("Không còn nước đi - đang chuyển vùng sáng");
        setTimeout(function () {
            if (gameEnded || level !== 4) return;
            if (refreshLevel4View(true)) {
                renderBoard();
                showMessage("Bóng tối đã thay đổi vị trí nhìn");
            } else {
                shuffleBoardData();
                ensureHasMove();
                let placed = false;
                for (let i = 0; i < 50 && !placed; i++) {
                    if (findNightCenter(true) && hasNonEmptyInNightZone()) placed = true;
                }
                if (!placed) findNightCenter(true);
                renderBoard();
                showMessage("Bàn chơi đã được xáo lại");
            }
        }, 300);
    } else {
        showMessage("Đã nối thành công");
    }
}

function setupLevel5() {
    createBoard();
    hiddenCells = [];
    level5Selected = [];
    level5Processing = false;
    memoryVisible = true;
    memoryRevealCount = {};
    level5HiddenReveal = {};
    clearAllMemoryRevealTimers();
    clearTimeout(memoryHideTimer);
    renderBoard();
    showMessage("Hãy ghi nhớ vị trí các hình!");

    const duration = MEMORY_REVEAL_INITIAL_MIN_MS +
        randomInt(MEMORY_REVEAL_INITIAL_MAX_MS - MEMORY_REVEAL_INITIAL_MIN_MS);
    memoryHideTimer = setTimeout(hideMemoryCells, duration);
}

function clearAllMemoryRevealTimers() {
    Object.keys(memoryRevealTimers).forEach(function (key) {
        if (memoryRevealTimers.hasOwnProperty(key)) clearTimeout(memoryRevealTimers[key]);
    });
    memoryRevealTimers = {};
}

function hideMemoryCells() {
    if (gameEnded || level !== 5) return;
    if (paused) {
        memoryHideTimer = setTimeout(hideMemoryCells, 500);
        return;
    }

    const positions = [];
    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLUMNS; col++) {
            if (board[row][col] >= 0) positions.push(makeCell(row, col));
        }
    }
    shuffle(positions);

    hiddenCells = positions.slice(0, 12);
    memoryVisible = false;
    level5Selected = [];
    level5Processing = false;
    memoryRevealCount = {};
    level5HiddenReveal = {};
    clearAllMemoryRevealTimers();
    renderBoard();
    showMessage("Hãy nhớ vị trí các hình đã bị che");
}

function scheduleMemoryRehide(row, col) {
    const key = memoryCellKey(row, col);
    clearTimeout(memoryRevealTimers[key]);
    const duration = MEMORY_REVEAL_DURATION_MIN_MS +
        randomInt(MEMORY_REVEAL_DURATION_MAX_MS - MEMORY_REVEAL_DURATION_MIN_MS);
    memoryRevealTimers[key] = setTimeout(function () {
        if (level !== 5 || gameEnded) return;
        const stillSelected = level5Selected.some(function (cell) {
            return cell.row === row && cell.col === col;
        });
        if (stillSelected) return;
        const stillHidden = hiddenCells.some(function (cell) {
            return cell.row === row && cell.col === col;
        });
        if (!stillHidden) return;
        delete memoryRevealTimers[key];
        delete level5HiddenReveal[key];
        renderBoard();
    }, duration);
}

function clickMemoryCell(row, col) {
    if (memoryVisible) {
        showMessage("Hãy ghi nhớ vị trí các hình!");
        return;
    }
    if (level5Processing) return;
    if (board[row][col] === -1) return;

    const key = memoryCellKey(row, col);
    const existingIndex = level5Selected.findIndex(function (cell) {
        return sameCell(cell, makeCell(row, col));
    });

    if (existingIndex !== -1) {
        level5Selected.splice(existingIndex, 1);
        showMessage("Đã bỏ chọn ô");
        renderBoard();
        return;
    }

    const hidden = isHiddenMemoryCell(row, col);
    const revealed = level5HiddenReveal.hasOwnProperty(key);

    if (hidden && revealed) {
        if (memoryRevealCount[key] > 0) memoryRevealCount[key]--;
        clearTimeout(memoryRevealTimers[key]);
        delete memoryRevealTimers[key];
        delete level5HiddenReveal[key];
        showMessage("Đã đóng ô ẩn - hoàn lại 1 lượt mở");
        renderBoard();
        return;
    }

    if (hidden) {
        if (!memoryRevealCount[key]) memoryRevealCount[key] = 0;
        if (memoryRevealCount[key] >= MEMORY_MAX_REVEALS_PER_CELL) {
            showMessage("Ô ẩn này đã hết lượt mở - hãy dùng trí nhớ");
            return;
        }
        memoryRevealCount[key]++;
        level5HiddenReveal[key] = true;
        scheduleMemoryRehide(row, col);
        showMessage("Đã mở ô ẩn (" + memoryRevealCount[key] + "/" + MEMORY_MAX_REVEALS_PER_CELL + ") - click lại để chọn hoặc đóng");
    }

    level5Selected.push(makeCell(row, col));
    renderBoard();

    if (level5Selected.length < 2) return;

    level5Processing = true;
    resolveMemoryMatch();
}

function resolveMemoryMatch() {
    const first = level5Selected[0];
    const second = level5Selected[1];

    if (board[first.row][first.col] !== board[second.row][second.col]) {
        finishMemoryAttempt(false, "Sai cặp");
        return;
    }

    const path = findPath(first, second);
    if (path === null) {
        finishMemoryAttempt(false, "Hai hình giống nhau nhưng không thể nối");
        return;
    }

    markPair(first, second, "pair-correct");
    playSound(correctSound);
    drawPath(path);
    setTimeout(function () {
        clearPath();
        clearPairMark("pair-correct");
        board[first.row][first.col] = -1;
        board[second.row][second.col] = -1;

        hiddenCells = hiddenCells.filter(function (pos) {
            return !sameCell(pos, first) && !sameCell(pos, second);
        });
        finalizeMemoryReveal(first);
        finalizeMemoryReveal(second);

        level5Selected = [];
        level5Processing = false;
        addScore(10);
        renderBoard();

        if (checkWin()) {
            winLevel();
            return;
        }
        showMessage("Đúng cặp");
    }, 500);
}

function finishMemoryAttempt(incorrect, message) {
    if (incorrect) {
        markPair(level5Selected[0], level5Selected[1], "pair-wrong");
        handleWrongSelection(message);
    }
    setTimeout(function () {
        clearPairMark("pair-wrong");
        clearPendingMemoryReveals(level5Selected[0], level5Selected[1]);
        level5Selected = [];
        level5Processing = false;
        renderBoard();
    }, 700);
}

function isHiddenCell(row, col) {
    return hiddenCells.some(function (cell) {
        return sameCell(cell, makeCell(row, col));
    });
}

function finalizeMemoryReveal(cell) {
    const key = memoryCellKey(cell.row, cell.col);
    clearTimeout(memoryRevealTimers[key]);
    delete memoryRevealTimers[key];
    delete level5HiddenReveal[key];
}

function clearPendingMemoryReveals(first, second) {
    [first, second].forEach(function (cell) {
        if (!isHiddenCell(cell.row, cell.col)) return;
        const key = memoryCellKey(cell.row, cell.col);
        if (memoryRevealCount[key] > 0) memoryRevealCount[key]--;
        clearTimeout(memoryRevealTimers[key]);
        delete memoryRevealTimers[key];
        delete level5HiddenReveal[key];
    });
}

function isIce(row, col) {
    return Boolean(iceBoard[row] && iceBoard[row][col]);
}

function countIceCells() {
    let total = 0;
    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLUMNS; col++) {
            if (isIce(row, col)) total++;
        }
    }
    return total;
}

function generateIceLayout() {
    iceBoard = [];
    for (let row = 0; row < ROWS; row++) {
        iceBoard[row] = [];
        for (let col = 0; col < COLUMNS; col++) iceBoard[row][col] = false;
    }

    const imageCells = [];
    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLUMNS; col++) {
            if (board[row][col] >= 0) imageCells.push(makeCell(row, col));
        }
    }
    shuffle(imageCells);

    const iceTarget = Math.floor(imageCells.length * ICE_COVER_RATIO);
    for (let i = 0; i < iceTarget && i < imageCells.length; i++) {
        const cell = imageCells[i];
        iceBoard[cell.row][cell.col] = true;
    }
}

function setupLevel6() {
    clearTimeout(boardShuffleTimer);
    iceBoard = [];
    iceProgress = 0;
    createBoard();
    generateIceLayout();

    let tries = 0;
    while (!hasMove() && tries < 40) {
        shuffleBoardData();
        generateIceLayout();
        tries++;
    }
    if (!hasMove()) ensureHasMove();

    renderBoard();
    updateIceStatus();
    showMessage("Level 6 - Băng Giá: Ghép 2 cặp để có 1 lượt tan băng. Click ô ❄ để mở khóa!");
}

function updateIceStatus() {
    if (level !== 6) {
        iceStatusElement.style.display = "none";
        iceBreakButton.style.display = "none";
        return;
    }
    iceStatusElement.style.display = "block";
    iceBreakButton.style.display = "flex";

    const remaining = countIceCells();
    iceStatusTextElement.textContent = "Băng giá: " + iceProgress + "/" + ICE_NEEDED_PAIRS +
        " - Còn " + remaining + " ô ❄";
    iceProgressFillElement.style.width =
        Math.min(100, (iceProgress / ICE_NEEDED_PAIRS) * 100) + "%";
    iceBreakCountElement.textContent = iceProgress;

    if (iceProgress >= ICE_NEEDED_PAIRS) {
        iceBreakButton.classList.add("ready");
        iceBreakCountElement.classList.remove("empty");
    } else {
        iceBreakButton.classList.remove("ready");
        iceBreakCountElement.classList.toggle("empty", iceProgress <= 0);
    }
}

function showIceProgressMessage() {
    if (iceProgress >= ICE_NEEDED_PAIRS) {
        showMessage("Đã có lượt tan băng! Click vào ô ❄ hoặc nút Tan băng");
    } else {
        showMessage("Đã ghép cặp - cần " + (ICE_NEEDED_PAIRS - iceProgress) + " cặp nữa để tan băng");
    }
}

function meltIceAt(row, col) {
    if (!isIce(row, col)) return false;
    if (iceProgress < ICE_NEEDED_PAIRS) {
        showMessage("Cần ghép thêm " + (ICE_NEEDED_PAIRS - iceProgress) + " cặp để có lượt tan băng");
        return false;
    }

    iceBoard[row][col] = false;
    iceProgress -= ICE_NEEDED_PAIRS;
    playSound(correctSound);
    renderBoard();
    updateIceStatus();
    showMessage("Đã tan băng ô (" + (row + 1) + "," + (col + 1) + ") - Còn " + countIceCells() + " ô ❄");

    if (checkWin()) {
        renderBoard();
        winLevel();
    }
    return true;
}

function meltIceManual() {
    if (level !== 6) return;
    if (iceProgress < ICE_NEEDED_PAIRS) {
        showMessage("Cần ghép thêm " + (ICE_NEEDED_PAIRS - iceProgress) + " cặp để tan băng");
        return;
    }

    const candidates = [];
    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLUMNS; col++) {
            if (isIce(row, col)) candidates.push(makeCell(row, col));
        }
    }
    if (candidates.length === 0) {
        showMessage("Không còn ô băng nào");
        return;
    }

    const neighborOffsets = [
        { row: -1, col: 0 },
        { row: 1, col: 0 },
        { row: 0, col: -1 },
        { row: 0, col: 1 }
    ];

    let bestCell = null;
    let bestScore = -1;
    candidates.forEach(function (cell) {
        let neighborImages = 0;
        neighborOffsets.forEach(function (offset) {
            const neighborRow = cell.row + offset.row;
            const neighborCol = cell.col + offset.col;
            if (!isInsideBoard(neighborRow, neighborCol)) return;
            if (isIce(neighborRow, neighborCol)) return;
            if (board[neighborRow][neighborCol] >= 0) neighborImages++;
        });
        if (neighborImages > bestScore) {
            bestScore = neighborImages;
            bestCell = cell;
        }
    });

    if (bestCell) meltIceAt(bestCell.row, bestCell.col);
}

function clickLevel6(row, col) {
    if (isIce(row, col)) {
        removeSelected();
        meltIceAt(row, col);
        return;
    }
    if (board[row][col] === -1) return;
    if (selected === null) {
        selected = makeCell(row, col);
        const cells = document.querySelectorAll(".cell");
        cells.forEach(function (cellElement) {
            const r = Number(cellElement.dataset.row);
            const c = Number(cellElement.dataset.col);
            if (r === row && c === col) cellElement.classList.add("selected");
        });
        return;
    }
    if (sameCell(selected, makeCell(row, col))) {
        removeSelected();
        return;
    }
    checkPair(selected, makeCell(row, col));
}

function checkWin() {
    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLUMNS; col++) {
            if (board[row][col] >= 0) return false;
        }
    }
    return true;
}

function updateScore() {
    scoreElement.textContent = score;
}

function updateLevelScore() {
    levelScoreElement.textContent = levelScore;
}

function addScore(points) {
    score += points;
    levelScore += points;
    updateScore();
    updateLevelScore();
}

function updateLevel() {
    levelElement.textContent = level;
}

function updateLive() {
    const maxLives = Math.max(1, INITIAL_LIVES - (level - 1));
    heartIcons.forEach(function (icon, index) {
        if (index >= maxLives) {
            icon.classList.add("hidden");
            return;
        }
        icon.classList.remove("hidden");
        icon.classList.toggle("lost", index >= lives);
    });
}

function updateTime() {
    timeElement.textContent = time;
    const percent = (time / maxTime) * 100;
    timeProgress.style.width = percent + "%";
    timeProgress.classList.remove("warning", "danger");
    if (time <= 10) timeProgress.classList.add("danger");
    else if (time <= 20) timeProgress.classList.add("warning");
}

function updateHintCount() {
    if (hintCountElement) hintCountElement.textContent = hintCount;
}

function updateShuffleCount() {
    if (!shuffleCountElement) return;
    shuffleCountElement.textContent = shuffleCount;
    shuffleCountElement.classList.toggle("empty", shuffleCount <= 0);
}

function updateShuffleButton() {
    shuffleButton.style.display = (level === 5 || level === 6) ? "none" : "";
}

function updateIceButtonVisibility() {
    if (level === 6) {
        iceBreakButton.style.display = "flex";
    } else {
        iceBreakButton.style.display = "none";
        iceStatusElement.style.display = "none";
    }
}

function updatePauseButton() {
    if (!pauseIconElement || !pauseTextElement) return;
    if (paused) {
        pauseIconElement.textContent = "▶";
        pauseTextElement.textContent = "Tiếp tục";
    } else {
        pauseIconElement.textContent = "❚❚";
        pauseTextElement.textContent = "Tạm dừng";
    }
}

function updateSoundButton() {
    if (!soundIconElement || !soundTextElement) return;
    if (sound) {
        soundIconElement.textContent = "♪";
        soundTextElement.textContent = "Âm thanh";
    } else {
        soundIconElement.textContent = "✕";
        soundTextElement.textContent = "Tắt âm thanh";
    }
}

function handleWrongSelection(message) {
    lives--;
    updateLive();
    playSound(wrongSound);
    if (lives <= 0) {
        gameEnded = true;
        clearInterval(timer);
        removeSelected();
        showMessage("Bạn đã hết mạng! GAME OVER");
    } else {
        showMessage(message + "! Bạn còn " + lives + " mạng.");
        removeSelected();
    }
}

function startTimer() {
    clearInterval(timer);
    timer = setInterval(function () {
        if (paused || gameEnded) return;
        time--;
        updateTime();

        if (level === 4) {
            nightTimeCount++;
            if (nightTimeCount >= 15) {
                nightTimeCount = 0;
                removeSelected();
                clearPath();
                if (refreshLevel4View(true)) {
                    renderBoard();
                    showMessage("Bóng tối đã thay đổi vị trí nhìn");
                } else {
                    shuffleBoardData();
                    ensureHasMove();
                    let placed = false;
                    for (let i = 0; i < 50 && !placed; i++) {
                        if (findNightCenter(true) && hasNonEmptyInNightZone()) placed = true;
                    }
                    if (!placed) findNightCenter(true);
                    renderBoard();
                    showMessage("Bàn chơi đã được xáo lại");
                }
            }
        }
        if (time <= 0) gameOver();
    }, 1000);
}

function gameOver() {
    clearInterval(timer);
    gameEnded = true;
    removeSelected();
    showMessage("Game Over - Hết thời gian!");
}

function applyLevelRules() {
    lives = Math.max(1, INITIAL_LIVES - (level - 1));
    hintCount = Math.max(0, INITIAL_HINTS - (level - 1));
    if (level === 5 || level === 6) shuffleCount = 0;
    else if (level === 2 || level === 3) shuffleCount = 2;
    else shuffleCount = 1;

    time = INITIAL_TIME - (level - 1) * TIME_PER_LEVEL;
    if (time < MIN_TIME) time = MIN_TIME;
    maxTime = time;
}

function resetRoundFlags() {
    selected = null;
    gameEnded = false;
    paused = false;
    moveCount = 0;
    obstacles = [];
    skillCells = [];
    skillActivated = 0;
    doubleScore = false;
    transformMoveCount = 0;
    nightCenterRow = 3;
    nightCenterCol = 6;
    nightTimeCount = 0;
    hiddenCells = [];
    level5Selected = [];
    level5Processing = false;
    memoryRevealCount = {};
    level5HiddenReveal = {};
    iceBoard = [];
    iceProgress = 0;
    clearAllMemoryRevealTimers();
    clearTimeout(memoryHideTimer);
}

function loadLevelBoard() {
    if (level === 2) setupLevel2();
    else if (level === 3) setupLevel3();
    else if (level === 4) setupLevel4();
    else if (level === 5) setupLevel5();
    else if (level === 6) setupLevel6();
    else createBoard();
}

function refreshHud() {
    updateLevel();
    updateLive();
    updateHintCount();
    updateShuffleCount();
    updateShuffleButton();
    updateIceButtonVisibility();
    updateIceStatus();
    updatePauseButton();
    updateTime();
    if (hintCountElement) hintCountElement.style.display = "";
    if (shuffleCountElement) shuffleCountElement.style.display = "";
}

function startGame() {
    clearInterval(timer);
    clearTimeout(boardShuffleTimer);
    score = 0;
    levelScore = 0;
    level = 1;
    lives = INITIAL_LIVES;
    hintCount = INITIAL_HINTS;
    shuffleCount = INITIAL_SHUFFLES;
    resetRoundFlags();
    updateScore();
    updateLevelScore();
    updateSoundButton();
    boardElement.classList.remove("game-exited");
    time = INITIAL_TIME;
    maxTime = INITIAL_TIME;
    refreshHud();
    createBoard();
    renderBoard();
    startTimer();
    showMessage("Level " + level + ": Hãy chọn 2 hình giống nhau");
}

function startLevel(selectedLevel) {
    clearInterval(timer);
    clearTimeout(boardShuffleTimer);
    level = selectedLevel;
    resetRoundFlags();
    applyLevelRules();
    refreshHud();
    loadLevelBoard();
    if (level !== 5) renderBoard();
    startTimer();
    showLevelIntro();
}

function showLevelIntro() {
    if (level === 5) showMessage("Hãy ghi nhớ vị trí các hình!");
    else if (level === 6) showMessage("Level 6 - Băng Giá: Ghép 2 cặp để có 1 lượt tan băng!");
    else showMessage("Level " + level + ": Hãy chọn 2 hình giống nhau");
}

function winLevel() {
    clearInterval(timer);
    clearTimeout(memoryHideTimer);
    clearAllMemoryRevealTimers();
    clearTimeout(boardShuffleTimer);
    gameEnded = true;
    addScore(50);
    playSound(levelUpSound);
    if (level === MAX_LEVEL) {
        showMessage("Bạn đã hoàn thành tất cả các level");
        return;
    }
    showMessage("Hoàn thành Level " + level);
    setTimeout(advanceToNextLevel, 1500);
}

function advanceToNextLevel() {
    level++;
    levelScore = 0;
    updateLevelScore();
    resetRoundFlags();
    lives = Math.max(1, INITIAL_LIVES - (level - 1));
    hintCount = Math.max(0, INITIAL_HINTS - (level - 1));
    if (level === 5 || level === 6) shuffleCount = 0;
    else if (level === 2 || level === 3) shuffleCount = 2;
    else shuffleCount = 1;

    time = INITIAL_TIME - (level - 1) * TIME_PER_LEVEL;
    if (time < MIN_TIME) time = MIN_TIME;
    maxTime = time;

    refreshHud();
    loadLevelBoard();
    if (level !== 5) renderBoard();
    startTimer();
    showLevelIntro();
}

function shuffleBoard() {
    if (paused || gameEnded) return;
    clearPath();
    removeSelected();
    playSound(shuffleSound);
    shuffleBoardData();
    ensureHasMove();
    renderBoard();
    showMessage("Đã xáo trộn bàn chơi");
}

function showHint() {
    if (paused || gameEnded) return false;
    for (let rowA = 0; rowA < ROWS; rowA++) {
        for (let colA = 0; colA < COLUMNS; colA++) {
            if (board[rowA][colA] < 0) continue;
            if (level === 4 && !inNightView(rowA, colA)) continue;
            for (let rowB = 0; rowB < ROWS; rowB++) {
                for (let colB = 0; colB < COLUMNS; colB++) {
                    if (rowA === rowB && colA === colB) continue;
                    if (board[rowA][colA] !== board[rowB][colB]) continue;
                    if (level === 4 && !inNightView(rowB, colB)) continue;
                    if (findPath(makeCell(rowA, colA), makeCell(rowB, colB)) !== null) {
                        highlightHint(rowA, colA, rowB, colB);
                        return true;
                    }
                }
            }
        }
    }
    showMessage("Không tìm thấy cặp hình phù hợp");
    return false;
}

function highlightHint(rowA, colA, rowB, colB) {
    const cells = document.querySelectorAll(".cell");
    cells.forEach(function (cellElement) {
        const row = Number(cellElement.dataset.row);
        const col = Number(cellElement.dataset.col);
        const match = (row === rowA && col === colA) || (row === rowB && col === colB);
        if (match) {
            cellElement.classList.add("hint");
            setTimeout(function () {
                cellElement.classList.remove("hint");
            }, 1500);
        }
    });
    showMessage("Hai hình được đánh dấu là một cặp");
}

newButton.addEventListener("click", function () {
    startGame();
});

levelButton.addEventListener("click", function () {
    levelModal.classList.add("show");
});

closeLevelButton.addEventListener("click", function () {
    levelModal.classList.remove("show");
});

levelSelectButtons.forEach(function (button) {
    button.addEventListener("click", function () {
        const chosen = Number(button.dataset.level);
        levelModal.classList.remove("show");
        startLevel(chosen);
    });
});

hintButton.addEventListener("click", function () {
    if (level === 5) {
        showMessage("Level 5 không sử dụng gợi ý");
        return;
    }
    if (gameEnded) {
        showMessage("Game đã kết thúc");
        return;
    }
    if (hintCount <= 0) {
        showMessage("Bạn đã hết lượt gợi ý");
        return;
    }
    if (showHint()) {
        hintCount--;
        updateHintCount();
    }
});

shuffleButton.addEventListener("click", function () {
    if (level === 5) {
        showMessage("Level này không sử dụng xáo trộn");
        return;
    }
    if (gameEnded) {
        showMessage("Game đã kết thúc");
        return;
    }
    if (paused) {
        showMessage("Game đang tạm dừng");
        return;
    }
    if (shuffleCount <= 0) {
        showMessage("Bạn đã hết lượt xáo trộn");
        return;
    }
    shuffleCount--;
    updateShuffleCount();
    shuffleBoard();
});

iceBreakButton.addEventListener("click", function () {
    if (level !== 6) {
        showMessage("Chỉ dùng nút này ở Level 6");
        return;
    }
    meltIceManual();
});

pauseButton.addEventListener("click", function () {
    if (gameEnded) return;
    paused = !paused;
    updatePauseButton();
    showMessage(paused ? "Game đang tạm dừng" : "Tiếp tục chơi");
});

soundButton.addEventListener("click", function () {
    sound = !sound;
    updateSoundButton();
    showMessage(sound ? "Đã bật âm thanh" : "Đã tắt âm thanh");
});

exitButton.addEventListener("click", function () {
    clearInterval(timer);
    clearTimeout(memoryHideTimer);
    clearAllMemoryRevealTimers();
    clearTimeout(boardShuffleTimer);
    iceBoard = [];
    iceProgress = 0;
    gameEnded = true;
    paused = false;
    selected = null;
    clearPath();
    removeSelected();
    iceBreakButton.style.display = "none";
    iceStatusElement.style.display = "none";
    if (hintCountElement) hintCountElement.style.display = "none";
    if (shuffleCountElement) shuffleCountElement.style.display = "none";
    boardElement.innerHTML = "";
    showMessage("Bạn đã thoát khỏi game");
});

startGame();
