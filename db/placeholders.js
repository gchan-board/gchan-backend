const db = require('./connection'); //relative path to file that exports

async function getRandom(){
	try{
		const client = await db.connect();
		const result = await client.query('SELECT file FROM placeholders ORDER BY RANDOM() LIMIT 1');
		const results = { 'results': (result) ? result.rows : null};
		client.release();
		return results;
	} catch (err){
		console.error(err);
	}
}

module.exports.getRandom = async function(){
	return getRandom();
}
module.exports = {
  getRandom,
};