const ROWS = 9;
const COLUMNS = 16;
const MAX_LEVEL = 6;

const images = [
    "images/pikachu1.png",
    "images/pikachu2.png",
    "images/pikachu3.png",
    "images/pikachu4.png",
    "images/pikachu5.png",
    "images/pikachu6.png",
    "images/pikachu7.png",
    "images/pikachu8.png",
    "images/pikachu9.png",
    "images/pikachu10.png",
    "images/pikachu11.png",
    "images/pikachu12.png"
];

let board = [];
let score = 0;
let levelScore = 0;
let level = 1;
let lives = 5;
let hintCount = 3;
let shuffleCount = 3;
let time = 300;
let maxTime = 300;
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
let memorySelected = [];
let memoryHideTimer = null;
let memoryBusy = false;

const boardElement = document.getElementById("board");
const scoreElement = document.getElementById("score");
const levelElement = document.getElementById("level");
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
const shuffleButton = document.getElementById("shuffleButton");
const pauseButton = document.getElementById("pauseButton");
const soundButton = document.getElementById("soundButton");
const exitButton = document.getElementById("exitButton");
const levelButton = document.getElementById("levelButton");
const levelModal = document.getElementById("levelModal");
const closeLevelButton = document.getElementById("closeLevelButton");
const levelSelectButtons = document.querySelectorAll(".level-select-button");

function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        let j = Math.floor(Math.random() * (i + 1));
        let temp = array[i];
        array[i] = array[j];
        array[j] = temp;
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

function isObstacle(row, col) {
    for (let i = 0; i < obstacles.length; i++) {
        if (obstacles[i].row === row && obstacles[i].col === col) return true;
    }
    return false;
}

function getSkill(row, col) {
    for (let i = 0; i < skillCells.length; i++) {
        if (skillCells[i].row === row && skillCells[i].col === col) return skillCells[i];
    }
    return undefined;
}

function skillValue(type) {
    if (type === "teleport") return -2;
    if (type === "destroy") return -3;
    if (type === "double") return -4;
    if (type === "freeze") return -5;
    return -1;
}

function inNightView(row, col) {
    return Math.abs(row - nightCenterRow) <= nightRadius &&
        Math.abs(col - nightCenterCol) <= nightRadius;
}

function countClosePairs() {
    let closePairs = 0;
    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLUMNS; col++) {
            if (board[row][col] < 0) continue;
            if (col + 1 < COLUMNS && board[row][col] === board[row][col + 1]) closePairs++;
            if (row + 1 < ROWS && board[row][col] === board[row + 1][col]) closePairs++;
        }
    }
    return closePairs;
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

function createBoard() {
    let values = [];
    for (let i = 0; i < ROWS * COLUMNS / 2; i++) {
        let type = i % images.length;
        values.push(type);
        values.push(type);
    }

    let tries = 0;
    do {
        shuffle(values);
        fillBoardFromValues(values);
        tries++;
        if (countClosePairs() <= 10) break;
    } while (tries < 100);

    if (level !== 4) {
        while (!hasMove()) shuffleBoardData();
    }
}

function shuffleBoardData() {
    let values = [];
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
        if (countClosePairs() <= 10) break;
    } while (tries < 100);
}

function ensureHasMove() {
    let tries = 0;
    while (!hasMove() && tries < 100) {
        shuffleBoardData();
        tries++;
    }
}

function canGo(row, col, start, end) {
    if (row < -1 || row > ROWS || col < -1 || col > COLUMNS) return false;
    if (row === -1 || row === ROWS || col === -1 || col === COLUMNS) return true;
    if ((row === start.row && col === start.col) || (row === end.row && col === end.col)) return true;
    if ((level === 2 || level === 3) && isObstacle(row, col)) return false;
    return board[row][col] === -1;
}

