const express = require('express');
const router = express.Router();
const imgur = require("../db/imgur");

// handles saving images/videos
const multer = require("multer");
const uuid = require("uuid").v4;
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads");
  },
  filename: (req, file, cb) => {
    const { originalname } = file;
    cb(null, `${uuid()}-${originalname}`);
  },
});

const uploadHandler = multer({ storage }).single('file');
/**
 * @swagger
 * /imgur/images:
 *   post:
 *     summary: Uploads an image or gif to imgur.
 *     consumes:
 *       - multipart/form-data
 *     parameters:
 *       - in: formData
 *         name: file
 *         type: file
 *         description: The file to upload.
 *     responses:
 *      200:
 *         description: Image created on imgur.
 *      400:
 *         description: Validation error. Check the \"details\" property of response object.
 *      500:
 *         description: Unexpected error. Please report via <https://github.com/guites/gchan-backend/issues>.
 */
router.post("/images", async (req, res) => {
  uploadHandler(req, res, function(err) {
    if (err) {
      let details;
      switch (err.message.trim()) {
        case 'Unexpected field':
          res.status(400);
          details = `Unexpected field "${err.field}". Please check documentation at /api-docs/#/default/post_imgur_images`
          break;
        case 'Multipart: Boundary not found':
          res.status(400);
          details = 'Please check that your file is not corrupted.';
          break;
        default:
          res.status(500);
          details = 'Unexpected error. Please report via <https://github.com/guites/gchan-backend/issues>';
      }
      return res.json({ details });
    }
    if (!req.file || req.file == '') {
      res.status(400);
      return res.json({ details: "We expect an image file!" });
    }
    imgur.postImg(req.file.path, req.file.originalname).then((resp) => {
      return res.json(resp);
    });
  });
});

/**
 * @swagger
 * /imgur/videos:
 *   post:
 *     summary: Uploads a short video to imgur. Please note that video processing may take a while. You are expected to poll the /imgur endpoint for the current upload status.
 *     consumes:
 *       - multipart/form-data
 *     parameters:
 *       - in: formData
 *         name: file
 *         type: file
 *         description: The file to upload.
 *     responses:
 *      200:
 *         description: Video uploaded to imgur.
 *      400:
 *         description: Validation error. Check the \"details\" property of response object.
 *      500:
 *         description: Unexpected error. Please report via <https://github.com/guites/gchan-backend/issues>.
 */
router.post("/videos", async (req, res) => {
  // TODO: validate file type and size
  uploadHandler(req, res, function(err) {
    if (err) {
      let details;
      switch (err.message.trim()) {
        case 'Unexpected field':
          res.status(400);
          details = `Unexpected field "${err.field}". Please check documentation at /api-docs/#/default/post_imgur_images`
          break;
        case 'Multipart: Boundary not found':
          res.status(400);
          details = 'Please check that your file is not corrupted.';
          break;
        default:
          res.status(500);
          details = 'Unexpected error. Please report via <https://github.com/guites/gchan-backend/issues>';
      }
      return res.json({ details });
    }
    if (!req.file || req.file == '') {
      res.status(400);
      return res.json({ details: "We expect a video file!" });
    }
    imgur.postVideo(req.file.path, req.file.originalname).then((resp) => {
      res.json(resp);
    });
  });
});

/**
 * @swagger
 * /imgur/delete/{deletehash}:
 *   delete:
 *     summary: Deletes file from imgur using its hash.
 *     parameters:
 *       - in: path
 *         name: deletehash
 *         type: string
 *         description: The file specific delete hash generated by imgur on creation.
 *     responses:
 *      200:
 *         description: File successfully deleted.
 *      400:
 *         description: Validation error. Check the \"details\" property of response object.
 *      500:
 *         description: Unexpected error. Please report via <https://github.com/guites/gchan-backend/issues>.
 */
router.delete("/delete/:deletehash", (req, res) => {
  imgur.deleteImgur(req.params.deletehash).then((resp) => {
    res.status(resp.status);
    res.json(resp);
  });
});

/**
 * @swagger
 * /imgur/{imgur_id}:
 *   get:
 *     summary: Get information about given imgur upload by id.
 *     parameters:
 *       - in: path
 *         name: imgur_id
 *         type: string
 *         description: The file id generated by imgur on creation.
 *     responses:
 *      200:
 *         description: Information successfully returned from imgur server.
 *      404:
 *         description: File not found on imgur server.
 *      500:
 *         description: Unexpected error. Please report via <https://github.com/guites/gchan-backend/issues>.
 */
router.get("/:imgur_id", (req, res) => {
  imgur.getInformation(req.params.imgur_id).then((resp) => {
    res.status(resp.status);
    res.json(resp);
  });
});

module.exports = router;
