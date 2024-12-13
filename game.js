const gameData = {
	players: [],
	playerQuestions: {}, // Maps each player to their unique set of questions
	scores: {},
	subject: '',
	difficulty: 4,
	timer: null,
	timeLeft: 15,
	currentTurn: 0, // Tracks the current player's turn
	selectedAnswer: null, // Tracks the current selected answer
}

const getRandomColor = () => {
	const letters = '0123456789ABCDEF'
	let color = '#'
	for (let i = 0; i < 6; i++) {
		color += letters[Math.floor(Math.random() * 16)]
	}
	return color
}

const addPlayer = name => {
	if (gameData.players.length < 4) {
		gameData.players.push({ name, color: getRandomColor() })
		gameData.scores[name] = 0
		gameData.playerQuestions[name] = []
		return true
	}
	return false
}

const renderPlayersScreen = () => {
	document.getElementById('game-container').innerHTML = `
    <div>
      <h1>Welcome to Quiz Rush</h1>
      <p>Add up to 4 players:</p>
      <div id="players-list">
        ${gameData.players
					.map((player, index) => `<p>${index + 1}. ${player.name}</p>`)
					.join('')}
      </div>
      <input id="player-name" type="text" placeholder="Player Name">
      <button onclick="addNewPlayer()">Add Player</button>
      <button onclick="renderSubjectScreen()">Next</button>
      <p id="error-message" style="color: red;"></p>
    </div>
  `

	const playerNameInput = document.getElementById('player-name')
	playerNameInput.addEventListener('keypress', event => {
		if (event.key === 'Enter') {
			addNewPlayer()
		}
	})
}

const addNewPlayer = () => {
	const playerNameInput = document.getElementById('player-name')
	const playerName = playerNameInput.value.trim()
	const errorMessageElement = document.getElementById('error-message')

	if (playerName) {
		const added = addPlayer(playerName)
		if (added) {
			renderPlayersScreen()
		} else {
			errorMessageElement.textContent = "You can't add more than 4 players."
		}
	}
}

const renderSubjectScreen = () => {
	if (gameData.players.length === 0) {
		alert('Please add at least one player before proceeding!')
		return
	}

	document.getElementById('game-container').innerHTML = `
    <div>
      <h1>Select Subject</h1>
      <button onclick="selectSubject('HTML')">HTML</button>
      <button onclick="selectSubject('CSS')">CSS</button>
      <button onclick="selectSubject('JS')">JavaScript</button>
      <button onclick="selectSubject('Mixed')">Mixed</button>
    </div>
  `
}

const selectSubject = subject => {
	gameData.subject = subject
	startGame()
}

const loadQuestions = (subject, difficulty) => {
	const allQuestions = {
		HTML: [
			{
				question: 'What does HTML stand for?',
				options: [
					'HyperText Markup Language',
					'HyperText Markdown Language',
					'HighText Machine Language',
					'Hyperlink Text Markup Language',
				],
				correct: 0,
			},
			{
				question: 'Which tag is used for the largest heading?',
				options: ['<h6>', '<heading>', '<h1>', '<header>'],
				correct: 2,
			},
			{
				question: 'What attribute specifies an alternate text for an image?',
				options: ['alt', 'src', 'title', 'href'],
				correct: 0,
			},
			{
				question: 'What does the <a> tag define?',
				options: ['Anchor', 'Audio', 'Article', 'Aside'],
				correct: 0,
			},
		],
		CSS: [
			{
				question: 'What does CSS stand for?',
				options: [
					'Cascading Style Sheets',
					'Computer Style Sheets',
					'Creative Style Sheets',
					'Colorful Style Sheets',
				],
				correct: 0,
			},
			{
				question: 'Which property changes the text color?',
				options: ['color', 'text-color', 'font-color', 'background-color'],
				correct: 0,
			},
			{
				question: 'Which value makes an element hidden?',
				options: [
					'display: none',
					'visibility: hidden',
					'opacity: 0',
					'All of the above',
				],
				correct: 3,
			},
			{
				question: 'What is the default position value in CSS?',
				options: ['static', 'relative', 'absolute', 'fixed'],
				correct: 0,
			},
		],
		JS: [
			{
				question: 'What does JS stand for?',
				options: ['JavaScript', 'JavaScope', 'JustScript', 'JScript'],
				correct: 0,
			},
			{
				question: 'Which company developed JavaScript?',
				options: ['Microsoft', 'Netscape', 'Sun Microsystems', 'Oracle'],
				correct: 1,
			},
			{
				question: 'Which symbol is used for comments in JavaScript?',
				options: ['//', '<!-- -->', '#', '**'],
				correct: 0,
			},
			{
				question:
					'What is the default value of an uninitialized variable in JavaScript?',
				options: ['undefined', 'null', '0', 'NaN'],
				correct: 0,
			},
		],
	}

	const questionPool =
		subject === 'Mixed'
			? [...allQuestions.HTML, ...allQuestions.CSS, ...allQuestions.JS].sort(
					() => Math.random() - 0.5
			  )
			: [...allQuestions[subject]]

	const questionsPerPlayer = Math.min(
		difficulty,
		Math.floor(questionPool.length / gameData.players.length)
	)

	gameData.players.forEach((player, index) => {
		gameData.playerQuestions[player.name] = questionPool
			.filter((_, qIndex) => qIndex % gameData.players.length === index)
			.slice(0, questionsPerPlayer)
	})
}

