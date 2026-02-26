// ==========================
// FISHING SYSTEM
// ==========================

let isFishing = false;
let hookInWater = false;
let fishBiting = false;
let fishTarget = new THREE.Vector3();
let castAnim = 0;
let casting = false;
let castingPose = false;
let tensionUIUpdate = 0;
let biteWindow = false;
let biteTimer = 0;
let biteLimit = 3; 
let freezePlayer = false; 
let freezeInput = false;
let castAnimation = 0;
let castingNow = false;
let castReleased = false;
let gameStarted = false;
let fishingTimer = 0;
let biteTime = 0;
let interactionReady = false;
let pulling = false;

const biteIcon = document.getElementById("biteIcon");
const coinUI = document.getElementById("coinUI");
const fishNotify = document.getElementById("fishNotify");
const sellBtn = document.getElementById("sellBtn");
const fishBtn = document.getElementById("fishBtn");
const openMenuBtn = document.getElementById("openMenuBtn");
const menuUI = document.getElementById("menuUI");
const openRodShopBtn =
document.getElementById("openRodShopBtn");
const rodShopUI =
document.getElementById("rodShopUI");
const resumeBtn = document.getElementById("resumeBtn");
const settingsBtn = document.getElementById("settingsBtn");
const saveBtn = document.getElementById("saveBtn");
const quitBtn = document.getElementById("quitBtn");
const rods = {
  LuckRod: {
    price: 150
  },
  MediumRod: {
    price: 500
  }
};
const castSound = new Audio("sounds/cast.mp3");
const biteSound = new Audio("sounds/bite.mp3");
const catchSound = new Audio("sounds/catch.mp3");
const bgMusic = new Audio("sounds/background_music.mp3");

bgMusic.loop = true;
bgMusic.volume = 1;
bgMusic.play();

const eventMusic = {
  Windy: new Audio("sounds/bg_music.mp3"),
  Storming: new Audio("sounds/bg_music.mp3"),
  Cloudy: new Audio("sounds/bg_music.mp3")
};

function playEventMusic(eventName){
  stopEventMusic();
  if(eventMusic[eventName]){
    eventMusic[eventName].loop = true;
    eventMusic[eventName].volume = 0.5;
    eventMusic[eventName].play();
  }
}

function stopEventMusic(){
  for(let key in eventMusic){
    eventMusic[key].pause();
    eventMusic[key].currentTime = 0;
  }
}

// ===== SCENE =====
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);

const camera = new THREE.PerspectiveCamera(
75, innerWidth/innerHeight, 0.1, 1000
);

