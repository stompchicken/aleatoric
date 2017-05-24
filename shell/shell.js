var stats, scene, renderer, composer;
var camera, cameraControls;
var mesh;

var parameters = {

    A: 1.0,
    a: 0.1,
    b: 0.1,
    alpha: 86.0,
    beta: 10.0,
    theta: 0.2,

    D: 1.0,
    phi: 0.0,
    omega: 0.0,
    mu: 0.0,

    N: 0,
    W1: 1.0,
    W2: 0.5,
    L: 0.5,
    P: 40.0
}

var presets = {
  "preset": "Whelk",
  "remembered": {
    "Whelk": {
      "0": {
        "a": 0.30787468247248095,
        "b": 0.3241320914479255,
        "alpha": 84.88653683319221,
        "beta": 9.571549534292972,
        "theta": 8.0,
        "D": -1,
        "phi": -31.62329829398587,
        "omega": 10.065483370670336,
        "mu": 12.050663449939691,
        "N": 5,
        "W1": 0.2,
        "W2": 0.2,
        "L": 0.05,
        "P": 0
      }
    }
  },
  "closed": false,
  "folders": {
    "Surface": {
      "preset": "Default",
      "closed": true,
      "folders": {}
    },
    "Nodules": {
      "preset": "Default",
      "closed": true,
      "folders": {}
    }
  }
}

function randRange(min, max) {
    return (Math.random() * (max - min)) + min;
}

function randInt(min, max) {
    return Math.floor(randRange(min, max));
}

var config = {
    randomise: function() {
        parameters.a = randRange(0.1, 1.0);
        parameters.b = randRange(0.1, 1.0);
        parameters.alpha = randRange(80, 90);
        parameters.beta = randRange(0, 90);
        parameters.theta = randRange(4, 10);

        parameters.phi = randRange(-30, 30);
        parameters.omega = randRange(-30, 30);
        parameters.mu = randRange(-30, 30);

        parameters.N = randInt(0, 5);
        parameters.W1 = randRange(0, 2.5);
        parameters.W2 = randRange(0, 2.5);
        parameters.L = randRange(0, 1.0);
        parameters.P = randRange(-45, 45);

        
        generate(parameters);
    }
}

window.onload = function() {
    var gui = new dat.GUI({load: presets});
//    var gui = new dat.GUI();

    gui.add(config, "randomise");

    var controllers = []

    // Basic values
    controllers.push(gui.add(parameters, 'a', 0.0, 0.5));
    controllers.push(gui.add(parameters, 'b', 0.0, 0.5));
    controllers.push(gui.add(parameters, 'alpha', 75.0, 90.0));
    controllers.push(gui.add(parameters, 'beta', 0.0, 90.0));
    controllers.push(gui.add(parameters, 'theta', 0.0, 50.0));

    var surface = gui.addFolder('Surface');

    controllers.push(surface.add(parameters, 'D', -1.0, 1.0));
    controllers.push(surface.add(parameters, 'phi', -90.0, 90.0));
    controllers.push(surface.add(parameters, 'omega', -90.0, 90.0));
    controllers.push(surface.add(parameters, 'mu', -90.0, 90.0));

    var nodules = gui.addFolder('Nodules');
    controllers.push(nodules.add(parameters, 'N', 0, 5).step(1));
    controllers.push(nodules.add(parameters, 'W1', 0, 1.0));
    controllers.push(nodules.add(parameters, 'W2', 0, 1.0));
    controllers.push(nodules.add(parameters, 'L', 0, 1.0));
    controllers.push(nodules.add(parameters, 'P', -90.0, 90.0));

    for(var i=0; i<controllers.length; i++) {
        controllers[i].listen();
        controllers[i].onChange(function(value) { generate(parameters); });
    }

    gui.remember(parameters);
    gui.revert();
};




if(!init()) {
    animate();
}

function surface(a, b, s, theta, N, W1, W2, L, P) {
    var cos = Math.cos(s)/a;
    var sin = Math.sin(s)/b;
    var res = 1.0 / Math.sqrt((cos * cos) + (sin * sin));

    if(N > 0 && W1 > 0 && W2 > 0) {

        P -= Math.PI / 2.0;
        
        var tau = Math.PI * 2.0;
        var x = (N * theta) / tau;

        var l = 0.0;
        l = (tau / N) * (x - Math.floor(x));
        l -= (tau / (2.0*N));
        s -= Math.PI;
        
        var exp = 0.0;
        exp += ((2.0*(s - P)) / W1) * ((2.0*(s - P)) / W1);
        exp += ((2.0*l) / W2) * ((2.0*l) / W2);

        var rns = L * Math.exp(-1.0 * exp);
        return res + rns;
    } else {
        return res;
    }
}

