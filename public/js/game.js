const socket = io();

const gameSpace = document.querySelector('.game');
const screenSpace = document.querySelector('.game2');

const waka = new Audio('../sounds/waka.mp3');

const FRAME_DELAY = 200; // ms
const FRAME_REDUCTION = 0.7; // frame delay is multiplied by FRAME_REDUCTION ** level (level starts at 0)
const POWERED_UP_FRAMES = 50;
const NUM_OF_LIVES = 3;
const GHOST_SPEED = 6; // 1/N chance not to move
const GHOST_SPEED_SLOW = 4;
const PACMAN_COLOR = 'color-pacman'; // rgb(255,255,0)
const DOT_COLOR = 'color-dot'; // rgb(241, 116, 33)
const LARGE_DOT_COLOR = 'color-large-dot'; // rgb(255,255,255)
const WALL_COLOR = 'color-wall'; // rgb(53, 48, 147)
const GHOST_ONE_COLOR = 'color-ghost-one'; // rgb(238,65,34)
const GHOST_TWO_COLOR = 'color-ghost-two'; // rgb(76, 186, 113)
const GHOST_THREE_COLOR = 'color-ghost-three'; // rgb(0, 186, 189)
const GHOST_FOUR_COLOR = 'color-ghost-four'; // rgb(241, 106, 167)
const GHOST_FEAR_COLOR = 'color-ghost-fear'; // rgb(15, 33, 154)

socket.on('frame', (map) => {
	screenSpace.innerHTML = '';

	map.forEach((row, index) => {
		let printedRow = row.map((el) =>
			span(entity.get(el).symbol, entity.get(el).color)
		);
		screenSpace.insertAdjacentHTML(
			'beforeend',
			`<p>${printedRow.join('')}</p>`
		);
	});
});
document.addEventListener('keydown', (e) => {
	const key = e.key.toLowerCase();
	console.log(socket.id);
	if (!gameLive) {
		gameLive = true;
		game();
	}
	if (key === 'q') {
	}
	if (key === 'r') {
		gameLive = false;
		init();
		frame = 0;
	}
	if (
		key === 'arrowup' ||
		key === 'arrowdown' ||
		key === 'arrowleft' ||
		key === 'arrowright'
	) {
		const shortKey = key.slice(5);
		socket.emit('keypress', shortKey);
		if (!wallAhead(player, shortKey)) player.direction = shortKey;
		else player.desiredDirection = shortKey;
	}
});

const startMap = {
	layout: [
		[3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3],
		[3, 1, 1, 1, 1, 1, 1, 1, 1, 3, 1, 1, 1, 1, 1, 1, 1, 1, 3],
		[3, 2, 3, 3, 1, 3, 3, 3, 1, 3, 1, 3, 3, 3, 1, 3, 3, 2, 3],
		[3, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 3],
		[3, 1, 3, 3, 1, 3, 1, 3, 3, 3, 3, 3, 1, 3, 1, 3, 3, 1, 3],
		[3, 1, 1, 1, 1, 3, 1, 1, 1, 3, 1, 1, 1, 3, 1, 1, 1, 1, 3],
		[3, 3, 3, 3, 1, 3, 3, 3, 1, 3, 1, 3, 3, 3, 1, 3, 3, 3, 3],
		[0, 0, 0, 3, 1, 3, 1, 1, 1, 1, 1, 1, 1, 3, 1, 3, 0, 0, 0],
		[3, 3, 3, 3, 1, 3, 1, 3, 0, 0, 0, 3, 1, 3, 1, 3, 3, 3, 3],
		[1, 1, 1, 1, 1, 1, 1, 3, 0, 0, 0, 3, 1, 1, 1, 1, 1, 1, 1],
		[3, 3, 3, 3, 1, 3, 1, 3, 3, 3, 3, 3, 1, 3, 1, 3, 3, 3, 3],
		[0, 0, 0, 3, 1, 3, 1, 1, 1, 1, 1, 1, 1, 3, 1, 3, 0, 0, 0],
		[3, 3, 3, 3, 1, 3, 3, 3, 1, 3, 1, 3, 3, 3, 1, 3, 3, 3, 3],
		[3, 1, 1, 1, 1, 3, 1, 1, 1, 3, 1, 1, 1, 3, 1, 1, 1, 1, 3],
		[3, 1, 3, 3, 1, 3, 1, 3, 3, 3, 3, 3, 1, 3, 1, 3, 3, 1, 3],
		[3, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 3],
		[3, 1, 3, 3, 1, 3, 3, 3, 1, 3, 1, 3, 3, 3, 1, 3, 3, 1, 3],
		[3, 1, 1, 1, 1, 1, 1, 1, 1, 3, 1, 1, 1, 1, 1, 1, 1, 1, 3],
		[3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3],
	],
	playerStartingPos: { x: 9, y: 15 },
	ghostOneStartingPos: { x: 8, y: 9 },
	ghostTwoStartingPos: { x: 9, y: 9 },
	ghostThreeStartingPos: { x: 10, y: 9 },
	ghostFourStartingPos: { x: 9, y: 8 },
};