const renderer = new THREE.WebGLRenderer({antialias:true});
renderer.setSize(innerWidth,innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

// =================
// FULLSCREEN SYSTEM
// =================
function enterFullscreen(){

 const el = document.documentElement;

 if(el.requestFullscreen){
   el.requestFullscreen();
 }
}

async function forceLandscape(){

 if(screen.orientation && screen.orientation.lock){
   try{
     await screen.orientation.lock("landscape");
   }catch(e){
     console.log("Landscape lock gagal:", e);
   }
 }

}

// =================
// CAMERA CONTROL
// =================
let camYaw = 0;
let camPitch = 0.3;
let isDragging = false;
let lastX = 0;
let lastY = 0;

// =================
// FREE CAMERA 360°
// =================

let camTouchId = null;

renderer.domElement.addEventListener("touchstart",(e)=>{

 const touch = e.changedTouches[0];

 // hanya kanan layar untuk kamera
 if(touch.clientX > window.innerWidth/2){
   camTouchId = touch.identifier;
   lastX = touch.clientX;
   lastY = touch.clientY;
 }

});

renderer.domElement.addEventListener("touchmove",(e)=>{

 const touch=[...e.touches].find(t=>t.identifier===camTouchId);
 if(!touch) return;

 const dx = touch.clientX - lastX;
 const dy = touch.clientY - lastY;

 // SUPER SMOOTH ROTATION
 camYaw -= dx * 0.007;
 camPitch -= dy * 0.007;

 camPitch = THREE.MathUtils.clamp(camPitch,0.15,1.3);

 lastX = touch.clientX;
 lastY = touch.clientY;

});

renderer.domElement.addEventListener("touchend",(e)=>{

 const ended=[...e.changedTouches]
   .find(t=>t.identifier===camTouchId);

 if(ended) camTouchId=null;

});

// ===== LIGHT =====
const sun = new THREE.DirectionalLight(0xffffff,1);
sun.position.set(5,10,5);
sun.castShadow=true;
scene.add(sun);

scene.add(new THREE.AmbientLight(0xffffff,0.6));

const loader=new THREE.TextureLoader();

// ===== ISLAND =====
const sandTex=loader.load("images/sand.jpg");

const island = new THREE.Mesh(
 new THREE.CylinderGeometry(50,54,4,64),
 new THREE.MeshStandardMaterial({map:sandTex})
);

island.position.y = -2;
island.receiveShadow = true;
scene.add(island);

const grassTex=loader.load("images/grass.jpg");

const grass = new THREE.Mesh(
 new THREE.CylinderGeometry(45,47,0.5,32),
 new THREE.MeshStandardMaterial({map:grassTex})
);

grass.position.y = 0.3;
scene.add(grass);

// ===== WATER =====
const waterTex=loader.load("images/water.jpg");
waterTex.wrapS=waterTex.wrapT=THREE.RepeatWrapping;
waterTex.repeat.set(10,10);

const water = new THREE.Mesh(
 new THREE.PlaneGeometry(400,400,200,200),
 new THREE.MeshStandardMaterial({
   map:waterTex,
   transparent:true,
   opacity:0.9,
   roughness:0.2,
   metalness:0.3
 })
);

water.rotation.x=-Math.PI/2;
water.position.y=-1;
water.receiveShadow=true;
scene.add(water);

// ===== FISH SHOP =====
const shop = new THREE.Group();
scene.add(shop);

shop.position.set(0,0,-15);
shop.scale.set(1.4,1.4,1.4);

// ======================
// FLOOR (PLATFORM)
// ======================
const floorTex=loader.load("images/floor.jpg");
const floor = new THREE.Mesh(
 new THREE.BoxGeometry(10,0.6,6),
 new THREE.MeshStandardMaterial({map:floorTex})
);
floor.position.y = 0.3;
shop.add(floor);


// ======================
// BACK WALL
// ======================
const wallTex=loader.load("images/wall.jpg");
const wallMat = new THREE.MeshStandardMaterial({
 map:wallTex
});

const backWall = new THREE.Mesh(
 new THREE.BoxGeometry(10,7,0.4),
 wallMat
);
backWall.position.set(0,1.5,-3);
shop.add(backWall);


// ======================
// SMALL SIDE WALLS
// ======================
const sideWallL = new THREE.Mesh(
 new THREE.BoxGeometry(0.4,7,6),
 wallMat
);
sideWallL.position.set(-4.8,1.5,0);
shop.add(sideWallL);

const sideWallR = sideWallL.clone();
sideWallR.position.x = 4.8;
shop.add(sideWallR);


// ======================
// BIG ROOF (FISH IT STYLE)
// ======================
const roofTex=loader.load("images/roof.jpg");
const roof = new THREE.Mesh(
 new THREE.BoxGeometry(12,0.2,8),
 new THREE.MeshStandardMaterial({map:roofTex})
);

roof.position.y = 5;
shop.add(roof);


// ======================
// ROOF TOP (SEGITIGA)
// ======================
const roofTop = new THREE.Mesh(
 new THREE.ConeGeometry(5.5,2,4),
 new THREE.MeshStandardMaterial({map:roofTex})
);

roofTop.rotation.y = Math.PI/4;
roofTop.position.y = 6;
shop.add(roofTop);


// ======================
// SELL COUNTER
// ======================
const tableTex=loader.load("images/table.jpg");
const counter = new THREE.Mesh(
 new THREE.BoxGeometry(9.2,1.5,1),
 new THREE.MeshStandardMaterial({map:tableTex})
);

counter.position.set(0,0.75,2.5);
shop.add(counter);

// ======================
// SIGN TEXTURE (SELL FISH)
// ======================

const signCanvas = document.createElement("canvas");
signCanvas.width = 512;
signCanvas.height = 256;

const signCtx = signCanvas.getContext("2d");

// background papan
signCtx.fillStyle = "#8d6e63";
signCtx.fillRect(0,0,512,256);

// border
signCtx.strokeStyle = "#5d4037";
signCtx.lineWidth = 12;
signCtx.strokeRect(0,0,512,256);

// text
signCtx.fillStyle = "white";
signCtx.font = "bold 80px Arial";
signCtx.textAlign = "center";
signCtx.textBaseline = "middle";
signCtx.fillText("SELL FISH",256,128);

const signTexture = new THREE.CanvasTexture(signCanvas);

const sign = new THREE.Mesh(
 new THREE.BoxGeometry(4,1,0.3),
 new THREE.MeshStandardMaterial({
   map: signTexture
 })
);

sign.position.set(0,5.9,2.9);
shop.add(sign);

// ===== ROD SHOP =====
const rodShop = shop.clone();
scene.add(rodShop);

rodShop.position.set(20, 0, -15);

// ambil meja rod shop
const rodShopTable = rodShop.children.find(obj =>
  obj.geometry && obj.geometry.type === "BoxGeometry"
);

// ======================
// NPC SELLER
// ======================

const npc = new THREE.Group();
shop.add(npc);

// ===== ROOT =====
const npcRoot = new THREE.Object3D();
npc.add(npcRoot);

// TORSO
const npcTorso = new THREE.Mesh(
 new THREE.BoxGeometry(2,2,1),
 new THREE.MeshStandardMaterial({color:0x3498db})
);
npcTorso.position.y = 3;
npcRoot.add(npcTorso);

// HEAD
const npcHead = new THREE.Mesh(
 new THREE.SphereGeometry(0.75,32,32),
 new THREE.MeshStandardMaterial({color:0xffd6b3})
);
npcHead.position.y = 1.9;
npcTorso.add(npcHead);

// FACE SIMPLE
const npcFaceCanvas = document.createElement("canvas");
npcFaceCanvas.width = 256;
npcFaceCanvas.height = 256;

const npcCtx = npcFaceCanvas.getContext("2d");

npcCtx.fillStyle="#000";
npcCtx.beginPath();
npcCtx.arc(80,110,12,0,Math.PI*2);
npcCtx.arc(176,110,12,0,Math.PI*2);
npcCtx.fill();

npcCtx.beginPath();
npcCtx.arc(128,160,40,0,Math.PI);
npcCtx.lineWidth=6;
npcCtx.stroke();

const npcFaceTex = new THREE.CanvasTexture(npcFaceCanvas);

const npcFace = new THREE.Mesh(
 new THREE.PlaneGeometry(0.9,0.9),
 new THREE.MeshBasicMaterial({
   map:npcFaceTex,
   transparent:true
 })
);

npcFace.position.z = 0.73;
npcHead.add(npcFace);

// ARMS
const npcArmL = new THREE.Mesh(
 new THREE.BoxGeometry(1,2,1),
 new THREE.MeshStandardMaterial({color:0xffd6b3})
);
npcArmL.position.set(-1.5,0,0);
npcTorso.add(npcArmL);

const npcArmR = npcArmL.clone();
npcArmR.position.x = 1.5;
npcTorso.add(npcArmR);

// LEGS
const npcLegL = new THREE.Mesh(
 new THREE.BoxGeometry(1,2,1),
 new THREE.MeshStandardMaterial({color:0x2c3e50})
);
npcLegL.position.set(-0.5,-2,0);
npcTorso.add(npcLegL);

const npcLegR = npcLegL.clone();
npcLegR.position.x = 0.5;
npcTorso.add(npcLegR);

// POSISI DI BELAKANG COUNTER
npc.position.set(0,0,1.5);
npc.scale.set(0.6,0.6,0.6);

const npcPosition = new THREE.Vector3();

const rodNpc = npc.clone();
scene.add(rodNpc);

rodNpc.position.set(20, 0, -13);
npcPosition.copy(rodNpc.position);
rodNpc.name = "rodSeller";
rodNpc.userData.type = "rodNPC";

// ==========================
// ROBLOX R6 CHARACTER
// ==========================

const player = new THREE.Group();
scene.add(player);

// ROOT (seperti HumanoidRootPart)
const root = new THREE.Object3D();
player.add(root);

// ===== TORSO =====
const torso = new THREE.Mesh(
  new THREE.BoxGeometry(2,2,1),
  new THREE.MeshStandardMaterial({color:0x2ecc71})
);
torso.position.y = 3;
torso.castShadow = true;
root.add(torso);

const backHolder = new THREE.Object3D();
backHolder.position.set(0,0.5,-0.7);
torso.add(backHolder);

// ==========================
// SKIN & CUSTOMISASI
// ==========================
const playerSkins = {
  shirt: "green",
  hat: null,
  rodColor: 0x8b5a2b
};

function setShirt(color){
  torso.material.color.set(color);
  playerSkins.shirt = color;
}

function setHat(color){
  const hat = new THREE.Mesh(
    new THREE.CylinderGeometry(0.8,0.9,0.3,32),
    new THREE.MeshStandardMaterial({color})
  );
  head.add(hat);
  playerSkins.hat = color;
}

function setRodColor(color){
  rod.material.color.set(color);
  playerSkins.rodColor = color;
}

// ===== ROBLOX SMOOTH HEAD =====
const head = new THREE.Mesh(
  new THREE.SphereGeometry(0.75,32,32),
  new THREE.MeshStandardMaterial({
    color:0xffd6b3,
    roughness:0.6
  })
);

head.scale.y = 1.05; // sedikit oval seperti roblox
head.position.y = 1.9;
head.castShadow = true;

torso.add(head);

// ===== FACE (DEPAN SAJA) =====
const faceCanvas = document.createElement("canvas");
faceCanvas.width = 256;
faceCanvas.height = 256;

const ctx = faceCanvas.getContext("2d");

ctx.fillStyle="rgba(0,0,0,0)";
ctx.fillRect(0,0,256,256);

ctx.fillStyle="#000";
ctx.beginPath();
ctx.arc(80,110,12,0,Math.PI*2);
ctx.arc(176,110,12,0,Math.PI*2);
ctx.fill();

ctx.beginPath();
ctx.arc(128,160,40,0,Math.PI);
ctx.lineWidth=6;
ctx.stroke();

const faceTexture = new THREE.CanvasTexture(faceCanvas);

const face = new THREE.Mesh(
 new THREE.PlaneGeometry(0.9,0.9),
 new THREE.MeshBasicMaterial({
   map:faceTexture,
   transparent:true
 })
);

face.position.z = 0.73;
face.position.y = 0;

head.add(face);

// ===== LEFT ARM =====
const armL = new THREE.Mesh(
  new THREE.BoxGeometry(1,2,1),
  new THREE.MeshStandardMaterial({color:0xffd6b3})
);
armL.position.set(-1.5,0,0);
torso.add(armL);

// ===== RIGHT ARM =====
const armR = new THREE.Mesh(
  new THREE.BoxGeometry(1,2,1),
  new THREE.MeshStandardMaterial({color:0xffd6b3})
);

armR.position.set(1.5,0,0);
armR.rotation.set(0,0,0);

torso.add(armR);
// ===== RIGHT HAND GRIP =====
const handGrip = new THREE.Object3D();
handGrip.position.set(0,-1,0.75);
armR.add(handGrip);
// pivot khusus rod (anti rusak animasi)
const rodPivot = new THREE.Object3D();
rodPivot.position.set(0,0,0);
handGrip.add(rodPivot);

// ===== LEFT LEG =====
const legL = new THREE.Mesh(
  new THREE.BoxGeometry(1,2,1),
  new THREE.MeshStandardMaterial({color:0x333333})
);
legL.position.set(-0.5,-2,0);
torso.add(legL);

// ===== RIGHT LEG =====
const legR = legL.clone();
legR.position.x = 0.5;
torso.add(legR);

// =================
// CAMERA FOLLOW (ROBLOX)
// =================
const cameraPivot = new THREE.Object3D();
cameraPivot.position.set(0,4,0);
scene.add(cameraPivot);

player.scale.set(0.8,0.8,0.8);
// SPAWN PLAYER DEKAT SHOP
player.position.set(0,0,-10);

// ===== FISHING ROD =====
const rod = new THREE.Mesh(
 new THREE.CylinderGeometry(0.03,0.05,2),
 new THREE.MeshStandardMaterial({color:0x8b5a2b})
);

// ===== ROD TIP (UJUNG PANCING)
const rodTip = new THREE.Object3D();
rodTip.position.set(0,1,0); // ujung cylinder
rod.add(rodTip);

rod.rotation.z = Math.PI/4;
rod.position.set(0,-0.5,0);
backHolder.add(rod);
rod.position.set(0,0,0);
rod.rotation.set(0,Math.PI,0.5);

// ===== HOOK =====
const hookGeo = new THREE.SphereGeometry(0.1,16,16);
const hookMat = new THREE.MeshStandardMaterial({color:0xffffff});
const hook = new THREE.Mesh(hookGeo,hookMat);

hook.visible=false;
scene.add(hook);

// tali pancing
const lineMaterial = new THREE.LineBasicMaterial({color:0xffffff});

const lineGeometry = new THREE.BufferGeometry().setFromPoints([
 new THREE.Vector3(),
 new THREE.Vector3()
]);

const fishingLine = new THREE.Line(lineGeometry,lineMaterial);
scene.add(fishingLine);

// ===== CAMERA =====
camera.position.set(0,5,7);

// ===== JOYSTICK =====
const joy=document.getElementById("joystick");
const stick=document.getElementById("stick");

let joyX=0, joyY=0;
let dragging=false;

let joyTouchId = null;

joy.addEventListener("touchstart",(e)=>{

 const touch = e.changedTouches[0];

 // hanya kiri layar
 if(touch.clientX < window.innerWidth/2){
   joyTouchId = touch.identifier;
   dragging = true;
 }

});

joy.addEventListener("touchmove",(e)=>{

 const touch=[...e.touches]
   .find(t=>t.identifier===joyTouchId);

 if(!touch || !dragging) return;

 const rect=joy.getBoundingClientRect();

 const x=touch.clientX-rect.left-60;
 const y=touch.clientY-rect.top-60;

 const dist=Math.min(40,Math.hypot(x,y));
 const angle=Math.atan2(y,x);

 joyX=Math.cos(angle)*(dist/40);
 joyY=Math.sin(angle)*(dist/40);

 stick.style.left=(35+joyX*30)+"px";
 stick.style.top=(35+joyY*30)+"px";
});

joy.addEventListener("touchend",(e)=>{

 const ended=[...e.changedTouches]
   .find(t=>t.identifier===joyTouchId);

 if(!ended) return;

 dragging=false;
 joyTouchId=null;

 joyX=0;
 joyY=0;

 stick.style.left="35px";
 stick.style.top="35px";
});

// ======================
// FISH DATABASE
// ======================

const fishTypes = [
 {name:"Ikan Kecil", rarity:"Common", price:10, color:"#b0c4de"},
 {name:"Ikan Tuna", rarity:"Uncommon", price:25, color:"#5dade2"},
 {name:"Ikan Salmon", rarity:"Rare", price:60, color:"#ff7f50"},
 {name:"Golden Fish", rarity:"Epic", price:120, color:"#f1c40f"},
 {name:"Mythic Koi", rarity:"Legendary", price:300, color:"#ff00ff"}
];

// ==========================
// PULAU & AREA BARU
// ==========================
const islands = [
  { name:"Pulau Utama", unlocked:true, fish:["Ikan Kecil","Ikan Tuna"] },
  { name:"Pulau Rahasia", unlocked:false, fish:["Golden Fish","Mythic Koi"] }
];

function unlockIsland(name){
  const isl = islands.find(i=>i.name===name);
  if(isl && !isl.unlocked){
    isl.unlocked = true;
    showEventNotification(`🏝️ ${name} berhasil dibuka!`);
  }
}

// ==========================
// EVENT SYSTEM
// ==========================
const events = ["Windy","Storming","Cloudy"];
let currentEvent = null;
let fishingSpeedMultiplier = 1;
let luckMultiplier = 1;

function activateEvent(name){
  currentEvent = name;
  switch(name){
    case "Windy":
      fishingSpeedMultiplier = 1.8;
      luckMultiplier = 1;
      showEventNotification("🌬️ Windy Event Starting!");
      break;
    case "Storming":
      fishingSpeedMultiplier = 1.7;
      luckMultiplier = 1.3;
      showEventNotification("⛈️ Storming Event Starting!");
      break;
    case "Cloudy":
      fishingSpeedMultiplier = 1;
      luckMultiplier = 1.4;
      showEventNotification("☁️ Cloudy Event Starting!");
      break;
    default:
      fishingSpeedMultiplier = 1;
      luckMultiplier = 1;
  }
}

// =================
// ROD DATABASE
// =================

const rodDatabase = {

  FishingRod: {
    name: "Wood Rod",
    price: 0,
    power: 1,
    luck: 1,
    speed: 1,
    color: 0x8b5a2b
  },

  LuckRod: {
    name: "Luck Rod",
    price: 150,
    power: 2,
    luck: 2,
    speed: 1,
    color: 0xaaaaaa
  },

  MediumRod: {
    name: "Medium Rod",
    price: 500,
    power: 5,
    luck: 3,
    speed: 2,
    color: 0xffd700
  }

};

// =================
// INVENTORY SYSTEM
// =================
const inventory = {
 equipped:"FishingRod",
 rods:["FishingRod"],
 fish:[]
};
let coins = 0;
unequipItem();

function playerOwnsRod(rodName){
  return inventory.rods.includes(rodName);
}

function stopFishingAll(){

 // ===== RESET STATE =====
 isFishing = false;
 casting = false;
 castingPose = false;
 castingNow = false;

 fishBiting = false;
 hookInWater = false;
 freezeInput = false;

 // ===== RESET TIMER =====
 fishingTimer = 0;
 biteTime = 0;

 // ===== STOP HOOK =====
 hook.visible = false;

 // HENTIKAN SEMUA GERAKAN HOOK
 hook.userData = {
   velocity: new THREE.Vector3(0,0,0)
 };

 // ===== HIDE UI =====
 biteIcon.style.display = "none";

 // ===== RESET ARM =====
 armR.rotation.set(-0.6,0,-0.2);
 armL.rotation.set(0,0,0);

 // ===== RESET ROD =====
 rodPivot.rotation.set(0,0,0);

 // ===== HIDE LINE =====
 fishingLine.visible = false;
}

function equipItem(name){
 
 if(!playerOwnsRod(name)) return;
 inventory.equipped = name;

 if(name === "FishingRod"){

   // pindahkan rod ke tangan
   if(rod.parent){
     rod.parent.remove(rod);
   }

   rodPivot.add(rod);

   // posisi rod di tangan
   rod.position.set(0,0,0);

   rod.rotation.set(
     Math.PI/2,
     0,
     0
   );

   armR.rotation.x = -0.6;
   armR.rotation.z = -0.2;

   castingNow = false;
   isFishing = false;
 }
}

function unequipItem(){

resetFishingState();
stopFishingAll()

 inventory.equipped = null;

 if (rod.parent) {
  rod.parent.remove(rod);
}
backHolder.add(rod);

 rod.position.set(0,0,0);
 rod.rotation.set(0,Math.PI,0.5);
 armR.rotation.set(0,0,0);
 armL.rotation.set(0,0,0);

 castingPose = false;
 castingNow = false;
  
  
}

function saveProgress(){
  const saveData = {
    coins,
    fishInventory: inventory.fish,
    shirtColor: playerSkins.shirt,
    rodColor: playerSkins.rodColor
  };
  localStorage.setItem("fishingSave", JSON.stringify(saveData));
}

function loadGameProgress(){
  const data = JSON.parse(localStorage.getItem("fishingSave"));
  if(data){
    coins = data.coins || 0;
    inventory.fish = data.fishInventory || [];
    coinUI.textContent = "💰 " + coins;

    if(data.shirtColor) setShirt(data.shirtColor);
    if(data.rodColor) setRodColor(data.rodColor);
  }
}

window.addEventListener("load", loadGameProgress);

const rodHotbar = document.getElementById("rodHotbar");

function updateRodHotbar(){

  rodHotbar.innerHTML = "";

  inventory.rods.forEach(rodName=>{

    const slot = document.createElement("div");
    slot.className = "rodSlot";

    const img = document.createElement("img");
    img.src = "images/" + rodName + ".png";

    slot.appendChild(img);

    slot.onclick = ()=>{
      equipItem(rodName);
      showMessage("Equipped " + rodDatabase[rodName].name);
    };

    rodHotbar.appendChild(slot);
  });
}

// ===== PLAYER MOVE =====
let walkAnim = 0;

function movePlayer(){
  const speed = 0.08;

// arah kamera
const forward = new THREE.Vector3();
camera.getWorldDirection(forward);
forward.y = 0;
forward.normalize();

// arah kanan kamera
const right = new THREE.Vector3();
right.crossVectors(forward, camera.up).normalize();

// gabung input joystick
const moveDir = new THREE.Vector3();
moveDir.addScaledVector(forward, -joyY);
moveDir.addScaledVector(right, joyX);

// =====================
// ROTATE PLAYER (ANTI SPIN)
// =====================
if(moveDir.lengthSq() > 0.0001){

  const targetAngle = Math.atan2(
    moveDir.x,
    moveDir.z
  );

  let current = player.rotation.y;

  // hitung beda sudut TERPENDEK
  let diff = targetAngle - current;

  diff = Math.atan2(Math.sin(diff), Math.cos(diff));

  // smooth rotate
  player.rotation.y += diff * 0.12;
}

  // gerakkan player
  if(!freezePlayer){
  player.position.addScaledVector(moveDir, speed);
}

// =====================
// WALK / IDLE ANIMATION
// =====================
const moving =
  moveDir.lengthSq() > 0.001 &&
  !freezeInput &&
  !isFishing;

if(moving){
  walkAnim += 0.18;
}

const swing = Math.sin(walkAnim);

if(moving){

  legL.rotation.x = swing * 0.8;
  legR.rotation.x = -swing * 0.8;

  armL.rotation.x = -swing * 0.5;
  if(!castingPose && !isFishing)
  armR.rotation.x = swing * 0.5;

  torso.position.y = 3 + Math.abs(swing)*0.08;

}else{

  // ===== SMOOTH RETURN TO IDLE =====
  legL.rotation.x = THREE.MathUtils.lerp(legL.rotation.x, 0, 0.15);
  legR.rotation.x = THREE.MathUtils.lerp(legR.rotation.x, 0, 0.15);

  armL.rotation.x = THREE.MathUtils.lerp(armL.rotation.x, 0, 0.15);

  if(!castingPose && !isFishing)
  armR.rotation.x = THREE.MathUtils.lerp(armR.rotation.x, 0, 0.15);

  torso.position.y = THREE.MathUtils.lerp(
    torso.position.y,
    3,
    0.15
  );

  // reset phase biar gak nyangkut
  walkAnim *= 0.9;
}

  cameraPivot.position.copy(player.position);
  cameraPivot.position.y += 4;
}

// =================
// ROBLOX CAMERA SYSTEM
// =================
const camTarget = new THREE.Vector3();

function updateCamera(){

 const target = player.position.clone();
 target.y += 3.3;

 const distance = 7;

 const offsetX = Math.sin(camYaw) * distance;
 const offsetZ = Math.cos(camYaw) * distance;

 const desired = new THREE.Vector3(
   target.x - offsetX,
   target.y + camPitch*4,
   target.z - offsetZ
 );

 // lebih responsif
 camera.position.lerp(desired,0.22);

 camera.lookAt(target);
}

// ===== WATER WAVE =====
function animateWater(time){

 const pos = water.geometry.attributes.position;

 for(let i=0; i<pos.count; i+=3){ // OPTIMASI
   pos.setZ(
     i,
     Math.sin(i*0.3 + time*0.0015) * 0.15
   );
 }

 pos.needsUpdate = true;
}

// ===== FISH MOVE =====
function moveFish(time){
  if(hookInWater){
    fishTarget.copy(hook.position);
    fish.position.lerp(fishTarget, 0.02);
  } else {
    fish.position.x = Math.sin(time*0.001)*8;
  }
  fish.lookAt(camera.position);
}

// ===== TAP LAYAR =====
window.addEventListener("pointerup",()=>{ pulling = false; });
window.addEventListener("keydown", (e) => {
  if (!gameStarted) return;

  if (e.key.toLowerCase() === "e") {

    const distance = player.position.distanceTo(rodNpc.position);

    if (distance < 1.8) {
      openRodShop();
    }
  }
});

function updateFishingLine(){

 if(!hook.visible){
   fishingLine.visible=false;
   return;
 }

 fishingLine.visible=true;

 const start = new THREE.Vector3();
 rodTip.getWorldPosition(start);

 const points = [
   start,
   hook.position.clone()
 ];

 fishingLine.geometry.setFromPoints(points);
}

window.addEventListener("pointerdown", () => {

  pulling = true;
  enterFullscreen();

  // 1. CATCH FISH
  if(fishBiting){
    catchFishSimple();
    return;
  }

  // 2. UI LOCK
  if(freezeInput) return;

  // 3. CAST DULU (INI YANG PENTING)
  if(
    rodDatabase[inventory.equipped] &&
    !rodShopUI.classList.contains("open") &&
    !isFishing
  ){
    startCastAnimation();
    return;
  }

});

function startCastAnimation(){

 if(castingNow || isFishing) return;

 castingNow = true;
 castAnimation = 0;
 castReleased = false;
}

window.addEventListener("load", () => {

  if(fishBtn){
    fishBtn.onclick = () => {
      castRod();
    };
  }

});

function startFishing(){
  castLineSimple();
}

// ======================
// CAST ANIMATION SYSTEM
// ======================
function updateCastAnimation(){

 if(!castingNow) return;

 castAnimation += 0.05;

 // ===== TARIK KE BELAKANG =====
 if(castAnimation < 0.4){

   castingPose = true;

   armR.rotation.x = -1.6;
   rodPivot.rotation.x = -0.6;

 }

 // ===== LEMPAR KE DEPAN =====
 else if(castAnimation < 0.7){

   armR.rotation.x += 0.25;
   rodPivot.rotation.x += 0.25;

 }

 // ===== RELEASE HOOK =====
 else if(castAnimation >= 0.7 && !castReleased){

   castReleased = true;
   castLineSimple();
}

 // ===== SELESAI =====
 if(castAnimation >= 1){

   castingNow = false;
   castingPose = false;

   armR.rotation.x = -0.6;
   rodPivot.rotation.x = 0;
 }

}

// ===== SIMPEL FISH BITE CLICK =====
function castLineSimple(){

 if(isFishing) return;
  hook.userData = { velocity: new THREE.Vector3() };

  isFishing = true;
  hookInWater = false;
  fishBiting = false;
  fishingTimer = 0;

  castSound.play();

  // posisi hook
  const startPos = new THREE.Vector3();
  rodTip.getWorldPosition(startPos);
  hook.position.copy(startPos);
  hook.visible = true;

  // arah lempar
  const forward = new THREE.Vector3(0,0,1).applyQuaternion(player.quaternion);
  forward.y += 0.35;
  hook.userData.velocity = forward.multiplyScalar(0.28);

  // random waktu ikan muncul (lure speed)
  biteTime = (Math.random()*4 + 2) / fishingSpeedMultiplier;
}

// update tiap frame
function updateFishingSimple(){

 if(!inventory.equipped) return;
 if(!hook.visible) return;

 // hook terbang
 if(!hookInWater){

   hook.position.add(hook.userData.velocity);
   hook.userData.velocity.y -= 0.012;

   if(hook.position.y <= -1){
     hook.position.y = -1;
     hookInWater = true;
     fishingTimer = 0;
   }
 }

 // tunggu ikan
 if(hookInWater && !fishBiting){

   fishingTimer += 0.016;

   if(fishingTimer >= biteTime){

     fishBiting = true;
     biteIcon.style.display = "block";
     biteSound.play();

     freezePlayer = true;
   }
 }

 // animasi strike
 if(fishBiting && !castingNow){

   armR.rotation.z =
     Math.sin(Date.now()*0.02)*0.2;

 }

}

function catchFishSimple(){

 // ===== DAPAT IKAN =====
const caughtFish = getRandomFish();

inventory.fish.push(caughtFish);

showFishNotification(caughtFish);

 catchSound.play();

 fishBiting = false;
 isFishing = false;
 hookInWater = false;
 stopFishingAll();
 freezeInput = false;
 freezePlayer = false;
 castingNow = false;
 castingPose = false;

 biteIcon.style.display = "none";

 armR.rotation.x = -0.6;
 armR.rotation.z = -0.2;

 setTimeout(()=>{

   hook.visible = false;

   armR.rotation.x = -0.6;
   armR.rotation.z = -0.2;

 },300);

 rodPivot.rotation.x = 0;
}

function updateBiteIconPosition() {
  if (!biteIcon) return;
  if (biteIcon.style.display === "none") return;

  const playerPos = player.position.clone();
  playerPos.y += 5; // posisi di atas kepala

  const vector = playerPos.project(camera);

  const x = (vector.x + 1) / 2 * window.innerWidth;
  const y = (-vector.y + 1) / 2 * window.innerHeight;

  biteIcon.style.left = `${x}px`;
  biteIcon.style.top = `${y}px`;
}

function resetFishingState(){

 isFishing = false;
 fishBiting = false;
 hookInWater = false;

 hook.visible = false;

 biteIcon.style.display = "none";

 freezeInput = false;
}

let nearSeller = false;

function sellFish(){

 if(inventory.fish.length === 0){

   sellPrompt.textContent = "Tidak ada ikan!";
   setTimeout(()=>{
     sellPrompt.textContent="Jual Ikan";
   },900);

   return;
 }

 let total = 0;

 inventory.fish.forEach(f=>{
   total += f.price;
 });

 coins += total;

 inventory.fish = []; // kosongkan tas

 coinUI.textContent = "💰 " + coins;

 sellPrompt.textContent = "Terjual +" + total;

 setTimeout(()=>{
   sellPrompt.textContent="Jual Ikan";
 },1200);
}

function getRandomFish(){

 const roll = Math.random();

 if(roll < 0.45) return fishTypes[0]; // common
 if(roll < 0.7) return fishTypes[1];
 if(roll < 0.88) return fishTypes[2];
 if(roll < 0.97) return fishTypes[3];

 return fishTypes[4]; // legendary
}

function showFishNotification(fish){

 fishNotify.style.display="block";
 fishNotify.style.color = fish.color;

 fishNotify.textContent =
  "🐟 " + fish.name + " (" + fish.rarity + ")";

 setTimeout(()=>{
   fishNotify.style.display="none";
 },2000);
}

function updateSellButtonPosition() {
  if(!sellBtn) return;

  // posisi meja (counter)
  const worldPos = new THREE.Vector3();
  counter.getWorldPosition(worldPos);

  const vector = worldPos.clone().project(camera)

  const x = (vector.x + 1) / 2 * window.innerWidth;
  const y = (-vector.y + 1) / 2 * window.innerHeight;

  sellBtn.style.left = `${x - sellBtn.offsetWidth/2}px`;
  sellBtn.style.top = `${y - sellBtn.offsetHeight - 20}px`; // sedikit di atas meja
}

function updateNPCInteraction(){
  const worldPos = new THREE.Vector3();
  counter.getWorldPosition(worldPos); // pastikan world position

  const distance = player.position.distanceTo(worldPos);

  if(distance < 3){ // radius interaksi
    nearSeller = true;
    sellBtn.style.display = "block";
  } else {
    nearSeller = false;
    sellBtn.style.display = "none";
  }
}

sellBtn.addEventListener("click", () => {
  if(!nearSeller) return;
  sellFish();
  
const dist = player.position.distanceTo(npc.position);

if(dist < 4){
    openRodShopBtn.style.display = "block";
    interactionReady = true;
}else{
    openRodShopBtn.style.display = "none";
    interactionReady = false;
}

openRodShopBtn.onclick = ()=>{
   if(!interactionReady) return;
   openRodShopUI();
};
  
});

// ==========================
// MULTIPLAYER RINGAN
// ==========================
let playersOnline = {};

function addPlayer(id, name, spawnPos){
  const mesh = player.clone(); // clone model player
  mesh.position.copy(spawnPos);
  scene.add(mesh);
  playersOnline[id] = { name, position: spawnPos.clone(), mesh, inventory: [] };
}

function updateMultiplayer(){
  for(let id in playersOnline){
    const p = playersOnline[id];
    p.mesh.position.lerp(p.position, 0.2); // smooth movement
  }
}

const customUI = document.getElementById("customUI");
const shirtInput = document.getElementById("shirtColor");
const saveCustom = document.getElementById("saveCustom");

function openCustomUI(){
  customUI.style.display = "block";
}

function closeCustomUI(){
  customUI.style.display = "none";
}

// ubah warna realtime
shirtInput.addEventListener("input",()=> setShirt(shirtInput.value));

// save ke localStorage
saveCustom.addEventListener("click",()=>{
  localStorage.setItem("playerShirt", shirtInput.value);
  alert("Saved!");
  closeCustomUI();
});

const loadingBar = document.getElementById("loadingBar");
const loadingText = document.getElementById("loadingText");
const loadingScreen = document.getElementById("loadingScreen");

let loadProgress = 0;

function simulateLoading(){
  if(loadProgress >= 100){
    loadingScreen.style.display = "none";
    return;
  }
  
  loadProgress += Math.random() * 5; // random increment
  if(loadProgress > 100) loadProgress = 100;
  
  loadingBar.style.width = loadProgress + "%";
  loadingText.textContent = "Loading... " + Math.floor(loadProgress) + "%";
  
  setTimeout(simulateLoading, 100);
}

simulateLoading();

// load saat start
window.addEventListener("load", ()=>{
  const savedShirt = localStorage.getItem("playerShirt");
  if(savedShirt) setShirt(savedShirt);
});

const menuBtn = document.getElementById("menuBtn");

let gamePaused = false;

function openMenu(){
  menuBtn.style.display = "flex";
  gamePaused = true;
}

function closeMenu(){
  menuBtn.style.display = "none";
  gamePaused = false;
}

function openCustomMenu(){
  const customUI = document.getElementById("customUI");
  if(customUI) customUI.style.display = "block";
}

function closeCustomMenu(){
  const customUI = document.getElementById("customUI");
  if(customUI) customUI.style.display = "none";
}

resumeBtn.addEventListener("click", closeMenu);
settingsBtn.addEventListener("click", openCustomMenu);
saveBtn.addEventListener("click", saveProgress);
quitBtn.addEventListener("click", () => location.reload());

window.addEventListener("keydown",(e)=>{
  if(e.key==="Escape") gamePaused ? closeMenu() : openMenu();
});

openMenuBtn.addEventListener("click", () => {
  menuUI.style.display = "flex";
});
resumeBtn.addEventListener("click", () => {
  menuUI.style.display = "none";
});

settingsBtn.addEventListener("click", () => {
  console.log("settings clicked");
});

saveBtn.addEventListener("click", () => {
  saveGame();
});

quitBtn.addEventListener("click", () => {
  location.reload();
});

function openRodShopUI(){

 freezeInput = true;
 rodShopUI.style.display = "block";

}

function closeRodShop(){

 freezeInput = false;
 rodShopUI.style.display = "none";

}

openRodShopBtn.addEventListener("click", ()=>{

  rodShopUI.style.display = "block";
  freezeInput = true;

});

function updateRodShopButtonPosition(){

  if(!rodShopTable) return;

  const pos = new THREE.Vector3();
  rodShopTable.getWorldPosition(pos);

  pos.y += 1.6;

  pos.project(camera);

  const x = (pos.x * 0.5 + 0.5) * window.innerWidth;
  const y = (-pos.y * 0.5 + 0.5) * window.innerHeight;

  openRodShopBtn.style.left = x + "px";
  openRodShopBtn.style.top = y + "px";
}

function updateCoinUI(){
  coinUI.textContent = "💰 " + coins;
}

function showMessage(text){

  const msg = document.createElement("div");
  msg.textContent = text;

  msg.style.position = "fixed";
  msg.style.top = "20%";
  msg.style.left = "50%";
  msg.style.transform = "translateX(-50%)";
  msg.style.background = "rgba(0,0,0,0.7)";
  msg.style.color = "white";
  msg.style.padding = "12px 20px";
  msg.style.borderRadius = "10px";
  msg.style.fontFamily = "Arial";
  msg.style.zIndex = "9999";

  document.body.appendChild(msg);

  setTimeout(()=> msg.remove(), 2000);
}

function buyRod(rodName){

  // CEK SUDAH PUNYA BELUM
  if(playerOwnsRod(rodName)){
    showMessage("You already own this rod");
    return;
  }

  const rodData = rodDatabase[rodName];

  if(coins < rodData.price){
    showMessage("Not enough coins");
    return;
  }

  coins -= rodData.price;
  inventory.rods.push(rodName);

  updateCoinUI();
  showMessage("Rod Purchased!");
  updateRodHotbar();
}

// ===== LOOP =====
function animate(time){
 requestAnimationFrame(animate);
 
 npc.getWorldPosition(npcPosition);
 updateNPCInteraction();
 updateSellButtonPosition();

 npc.lookAt(player.position.x,
 npc.position.y, player.position.z);
 npcRoot.rotation.y =
 Math.sin(time * 0.002) * 0.1;
 updateMultiplayer();
 movePlayer();
 updateCastAnimation();
 updateCamera();
 animateWater(time);
 updateFishingSimple();
 updateFishingLine();
 updateBiteIconPosition();
 scene.updateMatrixWorld(true);
 const distRodNPC = player.position.distanceTo(rodNpc.position);

if(distRodNPC < 6){

  openRodShopBtn.style.display = "block";
  updateRodShopButtonPosition();

}else{

  openRodShopBtn.style.display = "none";
}

 renderer.render(scene,camera);
}
animate();
forceLandscape();
setTimeout(()=>{
  gameStarted = true;
  interactionReady = true;
},1200);

window.addEventListener("keydown",(e)=>{

 if(e.key==="1") equipItem("FishingRod");
 if(e.key==="2") unequipItem();

});

const slot1 = document.getElementById("slot1");

slot1.addEventListener("click",()=>{

 if(inventory.equipped==="FishingRod"){
   unequipItem();
   slot1.classList.remove("active");
 }else{
   equipItem("FishingRod");
   slot1.classList.add("active");
 }
});

document.addEventListener("gesturestart", e=>e.preventDefault());

// ===== RESIZE =====
addEventListener("resize",()=>{
 camera.aspect=innerWidth/innerHeight;
 camera.updateProjectionMatrix();
 renderer.setSize(innerWidth,innerHeight);
});

// REGISTER PWA
if("serviceWorker" in navigator){
 navigator.serviceWorker.register("./sw.js")
  .then(()=>console.log("PWA Ready"));
}