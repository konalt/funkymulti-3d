const {Server} = require("socket.io");
const https = require("https");
const fs = require("fs");
var _ammoInitalizerFunc = require("@enable3d/ammo-on-nodejs/ammo/ammo.js");
const {Physics, ServerClock} = require("@enable3d/ammo-on-nodejs");
const THREE = require("../libs/three.min");

var sens = 2;

function encodePlayerData(plyd) {
    var o = "";
    plyd.forEach((ply) => {
        o += [
            ply.name,
            ply.id,
            [ply.position.x, ply.position.y, ply.position.z].join(","),
            [
                ply.rotation.x,
                ply.rotation.y,
                ply.rotation.z,
                ply.rotation.w,
            ].join(","),
            ply.move.join(","),
            ply.look.join(","),
            "null",
            [ply.offset.x, ply.offset.y, ply.offset.z].join(","),
            ply.cameraAngle,
            ply.cameraAngle2,
            ply.action,
        ].join(":");
        o += "\n";
    });
    return o.trim();
}
function encodeBulletData(buld) {
    var o = "";
    buld.forEach((bul) => {
        o += [[ply.position.x, ply.position.y, ply.position.z].join(",")].join(
            ":"
        );
        o += "\n";
    });
    return o.trim();
}

function roundToPlaces(value, decimals = 5) {
    return Math.round(value * (10 ^ decimals)) / (10 ^ decimals);
}

const actions = require("./actions.json");

