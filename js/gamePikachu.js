const ROWS = 8;
const COLUMNS = 14;
const MAX_LEVEL = 5;

//const images = [
//    "images/pikachu1.jpg",
//    "images/pikachu2.jpg",
//    "images/pikachu3.jpg",
//    "images/pikachu4.jpg",
//    "images/pikachu5.jpg",
//    "images/pikachu6.jpg",
//    "images/pikachu7.jpg",
//    "images/pikachu8.jpg",
//    "images/pikachu9.jpg",
//    "images/pikachu10.jpg",
//    "images/pikachu11.jpg"
//];

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
    "images/pikachu11.png"
];

let board = [];
let score = 0;
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

const boardElement = document.getElementById("board");
const scoreElement = document.getElementById("score");
const levelElement = document.getElementById("level");
const messageElement = document.getElementById("message");
const pathElement = document.getElementById("path");
const timeElement = document.getElementById("time");
const timeProgress = document.getElementById("timeProgress");

const clickSound = document.getElementById("clickSound");
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

startGame();

function playSound(audio){
    if(!sound || !audio){
        return;
    }
    audio.currentTime = 0;
    audio.play().catch(function () {
    });
}

function startGame() {
    clearInterval(timer);

    score = 0;
    level = 1;
    lives = 6;
    selected = null;
    gameEnded = false;
    hintCount = 3;
    shuffleCount = 3;
    paused = false;
    moveCount = 0;
    obstacles = [];

    updateScore();
    updateLevel();
    updateLive();
    updateHintCount();
    updateShuffleCount();
    updatePauseButton();
    updateSoundButton();

    boardElement.classList.remove("game-exited")

    time = 300;
    maxTime = 300;

    updateTime();
    createBoard();
    renderBoard();
    startTimer();

    showMessage("Level " + level + ": Hãy chọn 2 hình giống nhau");
}

function updateLive() {
    const maxLivesThisLevel = 5 - (level - 1);
    const heartIcons = document.querySelectorAll("#lives .heart-icon");

    heartIcons.forEach(function (icon, index) {
        if (index < maxLivesThisLevel) {
            icon.classList.remove("hidden");

            if (index < lives) {
                icon.classList.remove("lost");
            } else {
                icon.classList.add("lost");
            }
        } else {
            icon.classList.add("hidden");
        }
    });
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
        if (paused || gameEnded) {
            return;
        }

        time--;
        updateTime();

        if (time <= 0) {
            gameOver();
        }
    }, 1000);
}

function updateTime() {
    timeElement.textContent = time;

    let percent = (time / maxTime) * 100;
    timeProgress.style.width = percent + "%";

    if (time <= 10) {
        timeProgress.style.backgroundColor = "#ef4444";
    } else if (time <= 20) {
        timeProgress.style.backgroundColor = "#f59e0b";
    } else {
        timeProgress.style.backgroundColor = "#22c55e";
    }
}

function gameOver() {
    clearInterval(timer);
    gameEnded = true;
    removeSelected();
    showMessage("Game Over - Hết thời gian!");
}

function createBoard() {
    board = [];

    let values = [];

    for (let i = 0; i < ROWS * COLUMNS / 2; i++) {
        let type = i % images.length;

        values.push(type);
        values.push(type);
    }

    shuffle(values);

    for (let row = 0; row < ROWS; row++) {
        board[row] = [];

        for (let col = 0; col < COLUMNS; col++) {
            board[row][col] = values[row * COLUMNS + col];
        }
    }

    while (!hasMove()) {
        shuffleBoardData();
    }
}

function setupLevel2() {
    moveCount = 0;
    obstacles = [];

    createBoard();
    createLevel2Obstacles();
}

