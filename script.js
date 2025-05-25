// Game constants
const GRID_SIZE = 20;
const INITIAL_GAME_SPEED = 150; // milliseconds - slower initial speed
const MAX_GAME_SPEED = 70; // milliseconds - faster maximum speed
const SPEED_INCREASE_INTERVAL = 3; // increase speed every X apples eaten

// Game variables
let canvas, ctx;
let snake, food;
let direction, nextDirection;
let score;
let gameInterval;
let gameRunning = false;
let currentSpeed = INITIAL_GAME_SPEED;
let applesEaten = 0;

// DOM elements
const scoreElement = document.getElementById('score');
const finalScoreElement = document.getElementById('final-score');
const gameOverElement = document.getElementById('game-over');
const startButton = document.getElementById('start-btn');
const restartButton = document.getElementById('restart-btn');
const playAgainButton = document.getElementById('play-again-btn');

// Initialize the game when the window loads
window.onload = function() {
    canvas = document.getElementById('game-board');
    ctx = canvas.getContext('2d');
    
    // Set canvas size to be responsive but maintain grid alignment
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // Add event listeners for buttons
    startButton.addEventListener('click', startGame);
    restartButton.addEventListener('click', restartGame);
    playAgainButton.addEventListener('click', restartGame);
    
    // Add keyboard event listeners
    document.addEventListener('keydown', handleKeyPress);
    
    // Add touch controls for mobile devices
    setupTouchControls();
    
    // Initial game setup
    setupGame();
};

// Resize canvas to fit screen while maintaining grid alignment
function resizeCanvas() {
    const maxSize = Math.min(window.innerWidth - 40, 600);
    const gridCount = Math.floor(maxSize / GRID_SIZE);
    canvas.width = gridCount * GRID_SIZE;
    canvas.height = gridCount * GRID_SIZE;
    
    // If game is not running, draw an empty board
    if (!gameRunning) {
        drawEmptyBoard();
    }
}

// Draw empty board with grid lines
function drawEmptyBoard() {
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 0.5;
    
    // Draw vertical grid lines
    for (let x = 0; x <= canvas.width; x += GRID_SIZE) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }
    
    // Draw horizontal grid lines
    for (let y = 0; y <= canvas.height; y += GRID_SIZE) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }
}

// Setup initial game state
function setupGame() {
    // Initialize snake in the middle of the canvas
    const centerX = Math.floor(canvas.width / GRID_SIZE / 2) * GRID_SIZE;
    const centerY = Math.floor(canvas.height / GRID_SIZE / 2) * GRID_SIZE;
    
    snake = [
        {x: centerX, y: centerY},
        {x: centerX - GRID_SIZE, y: centerY},
        {x: centerX - GRID_SIZE * 2, y: centerY}
    ];
    
    // Set initial direction to right
    direction = 'right';
    nextDirection = 'right';
    
    // Initialize score
    score = 0;
    scoreElement.textContent = score;
    
    // Generate first food
    generateFood();
    
    // Draw the initial state
    drawEmptyBoard();
    drawSnake();
    drawFood();
    
    // Hide game over screen if visible
    gameOverElement.style.display = 'none';
}

// Start the game
function startGame() {
    if (!gameRunning) {
        gameRunning = true;
        gameInterval = setInterval(gameLoop, currentSpeed);
        startButton.querySelector('i').classList.remove('fa-play');
        startButton.querySelector('i').classList.add('fa-pause');
    } else {
        clearInterval(gameInterval);
        gameRunning = false;
        startButton.querySelector('i').classList.remove('fa-pause');
        startButton.querySelector('i').classList.add('fa-play');
    }
}

// Restart the game
function restartGame() {
    clearInterval(gameInterval);
    gameRunning = false;
    currentSpeed = INITIAL_GAME_SPEED;
    applesEaten = 0;
    setupGame();
    startGame();
}

// Main game loop
function gameLoop() {
    // Update direction
    direction = nextDirection;
    
    // Move snake
    moveSnake();
    
    // Check for collisions
    if (checkCollision()) {
        endGame();
        return;
    }
    
    // Check if snake ate food
    if (snake[0].x === food.x && snake[0].y === food.y) {
        // Increase score
        score += 10;
        scoreElement.textContent = score;
        
        // Increase apples eaten count
        applesEaten++;
        
        // Increase speed every SPEED_INCREASE_INTERVAL apples
        if (applesEaten % SPEED_INCREASE_INTERVAL === 0 && currentSpeed > MAX_GAME_SPEED) {
            // Calculate new speed - gradually decrease the interval time
            currentSpeed = Math.max(MAX_GAME_SPEED, currentSpeed - 10);
            
            // Reset the interval with the new speed
            clearInterval(gameInterval);
            gameInterval = setInterval(gameLoop, currentSpeed);
        }
        
        // Don't remove the tail (snake grows)
        generateFood();
    } else {
        // Remove the tail
        snake.pop();
    }
    
    // Clear canvas and redraw everything
    drawEmptyBoard();
    drawSnake();
    drawFood();
}