const player = {
	direction: 'right',
	poweredUp: false,
	poweredUpTimer: 0,
	poweredUpCombo: 1,
	dead: false,
	startingPos: startMap.playerStartingPos,
	coords: {
		x: startMap.playerStartingPos.x,
		y: startMap.playerStartingPos.y,
	},
	// If player wants to turn when there is a wall in that direction, this variable remembers it
	desiredDirection: null,
};

const entity = new Map([
	[3, { symbol: '█', color: WALL_COLOR }],
	[0, { symbol: ' ', reward: 0 }],
	[1, { symbol: '·', reward: 10, color: DOT_COLOR }],
	[2, { symbol: 'O', reward: 100, color: LARGE_DOT_COLOR }],
	['ghost', 'M'], //fix make like the other entities
	[
		// 'pacman',
		// {
		// 	left: '◑',
		// 	right: '◐',
		// 	up: '◒',
		// 	down: '◓',
		// },
		'pacman',
		{
			left: 'C',
			right: 'C',
			up: 'C',
			down: 'C',
			dead: ['X', ' '],
		},
	],
	[5, { symbol: '🍒', reward: 200 }],
]);

const ghostOne = {
	color: GHOST_ONE_COLOR,
	startingPos: startMap.ghostOneStartingPos,
	coords: {
		x: startMap.ghostOneStartingPos.x,
		y: startMap.ghostOneStartingPos.y,
	},
	lockedUp: false,
	direction: 'right',
};
const ghostTwo = {
	color: GHOST_TWO_COLOR,
	startingPos: startMap.ghostTwoStartingPos,
	coords: {
		x: startMap.ghostTwoStartingPos.x,
		y: startMap.ghostTwoStartingPos.y,
	},
	lockedUp: false,
	direction: 'right',
};
const ghostThree = {
	color: GHOST_THREE_COLOR,
	startingPos: startMap.ghostThreeStartingPos,
	coords: {
		x: startMap.ghostThreeStartingPos.x,
		y: startMap.ghostThreeStartingPos.y,
	},
	lockedUp: false,
	direction: 'right',
};
const ghostFour = {
	color: GHOST_FOUR_COLOR,
	startingPos: startMap.ghostFourStartingPos,
	coords: {
		x: startMap.ghostFourStartingPos.x,
		y: startMap.ghostFourStartingPos.y,
	},
	lockedUp: false,
	direction: 'right',
};

const ghosts = [ghostOne, ghostTwo, ghostThree, ghostFour];

let gameLive = false;
let level = 0;
let frame = 0;
let map = JSON.parse(JSON.stringify(startMap.layout));
let score = 0;
let highscore = 0;
let lives = 3;

function span(string, className = '') {
	return `<span class="${className}">${string}</span>`;
}

function clearScreen() {
	gameSpace.innerHTML = '';
}
function drawRow(html) {
	gameSpace.insertAdjacentHTML('beforeend', `<p>${html}</p>`);
}

function drawInfoBar() {
	let html =
		span(`${entity.get('pacman').left} `, 'color-pacman').repeat(
			lives >= 0 ? lives : 0
		) + span('  '.repeat(3 - lives) + `${score}`.padStart(13, ' '));
	drawRow(html);
}

