const express = require('express');
//login functionality
const bcrypt = require('bcrypt');
const passport = require('passport');
const flash = require('express-flash');
const session = require('express-session');
//middleware below
const cors = require('cors');
const bodyParser = require('body-parser');
const morgan = require('morgan');

const login = require('./db/login');
const messages = require('./db/messages'); //require é no nome do arquivo sem a extensão
const marquees = require('./db/marquees');
const replies = require('./db/replies');
const placeholders = require('./db/placeholders');
const db =  require('./db/connection');
const app = express();

app.use(morgan('tiny'));

const corsOptions = {
  origin: process.env.CORS_ORIGIN_URL, // 'https://guites.github.io',
  credentials: true
};
app.use(cors(corsOptions));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(flash());
const initializePassport = require('./db/passport-config');
initializePassport(
  passport, 
  email => findUserByEmail(email),
  id => findUserById(id)
);
async function findUserById(id){
  const { rows } = await db.query('SELECT * FROM users WHERE id = $1;',[id]);
  return rows[0];
};
async function findUserByEmail(email){
  const { rows } = await db.query('SELECT * FROM users WHERE email = $1;',[email]);
  return rows[0];
};

app.use(session({
  secret: 'secret',
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

app.get('/',(req,res) => {
  console.log(req.hostname);
  res.json({
		message: "fullstack msg board."
	})
});

app.post('/', (req,res) => {
  console.log('post to /');
  return res.json('lel');
})

app.get('/messages', async (req,res) => {
  // const allMsgs = {};
  // allMsgs.msgs = await messages.getAll();
  // if(req.isAuthenticated()){
  //   allMsgs.user = req.user;
  // }
  // res.json(allMsgs);
	messages.getAll().then((allMessages) => {
		res.json(allMessages);
	});
});

app.get('/replies/:id', async (req, res) => {
  replies.getReplyFromMessageId(req.params.id).then(replies => res.json(replies));
})

app.get('/marquee', async (req, res) => {
  marquees.getAll().then((allMarquees) => {
    res.json(allMarquees);
  });
});

// app.post('/login', passport.authenticate('local', {
//   successRedirect: '/',
//   failureRedirect: '/login',
// }))

app.get('/login', function (req, res, next) {
  if (req.isAuthenticated()) {
    return res.send(req.user);
  } else {
    return res.send(false);
  }
});

app.get('/placeholders', async function(req, res, next) {
  placeholders.getRandom().then((placeholder) => {
    const protc = req.secure ? 'https://' : 'http://';
    res.redirect(protc + req.get('host') + '/placeholders/' + placeholder.results[0].file);
  })
});

app.get('/placeholders/:file', function(req, res, next) {
  res.sendFile(__dirname + '/placeholders/' + req.params.file);
});

app.post('/login', function(req, res, next) {
  // console.log(req.body);
  passport.authenticate('local', function(err, user, info) {
    console.log(user);
    if(err) { return res.redirect('/info'); }
    if(!user) { console.log(info); return res.json(info); }
    req.login(user, function(err) {
      if(err) { return next(err); }
      if(req.isAuthenticated()){
        return res.json(req.user);
      }
    })
  })(req,res,next);
});

app.post('/register', async function(req, res, next) {
  try {
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    const user = {
      name: req.body.name,
      email: req.body.email,
      password: hashedPassword
    };
    const { rows } = await db.query('INSERT INTO users (name,email,password) VALUES ($1,$2,$3);',[user.name,user.email,user.password]);
    res.json('success');
  } catch (e) {
    console.log(e);
    res.json(false);
  }
})

app.post('/messages', async (req,res) => {

	messages.postMessage(req).then((message) => {
		res.json(message);
	});
	
});

app.post('/replies', async (req, res) => {

  replies.postReply(req).then((reply) => {
    res.json(reply);
  })

})

app.post('/marquee', async (req, res) => {

  marquees.postMarquee(req.body).then((marquee) => {
    res.json(marquee);
  });

});

app.post('/slack', async (req, res) => {
  console.log(req.body);
  messages.postMessageFromSlack(req).then((message) => {
    res.json(message);
  });
})

app.delete('/logout', (req, res) => {
  req.logOut();
  res.json({login: false});
})

app.delete('/message/:id', (req, res) => {
  if(req.isAuthenticated()){
    messages.deleteMessage(req.params.id).then((msg) => {
      res.json(msg);
    })
  } else {
    res.status(401).send('Necessário login via aplicação.');
  }
})


// function checkAuthenticated(req, res, next){
//   if(req.isAuthenticated)
// }


const port = process.env.PORT || 4450;
app.listen(port, () => {
	console.log(`Listening on ${port}.`);
});
