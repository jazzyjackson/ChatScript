const express = require('express')
const app     = express() 
const server  = require('http').Server(app)
const path    = require('path')
const parse   = require('body-parser')
const cookies = require('cookie-parser')
const index   = require('./server/index')
const localhostPort = 3000

app.use(cookies())
app.use(parse.json());
app.use(parse.urlencoded({ extended: true }));
app.use('/static/',express.static(path.join(__dirname, '/client/')));


let ConnectionHandler = require('./server/connectionHandler.js')
const chatscript_config = { port: process.env.CSPORT || 1024, 
                            host: process.env.CSHOST || 'localhost',
                            defaultUser: 'guest',
                            defaultBot: 'harry',
                            debug: false }

let ChatScript = new ConnectionHandler(chatscript_config)

app.get('/', (req,res) => {
    let {username, botname} = req.cookies
    if(!username || !botname){ 
        //if there aren't bot/usernames on the cookie, set it. 
        //use this for access control and routing, who sees what bot.
        username = 'Guest' + String(Math.random()).slice(2);
        botname = 'Harry'
        res.cookie('username', username)
        res.cookie('botname', botname)
    }
    ChatScript.chat(':reset', username, botname)
    .then(botResponse => {
        res.send(index({botResponse, botname, username}))
    })
    .catch(error => {
        res.status(400).send(error)
    })

})

app.get('/chat', (req,res) => {
    let message = req.query.message
    let {username, botname} = req.cookies
    ChatScript.chat(message, username, botname)
    .then(botResponse => res.json(botResponse))
    .catch(error => res.status(400).send(error))
})

let httpport = process.env.PORT || localhostPort;

ChatScript.chat("","PING","")
.then(()=>{
    server.listen(httpport)
    console.log(`Found ChatScript on port ${chatscript_config.port}. App listening on ${httpport}`)
})
.catch(()=>{
    ChatScript.startServer()
    server.listen(httpport)
    console.log(`Started ChatScript on port ${chatscript_config.port}. App listening on ${httpport}`)    
})