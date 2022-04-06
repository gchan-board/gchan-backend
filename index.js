const express = require("express");
//middleware
const cors = require("cors");
const bodyParser = require("body-parser");
const morgan = require("morgan");
const fs = require('fs'); 

const unless = function (path, middleware) {
  return function (req, res, next) {
    if (path.includes(req.path)) {
      return next();
    } else {
      return middleware(req, res, next);
    }
  };
};

const fileUpload = require("express-fileupload");

// para receber imagens/videos e enviar pro imgur
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
const upload = multer({ storage });

const messages = require("./db/messages");
const marquees = require("./db/marquees");
const replies = require("./db/replies");
const placeholders = require("./db/placeholders");
const imgur = require("./db/imgur");
const app = express();

// auto generated open-api for express -- start
const swaggerJsdoc = require('swagger-jsdoc');
const jsDocsOptions = {
  swaggerDefinition: {
    info: {
      title: 'GCHAN API',
      version: '1.0.0',
      description: 'Documentation for the [gchan](https://gchan.com.br) API.\n More information in the project\'s [github repository](https://github.com/guites/gchan-backend).\nReach out on twitter! <https://twitter.com/gui_garcia67>',
    },
  },
  apis: ['index.js'],
};
const jsDocsSpecs = swaggerJsdoc(jsDocsOptions);
const swaggerUi = require('swagger-ui-express');
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(jsDocsSpecs));
// auto generated open-api for express -- end

app.use(unless(["/videoupload", "/gifupload", "/imgupload"], fileUpload()));

app.use(morgan("tiny"));

const corsOptions = {
  origin: process.env.CORS_ORIGIN_URL,
  credentials: true,
};
app.use(cors(corsOptions));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// para receber imagens/videos e enviar pro imgur
app.use(express.static("uploads"));

/**
 * @openapi
 * /:
 *   get:
 *     description: Default route to test API status.
 *     responses:
 *       200:
 *         description: Points user to the project URL and documentation.
 */
app.get("/", (req, res) => {
  res.json({
    message: "This is the API for the gchan project <https://gchan.com.br>. Please visit </api-docs> for more information.",
  });
});

/**
 * @openapi
 * /messages:
 *   get:
 *     description: Returns all existing posts in the database.
 *     responses:
 *       200:
 *         description: Success.
 */
app.get("/messages", async (req, res) => {
  messages.getAll().then((allMessages) => {
    res.json(allMessages);
  });
});

/**
 * @openapi
 * /messages/{offset}:
 *   get:
 *     description: Returns posts from the database, offset by {offset}, with a limited of 15.
 *     parameters:
 *      - in: path
 *        name: offset
 *        schema:
 *          type: integer
 *        required: true
 *        description: number of posts to be skipped when fetching from database
 *     responses:
 *       200:
 *         description: Success.
 */
app.get("/messages/:offset", async (req, res) => {
  messages.getAllOffset(req.params.offset).then((messages) => {
    res.json(messages);
  });
});

/**
 * @openapi
 * /message/{id}:
 *   get:
 *     description: Return post with an id of {id}.
 *     parameters:
 *      - in: path
 *        name: id
 *        schema:
 *          type: integer
 *        required: true
 *        description: Numeric id of post to be retrieved
 *     responses:
 *       200:
 *         description: Success.
 */
app.get("/message/:id", async (req, res) => {
  const ids = req.params.id.split(",");
  if (ids.length > 1) {
    messages.getManyById(ids).then((messages) => res.json(messages));
  }
  messages.getOne(req.params.id).then((message) => res.json(message));
});

/**
 * @openapi
 * /replies:
 *   get:
 *     description: Returns all existing replies in the database.
 *     responses:
 *       200:
 *         description: Success.
 */
app.get("/replies", async (req, res) => {
  replies.getAll().then((allReplies) => {
    res.json(allReplies);
  });
});

