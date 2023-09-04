// Author: Asher Wrobel, 2023
// Version: 1.0
// This is open source code, feel free to use it for your own projects

const width = 400;
const height = 400;

let Objs = [];

function setup() {
  // Create the canvas
  createCanvas(width, height);
  background(220);
}

// defaultStroke() sets the stroke to the default (black)
function defaultStroke() {
  stroke(0);
}

// drawPixel() draws a pixel at (x, y) with color (r, g, b)
function drawPixel(x, y, r, g, b) {
  stroke(r, g, b);
  point(x, y);
  defaultStroke();
}

// drawPixels() draws an array of pixels
function drawPixels(pixels) {
  for(let i = 0; i < pixels.length; i++) {
    let row = pixels[i];
    for(let j = 0; j < row.length; j++) {
      let pixel = row[j];
      drawPixel(i, j, pixel.r, pixel.g, pixel.b);
    }
  }
}

class Ray {
  constructor(origin, direction) {
    this.origin = origin;
    this.direction = direction;
  }
}

class Obj {
  constructor(origin, color, type) {
    this.origin = origin;
    this.color = color;
    this.type = type;
  }
}

class Triangle extends Obj {
  constructor(origin, points, color) {
    super(origin, color, "triangle");
    this.points = points;
  }
}

function normalize(vector) {
  let magnitude = Math.sqrt(vector[0] * vector[0] + vector[1] * vector[1] + vector[2] * vector[2]);
  return [vector[0] / magnitude, vector[1] / magnitude, vector[2] / magnitude];
}

function createRay(xdim, ydim, x, y) {
  // xdim and ydim are the dimensions of the screen
  // x and y are the coordinates of the pixel
  let origin = [0, 0, 0];
  let direction = normalize([x, y, 0]);
  return new Ray(origin, direction);
}

function crossProduct(vector1, vector2) {
  let result = [];
  result[0] = vector1[1] * vector2[2] - vector1[2] * vector2[1];
  result[1] = vector1[2] * vector2[0] - vector1[0] * vector2[2];
  result[2] = vector1[0] * vector2[1] - vector1[1] * vector2[0];
  return result;
}

dot = (a, b) => a.map((x, i) => a[i] * b[i]).reduce((m, n) => m + n);

function subtract(vector1, vector2) {
  return [vector1[0] - vector2[0], vector1[1] - vector2[1], vector1[2] - vector2[2]];
}

// collide() returns true if the ray collides with the Obj
function collide(ray, obj) {
  if(obj.type == "triangle") {
    const EPSILON = 0.000001;
    let e1 = subtract(obj.points[1], obj.points[0]);
    let e2 = subtract(obj.points[2], obj.points[0]);
    let h = crossProduct(ray.direction, e2);
    let a = dot(e1, h);
    if(a > -EPSILON && a < EPSILON) return null;
    console.log("Passed check 1");
    let s = subtract(ray.origin, obj.points[0]);
    let u = dot(s, h) / a;
    if (u < 0 || u > 1) return null;
    console.log("Passed check 2");
    let q = crossProduct(s, e1);
    let v = dot(ray.direction, q) / a;
    if(v < 0 || u + v > 1) return null;
    console.log("Passed check 3");
    let t = dot(e2, q);
    console.log(t);
    if(t > EPSILON) return t;
    return null;
  }
}


function squareValue(x) {
  return x ** 2;
}

function raytrace(ray) {
  // Loop through all objects
  let closestObj;
  let closestDistance = Infinity;
  for(let i = 0; i < Objs.length; i++) {
    let distance = collide(ray, Objs[i]);
    // If the object doesn't collide with the ray, continue
    if(distance == null) continue;
    console.log("Collided with object " + i + " at distance " + distance);
    // If the distance is less than the closest distance
    if(distance < closestDistance) {
      // Set the closest distance to the distance
      closestDistance = distance;
      // Set the closest object to the object
      closestObj = Objs[i];
    }
  }
  // Calculate the closest object that the ray collides with
  // If the ray collides with an object
  if(closestObj != undefined) {
    // Recursively raytrace the reflected ray (This will be done in a later version)
    // Return the color
    return closestObj.color;
  // If the ray does not collide with an object
  } else {
    // Return the background color
    return {r: 0, g: 0, b: 0};
  }
}

// render() renders the current scene into a 2D array of pixels
function render(width, height) {
  let pixels = [];
  for(let i = 0; i < width; i++) {
    pixels.push([]);
    for(let j = 0; j < height; j++) {
      // Create a ray from the camera to the pixel
      let ray = createRay(width, height, i, j);
      // Raytrace the ray
      pixels[i].push(raytrace(ray));
    }
  }
  return pixels;
}

