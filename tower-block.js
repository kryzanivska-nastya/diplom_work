console.clear();

class Tower {
    constructor() {
        // container
        this.render = function () {
            this.renderer.render(this.scene, this.camera);
        };
        this.add = function (elem) {
            this.scene.add(elem);
        };
        this.remove = function (elem) {
            this.scene.remove(elem);
        };
        this.container = document.getElementById('game');
        // renderer
        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: false
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setClearColor('#ADA8B6', 1); 
        this.container.appendChild(this.renderer.domElement);
        // scene
        this.scene = new THREE.Scene();
        // camera
        let aspect = window.innerWidth / window.innerHeight;
        let d = 20;
        this.camera = new THREE.OrthographicCamera(-d * aspect, d * aspect, d, -d, -100, 1000);
        this.camera.position.x = 2;
        this.camera.position.y = 2;
        this.camera.position.z = 2;
        this.camera.lookAt(new THREE.Vector3(0, 0, 0));
        //light
        this.light = new THREE.DirectionalLight(0xffffff, 0.5);
        this.light.position.set(0, 499, 0);
        this.scene.add(this.light);
        this.softLight = new THREE.AmbientLight(0xffffff, 0.4);
        this.scene.add(this.softLight);
        window.addEventListener('resize', () => this.onResize());
        this.onResize();
    }
    setCamera(y, speed = 0.3) {
        TweenLite.to(this.camera.position, speed, { y: y + 4, ease: Power1.easeInOut });
        TweenLite.to(this.camera.lookAt, speed, { y: y, ease: Power1.easeInOut });
    }
    onResize() {
        let viewSize = 30;
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.camera.left = window.innerWidth / -viewSize;
        this.camera.right = window.innerWidth / viewSize;
        this.camera.top = window.innerHeight / viewSize;
        this.camera.bottom = window.innerHeight / -viewSize;
        this.camera.updateProjectionMatrix();
    }
}

