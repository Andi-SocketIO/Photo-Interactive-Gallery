const data = require("./settings.js");

module.exports = {
   init: (app, fs) => {
      return {
         postImage: (key) => {
            app.post(key, (req, res) => {
               const senderId = req.body.senderId;
               const dataURI = req.body.dataURI; // Assuming the data URI is sent in the request body

               if (typeof senderId == "undefined") {
                  res.status(400).send("Check Body request" + senderId);
                  return;
               }

               // Extract the base64 data from the data URI
               const base64Data = dataURI.replace(
                  /^data:image\/png;base64,/,
                  ""
               );

               // Generate a unique file name for the saved image
               const fileName = `image_${senderId}.png`;

               if (!fs.existsSync("uploads")) {
                  fs.mkdirSync("uploads", { recursive: true });
               }

               // Save the base64 data as a PNG file
               fs.writeFile(
                  `uploads/${fileName}`,
                  base64Data,
                  "base64",
                  (err) => {
                     if (err) {
                        return res.status(500).send("Error saving the file.");
                     }
                     res.status(200).json({
                        imageName: fileName,
                     });
                  }
               );
            });
         },
      };
   },
};
