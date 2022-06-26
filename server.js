var dotnev = require('dotenv').config()
var socketIO = require('socket.io')
var mongoose = require('mongoose')
var express = require('express')
var http = require('http')
const fs = require('fs')
const bodyParser = require('body-parser')
var path = require('path')
var UserModel = require('./Model/UsrerModel')
var GemsModel = require('./Model/GemsModel')
var RegionModel = require('./Model/RegionModel')
var PurchaseModel = require('./Model/PurchaseModel')
var HistoryModel = require('./Model/HistoryModel')

var jwt = require('jsonwebtoken')
const testFolder = '/videos/'
var package = ['com.tech.rtcapp', 'com.livechat.onlinevideochat']
var firebase_server_key =
  'AAAA3BAdYhI:APA91bH623Lc-3E1jzi2ITXEPbdqwOxWU6P7N2AJ-24oceHnXvjSC1h6Nw8KDK42jcUunoyVCo-JgUuHeq_fzlv1-lCo-5OM7REntULSk8Snq0KxpGa65IuKPI8XCz2TS34-svWPkYs7'
var FCM = require('fcm-node')
var fcm = new FCM(firebase_server_key)

var app = express()
var server = http.createServer(app)
var io = socketIO.listen(server)

app.use(testFolder, express.static(path.join(__dirname, 'videos')))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

//mongoose.connect('mongodb://gautam:gautamsanket@localhost:27017/newvideochat')
mongoose.connect('mongodb://localhost:27017/newvideochat')

server.listen(process.env.PORT, function() {
  console.log('Express server listening on port ' + process.env.PORT)
})

function GetToken(params) {
  return jwt.sign({ ...params }, process.env.SALT_KEY) //, { expiresIn: '1d' }
}

app.get('/', (req, res) => {
  res.send('it working')
})

app.get('/getUser', function(req, res) {
  UserModel.findOne({ _id: req.query.id }, (err, user) => {
    if (!err && user) {
      res.status(200).send(user)
    } else {
      res.status(500).send(err)
    }
  })
})

app.get('/fire', (req, res) => {
  UserModel.find()

  var message = {
    //this may vary according to the message type (single recipient, multicast, topic, et cetera)
    to: req.query.token,
    collapse_key: 'channel1',
    data: {
      //you can send only notification or only data(or include both)
      my_key: 'my another value',
      my_another_key: 'my another value',
    },
  }

  fcm.send(message, function(err, response) {
    if (err) {
      console.log('Something has gone wrong!' + err)
    } else {
      console.log('Successfully sent with response: ', response)
    }
  })
})

app.post('/callRequest', (req, res) => {
  console.log('call request')
  UserModel.findOne({ _id: req.query.userId, isConnected:false, online:false }, (err, user) => {
    if (!err && user) {
      UserModel.findOne({ _id: req.query.myId }, (err, user1) => {
        if (!err && user1) {
          var message = {
            to: user.fcmToken,
            collapse_key: 'channel1',
            data: {
              user: user1,
            },
          }

          fcm.send(message, function(err, response) {
            if (err) {
              res.status(500).send()
              console.log('Something has gone wrong!' + err)
            } else {
              console.log('Successfully sent with response: ', response)
              res.status(200).send({ user: user1 })
            }
          })
        }
      })
    } else {
      res.status(500).send()
    }
  })
})

app.post('/getHistoryList', (req, res) => {
  HistoryModel.find({ userId: req.query.userId })
    .distinct('clientId')
    .then((items, error) => {
      if (!error && items.length > 0) {
        console.log('items', items)
        console.log('error', error)
        // res.status(200).json(items);

        HistoryModel.find({ clientId: { $in: items } }).sort({ 'createdAt' : -1 }).then(
          (history, errors) => {
            if (history != null && errors == null) {
              console.log('second', errors)
              var unique = []
              var distinct = []
              history.forEach(function(x) {
                if (!unique[x.clientId]) {
                  distinct.push(x)
                  unique[x.clientId] = true
                }
              })
              console.log('second ', distinct)

              res.status(200).json(distinct)
            }
          }
        )
      } else {
        res.status(400).send({ message: 'no history found' })
      }
    })
})

