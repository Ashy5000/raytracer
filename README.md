# Raytracer

## Installation
You can install the raytracer with git clone:
```bash
git clone https://github.com/Ashy5000/raytracer.git
```
## Quickstart
Quickstart with this raytracer is quite simple. Just follow these steps:
1. Open the repository in Visual Studio Code
2. Start the live server
3. Wait for the test scene to render
After following those steps, you should see a red triangle on a black background.

## Usage

### Classes

#### Obj
The base class for objects in your scene. Subclasses are:
1. ##### Triangle
   origin: Origin point of the triangle in the form [x, y, z]
   points: Vertices of the triangle in the form [[x, y, z], [x, y, z], [x, y, z]]
   color: The triangle's base color

#### Light
The class for lights in the scene.
  origin: Position of the light in the form [x, y, z]
  strength: Number representing strength/power of light

### Variables

**Objs**: Array of objects (instances of the Obj class)
**Lights**: Array of lights (instances of the Light class)
