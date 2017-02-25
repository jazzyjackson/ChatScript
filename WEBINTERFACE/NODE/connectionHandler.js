const net = require('net');
const spawn = require('child_process').spawn
//more information on the net built-in module of node in the docs: https://nodejs.org/api/all.html#net_net_connect_options_connectlistener
//allows us to make raw TCP connections
const chatscript_config = {port: process.env.CSPORT || 1024, 
                           host: process.env.CSHOST || 'localhost'}
const username = 'guest' 
const botname = 'harry'
/*this username is for initial connection. Once the server is running, 
this file will attempt to connect to chatscript. If it's successful,
it will check an environment variable to see if its running interactively 
(in a terminal) or as a child process to another node server.
As a node module, this file exposes an api for transmitting 
username, botname, and message to the ChatScript server
As a standalone process, it provides kind of a two-for-one 'local' chat 
 + the ability to chat with the server from other processes.
*/

//When a server starts, it should call cs_init to check it connection and offer to start chatscript
cs_interactive_init(username,botname)
function cs_interactive_init(username, botname){
  //the initial message must be null for a new user. a null botname will be routed to default bot.
  //for future messages to default username and botname, you can simply call chat with a single argument.
  return chat(':reset', username, botname)
        .then(botResponse => {
          console.log(botResponse)
          
        })
        .catch(errorMsg => {
          console.log(errorMsg)
        })
}

function chat(message, username, botname){
  return new Promise((resolve, reject)=>{
    let client = net.connect(chatscript_config, () => {
      console.log(`connection established to ${chatscript_config.host}:${chatscript_config.port}`)
      //on a successful connection, write to the socket with 3 arguments, null terminated. (\u0000 is the unicode null character)
      //details of this message protocol may be found in DOCUMENTATION/CLIENTS-AND-SERVERS/ChatScript-ClientServer-Manual
      let chatstring = `${username}\u0000${botname}\u0000${message}\u0000`
      //regexing the unicode null values just to see how its done. You can change the separater (NULL) here if it makes a difference to you. Otherwise they render as spaces.
      // console.log(`transmitting ${chatstring.replace(/\u{0000}/ug,'NULL')}`) 
      console.log(chatstring)
      client.write(chatstring);
    });
    client.on('data', (data) => {
      resolve(data.toString());
      client.end();
    });
    client.on('end', () => {
      //this will reject the promise only if the connection is closed before data is received. 
      //If the promise is resolved by receiving data, great, this rejection won't make a difference
      reject('disconnected from server');
    });
    client.on('error', () => {
      reject(`failed to connect to ${chatscript_config.host}:${chatscript_config.port}`)  
    })
  })
}

function checkOS(){
  if(process.env.OS && process.env.OS.toUpperCase().includes('WINDOWS')){
    return 'WINDOWS';
  }
}
