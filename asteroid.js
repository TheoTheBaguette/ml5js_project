class Asteroid extends Vehicle {
  constructor() {
    super(random(30, PLAY_W - 30), -40);
    this.radius = random(16, 36);
    this.r = this.radius;
    this.maxSpeed = random(2.2, 4.1);
    this.maxForce = 0.08;
    this.seed = random(1000);
    this.wanderTheta = random(TWO_PI);
    this.wanderRadius = random(18, 30);
    this.distanceCercle = random(24, 42);
    this.displaceRange = 0.2;
    this.perceptionRadius = this.radius + 38;
    this.vel = createVector(random(-0.7, 0.7), random(1.4, 3.1));
  }

  update() {
    // Steering behaviors from Vehicle base class.
    const wanderForce = this.wander().mult(0.35);
    const separationForce = this.separation(asteroids).mult(1.15);
    const xBoundariesForce = this.boundaries(0, -99999, PLAY_W, 199998, 28).mult(1.1);

    this.applyForce(wanderForce);
    this.applyForce(separationForce);
    this.applyForce(xBoundariesForce);

    // Keep a downward drift so asteroids remain threatening.
    this.applyForce(createVector(0, 0.06));

    super.update();
    this.vel.y = constrain(this.vel.y, 1.2, this.maxSpeed + 0.6);
  }

  draw() {
    push();
    translate(this.pos.x, this.pos.y);
    noStroke();
    fill(95, 109, 138, 225);
    beginShape();
    const n = 8;
    for (let i = 0; i < n; i++) {
      const a = map(i, 0, n, 0, TWO_PI);
      const rr = this.radius * map(noise(this.seed + i), 0, 1, 0.78, 1.2);
      vertex(cos(a) * rr, sin(a) * rr);
    }
    endShape(CLOSE);
    pop();
  }

  outOfBounds() {
    return this.pos.y - this.radius > PLAY_H + 28;
  }
}
