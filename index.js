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

const marquees = require("./db/marquees");
const placeholders = require("./db/placeholders");
const imgur = require("./db/imgur");
const app = express();
const messagesRouter = require('./routes/messages');
const repliesRouter = require('./routes/replies');

// auto generated open-api for express -- start
const swaggerJsdoc = require('swagger-jsdoc');
const jsDocsOptions = {
  swaggerDefinition: {
    info: {
      title: 'GCHAN API',
      version: '1.0.0',
      description: 'Documentation for the [gchan](https://gchan.com.br) API.\n\n More information in the project\'s [github repository](https://github.com/guites/gchan-backend).\n\n Reach out on twitter <https://twitter.com/gui_garcia67>!',
      contact: {
        name: 'guilherme garcia',
        url: 'https://guilhermegarcia.dev'
      },
      servers: [
        {
          url: 'http://localhost:4450',
          description: 'Development server',
        },
        {
          url: 'https://gchan-message-board.herokuapp.com',
          description: 'Production server',
        }
      ]
    },
  },
  apis: ['./routes/*.js', 'index.js'],
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
app.use('/messages', messagesRouter);
app.use('/replies', repliesRouter);

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
 * /marquee:
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
app.post("/marquee", async (req, res) => {
  marquees.postMarquee(req.body).then((marquee) => {
    res.status(marquee.status_code);
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

app.delete("/imgur/:deletehash", (req, res) => {
  imgur.deleteImgur(req.params.deletehash).then((resp) => {
    res.json(resp);
  });
});

const port = process.env.PORT || 4450;
app.listen(port, () => {
  console.log(`Listening on ${port}.`);
});