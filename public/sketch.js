// Author: Asher Wrobel, 2023
// Version: 1.0
// This is open source code, feel free to use it for your own projects

const width = 500;
const height = 300;
const hyperResolution = 1; // The number of rays to cast per pixel
const raytraceDepth = 3; // The number of times to reflect the ray

let Objs = [];
let Lights = [];

let roboto;
function preload() {
  roboto = loadFont("Roboto-Regular.otf");
}

function setup() {
  // Create the canvas
  createCanvas(width, height, WEBGL);
  background(220);
  // Set the font
  textFont(roboto);
}

// defaultStroke() sets the stroke to the default (black)
function defaultStroke() {
  stroke(0);
}

// drawPixel() draws a pixel at (x, y) with color (r, g, b)
function drawPixel(x, y, r, g, b) {
  stroke(r, g, b);
  point(x, y);
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
  constructor(origin, color, type, transparency) {
    this.origin = origin;
    this.color = color;
    this.type = type;
    this.transparency = transparency;
  }
}

class Triangle extends Obj {
  constructor(origin, points, color, transparency) {
    super(origin, color, "triangle", transparency);
    this.points = points;
  }
}

class Light {
  constructor(origin, strength) {
    this.origin = origin;
    this.strength = strength;
  }
}

class Material {
  constructor(color, transparency, roughness) {
    this.color = color;
    this.transparency = transparency;
    this.roughness = roughness;
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
  let screenWidth = 1;
  let screenHeight = 1;
  let screenDistance = 1;
  let screenX = (x / xdim - 0.5) * screenWidth;
  let screenY = (y / ydim - 0.5) * screenHeight;
  let direction = normalize([screenX, screenY, screenDistance]);
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

function add(vector1, vector2) {
  return [vector1[0] + vector2[0], vector1[1] + vector2[1], vector1[2] + vector2[2]];
}

// collide() returns true if the ray collides with the Obj
function collide(ray, obj) {
  if(obj.type == "triangle") {
    let rand = Math.random();
    if(rand < obj.material.transparency) return null;
    // Moller-Trumbore algorithm
    const EPSILON = 0.000001;
    let e1 = subtract(obj.points[1], obj.points[0]);
    let e2 = subtract(obj.points[2], obj.points[0]);
    // console.log("e1: " + e1);
    // console.log("e2: " + e2);
    let n = crossProduct(e1, e2);
    n = normalize(n);
    // console.log("n: " + n);
    let h = crossProduct(ray.direction, e2);
    // console.log("h: " + h);
    let a = dot(e1, h);
    // console.log("a: " + a);
    if(a > -EPSILON && a < EPSILON) return null;
    let s = subtract(ray.origin, obj.points[0]);
    // console.log("s: " + s);
    let u = dot(s, h) / a;
    // console.log("u: " + u);
    if (u < 0 || u > 1) return null;
    let q = crossProduct(s, e1);
    // console.log("q: " + q);
    let v = dot(ray.direction, q) / a;
    // console.log("v: " + v);
    if(v < 0 || u + v > 1) return null;
    let t = dot(e2, q);
    // console.log("t: " + t);
    if(t > EPSILON) return { "distance": t, "normal": n };
    return null;
  }
}


function squareValue(x) {
  return x ** 2;
}

function randomInHemisphere(normal) {
  let u = Math.random();
  let v = Math.random();
  let theta = 2 * Math.PI * u;
  let phi = Math.acos(2 * v - 1);
  let x = Math.sin(phi) * Math.cos(theta);
  let y = Math.sin(phi) * Math.sin(theta);
  let z = Math.cos(phi);
  let randomDir = [x, y, z];
  if(dot(randomDir, normal) < 0) {
    randomDir = [-x, -y, -z];
  }
  return randomDir;
}

function reflectSpecular(incident, normal) {
  let dotProductValue = dot(incident, normal);
  let reflected = [
      incident[0] - 2 * dotProductValue * normal[0],
      incident[1] - 2 * dotProductValue * normal[1],
      incident[2] - 2 * dotProductValue * normal[2]
  ];
  return normalize(reflected);
}

function reflectDiffuse(incident, normal) {
  let randomDir = randomInHemisphere(normal);
  return randomDir;
}

function reflect(incident, normal, roughness) {
  let specular = reflectSpecular(incident, normal);
  let diffuse = reflectDiffuse(incident, normal);
  let reflectedDir = [
    (1 - roughness) * specular[0] + roughness * diffuse[0],
    (1 - roughness) * specular[1] + roughness * diffuse[1],
    (1 - roughness) * specular[2] + roughness * diffuse[2]
  ];
  return reflectedDir;
}

function computeIntersectionPoint(origin, direction, distance) {
  return [
      origin[0] + direction[0] * distance,
      origin[1] + direction[1] * distance,
      origin[2] + direction[2] * distance
 ];
}

function getInteresections(ray) {
  let intersections = [];
  for(let i = 0; i < Objs.length; i++) {
    let obj = Objs[i];
    let collision = collide(ray, obj);
    if(collision == null) continue;
    let distance = collision.distance;
    let intersectionPoint = computeIntersectionPoint(ray.origin, ray.direction, distance);
    intersections.push( { "point": intersectionPoint, "distance": distance });
  }
  return intersections;
}

function raytrace(ray, depth, blend = true, blendAmount = 0.5) {
  // Loop through all objects
  let closestObj;
  let closestDistance = Infinity;
  let color = {r: 0, g: 0, b: 0};
  for(let i = 0; i < Objs.length; i++) {
    // correctWindingOrder(Objs[i]);
    let collision = collide(ray, Objs[i]);
    // If the ray does not collide with the object, continue
    if(collision == null) continue;
    let distance = collision.distance;
    let normal = collision.normal;
    // Base case: If the depth is 0, return the color of the object
    if(depth == 0) {
      // If the distance is less than the closest distance
      if(distance < closestDistance) {
        // Set the closest distance to the distance
        closestDistance = distance;
        // Set the closest object to the object
        closestObj = Objs[i];
        // Set the color to the color of the object
        color = closestObj.material.color;
      }
    } else {
      // Compute the intersection point
      let intersectionPoint = computeIntersectionPoint(ray.origin, ray.direction, distance);
      // Compute the reflected ray
      let reflectedRay = new Ray(intersectionPoint, reflect(ray.direction, normal, Objs[i].material.roughness));
      // Recursively raytrace the reflected ray
      if(blend) {
        let objColor = raytrace(ray, 0, null, false, 0);
        let reflectedColor = raytrace(reflectedRay, depth - 1, blend, blendAmount);
        let blendedColor = {
          r: (reflectedColor.r * blendAmount + objColor.r * (1 - blendAmount)),
          g: (reflectedColor.g * blendAmount + objColor.g * (1 - blendAmount)),
          b: (reflectedColor.b * blendAmount + objColor.b * (1 - blendAmount))
        };
        color = blendedColor;
      } else {
        let reflectedColor = raytrace(reflectedRay, depth - 1, null, false, 0);
        color = reflectedColor;
      }
    }
  }
  let intersectionPoint = computeIntersectionPoint(ray.origin, ray.direction, closestDistance);
  for(let i = 0; i < Lights.length; i++) {
    let light = Lights[i];
    let lightRay = new Ray(intersectionPoint, subtract(light.origin, intersectionPoint));
    let intersections = getInteresections(lightRay);
    let closestIntersectionDistance = Infinity;
    for(let j = 0; j < intersections.length; j++) {
      let intersection = intersections[j];
      if(intersection.distance < closestIntersectionDistance && intersection.distance > 0) {
        closestIntersectionDistance = intersection.distance;
      }
    }
    let lightDistance = Math.sqrt(squareValue(intersectionPoint[0] - light.origin[0]) + squareValue(intersectionPoint[1] - light.origin[1]) + squareValue(intersectionPoint[2] - light.origin[2]));
    let lightStrength = light.strength;
    let appliedLightStrength = lightStrength / (lightDistance ** 2);
    if(lightDistance < closestIntersectionDistance) {
      color = {r: color.r * appliedLightStrength, g: color.g * appliedLightStrength, b: color.b * appliedLightStrength};
    }
  }
  return color;
}

function isCCW(A, B, C) {
  // Compute the cross product between the two edges AB and AC
  let normal = crossProduct(subtract(B, A), subtract(C, A));

  // If the z-component of the normal is positive, it's CCW (assuming looking down from positive z-axis onto the xy-plane)
  // Adjust this condition if you use a different convention for your coordinate system
  return normal[2] > 0;
}

function isCW(A, B, C) {
  return !isCCW(A, B, C);
}

function correctWindingOrder(triangle) {
  if (triangle.skipWindingOrder) return;
  // If the triangle isn't in CW order, swap two vertices to fix it
  if (!isCW(triangle.points[0], triangle.points[1], triangle.points[2])) {
    let temp = triangle.points[1];
    triangle.points[1] = triangle.points[2];
    triangle.points[2] = temp;
  }
}

function pool(pixels, stepSize) {
  let pooledPixels = [];
  for(let i = 0; i < pixels.length; i += stepSize) {
    pooledPixels.push([]);
    for(let j = 0; j < pixels[0].length; j += stepSize) {
      let pixel = {
        r: (pixels[i][j].r + pixels[i + 1][j].r + pixels[i][j + 1].r + pixels[i + 1][j + 1].r) / 4,
        g: (pixels[i][j].g + pixels[i + 1][j].g + pixels[i][j + 1].g + pixels[i + 1][j + 1].g) / 4,
        b: (pixels[i][j].b + pixels[i + 1][j].b + pixels[i][j + 1].b + pixels[i + 1][j + 1].b) / 4
      };
      pooledPixels[i / stepSize].push(pixel);
    }
  }
  return pooledPixels;
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
      pixels[i].push(raytrace(ray, raytraceDepth));
    }
  }
  return pixels;
}

