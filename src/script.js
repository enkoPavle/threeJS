import "./style.css";
import * as THREE from "three";
import * as CANNON from "cannon-es";

class PointerLockControlsCannon extends THREE.EventDispatcher {
  constructor(camera, cannonBody) {
    super();

    this.enabled = true;

    this.cannonBody = cannonBody;

    // var eyeYPos = 2 // eyes are 2 meters above the ground
    this.velocityFactor = 0.15;
    this.jumpVelocity = 10;

    this.pitchObject = new THREE.Object3D();
    this.pitchObject.add(camera);

    this.yawObject = new THREE.Object3D();
    // this.yawObject.position.y = 2;
    this.pitchObject.position.setX(cannonBody.position.x + 2);
    this.pitchObject.position.setY(cannonBody.position.y);
    this.pitchObject.position.setZ(cannonBody.position.z + 5);
    this.yawObject.add(this.pitchObject);

    this.quaternion = new THREE.Quaternion();

    this.moveForward = false;
    this.moveBackward = false;
    this.moveLeft = false;
    this.moveRight = false;
    this.acceleration = 1;
    this.canJump = false;

    this.rotation = 0;

    const contactNormal = new CANNON.Vec3(); // Normal in the contact, pointing *out* of whatever the player touched
    const upAxis = new CANNON.Vec3(0, 1, 0);
    this.cannonBody.addEventListener("collide", (event) => {
      const { contact } = event;

      // contact.bi and contact.bj are the colliding bodies, and contact.ni is the collision normal.
      // We do not yet know which one is which! Let's check.
      if (contact.bi.id === this.cannonBody.id) {
        // bi is the player body, flip the contact normal
        contact.ni.negate(contactNormal);
      } else {
        // bi is something else. Keep the normal as it is
        contactNormal.copy(contact.ni);
      }

      // If contactNormal.dot(upAxis) is between 0 and 1, we know that the contact normal is somewhat in the up direction.
      if (contactNormal.dot(upAxis) > 0.15) {
        // Use a "good" threshold value between 0 and 1 here!
        this.canJump = true;
      }
    });

    this.velocity = this.cannonBody.velocity;

    // Moves the camera to the cannon.js object position and adds velocity to the object if the run key is down
    this.inputVelocity = new THREE.Vector3();
    this.euler = new THREE.Euler();

    this.lockEvent = { type: "lock" };
    this.unlockEvent = { type: "unlock" };

    this.connect();
  }

  connect() {
    document.addEventListener("mousemove", this.onMouseMove);
    document.addEventListener("pointerlockchange", this.onPointerlockChange);
    document.addEventListener("pointerlockerror", this.onPointerlockError);
    document.addEventListener("keydown", this.onKeyDown);
    document.addEventListener("keyup", this.onKeyUp);
  }

  // disconnect() {
  //   document.removeEventListener('mousemove', this.onMouseMove)
  //   document.removeEventListener('pointerlockchange', this.onPointerlockChange)
  //   document.removeEventListener('pointerlockerror', this.onPointerlockError)
  //   document.removeEventListener('keydown', this.onKeyDown)
  //   document.removeEventListener('keyup', this.onKeyUp)
  // }

  dispose() {
    // this.disconnect()
  }

  lock() {
    document.body.requestPointerLock();
  }

  unlock() {
    document.exitPointerLock();
  }

  onPointerlockChange = () => {
    if (document.pointerLockElement) {
      this.dispatchEvent(this.lockEvent);

      this.isLocked = true;
    } else {
      this.dispatchEvent(this.unlockEvent);

      this.isLocked = false;
    }
  };

  onPointerlockError = () => {
    console.error("PointerLockControlsCannon: Unable to use Pointer Lock API");
  };

  onMouseMove = (event) => {
    if (!this.enabled) {
      return;
    }
    const { movementX, movementY } = event;
    this.yawObject.rotation.y -= movementX * 0.008;
    // this.pitchObject.rotation.x -= movementY * 0.002

    // this.pitchObject.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.pitchObject.rotation.x))
  };

