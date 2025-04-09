// Quiz Configuration
const colors = [
    ["#f79c99", "#f7d7d2"],
    ["#a2f7a2", "#d7f7d2"],
    ["#a2a2f7", "#d2d7f7"],
    ["#f7f7a2", "#f7f7c7"],
    ["#a2f7c7", "#d2f7d7"],
    ["#a2c7f7", "#d2d7f7"],
    ["#f7c7a2", "#f7d2c7"],
    ["#c7f7a2", "#d2f7a2"],
    ["#a2a2c7", "#d7d7f7"],
    ["#c7a2f7", "#d2c7f7"],
];

// Quiz Variables
let score = 0;
let currentQuestionIndex = 0;
const totalQuestions = 10;
let imageFolder = "Img"; // Default image folder
let sessionId = generateSessionId();
let playNumber = getPlayNumber();
let userAnswers = new Array(totalQuestions).fill(null);
let userConfidence = new Array(totalQuestions).fill(null);
let timerInterval;
const quizStartTime = Date.now();
let isReviewMode = false;

// This will store our randomized image paths and their correct answers
let imageSet = [];
let correctAnswers = {};

// Initialize the quiz when DOM is loaded
document.addEventListener("DOMContentLoaded", function () {
    // Set image folder based on user data
    const userAge = localStorage.getItem("userAge");
    const userProfession = localStorage.getItem("userProfession");

    if (userAge !== null && userProfession !== null) {
        const age = parseInt(userAge);
        if (userProfession !== "engineer") {
            if (age >= 0 && age <= 18) {
                imageFolder = "Img18";
            } else if (age >= 19 && age <= 60) {
                imageFolder = "Img60";
            } else if (age >= 61 && age <= 100) {
                imageFolder = "Img70";
            }
        }
    }
    
    // Initialize the image set (5 from R folder, 5 from F folder)
    initializeImageSet();
    
    // Create navigation
    createNavigation();
    
    // Initialize timer
    initializeTimer();
    
    // Set up event listeners
    setupEventListeners();
    
    // Update first question
    updateQuestion();
});

function createNavigation() {
    const navContainer = document.getElementById("question-nav");
    
    for (let i = 0; i < totalQuestions; i++) {
        let btn = document.createElement("button");
        btn.textContent = i + 1;
        btn.classList.add("nav-btn");
        btn.addEventListener("click", () => goToQuestion(i));
        navContainer.appendChild(btn);
    }
}

