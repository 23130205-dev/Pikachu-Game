const ROWS = 8;
const COLUMNS = 14;

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
let selected = null;

const boardElement = document.getElementById("board");
const scoreElement = document.getElementById("score");
const messageElement = document.getElementById("message");

startGame();

function startGame() {
    score = 0;
    selected = null;

    updateScore();
    createBoard();
    renderBoard();

    showMessage("Hãy chọn 2 hình giống nhau");
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
        showMessage("Hai hình không giống nhau");

        removeSelected();

        return;
    }

    removePair(first, second);
}

function removePair(first, second) {
    board[first.row][first.col] = -1;
    board[second.row][second.col] = -1;

    score += 10;

    updateScore();

    removeSelected();
    renderBoard();

    showMessage("Đã nối thành công");
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