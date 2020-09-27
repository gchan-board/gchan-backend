const Joi = require('joi');
const db = require('./connection'); //relative path to file that exports

const schema = Joi.object().keys({
	username: Joi.string().alphanum().required(),
	subject: Joi.string().required(),
	message: Joi.string().max(250).required(),
	imageURL: Joi.string().uri({
		scheme: [
			/https?/
		]
	}).allow(''),
	giphyURL: Joi.string(),
	options: Joi.string(),
});

// const messages = db.get('messages');

async function getAll(){
	try{
		const client = await db.connect();
		const result = await client.query('SELECT * FROM messages');
		const results = { 'results': (result) ? result.rows : null};
		client.release();
		return results;
	} catch (err){
		console.error(err);
		res.json( err );
	}
}

async function postMessage(message){
	const messageBody = message.body;

	if (!messageBody.username) messageBody.username = 'Anonymous';
	if (!messageBody.imageURL) messageBody.imageURL = '';

	const result = schema.validate(messageBody);
	if(result.error == null){
		messageBody.created = new Date();
		try{
			const sql = 'INSERT INTO messages (username, subject, message, imageURL, giphyURL, options, created) VALUES ($1,$2,$3,$4,$5,$6,$7)';
			const values = [messageBody.username, messageBody.subject, messageBody.message, messageBody.imageURL,messageBody.giphyURL,messageBody.options,messageBody.created];

			const client = await db.connect();
			
			try {
				const query_res = await client.query(sql,values);
				client.release();
				return (query_res);
			} catch (err) {
				client.release();
				console.log(err.stack)
			}

			
			
		} catch (err){
			console.error(err);
			return (err);
		}
	} else {
		return Promise.reject(result.error);
	}





}
module.exports.postMessage = async function(){
	return postMessage();
}

module.exports.getAll = async function(){
	return getAll();
}
module.exports = {
	postMessage,
	getAll,
	schema
};