class Cube {
    constructor(cube) {
        // set size and position
        this.STATES = { ACTIVE: 'active', STOPPED: 'stopped', MISSED: 'missed' };
        this.MOVE_AMOUNT = 12;
        this.dimension = { width: 0, height: 0, depth: 0 };
        this.position = { x: 0, y: 0, z: 0 };
        this.targetCube = cube;
        this.index = (this.targetCube ? this.targetCube.index : 0) + 1;
        this.workingPlane = this.index % 2 ? 'x' : 'z';
        this.workingDimension = this.index % 2 ? 'width' : 'depth';
        // set the dimensions from the target cube, or defaults.
        this.dimension.width = this.targetCube ? this.targetCube.dimension.width : 10;
        this.dimension.height = this.targetCube ? this.targetCube.dimension.height : 2;
        this.dimension.depth = this.targetCube ? this.targetCube.dimension.depth : 10;
        this.position.x = this.targetCube ? this.targetCube.position.x : 0;
        this.position.y = this.dimension.height * this.index;
        this.position.z = this.targetCube ? this.targetCube.position.z : 0;
        this.colorOffset = this.targetCube ? this.targetCube.colorOffset : Math.round(Math.random() * 100);
        // set color
        if (!this.targetCube) {
            this.color = 0x5555FF; // Blue
        }
        else {
            let offset = this.index + this.colorOffset;
            var r = Math.sin(0.3 * offset) * 55 + 200;
            var g = Math.sin(0.3 * offset + 2) * 55 + 200;
            var b = Math.sin(0.3 * offset + 4) * 55 + 200;
            this.color = new THREE.Color(r / 255, g / 255, b / 255);
        }
        // state
        this.state = this.index > 1 ? this.STATES.ACTIVE : this.STATES.STOPPED;
        // set direction
        this.speed = -0.1 - (this.index * 0.005);
        if (this.speed < -4)
            this.speed = -4;
        this.direction = this.speed;
        // create cube
        let geometry = new THREE.BoxGeometry(this.dimension.width, this.dimension.height, this.dimension.depth);
        geometry.applyMatrix(new THREE.Matrix4().makeTranslation(this.dimension.width / 2, this.dimension.height / 2, this.dimension.depth / 2));
        this.material = new THREE.MeshToonMaterial({ color: this.color, shading: THREE.FlatShading });
        this.mesh = new THREE.Mesh(geometry, this.material);
        this.mesh.position.set(this.position.x, this.position.y + (this.state == this.STATES.ACTIVE ? 0 : 0), this.position.z);
        if (this.state == this.STATES.ACTIVE) {
            this.position[this.workingPlane] = Math.random() > 0.5 ? -this.MOVE_AMOUNT : this.MOVE_AMOUNT;
        }
    }
    reverseDirection() {
        this.direction = this.direction > 0 ? this.speed : Math.abs(this.speed);
    }
    place() {
        this.state = this.STATES.STOPPED;
        let overlap = this.targetCube.dimension[this.workingDimension] - Math.abs(this.position[this.workingPlane] - this.targetCube.position[this.workingPlane]);
        let cubesToReturn = {
            plane: this.workingPlane,
            direction: this.direction
        };
        if (this.dimension[this.workingDimension] - overlap < 0.3) {
            overlap = this.dimension[this.workingDimension];
            cubesToReturn.bonus = true;
            this.position.x = this.targetCube.position.x;
            this.position.z = this.targetCube.position.z;
            this.dimension.width = this.targetCube.dimension.width;
            this.dimension.depth = this.targetCube.dimension.depth;
        }
        if (overlap > 0) {
            let choppedDimensions = { width: this.dimension.width, height: this.dimension.height, depth: this.dimension.depth };
            choppedDimensions[this.workingDimension] -= overlap;
            this.dimension[this.workingDimension] = overlap;
            let placedGeometry = new THREE.BoxGeometry(this.dimension.width, this.dimension.height, this.dimension.depth);
            placedGeometry.applyMatrix(new THREE.Matrix4().makeTranslation(this.dimension.width / 2, this.dimension.height / 2, this.dimension.depth / 2));
            let placedMesh = new THREE.Mesh(placedGeometry, this.material);
            let choppedGeometry = new THREE.BoxGeometry(choppedDimensions.width, choppedDimensions.height, choppedDimensions.depth);
            choppedGeometry.applyMatrix(new THREE.Matrix4().makeTranslation(choppedDimensions.width / 2, choppedDimensions.height / 2, choppedDimensions.depth / 2));
            let choppedMesh = new THREE.Mesh(choppedGeometry, this.material);
            let choppedPosition = {
                x: this.position.x,
                y: this.position.y,
                z: this.position.z
            };
            if (this.position[this.workingPlane] < this.targetCube.position[this.workingPlane]) {
                this.position[this.workingPlane] = this.targetCube.position[this.workingPlane];
            }
            else {
                choppedPosition[this.workingPlane] += overlap;
            }
            placedMesh.position.set(this.position.x, this.position.y, this.position.z);
            choppedMesh.position.set(choppedPosition.x, choppedPosition.y, choppedPosition.z);
            cubesToReturn.placed = placedMesh;
            if (!cubesToReturn.bonus)
                cubesToReturn.chopped = choppedMesh;
        }
        else {
            this.state = this.STATES.MISSED;
        }
        this.dimension[this.workingDimension] = overlap;

        if (this.state === this.STATES.STOPPED) {
            let score = parseInt(localStorage.getItem('tower_game_score')) || 0;
            score++;
            localStorage.setItem('tower_game_score', score);
            
            // Trigger the cubePlaced event
            document.dispatchEvent(new Event('cubePlaced'));
        }


        return cubesToReturn;
    }

   
    tick() {
        if (this.state == this.STATES.ACTIVE) {
            let value = this.position[this.workingPlane];
            if (value > this.MOVE_AMOUNT || value < -this.MOVE_AMOUNT)
                this.reverseDirection();
            this.position[this.workingPlane] += this.direction;
            this.mesh.position[this.workingPlane] = this.position[this.workingPlane];
        }
    }
}

class TowerGame {
    constructor() {
        this.STATES = {
            'LOADING': 'loading',
            'PLAYING': 'playing',
            'READY': 'ready',
            'ENDED': 'ended',
            'RESETTING': 'resetting'
        };
        this.cubes = [];
        this.state = this.STATES.LOADING;
        
        this.tower = new Tower();
        this.mainContainer = document.getElementById('container');
        this.scoreContainer = document.getElementById('score');
        this.startButton = document.getElementById('start-button');
        this.instructions = document.getElementById('instructions');
        this.gameOverContainer = document.querySelector('.game-over'); // Reference to game over container
        this.scoreContainer.innerHTML = '0';
        this.newCubes = new THREE.Group();
        this.placedCubes = new THREE.Group();
        this.choppedCubes = new THREE.Group();
        this.tower.add(this.newCubes);
        this.tower.add(this.placedCubes);
        this.tower.add(this.choppedCubes);
        this.addCube();
        this.tick();
        this.updateState(this.STATES.READY);
        this.savedScoreContainer = document.getElementById('saved-score');
        
        // Load the saved score
        this.updateSavedScore();
        document.addEventListener('keydown', e => {
            if (e.keyCode == 32)
                this.onAction();
        });
        document.addEventListener('click', e => {
            this.onAction();
        });
        document.addEventListener('touchstart', e => {
            e.preventDefault();
            // this.onAction();
            // ☝️ this triggers after click on android so you
            // insta-lose, will figure it out later.
        }, {passive:false});
       
    }

    updateSavedScore() {
        const updateScore = () => {
            let score = parseInt(localStorage.getItem('tower_game_score')) || 0;
            this.savedScoreContainer.innerHTML = `Збережені бали: ${score}`;
        };
    
        // Call the function initially to display the saved score
        updateScore();
    
        // Call the function whenever a cube is placed
        document.addEventListener('cubePlaced', updateScore);
    }
    

