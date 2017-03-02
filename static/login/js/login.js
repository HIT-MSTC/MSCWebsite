/**
 * Created by Robert Xie
 * © 2015 HIT Microsoft Club
 * All Rights Reserved
 */

var container, camera, scene, renderer, start_time, windowHalfX, windowHalfY;
var logo, loginText, loginForm;

function loadLogin() {
    windowHalfX = window.innerWidth / 2;
    windowHalfY = window.innerHeight / 2;
    start_time = Date.now();
    logo = $("#login-logo");
    loginText = $("#login-text");
    loginForm = $("#login-form");
    formResize();
    window.onresize = formResize;
    welcomeAnimation();
}

function formResize() {
    windowHalfX = window.innerWidth / 2;
    windowHalfY = window.innerHeight / 2;
    logo.css({"top": windowHalfY - 154, "left": windowHalfX - 232});
    loginText.css({"top": windowHalfY - 104, "left": windowHalfX - 48});
    loginForm.css({"top":windowHalfY + 46, "left": windowHalfX - 115})
}

function welcomeAnimation() {

    container = $("#login")[0];

    var canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = window.innerHeight;

    var context = canvas.getContext('2d');

    var gradient = context.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, "#205978");
    gradient.addColorStop(0.5, "#3187b5");

    context.fillStyle = gradient;
    context.fillRect(0, 0, canvas.width, canvas.height);

    container.style.background = 'url(' + canvas.toDataURL('image/png') + ')';
    container.style.backgroundSize = '32px 100%';

    camera = new THREE.PerspectiveCamera(30, window.innerWidth / window.innerHeight, 1, 3000);
    camera.position.z = 6000;

    scene = new THREE.Scene();

    var cloudGeometry = new THREE.Geometry();

    var cloudTexture = THREE.ImageUtils.loadTexture('/static/frameworks/threejs/img/cloud10.png', null, animate);
    cloudTexture.magFilter = THREE.LinearMipMapLinearFilter;
    cloudTexture.minFilter = THREE.LinearMipMapLinearFilter;

    var fog = new THREE.Fog(0x3187b5, -100, 3000);

    var cloudMaterial = new THREE.ShaderMaterial({

        uniforms: {

            "map": {type: "t", value: cloudTexture},
            "fogColor": {type: "c", value: fog.color},
            "fogNear": {type: "f", value: fog.near},
            "fogFar": {type: "f", value: fog.far}
        },
        vertexShader: document.getElementById('vs').textContent,
        fragmentShader: document.getElementById('fs').textContent,
        depthWrite: false,
        depthTest: false,
        transparent: true

    });

    var plane = new THREE.Mesh(new THREE.PlaneGeometry(64, 64));

    for (var i = 0; i < 8000; i++) {

        plane.position.x = Math.random() * 1000 - 500;
        plane.position.y = -Math.random() * Math.random() * 200 - 15;
        plane.position.z = i;
        plane.rotation.z = Math.random() * Math.PI;
        plane.scale.x = plane.scale.y = Math.random() * Math.random() * 1.5 + 0.5;

        THREE.GeometryUtils.merge(cloudGeometry, plane);

    }

    var mesh = new THREE.Mesh(cloudGeometry, cloudMaterial);
    scene.add(mesh);

    mesh = new THREE.Mesh(cloudGeometry, cloudMaterial);
    mesh.position.z = -8000;
    scene.add(mesh);

    renderer = new THREE.WebGLRenderer({antialias: false});
    renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(renderer.domElement);

    window.addEventListener('resize', animationResize, false);
}

function animationResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);

}

function animate() {
    requestAnimationFrame(animate);

    var position = ( ( Date.now() - start_time ) * 0.03 ) % 8000;

    camera.position.x += ( camera.position.x ) * 0.01;
    camera.position.y -= ( camera.position.y ) * 0.01;
    camera.position.z = -position + 8000;

    renderer.render(scene, camera);

}