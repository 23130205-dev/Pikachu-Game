const ROWS = 9;
const COLUMNS = 16;
const MAX_LEVEL = 5;

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

startGame();

function playSound(audio) {
    if (!sound || !audio) {
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
    lives = 5;
    selected = null;
    gameEnded = false;
    hintCount = 3;
    shuffleCount = 3;
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
    clearInterval(memoryHideTimer);

    updateScore();
    updateLevel();
    updateLive();
    updateHintCount();
    updateShuffleCount();
    updateShuffleButton();
    document.querySelector(".hint-count").style.display = "";
    document.querySelector(".shuffle-count").style.display = "";
    updatePauseButton();
    updateSoundButton();

    boardElement.classList.remove("game-exited");

    time = 300;
    maxTime = 300;

    updateTime();

    createBoard();
    renderBoard();
    startTimer();

    showMessage("Level " + level + ": Hãy chọn 2 hình giống nhau");
}

function startLevel(selectedLevel) {
    clearInterval(timer);

    level = selectedLevel;
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
    clearInterval(memoryHideTimer);

    lives = 5 - (level - 1);

    if (lives < 1) {
        lives = 1;
    }

    hintCount = Math.max(0, 3 - (level - 1));

    if (level === 5) {
        shuffleCount = 0;
    } else if (level === 2 || level === 3) {
        shuffleCount = 2;
    } else {
        shuffleCount = 1;
    }

    updateLevel();
    updateLive();
    updateHintCount();
    updateShuffleCount();
    document.querySelector(".hint-count").style.display = "";
    document.querySelector(".shuffle-count").style.display = "";
    updateShuffleButton();
    updatePauseButton();

    time = 300 - (level - 1) * 10;

    if (time < 60) {
        time = 60;
    }

    maxTime = time;

    updateTime();

    if (level === 1) {
        createBoard();
    }

    if (level === 2) {
        setupLevel2();
    }

    if (level === 3) {
        setupLevel3();
    }

    if (level === 4) {
        createBoard();
        findLevel4Center();
    }

    if (level === 5) {
        setupLevel5();
    }

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

        if (level === 4) {
            nightTimeCount++;

            if (nightTimeCount >= 15) {
                nightTimeCount = 0;

                removeSelected();
                clearPath();

                if (findLevel4Center()) {
                    renderBoard();
                    showMessage("Bóng tối đã thay đổi vị trí nhìn");
                }
            }
        }
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

    let count = 0;

    do {
        shuffle(values);

        board = [];

        for (let row = 0; row < ROWS; row++) {
            board[row] = [];

            for (let col = 0; col < COLUMNS; col++) {
                board[row][col] =
                    values[row * COLUMNS + col];
            }
        }

        let closePairs = 0;

        for (let row = 0; row < ROWS; row++) {
            for (let col = 0; col < COLUMNS; col++) {

                if (
                    col + 1 < COLUMNS &&
                    board[row][col] === board[row][col + 1]
                ) {
                    closePairs++;
                }

                if (
                    row + 1 < ROWS &&
                    board[row][col] === board[row + 1][col]
                ) {
                    closePairs++;
                }
            }
        }

        count++;

        if (closePairs <= 10) {
            break;
        }

    } while (count < 100);

    if (level !== 4) {
        while (!hasMove()) {
            shuffleBoardData();
        }
    }
}

function setupLevel2() {
    moveCount = 0;
    obstacles = [];

    createBoard();
    createLevel2Obstacles();
}

function setupLevel3() {
    moveCount = 0;
    transformMoveCount = 0;
    obstacles = [];
    skillCells = [];
    skillActivated = 0;
    doubleScore = false;

    createBoard();
    createLevel3Elements();
}

function setupLevel5() {
    createBoard();

    hiddenCells = [];
    memorySelected = [];

    startMemoryHide();
}

function startMemoryHide() {
    clearInterval(memoryHideTimer);

    memoryHideTimer = setInterval(function () {
        if (paused || gameEnded) {
            return;
        }

        hiddenCells = [];

        let positions = [];

        for (let row = 0; row < ROWS; row++) {
            for (let col = 0; col < COLUMNS; col++) {
                if (board[row][col] >= 0) {
                    positions.push({
                        row: row,
                        col: col
                    });
                }
            }
        }

        shuffle(positions);

        for (let i = 0; i < Math.min(4, positions.length); i++) {
            hiddenCells.push(positions[i]);
        }

        memorySelected = [];

        renderBoard();

        showMessage("4 ô hình đã được che lại");
    }, 5000);
}

function createLevel2Obstacles() {
    obstacles = [];

    while (obstacles.length < 6) {
        let row = Math.floor(Math.random() * ROWS);
        let col = Math.floor(Math.random() * COLUMNS);

        let valid = true;

        for (let i = 0; i < obstacles.length; i++) {
            let obstacle = obstacles[i];

            let rowDistance =
                Math.abs(obstacle.row - row);

            let colDistance =
                Math.abs(obstacle.col - col);

            if (rowDistance + colDistance < 3) {
                valid = false;
                break;
            }
        }

        if (valid) {
            obstacles.push({
                row: row,
                col: col
            });
        }
    }

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

    let count = 0;

    do {
        shuffle(remainingValues);

        let index = 0;

        for (let row = 0; row < ROWS; row++) {
            for (let col = 0; col < COLUMNS; col++) {

                if (isObstacle(row, col)) {
                    continue;
                }

                board[row][col] =
                    remainingValues[index];

                index++;
            }
        }

        let closePairs = 0;

        for (let row = 0; row < ROWS; row++) {
            for (let col = 0; col < COLUMNS; col++) {

                if (isObstacle(row, col)) {
                    continue;
                }

                if (
                    col + 1 < COLUMNS &&
                    !isObstacle(row, col + 1) &&
                    board[row][col] === board[row][col + 1]
                ) {
                    closePairs++;
                }

                if (
                    row + 1 < ROWS &&
                    !isObstacle(row + 1, col) &&
                    board[row][col] === board[row + 1][col]
                ) {
                    closePairs++;
                }
            }
        }

        count++;

        if (closePairs <= 10) {
            break;
        }

    } while (count < 100);

    let index = 0;

    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLUMNS; col++) {

            if (!isObstacle(row, col)) {
                board[row][col] =
                    remainingValues[index];

                index++;
            }
        }
    }

    for (let i = 0; i < obstacles.length; i++) {
        board[obstacles[i].row][obstacles[i].col] = -1;
    }

    if (!hasMove()) {
        let shuffleCount = 0;

        do {
            shuffleBoardData();
            shuffleCount++;
        } while (!hasMove() && shuffleCount < 100);
    }
}