// Draw frame function
function drawFrame(map) {
	clearScreen();

	drawInfoBar();

	map.forEach((row, index) => {
		let printedRow = row.map((el) =>
			span(entity.get(el).symbol, entity.get(el).color)
		);

		// Draw ghosts
		ghosts.forEach((ghost) => {
			if (index === ghost.coords.y)
				printedRow[ghost.coords.x] = span(
					entity.get('ghost'),
					player.poweredUp ? 'color-ghost-fear' : ghost.color
				);
		});
		// Draw player
		if (index === player.coords.y)
			if (!player.dead)
				printedRow[player.coords.x] = span(
					entity.get('pacman')[player.direction],
					'color-pacman'
				);
			else
				printedRow[player.coords.x] = span(
					entity.get('pacman').dead[frame % 2],
					'color-pacman'
				);

		drawRow(printedRow.join(''));
	});
}

// Collision check
function wallAhead(target, direction) {
	switch (direction) {
		case 'up': {
			return map[target.coords.y - 1][target.coords.x] === 3;
		}
		case 'down': {
			return map[target.coords.y + 1][target.coords.x] === 3;
		}
		case 'left': {
			return map[target.coords.y][target.coords.x - 1] === 3;
		}
		case 'right': {
			return map[target.coords.y][target.coords.x + 1] === 3;
		}
	}
}

function rollDn(sides) {
	const result = Math.floor(Math.random() * sides) + 1;
	return result;
}

function moveGhost(ghost) {
	if (wallAhead(ghost, ghost.direction)) {
		let availableDirections = [];
		if (!wallAhead(ghost, 'up')) availableDirections.push('up');
		if (!wallAhead(ghost, 'down')) availableDirections.push('down');
		if (!wallAhead(ghost, 'left')) availableDirections.push('left');
		if (!wallAhead(ghost, 'right')) availableDirections.push('right');
		ghost.direction =
			availableDirections[rollDn(availableDirections.length) - 1];
	}
	// Make them slower
	if (rollDn(player.poweredUp ? GHOST_SPEED_SLOW : GHOST_SPEED) === 1) return;

	if (ghost.lockedUp) return;

	switch (ghost.direction) {
		case 'up': {
			ghost.coords.y -= 1;
			if (ghost.coords.y < 0) ghost.coords.y = map.length - 1;
			break;
		}
		case 'down': {
			ghost.coords.y += 1;
			if (ghost.coords.y > map.length - 1) ghost.coords.y = 0;
			break;
		}
		case 'left': {
			ghost.coords.x -= 1;
			if (ghost.coords.x < 0) ghost.coords.x = map[1].length - 1;
			break;
		}
		case 'right': {
			ghost.coords.x += 1;
			if (ghost.coords.x > map[1].length - 1) ghost.coords.x = 0;
			break;
		}
		default:
			break;
	}
}

function movePlayer() {
	if (wallAhead(player, player.direction)) return;

	//waka.play();

	switch (player.direction) {
		case 'up': {
			player.coords.y -= 1;
			if (player.coords.y < 0) player.coords.y = map.length - 1;
			break;
		}
		case 'down': {
			player.coords.y += 1;
			if (player.coords.y > map.length - 1) player.coords.y = 0;
			break;
		}

		case 'left': {
			player.coords.x -= 1;
			if (player.coords.x < 0) player.coords.x = map[1].length - 1;
			break;
		}
		case 'right': {
			player.coords.x += 1;
			if (player.coords.x > map[1].length - 1) player.coords.x = 0;
			break;
		}
		default:
			break;
	}
}

function pickup() {
	const item = map[player.coords.y][player.coords.x];
	map[player.coords.y][player.coords.x] = 0;
	return item;
}

function addScore(item) {
	score += entity.get(item).reward;
}

function resetPosition(unit) {
	unit.coords.x = unit.startingPos.x;
	unit.coords.y = unit.startingPos.y;
	unit.direction = 'right';
}

