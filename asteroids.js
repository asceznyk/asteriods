const rock = new Image();
rock.src = 'sprites/rock.png';

const canvas = document.getElementById('mycanvas');
const ctx = canvas.getContext('2d');

arrayRemove = (arr, v) => {
	return arr.filter(function(e) {
			return e != v;
	});
}

class Utils {
	static toRadians(degrees) {
		return degrees * (Math.PI / 180);
	} 

	static toDegrees(radians) {
		return radians * (180/ Math.PI);
	}

	static calcDx(angle, hypot) {
		return hypot * Math.cos(Utils.toRadians(angle));
	}

	static calcDy(angle, hypot) {
		return hypot * Math.sin(Utils.toRadians(angle));
	}

	static tipPosition(x, y, heading, size) {
		return {
			x : x + Utils.calcDx(heading, size/2),
			y : y + Utils.calcDy(heading, size/2)
		}	
	}

	static hasCollided(sq1, sq2) {
		return (
			((sq1.x + sq1.size/2) >= (sq2.x - sq2.size/2)) &&
			((sq1.x - sq1.size/2) <= (sq2.x + sq2.size/2)) &&
			((sq1.y + sq1.size/2) >= (sq2.y - sq2.size/2)) &&
			((sq1.y - sq1.size/2) <= (sq2.y + sq2.size/2)) 
		)
	}
}

class Missile {
	constructor(x, y, heading) {
		this.x = x;
		this.y = y;

		this.heading = heading;
		this.size = 2;
		this.tip = {};
		this.velocity = 105;
	}

	update() {
		this.tip = Utils.tipPosition(this.x, this.y, this.heading, this.size);
		this.x += ((this.tip.x - this.x) / (canvas.width/20)) * this.velocity;
		this.y += ((this.tip.y - this.y) / (canvas.height/20)) * this.velocity;
	}

	render() {
		ctx.fillStyle = '#ff0000';
		ctx.fillRect(this.x, this.y, this.size, this.size);
	}
}

class Ship {
	constructor(x, y) {
		this.x = x; 		
		this.y = y;	

		[this.maxv, this.minv] = [3, -3];
		
		this.velocity = 0;
		this.heading = 0;
		this.size = 20;
		this.tip = {};
		this.missiles = [];
	}

	turn(dir) {
		if(this.heading <= 0) {
			this.heading = 359;
		} else if(this.heading >= 360) {
			this.heading = 1;
		}

		this.heading += dir * 10;
	}

	accelerate() {
		if(this.velocity < this.maxv) {
			this.velocity += 2;
		}
	}

	brake() {
		if(this.velocity > this.minv) {
			this.velocity -= 2;
		}
	}	

	shoot() {
		let missile = new Missile(this.tip.x, this.tip.y, this.heading);
		this.missiles.push(missile);
	}

	update() {
		this.velocity = this.velocity == 0 ? 0.5 : this.velocity;
		this.tip = Utils.tipPosition(this.x, this.y, this.heading, this.size); 
		this.x += ((this.tip.x - this.x) / (canvas.width/20)) * this.velocity;
		this.y += ((this.tip.y - this.y) / (canvas.height/20)) * this.velocity;

		if(this.x <= 0 || this.x >= canvas.width) {
			this.x = canvas.width - this.x;
		} 
		
		if (this.y <= 0 || this.y >= canvas.height) {
			this.y = canvas.height - this.y;
		}
	}

	render() { 
		let [x, y] = [this.tip.x, this.tip.y];	
			
		ctx.beginPath();
		let opp = this.heading <= 180 ? this.heading + 180 : this.heading - 180;
		let sangle = Utils.toRadians(opp - 20);
		let eangle = Utils.toRadians(opp + 20);
		ctx.arc(x, y, this.size, sangle, eangle);
		ctx.lineTo(x, y);
		ctx.closePath();
		ctx.strokeStyle = '#fff';
		ctx.stroke();
	}
}