function findPath(start, end) {
    const directions = [
        {row: -1, col: 0},
        {row: 1, col: 0},
        {row: 0, col: -1},
        {row: 0, col: 1}
    ];

    let queue = [{
        row: start.row,
        col: start.col,
        dir: -1,
        turns: 0,
        path: [{row: start.row, col: start.col}]
    }];
    let visited = {};

    while (queue.length > 0) {
        let current = queue.shift();
        for (let dir = 0; dir < 4; dir++) {
            let turns = current.turns;
            if (current.dir !== -1 && current.dir !== dir) turns++;
            if (turns > 2) continue;

            let newRow = current.row + directions[dir].row;
            let newCol = current.col + directions[dir].col;

            if (newRow === end.row && newCol === end.col) {
                return current.path.concat([{row: newRow, col: newCol}]);
            }

            if (!canGo(newRow, newCol, start, end)) continue;

            let key = newRow + "," + newCol + "," + dir;
            if (visited[key] !== undefined && visited[key] <= turns) continue;
            visited[key] = turns;

            queue.push({
                row: newRow,
                col: newCol,
                dir: dir,
                turns: turns,
                path: current.path.concat([{row: newRow, col: newCol}])
            });
        }
    }
    return null;
}

function hasMove() {
    for (let r1 = 0; r1 < ROWS; r1++) {
        for (let c1 = 0; c1 < COLUMNS; c1++) {
            if (board[r1][c1] < 0) continue;
            if (level === 4 && !inNightView(r1, c1)) continue;

            for (let r2 = 0; r2 < ROWS; r2++) {
                for (let c2 = 0; c2 < COLUMNS; c2++) {
                    if (r1 === r2 && c1 === c2) continue;
                    if (board[r1][c1] !== board[r2][c2]) continue;
                    if (level === 4 && !inNightView(r2, c2)) continue;
                    if (findPath({row: r1, col: c1}, {row: r2, col: c2}) !== null) return true;
                }
            }
        }
    }
    return false;
}

function drawPath(path) {
    clearPath();
    let cellSize = 56;
    let points = "";
    for (let i = 0; i < path.length; i++) {
        let point = path[i];
        let x = point.col * cellSize + 28;
        let y = point.row * cellSize + 28;
        if (point.col === -1) x = 0;
        if (point.col === COLUMNS) x = COLUMNS * cellSize;
        if (point.row === -1) y = 0;
        if (point.row === ROWS) y = ROWS * cellSize;
        points += x + "," + y + " ";
    }
    let line = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
    line.setAttribute("points", points);
    line.setAttribute("class", "path-line");
    pathElement.appendChild(line);
}

function clearPath() {
    pathElement.innerHTML = "";
}

function removeSelected() {
    let cells = document.querySelectorAll(".cell");
    for (let i = 0; i < cells.length; i++) {
        cells[i].classList.remove("selected");
    }
    selected = null;
}

function markPair(first, second, className) {
    let cells = document.querySelectorAll(".cell");
    for (let i = 0; i < cells.length; i++) {
        let row = Number(cells[i].dataset.row);
        let col = Number(cells[i].dataset.col);
        if ((row === first.row && col === first.col) ||
            (row === second.row && col === second.col)) {
            cells[i].classList.remove("selected");
            cells[i].classList.add(className);
        }
    }
}

function clearPairMark(className) {
    let cells = document.querySelectorAll(".cell");
    for (let i = 0; i < cells.length; i++) {
        cells[i].classList.remove(className);
    }
}

function sameCell(a, b) {
    return a.row === b.row && a.col === b.col;
}

