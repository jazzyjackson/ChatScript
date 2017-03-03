/* Provides routes for reading and writing topic files, pulling documentation, and returning the results of :why / :prepare for all statements to provide a data-rich building and debugging environment */
const express = require('express')
const app     = express() 
const server  = require('http').Server(app)
const path    = require('path')
const fs      = require('fs')
const parse   = require('body-parser')
const cookies = require('cookie-parser')
const index   = require('./server/index')
const editor  = require('./server/editor')
const jobs    = require('./server/taskServer') //{connectToSchedule, dispatchTask, heartbeat, bootSchedule}
const httpport = 3000
const clientSocketPort = 2000 //chatAPI.js near the top opens a new WebSocket - it needs to know this port number, too.
const jobSchedulerPort = 2001

app.use(cookies())
app.use(parse.json());
app.use(parse.urlencoded({ extended: true }));
app.use('/static/',express.static(path.join(__dirname, '/client/')));
app.use('/codemirror/',express.static(path.join(__dirname, '/node_modules/codemirror/lib/')));
app.use('/moment/',express.static(path.join(__dirname, '/node_modules/moment/')));


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

/* This route does a lot of file system operations to render the editor, handles request for any bot that exists.*/
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
                    let filenameIndex = topic_directory.match(/[\w.]+$/).index //matches at least one [word character OR dot] where that match ends at the end $ of a sentence. 
                    resolve({dirname: topic_directory.slice(0,filenameIndex).replace(/RAWDATA/,''),
                             files: [topic_directory.slice(filenameIndex)]})
                } else {
                    fs.readdir(thisPath, (err, files) => {
                        if(err){ reject(err); return; }
                        files = files.filter(file => {
                            //filter out sub directories.
                            return fs.statSync(path.join(botDirectory, topic_directory, file)).isFile()
                        })
                        files = files.filter(file => file[0] !== '.') //filter out hidden files whose first character is dot.
                        resolve({dirname: topic_directory.replace(/RAWDATA/,''), files})
                    })
                }
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

//this is pulled anytime a filename is requested by the editor in the form path/document?fullpath=urlencodedpathname
app.get('/document', (req,res) => {
    let fullpath = req.query.fullpath
    console.log(fullpath)
    fs.readFile(path.join(__dirname, '..','..','RAWDATA',fullpath), (err,data) => {
        if(err) res.status(400).send(err)
        else    res.send(data)
    })
})
app.get('/csv/:filename', (req,res) => {
    res.download(path.join(__dirname, 'sqlresults', req.params.filename))
})


const WebSocket = require('ws');
const clientSocket = new WebSocket.Server({
    perMessageDeflate: false,
    port: clientSocketPort 
});
// handling client
clientSocket.on('connection', function onConnect(ws){
    //this is the socket between 
    ws.on('close', () => console.log("closed clientside socket related to", ws.hash))
    ws.on('message', function passThe(parcel){
        promiseCookies(ws.upgradeReq)
        .then( cookie => ChatScript.chat(parcel, cookie.username, cookie.botname ))
        .then(botResponse => {
            botResponse.timestamp = new Date()
            //just using a truncated md5 hash for a unique identifier. timestamp guarantees each obj hashes different. 
            botResponse.hash = require('crypto').createHash('md5').update(JSON.stringify(botResponse)).digest("hex").slice(0,12)
            ws.hash = botResponse.hash //for debugging purposes, when the websocket closes it will print a reference to the job the socket was opened for.
            console.log(botResponse.hash + ": " + botResponse.input + " >> " + botResponse.output)
            ws.send(JSON.stringify(botResponse)) 
            //only necessary for job scheduling
            //so the client immediately gets the bot response, but then we check...
            if(botResponse.type){ //if there's a type, there's a job to do. Pass botResponse and socket to jobScheduler.
                jobs.dispatchTask(botResponse, ws)
            }
        })
        .catch(console.log.bind(console))
        // takeAction(parcel, ws) //passes this particular socket to that subprocess so messages can be returned by the subprocess via ws.send()
    })
})

function promiseCookies(wsreq){
    return new Promise((resolve, reject) => {
        //the cookie_parser constructor function takes a request object, digs into its headers.cookies, does the parsing, and assigns the parsed object back onto the request object fed to it at request.cookies
        cookies()(wsreq, null, err => {
            if(err) reject(err)
            else if(wsreq.cookies.username && wsreq.cookies.botname) resolve(wsreq.cookies)
            else reject("cookie didn't have requisite information. Cookie has props " + Object.keys(ws.req.cookies)) //this shouldn't happen. Client is fed new cookies when index route '/' is hit by http.
        })
    })
}

app.get('/chat', (req,res) => {
    let message = req.query.message
    let {username, botname} = req.cookies
    ChatScript.chat(message, username, botname)
    .then(botResponse => {res.json(botResponse); return botResponse})
    .catch(error => res.status(400).send(error))
})

app.get('*', (req,res) => {
    res.send("no such route")
})

/* Optional for Job Scheduling.*/ 

jobs.bootSchedule(jobSchedulerPort)

/* auto detect if chatscript is already running, attempt to start server */

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