const startGame = () => {
	loadQuestions(gameData.subject, gameData.difficulty)
	gameData.currentTurn = 0
	renderQuestion()
}

const renderQuestion = () => {
	const currentPlayer = gameData.players[gameData.currentTurn]
	const playerQuestions = gameData.playerQuestions[currentPlayer.name]
	const question = playerQuestions.shift()

	if (!question) {
		endGame()
		return
	}

	gameData.selectedAnswer = null
	gameData.timeLeft = 15

	document.getElementById('game-container').innerHTML = `
    <div>
      <h2 style="color:${currentPlayer.color}">It's ${
		currentPlayer.name
	}'s turn!</h2>
      <p>${question.question}</p>
      ${question.options
				.map(
					(option, index) =>
						`<button style="border: 2px solid ${currentPlayer.color}" onclick="selectAnswer(${index})">${option}</button>`
				)
				.join('')}
      <button id="submit-button" onclick="submitAnswer(${
				question.correct
			})" disabled>Submit</button>
      <p>Time left: <span id="timer">${gameData.timeLeft}</span> seconds</p>
    </div>
  `

	gameData.timer = setInterval(() => {
		gameData.timeLeft--
		document.getElementById('timer').textContent = gameData.timeLeft

		if (gameData.timeLeft <= 0) {
			clearInterval(gameData.timer)
			submitAnswer(question.correct)
		}
	}, 1000)
}

const selectAnswer = index => {
	gameData.selectedAnswer = index

	const buttons = document.querySelectorAll('button')
	buttons.forEach((button, idx) => {
		button.style.backgroundColor =
			idx === index ? gameData.players[gameData.currentTurn].color : ''
	})

	document.getElementById('submit-button').disabled = false
}

const submitAnswer = correctAnswer => {
	clearInterval(gameData.timer)

	const currentPlayer = gameData.players[gameData.currentTurn]

	if (gameData.selectedAnswer === correctAnswer) {
		gameData.scores[currentPlayer.name] += 10
	}

	gameData.currentTurn = (gameData.currentTurn + 1) % gameData.players.length
	renderQuestion()
}

const endGame = () => {
	const results = Object.entries(gameData.scores).sort((a, b) => b[1] - a[1])
	const maxScore = results[0][1]
	const winners = results
		.filter(([_, score]) => score === maxScore)
		.map(([name]) => name)

	document.getElementById('game-container').innerHTML = `
    <div>
      <h1>Game Over!</h1>
      <h2>Winner(s): ${winners.join(', ')}</h2>
      <ul>
        ${results
					.map(([name, score]) => `<li>${name}: ${score} points</li>`)
					.join('')}
      </ul>
      <button onclick="startNewGame()">Start New Game</button>
    </div>
  `
}

const startNewGame = () => {
	gameData.players = []
	gameData.playerQuestions = {}
	gameData.scores = {}
	clearInterval(gameData.timer)
	renderPlayersScreen()
}

window.onload = () => {
	renderPlayersScreen()
}