function createLevel3Elements() {
    obstacles = [];
    skillCells = [];

    let specialPositions = [];

    while (specialPositions.length < 12) {
        let row = Math.floor(Math.random() * ROWS);
        let col = Math.floor(Math.random() * COLUMNS);

        let valid = true;

        for (let i = 0; i < specialPositions.length; i++) {
            let position = specialPositions[i];

            let rowDistance =
                Math.abs(position.row - row);

            let colDistance =
                Math.abs(position.col - col);

            if (rowDistance + colDistance < 3) {
                valid = false;
                break;
            }
        }

        if (valid) {
            specialPositions.push({
                row: row,
                col: col
            });
        }
    }

    for (let i = 0; i < 8; i++) {
        obstacles.push({
            row: specialPositions[i].row,
            col: specialPositions[i].col
        });
    }

    let skillTypes = [
        "teleport",
        "destroy",
        "double",
        "freeze"
    ];

    for (let i = 0; i < 4; i++) {
        skillCells.push({
            row: specialPositions[i + 8].row,
            col: specialPositions[i + 8].col,
            type: skillTypes[i]
        });
    }

    let pairValues = [];

    let pairCount =
        (ROWS * COLUMNS - obstacles.length - skillCells.length) / 2;

    for (let i = 0; i < pairCount; i++) {
        pairValues.push(i % images.length);
        pairValues.push(i % images.length);
    }

    shuffle(pairValues);

    let count = 0;

    do {
        shuffle(pairValues);

        let index = 0;

        for (let row = 0; row < ROWS; row++) {
            for (let col = 0; col < COLUMNS; col++) {

                if (isObstacle(row, col)) {
                    board[row][col] = -1;
                    continue;
                }

                let skill = getSkill(row, col);

                if (skill !== undefined) {

                    if (skill.type === "teleport") {
                        board[row][col] = -2;
                    }

                    if (skill.type === "destroy") {
                        board[row][col] = -3;
                    }

                    if (skill.type === "double") {
                        board[row][col] = -4;
                    }

                    if (skill.type === "freeze") {
                        board[row][col] = -5;
                    }

                    continue;
                }

                board[row][col] =
                    pairValues[index];

                index++;
            }
        }

        let closePairs = 0;

        for (let row = 0; row < ROWS; row++) {
            for (let col = 0; col < COLUMNS; col++) {

                if (board[row][col] < 0) {
                    continue;
                }

                if (
                    col + 1 < COLUMNS &&
                    board[row][col + 1] >= 0 &&
                    board[row][col] === board[row][col + 1]
                ) {
                    closePairs++;
                }

                if (
                    row + 1 < ROWS &&
                    board[row + 1][col] >= 0 &&
                    board[row][col] === board[row + 1][col]
                ) {
                    closePairs++;
                }
            }
        }

        count++;

        if (closePairs <= 10) {
            break;
        }

    } while (count < 100);

    let index = 0;

    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLUMNS; col++) {

            if (isObstacle(row, col)) {
                board[row][col] = -1;
                continue;
            }

            let skill = getSkill(row, col);

            if (skill !== undefined) {

                if (skill.type === "teleport") {
                    board[row][col] = -2;
                }

                if (skill.type === "destroy") {
                    board[row][col] = -3;
                }

                if (skill.type === "double") {
                    board[row][col] = -4;
                }

                if (skill.type === "freeze") {
                    board[row][col] = -5;
                }

                continue;
            }

            board[row][col] =
                pairValues[index];

            index++;
        }
    }

    ensureLevel3Move();
}


