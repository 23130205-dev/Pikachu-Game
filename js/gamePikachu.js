const ROWS = 8;
const COLUMNS = 14;
const MAX_LEVEL = 5;

const images = [
    "images/pikachu1.jpg",
    "images/pikachu2.jpg",
    "images/pikachu3.jpg",
    "images/pikachu4.jpg",
    "images/pikachu5.jpg",
    "images/pikachu6.jpg",
    "images/pikachu7.jpg",
    "images/pikachu8.jpg",
    "images/pikachu9.jpg",
    "images/pikachu10.jpg",
    "images/pikachu11.jpg"
];

let board = [];
let score = 0;
let level = 1;
let lives = 6;
let time = 300;
let maxTime = 300;
let timer = null;
let gameEnded = false;
let selected = null;

const boardElement = document.getElementById("board");
const scoreElement = document.getElementById("score");
const levelElement = document.getElementById("level");
const messageElement = document.getElementById("message");
const pathElement = document.getElementById("path");
const timeElement = document.getElementById("time");
const timeProgress = document.getElementById("timeProgress");

startGame();

function startGame() {
    clearInterval(timer);
    score = 0;
    level = 1;
    lives = 6;
    selected = null;
    gameEnded = false;
    updateScore();
    updateLevel();
    updateLive();
    time = 300;
    maxTime = 300;
    updateTime();
    createBoard();
    renderBoard();
    startTimer();
    showMessage("Level " + level + ": Hãy chọn 2 hình giống nhau");
}

function updateLive() {
    const maxLivesThisLevel = 6 - (level - 1);
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
        if (gameEnded) {
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
    let values = [];
    const total = ROWS * COLUMNS;

    for (let i = 0; i < total / 2; i++) {
        let type = i % images.length;
        values.push(type);
        values.push(type);
    }

    shuffle(values);

    board = [];
    let index = 0;

    for (let row = 0; row < ROWS; row++) {
        board[row] = [];

        for (let col = 0; col < COLUMNS; col++) {
            board[row][col] = values[index];
            index++;
        }
    }
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

            if (board[row][col] !== -1) {
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
    if (gameEnded) {
        return;
    }

    let cell = event.currentTarget;
    let row = Number(cell.dataset.row);
    let col = Number(cell.dataset.col);

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
    score += 10;
    updateScore();
    clearPath();
    selected = null;
    renderBoard();

    if (checkWin()) {
        winLevel();
        return;
    }

    showMessage("Đã nối thành công");
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

    if (level === MAX_LEVEL) {
        showMessage("Bạn đã hoàn thành tất cả các level");
        return;
    }

    showMessage("Hoàn thành Level " + level);

    setTimeout(function () {
        level++;
        updateLevel();
        gameEnded = false;
        lives = 6 - (level - 1);
        updateLive();
        time = 300 - (level - 1) * 10;

        if (time < 60) {
            time = 60;
        }

        maxTime = time;
        updateTime();
        createBoard();
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
        row < 0 ||
        row >= ROWS ||
        col < 0 ||
        col >= COLUMNS
    ) {
        return true;
    }

    if (
        (row === start.row && col === start.col) ||
        (row === end.row && col === end.col)
    ) {
        return true;
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