const {Server} = require("socket.io");
const https = require("https");
const fs = require("fs");
var _ammoInitalizerFunc = require("@enable3d/ammo-on-nodejs/ammo/ammo.js");
const {Physics, ServerClock} = require("@enable3d/ammo-on-nodejs");
const THREE = require("../libs/three.min");

class ServerScene {
    constructor() {
        this.init();
        this.create();
        this.state = {
            players: [],
        };
    }
    init() {
        console.log("Ammo", new Ammo.btVector3(1, 2, 3).y() === 2);
        this.physics = new Physics({});
        this.factory = this.physics.factory;

        io.on("connection", (socket) => {
            socket.emit("gs", this.state);
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
        clock.disableHighAccuracy();
        clock.onTick((delta) => this.update(delta));
    }
    addPlayer(name) {
        const physObject = this.physics.add.box({
            name: "Player_" + name,
            mass: 1,
            x: 0,
            y: 10,
            z: 0,
        });
        let ply = {
            name: name,
            id: name,
            position: {
                x: 0,
                y: 10,
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
        };
        this.state.players.push(ply);
        io.emit("gs", this.state);
        return ply;
    }
    removePlayer(name) {
        let p = this.state.players.find((p) => p.id == name);
        this.physics.destroy(p.physics.body);
        this.state.players = this.state.players.filter((p) => p.id != name);
    }
    update(delta) {
        if (!this.state.players[0]) return;
        this.physics.update(delta * 1000);

        for (const ply of this.state.players) {
            ply.position.x = ply.physics.position.x - ply.offset.x;
            ply.position.y = ply.physics.position.y - ply.offset.y;
            ply.position.z = ply.physics.position.z - ply.offset.z;
            ply.rotation.x = ply.physics.quaternion.x;
            ply.rotation.y = ply.physics.quaternion.y;
            ply.rotation.z = ply.physics.quaternion.z;
            ply.rotation.w = ply.physics.quaternion.w;

            _v1.copy(new THREE.Vector3(0, 0, 1)).applyQuaternion(
                ply.physics.quaternion
            );
            _v2.copy(new THREE.Vector3(1, 0, 0)).applyQuaternion(
                ply.physics.quaternion
            );
            ply.physics.body.ammo.setLinearVelocity(
                new Ammo.btVector3(
                    _v1.x * ply.move[1] + _v2.x * ply.move[0],
                    ply.physics.body.ammo.getLinearVelocity().y() / 10,
                    _v1.z * ply.move[1] + _v2.z * ply.move[0]
                ).op_mul(10)
            );
            ply.physics.body.ammo.setAngularVelocity(
                new Ammo.btVector3(0, ply.look[1] * 5, 0)
            );
        }

        io.emit("gs", this.state);
    }
}

let _v1 = new THREE.Vector3();
let _v2 = new THREE.Vector3();
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