function renderBoard() {
    boardElement.innerHTML = "";
    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLUMNS; col++) {
            let cell = document.createElement("div");
            cell.className = "cell";
            cell.dataset.row = row;
            cell.dataset.col = col;

            let nightVisible = true;
            if (level === 4 && !inNightView(row, col)) {
                nightVisible = false;
                cell.classList.add("night-hidden");
            }

            let showImage = true;
            if (level === 5 && !memoryVisible) {
                let hidden = false;
                let picked = false;
                for (let i = 0; i < hiddenCells.length; i++) {
                    if (sameCell(hiddenCells[i], {row: row, col: col})) hidden = true;
                }
                for (let i = 0; i < memorySelected.length; i++) {
                    if (sameCell(memorySelected[i], {row: row, col: col})) picked = true;
                }
                if (hidden && !picked) {
                    showImage = false;
                    cell.classList.add("memory-hidden");
                }
            }

            for (let i = 0; i < memorySelected.length; i++) {
                if (sameCell(memorySelected[i], {row: row, col: col})) {
                    cell.classList.add("selected");
                }
            }

            if ((level === 2 || level === 3) && isObstacle(row, col)) {
                cell.classList.add("obstacle");
            } else if (level === 3 && getSkill(row, col)) {
                let skill = getSkill(row, col);
                cell.classList.add("skill-cell");
                cell.classList.add("skill-" + skill.type);
            } else if (board[row][col] !== -1 && nightVisible && showImage) {
                let image = document.createElement("img");
                image.src = images[board[row][col]];
                image.alt = "pikachu";
                cell.appendChild(image);
            }

            cell.addEventListener("click", clickCell);
            boardElement.appendChild(cell);
        }
    }
}

function clickCell(event) {
    if (paused || gameEnded) return;

    let cell = event.currentTarget;
    let row = Number(cell.dataset.row);
    let col = Number(cell.dataset.col);

    if (level === 5) {
        clickMemoryCell(row, col);
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

    if (selected === null) {
        selected = {row: row, col: col};
        cell.classList.add("selected");
        return;
    }

    if (selected.row === row && selected.col === col) {
        removeSelected();
        return;
    }

    checkPair(selected, {row: row, col: col});
}

function checkPair(first, second) {
    if (board[first.row][first.col] !== board[second.row][second.col]) {
        markPair(first, second, "pair-wrong");
        handleWrongSelection("Hai hình không giống nhau");
        setTimeout(function () {
            clearPairMark("pair-wrong");
        }, 700);
        return;
    }

    let path = findPath(first, second);
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
    setTimeout(function () {
        clearPairMark("pair-wrong");
    }, 700);
}

function removePair(first, second) {
    board[first.row][first.col] = -1;
    board[second.row][second.col] = -1;

    if (level === 2) {
        moveCount++;
        afterLevel2Match();
    }
    if (level === 3) transformMoveCount++;

    if (doubleScore) {
        addScore(20);
        doubleScore = false;
    } else {
        addScore(10);
    }

    selected = null;
    clearPath();

    if (checkWin()) {
        renderBoard();
        winLevel();
        return;
    }

    if (level === 3 && transformMoveCount % 2 === 0) {
        transformLevel3Board();
    }

    renderBoard();

    if (level === 4) {
        if (!hasMove()) {
            nightTimeCount = 0;
            showMessage("Không còn nước đi - đang chuyển vùng sáng");
            setTimeout(function () {
                if (!gameEnded && level === 4 && findNightCenter()) {
                    renderBoard();
                    showMessage("Bóng tối đã thay đổi vị trí nhìn");
                }
            }, 300);
        } else {
            showMessage("Đã nối thành công");
        }
    }
}

function checkWin() {
    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLUMNS; col++) {
            if (board[row][col] >= 0) return false;
        }
    }
    return true;
}

function pickSpreadPositions(count) {
    let positions = [];
    while (positions.length < count) {
        let row = Math.floor(Math.random() * ROWS);
        let col = Math.floor(Math.random() * COLUMNS);
        let ok = true;
        for (let i = 0; i < positions.length; i++) {
            let d = Math.abs(positions[i].row - row) + Math.abs(positions[i].col - col);
            if (d < 3) {
                ok = false;
                break;
            }
        }
        if (ok) positions.push({row: row, col: col});
    }
    return positions;
}

function setupLevel2() {
    moveCount = 0;
    obstacles = [];
    createBoard();
    placeLevel2Obstacles();
}

