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
const ballBoard = new THREE.Mesh(
  new THREE.BoxBufferGeometry(5, 1, 1),
  new THREE.MeshStandardMaterial({
    color: "red",
  })
);

const ball = new THREE.Mesh(
  new THREE.SphereGeometry(1, 32, 32),
  new THREE.MeshStandardMaterial({
    map: balltexture,
  })
);
ball.position.y = 1;

ballBoard.add(ball);
land.add(ballBoard);

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
let move_left, move_rigth, move_up, move_down, jump;

// function moveBall() {
//   if (move_left) {
//     rot = new THREE.Quaternion().setFromAxisAngle(y_axis, Math.PI / 120);
//     cur = myBall.quaternion;
//     cur.multiplyQuaternion(rot, cur);
//     myBall._dirtyRotation = true;
//     // myBall.rotation.y += Math.PI/120
//     // myBall._dirtyRotation = true;
//   } else if (move_rigth) {
//     rot = new THREE.Quaternion().setFromAxisAngle(y_axis, -Math.PI / 120);
//     cur = myBall.quaternion;
//     cur.multiplyQuaternion(rot, cur);
//     myBall._dirtyRotation = true;
//     // myBall.rotation.y += Math.PI/120
//     // myBall._dirtyRotation = true;
//   } else if (move_up) {
//     const curr_rotation = new THREE.Matrix4().extractRotation(myBall.matrix);
//     const force_vector = new THREE.Vector3(40, 0, 0).applyMatrix4(
//       curr_rotation
//     );
//     myBall.applyCentralImpulse(force_vector);
//     myBall._dirtyPosition = true;
//   } else if (move_down) {
//     const curr_rotation = new THREE.Matrix4().extractRotation(myBall.matrix);
//     const force_vector = new THREE.Vector3(-40, 0, 0).applyMatrix4(
//       curr_rotation
//     );
//     myBall.applyCentralImpulse(force_vector);
//     myBall._dirtyPosition = true;
//   }
// }

function moveBall() {
  if (move_left) {
    // const quaternion = new THREE.Quaternion();
    // quaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 120);
    // ballBoard.applyQuaternion(quaternion);

    ballBoard.rotateY(Math.PI/120)

  } else if (move_rigth) {
    const quaternion = new THREE.Quaternion();
    quaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), -Math.PI / 120);
    ballBoard.applyQuaternion(quaternion);
  } else if (move_up) {
    ballBoard.position.x += 1;
  } else if (move_down) {
    ballBoard.position.x -= 1;
  }
}

document.addEventListener("keydown", function (event) {
  const code = event.keyCode;
  if (code === 37) move_left = 1;
  if (code === 38) move_up = 1;
  if (code === 39) move_rigth = 1;
  if (code === 40) move_down = 1;
  if (code === 32) jump = 1;
});

document.addEventListener("keyup", function (event) {
  const code = event.keyCode;
  if (code === 37) move_left = 0;
  if (code === 38) move_up = 0;
  if (code === 39) move_rigth = 0;
  if (code === 40) move_down = 0;
  if (code === 32) jump = 0;
});

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

const tick = () => {
  const elapsedTime = clock.getElapsedTime();
  // Update Camera controls
  cameraControls.update();

  // Update ball position
  moveBall();

  // Render
  renderer.render(scene, camera);

  // Call tick again on the next frame
  window.requestAnimationFrame(tick);
};

tick();