class ServerScene {
    constructor() {
        this.init();
        this.create();
        this.state = {
            players: [],
            bullets: [],
        };
    }
    init() {
        console.log("Ammo", new Ammo.btVector3(1, 2, 3).y() === 2);
        this.physics = new Physics({});
        this.factory = this.physics.factory;

        io.on("connection", (socket) => {
            socket.emit("gs", this.state);
            socket.emit("actions", actions);
            let ply = this.addPlayer(socket.id);
            socket.on("move", (str) => {
                let horz = 0;
                let vert = 0;
                if (str[0] == "1") vert++;
                if (str[1] == "1") horz++;
                if (str[2] == "1") vert--;
                if (str[3] == "1") horz--;
                ply.move = [horz, vert];
                horz = 0;
                vert = 0;
                if (str[4] == "1") vert++;
                if (str[5] == "1") horz++;
                if (str[6] == "1") vert--;
                if (str[7] == "1") horz--;
                ply.look = [horz, vert];
            });
            socket.on("shoot", () => {
                console.log("bangbangbang");
                const physObject = this.physics.add.sphere({
                    name: "Bullet_" + ply.id,
                    mass: 0,
                    radius: 0.2,
                    x: ply.position.x,
                    y: ply.position.y + 1.6,
                    z: ply.position.z,
                });
                let bul = {
                    owner: ply.id,
                    position: {
                        x: ply.position.x,
                        y: ply.position.y + 1.6,
                        z: ply.position.z,
                    },
                    rotation: {
                        x: 0,
                        y: 0,
                        z: 0,
                        w: 0,
                    },
                    physics: physObject,
                };
                bul.physics.setRotationFromEuler(
                    new THREE.Euler(
                        (ply.cameraAngle * Math.PI) / 180,
                        (ply.cameraAngle2 * Math.PI) / 180,
                        0
                    )
                );
                _v1.copy(new THREE.Vector3(0, 0, 1)).applyQuaternion(
                    bul.physics.quaternion
                );
                _v2.copy(new THREE.Vector3(0, 1, 0)).applyQuaternion(
                    bul.physics.quaternion
                );
                _v3.copy(new THREE.Vector3(1, 0, 0)).applyQuaternion(
                    bul.physics.quaternion
                );
                bul.physics.body.ammo.setLinearVelocity(
                    // is there a better way to do this?
                    new Ammo.btVector3(
                        _v1.x + _v2.x + _v3.x,
                        _v1.y + _v2.y + _v3.y,
                        _v1.z + _v2.z + _v3.z
                    ).op_mul(0)
                );
            });
            socket.on("mouse", ([mouseX, mouseY]) => {
                ply.cameraAngle += (mouseY / 20) * sens;
                ply.cameraAngle2 -= (mouseX / 20) * sens;
            });
            socket.on("disconnect", () => {
                this.removePlayer(socket.id);
            });
        });
    }
    create() {
        this.physics.add.box({
            name: "ground",
            width: 40,
            depth: 40,
            collisionFlags: 2,
            mass: 0,
        });

        const clock = new ServerClock();
        //clock.disableHighAccuracy();
        clock.onTick((delta) => this.update(delta));
    }
    addPlayer(name) {
        const physObject = this.physics.add.box({
            name: "Player_" + name,
            mass: 1,
            x: 0,
            y: 2,
            z: 0,
        });
        let ply = {
            name: name,
            id: name,
            position: {
                x: 0,
                y: 2,
                z: 0,
            },
            rotation: {
                x: 0,
                y: 0,
                z: 0,
                w: 0,
            },
            move: [0, 0],
            look: [0, 0],
            physics: physObject,
            offset: {x: 0, y: 0.5, z: 0},
            cameraAngle: 0,
            cameraAngle2: 0,
            action: "idle",
            time: Date.now(),
        };
        this.state.players.push(ply);
        io.emit("plyd", encodePlayerData(this.state.players));
        return ply;
    }
    removePlayer(name) {
        let p = this.state.players.find((p) => p.id == name);
        this.physics.destroy(p.physics.body);
        this.state.players = this.state.players.filter((p) => p.id != name);
    }
    update(delta) {
        if (!this.state.players[0]) return;
        for (const ply of this.state.players) {
            ply.physics.body.ammo.setAngularVelocity(
                0,
                ply.physics.body.ammo.getAngularVelocity() -
                    (ply.cameraAngle2 * Math.PI) / 180,
                0
            );
        }
        this.physics.update(delta * 1000);

        for (const ply of this.state.players) {
            ply.position.x = roundToPlaces(
                ply.physics.position.x - ply.offset.x,
                7
            );
            ply.position.y = roundToPlaces(
                ply.physics.position.y - ply.offset.y,
                7
            );
            ply.position.z = roundToPlaces(
                ply.physics.position.z - ply.offset.z,
                7
            );
            ply.rotation.x = roundToPlaces(ply.physics.quaternion.x);
            ply.rotation.y = roundToPlaces(ply.physics.quaternion.y);
            ply.rotation.z = roundToPlaces(ply.physics.quaternion.z);
            ply.rotation.w = roundToPlaces(ply.physics.quaternion.w);

            ply.physics.setRotationFromEuler(
                new THREE.Euler(0, 0 + (ply.cameraAngle2 * Math.PI) / 180, 0)
            );
            _v1.copy(new THREE.Vector3(0, 0, 1)).applyQuaternion(
                ply.physics.quaternion
            );
            _v2.copy(new THREE.Vector3(1, 0, 0)).applyQuaternion(
                ply.physics.quaternion
            );
            ply.physics.body.ammo.setAngularVelocity(0, 0, 0);
            ply.physics.body.ammo.setLinearVelocity(
                new Ammo.btVector3(
                    _v1.x * ply.move[1] + _v2.x * ply.move[0],
                    ply.physics.body.ammo.getLinearVelocity().y() / 10,
                    _v1.z * ply.move[1] + _v2.z * ply.move[0]
                ).op_mul(10)
            );
        }
        for (const bul of this.state.bullets) {
            bul.position.x = roundToPlaces(bul.physics.position.x, 7);
            bul.position.y = roundToPlaces(bul.physics.position.y, 7);
            bul.position.z = roundToPlaces(bul.physics.position.z, 7);
            bul.rotation.x = roundToPlaces(bul.physics.quaternion.x);
            bul.rotation.y = roundToPlaces(bul.physics.quaternion.y);
            bul.rotation.z = roundToPlaces(bul.physics.quaternion.z);
            bul.rotation.w = roundToPlaces(bul.physics.quaternion.w);
        }

        io.emit("buld", encodeBulletData(this.state.bullets));
        io.emit("plyd", encodePlayerData(this.state.players));
    }
}

let _v1 = new THREE.Vector3();
let _v2 = new THREE.Vector3();
let _v3 = new THREE.Vector3();
let io;

_ammoInitalizerFunc().then((ammo) => {
    globalThis.Ammo = ammo;

    const httpsServer = https.createServer({
        key: fs.readFileSync(
            "C:/Certbot/live/konalt.us.to-0002/privkey.pem",
            "utf8"
        ),
        cert: fs.readFileSync(
            "C:/Certbot/live/konalt.us.to-0002/fullchain.pem",
            "utf8"
        ),
    });

    io = new Server(httpsServer, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"],
        },
        pingInterval: 5000,
    });

    httpsServer.listen(43958);

    new ServerScene();
});