  rotate(rotation) {
    this.yawObject.rotation.y = rotation * 0.02;
  }

  onKeyDown = (event) => {
    switch (event.code) {
      case "ShiftLeft":
      case "ShiftRight":
        this.acceleration = 3;
        break;

      case "KeyW":
      case "ArrowUp":
        this.moveForward = true;
        break;

      case "KeyA":
      case "ArrowLeft":
        // this.rotation += 1;
        // this.rotate(this.rotation);
        this.moveLeft = true;

        break;

      case "KeyQ":
        // this.moveLeft = true;
        break;
      case "KeyS":
      case "ArrowDown":
        this.moveBackward = true;
        break;

      case "KeyD":
      case "ArrowRight":
        // this.rotation -= 1;
        // this.rotate(this.rotation);
        this.moveRight = true;
        break;

      case "KeyE":
        // this.moveRight = true;
        break;

      case "Space":
        if (this.canJump) {
          this.velocity.y = this.jumpVelocity;
        }
        this.canJump = false;
        break;
    }
  };

  onKeyUp = (event) => {
    switch (event.code) {
      case "ShiftLeft":
      case "ShiftRight":
        this.acceleration = 1;
        break;

      case "KeyW":
      case "ArrowUp":
        this.moveForward = false;
        break;

      case "KeyA":
      case "ArrowLeft":
        this.moveLeft = false;
        break;
      case "KeyQ":
        this.moveLeft = false;
        break;

      case "KeyS":
      case "ArrowDown":
        this.moveBackward = false;
        break;

      case "KeyD":
      case "ArrowRight":
        this.moveRight = false;
        break;
      case "KeyE":
        this.moveRight = false;
        break;
    }
  };

  getObject() {
    return this.yawObject;
  }

  getDirection() {
    const vector = new CANNON.Vec3(0, 0, -1);
    vector.applyQuaternion(this.quaternion);
    return vector;
  }

  update(delta) {
    if (this.enabled === false) {
      return;
    }
    delta *= 1000;
    delta *= 0.1;

    this.inputVelocity.set(0, 0, 0);

    if (this.moveForward) {
      this.inputVelocity.z = -this.velocityFactor * delta * this.acceleration;
    }
    if (this.moveBackward) {
      this.inputVelocity.z = this.velocityFactor * delta * this.acceleration;
    }

    if (this.moveLeft) {
      this.inputVelocity.x = -this.velocityFactor * delta;
    }
    if (this.moveRight) {
      this.inputVelocity.x = this.velocityFactor * delta;
    }

    // Convert velocity to world coordinates
    this.euler.x = this.pitchObject.rotation.x;
    this.euler.y = this.yawObject.rotation.y;
    this.euler.order = "XYZ";
    this.quaternion.setFromEuler(this.euler);
    this.inputVelocity.applyQuaternion(this.quaternion);

    // Add to the object
    this.velocity.x += this.inputVelocity.x;
    this.velocity.z += this.inputVelocity.z;

    this.yawObject.position.copy(this.cannonBody.position);
  }
}

//-------------------------------------Base-------------------------------------^

// Canvas
const canvas = document.querySelector("canvas.webgl");

// Scene
const scene = new THREE.Scene();
scene.fog = new THREE.Fog("#c5e8eb", 0, 200);

//-------------------------------------Sounds-------------------------------------^

const hitSound = new Audio("/sounds/hit.mp3");
let soundArray = [];

const playHitSound = (collision) => {
  const impactStrength = collision.contact.getImpactVelocityAlongNormal();

  if (impactStrength > 1.5) {
    hitSound.volume = Math.random();
    hitSound.currentTime = 0;
    hitSound.play();
  }
};

//-------------------------------------Textures-------------------------------------^

const textureLoader = new THREE.TextureLoader();
const groundGrassTexture = textureLoader.load("/textures/grass.jpg");
const woodFenceTexture = textureLoader.load("/textures/woodFenceTexture.jpg");
const woodInnerFenceTexture = textureLoader.load(
  "/textures/woodFenceTexture.jpg"
);
const woodInnerGoalTexture = textureLoader.load(
  "/textures/woodInnerGoalTexture.jpg"
);

