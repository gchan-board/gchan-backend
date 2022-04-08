const express = require('express');
const router = express.Router();
const marquees = require("../db/marquees.js");

/**
 * @openapi
 * /marquees:
 *   get:
 *     description: Returns latest 5 created marquees in the database.
 *     responses:
 *       200:
 *         description: Success.
 */
router.get("/", async (req, res) => {
  marquees.getAll().then((allMarquees) => {
    res.json(allMarquees);
  });
});


/**
 * @openapi
 * /marquees:
 *   post:
 *     description: Adds a new marquee item.
 *     consumes:
 *       - application/json
 *     parameters:
 *       - in: body
 *         name: marquee
 *         description: The marquee item to be created.
 *         required: true
 *         schema:
 *           type: object
 *           required:
 *             - content
 *           properties:      
 *             content:
 *               type: string
 *             has_url:
 *               type: boolean
 *             href:
 *               type: string
 *     responses:
 *       201:
 *         description: Created.
 *       400:
 *         description: Validation error. Check the \"details\" property of response object.
 *       500:
 *         description: Something went awfully wrong. Please report via <https://github.com/guites/gchan-backend/issues>
 */
router.post("/", async (req, res) => {
  marquees.postMarquee(req.body).then((marquee) => {
    res.status(marquee.status_code);
    res.json(marquee);
  });
});

module.exports = router;