/**
 * @openapi
 * /replies/{post_id}:
 *   get:
 *     description: Return all replies from post with an id of {post_id}.
 *     parameters:
 *      - in: path
 *        name: post_id
 *        schema:
 *          type: integer
 *        required: true
 *        description: Numeric id of post which you want the replies of
 *     responses:
 *       200:
 *         description: Success.
 *       400:
 *         description: Validation error. Check the \"details\" property of response object.
 *       500:
 *         description: unexpected error. Please report via <https://github.com/guites/gchan-backend/issues>.
 */
app.get("/replies/:post_id", async (req, res) => {
  // TODO: correctly return status codes
  replies
    .getReplyFromMessageId(req.params.post_id)
    .then((replies) => {
      res.status(replies.status_code);
      res.json(replies.results);
    });
});

/**
 * @openapi
 * /reply/{id}:
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
app.get("/reply/:id", async (req, res) => {
  // TODO: correctly return status codes for error, 404, etc
  replies.getOne(req.params.id).then((reply) => res.json(reply));
});

/**
 * @openapi
 * /marquee:
 *   get:
 *     description: Returns latest 5 created marquees in the database.
 *     responses:
 *       200:
 *         description: Success.
 */
app.get("/marquee", async (req, res) => {
  marquees.getAll().then((allMarquees) => {
    res.json(allMarquees);
  });
});

/**
 * @openapi
 * /placeholders:
 *   get:
 *     description: Redirects to a random registered placeholder image from the database.
 *     responses:
 *       200:
 *         description: Success.
 */
app.get("/placeholders", async function (req, res, next) {
  placeholders.getRandom().then((placeholder) => {
    const protc = req.secure ? "https://" : "http://";
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
 *       404:
 *          description: File not found.
 */
app.get("/placeholders/:file", function (req, res, next) {
  const filePath = __dirname + "/placeholders/" + req.params.file;
  if (!fs.existsSync(filePath)) {
    res.status(404); res.json("'message': 'File not found.'");
  }
  res.sendFile(filePath);
});

/**
 * @openapi
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
 *             subject:
 *               type: string
 *             message:
 *               type: string
 *             imageURL:
 *               type: string
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
app.post("/messages", async (req, res) => {
  messages.postMessage(req).then((message) => {
    res.status(message.status_code);
    res.json(message);
  });
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
 *         description: Something went awfully wrong. Please report to <https://twitter.com/gui_garcia67>
 */
app.post("/replies", async (req, res) => {
  replies.postReply(req).then((reply) => {
    res.status(reply.status_code);
    res.json(reply);
  });
});

app.post("/marquee", async (req, res) => {
  marquees.postMarquee(req.body).then((marquee) => {
    res.json(marquee);
  });
});

app.post("/imgupload", upload.single("image"), async (req, res) => {
  imgur.postImg(req.file.path, req.file.originalname).then((resp) => {
    res.json(resp);
  });
});

app.post("/gifupload", upload.single("image"), async (req, res) => {
  imgur.postGif(req.file.path, req.file.originalname).then((resp) => {
    res.json(resp);
  });
});

app.post("/videoupload", upload.single("video"), async (req, res) => {
  imgur.postVideo(req.file.path, req.file.originalname).then((resp) => {
    res.json(resp);
  });
});

// TODO: remove this
app.delete("/logout", (req, res) => {
  req.logOut();
  res.json({ login: false });
});

// TODO: remove this
app.delete("/message/:id", (req, res) => {
  if (req.isAuthenticated()) {
    messages.deleteMessage(req.params.id).then((msg) => {
      res.json(msg);
    });
  } else {
    res.status(401).send("Necessário login via aplicação.");
  }
});

app.delete("/imgur/:deletehash", (req, res) => {
  imgur.deleteImgur(req.params.deletehash).then((resp) => {
    res.json(resp);
  });
});

const port = process.env.PORT || 4450;
app.listen(port, () => {
  console.log(`Listening on ${port}.`);
});