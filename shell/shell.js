var stats, scene, renderer, composer;
var camera, cameraControls;
var mesh, wireframe;

var shell_parameters = {
    A: 2.0,
    a: 0.6,
    b: 0.75,
    alpha: 83.0,
    beta: 20.0,
    theta: 8.0,
}

var config = {
    wireframe: false,
    update: function() { generate(shell_parameters) }
};


window.onload = function() {
    var gui = new dat.GUI();
//    gui.add(config, 'wireframe');
    gui.add(shell_parameters, 'A', 0.0, 10.0);
    gui.add(shell_parameters, 'a', 0.0, 10.0);
    gui.add(shell_parameters, 'b', 0.0, 10.0);
    gui.add(shell_parameters, 'alpha', 70.0, 90.0);
    gui.add(shell_parameters, 'beta', 10.0, 90.0);
    gui.add(shell_parameters, 'theta', 0.0, 20.0);
    
    gui.add(config, 'update');
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

        var theta = (u - 0.5) * params.theta * Math.PI;
        var s = v * Math.PI * 2.0;

        var A = params.A;
        var alpha = params.alpha * (Math.PI / 180.0);
        var beta = params.beta * (Math.PI / 180.0);

        var a = params.a;
        var b = params.b;

        var cot_alpha = 1.0 / Math.tan(alpha);
        var exp = Math.exp(theta * cot_alpha);

        var res = surface(a, b, s);

        var x = ((A * Math.sin(beta) * Math.cos(theta)) + (Math.cos(s) * Math.cos(theta) * res)) * exp;
        var y = ((A * Math.sin(beta) * Math.sin(theta)) + (Math.cos(s) * Math.sin(theta) * res)) * exp;
        var z = ((A * -1.0 * Math.cos(beta)) + (Math.sin(s) * res)) * exp;

        return result.set(x, y, z);

    };

}

function generate(params) {
    var old_geometry = mesh.geometry;
	mesh.geometry = new THREE.ParametricGeometry(shell(params), 128, 128);
    mesh.geometry.verticesNeedUpdate = true;

    var wireframe = mesh.getObjectByName("wireframe");
    wireframe.geometry = mesh.geometry;
    wireframe.geometry.verticesNeedUpdate = true;

    old_geometry.dispose();
}

function init(){

	if(Detector.webgl){
		renderer = new THREE.WebGLRenderer({
			antialias: true,
		});
		renderer.setClearColor(0x444444);
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
	camera.position.set(100, 0, 0);
	scene.add(camera);
	cameraControls	= new THREE.OrbitControls(camera, renderer.domElement)

    var geometry = new THREE.SphereGeometry();
	var material = new THREE.MeshNormalMaterial({
        polygonOffset: true,
        polygonOffsetFactor: 1, // positive value pushes polygon further away
        polygonOffsetUnits: 1,
        side: THREE.DoubleSide
    });
	mesh = new THREE.Mesh(geometry, material);
	scene.add(mesh);

    var mat = new THREE.LineBasicMaterial({
        color: 0xffffff,
        linewidth: 0.5
    });
	wireframe = new THREE.LineSegments(geometry, mat);
    wireframe.name = "wireframe";
	mesh.add(wireframe);

	generate(shell_parameters);
}

function animate() {
	requestAnimationFrame(animate);
	render();
	stats.update();
}

function render() {
    wireframe.visible = config.wireframe;
    cameraControls.update();
	renderer.render(scene, camera);
}