    updateState(newState) {
        for (let key in this.STATES)
            this.mainContainer.classList.remove(this.STATES[key]);
        this.mainContainer.classList.add(newState);
        this.state = newState;
    }
    onAction() {
        switch (this.state) {
            case this.STATES.READY:
                this.startGame();
                break;
            case this.STATES.PLAYING:
                this.placeCube();
                break;
            case this.STATES.ENDED:
                this.restartGame();
                break;
        }
    }
    startGame() {
        if (this.state != this.STATES.PLAYING) {
            this.scoreContainer.innerHTML = '0';
            this.updateState(this.STATES.PLAYING);
            this.addCube();
        }
    }
    endGame() {
        this.updateState(this.STATES.ENDED);
        let gameOverContainer = document.querySelector('.game-over');

        gameOverContainer.style.display = 'block'; // Show the game over message
        gameOverContainer.style.opacity = '1';
        gameOverContainer.style.transform = 'translateY(0)';

        gameOverContainer.addEventListener('click', () => {
            gameOverContainer.style.opacity = '0';
            gameOverContainer.style.transform = 'translateY(-50px)';
            setTimeout(() => {
                gameOverContainer.style.display = 'none';
                this.startGame();
            }, 500); // Adjust the delay if needed
        });
    }

    restartGame() {
        this.updateState(this.STATES.RESETTING);
        let oldCubes = this.placedCubes.children;
        let removeSpeed = 0.2;
        let delayAmount = 0.02;
        for (let i = 0; i < oldCubes.length; i++) {
            TweenLite.to(oldCubes[i].scale, removeSpeed, { x: 0, y: 0, z: 0, delay: (oldCubes.length - i) * delayAmount, ease: Power1.easeIn, onComplete: () => this.placedCubes.remove(oldCubes[i]) });
            TweenLite.to(oldCubes[i].rotation, removeSpeed, { y: 0.5, delay: (oldCubes.length - i) * delayAmount, ease: Power1.easeIn });
        }
        let cameraMoveSpeed = removeSpeed * 2 + (oldCubes.length * delayAmount);
        this.tower.setCamera(2, cameraMoveSpeed);
        let countdown = { value: this.cubes.length - 1 };
        TweenLite.to(countdown, cameraMoveSpeed, { value: 0, onUpdate: () => { this.scoreContainer.innerHTML = String(Math.round(countdown.value)); } });
        this.cubes = this.cubes.slice(0, 1);
        setTimeout(() => {
            this.startGame();
        }, cameraMoveSpeed * 1000);
    }
    placeCube() {
        let currentCube = this.cubes[this.cubes.length - 1];
        let newCubes = currentCube.place();
        this.newCubes.remove(currentCube.mesh);
        if (newCubes.placed)
            this.placedCubes.add(newCubes.placed);
        if (newCubes.chopped) {
            this.choppedCubes.add(newCubes.chopped);
            let positionParams = { y: '-=30', ease: Power1.easeIn, onComplete: () => this.choppedCubes.remove(newCubes.chopped) };
            let rotateRandomness = 10;
            let rotationParams = {
                delay: 0.05,
                x: newCubes.plane == 'z' ? ((Math.random() * rotateRandomness) - (rotateRandomness / 2)) : 0.1,
                z: newCubes.plane == 'x' ? ((Math.random() * rotateRandomness) - (rotateRandomness / 2)) : 0.1,
                y: Math.random() * 0.1,
            };
            if (newCubes.chopped.position[newCubes.plane] > newCubes.placed.position[newCubes.plane]) {
                positionParams[newCubes.plane] = '+=' + (40 * Math.abs(newCubes.direction));
            }
            else {
                positionParams[newCubes.plane] = '-=' + (40 * Math.abs(newCubes.direction));
            }
            TweenLite.to(newCubes.chopped.position, 1, positionParams);
            TweenLite.to(newCubes.chopped.rotation, 1, rotationParams);
        }
        this.addCube();
    }
    addCube() {
        let lastCube = this.cubes[this.cubes.length - 1];
        if (lastCube && lastCube.state == lastCube.STATES.MISSED) {
            return this.endGame();
        }
        this.scoreContainer.innerHTML = String(this.cubes.length - 1);
        let newKidOnTheBlock = new Cube(lastCube);
        this.newCubes.add(newKidOnTheBlock.mesh);
        this.cubes.push(newKidOnTheBlock);
        this.tower.setCamera(this.cubes.length * 2);
        if (this.cubes.length >= 5)
            this.instructions.classList.add('hide');
    }
    tick() {
        this.cubes[this.cubes.length - 1].tick();
        this.tower.render();
        requestAnimationFrame(() => { this.tick(); });
    }
}


let game = new TowerGame();



