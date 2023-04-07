import * as THREE from "three";
import {OrbitControls} from "three/addons/controls/OrbitControls.js";

var settings = {
    EnableLightHelper: true,
    EnablePlayerHitboxHelper: true,
    PlayerEyeGap: 0.3,
    PlayerFootGap: 0.5,
    PlayerHandGap: 1.5,
};

function amb(color) {
    const a = new THREE.AmbientLight(color);
    scene.add(a);
}

function light(x, y, z) {
    const l = new THREE.PointLight(0xfffffff, 1, 10, 1);
    l.position.x = x;
    l.position.y = y;
    l.position.z = z;
    scene.add(l);
    if (settings.EnableLightHelper) {
        const lh = new THREE.PointLightHelper(l, 1, 0xff0000);
        scene.add(lh);
    }
    return l;
}

function cube(x, y, z, w = 1, h = 1, d = 1, color = 0xeeeeee) {
    const c = new THREE.Mesh(
        new THREE.BoxGeometry(w, h, d),
        new THREE.MeshStandardMaterial({color: color})
    );
    c.x = x;
    c.y = y;
    c.z = z;
    scene.add(c);
    return c;
}

function base() {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    );

    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);
    return [scene, camera, renderer];
}

function player(x, y, z) {
    const sphere = new THREE.Mesh(
        new THREE.SphereGeometry(1, 32, 32),
        new THREE.MeshStandardMaterial({color: 0x00ffff})
    );
    const leftEye = new THREE.Mesh(
        new THREE.SphereGeometry(0.175, 16, 16),
        new THREE.MeshBasicMaterial({color: 0xffffff})
    );
    leftEye.scale.y = 2;
    leftEye.position.y = 0.5;
    leftEye.position.z = 0.8;
    leftEye.position.x = settings.PlayerEyeGap;
    const rightEye = new THREE.Mesh(
        new THREE.SphereGeometry(0.175, 16, 16),
        new THREE.MeshBasicMaterial({color: 0xffffff})
    );
    rightEye.scale.y = 2;
    rightEye.position.y = 0.5;
    rightEye.position.z = 0.8;
    rightEye.position.x = -settings.PlayerEyeGap;
    const leftFoot = new THREE.Mesh(
        new THREE.SphereGeometry(0.4, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2),
        new THREE.MeshStandardMaterial({color: 0x00ffff})
    );
    leftFoot.scale.z = 1.4;
    leftFoot.position.x = settings.PlayerFootGap;
    const rightFoot = new THREE.Mesh(
        new THREE.SphereGeometry(0.4, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2),
        new THREE.MeshStandardMaterial({color: 0x00ffff})
    );
    rightFoot.scale.z = 1.4;
    rightFoot.position.x = -settings.PlayerFootGap;
    const leftHand = new THREE.Mesh(
        new THREE.SphereGeometry(0.25, 32, 32),
        new THREE.MeshStandardMaterial({color: 0x00ffff})
    );
    leftHand.position.y = 1.6;
    leftHand.position.x = settings.PlayerHandGap;
    const rightHand = new THREE.Mesh(
        new THREE.SphereGeometry(0.25, 32, 32),
        new THREE.MeshStandardMaterial({color: 0x00ffff})
    );
    rightHand.position.y = 1.6;
    rightHand.position.x = -settings.PlayerHandGap;
    sphere.add(leftEye);
    sphere.add(rightEye);
    sphere.position.y = 1.5;
    const helper = new THREE.AxesHelper(1);
    const g = new THREE.Group();
    g.add(helper);
    g.add(sphere);
    g.add(leftFoot);
    g.add(rightFoot);
    g.add(leftHand);
    g.add(rightHand);
    if (settings.EnablePlayerHitboxHelper) {
        const hitbox = new THREE.Mesh(
            new THREE.CylinderGeometry(1.75, 1.75, 2.5, 16, 1, false),
            new THREE.MeshBasicMaterial({
                color: 0xff0000,
                opacity: 0.5,
                transparent: true,
            })
        );
        hitbox.position.y = 2.5 / 2;
        g.add(hitbox);
    }
    g.position.x = x;
    g.position.y = y;
    g.position.z = z;
    scene.add(g);
    return g;
}

const [scene, camera, renderer] = base();

amb(0x404040);
light(0, 5, -2.5);
light(0, 5, 2.5);

player(0, 5, 0);
cube(0, -0.2, 0, 40, 0.4, 40);

camera.position.z = 20;
camera.position.y = 3;
const controls = new OrbitControls(camera, renderer.domElement);

function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}
animate();
