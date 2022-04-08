const express = require('express');
const router = express.Router();
const messages = require("../db/messages");

/**
 * @swagger
 * /messages:
 *   get:
 *     description: Returns posts from the database, with an optional offset. If the offset is defined, results are limited to 15.
 *     parameters:
 *      - in: query
 *        name: offset
 *        schema:
 *          type: integer
 *        required: false
 *        description: number of posts to be skipped when fetching from database
 *     responses:
 *      200:
 *         description: Success.
 *      400:
 *         description: Validation error. Check the \"details\" property of response object.
 *      500:
 *         description: Unexpected error. Please report via <https://github.com/guites/gchan-backend/issues>.
 */
router.get("/", async (req, res) => {
    messages.getAll(req.query.offset).then((messages) => {
        res.status(messages.status_code);
        res.json(messages);
    });
});

/**
 * @swagger
 * /messages/{id}:
 *  get:
 *     description: Returns post with an id of {id}.
 *     parameters:
 *      - in: path
 *        name: id
 *        schema:
 *          type: integer
 *        required: true
 *        description: Numeric id of post to be retrieved
 *     responses:
 *      200:
 *         description: Success.
 *      400:
 *         description: Validation error. Check the \"details\" property of response object.
 *      500:
 *         description: Unexpected error. Please report via <https://github.com/guites/gchan-backend/issues>.
 */
router.get("/:id", async (req, res) => {
    messages.getOne(req.params.id).then((message) => {
        res.status(message.status_code);
        res.json(message)
    });
});

/**
 * @swagger
 * /messages:
 *   post:
 *     description: Adds a new post.
 *     consumes:
 *       - application/json
 *     parameters:
 *       - in: body
 *         name: post
 *         description: The post to create.
 *         required: true
 *         schema:
 *           type: object
 *           required:
 *             - message
 *           properties:             
 *             username:
 *               type: string
 *               example: Bob
 *             subject:
 *               type: string
 *               example: What I'm thinking about
 *             message:
 *               type: string
 *               example: Random thoughts
 *             imageURL:
 *               type: string
 *               example: https://cdn2.thecatapi.com/images/l8i15DHKP.jpg
 *             giphyURL:
 *               type: string
 *             options:
 *               type: string
 *             user_id:
 *               type: integer
 *             gif_origin:
 *               type: string
 *     responses:
 *       201:
 *         description: Created.
 *       400:
 *         description: Validation error. Check the \"details\" property of response object.
 *       500:
 *         description: An unexpected situation arised. Run to the hills.
 */
router.post("/", async (req, res) => {
  messages.postMessage(req).then((message) => {
    res.status(message.status_code);
    res.json(message);
  });
});

module.exports = router;