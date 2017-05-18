var stats, scene, renderer, composer;
var camera, cameraControls;
var mesh, wireframe;

var parameters = {

    A: 1.0,
    a: 0.6,
    b: 0.75,
    alpha: 83.0,
    beta: 20.0,
    theta: 8.0,
    D: 1.0,
    phi: 0.0,
    omega: 0.0,
    mu: 0.0
}

var config = {
};


window.onload = function() {
    var gui = new dat.GUI();
    gui.add(parameters, 'A', 0.0, 10.0).onChange(function(value) { generate(parameters); });
    gui.add(parameters, 'a', 0.0, 10.0).onChange(function(value) { generate(parameters); });;
    gui.add(parameters, 'b', 0.0, 10.0).onChange(function(value) { generate(parameters); });;
    gui.add(parameters, 'alpha', 70.0, 90.0).onChange(function(value) { generate(parameters); });;
    gui.add(parameters, 'beta', 0.0, 90.0).onChange(function(value) { generate(parameters); });;
    gui.add(parameters, 'theta', 0.0, 20.0).onChange(function(value) { generate(parameters); });;
    gui.add(parameters, 'D', -1.0, 1.0).onChange(function(value) { generate(parameters); });;
    gui.add(parameters, 'phi', -90.0, 90.0).onChange(function(value) { generate(parameters); });;
    gui.add(parameters, 'omega', -90.0, 90.0).onChange(function(value) { generate(parameters); });;
    gui.add(parameters, 'mu', -90.0, 90.0).onChange(function(value) { generate(parameters); });;
};


if(!init()) {
    animate();
}

function surface(a, b, s) {
    var cos = Math.cos(s)/a;
    var sin = Math.sin(s)/b;
    return 1.0 / Math.sqrt((cos * cos) + (sin * sin));
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

        var res = surface(a, b, s);

        var D = params.D;
        var phi = params.phi * (Math.PI / 180.0);
        var omega = params.omega * (Math.PI / 180.0);
        var mu = params.mu * (Math.PI / 180.0);

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
		renderer.setClearColor(0x203040);
	} else {
		Detector.addGetWebGLMessage();
		return true;
	}
	renderer.setSize(window.innerWidth, window.innerHeight);
    document.getElementById('container').appendChild(renderer.domElement);

	// add Stats.js
	stats = new Stats();
	stats.domElement.style.position	= 'absolute';
	stats.domElement.style.bottom = '0px';
	document.body.appendChild(stats.domElement);

	// Make a scene
	scene = new THREE.Scene();

	camera	= new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 1, 100000 );
	camera.position.set(50, 25, 50);
	scene.add(camera);
	cameraControls	= new THREE.OrbitControls(camera, renderer.domElement)

    var shellTexture = new THREE.TextureLoader().load("shell.jpg");
    shellTexture.wrapS = THREE.RepeatWrapping;
    shellTexture.wrapT = THREE.RepeatWrapping;
    shellTexture.repeat.set(16,4);
    
    var geometry = new THREE.SphereGeometry();
	var material = new THREE.MeshStandardMaterial({
        side: THREE.DoubleSide,
        color: 0xf0f0d0,
        roughness: 0.55,
        map: shellTexture,
        metalness: 0.20
    });
	mesh = new THREE.Mesh(geometry, material);
	scene.add(mesh);

    var light = new THREE.AmbientLight( 0x808080, 0.5); // soft white light
    scene.add( light );

    var directionalLight1 = new THREE.DirectionalLight(0x606060);
    directionalLight1.position.set(0, 1000, 2000);
    directionalLight1.target = mesh;
    scene.add(directionalLight1);

    var directionalLight2 = new THREE.DirectionalLight(0x808080);
    directionalLight2.position.set(1000, 2000, -2000);
    directionalLight2.target = mesh;
    scene.add(directionalLight2);

    /*
    var mat = new THREE.LineBasicMaterial({
        color: 0xffffff,
        linewidth: 0.5
    });
	wireframe = new THREE.LineSegments(geometry, mat);
    wireframe.name = "wireframe";
	mesh.add(wireframe);
*/
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