function createLevel2Obstacles() {
    obstacles = [
        { row: 1, col: 3 },
        { row: 1, col: 4 },
        { row: 4, col: 7 },
        { row: 4, col: 8 },
        { row: 6, col: 10 },
        { row: 6, col: 11 }
    ];

    let values = [];

    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLUMNS; col++) {
            values.push(board[row][col]);
        }
    }

    let types = [];

    for (let i = 0; i < images.length; i++) {
        types.push(i);
    }

    shuffle(types);

    let pairValues = [];

    for (let i = 0; i < 3; i++) {
        pairValues.push(types[i]);
        pairValues.push(types[i]);
    }

    let remainingValues = [];

    let removedCount = {};

    for (let i = 0; i < pairValues.length; i++) {
        let type = pairValues[i];

        if (removedCount[type] === undefined) {
            removedCount[type] = 0;
        }

        removedCount[type]++;
    }

    for (let i = 0; i < values.length; i++) {
        let type = values[i];

        if (removedCount[type] > 0) {
            removedCount[type]--;
        } else {
            remainingValues.push(type);
        }
    }

    shuffle(remainingValues);

    let index = 0;

    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLUMNS; col++) {
            if (!isObstacle(row, col)) {
                board[row][col] = remainingValues[index];
                index++;
            }
        }
    }

    for (let i = 0; i < obstacles.length; i++) {
        board[obstacles[i].row][obstacles[i].col] = -1;
    }

    if (!hasMove()) {
        let count = 0;

        do {
            shuffleBoardData();
            count++;
        } while (!hasMove() && count < 100);
    }
}

function isObstacle(row, col) {
    return obstacles.some(function (obstacle) {
        return obstacle.row === row &&
            obstacle.col === col;
    });
}

function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        let j = Math.floor(Math.random() * (i + 1));

        let temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
}

function renderBoard() {
    boardElement.innerHTML = "";

    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLUMNS; col++) {
            let cell = document.createElement("div");

            cell.className = "cell";
            cell.dataset.row = row;
            cell.dataset.col = col;

            if (level === 2 && isObstacle(row, col)) {
                cell.classList.add("obstacle");

                let icon = document.createElement("i");
                icon.className = "fa-solid fa-lock";

                cell.appendChild(icon);
            } else if (board[row][col] !== -1) {
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
    if (paused || gameEnded) {
        return;
    }

    let cell = event.currentTarget;
    let row = Number(cell.dataset.row);
    let col = Number(cell.dataset.col);

    if (level === 2 && isObstacle(row, col)) {
        return;
    }

    if (board[row][col] === -1) {
        return;
    }

    if (selected === null) {
        selected = {
            row: row,
            col: col
        };

        cell.classList.add("selected");
        return;
    }

    if (selected.row === row && selected.col === col) {
        removeSelected();
        return;
    }

    checkPair(selected, {
        row: row,
        col: col
    });
}

function checkPair(first, second) {
    if (board[first.row][first.col] !== board[second.row][second.col]) {
        handleWrongSelection("Hai hình không giống nhau");
        return;
    }

    let path = findPath(first, second);

    if (path !== null) {
        playSound(correctSound);
        drawPath(path);

        setTimeout(function () {
            clearPath();
            removePair(first, second);
        }, 100);
    } else {
        handleWrongSelection("Không thể nối hai hình này");
    }
}

function removePair(first, second) {
    board[first.row][first.col] = -1;
    board[second.row][second.col] = -1;

    if (level === 2) {
        moveCount++;
        handleLevel2Move();
    }

    score += 10;
    updateScore();

    clearPath();
    selected = null;
    renderBoard();

    if (checkWin()) {
        winLevel();
        return;
    }

    if (!hasMove()) {
        showMessage("Không còn nước đi");

        setTimeout(function () {
            if (!gameEnded) {
                shuffleBoard();
            }
        }, 800);
    } else {
        showMessage("Đã nối thành công");
    }
}

function handleLevel2Move() {
    if (moveCount % 6 === 0) {
        rotateLevel2Area();

        let count = 0;

        while (!hasMove() && count < 100) {
            shuffleBoardData();
            count++;
        }

        showMessage("Khu vực bản đồ đã xoay");
        return;
    }

    if (moveCount % 3 === 0) {
        moveRandomRow();

        let count = 0;

        while (!hasMove() && count < 100) {
            shuffleBoardData();
            count++;
        }

        showMessage("Một hàng đã thay đổi vị trí");
    }
}

function rotateLevel2Area() {
    const startRow = 2;
    const startCol = 5;
    const size = 4;

    let positions = [];
    let values = [];

    for (let row = startRow; row < startRow + size; row++) {
        for (let col = startCol; col < startCol + size; col++) {
            if (!isObstacle(row, col)) {
                positions.push({
                    row: row,
                    col: col
                });

                values.push(board[row][col]);
            }
        }
    }

    if (values.length <= 1) {
        return;
    }

    let lastValue = values.pop();
    values.unshift(lastValue);

    for (let i = 0; i < positions.length; i++) {
        board[positions[i].row][positions[i].col] = values[i];
    }
}

function moveRandomRow() {
    let row = Math.floor(Math.random() * ROWS);
    let positions = [];

    for (let col = 0; col < COLUMNS; col++) {
        if (!isObstacle(row, col)) {
            positions.push(col);
        }
    }

    if (positions.length <= 1) {
        return;
    }

    let values = [];

    for (let i = 0; i < positions.length; i++) {
        values.push(board[row][positions[i]]);
    }

    let lastValue = values.pop();
    values.unshift(lastValue);

    for (let i = 0; i < positions.length; i++) {
        board[row][positions[i]] = values[i];
    }
}

function checkWin() {
    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLUMNS; col++) {
            if (board[row][col] !== -1) {
                return false;
            }
        }
    }
    return true;
}

