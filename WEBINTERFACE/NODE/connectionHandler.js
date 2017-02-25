const net = require('net');
const spawn = require('child_process').spawn
const exec = require('child_process').exec
const path = require('path')
//more information on the net built-in module of node in the docs: https://nodejs.org/api/all.html#net_net_connect_options_connectlistener
//allows us to make raw TCP connections

class ConnectionHandler {
  constructor(chatscript_config){
    this.chatscript_config = chatscript_config
  }

  getOS(){
    if(process.env.OS && process.env.OS.toUpperCase().includes('WINDOWS')){
      return 'WINDOWS';
    }
  }
  log(output){
    if(this.debug == true){
      console.log(output)
    }
  }
}

ConnectionHandler.prototype.chat = function(message, username = this.chatscript_config.defaultUser, botname = this.chatscript_config.defaultBot){ //guest and harry are default values if chat is called with only a message
  let {port, host} = this.chatscript_config
  return new Promise((resolve, reject)=>{
    let client = net.connect(this.chatscript_config, () => {
      this.log(`connection established to ${host}:${port}`)
      //on a successful connection, write to the socket with 3 arguments, null terminated. (\u0000 is the unicode null character)
      //details of this message protocol may be found in DOCUMENTATION/CLIENTS-AND-SERVERS/ChatScript-ClientServer-Manual
      let chatstring = `${username}\u0000${botname}\u0000${message}\u0000`
      //regexing the unicode null values just to see how its done. You can change the separater (NULL) here if it makes a difference to you. Otherwise they render as spaces.
      // this.log(`transmitting ${chatstring.replace(/\u{0000}/ug,'NULL')}`) 
      this.log(chatstring)
      client.write(chatstring);
    });
    client.on('data', (data) => {
      resolve({output: data.toString(), input: message});
      client.end();
    });
    client.on('end', () => {
      //this will reject the promise only if the connection is closed before data is received. 
      //If the promise is resolved by receiving data, great, this rejection won't make a difference
      reject({message: `the server at ${host}:${port} closed the connection.`});
    });
    client.on('error', () => {
      reject({error: `failed to connect to ${host}:${port}`})  
    })
  })
}

ConnectionHandler.prototype.startServer = function(){
  if(this.getOS() === 'WINDOWS'){
      let {port} = this.chatscript_config
      let chatserver = spawn('./BINARIES/chatscript',[`port=${port}`],{cwd: path.join(__dirname, '../../')})
      chatserver.stdout.on('close', processcode => this.log('chatscript exited with process code: ', processcode))
      this.log(`starting chatscript as a child process of connectionHandler.js on localhost:${port}`)    
  } else {
      this.log(`I couldn't detect your operating system, so chatscript was not started.`)
  }
}

module.exports = ConnectionHandler