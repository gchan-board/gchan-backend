const express = require('express');
const router = express.Router();
const replies = require("../db/replies");

/**
 * @openapi
 * /replies:
 *   get:
 *     description: Returns all existing replies in the database.
 *     responses:
 *       200:
 *         description: Success.
 */
router.get("/", async (req, res) => {
  replies.getAll().then((allReplies) => {
    res.json(allReplies);
  });
});

/**
 * @openapi
 * /replies/{id}:
 *   get:
 *     description: Returns reply with an id of {id}.
 *     parameters:
 *      - in: path
 *        name: id
 *        schema:
 *          type: integer
 *        required: true
 *        description: Numeric id of reply to be retrieved
 *     responses:
 *       200:
 *         description: Success.
 */
router.get("/reply/:id", async (req, res) => {
  // TODO: correctly return status codes for error, 404, etc
  replies.getOne(req.params.id).then((reply) => res.json(reply));
});

/**
 * @openapi
 * /replies:
 *   post:
 *     description: Adds a new reply to a post.
 *     consumes:
 *       - application/json
 *     parameters:
 *       - in: body
 *         name: reply
 *         description: The reply to add to a post.
 *         required: true
 *         schema:
 *           type: object
 *           required:
 *             - content
 *             - message_id
 *           properties:      
 *             username:
 *               type: string
 *             content:
 *               type: string
 *             imageURL:
 *               type: string
 *             user_id:
 *               type: integer
 *             message_id:
 *               type: integer
 *     responses:
 *       201:
 *         description: Created.
 *       400:
 *         description: Validation error. Check the \"details\" property of response object.
 *       404:
 *         description: The message you are replying to does not exists.
 *       500:
 *         description: Something went awfully wrong. Please report via <https://github.com/guites/gchan-backend/issues>.
 */
router.post("/", async (req, res) => {
  replies.postReply(req).then((reply) => {
    res.status(reply.status_code);
    res.json(reply);
  });
});

module.exports = router;