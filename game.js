const gameData = {
	players: [],
	playerQuestions: {},
	scores: {},
	subject: '',
	difficulty: 4,
	timer: null,
	timeLeft: 15,
	currentTurn: 0,
	selectedAnswer: null,
	allQuestions: null,
}

const resetGameData = () => {
	gameData.players = []
	gameData.playerQuestions = {}
	gameData.scores = {}
	gameData.subject = ''
	gameData.difficulty = 4
	gameData.timeLeft = 15
	gameData.currentTurn = 0
	gameData.selectedAnswer = null
	gameData.allQuestions = null
	if (gameData.timer) {
		clearInterval(gameData.timer)
		gameData.timer = null
	}
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

window.renderPlayersScreen = () => {
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

window.addNewPlayer = () => {
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

window.renderSubjectScreen = () => {
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

window.selectSubject = async subject => {
	gameData.subject = subject

	if (!gameData.allQuestions) {
		await fetchQuestions()
	}

	startGame()
}

const fetchQuestions = async () => {
	try {
		const response = await fetch('questions.json')
		if (!response.ok) {
			throw new Error('Failed to load questions.')
		}
		gameData.allQuestions = await response.json()
	} catch (error) {
		alert('Error loading questions: ' + error.message)
	}
}

const loadQuestions = (subject, difficulty) => {
	if (!gameData.allQuestions) {
		alert('Questions are not loaded yet!')
		return
	}

	const allQuestions = gameData.allQuestions

	if (subject === 'Mixed') {
		const allAvailableQuestions = Object.values(allQuestions)
			.flat()
			.sort(() => Math.random() - 0.5)

		const questionsPerPlayer = Math.min(
			difficulty,
			Math.floor(allAvailableQuestions.length / gameData.players.length)
		)

		gameData.players.forEach((player, index) => {
			gameData.playerQuestions[player.name] = allAvailableQuestions
				.filter((_, qIndex) => qIndex % gameData.players.length === index)
				.slice(0, questionsPerPlayer)
		})
	} else if (allQuestions[subject]) {
		const questionPool = [...allQuestions[subject]]

		const questionsPerPlayer = Math.min(
			difficulty,
			Math.floor(questionPool.length / gameData.players.length)
		)

		gameData.players.forEach((player, index) => {
			gameData.playerQuestions[player.name] = questionPool
				.filter((_, qIndex) => qIndex % gameData.players.length === index)
				.slice(0, questionsPerPlayer)
		})
	} else {
		alert('Invalid subject selected!')
	}
}

window.startGame = () => {
	loadQuestions(gameData.subject, gameData.difficulty)
	gameData.currentTurn = 0
	renderQuestion()
}

const renderQuestion = () => {
	const currentPlayer = gameData.players[gameData.currentTurn]
	const playerQuestions = gameData.playerQuestions[currentPlayer.name]
	const question = playerQuestions.find(q => q.selectedAnswer === undefined)

	if (!question) {
		gameData.currentTurn = (gameData.currentTurn + 1) % gameData.players.length
		if (
			gameData.players.every(player =>
				gameData.playerQuestions[player.name].every(
					q => q.selectedAnswer !== undefined
				)
			)
		) {
			endGame()
		} else {
			renderQuestion()
		}
		return
	}

	gameData.selectedAnswer = null
	gameData.timeLeft = 15

	document.getElementById('game-container').innerHTML = `
    <div>
      <h2 style="color:${currentPlayer.color}">It's ${
		currentPlayer.name
	}'s turn!</h2>
      <p>${question.Question}</p>
      ${question.Answers.map(
				(option, index) =>
					`<button style="border: 2px solid ${currentPlayer.color}" onclick="selectAnswer(${index})">${option}</button>`
			).join('')}
      <button id="submit-button" 
        onclick="submitAnswer('${currentPlayer.name}', '${encodeURIComponent(
		question.Question
	)}')"
        disabled>Submit</button>
      <p>Time left: <span id="timer">${gameData.timeLeft}</span> seconds</p>
    </div>
  `

	gameData.timer = setInterval(() => {
		const timerElement = document.getElementById('timer')
		if (timerElement) {
			timerElement.textContent = gameData.timeLeft
		}

		gameData.timeLeft--

		if (gameData.timeLeft < 0) {
			clearInterval(gameData.timer)
			submitAnswer(currentPlayer.name, encodeURIComponent(question.Question))
		}
	}, 1000)
}

window.selectAnswer = index => {
	gameData.selectedAnswer = index

	const buttons = document.querySelectorAll('button')
	buttons.forEach((button, idx) => {
		button.style.backgroundColor =
			idx === index ? gameData.players[gameData.currentTurn].color : ''
	})

	const submitButton = document.getElementById('submit-button')
	if (submitButton) {
		submitButton.disabled = false
	}
}

window.submitAnswer = (playerName, questionText) => {
	clearInterval(gameData.timer)

	const decodedQuestionText = decodeURIComponent(questionText)

	const player = gameData.players.find(p => p.name === playerName)
	const question = gameData.playerQuestions[player.name].find(
		q => q.Question === decodedQuestionText
	)

	if (question) {
		question.selectedAnswer = gameData.selectedAnswer

		if (question.selectedAnswer === question.CorrectAnswer) {
			gameData.scores[playerName] += 10
		}
	}

	renderQuestion()
}

window.endGame = () => {
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
      <button onclick="reviewAnswers()">Review Answers</button>
      <button onclick="startNewGame()">Start New Game</button>
    </div>
  `
}

window.reviewAnswers = () => {
	const playerButtonsHTML = gameData.players
		.map(
			(player, index) =>
				`<button style="margin: 10px; padding: 10px; font-size: 16px;" onclick="showPlayerReview(${index})">${player.name}</button>`
		)
		.join('')

	document.getElementById('game-container').innerHTML = `
    <div>
      <h1>Review Answers</h1>
      <div style="text-align: center;">
        ${playerButtonsHTML}
      </div>
      <button onclick="startNewGame()" style="margin-top: 20px; padding: 10px; font-size: 16px;">Start New Game</button>
    </div>
  `
}

window.showPlayerReview = playerIndex => {
	const player = gameData.players[playerIndex]
	const playerAnswers = gameData.playerQuestions[player.name]
	const playerReviewHTML = `
    <div style="padding: 10px; max-width: 800px; margin: 0 auto;">
      <h2 style="color:${
				player.color
			}; text-align: center; margin-bottom: 20px;">${player.name}'s Answers</h2>
      <ul style="list-style: none; padding: 0; margin: 0;">
        ${playerAnswers
					.map(
						(question, index) =>
							`<li style="margin-bottom: 5px; border-bottom: 1px solid #ddd; padding: 5px 0;">
                <p style="margin: 0; font-size: 14px;"><strong>Q${
									index + 1
								}:</strong> ${question.Question}</p>
                <p style="margin: 0; font-size: 13px;"><strong>Correct:</strong> ${
									question.Answers[question.CorrectAnswer]
								}</p>
                <p style="margin: 0; font-size: 13px;"><strong>Your:</strong> ${
									question.selectedAnswer !== undefined
										? question.Answers[question.selectedAnswer]
										: '<em>No Answer</em>'
								}</p>
              </li>`
					)
					.join('')}
      </ul>
      <button onclick="reviewAnswers()" style="margin-top: 20px; padding: 10px; font-size: 14px;">Back</button>
    </div>
  `

	document.getElementById('game-container').innerHTML = playerReviewHTML
}

window.startNewGame = () => {
	resetGameData()
	renderPlayersScreen()
}

window.onload = () => {
	renderPlayersScreen()
}