// Utility function
const delay = (ms) => new Promise((res) => setTimeout(res, ms));

async function playerDies() {
	lives -= 1;

	//fix repetitive
	player.poweredUp = false;
	player.poweredUpCombo = 1;
	player.poweredUpTimer = 0;

	for (let i = 0; i < 6; i++) {
		drawFrame(map);
		frame++;
		await delay(FRAME_DELAY * FRAME_REDUCTION ** level);
	}

	if (lives < 0) {
		gameOver();
		return;
	}

	resetPosition(player);
	ghosts.forEach((ghost) => resetPosition(ghost));
	player.dead = false;
}

function gameOver() {
	gameLive = false;
	if (score > highscore) highscore = score;

	init();

	frame = 0;
}

function levelUp() {
	level++;
	map = JSON.parse(JSON.stringify(startMap.layout));
	player.dead = false;
	player.poweredUp = false;
	player.poweredUpCombo = 1;
	player.poweredUpTimer = 0;
	resetPosition(player);
	player.desiredDirection = null;
	ghosts.forEach((ghost) => {
		resetPosition(ghost);
	});
	drawFrame(map);
}

async function game() {
	let item;

	while (gameLive) {
		frame++;
		if (player.dead) {
			await playerDies();
			if (!gameLive) break;
		}
		if (player.poweredUp) player.poweredUpTimer--;

		if (player.poweredUpTimer === 0) {
			player.poweredUp = false;
			player.poweredUpCombo = 1;
			ghosts.forEach((ghost) => (ghost.lockedUp = false));
		}
		item = pickup();
		if (item === 2) {
			player.poweredUp = true;
			player.poweredUpTimer = POWERED_UP_FRAMES;
		}
		addScore(item);

		// Check for level end (if no dots)
		if (
			map.map((row) => row.every((el) => el !== 1)).every((row) => row === true)
		) {
			levelUp();
		}

		drawFrame(map);
		socket.emit('frame', map);

		drawRow(`Highscore: ${highscore}`);
		drawRow(`'q' - quit, 'r' - restart`);

		await delay(FRAME_DELAY * FRAME_REDUCTION ** level);

		if (
			player.desiredDirection &&
			!wallAhead(player, player.desiredDirection)
		) {
			player.direction = player.desiredDirection;
			player.desiredDirection = null;
		}
		if (!gameLive) break;
		movePlayer();

		for (let i = 0; i < ghosts.length; i++) {
			// fix repetitive code
			if (
				player.coords.x === ghosts[i].coords.x &&
				player.coords.y === ghosts[i].coords.y
			) {
				if (player.poweredUp && !ghosts[i].lockedUp) {
					score += 200 * player.poweredUpCombo;
					resetPosition(ghosts[i]);
					ghosts[i].lockedUp = true;
					player.poweredUpCombo++;
				} else if (!ghosts[i].lockedUp) {
					player.dead = true;
					break;
				}
			}

			moveGhost(ghosts[i]);

			if (
				player.coords.x === ghosts[i].coords.x &&
				player.coords.y === ghosts[i].coords.y
			) {
				if (player.poweredUp && !ghosts[i].lockedUp) {
					score += 200 * player.poweredUpCombo;
					resetPosition(ghosts[i]);
					ghosts[i].lockedUp = true;
					player.poweredUpCombo++;
				} else if (!ghosts[i].lockedUp) {
					player.dead = true;
				}
			}
		}
	}
}

function init() {
	map = JSON.parse(JSON.stringify(startMap.layout));
	lives = NUM_OF_LIVES;
	level = 0;
	player.dead = false;
	player.poweredUp = false;
	player.poweredUpCombo = 1;
	player.poweredUpTimer = 0;
	resetPosition(player);
	player.desiredDirection = null;
	ghosts.forEach((ghost) => {
		resetPosition(ghost);
	});
	const oldScore = score;
	score = 0;
	drawFrame(map);

	if (oldScore)
		drawRow(
			`Game Over. You scored: ${oldScore}! ${
				highscore === oldScore ? 'New Highscore!' : ''
			}`
		);

	drawRow('Press any key to start');
}

init();