// changing
groundGrassTexture.wrapS = groundGrassTexture.wrapT = THREE.RepeatWrapping;
groundGrassTexture.offset.set(0, 0);
groundGrassTexture.repeat.set(8, 8);

woodFenceTexture.wrapS = woodFenceTexture.wrapT = THREE.RepeatWrapping;
woodFenceTexture.offset.set(0, 0);
woodFenceTexture.repeat.set(100, 0.01);

woodInnerFenceTexture.wrapS = woodInnerFenceTexture.wrapT =
  THREE.RepeatWrapping;
woodInnerFenceTexture.offset.set(0, 0);
woodInnerFenceTexture.repeat.set(5, 0.01);

//-------------------------------------Physics-------------------------------------^

const world = new CANNON.World();
world.broadphase = new CANNON.SAPBroadphase(world);
// world.allowSleep = true;
world.gravity.set(0, -10, 0);

// Default material
const defaultMaterial = new CANNON.Material("default");
const defaultContactMaterial = new CANNON.ContactMaterial(
  defaultMaterial,
  defaultMaterial,
  {
    friction: 0.5,
    restitution: 0.7,
  }
);
world.defaultContactMaterial = defaultContactMaterial;

// Floor
const floorShape = new CANNON.Plane();
const floorBody = new CANNON.Body();
floorBody.mass = 0;
floorBody.addShape(floorShape);
floorBody.quaternion.setFromAxisAngle(new CANNON.Vec3(-1, 0, 0), Math.PI * 0.5);
world.addBody(floorBody);

//-------------------------------------Utils-------------------------------------^

const objectsToUpdate = [];

//-------------------------------------Objects-------------------------------------^

// Main fence

const mainFenceGeometry = new THREE.BoxBufferGeometry(100, 4, 0.2);
const mainFenceMaterial = new THREE.MeshStandardMaterial({
  map: woodFenceTexture,
  side: THREE.DoubleSide,
});

let mainFencePos = [
  { x: 50, y: 2, z: 0 },
  { x: 0, y: 2, z: -50 },
  { x: -50, y: 2, z: 0 },
  { x: 0, y: 2, z: 50 },
];

for (let i = 0; i < 4; i++) {
  const mainFence = new THREE.Mesh(mainFenceGeometry, mainFenceMaterial);
  const { x, y, z } = mainFencePos[i];
  mainFence.position.set(x, y, z);
  if (i === 0 || i === 2) mainFence.rotation.y = -Math.PI * 0.5;
  scene.add(mainFence);

  // Cannon.js body
  const mainFenceShape = new CANNON.Box(new CANNON.Vec3(50, 2, 0.05));
  const mainFenceBody = new CANNON.Body({
    mass: 0,
    position: new CANNON.Vec3(x, y, z),
    shape: mainFenceShape,
    material: defaultMaterial,
  });
  if (i === 0 || i === 2)
    mainFenceBody.quaternion.setFromAxisAngle(
      new CANNON.Vec3(0, -1, 0),
      Math.PI * 0.5
    );

  soundArray.push(mainFenceBody);
  world.addBody(mainFenceBody);
}

// Inner fence
const innerFenceGeometry = new THREE.BoxBufferGeometry(45, 4, 0.2);
const innerFenceMaterial = new THREE.MeshStandardMaterial({
  map: woodFenceTexture,
  side: THREE.DoubleSide,
});

const innerFence1 = new THREE.Mesh(innerFenceGeometry, innerFenceMaterial);
const innerFence2 = new THREE.Mesh(innerFenceGeometry, innerFenceMaterial);
innerFence1.position.set(-27, 2, 0);
innerFence2.position.set(27, 2, 0);
scene.add(innerFence1, innerFence2);

// Cannon.js body
const innerFenceShape = new CANNON.Box(new CANNON.Vec3(22.2, 2, 0.1));
const innerFenceBody1 = new CANNON.Body({
  mass: 0,
  position: new CANNON.Vec3(-27, 2, 0),
  shape: innerFenceShape,
  material: defaultMaterial,
});
const innerFenceBody2 = new CANNON.Body({
  mass: 0,
  position: new CANNON.Vec3(27, 2, 0),
  shape: innerFenceShape,
  material: defaultMaterial,
});