function placeLevel2Obstacles() {
    obstacles = pickSpreadPositions(6);

    let values = [];
    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLUMNS; col++) {
            values.push(board[row][col]);
        }
    }

    let types = [];
    for (let i = 0; i < images.length; i++) types.push(i);
    shuffle(types);

    let removeMap = {};
    for (let i = 0; i < 3; i++) {
        removeMap[types[i]] = 2;
    }

    let remaining = [];
    for (let i = 0; i < values.length; i++) {
        let type = values[i];
        if (removeMap[type] > 0) {
            removeMap[type]--;
        } else {
            remaining.push(type);
        }
    }

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
        if (countClosePairs() <= 10) break;
    } while (tries < 100);

    for (let i = 0; i < obstacles.length; i++) {
        board[obstacles[i].row][obstacles[i].col] = -1;
    }
    ensureHasMove();
}

function afterLevel2Match() {
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
    let startRow = 2;
    let startCol = 5;
    let size = 4;
    let positions = [];
    let values = [];

    for (let row = startRow; row < startRow + size; row++) {
        for (let col = startCol; col < startCol + size; col++) {
            if (!isObstacle(row, col)) {
                positions.push({row: row, col: col});
                values.push(board[row][col]);
            }
        }
    }
    if (values.length <= 1) return;

    values.unshift(values.pop());
    for (let i = 0; i < positions.length; i++) {
        board[positions[i].row][positions[i].col] = values[i];
    }
}

function shiftRandomRow() {
    let row = Math.floor(Math.random() * ROWS);
    let cols = [];
    for (let col = 0; col < COLUMNS; col++) {
        if (!isObstacle(row, col)) cols.push(col);
    }
    if (cols.length <= 1) return;

    let values = [];
    for (let i = 0; i < cols.length; i++) values.push(board[row][cols[i]]);
    values.unshift(values.pop());
    for (let i = 0; i < cols.length; i++) board[row][cols[i]] = values[i];
}

function setupLevel3() {
    moveCount = 0;
    transformMoveCount = 0;
    obstacles = [];
    skillCells = [];
    skillActivated = 0;
    doubleScore = false;
    createBoard();
    placeLevel3Elements();
}

function placeLevel3Elements() {
    let special = pickSpreadPositions(12);
    obstacles = [];
    skillCells = [];

    for (let i = 0; i < 8; i++) {
        obstacles.push({row: special[i].row, col: special[i].col});
    }

    let skillTypes = ["teleport", "destroy", "double", "freeze"];
    for (let i = 0; i < 4; i++) {
        skillCells.push({
            row: special[i + 8].row,
            col: special[i + 8].col,
            type: skillTypes[i]
        });
    }

    let pairCount = (ROWS * COLUMNS - obstacles.length - skillCells.length) / 2;
    let pairValues = [];
    for (let i = 0; i < pairCount; i++) {
        pairValues.push(i % images.length);
        pairValues.push(i % images.length);
    }

    let tries = 0;
    do {
        shuffle(pairValues);
        fillLevel3Board(pairValues);
        tries++;
        if (countClosePairs() <= 10) break;
    } while (tries < 100);

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
            let skill = getSkill(row, col);
            if (skill) {
                board[row][col] = skillValue(skill.type);
                continue;
            }
            board[row][col] = pairValues[index];
            index++;
        }
    }
}

function activateSkill(row, col) {
    if (paused || gameEnded) return;

    let skillIndex = -1;
    for (let i = 0; i < skillCells.length; i++) {
        if (skillCells[i].row === row && skillCells[i].col === col) {
            skillIndex = i;
            break;
        }
    }
    if (skillIndex === -1) return;

    let skill = skillCells[skillIndex];
    skillCells.splice(skillIndex, 1);
    board[row][col] = -1;
    skillActivated++;

    if (skill.type === "teleport") useTeleport();
    if (skill.type === "destroy") useDestroy();
    if (skill.type === "double") useDouble();
    if (skill.type === "freeze") useFreeze();

    renderBoard();
    showMessage("Đã kích hoạt " + skillActivated + "/4 kỹ năng");
}