// Move the snake based on current direction
function moveSnake() {
    const head = {x: snake[0].x, y: snake[0].y};
    
    switch (direction) {
        case 'up':
            head.y -= GRID_SIZE;
            break;
        case 'down':
            head.y += GRID_SIZE;
            break;
        case 'left':
            head.x -= GRID_SIZE;
            break;
        case 'right':
            head.x += GRID_SIZE;
            break;
    }
    
    // Add new head to the beginning of the snake array
    snake.unshift(head);
}

// Check for collisions with walls or self
function checkCollision() {
    const head = snake[0];
    
    // Check wall collision
    if (
        head.x < 0 ||
        head.y < 0 ||
        head.x >= canvas.width ||
        head.y >= canvas.height
    ) {
        return true;
    }
    
    // Check self collision (start from index 1 to skip the head)
    for (let i = 1; i < snake.length; i++) {
        if (head.x === snake[i].x && head.y === snake[i].y) {
            return true;
        }
    }
    
    return false;
}

// Generate food at random position
function generateFood() {
    // Calculate grid cells available
    const gridWidth = canvas.width / GRID_SIZE;
    const gridHeight = canvas.height / GRID_SIZE;
    
    let foodX, foodY;
    let foodOnSnake;
    
    // Keep generating until we find a position not on the snake
    do {
        foodOnSnake = false;
        foodX = Math.floor(Math.random() * gridWidth) * GRID_SIZE;
        foodY = Math.floor(Math.random() * gridHeight) * GRID_SIZE;
        
        // Check if food is on snake
        for (let segment of snake) {
            if (segment.x === foodX && segment.y === foodY) {
                foodOnSnake = true;
                break;
            }
        }
    } while (foodOnSnake);
    
    food = {x: foodX, y: foodY};
}

// Draw the snake
function drawSnake() {
    snake.forEach((segment, index) => {
        // Head is a different color
        if (index === 0) {
            ctx.fillStyle = '#4eff75'; // Bright green for head
        } else {
            ctx.fillStyle = '#2ecc71'; // Lighter green for body
        }
        
        ctx.fillRect(segment.x, segment.y, GRID_SIZE, GRID_SIZE);
        
        // Add border to each segment
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.lineWidth = 1;
        ctx.strokeRect(segment.x, segment.y, GRID_SIZE, GRID_SIZE);
        
        // Add eyes to the head
        if (index === 0) {
            drawSnakeEyes(segment);
        }
    });
}

// Draw the food
function drawFood() {
    // Draw a glowing red apple
    ctx.fillStyle = '#ff3b3b';
    ctx.beginPath();
    ctx.arc(food.x + GRID_SIZE/2, food.y + GRID_SIZE/2, GRID_SIZE/2 - 2, 0, Math.PI * 2);
    ctx.fill();
    
    // Add a stem
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(food.x + GRID_SIZE/2 - 1, food.y + 2, 2, 4);
    
    // Add a leaf
    ctx.fillStyle = '#50C878';
    ctx.beginPath();
    ctx.ellipse(food.x + GRID_SIZE/2 + 4, food.y + 4, 3, 5, Math.PI / 4, 0, Math.PI * 2);
    ctx.fill();
}

