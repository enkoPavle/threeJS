import "./style.css";
import * as THREE from "three";
import { PointerLockControls } from "three/examples/jsm/controls/PointerLockControls.js";
import CANNON from "cannon";

THREE.PlayerControls = function (camera, player, domElement) {
  this.camera = camera;
  this.player = player;
  this.domElement = domElement !== undefined ? domElement : document;

  //

  const clock = new THREE.Clock();

  //

  // API

  this.enabled = true;

  this.center = new THREE.Vector3(
    player.position.x,
    player.position.y,
    player.position.z
  );

  this.moveSpeed = 0.2;
  this.turnSpeed = 0.1;

  this.userZoom = true;
  this.userZoomSpeed = 1.0;

  this.userRotate = true;
  this.userRotateSpeed = 1.5;

  this.autoRotate = false;
  this.autoRotateSpeed = 0.1;
  this.YAutoRotation = false;

  this.minPolarAngle = 0;
  this.maxPolarAngle = Math.PI;

  this.minDistance = 0;
  this.maxDistance = Infinity;

  // internals

  var scope = this;

  var EPS = 0.000001;
  var PIXELS_PER_ROUND = 1800;

  var rotateStart = new THREE.Vector2();
  var rotateEnd = new THREE.Vector2();
  var rotateDelta = new THREE.Vector2();

  var zoomStart = new THREE.Vector2();
  var zoomEnd = new THREE.Vector2();
  var zoomDelta = new THREE.Vector2();

  var phiDelta = 0;
  var thetaDelta = 0;
  var scale = 1;

  var lastPosition = new THREE.Vector3(
    player.position.x,
    player.position.y,
    player.position.z
  );
  var playerIsMoving = false;
  var playerIsJumping = {
    action: false,
    startPos: 0,
    upPhase: false,
    downPhase: false,
    ii: 0,
  };

  var keyState = {};
  var STATE = { NONE: -1, ROTATE: 0, ZOOM: 1, PAN: 2 };
  var state = STATE.NONE;

  // events

  var changeEvent = { type: "change" };

  this.rotateLeft = function (angle) {
    if (angle === undefined) {
      angle = getAutoRotationAngle();
    }

    thetaDelta -= angle;
  };

  this.rotateRight = function (angle) {
    if (angle === undefined) {
      angle = getAutoRotationAngle();
    }

    thetaDelta += angle;
  };

  this.rotateUp = function (angle) {
    if (angle === undefined) {
      angle = getAutoRotationAngle();
    }

    phiDelta -= angle;
  };

  this.rotateDown = function (angle) {
    if (angle === undefined) {
      angle = getAutoRotationAngle();
    }

    phiDelta += angle;
  };

  this.zoomIn = function (zoomScale) {
    if (zoomScale === undefined) {
      zoomScale = getZoomScale();
    }

    scale /= zoomScale;
  };

  this.zoomOut = function (zoomScale) {
    if (zoomScale === undefined) {
      zoomScale = getZoomScale();
    }

    scale *= zoomScale;
  };

  this.init = function () {
    this.camera.position.x = this.player.position.x + 2;
    this.camera.position.y = this.player.position.y + 2;
    this.camera.position.z = this.player.position.x + 2;

    this.camera.lookAt(this.player.position);
  };

  this.update = function () {
    this.checkKeyStates();
    this.jump();

    this.center = this.player.position;

    var position = this.camera.position;
    var offset = position.clone().sub(this.center);

    // angle from z-axis around y-axis

    var theta = Math.atan2(offset.x, offset.z);

    // angle from y-axis

    var phi = Math.atan2(
      Math.sqrt(offset.x * offset.x + offset.z * offset.z),
      offset.y
    );

    theta += thetaDelta;
    phi += phiDelta;

    // restrict phi to be between desired limits
    phi = Math.max(this.minPolarAngle, Math.min(this.maxPolarAngle, phi));

    // restrict phi to be between EPS and PI-EPS
    phi = Math.max(EPS, Math.min(Math.PI - EPS, phi));

    var radius = offset.length() * scale;

    radius = Math.max(this.minDistance, Math.min(this.maxDistance, radius));

    offset.x = radius * Math.sin(phi) * Math.sin(theta);
    offset.y = radius * Math.cos(phi);
    offset.z = radius * Math.sin(phi) * Math.cos(theta);

    if (this.autoRotate) {
      this.camera.position.x +=
        this.autoRotateSpeed *
        (this.player.position.x +
          8 * Math.sin(this.player.rotation.y) -
          this.camera.position.x);
      this.camera.position.z +=
        this.autoRotateSpeed *
        (this.player.position.z +
          8 * Math.cos(this.player.rotation.y) -
          this.camera.position.z);
    } else {
      position.copy(this.center).add(offset);
    }

    this.camera.lookAt(this.center);

    thetaDelta = 0;
    phiDelta = 0;
    scale = 1;

    if (state === STATE.NONE && playerIsMoving) {
      this.autoRotate = true;
    } else {
      this.autoRotate = false;
    }

    if (lastPosition.distanceTo(this.player.position) > 0) {
      lastPosition.copy(this.player.position);
    } else if (lastPosition.distanceTo(this.player.position) == 0) {
      playerIsMoving = false;
    }
  };

  this.checkKeyStates = function () {
    if (keyState[38] || keyState[87]) {
      // up arrow or 'w' - move forward

      this.player.position.x -=
        this.moveSpeed * Math.sin(this.player.rotation.y);
      this.player.position.z -=
        this.moveSpeed * Math.cos(this.player.rotation.y);

      this.camera.position.x -=
        this.moveSpeed * Math.sin(this.player.rotation.y);
      this.camera.position.z -=
        this.moveSpeed * Math.cos(this.player.rotation.y);
    }

    if (keyState[40] || keyState[83]) {
      // down arrow or 's' - move backward
      playerIsMoving = true;

      this.player.position.x +=
        this.moveSpeed * Math.sin(this.player.rotation.y);
      this.player.position.z +=
        this.moveSpeed * Math.cos(this.player.rotation.y);

      this.camera.position.x +=
        this.moveSpeed * Math.sin(this.player.rotation.y);
      this.camera.position.z +=
        this.moveSpeed * Math.cos(this.player.rotation.y);
    }

    if (keyState[37] || keyState[65]) {
      // left arrow or 'a' - rotate left
      playerIsMoving = true;

      this.player.rotation.y += this.turnSpeed;
    }

    if (keyState[39] || keyState[68]) {
      // right arrow or 'd' - rotate right
      playerIsMoving = true;

      this.player.rotation.y -= this.turnSpeed;
    }
    if (keyState[81]) {
      // 'q' - strafe left
      playerIsMoving = true;

      this.player.position.x -=
        this.moveSpeed * Math.cos(this.player.rotation.y);
      this.player.position.z +=
        this.moveSpeed * Math.sin(this.player.rotation.y);

      this.camera.position.x -=
        this.moveSpeed * Math.cos(this.player.rotation.y);
      this.camera.position.z +=
        this.moveSpeed * Math.sin(this.player.rotation.y);
    }

    if (keyState[69]) {
      // 'e' - strage right
      playerIsMoving = true;

      this.player.position.x +=
        this.moveSpeed * Math.cos(this.player.rotation.y);
      this.player.position.z -=
        this.moveSpeed * Math.sin(this.player.rotation.y);

      this.camera.position.x +=
        this.moveSpeed * Math.cos(this.player.rotation.y);
      this.camera.position.z -=
        this.moveSpeed * Math.sin(this.player.rotation.y);
    }

    if (keyState[32]) {
      // 'e' - strage right
      if (!playerIsJumping.action) {
        playerIsJumping.action = true;
        playerIsJumping.upPhase = true;
        playerIsJumping.startPos = player.position.y;
      }

      // let a = 0;
      // for (let i = 0; i <= 90; i++) {
      //   console.log(i, Math.sin(i * (Math.PI / 180)) / 15);
      //   a += Math.sin(i * (Math.PI / 180) / 15)
      // }
      // console.log(a)
    }
  };

  this.jump = function () {
    if (playerIsJumping.action) {
      if (playerIsJumping.upPhase && playerIsJumping.ii < 90) {
        player.position.y +=
          Math.cos(playerIsJumping.ii * (Math.PI / 180)) / 10;
        playerIsJumping.ii += 2;
      }
      if (playerIsJumping.upPhase && playerIsJumping.ii === 90) {
        playerIsJumping.upPhase = false;
        playerIsJumping.downPhase = true;
      }
      if (playerIsJumping.downPhase && playerIsJumping.ii) {
        player.position.y -=
          Math.cos(playerIsJumping.ii * (Math.PI / 180)) / 10;
        playerIsJumping.ii -= 2;
      }
      if (playerIsJumping.downPhase && playerIsJumping.ii === 0) {
        player.position.y -=
          Math.cos(playerIsJumping.ii * (Math.PI / 180)) / 10;
        player.position.y = Math.round(player.position.y);
        playerIsJumping.downPhase = false;
        playerIsJumping.action = false;
      }
      console.log(player.position.y);
    }
  };

  //   if (keyState[32]) {
  //     // 'e' - strage UP
  //     console.log('aaaaaaaaaaaaaaaaaaaaaaa ')
  //     const elapsedTime = clock.getElapsedTime();

  //   }

  //   function jump() {
  //     let a = 1000
  //     let interval = setInterval(() => jumpMove(a), 100);
  //   }

  //   function jumpMove(a) {
  //     a -= 100
  //     // player
  //     if(a >= 500) {
  //       this.camera.position.y += 0.2
  //     } if(a > 0 && a < 500) {
  //       this.camera.position.y -= 0.2
  //     }
  //     // camera
  //   }
  // };

  function getAutoRotationAngle() {
    return ((2 * Math.PI) / 60 / 60) * scope.autoRotateSpeed;
  }

  function getZoomScale() {
    return Math.pow(0.95, scope.userZoomSpeed);
  }

  function onMouseDown(event) {
    if (scope.enabled === false) return;
    if (scope.userRotate === false) return;

    event.preventDefault();

    if (event.button === 0) {
      state = STATE.ROTATE;

      rotateStart.set(event.clientX, event.clientY);
    } else if (event.button === 1) {
      state = STATE.ZOOM;

      zoomStart.set(event.clientX, event.clientY);
    }

    document.addEventListener("mousemove", onMouseMove, false);
    document.addEventListener("mouseup", onMouseUp, false);
  }

  function onMouseMove(event) {
    if (scope.enabled === false) return;

    event.preventDefault();

    if (state === STATE.ROTATE) {
      rotateEnd.set(event.clientX, event.clientY);
      rotateDelta.subVectors(rotateEnd, rotateStart);

      scope.rotateLeft(
        ((2 * Math.PI * rotateDelta.x) / PIXELS_PER_ROUND) *
          scope.userRotateSpeed
      );
      scope.rotateUp(
        ((2 * Math.PI * rotateDelta.y) / PIXELS_PER_ROUND) *
          scope.userRotateSpeed
      );

      rotateStart.copy(rotateEnd);
    } else if (state === STATE.ZOOM) {
      zoomEnd.set(event.clientX, event.clientY);
      zoomDelta.subVectors(zoomEnd, zoomStart);

      if (zoomDelta.y > 0) {
        scope.zoomIn();
      } else {
        scope.zoomOut();
      }

      zoomStart.copy(zoomEnd);
    }
  }

  function onMouseUp(event) {
    if (scope.enabled === false) return;
    if (scope.userRotate === false) return;

    document.removeEventListener("mousemove", onMouseMove, false);
    document.removeEventListener("mouseup", onMouseUp, false);

    state = STATE.NONE;
  }

  function onMouseWheel(event) {
    if (scope.enabled === false) return;
    if (scope.userRotate === false) return;

    var delta = 0;

    if (event.wheelDelta) {
      //WebKit / Opera / Explorer 9

      delta = event.wheelDelta;
    } else if (event.detail) {
      // Firefox

      delta = -event.detail;
    }

    if (delta > 0) {
      scope.zoomOut();
    } else {
      scope.zoomIn();
    }
  }

  function onKeyDown(event) {
    event = event || window.event;

    keyState[event.keyCode || event.which] = true;
  }

  function onKeyUp(event) {
    event = event || window.event;

    keyState[event.keyCode || event.which] = false;
  }

  this.domElement.addEventListener(
    "contextmenu",
    function (event) {
      event.preventDefault();
    },
    false
  );
  this.domElement.addEventListener("mousedown", onMouseDown, false);
  this.domElement.addEventListener("mousewheel", onMouseWheel, false);
  this.domElement.addEventListener("DOMMouseScroll", onMouseWheel, false); // firefox
  this.domElement.addEventListener("keydown", onKeyDown, false);
  this.domElement.addEventListener("keyup", onKeyUp, false);

  console.log(player.position);
};