soundArray.push(innerFenceBody1);
soundArray.push(innerFenceBody2);

world.addBody(innerFenceBody1);
world.addBody(innerFenceBody2);

// Inner Fence Goal

const innerFenceAndGoalGeometry = new THREE.BoxBufferGeometry(2, 4, 0.2);

const innerFencePartMaterial = new THREE.MeshStandardMaterial({
  map: woodInnerFenceTexture,
});
const innerGoalMaterial = new THREE.MeshStandardMaterial({
  map: woodInnerGoalTexture,
});

const goal = new THREE.Group();
scene.add(goal);

const innerFencePart1 = new THREE.Mesh(
  innerFenceAndGoalGeometry,
  innerFencePartMaterial
);
const innerFencePart2 = new THREE.Mesh(
  innerFenceAndGoalGeometry,
  innerFencePartMaterial
);
const innerGoalPart1 = new THREE.Mesh(
  innerFenceAndGoalGeometry,
  innerGoalMaterial
);
const innerGoalPart2 = new THREE.Mesh(
  innerFenceAndGoalGeometry,
  innerGoalMaterial
);

innerFencePart1.position.set(-3.5, 2, 0);
innerFencePart2.position.set(3.5, 2, 0);
innerGoalPart1.position.set(-1.25, 2, 0);
innerGoalPart2.position.set(1.25, 2, 0);

goal.add(innerFencePart1, innerFencePart2, innerGoalPart1, innerGoalPart2);

// Cannon.js body
const innerFencePartShape = new CANNON.Box(new CANNON.Vec3(1, 2, 0.1));
const innerGoalPartShape = new CANNON.Box(new CANNON.Vec3(1, 2, 0.1));

const innerFencePartBody1 = new CANNON.Body({
  mass: 0,
  position: new CANNON.Vec3(-3.5, 2, 0),
  shape: innerFencePartShape,
  material: defaultMaterial,
});

const innerFencePartBody2 = new CANNON.Body({
  mass: 0,
  position: new CANNON.Vec3(3.5, 2, 0),
  shape: innerFencePartShape,
  material: defaultMaterial,
});

const innerGoalPartBody1 = new CANNON.Body({
  mass: 1,
  position: new CANNON.Vec3(-1.25, 2, 0),
  shape: innerGoalPartShape,
  material: defaultMaterial,
});

const innerGoalPartBody2 = new CANNON.Body({
  mass: 1,
  position: new CANNON.Vec3(1.25, 2, 0),
  shape: innerGoalPartShape,
  material: defaultMaterial,
});

world.addBody(innerFencePartBody1);
world.addBody(innerFencePartBody2);
world.addBody(innerGoalPartBody1);
world.addBody(innerGoalPartBody2);

objectsToUpdate.push({ mesh: innerGoalPart1, body: innerGoalPartBody1 });
objectsToUpdate.push({ mesh: innerGoalPart2, body: innerGoalPartBody2 });

const localPivot1A = new CANNON.Vec3(1.05, -4, 0);
const localPivot1B = new CANNON.Vec3(-1.05, -4, 0);
const localPivot1AA = new CANNON.Vec3(1.05, 4, 0);
const localPivot1BB = new CANNON.Vec3(-1.05, 4, 0);

const localPivot2A = new CANNON.Vec3(-1.05, 4, 0);
const localPivot2B = new CANNON.Vec3(1.05, 4, 0);
const localPivot2AA = new CANNON.Vec3(-1.05, -4, 0);
const localPivot2BB = new CANNON.Vec3(1.05, -4, 0);

const constraint1 = new CANNON.PointToPointConstraint(
  innerFencePartBody1,
  localPivot1A,
  innerGoalPartBody1,
  localPivot1B
);

const constraint2 = new CANNON.PointToPointConstraint(
  innerFencePartBody1,
  localPivot1AA,
  innerGoalPartBody1,
  localPivot1BB
);