// Draw eyes on snake head based on direction
function drawSnakeEyes(head) {
    const eyeSize = GRID_SIZE / 5;
    const eyeOffset = GRID_SIZE / 4;
    
    ctx.fillStyle = 'white';
    
    switch (direction) {
        case 'up':
            // Left eye
            ctx.fillRect(head.x + eyeOffset, head.y + eyeOffset, eyeSize, eyeSize);
            // Right eye
            ctx.fillRect(head.x + GRID_SIZE - eyeOffset - eyeSize, head.y + eyeOffset, eyeSize, eyeSize);
            break;
        case 'down':
            // Left eye
            ctx.fillRect(head.x + eyeOffset, head.y + GRID_SIZE - eyeOffset - eyeSize, eyeSize, eyeSize);
            // Right eye
            ctx.fillRect(head.x + GRID_SIZE - eyeOffset - eyeSize, head.y + GRID_SIZE - eyeOffset - eyeSize, eyeSize, eyeSize);
            break;
        case 'left':
            // Left eye
            ctx.fillRect(head.x + eyeOffset, head.y + eyeOffset, eyeSize, eyeSize);
            // Right eye
            ctx.fillRect(head.x + eyeOffset, head.y + GRID_SIZE - eyeOffset - eyeSize, eyeSize, eyeSize);
            break;
        case 'right':
            // Left eye
            ctx.fillRect(head.x + GRID_SIZE - eyeOffset - eyeSize, head.y + eyeOffset, eyeSize, eyeSize);
            // Right eye
            ctx.fillRect(head.x + GRID_SIZE - eyeOffset - eyeSize, head.y + GRID_SIZE - eyeOffset - eyeSize, eyeSize, eyeSize);
            break;
    }
    
    // Add black pupils
    ctx.fillStyle = 'black';
    const pupilSize = eyeSize / 2;
    
    switch (direction) {
        case 'up':
            // Left pupil
            ctx.fillRect(head.x + eyeOffset + eyeSize/4, head.y + eyeOffset + eyeSize/4, pupilSize, pupilSize);
            // Right pupil
            ctx.fillRect(head.x + GRID_SIZE - eyeOffset - eyeSize + eyeSize/4, head.y + eyeOffset + eyeSize/4, pupilSize, pupilSize);
            break;
        case 'down':
            // Left pupil
            ctx.fillRect(head.x + eyeOffset + eyeSize/4, head.y + GRID_SIZE - eyeOffset - eyeSize + eyeSize/4, pupilSize, pupilSize);
            // Right pupil
            ctx.fillRect(head.x + GRID_SIZE - eyeOffset - eyeSize + eyeSize/4, head.y + GRID_SIZE - eyeOffset - eyeSize + eyeSize/4, pupilSize, pupilSize);
            break;
        case 'left':
            // Left pupil
            ctx.fillRect(head.x + eyeOffset + eyeSize/4, head.y + eyeOffset + eyeSize/4, pupilSize, pupilSize);
            // Right pupil
            ctx.fillRect(head.x + eyeOffset + eyeSize/4, head.y + GRID_SIZE - eyeOffset - eyeSize + eyeSize/4, pupilSize, pupilSize);
            break;
        case 'right':
            // Left pupil
            ctx.fillRect(head.x + GRID_SIZE - eyeOffset - eyeSize + eyeSize/4, head.y + eyeOffset + eyeSize/4, pupilSize, pupilSize);
            // Right pupil
            ctx.fillRect(head.x + GRID_SIZE - eyeOffset - eyeSize + eyeSize/4, head.y + GRID_SIZE - eyeOffset - eyeSize + eyeSize/4, pupilSize, pupilSize);
            break;
    }
}

// Handle keyboard input
function handleKeyPress(event) {
    // Prevent arrow keys from scrolling the page
    if ([37, 38, 39, 40, 32].includes(event.keyCode)) {
        event.preventDefault();
    }
    
    // Start game with any key if not running
    if (!gameRunning && event.keyCode !== 32) { // Not space key
        startGame();
    }
    
    // Space key to pause/resume
    if (event.keyCode === 32) { // Space key
        if (gameRunning) {
            clearInterval(gameInterval);
            gameRunning = false;
        } else {
            startGame();
        }
        return;
    }
    
    // Change direction based on arrow keys
    switch (event.keyCode) {
        case 38: // Up arrow
        case 87: // W key
            if (direction !== 'down') {
                nextDirection = 'up';
            }
            break;
        case 40: // Down arrow
        case 83: // S key
            if (direction !== 'up') {
                nextDirection = 'down';
            }
            break;
        case 37: // Left arrow
        case 65: // A key
            if (direction !== 'right') {
                nextDirection = 'left';
            }
            break;
        case 39: // Right arrow
        case 68: // D key
            if (direction !== 'left') {
                nextDirection = 'right';
            }
            break;
    }
}

// Setup touch controls for mobile devices
function setupTouchControls() {
    let touchStartX = 0;
    let touchStartY = 0;
    
    canvas.addEventListener('touchstart', function(event) {
        touchStartX = event.touches[0].clientX;
        touchStartY = event.touches[0].clientY;
        event.preventDefault();
        
        // Start game on first touch if not running
        if (!gameRunning) {
            startGame();
        }
    }, false);
    
    canvas.addEventListener('touchmove', function(event) {
        event.preventDefault();
    }, false);
    
    canvas.addEventListener('touchend', function(event) {
        const touchEndX = event.changedTouches[0].clientX;
        const touchEndY = event.changedTouches[0].clientY;
        
        const dx = touchEndX - touchStartX;
        const dy = touchEndY - touchStartY;
        
        // Determine swipe direction based on which axis had the larger change
        if (Math.abs(dx) > Math.abs(dy)) {
            // Horizontal swipe
            if (dx > 0 && direction !== 'left') {
                nextDirection = 'right';
            } else if (dx < 0 && direction !== 'right') {
                nextDirection = 'left';
            }
        } else {
            // Vertical swipe
            if (dy > 0 && direction !== 'up') {
                nextDirection = 'down';
            } else if (dy < 0 && direction !== 'down') {
                nextDirection = 'up';
            }
        }
        
        event.preventDefault();
    }, false);
}

// End the game
function endGame() {
    clearInterval(gameInterval);
    gameRunning = false;
    
    // Show game over screen
    finalScoreElement.textContent = score;
    gameOverElement.style.display = 'block';
}