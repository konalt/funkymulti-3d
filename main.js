import * as THREE from "three";
import {OrbitControls} from "three/addons/controls/OrbitControls.js";

var settings = {
    EnableLightHelper: true,
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

const [scene, camera, renderer] = base();

amb(0x404040);
cube(0, -0.2, 0, 20, 0.4, 20);
light(-2.5, 2.5, 2.5);
light(2.5, 2.5, -2.5);

camera.position.z = 5;
camera.position.y = 2.5;
const controls = new OrbitControls(camera, renderer.domElement);

function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}
animate();
