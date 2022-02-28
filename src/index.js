import Woody from "./woody.js";
import Firzen from "./firzen.js";
import Henry from "./henry.js";
import Justin from "./justin.js";
import Collision from "./collision.js";
import DamageSplat from "./damagesplat.js";

const MIN_STEP = 10;
const SPRITE_HEIGHT = 80;

let PLAYERS = 0;

// states of each character
const states = {
	RUNNING: "running",
	KNOCKEDBACK: "knockedback",
	ATTACKING: "attacking",
	WINNING: "winning",
	DEAD: "dead",
};

// load all assets first

let woodyImage = new Image();
woodyImage.src = "Assets/woody.png";

let woodyImageWinning = new Image();
woodyImageWinning.src = "Assets/woody2.png";

let woodyAssets = [woodyImage, woodyImageWinning];

let firzenImage = new Image();
firzenImage.src = "Assets/firzen.png";

let firzenImageWinning = new Image();
firzenImageWinning.src = "Assets/firzen1.png";

let firzenAssets = [firzenImage, firzenImageWinning];

let henryImage = new Image();
henryImage.src = "Assets/henry.png";

let henryImageAttacking = new Image();
henryImageAttacking.src = "Assets/henryAttacking.png";

let henryImageWinning = new Image();
henryImageWinning.src = "Assets/henry2.png";

let henryAssets = [henryImage, henryImageAttacking, henryImageWinning];

let justinImage = new Image();
justinImage.src = "Assets/justin0.png";

let justinImageAttacking = new Image();
justinImageAttacking.src = "Assets/justin1.png";

let justinAssets = [justinImage, justinImageAttacking];

let bg = new Image();
bg.src = "Assets/bg1.png";

let damageSplatRed = new Image();
let damageSplatBlue = new Image();

damageSplatRed.src = "Assets/dmgsplat_red.png";
damageSplatBlue.src = "Assets/dmgsplat_blue.png";

let damageSplatAssets = [damageSplatRed, damageSplatBlue];

let element = document.getElementById("deathlist");

// clamping frames so they are not too long or short
let typicalFrame = 16;
let smallestFrame = 14;
let longestFrame = 50;

// gameloop that controls the game
function gameLoop(timestamp) {
	let deltaTime = timestamp - lastTime;
	if (deltaTime > longestFrame) deltaTime = typicalFrame;

	lastTime = timestamp;

	ctx.clearRect(0, 0, canvas.width, canvas.height);

	// controls all calculations of each character
	updateGame(deltaTime, ctx);

	// updates list of dead characters based on characters that are in the deathListNames array
	element.innerHTML = "";
	for (let i = 0; i < deathListNames.length; i++) {
		element.innerHTML = element.innerHTML + (i + 1) + ". " + deathListNames[i] + "<br />";
	}

	// Finds if game has ended and sends data to server as a JSON
	if (deathListNames.length == PLAYERS - 1) {
		deathListNames.push(characterList[0].getName());

		const data = { deathListNames, beginning };

		const options = {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(data),
		};

		fetch("/api", options)
			.then((response) => response.json())
			.then((json) => {
				console.log(json);
			});

		PLAYERS = -999;
	}

	requestAnimationFrame(gameLoop);
}

// handles all calculations of characters by time
function updateGame(dt, ctx) {
	let step = dt;
	do {
		// first finds if there is at least one collision between characters
		let hit = findFirstCollision(step);

		// if there is at least one collision, find all collisions by turning them into collision objects, handle them, and move each character
		if (hit != null) {
			step = Math.max(hit.getTime(), MIN_STEP);
			updateObjects(step);
			handleCollisions(step);
			// else just move each character
		} else {
			updateObjects(step);
		}

		// drawing portion

		// draw bg
		ctx.drawImage(bg, 0, 0);

		// draw dead characters as lying prone on the ground
		for (let i = 0; i < deathListObjects.length; i++) {
			deathListObjects[i].draw(ctx, step);
		}

		//draw alive characters either as KBed or running or winning
		for (let i = 0; i < characterList.length; i++) {
			characterList[i].draw(ctx, step);
		}

		// draw damage splats
		for (let i = 0; i < damageSplats.length; i++) {
			damageSplats[i].draw(ctx);

			damageSplats[i].updateTime(step);
			if (damageSplats[i].getTime() > 2000) {
				damageSplats.splice(i, 1);
				i--;
			}
		}

		// finds if there is only 1 character left alive and makes him celebrate
		if (characterList.length == 1) {
			if (characterList[0].getStatus() != states.WINNING) {
				characterList[0].setSprite(states.WINNING);
			}
			characterList[0].setStatus(states.WINNING);
		}

		dt -= step;
		step = dt;
	} while (dt > 0);
}

