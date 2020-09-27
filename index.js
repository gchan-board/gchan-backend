const express = require('express');
//middleware below
const cors = require('cors');
const bodyParser = require('body-parser');
const morgan = require('morgan');

const messages = require('./db/messages'); //require é no nome do arquivo sem a extensão

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
	// try {
	// 	const client = await messages.connect();
	// 	const result = await client.query('SELECT * FROM messages');
	// 	const results = { 'results': (result) ? result.rows : null};
	// 	res.json(results);
	// 	client.release();
	// 	} catch (err) {
	// 	console.error(err);
	// 	res.send("Error " + err);
	// 	}
	// messages.getAll();
	res.json(messages.getAll());
});

app.post('/messages', (req,res) => {
	console.log(req.body);
	messages.postMessage(req.body).then((message) => {
		res.json(message);
	}).catch((error) => { //como a função retorna um Promise.reject, posso usar um catch
		res.status(500);
		res.json(error);
	})
});


const port = process.env.PORT || 4450;
app.listen(port, () => {
	console.log(`Listening on ${port}.`);
});
