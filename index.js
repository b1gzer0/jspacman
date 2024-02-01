'use strict';

const chalk = require('chalk');
const readline = require('readline');

const FRAME_DELAY = 200; // ms
const FRAME_REDUCTION = 0.7; // frame delay is multiplied by FRAME_REDUCTION ** level (level starts at 0)
const POWERED_UP_FRAMES = 50;
const NUM_OF_LIVES = 3;
const GHOST_SPEED = 6; // 1/N chance not to move
const GHOST_SPEED_SLOW = 4;
const PACMAN_COLOR = [255, 255, 0]; // rgb(255,255,0)
const DOT_COLOR = [241, 116, 33]; // rgb(241, 116, 33)
const LARGE_DOT_COLOR = [255, 255, 255]; // rgb(255,255,255)
const CHERRY_COLOR = [];
const WALL_COLOR = [53, 48, 147]; // rgb(53, 48, 147)
const GHOST_ONE_COLOR = [238, 65, 34]; // rgb(238,65,34)
const GHOST_TWO_COLOR = [76, 186, 113]; // rgb(76, 186, 113)
const GHOST_THREE_COLOR = [0, 186, 189]; // rgb(0, 186, 189)
const GHOST_FOUR_COLOR = [241, 106, 167]; // rgb(241, 106, 167)
const GHOST_FEAR_COLOR = [15, 33, 154]; // rgb(15, 33, 154)

// Key press events
readline.emitKeypressEvents(process.stdin);

if (process.stdin.isTTY) process.stdin.setRawMode(true);

process.stdin.on('keypress', (chunk, key) => {
	if (!gameLive) {
		gameLive = true;
		game();
	}
	if (key.name === 'q') {
		gameLive = false;
		console.log('The end');
		process.exit();
	}
	if (key.name === 'r') {
		gameLive = false;
		init();
		frame = 0;
	}
	if (
		key.name === 'up' ||
		key.name === 'down' ||
		key.name === 'left' ||
		key.name === 'right'
	) {
		if (!wallAhead(player, key.name)) player.direction = key.name;
		else player.desiredDirection = key.name;
	}
});

// 1 - dot, 2 - large dot, 3 - wall, 4 - ghost
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
	[3, { symbol: chalk.rgb(...WALL_COLOR)('█') }],
	[0, { symbol: ' ', reward: 0 }],
	[1, { symbol: chalk.rgb(...DOT_COLOR)('·'), reward: 10 }],
	[2, { symbol: chalk.rgb(...LARGE_DOT_COLOR)('⦁'), reward: 100 }],
	['ghost', 'M'], //fix make like the other entities
	[
		'pacman',
		{
			left: chalk.rgb(...PACMAN_COLOR)('◑'),
			right: chalk.rgb(...PACMAN_COLOR)('◐'),
			up: chalk.rgb(...PACMAN_COLOR)('◒'),
			down: chalk.rgb(...PACMAN_COLOR)('◓'),
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

function drawInfoBar() {
	console.log(
		`${entity.get('pacman').left} `.repeat(lives >= 0 ? lives : 0) +
			'  '.repeat(3 - lives) +
			`${score}`.padStart(13, ' ')
	);
}

// Draw frame function
function drawFrame(map) {
	console.clear();

	drawInfoBar();

	map.forEach((row, index) => {
		let printedRow = row.map((el) => entity.get(el).symbol);

		// Draw ghosts
		ghosts.forEach((ghost) => {
			if (index === ghost.coords.y)
				if (player.poweredUp) {
					printedRow[ghost.coords.x] = chalk.bgRgb(...GHOST_FEAR_COLOR).white(
						entity.get('ghost') //fix
					);
				} else
					printedRow[ghost.coords.x] = chalk.rgb(...ghost.color)(
						entity.get('ghost') //fix
					);
		});
		// Draw player
		if (index === player.coords.y)
			printedRow[player.coords.x] = entity.get('pacman')[player.direction];
		console.log(printedRow.join(''));
	});
	// console.log(player.poweredUp);
	// console.log(player.poweredUpTimer);
	// console.log(player.poweredUpCombo);
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
		console.clear();

		drawInfoBar();

		map.forEach((row, index) => {
			let printedRow = row.map((el) => entity.get(el).symbol);

			// Draw ghosts
			ghosts.forEach((ghost) => {
				if (index === ghost.coords.y)
					if (player.poweredUp) {
						printedRow[ghost.coords.x] = chalk.bgRgb(...GHOST_FEAR_COLOR).white(
							entity.get('ghost') //fix
						);
					} else
						printedRow[ghost.coords.x] = chalk.rgb(...ghost.color)(
							entity.get('ghost') //fix
						);
			});

			// Draw player
			if (index === player.coords.y)
				printedRow[player.coords.x] =
					i % 2 === 1 ? chalk.rgb(255, 255, 0)('⦻') : ' ';

			console.log(printedRow.join(''));
		});

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
		console.log(`Highscore: ${highscore}`);
		console.log("'q' - quit, 'r' - restart");

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

// Initiate game state
let gameLive = false;
let level = 0;
let frame = 0;
let map;
let score;
let highscore = 0;
let lives;

function init() {
	map = JSON.parse(JSON.stringify(startMap.layout));
	lives = NUM_OF_LIVES;
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
	if (score)
		console.log(
			`Game Over. You scored: ${score}! ${
				highscore === score ? 'New Highscore!' : ''
			}`
		);
	score = 0;
	console.log('Press any key to start');
}

init();
