const {Server} = require("socket.io");
const io = new Server(server);
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
server.listen(43958, () => {
    console.log("Listening!");
});

io.on("connection", (socket) => {
    console.log("=> " + socket.id);
    socket.on("disconnect", () => {
        console.log("<= " + socket.id);
    });
});