function winLevel() {
    clearInterval(timer);
    gameEnded = true;

    score += 50;
    updateScore();
    playSound(levelUpSound);

    if (level === MAX_LEVEL) {
        showMessage("Bạn đã hoàn thành tất cả các level");
        return;
    }

    showMessage("Hoàn thành Level " + level);

    setTimeout(function () {
        level++;
        updateLevel();

        gameEnded = false;
        paused = false;
        lives = 5 - (level - 1);
        hintCount = Math.max(0, 3 - (level - 1));

        if (level === 2 || level === 3) {
            shuffleCount = 2;
        } else {
            shuffleCount = 1;
        }

        updateLive();
        updateHintCount();
        updateShuffleCount();
        updatePauseButton();

        time = 300 - (level - 1) * 10;

        if (time < 60) {
            time = 60;
        }

        maxTime = time;

        updateTime();

        if (level === 2) {
            setupLevel2();
        } else {
            createBoard();
        }

        renderBoard();
        startTimer();

        showMessage("Level " + level + ": Hãy chọn 2 hình giống nhau");
    }, 1500);
}

function findPath(start, end) {
    const directions = [
        [-1, 0],
        [0, 1],
        [1, 0],
        [0, -1]
    ];

    let queue = [];
    let visited = {};

    for (let direction = 0; direction < 4; direction++) {
        queue.push({
            row: start.row,
            col: start.col,
            direction: direction,
            turns: 0,
            path: [
                {
                    row: start.row,
                    col: start.col
                }
            ]
        });

        let key = getKey(start.row, start.col, direction);
        visited[key] = 0;
    }

    while (queue.length > 0) {
        let current = queue.shift();

        for (let newDirection = 0; newDirection < 4; newDirection++) {
            let turns = current.turns;

            if (newDirection !== current.direction) {
                turns++;
            }

            if (turns > 2) {
                continue;
            }

            let newRow = current.row + directions[newDirection][0];
            let newCol = current.col + directions[newDirection][1];

            while (
                newRow >= -1 &&
                newRow <= ROWS &&
                newCol >= -1 &&
                newCol <= COLUMNS
                ) {
                if (newRow === end.row && newCol === end.col) {
                    return [
                        ...current.path,
                        {
                            row: newRow,
                            col: newCol
                        }
                    ];
                }

                if (!canGo(newRow, newCol, start, end)) {
                    break;
                }

                let key = getKey(newRow, newCol, newDirection);

                if (
                    visited[key] === undefined ||
                    turns < visited[key]
                ) {
                    visited[key] = turns;

                    queue.push({
                        row: newRow,
                        col: newCol,
                        direction: newDirection,
                        turns: turns,
                        path: [
                            ...current.path,
                            {
                                row: newRow,
                                col: newCol
                            }
                        ]
                    });
                }

                newRow += directions[newDirection][0];
                newCol += directions[newDirection][1];
            }
        }
    }

    return null;
}