app.get('/getCoinsList', (req, res) => {
  GemsModel.find({})
    .sort({ coins: 'asc' })
    .exec()
    .then((result, error) => {
      if (result.length <= 0) {
        res.status(204).json({ message: 'No Items Found' })
      } else {
        res.status(200).send(result)
      }
    })
})

app.get('/getCountryList', (req, res) => {
  UserModel.find({}).distinct('country', (error, result) => {
    if (result.length <= 0) {
      res.status(204).json({
        message: 'No Items Found',
      })
    } else {
      res.status(200).json(result)
    }
  })
})

app.post('/updateCoin', (req, res) => {
  jwt.verify(req.query.jwt, process.env.SALT_KEY, (error, result) => {
    if (!error) {
      UserModel.update(
        { _id: result._id },
        { coin: req.query.coin },
        (err, raw) => {
          res.status(200).send({ message: 'operation done' })
        }
      )
    } else {
      res.status(500).send({ message: 'jwt not verified' })
    }
  })
})

app.post('/updateGender', (req, res) => {
  console.log(req.query.userid)
  UserModel.findByIdAndUpdate(
    { _id: req.query.userid },
    { gender: req.query.gender, birthDate: req.query.birthdate },
    { new: true },
    (err, user) => {
      if (user) {
        console.log('updated user ' + user)
        res.status(200).send(user)
      } else {
        console.log(err)
        res.status(400).send({ message: 'Something happened wrong' })
      }
    }
  )
})

app.post('/updateCountry', (req, res) => {
  console.log(req.query.userid)
  UserModel.findByIdAndUpdate(
    { _id: req.query.userid },
    { country: req.query.country },
    { new: true },
    (err, user) => {
      if (user) {
        console.log('updated user ' + user)
        res.status(200).send(user)
      } else {
        console.log(err)
        res.status(400).send({ message: 'Something happened wrong' })
      }
    }
  )
})

app.post('/updateName', (req, res) => {
  console.log(req.query.userid)
  UserModel.findByIdAndUpdate(
    { _id: req.query.userId },
    { name: req.query.name },
    { new: true },
    (err, user) => {
      if (user) {
        console.log('updated user ' + user)
        res.status(200).send(user)
      } else {
        console.log(err)
        res.status(400).send({ message: 'Something happened wrong' })
      }
    }
  )
})

app.post('/registerPackage', (req, res) => {
  var purchase = new PurchaseModel(req.body)

  purchase.save().then((result, error) => {
    if (!error) {
      PurchaseModel.findOne({ _id: result._id })
        .populate('gemsId')
        .populate('userId')
        .exec((error, response) => {
          console.log('PurchaseModel ', response)
          if (!error) {
            UserModel.findOneAndUpdate(
              { _id: response.userId._id },
              { coin: response.userId.coin + response.gemsId.coins },
              { new: true },
              (error, doc) => {
                console.log('update coins ', doc)
                if (!error) {
                  res.status(200).send(doc)
                }
              }
            )
          }
        })
    } else {
      res.status(500).json({
        error: error,
      })
    }
  })
})