function getSkill(row, col) {
    return skillCells.find(function (skill) {
        return skill.row === row &&
            skill.col === col;
    });
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

            let nightVisible = true;

            if (level === 4) {
                let rowDistance =
                    Math.abs(row - nightCenterRow);

                let colDistance =
                    Math.abs(col - nightCenterCol);

                if (
                    rowDistance > nightRadius ||
                    colDistance > nightRadius
                ) {
                    nightVisible = false;
                    cell.classList.add("night-hidden");
                }
            }

            let showMemoryImage = true;

            if (level === 5) {
                let isHidden = hiddenCells.some(function (position) {
                    return position.row === row &&
                        position.col === col;
                });

                let isSelected = memorySelected.some(function (position) {
                    return position.row === row &&
                        position.col === col;
                });

                if (isHidden && !isSelected) {
                    showMemoryImage = false;
                    cell.classList.add("memory-hidden");
                }
            }

            if (
                (level === 2 || level === 3) &&
                isObstacle(row, col)
            ) {
                cell.classList.add("obstacle");

                let icon = document.createElement("i");
                icon.className = "fa-solid fa-lock";

                cell.appendChild(icon);

            } else if (
                level === 3 &&
                getSkill(row, col)
            ) {
                let skill = getSkill(row, col);

                cell.classList.add("skill-cell");

                let icon = document.createElement("i");

                if (skill.type === "teleport") {
                    icon.className =
                        "fa-solid fa-arrows-up-down-left-right";
                }

                if (skill.type === "destroy") {
                    icon.className =
                        "fa-solid fa-hammer";
                }

                if (skill.type === "double") {
                    icon.className =
                        "fa-solid fa-star";
                }

                if (skill.type === "freeze") {
                    icon.className =
                        "fa-solid fa-snowflake";
                }

                cell.appendChild(icon);

            } else if (
                board[row][col] !== -1 &&
                nightVisible &&
                showMemoryImage
            ) {
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

    if (level === 5) {
        clickMemoryCell(row, col);
        return;
    }

    if (level === 4) {
        let rowDistance =
            Math.abs(row - nightCenterRow);

        let colDistance =
            Math.abs(col - nightCenterCol);

        if (
            rowDistance > nightRadius ||
            colDistance > nightRadius
        ) {
            showMessage(
                "Ô này đang nằm trong bóng tối"
            );

            return;
        }
    }

    if (
        (level === 2 || level === 3) &&
        isObstacle(row, col)
    ) {
        return;
    }

    if (
        level === 3 &&
        getSkill(row, col)
    ) {
        activateSkill(row, col);
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

    if (
        selected.row === row &&
        selected.col === col
    ) {
        removeSelected();
        return;
    }

    checkPair(selected, {
        row: row,
        col: col
    });
}

function clickMemoryCell(row, col) {
    if (board[row][col] === -1) {
        return;
    }

    if (
        memorySelected.some(function (position) {
            return position.row === row &&
                position.col === col;
        })
    ) {
        return;
    }

    memorySelected.push({
        row: row,
        col: col
    });

    renderBoard();

    if (memorySelected.length < 2) {
        showMessage("Hãy chọn thêm một hình");
        return;
    }

    let first = memorySelected[0];
    let second = memorySelected[1];

    if (
        board[first.row][first.col] ===
        board[second.row][second.col]
    ) {
        board[first.row][first.col] = -1;
        board[second.row][second.col] = -1;

        memorySelected = [];

        score += 10;

        updateScore();

        playSound(correctSound);

        if (checkWin()) {
            renderBoard();
            winLevel();
            return;
        }

        renderBoard();

        showMessage("Đúng cặp");
    } else {
        playSound(wrongSound);

        showMessage("Sai cặp");

        setTimeout(function () {
            memorySelected = [];
            renderBoard();
        }, 700);
    }
}

function activateSkill(row, col) {
    if (paused || gameEnded) {
        return;
    }

    let skillIndex = skillCells.findIndex(function (skill) {
        return skill.row === row &&
            skill.col === col;
    });

    if (skillIndex === -1) {
        return;
    }

    let skill = skillCells[skillIndex];

    skillCells.splice(skillIndex, 1);
    board[row][col] = -1;
    skillActivated++;

    if (skill.type === "teleport") {
        useTeleportSkill();
    }

    if (skill.type === "destroy") {
        useDestroySkill();
    }

    if (skill.type === "double") {
        useDoubleSkill();
    }

    if (skill.type === "freeze") {
        useFreezeSkill();
    }

    renderBoard();

    showMessage(
        "Đã kích hoạt " +
        skillActivated +
        "/4 kỹ năng"
    );
}

function useTeleportSkill() {
    let emptyCells = [];
    let imageCells = [];

    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLUMNS; col++) {
            if (
                board[row][col] === -1 &&
                !isObstacle(row, col) &&
                !getSkill(row, col)
            ) {
                emptyCells.push({
                    row: row,
                    col: col
                });
            } else if (
                board[row][col] >= 0 &&
                !isObstacle(row, col) &&
                !getSkill(row, col)
            ) {
                imageCells.push({
                    row: row,
                    col: col
                });
            }
        }
    }

    if (
        emptyCells.length === 0 ||
        imageCells.length === 0
    ) {
        showMessage("Không thể sử dụng Teleport");
        return;
    }

    let imageCell =
        imageCells[
            Math.floor(Math.random() * imageCells.length)
            ];

    let emptyCell =
        emptyCells[
            Math.floor(Math.random() * emptyCells.length)
            ];

    board[emptyCell.row][emptyCell.col] =
        board[imageCell.row][imageCell.col];

    board[imageCell.row][imageCell.col] = -1;

    showMessage("Đã dịch chuyển một hình");
}

