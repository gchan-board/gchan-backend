const express = require("express");
//middleware
const cors = require("cors");
const bodyParser = require("body-parser");
const morgan = require("morgan");

const app = express();

const messagesRouter = require('./routes/messages');
const repliesRouter = require('./routes/replies');
const marqueesRouter = require('./routes/marquees');
const placeholdersRouter = require('./routes/placeholders');
const imgurRouter = require('./routes/imgur');

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
app.use('/marquees', marqueesRouter);
app.use('/placeholders', placeholdersRouter);
app.use('/imgur', imgurRouter);

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

const port = process.env.PORT || 4450;
app.listen(port, () => {
  console.log(`Listening on ${port}.`);
});