app.post('/signup', (req, res) => {
  console.log('signup ', req.body.email)

  UserModel.find({ email: req.body.email })
    .exec()
    .then(users => {
      if (users.length > 0) {
        console.log(users[0])
        if (users[0].signupType != req.body.signupType) {
          UserModel.findOneAndUpdate(
            { email: req.body.email },
            { ...req.body, coin: users[0].coin },
            { new: true },
            (err, user) => {
              if (err) {
                console.log(error)
                res.status(500).json({
                  error: err,
                })
              } else {
                const token = GetToken(user.email, user._id)
                res.status(201).json({
                  message: 'User Created Successfully',
                  token: token,
                  user: user,
                })
              }
            }
          )
        } else {
          const token = jwt.sign(
            { email: users[0].email, _id: users[0]._id },
            process.env.SALT_KEY
          ) //, { expiresIn: '1d' }
          res.status(201).json({
            message: 'User Created Successfully',
            token: token,
            user: users[0],
          })
        }
      } else {
        const user = new UserModel({
          ...req.body,
          coin: process.env.DEFAULT_COIN,
        })

        user
          .save()
          .then((user, error) => {
            console.log(user)
            const token = jwt.sign(
              { email: user.email, _id: user._id },
              process.env.SALT_KEY
            )
            res.status(200).json({
              message: 'User Created Successfully',
              token: token,
              user: user,
            })
          })
          .catch(error => {
            console.log(error)
            res.status(500).json({
              error: error,
            })
          })
      }
    })
})

app.post('/login', (req, res, next) => {
  UserModel.find({ email: req.body.email, password: req.body.password })
    .exec()
    .then(users => {
      if (users.length < 1) {
        console.log(users)
        res.status(401).json({
          message: 'Authentication Failed',
        })
      } else {
        const token = jwt.sign(
          { email: users[0].email, _id: users[0]._id },
          process.env.SALT_KEY
        )
        res.status(200).json({
          message: 'Auth Successfull',
          token: token,
        })
      }
    })
    .catch(error => {
      console.log(error)
      res.status(500).json({
        error: error,
      })
    })
})

app.post('/updateUser', (req, res) => {
  console.log(req.body)
  jwt.verify(req.body.jwt, process.env.SALT_KEY, (error, result) => {
    UserModel.findOneAndUpdate(
      { _id: req.body._id },
      req.body,
      { new: true },
      (error, result) => {
        if (!error) {
          res.status(200).send(result)
        }
      }
    )
  })
})

function connect(user, client) {
  query = {}

  if (user.genderMatch == 'Both') {
    query.genderMatch = 'Both'
  } else if (user.genderMatch == 'MALE') {
    query.gender = 'MALE'
    query.genderMatch = { $in: ['MALE', 'Both'] }
  } else if (user.genderMatch == 'FEMALE') {
    query.gender = 'FEMALE'
    query.genderMatch = { $in: ['FEMALE', 'Both'] }
  }

  if (user.countryMatch != 'Global') {
    query.country = user.countryMatch
    query.countryMatch = { $in: [user.countryMatch, 'Global'] }
  }

  console.log('Query ' + JSON.stringify(query))

  UserModel.findOne(
    {
      ...query,
      _id: { $ne: user._id },
      isConnected: false,
      online: true,
    },
    (error, res) => {
      console.log('on connect error ', error)
      console.log('on connect response ', res)

      if (res) {
        console.log('on connect')
        UserModel.updateMany(
          { _id: [res._id, user._id] },
          { isConnected: true },
          (err, raw) => {
            console.log('update many raw ', raw)
            io.to(res._id).emit('createoffer', {
              id: client.id,
              gender: res.gender,
              name: res.name,
              country: res.country,
            })
          }
        )
      } else {
        console.log('not found')
        client.emit('NoMatchingFounds')
        client.emit('test')
      }
    }
  )
}

io.engine.generateId = function(req) {
  // generate a new custom id here
  console.log('client id', req._query.userId)
  return req._query.userId
}

