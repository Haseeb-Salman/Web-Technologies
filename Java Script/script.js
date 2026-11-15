const questions = [
  {
    question: 'What is the correct way to declare a variable in JavaScript?',
    options: ['var name = "name";', 'variable name = "name";', 'let name = "name";', 'const name = "name";'],
    correctAnswer: 'let name = "name";'
  },
  {
    question: 'Which data type is used for true/false values?',
    options: ['String', 'Boolean', 'Number', 'Array'],
    correctAnswer: 'Boolean'
  },
  {
    question: 'Which loop is best when you know how many times to repeat something?',
    options: ['for loop', 'while loop', 'do while loop', 'if statement'],
    correctAnswer: 'for loop'
  },
  {
    question: 'Which keyword is used to create a function?',
    options: ['function', 'func', 'method', 'define'],
    correctAnswer: 'function'
  },
  {
    question: 'Which statement checks a condition?',
    options: ['for', 'switch', 'if', 'return'],
    correctAnswer: 'if'
  }
];

let currentQuestionIndex = 0;
let score = 0;
let selectedAnswer = null;

const questionNumber = document.getElementById('question-number');
const questionText = document.getElementById('question-text');
const optionsContainer = document.getElementById('options');
const nextBtn = document.getElementById('next-btn');
const resultBox = document.getElementById('result-box');
const quizBox = document.getElementById('quiz-box');
const scoreText = document.getElementById('score-text');
const restartBtn = document.getElementById('restart-btn');

function showQuestion() {
  selectedAnswer = null;
  const currentQuestion = questions[currentQuestionIndex];

  questionNumber.textContent = `Question ${currentQuestionIndex + 1}`;
  questionText.textContent = currentQuestion.question;
  optionsContainer.innerHTML = '';

  currentQuestion.options.forEach((option) => {
    const button = document.createElement('button');
    button.classList.add('option-btn');
    button.textContent = option;
    button.addEventListener('click', () => selectAnswer(button, option));
    optionsContainer.appendChild(button);
  });

  nextBtn.textContent = currentQuestionIndex === questions.length - 1 ? 'Finish Quiz' : 'Next Question';
}

function selectAnswer(button, option) {
  if (selectedAnswer !== null) {
    return;
  }

  selectedAnswer = option;
  const correctAnswer = questions[currentQuestionIndex].correctAnswer;
  const buttons = document.querySelectorAll('.option-btn');

  buttons.forEach((btn) => {
    btn.disabled = true;

    if (btn.textContent === correctAnswer) {
      btn.classList.add('correct');
    }

    if (btn.textContent === option && option !== correctAnswer) {
      btn.classList.add('wrong');
    }
  });

  if (option === correctAnswer) {
    score += 1;
  }
}

function nextQuestion() {
  if (selectedAnswer === null) {
    alert('Please select an answer first!');
    return;
  }

  currentQuestionIndex += 1;

  if (currentQuestionIndex < questions.length) {
    showQuestion();
  } else {
    showResult();
  }
}

function showResult() {
  quizBox.classList.add('hidden');
  resultBox.classList.remove('hidden');
  scoreText.textContent = `Your score is ${score} out of ${questions.length}`;
}

function restartQuiz() {
  currentQuestionIndex = 0;
  score = 0;
  selectedAnswer = null;
  resultBox.classList.add('hidden');
  quizBox.classList.remove('hidden');
  showQuestion();
}

nextBtn.addEventListener('click', nextQuestion);
restartBtn.addEventListener('click', restartQuiz);

showQuestion();