function useTeleport() {
    let emptyCells = [];
    let imageCells = [];
    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLUMNS; col++) {
            if (isObstacle(row, col) || getSkill(row, col)) continue;
            if (board[row][col] === -1) emptyCells.push({row: row, col: col});
            else if (board[row][col] >= 0) imageCells.push({row: row, col: col});
        }
    }
    if (emptyCells.length === 0 || imageCells.length === 0) {
        showMessage("Không thể sử dụng Teleport");
        return;
    }
    let from = imageCells[Math.floor(Math.random() * imageCells.length)];
    let to = emptyCells[Math.floor(Math.random() * emptyCells.length)];
    board[to.row][to.col] = board[from.row][from.col];
    board[from.row][from.col] = -1;
    showMessage("Đã dịch chuyển một hình");
}

function useDestroy() {
    if (obstacles.length === 0) {
        showMessage("Không còn chướng ngại vật");
        return;
    }
    let index = Math.floor(Math.random() * obstacles.length);
    let obstacle = obstacles[index];
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
    let typePositions = {};
    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLUMNS; col++) {
            let value = board[row][col];
            if (value >= 0) {
                if (!typePositions[value]) typePositions[value] = [];
                typePositions[value].push({row: row, col: col});
            }
        }
    }

    let types = Object.keys(typePositions).map(Number);
    if (types.length < 2) return;

    shuffle(types);
    let typeA = types[0];
    let typeB = types[1];
    let positionsA = typePositions[typeA];
    let positionsB = typePositions[typeB];
    let changeCount = Math.min(
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

function findNightCenter(keepCurrentOk) {
    let centers = [];
    for (let row = 1; row < ROWS - 1; row++) {
        for (let col = 1; col < COLUMNS - 1; col++) {
            if (!keepCurrentOk && row === nightCenterRow && col === nightCenterCol) continue;
            let oldRow = nightCenterRow;
            let oldCol = nightCenterCol;
            nightCenterRow = row;
            nightCenterCol = col;
            let ok = hasMove();
            nightCenterRow = oldRow;
            nightCenterCol = oldCol;
            if (ok) centers.push({row: row, col: col});
        }
    }
    if (centers.length === 0) return false;
    let center = centers[Math.floor(Math.random() * centers.length)];
    nightCenterRow = center.row;
    nightCenterCol = center.col;
    return true;
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
}

function setupLevel5() {
    createBoard();
    hiddenCells = [];
    memorySelected = [];
    memoryBusy = false;
    memoryVisible = true;
    clearTimeout(memoryHideTimer);
    renderBoard();
    showMessage("Hãy ghi nhớ vị trí các hình!");
    memoryHideTimer = setTimeout(function () {
        hideMemoryCells();
    }, 3000);
}

function hideMemoryCells() {
    if (gameEnded || level !== 5) return;
    if (paused) {
        memoryHideTimer = setTimeout(hideMemoryCells, 500);
        return;
    }

    hiddenCells = [];
    let positions = [];
    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLUMNS; col++) {
            if (board[row][col] >= 0) positions.push({row: row, col: col});
        }
    }
    shuffle(positions);
    for (let i = 0; i < Math.min(12, positions.length); i++) {
        hiddenCells.push(positions[i]);
    }
    memoryVisible = false;
    memorySelected = [];
    memoryBusy = false;
    renderBoard();
    showMessage("Hãy nhớ vị trí các hình đã bị che");
}

function clickMemoryCell(row, col) {
    if (memoryVisible) {
        showMessage("Hãy ghi nhớ vị trí các hình!");
        return;
    }
    if (memoryBusy) return;
    if (board[row][col] === -1) return;

    let selectedIndex = -1;
    for (let i = 0; i < memorySelected.length; i++) {
        if (sameCell(memorySelected[i], {row: row, col: col})) {
            selectedIndex = i;
            break;
        }
    }

    if (selectedIndex !== -1) {
        memorySelected.splice(selectedIndex, 1);
        renderBoard();
        return;
    }

    memorySelected.push({row: row, col: col});
    renderBoard();

    if (memorySelected.length < 2) {
        showMessage("Hãy chọn thêm một hình");
        return;
    }

    memoryBusy = true;
    let first = memorySelected[0];
    let second = memorySelected[1];

    if (board[first.row][first.col] !== board[second.row][second.col]) {
        markPair(first, second, "pair-wrong");
        handleWrongSelection("Sai cặp");
        setTimeout(function () {
            clearPairMark("pair-wrong");
            memorySelected = [];
            memoryBusy = false;
            renderBoard();
        }, 700);
        return;
    }

    let path = findPath(first, second);
    if (path === null) {
        markPair(first, second, "pair-wrong");
        handleWrongSelection("Hai hình giống nhau nhưng không thể nối");
        setTimeout(function () {
            clearPairMark("pair-wrong");
            memorySelected = [];
            memoryBusy = false;
            renderBoard();
        }, 700);
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
        memorySelected = [];
        memoryBusy = false;
        addScore(10);
        renderBoard();
        if (checkWin()) {
            winLevel();
            return;
        }
        showMessage("Đúng cặp");
    }, 500);
}

