/**
 * Created by Robert Xie
 * © 2015 HIT Microsoft Club
 * All Rights Reserved
 */

function loadWelcome() {
    if (Detector.webgl && !isMobile() && Cookies.get("animation-viewed") == undefined) {
        windowHalfX = window.innerWidth / 2;
        windowHalfY = window.innerHeight / 2;
        start_time = Date.now();
        logoAnimation();
        welcomeAnimation();
    }
    else {
        animationState = 0;
        $("#welcome").remove();
    }
}

function logoAnimation() {
    logo = $("#welcome-logo");
    welcome = $("#welcome");
    welcomeText = $("#welcome-text");
    logoResize();
    window.addEventListener('resize', logoResize, false);
    animationState = 1;
    rotateLogo();
    rotateAnimation = setInterval(rotateLogo, 16);
    setTimeout(function () {
        clearInterval(rotateAnimation);
        rotateAnimation = undefined;
        logo.css("transform", "rotateY(-45deg)");
        text_start_time = Date.now();
        showText();
        textAnimation = setInterval(showText, 16);
        setTimeout(function () {
            animationState = 2;
            clearInterval(textAnimation);
            textAnimation = undefined;
            setTimeout(removeAnimation, 2000);
        }, 500);
    }, 1000);
}

function rotateLogo() {
    logo.css("transform", "rotateY(" + easeOutQuint(Date.now() - start_time, 0, -45, 1000) + "deg)");
}

function showText() {
    var logoLeft = easeOutQuint(Date.now() - text_start_time, windowHalfX - 72, -370, 500);
    var textLeft = logoLeft + 184;
    var textClip = windowHalfX * 2 - logoLeft - textLeft;
    logo.css("left", logoLeft);
    welcomeText.css("left", textLeft);
    welcomeText.css("clip", "rect(auto, " + textClip + "px, auto, auto");
}

function logoResize() {
    if (animationState == 1){
        return;
    }
    windowHalfX = window.innerWidth / 2;
    windowHalfY = window.innerHeight / 2;
    if (animationState == 2) {
        logo.css({"top": windowHalfY - 100, "left": windowHalfX - 442});
        welcomeText.css({"top": windowHalfY - 50, "left": windowHalfX - 258});
    }
    else {
        logo.css({"top": windowHalfY - 100, "left": windowHalfX - 72});
        welcomeText.css({"top": windowHalfY - 50, "left": windowHalfX + 112});
    }
}

function welcomeAnimation() {

    container = $("#welcome")[0];

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

    if (Date.now() - start_time < 5000) {
        requestAnimationFrame(animate);
    }

    var position = ( ( Date.now() - start_time ) * 0.03 ) % 8000;

    camera.position.x += ( camera.position.x ) * 0.01;
    camera.position.y -= ( camera.position.y ) * 0.01;
    camera.position.z = -position + 8000;

    renderer.render(scene, camera);

}

function removeAnimation() {
    welcome.animate({"opacity": 0}, 500, "linear", function () {
        welcome.remove();
        Cookies.set("animation-viewed", true);
        window.removeEventListener('resize', logoResize, false);
        window.removeEventListener('resize', animationResize, false);
    });
}

