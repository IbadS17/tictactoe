const board = document.querySelector(".board");
const cells = document.querySelectorAll(".cell");
const statusDisplay = document.querySelector(".status");
const resetButton = document.querySelector(".reset");
const undoButton = document.querySelector(".undo");
const redoButton = document.querySelector(".redo");
const playerXScoreElem = document.getElementById("player-x-score");
const playerOScoreElem = document.getElementById("player-o-score");
const drawsScoreElem = document.getElementById("draws-score");
const winSound = document.getElementById("win-sound");
const moveSound = document.getElementById("move-sound");
const confetti = document.getElementById("confetti");
const themeSelector = document.getElementById("theme");
const xColorInput = document.getElementById("x-color");
const oColorInput = document.getElementById("o-color");

const PLAYER_X = "X";
const PLAYER_O = "O";
let currentPlayer = PLAYER_X;
let gameActive = true;
let boardState = ["", "", "", "", "", "", "", "", ""];
let moveHistory = [];
let redoStack = [];
let playerXScore = 0;
let playerOScore = 0;
let drawsScore = 0;
let difficulty = "easy";
let mode = "single";

const winningConditions = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

const handleCellClick = (event) => {
  if (
    !gameActive ||
    (mode === "multi" && currentPlayer !== PLAYER_X) ||
    (mode === "single" &&
      currentPlayer !== PLAYER_X &&
      event.target.dataset.index !== "")
  ) {
    return; // Prevent click handling if the game is not active or if it's not the current player's turn
  }

  const clickedCellIndex = parseInt(event.target.getAttribute("data-index"));

  // Place move
  if (boardState[clickedCellIndex] === "") {
    boardState[clickedCellIndex] = currentPlayer;
    event.target.textContent = currentPlayer;
    event.target.style.color =
      currentPlayer === PLAYER_X ? xColorInput.value : oColorInput.value;
    moveSound.play();

    // Save move history and clear redo stack
    moveHistory.push({ index: clickedCellIndex, player: currentPlayer });
    redoStack = [];

    // Check the result
    checkResult();

    if (gameActive) {
      if (mode === "multi") {
        // Switch player turn in multiplayer mode
        currentPlayer = currentPlayer === PLAYER_X ? PLAYER_O : PLAYER_X;
        statusDisplay.textContent = `Player ${currentPlayer}'s turn`;
      } else if (mode === "single" && currentPlayer === PLAYER_X) {
        // Switch to AI in single-player mode
        currentPlayer = PLAYER_O;
        setTimeout(aiMove, 500); // AI makes a move after a delay
      }
    }
  }
};

const checkResult = () => {
  let roundWon = false;
  let winningCells = [];

  const winningConditions = getWinningConditions();

  for (let i = 0; i < winningConditions.length; i++) {
    const condition = winningConditions[i];
    const [a, b, c, d] = condition;

    if (
      boardState[a] !== "" &&
      boardState[a] === boardState[b] &&
      boardState[a] === boardState[c] &&
      (gridSize === 4 ? boardState[a] === boardState[d] : true)
    ) {
      roundWon = true;
      winningCells = condition;
      break;
    }
  }

  if (roundWon) {
    statusDisplay.textContent = `Player ${currentPlayer} wins!`;
    winSound.play();

    // Animate winning cells
    winningCells.forEach((index) => {
      cells[index].classList.add("winning-cell");
    });

    // Show confetti
    showConfetti();

    if (currentPlayer === PLAYER_X) {
      playerXScore++;
    } else {
      playerOScore++;
    }
    updateScores();
    gameActive = false;
    return;
  }

  const roundDraw = !boardState.includes("");
  if (roundDraw) {
    statusDisplay.textContent = "It's a draw!";
    drawsScore++;
    updateScores();
    gameActive = false;
    return;
  }

  if (mode === "multi") {
    statusDisplay.textContent = `Player ${currentPlayer}'s turn`;
  }
};

const aiMove = () => {
  if (mode !== "single" || !gameActive) return; // Exit if not in single-player mode or game is inactive

  let bestMove;

  if (difficulty === "hard") {
    bestMove = findBestMove();
  } else {
    const emptyCells = [];
    boardState.forEach((cell, index) => {
      if (cell === "") {
        emptyCells.push(index);
      }
    });
    const randomIndex =
      emptyCells[Math.floor(Math.random() * emptyCells.length)];
    bestMove = randomIndex;
  }

  boardState[bestMove] = PLAYER_O;
  cells[bestMove].textContent = PLAYER_O;
  cells[bestMove].style.color = oColorInput.value;
  moveSound.play();

  // Save move history and clear redo stack
  moveHistory.push({ index: bestMove, player: PLAYER_O });
  redoStack = [];

  checkResult();

  if (gameActive) {
    currentPlayer = PLAYER_X;
    statusDisplay.textContent = `Player ${currentPlayer}'s turn`;
  }
};

const findBestMove = () => {
  let bestScore = -Infinity;
  let move;

  for (let i = 0; i < boardState.length; i++) {
    if (boardState[i] === "") {
      boardState[i] = PLAYER_O;
      let score = minimax(boardState, 0, false);
      boardState[i] = "";
      if (score > bestScore) {
        bestScore = score;
        move = i;
      }
    }
  }
  return move;
};