// function that handles moving the characters around and recognising when they are dead
function updateObjects(step) {
	for (let i = 0; i < characterList.length; i++) {
		let character = characterList[i];
		let pos = character.getPosition();
		let v = character.getVelocity();

		// keeps characters within a boundary
		character.keepInside();

		// if character has a cooldown on their attack, reduce it by time passed
		character.cooldownAttackTimer(step);

		// if character is dead, push him into dead list and remove him from alive list
		if (character.isDead()) {
			deathListNames.push(character.getName());

			character.setStatus(states.DEAD);
			deathListObjects.push(character);

			characterList.splice(i, 1);
			i--;
			continue;
		}

		// handles if character is KBed by another - pushes them back in the opposite direction they were running in
		if (character.getStatus() == states.KNOCKEDBACK) {
			character.setVX(v.x * 0.95);
			character.setVY(v.y * 0.95);
			character.setPosition(pos.x + (step * v.x) / 1000, pos.y + (step * v.y) / 1000);
			character.addTimeKnockedback(step);

			// if they reach the time limit on being KBed, reset them back to running state
			if (character.getTimeKnockedback() > 1000) {
				character.setStatus(states.RUNNING);
				character.setSprite(states.RUNNING);
				character.setTimeKnockedback(0);
			}

			// otherwise if they are not KBed, set a goal destination to the nearest enemy where they will run to
		} else {
			character.setGoal(character.getClosestEnemy(characterList));
			character.updateVelocities();

			character.setPosition(pos.x + (step * v.x) / 1000, pos.y + (step * v.y) / 1000);
		}

		// if a character has completed an attack animation, reset them back to running state.
		if (character.getAttackTimer() < character.getTimeForAttackAnimation() && character.getStatus() == states.ATTACKING) {
			character.setSprite(states.RUNNING);
			character.setStatus(states.RUNNING);
		}

		// if character is running, update the direction they face (left if negative movement, right if positive movement)
		if (character.getStatus() == states.RUNNING) {
			character.updateDirection();
		}
	}
}

// handles each collision - is passed a collision and decides who gets hit and who is the one hitting
// returns dmg number and character that gets hit
function updateVelocities(collision, step) {
	let obj1 = collision.getObj1();
	let obj2 = collision.getObj2();

	let rand = Math.floor(Math.random() * 15);
	console.log(rand);

	// make sure that in the collision object, the two colliding objects are not null
	if (obj1 != null && obj2 != null) {
		//if they are not nulls, check their attack cooldown timers

		//if obj1 is ready to attack but obj2 isn't, obj2 will definitely getting hit
		if (obj1.getAttackTimer() == 0 && obj2.getAttackTimer() != 0) {
			if (obj1.getStatus() != states.KNOCKEDBACK && obj2.getStatus() != states.KNOCKEDBACK) {
				obj1.hit(obj2, step);
				updateStatus(obj1, obj2);
				updateHealth(obj1, obj2, rand);
				return [obj2, rand];
			}
			//vice versa
		} else if (obj1.getAttackTimer() != 0 && obj2.getAttackTimer() == 0) {
			if (obj1.getStatus() != states.KNOCKEDBACK && obj2.getStatus() != states.KNOCKEDBACK) {
				obj2.hit(obj1, step);
				updateStatus(obj2, obj1);
				updateHealth(obj2, obj1, rand);
				return [obj1, rand];
			}

			// if both characters have their attack ready, it will be a 50/50 on who gets hit
		} else if (obj1.getAttackTimer() == 0 && obj2.getAttackTimer() == 0) {
			let coinflip = Math.floor(Math.random() * 2);

			if (coinflip == 0) {
				if (obj1.getStatus() != states.KNOCKEDBACK && obj2.getStatus() != states.KNOCKEDBACK) {
					obj1.hit(obj2, step);
					updateStatus(obj1, obj2);
					updateHealth(obj1, obj2, rand);
					return [obj2, rand];
				}
			} else {
				if (obj1.getStatus() != states.KNOCKEDBACK && obj2.getStatus() != states.KNOCKEDBACK) {
					obj2.hit(obj1, step);
					updateStatus(obj2, obj1);
					updateHealth(obj2, obj1, rand);
					return [obj1, rand];
				}
			}
		}
	}
}