function updateLevel() {
    levelElement.textContent = level;
}

function getKey(row, col, direction) {
    return row + "-" + col + "-" + direction;
}

function canGo(row, col, start, end) {
    if (
        row < -1 ||
        row > ROWS ||
        col < -1 ||
        col > COLUMNS
    ) {
        return false;
    }

    if (
        row === -1 ||
        row === ROWS ||
        col === -1 ||
        col === COLUMNS
    ) {
        return true;
    }

    if (
        (row === start.row && col === start.col) ||
        (row === end.row && col === end.col)
    ) {
        return true;
    }

    if (level === 2 && isObstacle(row, col)) {
        return false;
    }

    return board[row][col] === -1;
}

function drawPath(path) {
    clearPath();

    const cellSize = 62;
    let points = "";

    for (let i = 0; i < path.length; i++) {
        let point = path[i];

        let x = point.col * cellSize + 31;
        let y = point.row * cellSize + 31;

        if (point.col === -1) {
            x = 0;
        }

        if (point.col === COLUMNS) {
            x = COLUMNS * cellSize;
        }

        if (point.row === -1) {
            y = 0;
        }

        if (point.row === ROWS) {
            y = ROWS * cellSize;
        }

        points += x + "," + y + " ";
    }

    let line = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "polyline"
    );

    line.setAttribute("points", points);
    line.setAttribute("class", "path-line");
    pathElement.appendChild(line);
}

function clearPath() {
    pathElement.innerHTML = "";
}

function removeSelected() {
    let cells = document.querySelectorAll(".cell");

    cells.forEach(function (cell) {
        cell.classList.remove("selected");
    });

    selected = null;
}

function updateScore() {
    scoreElement.textContent = score;
}

function showMessage(text) {
    messageElement.textContent = text;
}

function hasMove() {
    for (let row1 = 0; row1 < ROWS; row1++) {
        for (let col1 = 0; col1 < COLUMNS; col1++) {
            if (board[row1][col1] === -1) {
                continue;
            }

            for (let row2 = 0; row2 < ROWS; row2++) {
                for (let col2 = 0; col2 < COLUMNS; col2++) {
                    if (row1 === row2 && col1 === col2) {
                        continue;
                    }

                    if (board[row1][col1] !== board[row2][col2]) {
                        continue;
                    }

                    let path = findPath(
                        {
                            row: row1,
                            col: col1
                        },
                        {
                            row: row2,
                            col: col2
                        }
                    );

                    if (path !== null) {
                        return true;
                    }
                }
            }
        }
    }

    return false;
}

function shuffleBoardData() {
    let values = [];

    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLUMNS; col++) {
            if (board[row][col] !== -1) {
                values.push(board[row][col]);
            }
        }
    }
    shuffle(values);
    let index = 0;
    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLUMNS; col++) {
            if (board[row][col] !== -1) {
                board[row][col] = values[index];
                index++;
            }
        }
    }
}

function shuffleBoard() {
    if (paused || gameEnded) {
        return;
    }
    clearPath();
    removeSelected();
    playSound(shuffleSound);

    let count = 0;
    do {
        shuffleBoardData();
        count++;
    } while (!hasMove() && count < 100);
    renderBoard();
    showMessage("Đã xáo trộn bàn chơi");
}

