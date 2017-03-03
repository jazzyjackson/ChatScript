//This boots a websocket server that accepts job requests, spawns child processes, and streams results back to the server, then the client. It is abstracted from the main server so that multiple instances can be spun up with load balancing.

//It includes a websocket server for persistence, but exposes a standalone function that might work on serverless application (AWS Lambda)


// Start functions exported for app-featured serverside use

//dispatchTask() is called from app-featured.
//inside the message event listener, things can be updated, sent to client...
//We need a second socket, one is server to schedule, the other is server to client.
function dispatchTask(jobObj, clientSocket){
    //right right right the confusing thing is that this function creates a new websocket to talk to the jobFullfillment process, but that's a server -> server websocket. on the s2sws, on message listeners are attached to react to new information form the child process / sql process etc - so on new information, the server -> client websocket is used to return updated objects to the client for re-rendering. Great.
    let ws = connectToSchedule('ws://localhost:2001')
    ws.on('open', error => {
        console.log(`${jobObj.hash}: ${jobObj.command}`)
        ws.send(JSON.stringify(jobObj)) //the object containing the task to be done is passed to the server.
    })
    ws.on('message', (data, flags)=>{ //updates will be returned to this socket.
        clientSocket.send(data)
        if(JSON.parse(data).status == 'done'){
            ws.close(1000, "All done thanks for playing.")
            clientSocket.close(1000, "Don't expect to hear from me again")
        }
    })
}
// End functions necessary on serverside. What follows is local. I guess a class would be a good way to represent that.

function bootSchedule(jobScedulerPort){
    const WebSocket = require('ws');
    const wss = new WebSocket.Server({
        perMessageDeflate: false,
        port: jobScedulerPort
    });

    //attach per-connection event listeners...every time a job is dispatched, dispatchTask opens a new connection...
    //so ws represents the particular socket connection...initiated from dispatchTask
    wss.on('connection', function onConnect(ws){ 
        ws.on('close', () => console.log("closed serverside socket related to", ws.hash))
        ws.on('message', function passThe(parcel){
            console.log(parcel)
            let jobObj = JSON.parse(parcel)
            ws.hash = jobObj.hash            
            takeAction(jobObj, ws) //passes this particular socket to that subprocess so messages can be returned by the subprocess via ws.send() THIS is the server-2-server websocket, its just the socket object being passed to the event listeners running on the websocket server.
        })
    })
}

let executeShell = require('./runShell.js')
let executeMYSQL = require('./runSQL.js').mysql
let executePSQL = require('./runSQL.js').psql

function takeAction(parcel, ws){ //this is the server 2 server socket, 
    parcel.status = 'started'
    switch(parcel.type){
        case 'image': parcel.status = 'done'; parcel.jobTime = 0; break; //nothing needs to be done. img tag is rendered, Maybe future things will require more work.
        case 'sql': executeMYSQL(parcel, ws); break;
        case 'psql': executePSQL(parcel, ws); break;
        case 'shell': executeShell(parcel, ws); break;
    }
    ws.send(JSON.stringify(parcel)) //so ws.send will reply to App-Featured's call of dispatchTask
}

//connectScheduler('ws://localhost:8080') returns websocket object to attach listeners and invoke senders.
function connectToSchedule(ws_address){
    const WebSocket = require('ws');
    return new WebSocket(ws_address, {
        perMessageDeflate: false
    });
}

module.exports = {connectToSchedule, dispatchTask, bootSchedule}