const minimax = (board, depth, isMaximizing) => {
  const winner = checkWin(board);
  if (winner === PLAYER_O) return 10 - depth;
  if (winner === PLAYER_X) return depth - 10;
  if (!board.includes("")) return 0;

  if (isMaximizing) {
    let bestScore = -Infinity;
    for (let i = 0; i < board.length; i++) {
      if (board[i] === "") {
        board[i] = PLAYER_O;
        let score = minimax(board, depth + 1, false);
        board[i] = "";
        bestScore = Math.max(score, bestScore);
      }
    }
    return bestScore;
  } else {
    let bestScore = Infinity;
    for (let i = 0; i < board.length; i++) {
      if (board[i] === "") {
        board[i] = PLAYER_X;
        let score = minimax(board, depth + 1, true);
        board[i] = "";
        bestScore = Math.min(score, bestScore);
      }
    }
    return bestScore;
  }
};

const checkWin = (board) => {
  for (let i = 0; i < winningConditions.length; i++) {
    const [a, b, c] = winningConditions[i];
    if (board[a] !== "" && board[a] === board[b] && board[a] === board[c]) {
      return board[a];
    }
  }
  return null;
};

const resetGame = () => {
  currentPlayer = PLAYER_X;
  gameActive = true;
  boardState = ["", "", "", "", "", "", "", "", ""];
  moveHistory = [];
  redoStack = [];
  cells.forEach((cell) => {
    cell.textContent = "";
    cell.style.backgroundColor = "#f8f9fa";
    cell.style.color =
      currentPlayer === PLAYER_X ? xColorInput.value : oColorInput.value;
    cell.classList.remove("winning-cell"); // Remove winning cell highlight
  });
  statusDisplay.textContent = `Player ${PLAYER_X}'s turn`;
  applyColors(); // Apply colors
};

const updateScores = () => {
  playerXScoreElem.textContent = playerXScore;
  playerOScoreElem.textContent = playerOScore;
  drawsScoreElem.textContent = drawsScore;
};

const updateModeAndDifficulty = () => {
  mode = document.querySelector('input[name="mode"]:checked').value;
  difficulty = document.getElementById("difficulty").value;
  resetGame(); // Reset game when mode or difficulty changes
};

const showConfetti = () => {
  confetti.innerHTML = "";
  for (let i = 0; i < 100; i++) {
    const piece = document.createElement("div");
    piece.classList.add("confetti-piece");
    piece.style.left = `${Math.random() * 100}vw`;
    piece.style.backgroundColor = `hsl(${Math.random() * 360}, 70%, 60%)`;
    piece.style.animation = `confetti-fall ${Math.random() * 3 + 2}s ease-out`;
    confetti.appendChild(piece);
  }
};

const applyTheme = (theme) => {
  document.body.className = theme;
};

const applyColors = () => {
  const xColor = xColorInput.value;
  const oColor = oColorInput.value;

  cells.forEach((cell) => {
    if (cell.textContent === PLAYER_X) {
      cell.style.color = xColor;
    } else if (cell.textContent === PLAYER_O) {
      cell.style.color = oColor;
    }
  });
};

themeSelector.addEventListener("change", () => {
  applyTheme(themeSelector.value);
  resetGame(); // Apply theme on reset
});

xColorInput.addEventListener("change", applyColors);
oColorInput.addEventListener("change", applyColors);

document
  .querySelectorAll(".cell")
  .forEach((cell) => cell.addEventListener("click", handleCellClick));
resetButton.addEventListener("click", resetGame);
document
  .querySelectorAll('input[name="mode"], #difficulty')
  .forEach((el) => el.addEventListener("change", updateModeAndDifficulty));

// Initialize default settings
updateModeAndDifficulty();
applyTheme(themeSelector.value);
applyColors();
statusDisplay.textContent = `Player ${PLAYER_X}'s turn`;

const gridSizeSelect = document.getElementById("grid-size");
const grid = document.querySelector(".grid");
let gridSize = 3; // Default size

const createGrid = () => {
  grid.innerHTML = ""; // Clear previous grid
  grid.className = `grid grid-${gridSize}x${gridSize}`;
  boardState = Array(gridSize * gridSize).fill("");

  for (let i = 0; i < gridSize * gridSize; i++) {
    const cell = document.createElement("div");
    cell.className = "cell";
    cell.dataset.index = i;
    grid.appendChild(cell);
  }

  cells = Array.from(document.querySelectorAll(".cell"));
  cells.forEach((cell) => cell.addEventListener("click", handleCellClick));
  resetGame();
};

const getWinningConditions = () => {
  const winningConditions = [];

  // Horizontal and vertical wins
  for (let i = 0; i < gridSize; i++) {
    winningConditions.push(
      [...Array(gridSize).keys()].map((j) => i * gridSize + j)
    ); // Row
    winningConditions.push(
      [...Array(gridSize).keys()].map((j) => j * gridSize + i)
    ); // Column
  }

  // Diagonal wins
  winningConditions.push(
    [...Array(gridSize).keys()].map((i) => i * (gridSize + 1))
  ); // \ Diagonal
  winningConditions.push(
    [...Array(gridSize).keys()].map((i) => (i + 1) * (gridSize - 1))
  ); // / Diagonal

  return winningConditions;
};