Objs.push(new Triangle([0, 0, 0], [[0, 0.005, 0], [0.005, 0, 0], [0, 0.005, 0.005]], {r: 255, g: 0, b: 0}, "triangle"));
let frame = 0;

// Testing functions

function testCollideWithTriangleIntersection() {
  const ray = {
      origin: [0, 0, 5],
      direction: [0, 0, -1]
  };
  const triangle = {
      type: 'triangle',
      points: [[-1, -1, 0], [1, -1, 0], [0, 1, 0]]
  };
  if (collide(ray, triangle)) {
      console.log("Test 'collideWithTriangleIntersection' passed!");
  } else {
      console.error("Test 'collideWithTriangleIntersection' failed!");
  }
}

function testCollideWithoutTriangleIntersection() {
  const ray = {
      origin: [0, 0, 5],
      direction: [0, 1, -1]
  };
  const triangle = {
      type: 'triangle',
      points: [[-1, -1, 0], [1, -1, 0], [0, 1, 0]]
  };
  if (!collide(ray, triangle)) {
      console.log("Test 'collideWithoutTriangleIntersection' passed!");
  } else {
      console.error("Test 'collideWithoutTriangleIntersection' failed!");
  }
}

function testCollideWithNonTriangleObject() {
  const ray = {
      origin: [0, 0, 5],
      direction: [0, 1, -1]
  };
  const obj = {
      type: 'sphere',
      center: [0, 0, 0],
      radius: 1
  };
  if (!collide(ray, obj)) {
      console.log("Test 'collideWithNonTriangleObject' passed!");
  } else {
      console.error("Test 'collideWithNonTriangleObject' failed!");
  }
}

function testRaytraceWithCollision() {
  // Setup
  Objs = [{
      type: 'triangle',
      origin: [0, 0, 10],
      points: [[1, -1, 10], [-1, -1, 10], [0, 1, 10]],
      color: { r: 255, g: 0, b: 0 }
  }];
  const ray = {
      origin: [0, 0, 5],
      direction: [0, 0, 1]
  };
  const expected = { r: 255, g: 0, b: 0 };
  const result = raytrace(ray);

  if (JSON.stringify(result) === JSON.stringify(expected)) {
      console.log("Test 'raytraceWithCollision' passed!");
  } else {
      console.error("Test 'raytraceWithCollision' failed! Expected:", expected, " but got:", result);
  }
}

function testRaytraceWithoutCollision() {
  // Setup
  Objs = [{
      type: 'triangle',
      origin: [0, 0, 10],
      points: [[-1, -1, 10], [1, -1, 10], [0, 1, 10]],
      color: { r: 255, g: 0, b: 0 }
  }];
  const ray = {
      origin: [0, 0, 5],
      direction: [0, 1, 0]
  };
  const expected = { r: 0, g: 0, b: 0 };
  const result = raytrace(ray);

  if (JSON.stringify(result) === JSON.stringify(expected)) {
      console.log("Test 'raytraceWithoutCollision' passed!");
  } else {
      console.error("Test 'raytraceWithoutCollision' failed! Expected:", expected, " but got:", result);
  }
}

function testRaytraceWithMultipleObjects() {
  // Setup
  Objs = [
      {
          type: 'triangle',
          origin: [0, 0, 10],
          points: [[0, 1, 10], [1, -1, 10], [-1, -1, 10]],
          color: { r: 255, g: 0, b: 0 }
      },
      {
          type: 'triangle',
          origin: [0, 0, 7],
          points: [[0, 1, 7], [1, -1, 7], [-1, -1, 7]],
          color: { r: 0, g: 255, b: 0 }
      }
  ];
  const ray = {
      origin: [0, 0, 5],
      direction: [0, 0, 1]
  };
  const expected = { r: 0, g: 255, b: 0 }; // The closer green triangle should be detected
  const result = raytrace(ray);

  if (JSON.stringify(result) === JSON.stringify(expected)) {
      console.log("Test 'raytraceWithMultipleObjects' passed!");
  } else {
      console.error("Test 'raytraceWithMultipleObjects' failed! Expected:", expected, " but got:", result);
  }
}

function runTests() {
  testRaytraceWithCollision();
  testRaytraceWithoutCollision();
  testRaytraceWithMultipleObjects();
  testCollideWithTriangleIntersection();
  testCollideWithoutTriangleIntersection();
  testCollideWithNonTriangleObject();
}

runTests();

function draw() {
  return;
  // frame++;
  // if(frame > 1) return; // Stop after 1 frame (save computation time)
  // print("Rendering...");
  // // TODO: Render in parellel to save computation time
  // let pixels = render(width, height);
  // print("Drawing...");
  // drawPixels(pixels);
  // print("Done!");
}