function useDestroySkill() {
    if (obstacles.length === 0) {
        showMessage("Không còn chướng ngại vật");
        return;
    }

    let index =
        Math.floor(
            Math.random() * obstacles.length
        );

    let obstacle = obstacles[index];

    board[obstacle.row][obstacle.col] = -1;

    obstacles.splice(index, 1);

    showMessage(
        "Phá chướng ngại vật thành công"
    );
}

function useDoubleSkill() {
    doubleScore = true;

    showMessage(
        "Lượt ghép tiếp theo được nhân đôi điểm"
    );
}

function useFreezeSkill() {
    paused = true;

    showMessage(
        "Đóng băng thời gian trong 5 giây"
    );

    setTimeout(function () {

        if (!gameEnded) {
            paused = false;

            showMessage(
                "Thời gian tiếp tục chạy"
            );
        }

    }, 5000);
}

function checkPair(first, second) {
    if (
        board[first.row][first.col] !==
        board[second.row][second.col]
    ) {
        handleWrongSelection(
            "Hai hình không giống nhau"
        );

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

        handleWrongSelection(
            "Không thể nối hai hình này"
        );
    }
}

function removePair(first, second) {
    board[first.row][first.col] = -1;
    board[second.row][second.col] = -1;

    if (level === 2) {
        moveCount++;
        handleLevel2Move();
    }

    if (level === 3) {
        transformMoveCount++;
    }

    if (doubleScore) {
        score += 20;
        doubleScore = false;
    } else {
        score += 10;
    }

    updateScore();

    clearPath();
    selected = null;

    if (checkWin()) {
        renderBoard();
        winLevel();

        return;
    }

    if (
        level === 3 &&
        transformMoveCount % 2 === 0
    ) {
        transformLevel3Board();
    }
    renderBoard();

    if (level === 4) {
        if (!hasLevel4Move()) {

            nightTimeCount = 0;

            showMessage(
                "Không còn nước đi - đang chuyển vùng sáng"
            );

            setTimeout(function () {
                if (!gameEnded && level === 4) {

                    if (findLevel4Center()) {
                        renderBoard();

                        showMessage(
                            "Bóng tối đã thay đổi vị trí nhìn"
                        );
                    }
                }
            }, 300);

        } else {
            showMessage("Đã nối thành công");
        }

        return;
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

        showMessage(
            "Khu vực bản đồ đã được xoay"
        );

        return;
    }

    if (moveCount % 3 === 0) {

        moveRandomRow();

        let count = 0;

        while (!hasMove() && count < 100) {
            shuffleBoardData();
            count++;
        }

        showMessage(
            "Một hàng đã được thay đổi vị trí"
        );
    }
}

