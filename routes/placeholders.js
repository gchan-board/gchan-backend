const express = require('express');
const router = express.Router();
const placeholders = require("../db/placeholders");
const fs = require('fs'); 
const path = require('path');

/**
 * @openapi
 * /placeholders:
 *   get:
 *     description: Redirects to a random registered placeholder image from the database.
 *     responses:
 *       200:
 *         description: Success.
 */
router.get("/", async function (req, res, next) {
  placeholders.getRandom().then((placeholder) => {
    const protc = req.secure ? "https://" : "http://";
    console.log(placeholder.results[0].file);
    res.redirect(
      protc + req.get("host") + "/placeholders/" + placeholder.results[0].file
    );
  });
});

/**
 * @openapi
 * /placeholders/{file}:
 *   get:
 *     description: Server a placeholder named {file} as an image.
 *     parameters:
 *      - in: path
 *        name: file
 *        schema:
 *          type: string
 *        required: true
 *        description: file name of the image to be served
 *     responses:
 *       200:
 *         description: Success.
 *       400:
 *         description: Invalid file argument.
 *       404:
 *          description: File not found.
 */
router.get("/:file", async function (req, res, next) {
  if (!req.params.file || !req.params.file.endsWith('.gif')) {
    res.status(400);
    return res.json({'details': 'Parameter {file} is required!'});
  }
  const filePath = path.join(__dirname + "/../placeholders/" + req.params.file);
  // TODO: getting fucked when someone sends "../" or something in the :file param
  if (!fs.existsSync(filePath)) {
    res.status(404);
    return res.json("'message': 'File not found.'");
  }
  return res.sendFile(filePath);
});

module.exports = router;