const constraint3 = new CANNON.PointToPointConstraint(
  innerFencePartBody2,
  localPivot2A,
  innerGoalPartBody2,
  localPivot2B
);

const constraint4 = new CANNON.PointToPointConstraint(
  innerFencePartBody2,
  localPivot2AA,
  innerGoalPartBody2,
  localPivot2BB
);

world.addConstraint(constraint1);
world.addConstraint(constraint2);
world.addConstraint(constraint3);
world.addConstraint(constraint4);

// Trees

// Tree container

const treeTrunkGeometry = new THREE.CylinderBufferGeometry(0.2, 0.3, 10, 5);
const treeCroneGeometry = new THREE.SphereGeometry(2, 10, 10);
const treeTrunkMaterial = new THREE.MeshStandardMaterial({
  color: "#7d4a13",
});
const treeCroneMaterial = new THREE.MeshStandardMaterial({
  map: "#52300c",
  map: groundGrassTexture,
});

for (let i = 0; i < 80; i++) {
  const tree = new THREE.Group();
  scene.add(tree);

  const x = 0,
    y = 5,
    z = 0;

  const treeTrunk = new THREE.Mesh(treeTrunkGeometry, treeTrunkMaterial);
  const treeCrone = new THREE.Mesh(treeCroneGeometry, treeCroneMaterial);
  // const { x, y, z } = treePos[i];
  treeCrone.position.setY(14);
  treeCrone.scale.setY(5);

  // if (i === 0 || i === 2) tree.rotation.y = -Math.PI * 0.5;
  tree.add(treeTrunk);
  tree.add(treeCrone);
  if (1 === 1) {
    if (i < 5) {
      tree.position.set(55, y, -40 + i * 20);
    } else if (i >= 5 && i < 10) {
      tree.position.set(-55, y, -40 + (i - 5) * 20);
    } else if (i >= 10 && i < 15) {
      tree.position.set(-40 + (i - 10) * 20, y, 55);
    } else if (i >= 15 && i < 20) {
      tree.position.set(-40 + (i - 15) * 20, y, -55);
    } else if (i >= 20 && i < 25) {
      tree.position.set(65, y, -50 + (i - 20) * 20);
    } else if (i >= 25 && i < 30) {
      tree.position.set(-65, y, -50 + (i - 25) * 20);
    } else if (i >= 30 && i < 35) {
      tree.position.set(-50 + (i - 30) * 20, y, 65);
    } else if (i >= 35 && i < 40) {
      tree.position.set(-50 + (i - 35) * 20, y, -65);
    } else if (i >= 40 && i < 45) {
      tree.position.set(75, y, -40 + (i - 40) * 20);
    } else if (i >= 45 && i < 50) {
      tree.position.set(-75, y, -40 + (i - 45) * 20);
    } else if (i >= 50 && i < 55) {
      tree.position.set(-40 + (i - 50) * 20, y, 75);
    } else if (i >= 55 && i < 60) {
      tree.position.set(-40 + (i - 55) * 20, y, -75);
    } else if (i >= 60 && i < 65) {
      tree.position.set(85, y, -50 + (i - 60) * 20);
    } else if (i >= 65 && i < 70) {
      tree.position.set(-85, y, -50 + (i - 65) * 20);
    } else if (i >= 70 && i < 75) {
      tree.position.set(-50 + (i - 70) * 20, y, 85);
    } else if (i >= 75 && i < 80) {
      tree.position.set(-50 + (i - 75) * 20, y, -85);
    }
  }

  // Cannon.js body
  const treeTrunkShape = new CANNON.Cylinder(0.2, 0.3, 10, 5);
  const treeTrunkBody = new CANNON.Body({
    mass: 0,
    position: new CANNON.Vec3(x, y, z),
    shape: treeTrunkShape,
    material: defaultMaterial,
  });

  if (1 === 1) {
    if (i < 5) {
      treeTrunkBody.position.set(55, y, -40 + i * 20);
    } else if (i >= 5 && i < 10) {
      treeTrunkBody.position.set(-55, y, -40 + (i - 5) * 20);
    } else if (i >= 10 && i < 15) {
      treeTrunkBody.position.set(-40 + (i - 10) * 20, y, 55);
    } else if (i >= 15 && i < 20) {
      treeTrunkBody.position.set(-40 + (i - 15) * 20, y, -55);
    } else if (i >= 20 && i < 25) {
      treeTrunkBody.position.set(65, y, -50 + (i - 20) * 20);
    } else if (i >= 25 && i < 30) {
      treeTrunkBody.position.set(-65, y, -50 + (i - 25) * 20);
    } else if (i >= 30 && i < 35) {
      treeTrunkBody.position.set(-50 + (i - 30) * 20, y, 65);
    } else if (i >= 35 && i < 40) {
      treeTrunkBody.position.set(-50 + (i - 35) * 20, y, -65);
    } else if (i >= 40 && i < 45) {
      treeTrunkBody.position.set(75, y, -40 + (i - 40) * 20);
    } else if (i >= 45 && i < 50) {
      treeTrunkBody.position.set(-75, y, -40 + (i - 45) * 20);
    } else if (i >= 50 && i < 55) {
      treeTrunkBody.position.set(-40 + (i - 50) * 20, y, 75);
    } else if (i >= 55 && i < 60) {
      treeTrunkBody.position.set(-40 + (i - 55) * 20, y, -75);
    } else if (i >= 60 && i < 65) {
      treeTrunkBody.position.set(85, y, -50 + (i - 60) * 20);
    } else if (i >= 65 && i < 70) {
      treeTrunkBody.position.set(-85, y, -50 + (i - 65) * 20);
    } else if (i >= 70 && i < 75) {
      treeTrunkBody.position.set(-50 + (i - 70) * 20, y, 85);
    } else if (i >= 75 && i < 80) {
      treeTrunkBody.position.set(-50 + (i - 75) * 20, y, -85);
    }
  }

  soundArray.push(treeTrunkBody);

  world.addBody(treeTrunkBody);
}