THREE.PlayerControls.prototype = Object.create(THREE.EventDispatcher.prototype);

/**
 * Physics
 */

// World
const world = new CANNON.World();
world.gravity.set(0, -9.82, 0);

// Ball
const ballShape = new CANNON.Sphere(1); // (radius)
const ballBody = new CANNON.Body({
  mass: 1,
  position: new CANNON.Vec3(0, 3, 0),
  shape: ballShape,
});
world.addBody(ballBody);

/**
 * Textures
 */
const loadingManager = new THREE.LoadingManager();
const textureLoader = new THREE.TextureLoader(loadingManager);
const cubeTexture = textureLoader.load("/textures/bricks/color.jpg");
const balltexture = textureLoader.load("/textures/grass/color.jpg");

var container, scene, camera, renderer;

var controls;

var sphere, player;

const clock = new THREE.Clock();
let oldElapsedTime = 0;

init();
// animate();
tick();

function init() {
  // Setup

  //

  container = document.getElementById("container");

  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(
    50,
    window.innerWidth / window.innerHeight,
    1,
    1000
  );

  renderer = new THREE.WebGLRenderer({ alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);

  // Add Objects To the Scene HERE

  // --------------------------Land------------------------

  // Land container
  const land = new THREE.Group();
  scene.add(land);

  // Ground
  const ground = new THREE.Mesh(
    new THREE.PlaneBufferGeometry(50, 50),
    new THREE.MeshBasicMaterial({
      color: "#123456",
    })
  );
  ground.rotation.x = -Math.PI * 0.5;
  land.add(ground);

  // Stones
  for (let i = 0; i < 8; i++) {
    const stone = new THREE.Mesh(
      new THREE.PlaneBufferGeometry(48, 0.2),
      new THREE.MeshBasicMaterial({
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
  const axesHelper = new THREE.AxesHelper(5);

  const ball = new THREE.Mesh(
    new THREE.SphereGeometry(1, 32, 32),
    new THREE.MeshBasicMaterial({
      map: balltexture,
    })
  );
  ball.position.y = 1;
  ball.add(axesHelper);
  scene.add(ball);

  // --------------------------Cubes------------------------

  const cubeGeometry = new THREE.BoxGeometry(2, 2, 2);
  const cubeMaterial = new THREE.MeshBasicMaterial({ map: cubeTexture });
  const cube1 = new THREE.Mesh(cubeGeometry, cubeMaterial);
  const cube2 = new THREE.Mesh(cubeGeometry, cubeMaterial);
  const cube3 = new THREE.Mesh(cubeGeometry, cubeMaterial);
  const cube4 = new THREE.Mesh(cubeGeometry, cubeMaterial);

  cube1.position.set(10, 1, 10);
  cube2.position.set(10, 1, -10);
  cube3.position.set(-10, 1, 10);
  cube4.position.set(-10, 1, -10);

  scene.add(cube1, cube2, cube3, cube4);

  controls = new THREE.PlayerControls(camera, ball);
  controls.init();

  // Events
  controls.addEventListener("change", render, false);
  window.addEventListener("resize", onWindowResize, false);

  // Final touches
  container.appendChild(renderer.domElement);
  document.body.appendChild(container);
}

// function animate() {
//   requestAnimationFrame(animate);

//   controls.update();

//   render();
// }

/**
 * Animate
 */

function tick() {
  const elapsedTime = clock.getElapsedTime();
  const deltaTime = elapsedTime - oldElapsedTime;
  oldElapsedTime = elapsedTime;
  console.log(deltaTime);

  // Update physics world
  world.step(1 / 60, deltaTime, 3); // (a fixed time step, huw much time passed since the last step, how much iterations the world can apply to catch up with a potential delay)

  ball.position.x = ballShape.position.x
  ball.position.y = ballShape.position.y
  ball.position.z = ballShape.position.z


  // Update physics world
  // controls.update();

  render();

  // Call tick again on the next frame
  window.requestAnimationFrame(tick);
}

function render() {
  // Render Scene
  renderer.clear();
  renderer.render(scene, camera);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
}
