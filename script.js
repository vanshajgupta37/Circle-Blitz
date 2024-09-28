// Global variables
let currentUser = null;
let score = 0;
let timer = 30;
let hitrn = 0;
let gameInterval;
let difficultyLevel = 1;
let isPaused = false;
let soundEnabled = true;
let currentPage = 1;
let totalPages = 3;

// Sound effects
const sounds = {
    correct: new Audio('sounds/correct-sound.wav'),
    wrong: new Audio('sounds/wrong-sound.wav'),
    gameOver: new Audio('sounds/game-over-sound.wav')
};

// Ensure sounds are loaded
Object.values(sounds).forEach(sound => {
    sound.addEventListener('error', () => {
        console.warn(`Failed to load sound: ${sound.src}`);
        soundEnabled = false;
    });
});

// DOM Elements
const pages = {
    home: document.getElementById('homepage'),
    login: document.getElementById('loginPage'),
    register: document.getElementById('registerPage'),
    game: document.getElementById('gamePage'),
    gameOver: document.getElementById('gameOverPage'),
    profile: document.getElementById('profilePage'),
    leaderboard: document.getElementById('leaderboardPage')
};

const elements = {
    gameBoard: document.getElementById('B2'),
    target: document.getElementById('target'),
    timerDisplay: document.getElementById('runtimer'),
    scoreDisplay: document.getElementById('scorer'),
    levelDisplay: document.getElementById('level'),
    finalScore: document.getElementById('finalScore'),
    finalLevel: document.getElementById('finalLevel'),
    pauseButton: document.getElementById('pauseButton'),
    profileUsername: document.getElementById('profileUsername'),
    gamesPlayed: document.getElementById('gamesPlayed'),
    highestScore: document.getElementById('highestScore'),
    averageScore: document.getElementById('averageScore'),
    highestLevel: document.getElementById('highestLevel'),
    recentScores: document.getElementById('recentScores'),
    leaderboardBody: document.getElementById('leaderboardBody'),
    prevPageButton: document.getElementById('prevPage'),
    nextPageButton: document.getElementById('nextPage'),
    currentPageElement: document.getElementById('currentPage')
};

// Utility functions
function showPage(pageId) {
    Object.values(pages).forEach(page => {
        if (page) page.style.display = 'none';
    });
    if (pages[pageId]) pages[pageId].style.display = 'flex';
}

function playSound(soundName) {
    if (soundEnabled && sounds[soundName]) {
        sounds[soundName].play().catch(error => console.warn('Error playing sound:', error));
    }
}

function getRandomColor() {
    return `hsl(${Math.random() * 360}, 100%, 75%)`;
}


function initializeGame() {
    score = 0;
    timer = 30;
    difficultyLevel = 1;
    isPaused = false;
    currentPage = 1;
    updateDisplay();
    makeCircles();
    updateTarget();
    runTimer();
}

function makeCircles() {
    let series = "";
    for(let i = 0; i < 120; i++){
        series += `<div class="circle">${Math.floor(Math.random()*10)}</div>`;
    }
    elements.gameBoard.innerHTML = series;
}


function updateTarget() {
    hitrn = Math.floor(Math.random() * 10);
    elements.target.textContent = hitrn;
}

function updateDisplay() {
    elements.scoreDisplay.textContent = score;
    elements.timerDisplay.textContent = timer;
    if (elements.levelDisplay) elements.levelDisplay.textContent = difficultyLevel;
}

function runTimer() {
    clearInterval(gameInterval);
    gameInterval = setInterval(() => {
        if (!isPaused) {
            timer--;
            updateDisplay();
            if (timer <= 0) {
                endGame();
            }
        }
    }, 1000);
}

function updateScore() {
    score += 10 * difficultyLevel;
    if (score % 100 === 0) {
        difficultyLevel++;
        makeCircles();
    }
    updateDisplay();
}

function endGame() {
    clearInterval(gameInterval);
    playSound('gameOver');
    showPage('gameOver');
    if (elements.finalScore) elements.finalScore.textContent = score;
    if (elements.finalLevel) elements.finalLevel.textContent = difficultyLevel;
    if (currentUser) {
        updateUserScore(currentUser, score, difficultyLevel);
    }
    updateLeaderboard();
}

// User management functions
function login(username, password) {
    let users = JSON.parse(localStorage.getItem('users')) || {};
    if (users[username] && users[username].password === password) {
        currentUser = username;
        showPage('home');
        updateProfile();
        alert('Logged in successfully!');
        return true;
    } else {
        alert('Invalid username or password');
        return false;
    }
}

function register(username, password) {
    let users = JSON.parse(localStorage.getItem('users')) || {};
    if (users[username]) {
        alert('Username already exists');
        return false;
    } else {
        users[username] = { 
            password: password, 
            scores: [],
            highestLevel: 0,
            gamesPlayed: 0
        };
        localStorage.setItem('users', JSON.stringify(users));
        currentUser = username;
        showPage('home');
        updateProfile();
        alert('Registered successfully!');
        return true;
    }
}

function logout() {
    currentUser = null;
    showPage('home');
}