// Windmill

// Windmill container
const windMillTrunkGeometry = new THREE.CylinderBufferGeometry(0.5, 1, 20, 5);
const windMillHeadGeometry = new THREE.CylinderBufferGeometry(1, 1.5, 3, 20);
const windMillRotorGeometry = new THREE.ConeBufferGeometry(1.5, 2, 20);
const windMillBladeGeometry = new THREE.BoxBufferGeometry(1, 0.1, 12);

const windMillTrunkMaterial = new THREE.MeshStandardMaterial({
  color: "grey",
});
const windMillHeadMaterial = new THREE.MeshStandardMaterial({
  color: "pink",
});
const windMillRotorMaterial = new THREE.MeshStandardMaterial({
  color: "orange",
});
const windMillBladeMaterial = new THREE.MeshStandardMaterial({
  color: "#88b4b5",
});

const windMill = new THREE.Group();
const windRotor = new THREE.Group();
windMill.add(windRotor);
scene.add(windMill);

const windMillTrunk = new THREE.Mesh(
  windMillTrunkGeometry,
  windMillTrunkMaterial
);

const windMillHead = new THREE.Mesh(windMillHeadGeometry, windMillHeadMaterial);
const windMillRotor = new THREE.Mesh(
  windMillRotorGeometry,
  windMillRotorMaterial
);

for (let i = 0; i < 3; i++) {
  const windMillBlade = new THREE.Mesh(
    windMillBladeGeometry,
    windMillBladeMaterial
  );
  windMillBlade.position.setY(-0.5);
  windMillBlade.rotateOnAxis(
    new THREE.Vector3(0, 1, 0),
    (Math.PI / 3) * (i + 1)
  );
  windRotor.add(windMillBlade);
}

// windMillRotor.rotation.y = Math.PI
windRotor.add(windMillRotor);
windMillHead.position.setY(10);
windMillHead.rotation.x = Math.PI * 0.5;

// windRotor.position.setX(10);
windRotor.position.setY(10);
windRotor.position.setZ(-2.5);
windRotor.rotation.x = -Math.PI * 0.5;

