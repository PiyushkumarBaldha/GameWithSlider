document.addEventListener('DOMContentLoaded', function() {
  // Display quiz results
  const quizData = JSON.parse(localStorage.getItem('quizPerformance') || '{}');
  
  if (quizData.score !== undefined) {
    const resultsDiv = document.getElementById('quiz-results');
    resultsDiv.innerHTML = `
      <h3>Your Quiz Results</h3>
      <p>Score: ${quizData.score}/100</p>
      <div class="stars">${getStarRating(quizData.score)}</div>
      <p>Time Taken: ${Math.floor(quizData.timeTaken/60)}m ${quizData.timeTaken%60}s</p>
    `;
  }
  
  // Set a random learning image
  const randomImage = Math.floor(Math.random() * 5) + 1;
  document.getElementById('featured-image').src = `Img/learning${randomImage}.jpg`;

  // Add event listeners to option cards
  document.querySelectorAll('.option-card').forEach(card => {
    card.addEventListener('click', function() {
      const topic = this.getAttribute('data-topic');
      showInfo(topic);
      
      // Mark card as completed
      this.classList.add('completed');
    });
  });

  // Add event listener to back button
  document.getElementById('back-btn').addEventListener('click', goBack);
});

function getStarRating(score) {
  return score >= 80 ? "⭐️⭐️⭐️" : score >= 50 ? "⭐️⭐️☆" : "⭐️☆☆";
}

function showInfo(topic) {
  // Hide all info sections first
  document.querySelectorAll('.info-section').forEach(section => {
    section.style.display = 'none';
  });
  
  // Show the selected info section
  const infoSection = document.getElementById(`${topic}-info`);
  if (infoSection) {
    infoSection.style.display = 'block';
    infoSection.scrollIntoView({ behavior: 'smooth' });
  }
}

function goBack() {
  window.location.href = 'afterQuiz.html';
}

// Add CSS styles for completed cards
document.head.insertAdjacentHTML("beforeend", `
  <style>
    .completed {
      background-color: #FFDAB9 !important; /* Light Orange */
      border-color: #FF8C00 !important;
      color: #8B4513 !important;
      transition: background-color 0.5s ease-in-out;
    }
    .completed h3, .completed p {
      color: #8B4513 !important;
    }
  </style>
`);