function updateUserScore(username, newScore, newLevel) {
    let users = JSON.parse(localStorage.getItem('users')) || {};
    if (users[username]) {
        users[username].scores.push(newScore);
        users[username].scores.sort((a, b) => b - a);
        users[username].scores = users[username].scores.slice(0, 5);
        users[username].gamesPlayed++;
        users[username].highestLevel = Math.max(users[username].highestLevel, newLevel);
        localStorage.setItem('users', JSON.stringify(users));
    }
}

function updateProfile() {
    if (currentUser) {
        let users = JSON.parse(localStorage.getItem('users')) || {};
        let user = users[currentUser];
        if (elements.profileUsername) elements.profileUsername.textContent = currentUser;
        if (elements.gamesPlayed) elements.gamesPlayed.textContent = user.gamesPlayed;
        if (elements.highestScore) elements.highestScore.textContent = user.scores.length > 0 ? Math.max(...user.scores) : 0;
        if (elements.averageScore) elements.averageScore.textContent = user.scores.length > 0 ? 
            Math.round(user.scores.reduce((a, b) => a + b) / user.scores.length) : 0;
        if (elements.highestLevel) elements.highestLevel.textContent = user.highestLevel;
        
        if (elements.recentScores) {
            elements.recentScores.innerHTML = '';
            user.scores.forEach(score => {
                let li = document.createElement('li');
                li.textContent = score;
                elements.recentScores.appendChild(li);
            });
        }
    }
}

function updateLeaderboard() {
    let users = JSON.parse(localStorage.getItem('users')) || {};
    let scores = Object.entries(users).map(([username, data]) => ({
        username,
        highestScore: data.scores.length > 0 ? Math.max(...data.scores) : 0,
        highestLevel: data.highestLevel || 0
    }));
    
    scores.sort((a, b) => b.highestScore - a.highestScore);
    
    if (elements.leaderboardBody) {
        elements.leaderboardBody.innerHTML = '';
        scores.slice(0, 10).forEach((entry, index) => {
            let row = elements.leaderboardBody.insertRow();
            row.insertCell(0).textContent = index + 1;
            row.insertCell(1).textContent = entry.username;
            row.insertCell(2).textContent = entry.highestScore;
            row.insertCell(3).textContent = entry.highestLevel;
        });
    }
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    showPage('home');
    updateLeaderboard();

    // Navigation buttons
    const navButtons = {
        homeButton: () => showPage('home'),
        profileButton: () => {
            if (currentUser) {
                updateProfile();
                showPage('profile');
            } else {
                alert('Please log in to view your profile');
            }
        },
        leaderboardButton: () => {
            updateLeaderboard();
            showPage('leaderboard');
        },
        logoutButton: logout
    };

    Object.entries(navButtons).forEach(([id, action]) => {
        const button = document.getElementById(id);
        if (button) button.addEventListener('click', action);
    });

    // Home page buttons
    const homeButtons = {
        playButton: () => {
            showPage('game');
            initializeGame();
        },
        loginButton: () => showPage('login'),
        registerButton: () => showPage('register')
    };

    Object.entries(homeButtons).forEach(([id, action]) => {
        const button = document.getElementById(id);
        if (button) button.addEventListener('click', action);
    });

    // Login form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            let username = document.getElementById('loginUsername').value;
            let password = document.getElementById('loginPassword').value;
            login(username, password);
        });
    }

    // Register form
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            let username = document.getElementById('registerUsername').value;
            let password = document.getElementById('registerPassword').value;
            let confirmPassword = document.getElementById('confirmPassword').value;
            if (password !== confirmPassword) {
                alert('Passwords do not match');
                return;
            }
            register(username, password);
        });
    }

    // Game board click event
    if (elements.gameBoard) {
        elements.gameBoard.addEventListener('click', (e) => {
            if (e.target.classList.contains('circle') && !isPaused) {
                let clickedNum = Number(e.target.textContent);
                if (clickedNum === hitrn) {
                    playSound('correct');
                    e.target.style.backgroundColor = 'green';
                    setTimeout(() => {
                        updateScore();
                        updateTarget();
                        makeCircles();
                    }, 200);
                } else {
                    playSound('wrong');
                    e.target.style.backgroundColor = 'red';
                    setTimeout(() => {
                        e.target.style.backgroundColor = "rgb(129, 197, 252)";
                    }, 200);
                }
            }
        });
    }

    // Pause button
    if (elements.pauseButton) {
        elements.pauseButton.addEventListener('click', () => {
            isPaused = !isPaused;
            elements.pauseButton.textContent = isPaused ? 'Resume' : 'Pause';
        });
    }

    // Play Again button
    const playAgainButton = document.getElementById('playAgainButton');
    if (playAgainButton) {
        playAgainButton.addEventListener('click', () => {
            showPage('game');
            initializeGame();
        });
    }

    
});

function updatePage() {
    if (elements.currentPageElement) {
        elements.currentPageElement.textContent = `Page ${currentPage} of ${totalPages}`;
    }
    makeCircles();
}


const darkModeToggle = document.getElementById('darkModeToggle');
const body = document.body;

darkModeToggle.addEventListener('change', () => {
    body.classList.toggle('dark-mode');
    localStorage.setItem('darkMode', body.classList.contains('dark-mode'));
});

const savedDarkMode = localStorage.getItem('darkMode');
if (savedDarkMode === 'true') {
    body.classList.add('dark-mode');
    darkModeToggle.checked = true;
}

// Initializing Game
initializeGame();