windMill.add(windMillTrunk);
windMill.add(windMillHead);
windMill.position.set(45, 10, 45);
windMill.rotateOnAxis(new THREE.Vector3(0, 1, 0), Math.PI * 0.25);

// Cannon.js body
const windMillTrunkShape = new CANNON.Cylinder(0.5, 1, 20, 5);
const windMillTrunkBody = new CANNON.Body({
  mass: 0,
  position: new CANNON.Vec3(45, 10, 45),
  shape: windMillTrunkShape,
  material: defaultMaterial,
});

soundArray.push(windMillTrunkBody);

world.addBody(windMillTrunkBody);

// Create sphere
const axesHelper = new THREE.AxesHelper(5);
axesHelper.setColors("red", "blue", "green");

const sphereGeometry = new THREE.SphereGeometry(1, 20, 20);
const sphereMaterial = new THREE.MeshStandardMaterial({
  metalness: 0.3,
  roughness: 0.4,
  color: "red",
});

// Three.js mesh
const sphereMesh = new THREE.Mesh(sphereGeometry, sphereMaterial);
sphereMesh.castShadow = true;
sphereMesh.position.set(0, 3, 5);
sphereMesh.add(axesHelper);
scene.add(sphereMesh);

// Cannon.js body
const sphereShape = new CANNON.Sphere(1);

const sphereBody = new CANNON.Body({
  mass: 20,
  position: new CANNON.Vec3(0, 3, 5),
  shape: sphereShape,
  material: defaultMaterial,
});

soundArray.push(sphereBody);

world.addBody(sphereBody);

// Save in objects
objectsToUpdate.push({ mesh: sphereMesh, body: sphereBody });

// Create boxes

const boxGeometry = new THREE.BoxBufferGeometry(2, 2, 2);
const boxMaterial = new THREE.MeshStandardMaterial({
  color: "#7cc2c1",
  metalness: 0.5,
  roughness: 0.5,
});

const boxShape = new CANNON.Box(new CANNON.Vec3(1, 1, 1));

for (let i = 0; i < 15; i++) {
  const box = new THREE.Mesh(boxGeometry, boxMaterial);
  box.position.set(-30 + 5 * i, 0.5, -25);
  scene.add(box);

  const boxBody = new CANNON.Body({
    mass: i + 1,
    position: new CANNON.Vec3(-30 + 5 * i, 0.5, -25),
    shape: boxShape,
    material: defaultMaterial,
  });

  soundArray.push(boxBody);
  world.addBody(boxBody);
  objectsToUpdate.push({ mesh: box, body: boxBody });
}

// Create balls

const ballGeometry = new THREE.SphereGeometry(1, 20, 20);
const ballMaterial = new THREE.MeshStandardMaterial({
  color: "pink",
  metalness: 0.5,
  roughness: 0.5,
});

const ballShape = new CANNON.Sphere(1);

for (let i = 0; i < 15; i++) {
  const ball = new THREE.Mesh(ballGeometry, ballMaterial);
  ball.position.set(-30 + 5 * i, 0.5, 25);
  scene.add(ball);

  const ballBody = new CANNON.Body({
    mass: i + 1,
    position: new CANNON.Vec3(-30 + 5 * i, 0.5, 25),
    shape: ballShape,
    material: defaultMaterial,
  });

  soundArray.push(ballBody);
  world.addBody(ballBody);
  objectsToUpdate.push({ mesh: ball, body: ballBody });
}

//-------------------------------------Floor-------------------------------------^

const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(200, 200),
  new THREE.MeshStandardMaterial({
    color: "#777777",
    color: "green",
    map: groundGrassTexture,
  })
);
floor.receiveShadow = true;
floor.rotation.x = -Math.PI * 0.5;
scene.add(floor);

//-------------------------------------Lights-------------------------------------^

const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.2);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.set(1024, 1024);
directionalLight.shadow.camera.far = 15;
directionalLight.shadow.camera.left = -7;
directionalLight.shadow.camera.top = 7;
directionalLight.shadow.camera.right = 7;
directionalLight.shadow.camera.bottom = -7;
directionalLight.position.set(5, 5, 5);
scene.add(directionalLight);

