import * as THREE from "three";
import {OrbitControls} from "three/addons/controls/OrbitControls.js";
import {io} from "https://cdn.socket.io/4.3.2/socket.io.esm.min.js";
import {PointerLockControls} from "three/addons/controls/PointerLockControls.js";
import Stats from "./libs/stats.min";

const stats = new Stats();
document.body.appendChild(stats.domElement);

var debug = true;

var actions = {};

function dataToObject(data, keys) {
    let pd = data.split(":");
    let object = {};
    keys.forEach((k, i) => {
        switch (k[1]) {
            case "string":
                object[k[0]] = pd[i];
                break;
            case "vec3":
                object[k[0]] = {
                    x: parseFloat(pd[i].split(",")[0]),
                    y: parseFloat(pd[i].split(",")[1]),
                    z: parseFloat(pd[i].split(",")[2]),
                };
                break;
            case "quat":
                object[k[0]] = {
                    x: parseFloat(pd[i].split(",")[0]),
                    y: parseFloat(pd[i].split(",")[1]),
                    z: parseFloat(pd[i].split(",")[2]),
                    w: parseFloat(pd[i].split(",")[3]),
                };
                break;
            case "vec2a":
                object[k[0]] = pd[i].split(",").map((x) => parseFloat(x));
                break;
            case "null":
                object[k[0]] = null;
                break;
            case "int":
                object[k[0]] = parseInt(pd[i]);
                break;
            case "flt":
                object[k[0]] = parseFloat(pd[i]);
                break;
        }
    });
    return object;
}

function parsePlayerData(plyd) {
    let o = [];
    let keys = [
        ["name", "string"],
        ["id", "string"],
        ["position", "vec3"],
        ["rotation", "quat"],
        ["move", "vec2a"],
        ["look", "vec2a"],
        ["physics", "null"],
        ["offset", "vec3"],
        ["cameraAngle", "flt"],
        ["cameraAngle2", "flt"],
    ];
    plyd.split("\n").forEach((ply) => {
        o.push(dataToObject(ply, keys));
    });
    return o;
}

