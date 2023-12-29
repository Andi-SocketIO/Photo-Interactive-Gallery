var fs = require("fs");
var https = require("https");
const bodyParser = require("body-parser");
const { createClient } = require("redis");
const { Server } = require("socket.io");
const express = require("express");
const cors = require("cors");
const { log } = require("console");
const connection_handler = require("./modules/connection_handler.js");
const image = require("./modules/image.js");
const path = require("path");
const settings = require("./modules/settings.js");

const app = express();
app.use(cors());
app.use(
   bodyParser.urlencoded({
      extended: true,
      limit: "3mb",
      parameterLimit: 50000,
   })
);
app.use(bodyParser.json({ limit: "3mb" }));

const imagesFolder = path.join(__dirname, "uploads");
app.use("/images", express.static(imagesFolder));

var privateKey = fs.readFileSync(settings.privateKey_PATH, "utf8");
var certificate = fs.readFileSync(settings.certificate_PATH, "utf8");
var credentials = { key: privateKey, cert: certificate };
var httpsServer = https.createServer(credentials, app);

var HTTP = httpsServer;
var PORT = 55500;

const io = new Server(HTTP, {
   cors: {
      credentials: true,
      origin: "*",
      methods: ["GET", "POST", "PATCH", "DELETE"],
   },
});

io.on("connection", connection);

HTTP.listen(PORT, () => {
   console.log("HTTP Server running on port " + PORT);
});

function connection(socket) {
   connection_handler.init(socket, io, fs);
}

const imageHandler = image.init(app, fs);
imageHandler.postImage("/uploadDataURI");