function updateScore() {
    scoreElement.textContent = score;
}

function updateLevelScore() {
    document.getElementById("levelScore").textContent = levelScore;
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
    let maxLives = 5 - (level - 1);
    let hearts = document.querySelectorAll("#lives .heart-icon");
    for (let i = 0; i < hearts.length; i++) {
        if (i < maxLives) {
            hearts[i].classList.remove("hidden");
            if (i < lives) hearts[i].classList.remove("lost");
            else hearts[i].classList.add("lost");
        } else {
            hearts[i].classList.add("hidden");
        }
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

function updateTime() {
    timeElement.textContent = time;
    let percent = (time / maxTime) * 100;
    timeProgress.style.width = percent + "%";
    if (time <= 10) timeProgress.style.backgroundColor = "#ef4444";
    else if (time <= 20) timeProgress.style.backgroundColor = "#f59e0b";
    else timeProgress.style.backgroundColor = "#22c55e";
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
                if (findNightCenter()) {
                    renderBoard();
                    showMessage("Bóng tối đã thay đổi vị trí nhìn");
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

function updateHintCount() {
    let el = document.querySelector(".hint-count");
    if (el) el.textContent = hintCount;
}

function updateShuffleCount() {
    let el = document.querySelector(".shuffle-count");
    if (!el) return;
    el.textContent = shuffleCount;
    if (shuffleCount <= 0) el.classList.add("empty");
    else el.classList.remove("empty");
}

function updateShuffleButton() {
    shuffleButton.style.display = level === 5 ? "none" : "";
}

function updatePauseButton() {
    let icon = document.getElementById("pauseIcon");
    let text = document.getElementById("pauseText");
    if (!icon || !text) return;
    if (paused) {
        icon.textContent = "▶";
        text.textContent = "Tiếp tục";
    } else {
        icon.textContent = "❚❚";
        text.textContent = "Tạm dừng";
    }
}

function updateSoundButton() {
    let icon = document.getElementById("soundIcon");
    let text = document.getElementById("soundText");
    if (!icon || !text) return;
    if (sound) {
        icon.textContent = "♪";
        text.textContent = "Âm thanh";
    } else {
        icon.textContent = "✕";
        text.textContent = "Tắt âm thanh";
    }
}

function applyLevelRules() {
    lives = 5 - (level - 1);
    if (lives < 1) lives = 1;
    hintCount = Math.max(0, 3 - (level - 1));
    if (level === 5) shuffleCount = 0;
    else if (level === 2 || level === 3) shuffleCount = 2;
    else shuffleCount = 1;

    time = 300 - (level - 1) * 10;
    if (time < 60) time = 60;
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
    memorySelected = [];
    memoryBusy = false;
    clearTimeout(memoryHideTimer);
}

function loadLevelBoard() {
    if (level === 2) setupLevel2();
    else if (level === 3) setupLevel3();
    else if (level === 4) setupLevel4();
    else if (level === 5) setupLevel5();
    else createBoard();
}

function refreshHud() {
    updateLevel();
    updateLive();
    updateHintCount();
    updateShuffleCount();
    updateShuffleButton();
    updatePauseButton();
    updateTime();
    document.querySelector(".hint-count").style.display = "";
    document.querySelector(".shuffle-count").style.display = "";
}

function startGame() {
    clearInterval(timer);
    score = 0;
    levelScore = 0;
    level = 1;
    lives = 5;
    hintCount = 3;
    shuffleCount = 3;
    resetRoundFlags();
    updateScore();
    updateLevelScore();
    updateSoundButton();
    boardElement.classList.remove("game-exited");
    time = 300;
    maxTime = 300;
    refreshHud();
    createBoard();
    renderBoard();
    startTimer();
    showMessage("Level " + level + ": Hãy chọn 2 hình giống nhau");
}

function startLevel(selectedLevel) {
    clearInterval(timer);
    level = selectedLevel;
    resetRoundFlags();
    applyLevelRules();
    refreshHud();
    loadLevelBoard();
    if (level !== 5) renderBoard();
    startTimer();
    if (level === 5) showMessage("Hãy ghi nhớ vị trí các hình!");
    else showMessage("Level " + level + ": Hãy chọn 2 hình giống nhau");
}

function winLevel() {
    clearInterval(timer);
    clearTimeout(memoryHideTimer);
    gameEnded = true;
    addScore(50);
    playSound(levelUpSound);

    if (level === MAX_LEVEL) {
        showMessage("Bạn đã hoàn thành tất cả các level");
        return;
    }

    showMessage("Hoàn thành Level " + level);
    setTimeout(function () {
        level++;
        levelScore = 0;
        updateLevelScore();
        resetRoundFlags();
        lives = 5 - (level - 1);
        if (lives < 1) lives = 1;
        hintCount = Math.max(0, 3 - (level - 1));
        if (level === 5) shuffleCount = 0;
        else if (level === 2 || level === 3) shuffleCount = 2;
        else shuffleCount = 1;
        time = 300 - (level - 1) * 10;
        if (time < 60) time = 60;
        maxTime = time;
        refreshHud();
        loadLevelBoard();
        if (level !== 5) renderBoard();
        startTimer();
        if (level === 5) showMessage("Hãy ghi nhớ vị trí các hình!");
        else showMessage("Level " + level + ": Hãy chọn 2 hình giống nhau");
    }, 1500);
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

    for (let r1 = 0; r1 < ROWS; r1++) {
        for (let c1 = 0; c1 < COLUMNS; c1++) {
            if (board[r1][c1] < 0) continue;
            if (level === 4 && !inNightView(r1, c1)) continue;

            for (let r2 = 0; r2 < ROWS; r2++) {
                for (let c2 = 0; c2 < COLUMNS; c2++) {
                    if (r1 === r2 && c1 === c2) continue;
                    if (board[r1][c1] !== board[r2][c2]) continue;
                    if (level === 4 && !inNightView(r2, c2)) continue;
                    if (findPath({row: r1, col: c1}, {row: r2, col: c2}) !== null) {
                        highlightHint(r1, c1, r2, c2);
                        return true;
                    }
                }
            }
        }
    }
    showMessage("Không tìm thấy cặp hình phù hợp");
    return false;
}

function highlightHint(r1, c1, r2, c2) {
    let cells = document.querySelectorAll(".cell");
    for (let i = 0; i < cells.length; i++) {
        let row = Number(cells[i].dataset.row);
        let col = Number(cells[i].dataset.col);
        if ((row === r1 && col === c1) || (row === r2 && col === c2)) {
            cells[i].classList.add("hint");
            setTimeout(function () {
                cells[i].classList.remove("hint");
            }, 1500);
        }
    }
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
        let selectedLevel = Number(button.dataset.level);
        levelModal.classList.remove("show");
        startLevel(selectedLevel);
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
        showMessage("Level 5 không sử dụng xáo trộn");
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
    gameEnded = true;
    paused = false;
    selected = null;
    clearPath();
    removeSelected();
    document.querySelector(".hint-count").style.display = "none";
    document.querySelector(".shuffle-count").style.display = "none";
    boardElement.innerHTML = "";
    showMessage("Bạn đã thoát khỏi game");
});

startGame();