// function that handles all collisions
function handleCollisions(step) {
	// finds all collisions, set up unique collisions and charactersSeen as an collision between Char1 and Char2 is also a collision between Char2 and Char1
	// we don't want that to register as two seperate collisions
	let allCollisions = findAllCollisions(step);
	let uniqueCollisions = [];
	let charactersSeen = [];

	// look at each individual collision
	for (let i = 0; i < allCollisions.length; i++) {
		let obj1 = allCollisions[i].getObj1();
		let obj2 = allCollisions[i].getObj2();

		// if they are both not in the characterSeen array, push their unique ID and their collision in
		if (!charactersSeen.includes(obj1.getID()) && !charactersSeen.includes(obj2.getID())) {
			charactersSeen.push(obj1.getID());
			charactersSeen.push(obj2.getID());
			uniqueCollisions.push(allCollisions[i]);
		}
	}

	// using all unique collisions, handle each unique collision using the function above
	for (let collision of uniqueCollisions) {
		let info = updateVelocities(collision, step);
		if (info != undefined) {
			createDamageSplats(info[0].getPosition(), info[1]);
		}
	}
}

// finds all collisions by comparing each character to see if their hitboxes overlap and returns a array of all collisions
function findAllCollisions(dt) {
	let collisions = [];
	for (let i = 0; i < characterList.length; ++i) {
		for (let j = i + 1; j < characterList.length; ++j) {
			let hit = findCollision(i, j, dt);
			if (hit != null) {
				collisions.push(hit);
			}
		}
	}
	return collisions;
}

// function that finds 1 collision to see if we need to run findAllCollisions func
function findFirstCollision(dt) {
	for (let i = 0; i < characterList.length; i++) {
		for (let j = i + 1; j < characterList.length; j++) {
			let hit = findCollision(i, j, dt);
			if (hit != null) {
				return hit;
			}
		}
	}
}

// checks to see if there is a collision between characters at index i and j by checking overlaps of hitboxes
// if there is, create a Collision object and return it to findAllCollisions func
function findCollision(i, j, dt) {
	let obj1 = characterList[i];
	let obj2 = characterList[j];
	let obj1Pos = obj1.getPosition();
	let obj2Pos = obj2.getPosition();
	if (
		obj1Pos.x <= obj2Pos.x + obj2.getWidth() &&
		obj1Pos.x + obj1.getWidth() >= obj2Pos.x &&
		obj1Pos.y + obj1.getHeight() >= obj2Pos.y &&
		obj1Pos.y <= obj2Pos.y + obj2.getHeight()
	) {
		let dir = 0;
		let col = new Collision(obj1, obj2, dir, dt);
		return col;
	}
	return null;
}

// creates damage splat object and appends it to the damage splat list
function createDamageSplats(location, number) {
	let damageSplat = new DamageSplat(location, number, damageSplatAssets);
	damageSplats.push(damageSplat);
}

// updates statuses between two characters hitting each other - one hits, one gets KBed
function updateStatus(obj1, obj2) {
	// obj1 is the hitter, obj2 is the hittee(is that a word?)
	obj1.setStatus(states.ATTACKING);
	obj1.setSprite(states.ATTACKING);

	obj2.setStatus(states.KNOCKEDBACK);
	obj2.setSprite(states.KNOCKEDBACK);
}

// updates health after a collision
function updateHealth(obj1, obj2, dmg) {
	// obj1 is the hitter, obj2 is the hittee
	//let dmg = obj1.getDmg();
	obj2.minusHealth(dmg);
}

// function used when generating characters at the beginning to make sure when they spawn they
// do not overlap - keeps generating random coords until no overlaps are found
function checkXYOverlap(xpos, ypos, characterList) {
	for (const character of characterList) {
		if (character.getPosition().x == xpos && character.getPosition().y == ypos) {
			return true;
		}
	}
	return false;
}