function init() {
    var settings = {
        EnableLightHelper: true,
        EnablePlayerHitboxHelper: false,
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
            90,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        const camera2 = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            5000
        );

        /* const camerahelper = new THREE.CameraHelper(camera);
        scene.add(camerahelper); */

        const renderer = new THREE.WebGLRenderer();
        renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(renderer.domElement);
        return [scene, camera, renderer, camera2];
    }

    function player(pos, quat, invisible, actionName = "ref") {
        if (!actions.player) return;
        var action = actions.player[actionName];
        if (!action) return console.warn("Invalid action " + actionName);
        const sphere = new THREE.Mesh(
            new THREE.SphereGeometry(1, 32, 32),
            new THREE.MeshStandardMaterial({
                color: 0x00ffff,
                visible: !invisible,
            })
        );
        const leftEye = new THREE.Mesh(
            new THREE.SphereGeometry(0.175, 16, 16),
            new THREE.MeshBasicMaterial({color: 0xffffff, visible: !invisible})
        );
        leftEye.scale.y = 2;
        leftEye.position.y = 0.5;
        leftEye.position.z = 0.8;
        leftEye.position.x = settings.PlayerEyeGap;
        const rightEye = new THREE.Mesh(
            new THREE.SphereGeometry(0.175, 16, 16),
            new THREE.MeshBasicMaterial({color: 0xffffff, visible: !invisible})
        );
        rightEye.scale.y = 2;
        rightEye.position.y = 0.5;
        rightEye.position.z = 0.8;
        rightEye.position.x = -settings.PlayerEyeGap;
        const leftFoot = new THREE.Mesh(
            new THREE.SphereGeometry(
                0.4,
                32,
                16,
                0,
                Math.PI * 2,
                0,
                Math.PI / 2
            ),
            new THREE.MeshStandardMaterial({
                color: 0x00ffff,
                visible: !invisible,
            })
        );
        leftFoot.scale.z = 1.4;
        leftFoot.position.x = settings.PlayerFootGap;
        const rightFoot = new THREE.Mesh(
            new THREE.SphereGeometry(
                0.4,
                32,
                16,
                0,
                Math.PI * 2,
                0,
                Math.PI / 2
            ),
            new THREE.MeshStandardMaterial({
                color: 0x00ffff,
                visible: !invisible,
            })
        );
        rightFoot.scale.z = 1.4;
        rightFoot.position.x = -settings.PlayerFootGap;
        const leftHand = new THREE.Mesh(
            new THREE.SphereGeometry(0.25, 32, 32),
            new THREE.MeshStandardMaterial({
                color: 0x00ffff,
                visible: !invisible,
            })
        );
        leftHand.position.x = action[0][0];
        leftHand.position.y = action[0][1];
        leftHand.position.z = action[0][2];

        const rightHand = new THREE.Mesh(
            new THREE.SphereGeometry(0.25, 32, 32),
            new THREE.MeshStandardMaterial({
                color: 0x00ffff,
                visible: !invisible,
            })
        );
        rightHand.position.x = action[1][0];
        rightHand.position.y = action[1][1];
        rightHand.position.z = action[1][2];
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
        g.position.set(pos.x, pos.y, pos.z);
        g.quaternion.set(quat.x, quat.y, quat.z, quat.w);
        scene.add(g);
        return g;
    }

    const [scene, camera, renderer, camera2] = base();

    camera2.position.z = 5;
    camera2.position.y = 2;
    if (debug) {
        new OrbitControls(camera2, renderer.domElement);
    }

    const socket = io("https://konalt.us.to:43958");

    var gameState = {};
    var players = [];
    var localPlayer;
    var localPlayerRep;

    function reloadPlayers() {
        players.forEach((plytr) => {
            scene.remove(plytr);
        });
        players = [];
        gameState.players.forEach((ply) => {
            let p = player(
                ply.position,
                ply.rotation,
                ply.id == socket.id && !debug
            );
            if (!p) return;
            if (ply.id == socket.id) {
                localPlayer = ply;
                localPlayerRep = p;
            }
            p.setRotationFromEuler(
                new THREE.Euler(0, (ply.cameraAngle2 * Math.PI) / 180, 0)
            );
            scene.add(p);
            players.push(p);
        });
        if (localPlayer) {
            localPlayerRep.add(camera);
            camera.position.y = 1.5;
            camera.rotation.y = Math.PI;
            camera.setRotationFromEuler(
                new THREE.Euler(
                    (localPlayer.cameraAngle * Math.PI) / 180,
                    Math.PI,
                    0
                )
            );
        }
    }

    var hk = [],
        jp = [],
        jr = [],
        tk = [];

    function getKey(key) {
        return hk.includes(key.toLowerCase());
    }

    function getKeyDown(key) {
        return jp.includes(key.toLowerCase());
    }

    function getKeyUp(key) {
        return jr.includes(key.toLowerCase());
    }

    document.onkeydown = function (k) {
        if (k.key != "F5" && k.key != "F12" && k.key != "F11")
            k.preventDefault();
        tk.push(k.key);
        if (!hk.includes(k.code.toLowerCase())) {
            jp.push(k.code.toLowerCase());
            hk.push(k.code.toLowerCase());
        }
    };

    document.onkeyup = function (k) {
        k.preventDefault();
        jr.push(k.code.toLowerCase());
        hk = hk.filter((hk) => {
            return hk != k.code.toLowerCase();
        });
    };

    socket.on("gs", (gs) => {
        gameState = gs;
        reloadPlayers();
    });
    socket.on("actions", (a) => {
        console.log(a);
        actions = a;
    });

    socket.on("plyd", (plyd) => {
        let parsed = parsePlayerData(plyd);
        gameState.players = parsed;
        reloadPlayers();
    });

    amb(0x404040);
    light(0, 5, -2.5);
    light(0, 5, 2.5);

    const gnd = cube(0, 0, 0, 40, 1, 40);

    var lastmovestring = "";
    function animate() {
        requestAnimationFrame(animate);
        var movestring = "";
        var bts = (b) => (b ? "1" : "0");
        movestring += bts(getKey("keyw"));
        movestring += bts(getKey("keya"));
        movestring += bts(getKey("keys"));
        movestring += bts(getKey("keyd"));
        if (lastmovestring != movestring) {
            lastmovestring = movestring;
            socket.emit("move", movestring);
        }

        renderer.render(scene, debug ? camera2 : camera);
        stats.update();
        jp = [];
        jr = [];
    }

    if (!debug) {
        renderer.domElement.addEventListener("click", async () => {
            if (!document.pointerLockElement)
                await renderer.domElement.requestPointerLock({
                    unadjustedMovement: true,
                });
        });
        renderer.domElement.addEventListener("mousemove", (me) => {
            if (document.pointerLockElement) {
                socket.emit("mouse", [me.movementX, me.movementY]);
            }
        });
    }
    function onWindowResize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();

        renderer.setSize(window.innerWidth, window.innerHeight);
    }
    window.addEventListener("resize", onWindowResize);

    animate();
}

function start() {
    init();
}

start();