function initializeImageSet() {
    // Total number of images available in each folder
    const totalImages = 50;
    
    // Create separate arrays for R and F folder images
    const allRImages = Array.from({length: totalImages}, (_, i) => ({
        path: `${imageFolder}/R/${i+1}.jpg`,
        answer: "Real"
    }));
    
    const allFImages = Array.from({length: totalImages}, (_, i) => ({
        path: `${imageFolder}/F/${i+1}.jpg`,
        answer: "Fake"
    }));
    
    // Shuffle both sets separately
    shuffleArray(allRImages);
    shuffleArray(allFImages);
    
    // Take first 5 from each shuffled set
    const selectedR = allRImages.slice(0, 5);
    const selectedF = allFImages.slice(0, 5);
    
    // Combine all selected images
    imageSet = [...selectedR, ...selectedF];
    
    // Shuffle the combined set again for final randomness
    shuffleArray(imageSet);
    
    // Create correct answers mapping
    imageSet.forEach((img, index) => {
        correctAnswers[index] = img.answer;
    });
    
    console.log("Selected images:", imageSet); // For debugging
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function initializeTimer() {
    let totalTime = 600;
    function updateTimer() {
        const minutes = Math.floor(totalTime / 60);
        const seconds = totalTime % 60;
        document.getElementById("timer").textContent = `Time Left: ${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

        if (totalTime <= 60) {
            document.getElementById("timer").style.color = "red";
        }

        if (totalTime <= 0) {
            clearInterval(timerInterval);
            endQuiz();
        }
        totalTime--;
    }
    timerInterval = setInterval(updateTimer, 1000);
}

function setupEventListeners() {
    document.getElementById("real-btn").addEventListener("click", () => checkAnswer(true));
    document.getElementById("fake-btn").addEventListener("click", () => checkAnswer(false));
    
    document.getElementById("confidence-slider").addEventListener("input", function() {
        userConfidence[currentQuestionIndex] = parseInt(this.value);
    });
    
    document.getElementById('review-btn').addEventListener('click', toggleReviewMode);
    document.getElementById('submit-btn').addEventListener('click', submitQuiz);
}

function updateQuestion() {
    setGradientBackground();
    document.getElementById("question-title").textContent = "Question " + (currentQuestionIndex + 1);
    
    // Get the image for this question from the randomized set
    document.getElementById("quiz-image").src = imageSet[currentQuestionIndex].path;
    
    // Reset button colors
    document.getElementById("real-btn").style.backgroundColor = "";
    document.getElementById("fake-btn").style.backgroundColor = "";
    
    // Set confidence slider to saved value or default
    document.getElementById("confidence-slider").value = userConfidence[currentQuestionIndex] || 3;
    
    // If the question was already answered, show the answer
    if (userAnswers[currentQuestionIndex] !== null) {
        document.getElementById("real-btn").style.backgroundColor = userAnswers[currentQuestionIndex] === "Real" ? "darkgreen" : "";
        document.getElementById("fake-btn").style.backgroundColor = userAnswers[currentQuestionIndex] === "Fake" ? "red" : "";
    }
}

function checkAnswer(isReal) {
    let userAnswer = isReal ? "Real" : "Fake";
    userAnswers[currentQuestionIndex] = userAnswer;
    userConfidence[currentQuestionIndex] = parseInt(document.getElementById("confidence-slider").value);
    
    markAnswered(currentQuestionIndex);
    updateProgress();
    
    if (isReviewMode) {
        updateQuestionDisplayForReview();
    } else {
        let nextIndex = findNextUnanswered(currentQuestionIndex);
        if (nextIndex !== -1) {
            currentQuestionIndex = nextIndex;
            updateQuestion();
        } else {
            toggleReviewMode();
        }
    }
}

function markAnswered(index) {
    const navButtons = document.querySelectorAll(".nav-btn");
    const button = navButtons[index];
    button.classList.add(isReviewMode ? "review" : "answered");
    button.classList.remove(isReviewMode ? "answered" : "review");
}

function updateProgress() {
    let answeredCount = userAnswers.filter(answer => answer !== null).length;
    const progress = (answeredCount / totalQuestions) * 100;
    document.getElementById("progress-bar-filled").style.width = progress + "%";
    document.getElementById("progress-bar-filled").textContent = Math.round(progress) + "%";
}

function updateScore() {
    document.getElementById("score").textContent = score;
}

function goToQuestion(index) {
    currentQuestionIndex = index;
    if (isReviewMode) {
        updateQuestionDisplayForReview();
    } else {
        updateQuestion();
    }
}

function findNextUnanswered(current) {
    for (let i = current + 1; i < totalQuestions; i++) {
        if (userAnswers[i] === null) return i;
    }
    for (let i = 0; i <= current; i++) {
        if (userAnswers[i] === null) return i;
    }
    return -1;
}

function toggleReviewMode() {
    isReviewMode = !isReviewMode;
    
    if (isReviewMode) {
        document.getElementById('review-btn').textContent = 'Continue Quiz';
        document.getElementById('submit-btn').style.display = 'block';
        
        document.querySelectorAll('.nav-btn').forEach((btn, index) => {
            if (userAnswers[index] !== null) {
                btn.classList.add('review');
                btn.classList.remove('answered');
            }
        });
        
        updateQuestionDisplayForReview();
    } else {
        document.getElementById('review-btn').textContent = 'Review Answers';
        document.getElementById('submit-btn').style.display = 'none';
        
        document.querySelectorAll('.nav-btn').forEach((btn, index) => {
            if (userAnswers[index] !== null) {
                btn.classList.add('answered');
                btn.classList.remove('review');
            }
        });
        
        updateQuestion();
    }
}

function updateQuestionDisplayForReview() {
    setGradientBackground();
    document.getElementById("question-title").textContent = "Review Question " + (currentQuestionIndex + 1);
    document.getElementById("quiz-image").src = imageSet[currentQuestionIndex].path;
    
    const currentAnswer = userAnswers[currentQuestionIndex];
    if (currentAnswer !== null) {
        document.getElementById("real-btn").style.backgroundColor = currentAnswer === "Real" ? "darkgreen" : "";
        document.getElementById("fake-btn").style.backgroundColor = currentAnswer === "Fake" ? "red" : "";
    }
    
    document.getElementById("confidence-slider").value = userConfidence[currentQuestionIndex] || 3;
}

function submitQuiz() {
    const unanswered = userAnswers.filter(answer => answer === null).length;
    if (unanswered > 0) {
        if (!confirm(`You have ${unanswered} unanswered questions. Are you sure you want to submit?`)) {
            return;
        }
    }
    
    calculateFinalScore();
    endQuiz();
}

function calculateFinalScore() {
    score = 0;
    for (let i = 0; i < totalQuestions; i++) {
        if (userAnswers[i] === correctAnswers[i]) {
            score += 10;
        }
    }
    updateScore();
}

function endQuiz() {
    clearInterval(timerInterval);
    const quizEndTime = Date.now();
    const timeTaken = Math.floor((quizEndTime - quizStartTime) / 1000);
    
    const answersReport = {};
    imageSet.forEach((img, index) => {
        answersReport[index] = {
            imagePath: img.path,
            answer: userAnswers[index],
            confidence: userConfidence[index],
            correct: userAnswers[index] === correctAnswers[index]
        };
    });

    const quizData = {
        timestamp: new Date().toISOString(),
        age: localStorage.getItem("userAge") || "unknown",
        profession: localStorage.getItem("userProfession") || "unknown",
        score: score,
        answers: answersReport,
        timeTaken: timeTaken,
        sessionId: sessionId,
        playNumber: playNumber,
        imageSet: imageSet
    };

    sendDataToGoogleSheets(quizData);

    document.querySelector(".quiz-container").innerHTML = `
        <div class="result-container">
            <h2>Quiz Complete!</h2>
            <p>Score: <strong>${score}/100</strong></p>
            <p>Time Taken: <strong>${Math.floor(timeTaken/60)}m ${timeTaken%60}s</strong></p>
            <div class="stars">${getStarRating()}</div>
            <div class="end-container">
                <button class="end-btn" id="finish-btn" onclick="finishGame()">Finish</button>
                <button class="end-btn" id="playagain-btn" onclick="playAgain()">Play Again</button>
            </div>
        </div>
    `;
}

function getStarRating() {
    return score >= 80 ? "⭐️⭐️⭐️" : score >= 50 ? "⭐️⭐️☆" : "⭐️☆☆";
}

async function sendDataToGoogleSheets(quizData) {
    try {
        await fetch('https://script.google.com/macros/s/AKfycbyrL82R9ZRso-gR1UCiii5qk_wmP7sLnQzD3dfiFz8bhxd4JtALbi1vSb8kGfNzeixF/exec', {
            method: 'POST',
            mode: 'no-cors',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(quizData),
        });
        console.log('Data sent to Google Sheets.');
    } catch (error) {
        console.error('Error sending data:', error);
    }
}

function setGradientBackground() {
    const randomIndex = Math.floor(Math.random() * colors.length);
    const gradient = `linear-gradient(to bottom, ${colors[randomIndex][0]}, ${colors[randomIndex][1]})`;
    document.body.style.background = gradient;
}

function generateSessionId() {
    return 'session_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
}

function getPlayNumber() {
    let playNumber = localStorage.getItem('playNumber');
    if (!playNumber) {
        playNumber = 1;
    } else {
        playNumber = parseInt(playNumber) + 1;
    }
    localStorage.setItem('playNumber', playNumber);
    return playNumber;
}

// Navigation Functions
function finishGame() {
    window.location.href = "photo-learning.html";
}

function playAgain() {
    let attempt = parseInt(localStorage.getItem("attempt") || "1", 10);
    attempt++;
    localStorage.setItem("attempt", attempt);
    window.location.reload();
}