// gets a random 80x80 tile
function getRandomTile(max_tiles) {
	// tile size of 80x80 - 9 up, 12 across
	return Math.floor(Math.random() * max_tiles);
}

// canvas is the screen where action happens
let canvas = document.getElementById("gameScreen");
canvas.height = 720;
canvas.width = 960;

let ctx = canvas.getContext("2d");
ctx.font = "16px Arial";

const GAME_WIDTH = 960;
const GAME_HEIGHT = 720;

ctx.clearRect(0, 0, canvas.width, canvas.height);

// arrays to store info
let names = [];
let characterList = [];

// store all char at beginning
let beginning = [];

// arrays to store names and actual objects of dead chars
let deathListNames = [];
let deathListObjects = [];

// array for damage splats
let damageSplats = [];

// adds an event listener to the start button to begin simulation
document.getElementById("start").addEventListener("click", () => {
	// gets all names entered in textbox, one name per each line, gets rid of lines with nothing in them
	names = $("#entries").val().split("\n");
	for (let i = names.length - 1; i > -1; i--) {
		if (names[i].trim() == "") {
			names.splice(i, 1);
		}
	}

	// max names of 24 so screen doesn't get too overcrowded
	if (names.length > 24) {
		names = [];
	}

	beginning.push(names);

	deathListNames = [];
	deathListObjects = [];
	characterList = [];
	damageSplats = [];

	PLAYERS = names.length;

	// generates character location

	for (let i = 0; i < names.length; i++) {
		let xp = getRandomTile(6) * SPRITE_HEIGHT * 2 + SPRITE_HEIGHT;
		let yp = getRandomTile(3) * SPRITE_HEIGHT * 2 + SPRITE_HEIGHT;

		while (checkXYOverlap(xp, yp, characterList)) {
			xp = getRandomTile(6) * SPRITE_HEIGHT * 2 + SPRITE_HEIGHT;
			yp = getRandomTile(4) * SPRITE_HEIGHT * 2 + SPRITE_HEIGHT;
		}

		let pos = { x: xp, y: yp };

		let rand = Math.floor(Math.random() * 4);

		// generates a random character out of 4
		// TODO: add more characters

		let character;
		if (rand == 0) {
			character = new Henry(GAME_WIDTH, GAME_HEIGHT, names[i], pos, i, henryAssets, ctx);
		} else if (rand == 1) {
			character = new Firzen(GAME_WIDTH, GAME_HEIGHT, names[i], pos, i, firzenAssets, ctx);
		} else if (rand == 2) {
			character = new Woody(GAME_WIDTH, GAME_HEIGHT, names[i], pos, i, woodyAssets, ctx);
		} else if (rand == 3) {
			character = new Justin(GAME_WIDTH, GAME_HEIGHT, names[i], pos, i, justinAssets, ctx);
		}

		characterList.push(character);
	}
});

// Controlling the navbar when page gets too narrow
const toggleButton = document.getElementsByClassName("toggle-button")[0];
const mobileMenu = document.getElementsByClassName("mobile-nav")[0];

toggleButton.addEventListener("click", () => {
	mobileMenu.classList.toggle("active");
});

window.addEventListener("resize", () => {
	if (window.matchMedia("(min-width: 600px)").matches) {
		mobileMenu.classList.remove("active");
	}
});

// Controlling game info and how to tabs

function openInfoTab(tabname, tabid) {
	let infoContainers = document.getElementsByClassName("info");
	for (let i = 0; i < infoContainers.length; i++) {
		infoContainers[i].style.display = "none";
	}

	let tabs = document.getElementsByClassName("tab");
	let info = document.getElementsByClassName("info");

	for (let i = 0; i < tabs.length; i++) {
		tabs[i].classList.remove("active");
	}
	document.getElementById(tabname).style.display = "block";
	document.getElementById(tabid).classList.toggle("active");
}

// controlling bouncing arrow functions

const arrowIcon = document.getElementsByClassName("arrow-icon")[0];

arrowIcon.addEventListener("click", () => {
	window.scrollTo({ top: window.innerHeight, behavior: "smooth" });
});

let lastTime = 0;

gameLoop(characterList);