class Asteroid {
	constructor() {
		this.rscale = 30;
		this.margin = this.rscale * 4;
		this.size =	Math.floor(Math.random() * this.rscale) + 5;
		
		this.x = (Math.random() * canvas.width);
		this.y = (Math.random() * canvas.height);

		this.dx = Math.random() > 0.5 ? -1 : 1;
		this.dy = this.y > 0 ? -1 : 1;

		this.dx *= ((this.rscale/2) / this.size);
		this.dy *= ((this.rscale/2) / this.size);
	}

	update() {
		this.x += this.dx;
		this.y += this.dy;

		if(this.x < 0 || this.x > canvas.width) {
			this.x = canvas.width - this.x;
		}

		if(this.y < 0 || this.y > canvas.height) {
			this.y = canvas.height - this.y;
		}
	}

	render() {
		let [leftx, topy] = [this.x - this.size/2, this.y - this.size/2];
		ctx.beginPath();
		ctx.drawImage(rock, leftx, topy, this.size, this.size);
	}
}

initAsteroids = (total) => {
	let asteroids = [];
	for(let i= 0; i < total; i++) {
		asteroids.push(new Asteroid());
	}
	return asteroids;
}

deleteMissiles = () => {
	let missiles = [...ship.missiles];
	for(let i = 0; i < missiles.length; i++) {
		let x = missiles[i].x;
		let y = missiles[i].y;
		if(
			x > canvas.width || x < 0 &&
			y > canvas.height || y < 0
		) {
			ship.missiles = arrayRemove(ship.missiles, missiles[i]);
		}
	}
}

missileHitAsteriod = (missile, asteroid) => {
	let sizethresh = asteroid.rscale / 2;
	let split = [];	

	if(asteroid.size >= sizethresh) {
		for(let k = 0; k < 2; k++) {
			let a = new Asteroid();
			let negprob = Math.random() > 0.5 ? 1 : -1;
			a.size = asteroid.size / 2;
			[a.x, a.y] = [asteroid.x, asteroid.y];
			a.dx *= negprob
			a.dy *= negprob
			split.push(a); 
		}
	}
	return split;
}

updateGame = () => {
	ship.update()
	ship.render()

	for (let i = 0; i < ship.missiles.length; i++) {
		ship.missiles[i].update();
		ship.missiles[i].render();
	}

	deleteMissiles();

	for (let i = 0; i < asteroids.length; i++) {
		asteroids[i].update()
		asteroids[i].render()
	}

	for (let missile of ship.missiles)  {
		for (let i = 0; i < asteroids.length; i++) {
			let asteroid = asteroids[i];

			if(Utils.hasCollided(asteroid, missile)) {	
				crushed = asteroids.splice(i, 1)[0];
				ship.missiles = arrayRemove(ship.missiles, missile);
				split = missileHitAsteriod(missile, crushed);
				asteroids.push(...split);

				if(!asteroids.length) {
					stop = true;
				}
			}	
		}
	}

	for (let asteroid of asteroids) {
		if(Utils.hasCollided(asteroid, ship)) {
			stop = true; 
		}
	}
}

renderGame = () => {
	ctx.fillStyle = '#000';
	ctx.fillRect(0, 0, canvas.width, canvas.height)
	updateGame();
}

document.addEventListener('keydown', function(e) {
	if(e.keyCode == 39) {
		ship.turn(1);
	} else if(e.keyCode == 37) {
		ship.turn(-1);
	} else if(e.keyCode == 40) {
		ship.accelerate();
	} else if(e.keyCode == 38) {
		ship.brake();
	} else if(e.keyCode == 32) {
		ship.shoot();
	}
});

initGame = () => {
	let ship = new Ship(canvas.width/2, canvas.height/2);

	let asteroids = initAsteroids(10);

	let start = 0;
	let stop = false;

	return [ship, asteroids, start, stop];
}

let [ship, asteroids, start, stop] = initGame();

showGame = (time) => {
	if((time-start) >= 0) {
		start = time;
		renderGame();
	}

	if(stop) {
		[ship, asteroids, start, stop] = initGame();	
	}
	window.requestAnimationFrame(showGame);
} 
window.requestAnimationFrame(showGame);
