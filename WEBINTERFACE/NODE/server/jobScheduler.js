//This boots a websocket server that accepts job requests, spawns child processes, and streams results back to the server, then the client. It is abstracted from the main server so that multiple instances can be spun up with load balancing.

//It includes a websocket server for persistence, but exposes a standalone function that might work on serverless application (AWS Lambda)


function bootSchedule(){
    const WebSocket = require('ws');
    const wss = new WebSocket.Server({
        perMessageDeflate: false,
        port: 8080
    });

    wss.on('connection', function onConnect(ws){
        ws.on('close', () => console.log("heard from ws"))
        ws.on('message', function passThe(parcel){
            console.log('received ', message)
            takeAction(parcel, ws) //passes this particular socket to that subprocess so messages can be returned by the subprocess via ws.send()
        })
    })
}

function takeAction(parcel, ws){
    switch(parcel.type){
        case 'sql': executeSQL(parcel.command, ws);
        case 'psql': executePSQL(parcel.command, ws);
        case 'shell': executeShell(parcel.command, ws);
    }
}


// const mysql = require('node-mysql')
// function executeSQL(sqlcommand, ws){
//     let credientials = require('./credentials/sqlconfig.js')

// }

// const mysql = require('node-psql')
// function executePSQL(sqlcommand, ws){
//     let credentials = require('./credentials/psqlconfig.js')

// }

const spawn = require('child_process').spawn

function executeShell(shellcommand, ws){
    let commandLine = shellcommand.split(' ')
    let pipeline = spawn(commandLine.unshift, commandLine)

    pipeline.stdout.on('data', data => {
        thisJob.type = 'pipe'
        let thisChunk =  data.toString('utf8');
        let possibleFileName = thisChunk.match(/[.\w]+.csv/)
        if(possibleFileName){
            thisJob.filename = possibleFileName[0]
        }   
        thisJob.result += thisChunk
    })
    pipeline.stderr.on('data', data => {
        thisJob.type = 'error'
        thisJob.error = data.toString('utf8')
        thisJob.status = 'done'
    })
    pipeline.stderr.on('error', error => {
        thisJob.type = 'error'
        thisJob.error = error.toString('utf8')
        thisJob.status = 'done'
    })
    pipeline.on('close', code => {
        console.log(thisJob.command, 'exited with process code', code)
        thisJob.status = 'done'
        thisJob.jobTime = new Date() - thisJob.timestamp
    })
}

//dispatchTask() is called from app-featured.
//inside the message event listener, things can be updated, sent to client...
//We need a second socket, one is server to schedule, the other is server to client.
function dispatchTask(jobObj, clientSocket){

    let ws = connectToSchedule('ws://localhost:8080')
    ws.on('open', error => {
        ws.send(jobObj)
    })
    ws.on('message', (data, flags)=>{
        console.log(data)
        //updates will be coming up the pipe, they should be passed on to the client that requested the job...
        //reply to client
        if(data = 'done'){
            ws.close(1000, "All done thanks for playing.")
        }
    })
}

function heartbeat(){
    let ws = connectToSchedule('ws://localhost:8080')
    ws.on('open', error => {
        ws.close(1000, "just checking in")
    })
}

//connectScheduler('ws://localhost:8080') returns ws object to attach listeners and invoke senders.
function connectToSchedule(ws_address){
    const WebSocket = require('ws');
    return new WebSocket(ws_address, {
        perMessageDeflate: false
    });
}

// module.exports = {connectToSchedule, dispatchTask, heartbeat, bootSchedule}