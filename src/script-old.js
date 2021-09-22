import "./style.css";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import * as dat from "dat.gui";

// --------------------------Base------------------------

// Debug
const gui = new dat.GUI();

// Canvas
const canvas = document.querySelector("canvas.webgl");

// Scene
const scene = new THREE.Scene();

/**
 * Textures
 */
const loadingManager = new THREE.LoadingManager();
const textureLoader = new THREE.TextureLoader(loadingManager);
const cubeTexture = textureLoader.load("/textures/bricks/color.jpg");
const balltexture = textureLoader.load("/textures/grass/color.jpg");

// --------------------------Land------------------------

// Land container
const land = new THREE.Group();
scene.add(land);

// Ground
const ground = new THREE.Mesh(
  new THREE.PlaneBufferGeometry(50, 50),
  new THREE.MeshStandardMaterial({
    color: "#91b399",
  })
);
ground.rotation.x = -Math.PI * 0.5;
land.add(ground);

// Stones
for (let i = 0; i < 8; i++) {
  const stone = new THREE.Mesh(
    new THREE.PlaneBufferGeometry(48, 0.2),
    new THREE.MeshStandardMaterial({
      color: "#52423e",
      side: THREE.DoubleSide,
    })
  );
  stone.position.y = 1;
  switch (i) {
    case 0:
      stone.position.z = 24;
      break;
    case 1:
      stone.position.z = -24;
      break;
    case 2:
      stone.rotation.y = Math.PI * 0.5;
      stone.position.x = 24;
      break;
    case 3:
      stone.rotation.y = Math.PI * 0.5;
      stone.position.x = -24;
      break;
    case 4:
      stone.position.y = 2;
      stone.position.z = 24;
      break;
    case 5:
      stone.position.y = 2;
      stone.position.z = -24;
      break;
    case 6:
      stone.position.y = 2;
      stone.rotation.y = Math.PI * 0.5;
      stone.position.x = 24;
      break;
    case 7:
      stone.position.y = 2;
      stone.rotation.y = Math.PI * 0.5;
      stone.position.x = -24;
      break;

    default:
      break;
  }
  land.add(stone);
}

// --------------------------Ball------------------------
const objectBall = new THREE.Object3D();
const ballVector = new THREE.Vector3(0, 0, 0);
const objectBallVector = new THREE.Vector3(0, 0, 0);

const ball = new THREE.Mesh(
  new THREE.SphereGeometry(1, 32, 32),
  new THREE.MeshStandardMaterial({
    map: balltexture,
  })
);
objectBall.add(ball);
land.add(objectBall);

// --------------------------Cubes------------------------

const cubeGeometry = new THREE.BoxGeometry(2, 2, 2);
const cubeMaterial = new THREE.MeshStandardMaterial({ map: cubeTexture });
const cube1 = new THREE.Mesh(cubeGeometry, cubeMaterial);
const cube2 = new THREE.Mesh(cubeGeometry, cubeMaterial);
const cube3 = new THREE.Mesh(cubeGeometry, cubeMaterial);
const cube4 = new THREE.Mesh(cubeGeometry, cubeMaterial);

cube1.position.set(10, 1, 10);
cube2.position.set(10, 1, -10);
cube3.position.set(-10, 1, 10);
cube4.position.set(-10, 1, -10);

scene.add(cube1, cube2, cube3, cube4);

// --------------------------Light------------------------

// Ambient light
const ambientLight = new THREE.AmbientLight("#ffffff", 1);
scene.add(ambientLight);

// --------------------------Sizes------------------------

const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

window.addEventListener("resize", () => {
  // Update sizes
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;

  // Update camera
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  // Update renderer
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

// --------------------------Cameras------------------------

// Base camera
const camera = new THREE.PerspectiveCamera(
  75,
  sizes.width / sizes.height,
  0.1,
  100
);
camera.position.x = 4;
camera.position.y = 2;
camera.position.z = 5;
scene.add(camera);

// Camera controls
const cameraControls = new OrbitControls(camera, canvas);
cameraControls.enableDamping = true;

// --------------------------Ball controls------------------------

class BasicBallController {
  constructor() {
    this._input = new BasicBallControllerInput();
    this._stateMachine = new FiniteStateMachine(
      new BasicBallControllerProxy(this)
    );
  }
}

class BasicBallControllerInput {
  constructor() {}
}

class FiniteStateMachine {
  constructor() {}
}

// left = 37 up = 38 right = 39 down = 40 space = 32

document.onkeydown = checkKey;

const ballPosition = {
  x: 0,
  y: 1,
  z: 0,
};

const ballRotation = {
  x: 0,
  y: 0,
  z: 0,
};

function checkKey(e) {
  e = e || window.event;

  if (e.keyCode == "37") {
    ballVector.y += 0.01;
    ball.rotation.y = ballVector.y;
  } else if (e.keyCode == "38") {
    ballPosition.z -= 0.1;
    ballRotation.x += 0.001;
    ball.rotateX(ballRotation.x);
  } else if (e.keyCode == "39") {
    ballVector.y -= 0.01;
    ball.rotateZ(ballVector.z);
  } else if (e.keyCode == "40") {
    ballPosition.z += 0.1;
    ballRotation.x -= 0.001;
    ball.rotateX(ballRotation.x);
  }
}

// --------------------------Renderer------------------------

const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
});
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setClearColor("#ffe59e");
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// --------------------------Animate------------------------

const clock = new THREE.Clock();

const axesHelper = new THREE.AxesHelper(5);
axesHelper.setColors("red", "yellow", "blue");
ball.add(axesHelper);

const objectAxesHelper = new THREE.AxesHelper(5);
objectAxesHelper.setColors("red", "yellow", "blue");
objectBall.add(objectAxesHelper);

const tick = () => {
  const elapsedTime = clock.getElapsedTime();
  // Update Camera controls
  cameraControls.update();

  // Update ball position
  ball.position.set(ballPosition.x, ballPosition.y, ballPosition.z);
  ball.rotation.set(ballVector.x, ballVector.y, ballVector.z);

  objectBall.position.set(objectBallVector);

  // if(elapsedTime > 3)
  // {
  //   ball.position.y =  Math.abs(Math.sin(elapsedTime)*1.5) + ballPosition.y
  // }

  // Render
  renderer.render(scene, camera);

  // Call tick again on the next frame
  window.requestAnimationFrame(tick);
};

tick();
