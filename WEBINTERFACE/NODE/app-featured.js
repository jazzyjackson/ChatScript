/* Provides routes for reading and writing topic files, pulling documentation, and returning the results of :why / :prepare for all statements to provide a data-rich building and debugging environment */
const express = require('express')
const app     = express() 
const server  = require('http').Server(app)
const path    = require('path')
const fs      = require('fs')
const parse   = require('body-parser')
const cookies = require('cookie-parser')
const index   = require('./server/index')
const editor  = require('./server/editor.js')
const jobs    = require('./server/jobScheduler') //optional, for sub processes
const localhostPort = 3000

app.use(cookies())
app.use(parse.json());
app.use(parse.urlencoded({ extended: true }));
app.use('/static/',express.static(path.join(__dirname, '/client/')));
app.use('/codemirror/',express.static(path.join(__dirname, '/node_modules/codemirror/lib/')));


let ConnectionHandler = require('./server/connectionHandler.js')
const chatscript_config = { port: process.env.CSPORT || 1024, 
                            host: process.env.CSHOST || 'localhost',
                            defaultUser: 'guest',
                            defaultBot: 'Harry',
                            debug: false }

let ChatScript = new ConnectionHandler(chatscript_config)

app.get('/', (req,res) => {
    let {username, botname} = req.cookies
    if(!username || !botname){ 
        //if there aren't bot/usernames on the cookie, set it. 
        //use this for access control and routing, who sees what bot.
        username = chatscript_config.defaultUser + String(Math.random()).slice(2)
        botname = chatscript_config.defaultBot
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

app.get('/:botname/brains', (req,res) => {
    let botDirectory = path.join(__dirname, '..', '..')
    let botDefinition = path.join('RAWDATA',`files${req.params.botname}.txt`)
    //find the bot definition, like filesHarry.txt, read the directories,
    //and then render the editor page with all these filenames in place for retrieval
    fs.readFile(path.join(botDirectory, botDefinition), 'utf8', (err,data) => {
        if(err){ res.status(400).send(err); return;}
        topic_directories = data.split('\n')
                                .map(line => line.trim()) //throw out whitespace chars
                                .filter(line => !!line)   //filter out empty lines
                                .filter(line => !line.match(/^\s*#/)) //filter out comments
        
        Promise.all(topic_directories.map(topic_directory => {
            return new Promise((resolve, reject) => {
                //each line of topic_directories might be a direcotyr, or a .top file. let's check.
                let thisPath = path.join(botDirectory, topic_directory);
                if(fs.statSync(path.join(botDirectory, topic_directory)).isFile()){
                    let filenameIndex = topic_directory.match(/[\w.]+$/).index
                    resolve({dirname: topic_directory.slice(0,filenameIndex).replace(/RAWDATA/,''),
                             files: [topic_directory.slice(filenameIndex)]})
                }
                fs.readdir(thisPath, (err, files) => {
                    if(err){ reject(err); return; }
                    files = files.filter(file => {
                        //filter out sub directories.
                        return fs.statSync(path.join(botDirectory, topic_directory, file)).isFile()
                    })
                    resolve({dirname: topic_directory.replace(/RAWDATA/,''), files})
                })
            })
        }))
        // .then(resultArray => res.json(resultArray)) //This route could just return an array of objects if you want it to
        .then(resultArray => res.send(editor(resultArray))) //render editor HTML
        .catch(err => {
            console.log(err)
            res.status(400).send(err)
        })
    })

})

app.get('/document', (req,res) => {
    let fullpath = req.query.fullpath
    console.log(fullpath)
    fs.readFile(path.join(__dirname, '..','..','RAWDATA',fullpath), (err,data) => {
        if(err) res.status(400).send(err)
        else    res.send(data)
    })
})

app.get('/chat', (req,res) => {
    let message = req.query.message
    let {username, botname} = req.cookies
    ChatScript.chat(message, username, botname)
    .then(botResponse => res.json(botResponse))
    .catch(error => res.status(400).send(error))
})

app.get('*', (req,res) => {
    res.send("no such route")
})

let port = process.env.PORT || localhostPort;
server.listen(port);
console.log(`Listening on ${port}`)
