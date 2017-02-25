let ConnectionHandler = require('./connectionHandler.js')
let repl = require('repl')

const chatscript_config = {port: process.env.CSPORT || 1024, 
                           host: process.env.CSHOST || 'localhost',
                           defaultUser: process.env.CSUSER || 'guest',
                           defaultBot: 'harry',
                           debug: false}

let Harry = new ConnectionHandler(chatscript_config)

Harry.chat(':reset')
     .then(botResponse => console.log(botResponse.output))
     .then(bootRepl)
     .catch(response => {
        if(response.error){
          console.log('error: ', response.error)
          console.log('Let me try to start the chatscript server myself')
          Harry.startServer()
          //though windows doesn't mind attempting to hit the server immediately after starting the process, mac os wants some time. Unfortenately, the child process doesn't provide immediate feedback if starting the server was successful or not, so we just have to try to hit it again.
          setTimeout(() => {
            Harry.chat(':reset')
                .then(botResponse => console.log(botResponse.output))
                .then(bootRepl)
                .catch(error => {
                  console.log(`I wasn't able to start the server. Received message: ${error.error}`)
                  process.exit()
                })
          }, 1000)
        }
     })

function bootRepl(){
  function myEval(message, context, filename, callback) {
    Harry.chat(message).then( response => callback(response.output))
  }
  repl.start({prompt: '> ', eval: myEval});
}