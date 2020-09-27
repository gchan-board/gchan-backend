const express = require('express');
//middleware below
const cors = require('cors');
const bodyParser = require('body-parser');
const morgan = require('morgan');

const messages = require('./db/messages'); //require é no nome do arquivo sem a extensão
const db =  require('./db/connection');
const app = express();

app.use(morgan('tiny'));
app.use(cors());
app.use(bodyParser.json());

app.get('/',(req,res) => {
	res.json({
		message: "fullstack msg board."
	})
});

app.get('/messages', async (req,res) => {
	messages.getAll().then((allMessages) => {
		res.json(allMessages);
	});
});

app.post('/messages', async (req,res) => {

	messages.postMessage(req).then((message) => {
		res.json(message);
	});
	
});


const port = process.env.PORT || 4450;
app.listen(port, () => {
	console.log(`Listening on ${port}.`);
});
