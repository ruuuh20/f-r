const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt-nodejs');
const cors = require('cors');
const knex = require('knex');
const Clarifai = require('clarifai');
const dotenv = require("dotenv");

const clarifaiApp = new Clarifai.App({
 apiKey: process.env.SECRET_KEY
});

const handleApi = (req, res) => {
  clarifaiApp.models.predict(Clarifai.FACE_DETECT_MODEL, req.body.input)
  .then(data => {
    res.json(data)
  })
  .catch(err => res.status(400).json('error with api'))
}

const db = knex({
  client: 'pg',
  connection: {
    host : '127.0.0.1',
    user : 'pyunghwakim',
    password : '',
    database : 'fr-app'
  }
});

db.select('*').from('users')

const app = express();
app.use(bodyParser.json())
app.use(cors())


app.get('/', (req, res) => {
  res.send(database.users)
})

app.post('/signin', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json('incorrect information')
  }
  db.select('email', 'hash').from('login')
  .where('email', '=', email)
  .then(data => {
    const isValid = bcrypt.compareSync(password, data[0].hash);
      if (isValid) {
        return db.select('*').from('users')
          .where('email', '=', email)
          .then(user => {
            res.json(user[0])
          })
          .catch(err => {
            res.status(400).json('unable to find user')
          })
      } else {
        res.status(400).json('does not match')
      }
  })
  .catch(err => res.status(400).json('does not match'))
})

app.post('/register', (req, res) => {
  const { email, name, password } = req.body
  if (!email || !name || !password) {
    return res.status(400).json('incorrect information')
  }
  const hash = bcrypt.hashSync(password);
  db.transaction(trx => {
    trx.insert({
      hash: hash,
      email: email
    })
    .into('login')
    .returning('email')
    .then(loginEmail => {
      return trx('users')
      .returning('*')
      .insert({
        email: loginEmail[0],
        name: name,
        joined: new Date()
      }).then(user => {
        res.json(user[0])
      })
    })
    .then(trx.commit)
    .catch(trx.rollback)
  })

    .catch(error => res.status(400).json('unable to register'))

})

app.get('/profile/:id', (req, res) => {
  const { id } = req.params;
  db.select('*').from('users').where({
    id: id
  }).then(user => {
    if (user.length) {
      res.json(user[0])
    } else {
      res.status(400).json('Not Found')
    }

  })
  .catch(err => res.status(400).json('there was an error'))

})

app.put('/image', (req, res) => {
  const { id } = req.body;
  db('users').where('id', '=', id)
 .increment('entries', 1)
 .returning('entries')
 .then(entries => {
   res.json(entries[0])
 })
 .catch(err => res.status(400).json('there was an error'))
})

app.post('/imageurl', (req, res) => {
  handleApi(req, res)
})

app.listen(3000, () => {
  console.log(`running on port 3000`)
})
