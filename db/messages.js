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


function getAll(){
	const messages = db.connect()
	.then((client) => {
		client.query(query)
			.then(res => {
				let results;
				for (let row of res.rows){
					results.push(row);
				}
				return results;
			})
			.catch(err => {
				console.error(err);
			})
	})
	.catch(err => {
		console.error(err)
	});
	return messages;
}

function postMessage(message){
	if (!message.username) message.username = 'Anonymous';

	const result = schema.validate(message);
	if(result.error == null){
		message.created = new Date();
		return messages.insert(message);
	} else {
		console.log(message);
		return Promise.reject(result.error);
	}

}

module.exports = {
	postMessage,
	getAll
};