io.sockets.on('connection', function(client) {
  // token = new Buffer(client.handshake.query.auth_token, 'base64').toString('ascii')
  console.log('on connect ', client.handshake.query.auth_token)

  jwt.verify(client.handshake.query.auth_token, process.env.SALT_KEY, function(
    err,
    result
  ) {
    if (!err) {
      // io.to(client.id).emit('OnConnected')
      console.log('connection id ', result._id)
      // console.log('connection id ', client.id)
    } else {
      console.log('on un authorize ', process.env.SALT_KEY)
      console.log('on un authorize ', err)
      client.disconnect('unauthorized')
    }
  })

  client.on('doconnectuser', function(details) {
    if (details.name != ' ' && package.includes(details.name)) {
    
      var fromUser = details.fromUser
      var toUser = details.toUser
      console.log('fromuser ', fromUser)
      console.log('touser ', toUser)

      UserModel.updateMany(
        { _id: [fromUser, toUser] },
        { $set: { isConnected: true, online: true, clientId: ' ' } },
        (err, res) => {
          if (res.nModified >= 2) {
            io.to(fromUser.toString()).emit('test')
            io.to(toUser).emit('createoffer', { id: fromUser })

            // UserModel.find({ _id: toUser }, (err, user) => {
            //   if (!err && user) {
            //     console.log('user id', user._id)
            //     io.to(user._id).emit('createoffer', { id: fromUser })
            //   }
            // })
          }else{

          }
        }
      )
    }
  })

  client.on('test', function(details) {
    console.log('on test')
  })

  client.on('doconnect', function(details) {
    console.log('on doconnect')

    if (details.name != ' ' && package.includes(details.name)) {
      UserModel.findOneAndUpdate(
        { _id: client.id },
        { isConnected: false, online: true, clientId: ' ' },
        { new: true },
        (error, user) => {
          if (user) {
            console.log('myuser', user)

            query = {}

            if (user.genderMatch == 'Both') {
              query.gender = /.*/
              query.genderMatch = /.*/
            } else if (user.genderMatch == 'MALE') {
              query.gender = 'MALE'
              query.genderMatch = { $in: ['MALE', 'Both'] }
            } else if (user.genderMatch == 'FEMALE') {
              query.gender = 'FEMALE'
              query.genderMatch = { $in: ['FEMALE', 'Both'] }
            }

            if (user.countryMatch != 'Global') {
              query.country = user.countryMatch
              query.countryMatch = { $in: [user.countryMatch, 'Global'] }
            } else {
              query.country = /.*/
              query.countryMatch = /.*/
            }

            console.log('Query ' + JSON.stringify(query))

            UserModel.findOne(
              {
                $or: [
                  { gender: query.gender },
                  { genderMatch: query.genderMatch },
                ],
                // $or:[{country:query.country,countryMatch:query.countryMatch}],
                country: query.country,
                countryMatch: query.countryMatch,
                _id: { $ne: user._id },
                isConnected: false,
                online: true,
              },
              (error, res) => {
                console.log('on connect error ', error)
                console.log('on connect response ', res)

                if (res) {
                  console.log('on connect response ', res.genderMatch)
                  console.log('on connect response ', user.genderMatch)
                  if (
                    (res.gender == user.genderMatch &&
                      user.gender == res.genderMatch) ||
                    (res.genderMatch == 'Both' && user.genderMatch == 'Both') ||
                    (res.genderMatch == 'Both' &&
                      res.gender == user.genderMatch) ||
                    (user.genderMatch == 'Both' &&
                      res.genderMatch == user.gender)
                  ) {
                    console.log('on connect')
                    UserModel.updateMany(
                      { _id: [res._id, user._id] },
                      { isConnected: true },
                      (err, raw) => {
                        console.log('update many raw ', raw)
                        io.to(res._id).emit('createoffer', {
                          id: client.id,
                          gender: res.gender,
                          name: res.name,
                          country: res.country,
                        })
                      }
                    )
                  } else {
                    console.log('not found')
                    client.emit('NoMatchingFounds')
                  }
                } else {
                  console.log('not found')
                  client.emit('NoMatchingFounds')
                }
              }
            )
          }
        }
      )
    } else {
      setTimeout(() => client.emit('NOAUTH'), 2000)
    }
  })

  client.on('exit', function() {
    console.log('client exit ' + client.id)
    UserModel.find({ _id: client.id }).then(data => {
      if (data != null) {
        console.log('data ' + JSON.stringify(data))
        data.forEach(element => {
          UserModel.findByIdAndUpdate(
            { _id: element._id },
            { isConnected: false, online: false, clientId: ' ' },
            (err, res) => {
              console.log('new Disconnection exit: ' + res.email)
            }
          )
        })
      }
    })
  })

  client.on('disconnect', function() {
    console.log('client disconnect ' + client.id)
    UserModel.find({ _id: client.id }).then(data => {
      if (data != null) {
        console.log('data ' + JSON.stringify(data))
        data.forEach(element => {
          UserModel.findByIdAndUpdate(
            { _id: element._id },
            {
              isConnected: false,
              online: false,
              clientId: ' ',
              isAvailable: false,
            },
            (err, res) => {
              console.log('new Disconnection: ' + res)
            }
          )
        })
      }
    })
  })

  client.on('offer', function(details) {
    console.log('To', details.To)
    details.from = client.id
    io.to(details.To).emit('offer', details)
    // client.broadcast.emit('offer',details);
    console.log('offer: ' + client.id)
  })

  client.on('answer', function(details) {
    details.from = client.id
    io.to(details.To).emit('answer', details)
    // client.broadcast.emit('answer',details)
    console.log('answer: ' + client.id)
  })

  client.on('candidate', function(details) {
    details.from = client.id
    console.log('To', details.To)
    io.to(details.To).emit('candidate', details)
    // client.broadcast.emit('candidate',details);
    console.log('candidate: ' + client.id)
  })

  client.on('connected', function(params) {
    UserModel.findOneAndUpdate(
      { _id: client.id },
      { isConnected: true, clientId: params.To },
      { new: true },
      (err, model) => {
        console.log('history', model)
        if (model) {
          UserModel.findOne({ _id: model.clientId })
            .exec()
            .then(res => {
              if (res) {
                console.log('res', res)
                new HistoryModel({
                  userId: client.id,
                  clientId: res.id,
                  name: res.name,
                  gender: res.gender,
                  country: res.country,
                  created: params.Time,
                })
                  .save()
                  .then((val, error) => {
                    if (val) {
                      console.log('new history', val)
                    }
                  })
              }
            })
        }
        console.log('onconnected', JSON.stringify(model))
      }
    )
  })

  client.on('Leave', function(details) {
    console.log('on disconnect ' + client.id)
    console.log('on disconnect ' + details.To)
    details.from = client.id
    if (details.To != 'to') {
      io.to(details.To).emit('Leave', details)
    }
  })

  client.on('setgender', function(params) {
    console.log(params)
    UserModel.update({ _id: client.id }, { genderMatch: params.GENDER }).exec()
  })

  client.on('setcountry', function(params) {
    console.log(params)
    UserModel.update(
      { _id: client.id },
      { countryMatch: params.COUNTRY }
    ).exec()
  })

  client.on('settoken', function(params) {
    console.log('token', params.token)
    UserModel.update({ _id: client.id }, { fcmToken: params.token }).exec()
  })

  client.on('setAvailable', function(params) {
    console.log('isAvailable', params.isAvailable)
    UserModel.update(
      { _id: client.id },
      { isAvailable: params.isAvailable }
    ).exec()
  })

  client.on('NoMatchingFoundAgain', function() {
    console.log('NoMatchingFoundAgain')
    UserModel.updateOne(
      { _id: client.id },
      { isConnected: true },
      (err, raw) => {
        var videos = fs.readdirSync(__dirname + testFolder)
        var index = Math.floor(Math.random() * videos.length)
        console.log('createing offer no user found', index)
        console.log('createing offer no user found', videos[index])
        client.emit('nouser', { url: videos[index] })
      }
    )
  })
})