function transformLevel3Board() {
    let typePositions = {};

    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLUMNS; col++) {
            let value = board[row][col];

            if (value >= 0) {
                if (!typePositions[value]) {
                    typePositions[value] = [];
                }

                typePositions[value].push({
                    row: row,
                    col: col
                });
            }
        }
    }

    let types = Object.keys(typePositions).map(Number);

    if (types.length < 2) {
        return;
    }

    shuffle(types);

    let typeA = types[0];
    let typeB = types[1];

    let positionsA = typePositions[typeA];
    let positionsB = typePositions[typeB];

    let changeCount = Math.min(
        Math.floor(positionsA.length / 2),
        Math.floor(positionsB.length / 2)
    );

    if (changeCount < 1) {
        return;
    }

    shuffle(positionsA);
    shuffle(positionsB);

    for (let i = 0; i < changeCount; i++) {
        let cellA = positionsA[i];
        let cellB = positionsB[i];

        board[cellA.row][cellA.col] = typeB;
        board[cellB.row][cellB.col] = typeA;
    }

    ensureLevel3Move();

    showMessage(
        "Sau 2 cặp, một số hình trên bàn đã tự động biến đổi"
    );
}

function ensureLevel3Move() {
    let count = 0;

    while (!hasMove() && count < 100) {
        shuffleBoardData();
        count++;
    }
}

