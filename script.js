import * as THREE from 'https://unpkg.com/three@0.158.0/build/three.module.js';
import { PointerLockControls } from 'https://unpkg.com/three@0.158.0/examples/jsm/controls/PointerLockControls.js';

window.addEventListener('DOMContentLoaded',()=>{

// ===== Start Screen =====
const startScreen = document.getElementById("startScreen");
const playBtn = document.getElementById("playBtn");

// ===== Mobile Detection =====
const isMobile=/Mobi|Android/i.test(navigator.userAgent);

// ===== Variables =====
let scene, camera, renderer, controls;
let playerObj, bullets=[], obstacles=[];
let move={forward:false,backward:false,left:false,right:false};
let isRunning=false,isJumping=false;

// ===== Initialize Game =====
function initGame(){

    // ===== Scene, Camera, Renderer =====
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb);
    camera = new THREE.PerspectiveCamera(75,window.innerWidth/window.innerHeight,0.1,1000);
    renderer = new THREE.WebGLRenderer({antialias:true});
    renderer.setSize(window.innerWidth,window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // ===== Lights =====
    scene.add(new THREE.AmbientLight(0xffffff,1));
    const dirLight = new THREE.DirectionalLight(0xffffff,0.7);
    dirLight.position.set(10,20,10);
    scene.add(dirLight);

    // ===== Ground =====
    const ground = new THREE.Mesh(
        new THREE.PlaneGeometry(100,100),
        new THREE.MeshPhongMaterial({color:0x556B2F})
    );
    ground.rotation.x=-Math.PI/2;
    scene.add(ground);

    // ===== Obstacles =====
    function addObstacle(x,z,w=2,h=3,d=2,color=0x8B4513){
        const box=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),
            new THREE.MeshPhongMaterial({color}));
        box.position.set(x,h/2,z);
        scene.add(box); obstacles.push(box);
    }
    addObstacle(10,10,3,4,3); addObstacle(-15,5,3,4,3,0xA0522D);
    addObstacle(0,-20,5,5,5,0x654321); addObstacle(-25,-15,4,3,2);
    addObstacle(20,-10,3,3,3,0xA0522D);

    // ===== Player =====
    const player={height:2,speed:0.3};
    playerObj=new THREE.Object3D();
    playerObj.position.set(0,player.height+1,5);
    scene.add(playerObj);
    camera.position.set(0,player.height+1,5);

    // ===== PointerLock Controls =====
    controls = new PointerLockControls(camera, renderer.domElement);
    scene.add(controls.getObject());

    // ===== Weapon =====
    const awm = new THREE.Mesh(new THREE.BoxGeometry(0.2,0.2,2), new THREE.MeshStandardMaterial({color:0x333333}));
    awm.position.set(0.4,-0.3,-0.8);
    camera.add(awm);

    // ===== Input =====
    document.addEventListener('keydown',e=>{
        switch(e.code){
            case 'KeyW': move.forward=true; break;
            case 'KeyS': move.backward=true; break;
            case 'KeyA': move.left=true; break;
            case 'KeyD': move.right=true; break;
            case 'ShiftLeft': isRunning=true; break;
            case 'Space':
                if(controls.getObject().position.y<=player.height+0.01) isJumping=true;
                break;
        }
    });
    document.addEventListener('keyup',e=>{
        switch(e.code){
            case 'KeyW': move.forward=false; break;
            case 'KeyS': move.backward=false; break;
            case 'KeyA': move.left=false; break;
            case 'KeyD': move.right=false; break;
            case 'ShiftLeft': isRunning=false; break;
        }
    });
    document.body.addEventListener('mousedown',shoot);

    // ===== Mobile Controls =====
    if(isMobile){
        document.getElementById("mobileControls").style.display="block";
        const bindBtn=(id,prop,value)=>{
            const btn=document.getElementById(id);
            if(!btn) return;
            btn.addEventListener("touchstart",()=>{move[prop]=value;});
            btn.addEventListener("touchend",()=>{move[prop]=false;});
        };
        bindBtn("upBtn","forward",true);
        bindBtn("downBtn","backward",true);
        bindBtn("leftBtn","left",true);
        bindBtn("rightBtn","right",true);
        const jumpBtn=document.getElementById("jumpBtn");
        if(jumpBtn) jumpBtn.addEventListener("touchstart",()=>{ if(controls.getObject().position.y<=player.height+0.01) isJumping=true; });
        const runBtn=document.getElementById("runBtn");
        if(runBtn) runBtn.addEventListener("touchstart",()=>isRunning=true);
        if(runBtn) runBtn.addEventListener("touchend",()=>isRunning=false);
        const shootBtn=document.getElementById("shootBtn");
        if(shootBtn) shootBtn.addEventListener("touchstart",shoot);
    }

    animate();
}

// ===== Shoot function =====
function shoot(){
    if(!camera) return;
    const bulletGeo=new THREE.SphereGeometry(0.1,8,8);
    const bulletMat=new THREE.MeshStandardMaterial({color:0xffff00});
    const bullet=new THREE.Mesh(bulletGeo,bulletMat);
    bullet.position.copy(camera.position);
    const dir=new THREE.Vector3(0,0,-1).applyEuler(camera.rotation);
    bullet.direction=dir;
    bullets.push(bullet);
    scene.add(bullet);
}

// ===== Collision =====
function checkCollision(pos){
    for(let obs of obstacles){
        const dx=Math.abs(pos.x-obs.position.x);
        const dz=Math.abs(pos.z-obs.position.z);
        const distX=obs.geometry.parameters.width/2+0.5;
        const distZ=obs.geometry.parameters.depth/2+0.5;
        if(dx<distX && dz<distZ) return true;
    }
    return false;
}

// ===== Animate =====
function animate(){
    requestAnimationFrame(animate);
    if(!controls) return;
    const speed=isRunning?0.6:0.3;
    const dir=new THREE.Vector3();
    if(move.forward) dir.z-=speed;
    if(move.backward) dir.z+=speed;
    if(move.left) dir.x-=speed;
    if(move.right) dir.x+=speed;

    const angle=controls.getObject().rotation.y;
    const newX=controls.getObject().position.x + dir.x*Math.cos(angle)-dir.z*Math.sin(angle);
    const newZ=controls.getObject().position.z + dir.x*Math.sin(angle)+dir.z*Math.cos(angle);
    if(!checkCollision({x:newX,z:newZ})){
        controls.getObject().position.x=newX;
        controls.getObject().position.z=newZ;
    }

    // Jump
    if(isJumping){ controls.getObject().position.y+=0.2; isJumping=false; }
    else if(controls.getObject().position.y>2) controls.getObject().position.y-=0.1;
    else controls.getObject().position.y=2;

    // Bullets
    bullets.forEach((b,i)=>{
        b.position.add(b.direction.clone().multiplyScalar(2));
        if(Math.abs(b.position.x)>50||Math.abs(b.position.z)>50){scene.remove(b);bullets.splice(i,1);}
    });

    renderer.render(scene,camera);
}

// ===== Resize =====
window.addEventListener("resize",()=>{
    if(!camera||!renderer) return;
    camera.aspect=window.innerWidth/window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth,window.innerHeight);
});

// ===== Play Button =====
if(playBtn){
    playBtn.addEventListener("click",()=>{
        startScreen.style.display="none";
        if(!isMobile) controls.lock();
        initGame();
    });
}