//-------------------------------------Sizes-------------------------------------^

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

//-------------------------------------Camera-------------------------------------^

// Base camera
const camera = new THREE.PerspectiveCamera(
  75,
  sizes.width / sizes.height,
  0.1,
  200
);
camera.position.set(-3, 3, 3);

// camera.lookAt()
scene.add(camera);

//-------------------------------------Sphere Control-------------------------------------^

let rotation = 0;
let controls;
initPointerLock();

function initPointerLock() {
  controls = new PointerLockControlsCannon(camera, sphereBody);
  scene.add(controls.getObject());

  // instructions.addEventListener('click', () => {
  //   controls.lock()
  // })

  // controls.addEventListener('lock', () => {
  //   controls.enabled = true
  //   instructions.style.display = 'none'
  // })

  // controls.addEventListener('unlock', () => {
  //   controls.enabled = false
  //   instructions.style.display = null
  // })
}

let Up,
  Left,
  Down,
  Right,
  Jump,
  Shift,
  isGrounded = false;
var acceleration = 0;
var pitchSpeed = 0;
var rollSpeed = 0;
var yawSpeed = 0;

function moveObj() {
  if (Jump) {
    if (isGrounded) {
      sphereBody.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), 0);

      sphereBody.applyLocalImpulse(
        new CANNON.Vec3(0, 150, 0),
        new CANNON.Vec3(0, 0, 0)
      );

      // correcting rotation
      rotation += Math.PI / 90;
      sphereBody.quaternion.setFromAxisAngle(
        new CANNON.Vec3(0, 1, 0),
        rotation
      );
    }
  }

  if (Up || Down || Left || Right || Shift) {
    if (Up) {
      pitchSpeed = -10 * acceleration;
    } else if (Down) {
      pitchSpeed = 10 * acceleration;
    } else {
      pitchSpeed = 0;
    }
    if (Left) {
      rotation += Math.PI / 90;
      sphereBody.quaternion.setFromAxisAngle(
        new CANNON.Vec3(0, 1, 0),
        rotation
      );
    } else if (Right) {
      rotation -= Math.PI / 90;
      sphereBody.quaternion.setFromAxisAngle(
        new CANNON.Vec3(0, 1, 0),
        rotation
      );
    }
    if (Shift) {
      acceleration = 2;
    } else {
      acceleration = 1;
    }

    var directionVector = new CANNON.Vec3(pitchSpeed, yawSpeed, rollSpeed);
    var directionVector = sphereBody.quaternion.vmult(directionVector);

    sphereBody.angularVelocity.set(
      directionVector.x,
      directionVector.y,
      directionVector.z
    );
  }

  sphereBody.linearDamping = 0.5;
  sphereBody.angularDamping = 0.9;
}

//-------------------------------------Sounds-------------------------------------^

soundArray.forEach((element) => {
  element.addEventListener("collide", playHitSound);
});

//-------------------------------------Renderer-------------------------------------^

const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
});
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setClearColor("#c5e8eb");

//-------------------------------------Animate-------------------------------------^

const clock = new THREE.Clock();
const rotorVector = new THREE.Vector3(0, 1, 0);
let oldElapsedTime = 0;

const tick = () => {
  const elapsedTime = clock.getElapsedTime();
  const deltaTime = elapsedTime - oldElapsedTime;
  oldElapsedTime = elapsedTime;
  //   updatePhysics();
  moveObj();

  // Rotor rotation
  windRotor.rotateOnAxis(rotorVector, Math.PI * deltaTime);

  // Update physics
  world.step(1 / 60, deltaTime, 3);

  for (const object of objectsToUpdate) {
    object.mesh.position.copy(object.body.position);
    object.mesh.quaternion.copy(object.body.quaternion);
  }

  // Update controls
  controls.update(deltaTime);

  // Render
  renderer.render(scene, camera);

  // Call tick again on the next frame
  window.requestAnimationFrame(tick);
};

tick();
