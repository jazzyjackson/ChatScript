//This boots a websocket server that accepts job requests, spawns child processes, and streams results back to the server, then the client. It is abstracted from the main server so that multiple instances can be spun up with load balancing.

//It includes a websocket server for persistence, but exposes a standalone function that might work on serverless application (AWS Lambda)


function bootSchedule(){
    const WebSocket = require('ws');
    const wss = new WebSocket.Server({
        perMessageDeflate: false,
        port: 8080
    });

    wss.on('connection', function onConnect(ws){
        ws.on('message', function message(message){
            console.log('received ', message)
        })
        ws.send('hello from the schedule')
    })
}



function heartbeat(){
    let ws = connectToSchedule('ws://localhost:8080')
    ws.on('open', error => {
        console.log("I guess I have to be opened")
        console.log(error)
    })

    ws.on('message', message => console.log(message))

    setTimeout(()=>{
        ws.send("Are you awake?", error => {
            if(error){
                console.log("The server is nowhere to be found, certainly not at ws://localhost:8080", error)
            } else {
                console.log("server was awake. closing socket.")
                ws.close(1000,"Just checking to see you're awake")
            }
        })
    }, 250)


 
}

//connectScheduler('ws://localhost:8080') returns ws object to attach listeners and invoke senders.
function connectToSchedule(ws_address){
    const WebSocket = require('ws');
    return new WebSocket(ws_address, {
        perMessageDeflate: false
    });
}

function startJob(){

}

module.exports = {connectToSchedule, startJob, heartbeat, bootSchedule}