Objs = [
  {
    type: 'triangle',
    origin: [0, 0, 1],
    points: [[0, 0.5, 1],[-0.5, -0.5, 1], [0.5, -0.5, 1],],
    material: new Material({ r: 0, g: 0, b: 255 }, 0, 0), // Black triangle
    skipWindingOrder: true
  },
  {
      type: 'triangle',
      origin: [0, 0, 1],
      points: [[1, -1, 1], [-1, -1, 1], [0, 1, 1],],
      material: new Material({ r: 255, g: 0, b: 0 }, 0, 1), // Red triangle
      skipWindingOrder: false
  },
];

Lights = [
  {
    origin: [0, 0, 0],
    strength: 20
  }
];

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

// runTests();

function draw() {
  frame++;
  fill(0);
  if(frame == 1) {
    console.log("Loading...");
    // Show loading screen
    translate(-width/2,-height/2,0);
    text("Running rendering pipeline...", 10, 20);
    text("This may take a while...", 10, 40);
    text("RENDER INFORMATION", 10, 80);
    text("Dimensions: " + width + "x" + height, 10, 100);
    text("Objects: " + Objs.length, 10, 120);
    // Don't render the first frame (to show the loading screen)
    return;
  }
  if(frame > 2) return; // Stop after 1 frame (to save computation time, there's no need to render more than 1 frame when the scene is static)
  translate(-width/2,-height/2,0);
  background(220);
  print("Rendering...");
  // TODO: Render in parellel to save computation time
  const renderStart = performance.now();
  let pixels = render(width * hyperResolution, height * hyperResolution);
  let pooledPixels = hyperResolution > 1 ? pool(pixels, hyperResolution) : pixels;
  const renderEnd = performance.now();
  const renderTime = renderEnd - renderStart;
  print("Rendered in " + renderTime + "ms");
  print("Drawing...");
  const drawStart = performance.now();
  drawPixels(pooledPixels);
  const drawEnd = performance.now();
  const drawTime = drawEnd - drawStart;
  print("Drew in " + drawTime + "ms");
  print("Done!");
  const totalTime = renderTime + drawTime;
  print("Time breakdown:");
  print("Rendering: " + 100 / (totalTime / renderTime) + "%");
  print("Drawing: " + 100 / (totalTime / drawTime) + "%");
  print("Total time: " + totalTime + "ms");
}
