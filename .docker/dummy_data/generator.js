/**
 * This file has a few hand crafted functions to generate
 * dummy sql data.
 * The data is already loaded into init.sql, I included this file only
 * in case you want to tinker with it.
 */

const https = require('https');
const fs = require('fs');
const posts_json = fs.readFileSync('./posts.json', 'utf8');
const posts_obj = JSON.parse(posts_json);
const posts = posts_obj.posts;

const users_json = fs.readFileSync('./users.json', 'utf8');
const users_obj = JSON.parse(users_json);
const users = users_obj.users;

const replies_json = fs.readFileSync('./replies.json', 'utf8');
const replies_obj = JSON.parse(replies_json);
const replies = replies_obj.comments;

const dogs_json = fs.readFileSync('./dog-pics.json', 'utf8');
const dogs_obj = JSON.parse(dogs_json);
const dogs = dogs_obj.message;

const cats_json = fs.readFileSync('./cat-pics.json', 'utf8');
const cats_obj = JSON.parse(cats_json);
const cats = cats_obj.message;

/**
 * Helper function to make http GET requests as a promise
 * @returns fetched data from URL (string)
 */
async function grab_url() {
    const url = 'https://aws.random.cat/meow?ref=apilist.fun';
    return new Promise((resolve) => {
        https.get(url, res => {
            let data = '';
            res.on('data', chunk => { data += chunk.toString() });
            res.on('end', () => {
                resolve(JSON.parse(data).file);
            });
        });
    });
}

/**
 * Generates batch INSERT command for messages table
 * (resulting sql statement in printed to console)
 */
function format_sql_posts() {
    const messages_sql = [];
    let username, subject, message, imageURL, user_id, post;
    for (let i = 0; i < posts.length; i++) {
        post = posts[i];
        username = users.find((user) => user.id == post.userId).firstName;
        subject = post.title.replaceAll("'",'');
        message = post.body.replaceAll("'",'');
        imageURL = cats[i];
        user_id = 0;
        messages_sql.push(`('${username}', '${subject}', '${message}', '${imageURL}', '${user_id}')`);
    }
    console.log('INSERT INTO messages (username, subject, message, imageURL, user_id) VALUES ');
    console.log(messages_sql.join(', \n'));
}


/**
 * Generates batch INSERT command for replies table
 * (resulting sql statement in printed to console)
 * Each post may receive up to 3 replies, with images
 * grabbed randomly from the {dogs} array
 */
function format_sql_replies() {
    const replies_sql = [];
    const picked_dogs = [];
    let reply_counter = 0;
    let reply, username, content, user_id, message_id;
    posts.forEach((post) => {
        var numReplies = Math.floor(Math.random() * 3); // between 0 and 3
        for (let i = 0; i < numReplies; i++) {
            reply = replies[reply_counter];
            reply_counter++;
            username = reply.user.username;
            content = reply.body;
            user_id = 0;
            message_id = post.id;
            imageURL = '';
            var dog = dogs[Math.floor(Math.random()*dogs.length)];
            if (picked_dogs.indexOf(dog) == -1) {
                imageURL = dog;
                picked_dogs.push(dog);
            }
            replies_sql.push(`('${username}', '${content}', '${imageURL}', '${user_id}', '${message_id}')`);
        }
    });
    console.log('INSERT INTO replies (username, content, imageURL, user_id, message_id) VALUES');
    console.log(replies_sql.join(', \n'));
}

format_sql_posts();
format_sql_replies();