window.addEventListener('DOMContentLoaded', function() {

    var startScreen = document.getElementById("startScreen");
    var playBtn = document.getElementById("playBtn");
    var isMobile = /Mobi|Android/i.test(navigator.userAgent);

    // Global vars
    var scene, camera, renderer, controls;
    var playerObj, bullets = [], obstacles = [];
    var move = { forward:false, backward:false, left:false, right:false };
    var isRunning = false, isJumping = false;

    function shoot() {
        if (!camera) return;
        var bulletGeo = new THREE.SphereGeometry(0.1,8,8);
        var bulletMat = new THREE.MeshStandardMaterial({color:0xffff00});
        var bullet = new THREE.Mesh(bulletGeo, bulletMat);
        bullet.position.copy(camera.position);
        var dir = new THREE.Vector3(0,0,-1).applyEuler(camera.rotation);
        bullet.direction = dir;
        bullets.push(bullet);
        scene.add(bullet);
    }

    function checkCollision(pos){
        for(var i=0;i<obstacles.length;i++){
            var obs=obstacles[i];
            var dx = Math.abs(pos.x - obs.position.x);
            var dz = Math.abs(pos.z - obs.position.z);
            var distX = obs.geometry.parameters.width/2 + 0.5;
            var distZ = obs.geometry.parameters.depth/2 + 0.5;
            if(dx<distX && dz<distZ) return true;
        }
        return false;
    }

    function animate(){
        requestAnimationFrame(animate);
        if(!controls) return;

        var speed = isRunning ? 0.6 : 0.3;
        var dir = new THREE.Vector3();
        if(move.forward) dir.z -= speed;
        if(move.backward) dir.z += speed;
        if(move.left) dir.x -= speed;
        if(move.right) dir.x += speed;

        var angle = controls.getObject().rotation.y;
        var newX = controls.getObject().position.x + dir.x*Math.cos(angle) - dir.z*Math.sin(angle);
        var newZ = controls.getObject().position.z + dir.x*Math.sin(angle) + dir.z*Math.cos(angle);
        if(!checkCollision({x:newX, z:newZ})){
            controls.getObject().position.x = newX;
            controls.getObject().position.z = newZ;
        }

        if(isJumping){ controls.getObject().position.y+=0.2; isJumping=false; }
        else if(controls.getObject().position.y>2) controls.getObject().position.y-=0.1;
        else controls.getObject().position.y=2;

        for(var i=bullets.length-1;i>=0;i--){
            var b = bullets[i];
            b.position.add(b.direction.clone().multiplyScalar(2));
            if(Math.abs(b.position.x)>50 || Math.abs(b.position.z)>50){
                scene.remove(b);
                bullets.splice(i,1);
            }
        }

        renderer.render(scene,camera);
    }

    function initGame(){
        scene = new THREE.Scene();
        scene.background = new THREE.Color(0x87ceeb);

        camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
        camera.position.set(0,2,5);

        renderer = new THREE.WebGLRenderer({antialias:true});
        renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(renderer.domElement);

        scene.add(new THREE.AmbientLight(0xffffff,1));
        var dirLight = new THREE.DirectionalLight(0xffffff,0.7);
        dirLight.position.set(10,20,10);
        scene.add(dirLight);

        var ground = new THREE.Mesh(new THREE.PlaneGeometry(100,100), new THREE.MeshPhongMaterial({color:0x556B2F}));
        ground.rotation.x = -Math.PI/2;
        scene.add(ground);

        obstacles = [];
        function addObstacle(x,z,w=2,h=3,d=2,color=0x8B4513){
            var box = new THREE.Mesh(new THREE.BoxGeometry(w,h,d), new THREE.MeshPhongMaterial({color:color}));
            box.position.set(x,h/2,z);
            scene.add(box);
            obstacles.push(box);
        }
        addObstacle(10,10,3,4,3); addObstacle(-15,5,3,4,3,0xA0522D);
        addObstacle(0,-20,5,5,5,0x654321); addObstacle(-25,-15,4,3,2);
        addObstacle(20,-10,3,3,3,0xA0522D);

        var player = {height:2, speed:0.3};
        playerObj = new THREE.Object3D();
        playerObj.position.set(0, player.height+1, 5);
        scene.add(playerObj);

        controls = new THREE.PointerLockControls(camera, renderer.domElement);
        scene.add(controls.getObject());

        // Weapon
        var awm = new THREE.Mesh(new THREE.BoxGeometry(0.2,0.2,2), new THREE.MeshStandardMaterial({color:0x333333}));
        awm.position.set(0.4,-0.3,-0.8);
        camera.add(awm);

        if(!isMobile){
            document.addEventListener('keydown',function(e){
                switch(e.code){
                    case 'KeyW': move.forward=true; break;
                    case 'KeyS': move.backward=true; break;
                    case 'KeyA': move.left=true; break;
                    case 'KeyD': move.right=true; break;
                    case 'ShiftLeft': isRunning=true; break;
                    case 'Space': if(controls.getObject().position.y<=player.height+0.01) isJumping=true; break;
                }
            });
            document.addEventListener('keyup',function(e){
                switch(e.code){
                    case 'KeyW': move.forward=false; break;
                    case 'KeyS': move.backward=false; break;
                    case 'KeyA': move.left=false; break;
                    case 'KeyD': move.right=false; break;
                    case 'ShiftLeft': isRunning=false; break;
                }
            });
            document.body.addEventListener('mousedown',shoot);
        } else {
            document.getElementById("mobileControls").style.display="block";
            function bindBtn(id,prop,value){
                var btn=document.getElementById(id);
                if(!btn) return;
                btn.addEventListener("touchstart",function(){move[prop]=value;});
                btn.addEventListener("touchend",function(){move[prop]=false;});
            }
            bindBtn("upBtn","forward",true);
            bindBtn("downBtn","backward",true);
            bindBtn("leftBtn","left",true);
            bindBtn("rightBtn","right",true);
            var jumpBtn=document.getElementById("jumpBtn");
            if(jumpBtn) jumpBtn.addEventListener("touchstart",function(){if(controls.getObject().position.y<=player.height+0.01) isJumping=true;});
            var runBtn=document.getElementById("runBtn");
            if(runBtn) runBtn.addEventListener("touchstart",function(){isRunning=true;});
            if(runBtn) runBtn.addEventListener("touchend",function(){isRunning=false;});
            var shootBtn=document.getElementById("shootBtn");
            if(shootBtn) shootBtn.addEventListener("touchstart",shoot);
        }

        animate();
    }

    playBtn.addEventListener("click",function(){
        startScreen.style.display="none";
        initGame();
        if(!isMobile) controls.lock();
    });

    window.addEventListener("resize",function(){
        if(!camera || !renderer) return;
        camera.aspect = window.innerWidth/window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });

});