function shell(params) {

    return function( u, v, optionalTarget ) {

        var result = optionalTarget || new THREE.Vector3();

        var theta = u * params.theta * Math.PI;
        var s = v * Math.PI * 2.0;

        var A = params.A;
        var alpha = params.alpha * (Math.PI / 180.0);
        var beta = params.beta * (Math.PI / 180.0);

        var a = params.a;
        var b = params.b;

        var cot_alpha = 1.0 / Math.tan(alpha);
        var exp = Math.exp(theta * cot_alpha);


        var D = params.D;
        var phi = params.phi * (Math.PI / 180.0);
        var omega = params.omega * (Math.PI / 180.0);
        var mu = params.mu * (Math.PI / 180.0);

        var N = params.N;
        var W1 = params.W1;
        var W2 = params.W2;
        var L = params.L;
        var P = params.P * (Math.PI / 180.0);

        var res = surface(a, b, s, theta, N, W1, W2, L, P);

        var x = 0.0;
        x += A * Math.sin(beta) * Math.cos(theta);
        x += Math.cos(s + phi) * Math.cos(theta + omega) * res;
        x -= Math.sin(mu) * Math.sin(s + phi) * Math.sin(theta + omega) * res;
        x *= D * exp;

        var y = 0.0;
        y += A * Math.sin(beta) * Math.sin(theta);
        y += Math.cos(s + phi) * Math.sin(theta + omega) * res;
        y += Math.sin(mu) * Math.sin(s + phi) * Math.cos(theta + omega) * res;
        y *= exp;

        var z = 0.0;
        z += A * -1.0 * Math.cos(beta);
        z += Math.cos(mu) * Math.sin(s + phi) * res;
        z *= exp;

        return result.set(x, y, z);

    };

}

function generate(params) {
    var old_geometry = mesh.geometry;
	mesh.geometry = new THREE.ParametricGeometry(shell(params), 128, 128);
    mesh.geometry.verticesNeedUpdate = true;
/*
    var wireframe = mesh.getObjectByName("wireframe");
    wireframe.geometry = mesh.geometry;
    wireframe.geometry.verticesNeedUpdate = true;
*/
    old_geometry.dispose();
}

function init(){

	if(Detector.webgl){
		renderer = new THREE.WebGLRenderer({
			antialias: true,
		});
		renderer.setClearColor(0x1060a0);
	} else {
		Detector.addGetWebGLMessage();
		return true;
	}
	renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.getElementById('container').appendChild(renderer.domElement);

	// add Stats.js
	stats = new Stats();
	stats.domElement.style.position	= 'absolute';
	stats.domElement.style.bottom = '0px';
	document.body.appendChild(stats.domElement);

	// Make a scene
	scene = new THREE.Scene();

	camera	= new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 1, 100000 );
	camera.position.set(20, 0, 0);
    
	scene.add(camera);
	cameraControls	= new THREE.OrbitControls(camera, renderer.domElement)

    var shellTexture = new THREE.TextureLoader().load("shell.jpg");
    shellTexture.wrapS = THREE.RepeatWrapping;
    shellTexture.wrapT = THREE.RepeatWrapping;
    shellTexture.repeat.set(32,4);

    var bumpTexture = new THREE.TextureLoader().load("bump.jpg");
    bumpTexture.wrapS = THREE.RepeatWrapping;
    bumpTexture.wrapT = THREE.RepeatWrapping;
    bumpTexture.repeat.set(32,4);


    // Object
    var geometry = new THREE.TorusKnotGeometry(1, 0.25);

    var material = new THREE.MeshStandardMaterial({
        side: THREE.DoubleSide,
        color: 0xf0f0d0,
        roughness: 0.75,
        map: shellTexture,
        bumpMap: shellTexture,
        bumpScale: 0.1,
        metalness: 0.10
    });

//    var material = new THREE.MeshNormalMaterial({side: THREE.DoubleSide});

	mesh = new THREE.Mesh(geometry, material);
	scene.add(mesh);
    mesh.position.set(0, 0, 5);
    camera.target = mesh;

    // Ambient light
    var ambientLight = new THREE.AmbientLight(0x808080, 0.4);
    scene.add(ambientLight);

    // Above light
    var light1 = new THREE.DirectionalLight(0x808080, 1.5);
    light1.position.set(0, 100, 0);
    light1.target = mesh;
    scene.add(light1);
//    scene.add(new THREE.DirectionalLightHelper(light1));

    var light2 = new THREE.DirectionalLight(0x808080, 1.5);
    light2.position.set(0, -50, 100);
    light2.target = mesh;
    scene.add(light2);
//    scene.add(new THREE.DirectionalLightHelper(light2));

	generate(parameters);
}

function animate() {
	requestAnimationFrame(animate);
	render();
	stats.update();
}

function render() {
    cameraControls.update();
	renderer.render(scene, camera);
}