function showHint() {
    if (paused || gameEnded) {
        return false;
    }

    for (let row1 = 0; row1 < ROWS; row1++) {
        for (let col1 = 0; col1 < COLUMNS; col1++) {
            if (board[row1][col1] === -1) {
                continue;
            }

            for (let row2 = 0; row2 < ROWS; row2++) {
                for (let col2 = 0; col2 < COLUMNS; col2++) {
                    if (row1 === row2 && col1 === col2) {
                        continue;
                    }

                    if (board[row1][col1] !== board[row2][col2]) {
                        continue;
                    }

                    let path = findPath(
                        {
                            row: row1,
                            col: col1
                        },
                        {
                            row: row2,
                            col: col2
                        }
                    );

                    if (path !== null) {
                        showHintCells(
                            row1,
                            col1,
                            row2,
                            col2
                        );

                        return true;
                    }
                }
            }
        }
    }

    showMessage("Không tìm thấy cặp hình phù hợp");
    return false;
}

function showHintCells(row1, col1, row2, col2) {
    let cells = document.querySelectorAll(".cell");

    cells.forEach(function (cell) {
        let row = Number(cell.dataset.row);
        let col = Number(cell.dataset.col);

        if (
            (row === row1 && col === col1) ||
            (row === row2 && col === col2)
        ) {
            cell.classList.add("hint");

            setTimeout(function () {
                cell.classList.remove("hint");
            }, 1500);
        }
    });

    showMessage("Hai hình được đánh dấu là một cặp");
}

function updatePauseButton() {
    let icon = pauseButton.querySelector("i");
    let text = pauseButton.querySelector("span");

    if (!icon || !text) {
        return;
    }

    if (paused) {
        icon.className = "fa-solid fa-play";
        text.textContent = "Tiếp tục";
    } else {
        icon.className = "fa-solid fa-pause";
        text.textContent = "Tạm dừng";
    }
}

function updateSoundButton() {
    let icon = soundButton.querySelector("i");
    let text = soundButton.querySelector("span");

    if (!icon || !text) {
        return;
    }

    if (sound) {
        icon.className = "fa-solid fa-volume-high";
        text.textContent = "Âm thanh";
    } else {
        icon.className = "fa-solid fa-volume-xmark";
        text.textContent = "Tắt âm thanh";
    }
}

function updateHintCount() {
    let hintCountElement = document.querySelector(".hint-count");

    if (hintCountElement) {
        hintCountElement.textContent = hintCount;
    }
}

function updateShuffleCount() {
    let shuffleCountElement = document.querySelector(".shuffle-count");

    if (shuffleCountElement) {
        shuffleCountElement.textContent = shuffleCount;

        if (shuffleCount <= 0) {
            shuffleCountElement.classList.add("empty");
        } else {
            shuffleCountElement.classList.remove("empty");
        }
    }
}
newButton.addEventListener("click", function () {
    startGame();
});

hintButton.addEventListener("click", function () {
    if (gameEnded) {
        showMessage("Game đã kết thúc");
        return;
    }

    if (hintCount <= 0) {
        showMessage("Bạn đã hết lượt gợi ý");
        return;
    }

    let hasHint = showHint();

    if (hasHint) {
        hintCount--;
        updateHintCount();
    }
});

shuffleButton.addEventListener("click", function () {
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
    if (gameEnded) {
        return;
    }

    paused = !paused;
    updatePauseButton();

    if (paused) {
        showMessage("Game đang tạm dừng");
    } else {
        showMessage("Tiếp tục chơi");
    }
});

soundButton.addEventListener("click", function () {
    sound = !sound;

    updateSoundButton();

    if (sound) {
        showMessage("Đã bật âm thanh");
    } else {
        showMessage("Đã tắt âm thanh");
    }
});

exitButton.addEventListener("click", function () {
    clearInterval(timer);

    gameEnded = true;
    paused = false;
    selected = null;

    clearPath();
    removeSelected();
    boardElement.innerHTML = "";
    showMessage("Bạn đã thoát khỏi game");
});