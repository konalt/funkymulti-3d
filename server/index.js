const {Server} = require("socket.io");
const app = require("express")();
const https = require("https");
const fs = require("fs");

var options = {
    key: fs.readFileSync(
        "C:/Certbot/live/konalt.us.to-0002/privkey.pem",
        "utf-8"
    ),
    cert: fs.readFileSync(
        "C:/Certbot/live/konalt.us.to-0002/fullchain.pem",
        "utf-8"
    ),
};

var server = https.createServer(options, app);

const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
    },
});

io.on("connection", (socket) => {
    console.log("=> " + socket.id);
    socket.on("disconnect", () => {
        console.log("<= " + socket.id);
    });
});

server.listen(43958, () => {
    console.log("Listening!");
});