function rotateLevel2Area() {
    const startRow = 2;
    const startCol = 5;
    const size = 4;

    let positions = [];
    let values = [];

    for (
        let row = startRow;
        row < startRow + size;
        row++
    ) {
        for (
            let col = startCol;
            col < startCol + size;
            col++
        ) {

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

    for (
        let i = 0;
        i < positions.length;
        i++
    ) {
        board[
            positions[i].row
            ][
            positions[i].col
            ] = values[i];
    }
}

function hasLevel4Move() {

    for (let row1 = 0; row1 < ROWS; row1++) {

        for (let col1 = 0; col1 < COLUMNS; col1++) {

            if (board[row1][col1] < 0) {
                continue;
            }

            if (
                Math.abs(row1 - nightCenterRow) > nightRadius ||
                Math.abs(col1 - nightCenterCol) > nightRadius
            ) {
                continue;
            }

            for (let row2 = 0; row2 < ROWS; row2++) {

                for (let col2 = 0; col2 < COLUMNS; col2++) {

                    if (
                        row1 === row2 &&
                        col1 === col2
                    ) {
                        continue;
                    }

                    if (
                        board[row1][col1] !==
                        board[row2][col2]
                    ) {
                        continue;
                    }

                    if (
                        Math.abs(row2 - nightCenterRow) > nightRadius ||
                        Math.abs(col2 - nightCenterCol) > nightRadius
                    ) {
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


function findLevel4Center() {
    let centers = [];

    for (let row = 1; row < ROWS - 1; row++) {
        for (let col = 1; col < COLUMNS - 1; col++) {

            if (
                row === nightCenterRow &&
                col === nightCenterCol
            ) {
                continue;
            }

            let oldRow = nightCenterRow;
            let oldCol = nightCenterCol;

            nightCenterRow = row;
            nightCenterCol = col;

            let hasMove = hasLevel4Move();

            nightCenterRow = oldRow;
            nightCenterCol = oldCol;

            if (hasMove) {
                centers.push({
                    row: row,
                    col: col
                });
            }
        }
    }

    if (centers.length === 0) {
        return false;
    }

    let center =
        centers[
            Math.floor(Math.random() * centers.length)
            ];

    nightCenterRow = center.row;
    nightCenterCol = center.col;

    return true;
}

function moveRandomRow() {
    let row =
        Math.floor(Math.random() * ROWS);

    let positions = [];

    for (
        let col = 0;
        col < COLUMNS;
        col++
    ) {
        if (!isObstacle(row, col)) {
            positions.push(col);
        }
    }

    if (positions.length <= 1) {
        return;
    }

    let values = [];

    for (let i = 0; i < positions.length; i++) {
        values.push(
            board[row][positions[i]]
        );
    }

    let lastValue = values.pop();

    values.unshift(lastValue);

    for (let i = 0; i < positions.length; i++) {
        board[row][positions[i]] =
            values[i];
    }
}

function moveRandomColumn() {
    let col =
        Math.floor(Math.random() * COLUMNS);

    let positions = [];

    for (
        let row = 0;
        row < ROWS;
        row++
    ) {
        if (!isObstacle(row, col)) {
            positions.push(row);
        }
    }

    if (positions.length <= 1) {
        return;
    }

    let values = [];

    for (let i = 0; i < positions.length; i++) {
        values.push(
            board[positions[i]][col]
        );
    }

    let lastValue = values.pop();

    values.unshift(lastValue);

    for (let i = 0; i < positions.length; i++) {
        board[positions[i]][col] =
            values[i];
    }
}

function checkWin() {
    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLUMNS; col++) {

            if (board[row][col] >= 0) {
                return false;
            }
        }
    }

    return true;
}

function winLevel() {
    clearInterval(timer);
    clearInterval(memoryHideTimer);
    gameEnded = true;

    score += 50;

    updateScore();

    playSound(levelUpSound);

    if (level === MAX_LEVEL) {

        showMessage(
            "Bạn đã hoàn thành tất cả các level"
        );

        return;
    }

    showMessage(
        "Hoàn thành Level " + level
    );

    setTimeout(function () {

        level++;

        updateLevel();

        gameEnded = false;
        paused = false;

        lives = 5 - (level - 1);

        if (lives < 1) {
            lives = 1;
        }

        hintCount =
            Math.max(0, 3 - (level - 1));

        if (level === 5) {
            shuffleCount = 0;
        } else if (level === 2 || level === 3) {
            shuffleCount = 2;
        } else {
            shuffleCount = 1;
        }

        updateLive();
        updateHintCount();
        updateShuffleCount();
        updateShuffleButton();
        updatePauseButton();

        time =
            300 - (level - 1) * 10;

        if (time < 60) {
            time = 60;
        }

        maxTime = time;

        moveCount = 0;
        transformMoveCount = 0;
        nightCenterRow = 3;
        nightCenterCol = 6;
        nightTimeCount = 0;

        updateTime();

        if (level === 2) {
            setupLevel2();

        } else if (level === 3) {
            setupLevel3();

        } else if (level === 4) {
            createBoard();
            findLevel4Center();

        } else if (level === 5) {
            setupLevel5();
        } else {
            createBoard();
        }

        renderBoard();
        startTimer();

        showMessage(
            "Level " +
            level +
            ": Hãy chọn 2 hình giống nhau"
        );

    }, 1500);
}

function findPath(start, end) {
    const directions = [
        { row: -1, col: 0 },
        { row: 1, col: 0 },
        { row: 0, col: -1 },
        { row: 0, col: 1 }
    ];

    const queue = [{
        row: start.row,
        col: start.col,
        dir: -1,
        turns: 0,
        path: [
            {
                row: start.row,
                col: start.col
            }
        ]
    }];

    const visited = new Map();

    function key(row, col, dir) {
        return row + "," + col + "," + dir;
    }

    while (queue.length > 0) {
        const current = queue.shift();

        for (let dir = 0; dir < 4; dir++) {

            let newTurns = current.turns;

            if (
                current.dir !== -1 &&
                current.dir !== dir
            ) {
                newTurns++;
            }

            if (newTurns > 2) {
                continue;
            }

            let newRow =
                current.row + directions[dir].row;

            let newCol =
                current.col + directions[dir].col;

            if (
                newRow === end.row &&
                newCol === end.col
            ) {
                return [
                    ...current.path,
                    {
                        row: newRow,
                        col: newCol
                    }
                ];
            }

            if (!canGo(newRow, newCol, start, end)) {
                continue;
            }

            let stateKey = key(newRow, newCol, dir);

            if (
                visited.has(stateKey) &&
                visited.get(stateKey) <= newTurns
            ) {
                continue;
            }

            visited.set(stateKey, newTurns);

            queue.push({
                row: newRow,
                col: newCol,
                dir: dir,
                turns: newTurns,
                path: [
                    ...current.path,
                    {
                        row: newRow,
                        col: newCol
                    }
                ]
            });
        }
    }

    return null;
}

function updateLevel() {
    levelElement.textContent = level;
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
        (row === start.row &&
            col === start.col) ||
        (row === end.row &&
            col === end.col)
    ) {
        return true;
    }

    if (
        (level === 2 || level === 3) &&
        isObstacle(row, col)
    ) {
        return false;
    }

    return board[row][col] === -1;
}

function drawPath(path) {
    clearPath();

    const cellSize = 56 ;

    let points = "";

    for (let i = 0; i < path.length; i++) {

        let point = path[i];

        let x =
            point.col * cellSize + 28;

        let y =
            point.row * cellSize + 28;

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

    let line =
        document.createElementNS(
            "http://www.w3.org/2000/svg",
            "polyline"
        );

    line.setAttribute(
        "points",
        points
    );

    line.setAttribute(
        "class",
        "path-line"
    );

    pathElement.appendChild(line);
}

function clearPath() {
    pathElement.innerHTML = "";
}

function removeSelected() {
    let cells =
        document.querySelectorAll(".cell");

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

            if (board[row1][col1] < 0) {
                continue;
            }

            if (
                level === 4 &&
                (
                    Math.abs(row1 - nightCenterRow) > nightRadius ||
                    Math.abs(col1 - nightCenterCol) > nightRadius
                )
            ) {
                continue;
            }

            for (let row2 = 0; row2 < ROWS; row2++) {

                for (let col2 = 0; col2 < COLUMNS; col2++) {

                    if (
                        row1 === row2 &&
                        col1 === col2
                    ) {
                        continue;
                    }

                    if (board[row1][col1] !== board[row2][col2]) {
                        continue;
                    }

                    if (
                        level === 4 &&
                        (
                            Math.abs(row2 - nightCenterRow) > nightRadius ||
                            Math.abs(col2 - nightCenterCol) > nightRadius
                        )
                    ) {
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

            if (board[row][col] >= 0) {
                values.push(board[row][col]);
            }
        }
    }

    let count = 0;

    do {

        shuffle(values);

        let index = 0;

        for (let row = 0; row < ROWS; row++) {
            for (let col = 0; col < COLUMNS; col++) {

                if (board[row][col] >= 0) {
                    board[row][col] =
                        values[index];

                    index++;
                }
            }
        }

        let closePairs = 0;

        for (let row = 0; row < ROWS; row++) {
            for (let col = 0; col < COLUMNS; col++) {

                if (board[row][col] < 0) {
                    continue;
                }

                if (
                    col + 1 < COLUMNS &&
                    board[row][col] ===
                    board[row][col + 1]
                ) {
                    closePairs++;
                }

                if (
                    row + 1 < ROWS &&
                    board[row][col] ===
                    board[row + 1][col]
                ) {
                    closePairs++;
                }
            }
        }

        count++;

        if (closePairs <= 10) {
            break;
        }

    } while (count < 100);
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

    } while (
        !hasMove() &&
        count < 100
        );

    renderBoard();

    showMessage(
        "Đã xáo trộn bàn chơi"
    );
}

function showHint() {
    if (paused || gameEnded) {
        return false;
    }

    for (let row1 = 0; row1 < ROWS; row1++) {

        for (
            let col1 = 0;
            col1 < COLUMNS;
            col1++
        ) {

            if (board[row1][col1] < 0) {
                continue;
            }
            if (
                level === 4 &&
                (
                    Math.abs(row1 - nightCenterRow) > nightRadius ||
                    Math.abs(col1 - nightCenterCol) > nightRadius
                )
            ) {
                continue;
            }

            for (
                let row2 = 0;
                row2 < ROWS;
                row2++
            ) {

                for (
                    let col2 = 0;
                    col2 < COLUMNS;
                    col2++
                ) {

                    if (
                        row1 === row2 &&
                        col1 === col2
                    ) {
                        continue;
                    }

                    if (
                        board[row1][col1] !==
                        board[row2][col2]
                    ) {
                        continue;
                    }

                    if (
                        level === 4 &&
                        (
                            Math.abs(row2 - nightCenterRow) > nightRadius ||
                            Math.abs(col2 - nightCenterCol) > nightRadius
                        )
                    ) {
                        continue;
                    }

                    let path =
                        findPath(
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

    showMessage(
        "Không tìm thấy cặp hình phù hợp"
    );

    return false;
}

function showHintCells(
    row1,
    col1,
    row2,
    col2
) {
    let cells =
        document.querySelectorAll(".cell");

    cells.forEach(function (cell) {

        let row =
            Number(cell.dataset.row);

        let col =
            Number(cell.dataset.col);

        if (
            (row === row1 &&
                col === col1) ||
            (row === row2 &&
                col === col2)
        ) {

            cell.classList.add("hint");

            setTimeout(function () {
                cell.classList.remove("hint");
            }, 1500);
        }
    });

    showMessage(
        "Hai hình được đánh dấu là một cặp"
    );
}

function updatePauseButton() {
    let icon =
        pauseButton.querySelector("i");

    let text =
        pauseButton.querySelector("span");

    if (!icon || !text) {
        return;
    }

    if (paused) {

        icon.className =
            "fa-solid fa-play";

        text.textContent =
            "Tiếp tục";

    } else {

        icon.className =
            "fa-solid fa-pause";

        text.textContent =
            "Tạm dừng";
    }
}

function updateSoundButton() {
    let icon =
        soundButton.querySelector("i");

    let text =
        soundButton.querySelector("span");

    if (!icon || !text) {
        return;
    }

    if (sound) {

        icon.className =
            "fa-solid fa-volume-high";

        text.textContent =
            "Âm thanh";

    } else {

        icon.className =
            "fa-solid fa-volume-xmark";

        text.textContent =
            "Tắt âm thanh";
    }
}

function updateHintCount() {
    let hintCountElement =
        document.querySelector(".hint-count");

    if (hintCountElement) {
        hintCountElement.textContent =
            hintCount;
    }
}

function updateShuffleCount() {
    let shuffleCountElement =
        document.querySelector(".shuffle-count");

    if (shuffleCountElement) {

        shuffleCountElement.textContent =
            shuffleCount;

        if (shuffleCount <= 0) {

            shuffleCountElement.classList.add(
                "empty"
            );

        } else {

            shuffleCountElement.classList.remove(
                "empty"
            );
        }
    }
}

function updateShuffleButton() {
    if (level === 5) {
        shuffleButton.style.display = "none";
    } else {
        shuffleButton.style.display = "";
    }
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

        let selectedLevel =
            Number(button.dataset.level);

        levelModal.classList.remove("show");

        startLevel(selectedLevel);
    });
});

hintButton.addEventListener("click", function () {

    if (gameEnded) {
        if (level === 5) {
            showMessage("Level 5 không sử dụng gợi ý");
            return;
        }
        showMessage("Game đã kết thúc");
        return;
    }

    if (hintCount <= 0) {
        showMessage(
            "Bạn đã hết lượt gợi ý"
        );

        return;
    }

    let hasHint = showHint();

    if (hasHint) {

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

    if (gameEnded) {
        return;
    }

    paused = !paused;

    updatePauseButton();

    if (paused) {

        showMessage(
            "Game đang tạm dừng"
        );

    } else {

        showMessage(
            "Tiếp tục chơi"
        );
    }
});

soundButton.addEventListener("click", function () {

    sound = !sound;

    updateSoundButton();

    if (sound) {

        showMessage(
            "Đã bật âm thanh"
        );

    } else {

        showMessage(
            "Đã tắt âm thanh"
        );
    }
});

exitButton.addEventListener("click", function () {
    clearInterval(timer);
    clearInterval(memoryHideTimer);

    gameEnded = true;
    paused = false;
    selected = null;

    clearPath();
    removeSelected();

    document.querySelector(".hint-count").style.display = "none";
    document.querySelector(".shuffle-count").style.display = "none";

    boardElement.innerHTML = "";

    showMessage(
        "Bạn đã thoát khỏi game"
    );
});