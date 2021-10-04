/******************************************************************************/
//////////////////////     THREE.JS - Variables     ////////////////////////////
/******************************************************************************/
// get the DOM element to attach to
var container = $("#container");
width = container.width();
height = container.height();
// set the camera atributtes
fielofview = 75;
aspectratio = width / height;
near = 0.1;
far = 1000;
camera = new THREE.PerspectiveCamera(fielofview, aspectratio, near, far);
//create a WebGL renderer, and a scene
renderer = new THREE.WebGLRenderer();
scene = new THREE.Scene();

//append renderer to the container element
renderer.setSize(width, height);
container.append(renderer.domElement);

/*/////////////////////     THREE JS - Objects     ///////////////////////////*/

// create a point light
var pointLight = new THREE.PointLight(0xffffff);
pointLight.position.set(2, 5, 10);
scene.add(pointLight);

var objMaterial = new THREE.MeshNormalMaterial();
var mesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), objMaterial);
scene.add(mesh);
// chase camera
mesh.add(camera);
camera.position.set(0, 2, 5);

var groundMaterial = new THREE.MeshLambertMaterial({ color: 0x555599 });
var groundMesh = new THREE.Mesh(
  new THREE.PlaneGeometry(10, 10),
  groundMaterial
);
groundMesh.rotation.x = -Math.PI / 2;
scene.add(groundMesh);

var grid = new THREE.GridHelper(100, 10);
scene.add(grid);

/******************************************************************************/
///////////////////////     CANNON JS - Variables     //////////////////////////
/******************************************************************************/
var world = new CANNON.World();
world.gravity.set(0, 0, 0);

world.broadphase = new CANNON.NaiveBroadphase(); // Detect coilliding objects
world.solver.iterations = 5; // collision detection sampling rate

var timeStep = 1.0 / 60.0; // seconds

//var cannonDebugRenderer = new THREE.CannonDebugRenderer( scene, world );  //only for debugging

/*/////////////////////     CANNON JS - Objects     //////////////////////////*/

shape = new CANNON.Box(new CANNON.Vec3(0.5, 0.5, 0.5));
body = new CANNON.Body({ mass: 1 });
body.addShape(shape);
body.position.set(0, 2, 0);
world.addBody(body);

var groundShape = new CANNON.Plane();
var groundBody = new CANNON.Body({ mass: 0, shape: groundShape });
groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
world.add(groundBody);

/*////////////////////////////////////////////////////////////////////////////*/
// var W, A, S, D, Q, E, Ctrl, Shft, Plus, Minus;
var W, A, S, D;
var acceleration = (pitchSpeed = rollSpeed = yawSpeed = 0);
var accelerationImpulse, bodyCenter;
function moveObj() {
  if (W) {
    acceleration = -1;
  }
  if (S) {
    acceleration = 1;
  }
  if (W || S) {
    var accelerationImpulse = new CANNON.Vec3(0, 0, acceleration);
    var accelerationImpulse = body.quaternion.vmult(accelerationImpulse);
    var bodyCenter = new CANNON.Vec3(
      body.position.x,
      body.position.y,
      body.position.z
    );
    body.applyImpulse(accelerationImpulse, bodyCenter);
  }

  if (W || S || A || D ) {
    if (W) {
      pitchSpeed = -0.5;
    } else if (S) {
      pitchSpeed = 0.5;
    } else {
      pitchSpeed = 0;
    }
    if (A) {
      yawSpeed = 0.5;
    } else if (D) {
      yawSpeed = -0.5;
    } else {
      yawSpeed = 0;
    }

    var directionVector = new CANNON.Vec3(pitchSpeed, yawSpeed, rollSpeed);
    var directionVector = body.quaternion.vmult(directionVector);

    body.angularVelocity.set(
      directionVector.x,
      directionVector.y,
      directionVector.z
    );
  }

  body.linearDamping = 0.5;
  body.angularDamping = 0.9;
}

// /*///////////////////////////////////////////////////////////////////////////*/
function updatePhysics() {
  // Step the physics world
  world.step(timeStep);
  // Copy coordinates from Cannon.js to Three.js
  mesh.position.copy(body.position);
  mesh.quaternion.copy(body.quaternion);
}

function render() {
  requestAnimationFrame(render);
  updatePhysics();
  moveObj();

  //cannonDebugRenderer.update(); //only for debugging
  renderer.render(scene, camera);
}
// Call renderer (animate)
render();

/////////////////////////////////////////////////////////////////////////////////////////
// keypress listener
//array for multiple key press
var key = [];

onkeydown = onkeyup = function (e) {
  e = e || event; // to deal with IE
  key[e.keyCode] = e.type == "keydown";
  // A( 65 )
  if (key[65]) {
    A = 1;
  } else {
    A = 0;
  }
  // D( 68 )
  if (key[68]) {
    D = 1;
  } else {
    D = 0;
  }
  // W( 87 )
  if (key[87]) {
    W = 1;
  } else {
    W = 0;
  }
  // S( 83 )
  if (key[83]) {
    S = 1;
  } else {
    S = 0;
  }
};
