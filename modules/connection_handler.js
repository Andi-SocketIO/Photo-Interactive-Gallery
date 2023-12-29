const settings = require("./settings.js");

const onlineControllerURL = settings.onlineController_URL;
const offlineControllerURL = settings.offlineController_URL;

const controllerURL = offlineControllerURL;

var users = {};
var games = {};

games["AKIAKI"] = {
   machineId: "DADA",
   controllerId: "",
};

module.exports = {
   init: (socket, io, fs) => {
      users[socket.id] = "";

      socket.on("createGame", () => {
         let newRoomCode = generateRandomString(3, true);
         while (newRoomCode in games) {
            newRoomCode = generateRandomString(3, true);
         }

         socket.join(newRoomCode);
         io.to(newRoomCode).emit(
            "createGame",
            controllerURL + "?roomCode=" + newRoomCode
         );

         games[newRoomCode] = {
            machineId: socket.id,
            controllerId: "",
         };

         if (socket.id in users) {
            users[socket.id] = newRoomCode;
         }
      });

      socket.on("joinGame", (room) => {
         let isRoomAvailable = room in games;

         if (!isRoomAvailable) {
            io.to(socket.id).emit(
               "joinGame",
               JSON.stringify({
                  status: "failed",
                  message: "Booth Not Found.",
               })
            );
            return;
         }

         if (games[room].controllerId != "") {
            io.to(socket.id).emit(
               "joinGame",
               JSON.stringify({
                  status: "failed",
                  message: "Booth is being used.",
               })
            );
            return;
         }

         socket.join(room);
         io.to(room).emit(
            "joinGame",
            JSON.stringify({
               socketId: socket.id,
               status: "succes",
               message: "Connected.",
               room: room,
            })
         );

         games[room].controllerId = socket.id;

         if (socket.id in users) {
            users[socket.id] = room;
         }
      });

      socket.on("throwImage", (data) => {
         const fileName = data.fileName;
         const room = data.room;

         const filePath = `uploads/${fileName}`;

         // Reading file content asynchronously
         fs.readFile(filePath, "utf8", (err, data) => {
            if (err) {
               console.error("Error reading file:", err);
               io.to(room).emit("throwImage", "failed");
               return;
            }

            const fullURL =
               settings.nodeBase_URL +
               ":" +
               settings.PORT +
               "/images/" +
               fileName;

            io.to(room).emit("incomingImageURL", fullURL);
            io.to(room).emit("throwImage", "success");
         });
      });

      socket.on("disconnect", () => {
         const disconnectedId = socket.id;

         let isPlayerAvailable = disconnectedId in users;

         if (!isPlayerAvailable) return;

         var userRoomId = users[disconnectedId];
         if (userRoomId != "") {
            if (!(userRoomId in games)) return;
            const game = games[userRoomId];

            if (game.machineId == disconnectedId) {
               delete games[userRoomId];
            } else {
               games[userRoomId].controllerId = "";
            }
            delete users[disconnectedId];
         } else {
            delete users[disconnectedId];
         }
      });
   },
};

function generateRandomString(length, isUpperCase) {
   let result = "";
   const charCodeStart = isUpperCase ? 65 : 97;
   const charCodeEnd = isUpperCase ? 90 : 122;

   for (let i = 0; i < length; i++) {
      const randomCharCode =
         Math.floor(Math.random() * (charCodeEnd - charCodeStart + 1)) +
         charCodeStart;
      result += String.fromCharCode(randomCharCode);
   }

   return result;
}
