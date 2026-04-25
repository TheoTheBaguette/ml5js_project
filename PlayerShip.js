class PlayerShip extends Vehicle {
  constructor() {
    super(PLAY_W * 0.5, PLAY_H - 90);
    this.maxSpeed = 999;
    this.maxForce = 0.34;
    this.maxSpeedX = 6.8;
    this.maxSpeedY = 4.2;
    this.radius = 22;
    this.hasControl = false;
    this.targetX = PLAY_W * 0.5;
    this.boost = false;
    this.arriveRadius = 90;
    this.stopRadius = 10;
  }

  updateFromInput() {
    // Gentle gravity makes the ship come back down after a boost.
    this.applyForce(createVector(0, 0.045));

    if (!this.hasControl) {
      this.vel.x *= 0.8;
      this.vel.y *= 0.985;
      return;
    }

    const dx = this.targetX - this.pos.x;
    const adx = abs(dx);

    if (adx < this.stopRadius) {
      this.vel.x *= 0.72;
    } else {
      const speedX = adx < this.arriveRadius
        ? map(adx, this.stopRadius, this.arriveRadius, 0, this.maxSpeedX, true)
        : this.maxSpeedX;
      const desiredVx = Math.sign(dx) * speedX;
      const steerX = constrain(desiredVx - this.vel.x, -this.maxForce, this.maxForce);
      this.applyForce(createVector(steerX, 0));
    }

    if (this.boost) {
      boostFrames = 8;
    }

    if (boostFrames > 0) {
      this.applyForce(createVector(0, -0.13));
      boostFrames--;
    }

    this.vel.y *= 0.992;
  }

  update() {
    this.vel.add(this.acc);
    this.vel.x = constrain(this.vel.x, -this.maxSpeedX, this.maxSpeedX);
    this.vel.y = constrain(this.vel.y, -this.maxSpeedY, this.maxSpeedY);
    this.pos.add(this.vel);
    this.acc.mult(0);
  }

  keepInBounds() {
    this.pos.x = constrain(this.pos.x, 28, PLAY_W - 28);
    this.pos.y = constrain(this.pos.y, 30, PLAY_H - 30);
  }

  draw() {
    push();
    translate(this.pos.x, this.pos.y);
    const tilt = map(this.vel.x, -this.maxSpeed, this.maxSpeed, -0.35, 0.35, true);
    rotate(tilt);

    const alpha = invulFrames > 0 ? 120 : 230;
    stroke(120, 230, 255, alpha);
    strokeWeight(2);
    fill(58, 132, 255, alpha);
    beginShape();
    vertex(0, -this.radius * 1.16);
    vertex(-this.radius * 0.72, this.radius * 0.9);
    vertex(0, this.radius * 0.45);
    vertex(this.radius * 0.72, this.radius * 0.9);
    endShape(CLOSE);

    noStroke();
    fill(255, 240, 180, alpha);
    circle(0, -this.radius * 0.2, this.radius * 0.36);

    if (boostFrames > 0) {
      fill(255, 150, 60, 210);
      triangle(-5, this.radius * 0.9, 5, this.radius * 0.9, 0, this.radius * 1.7 + random(6, 10));
    }

    pop();
  }
}