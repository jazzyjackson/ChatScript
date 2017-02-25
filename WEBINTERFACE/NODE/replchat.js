let ConnectionHandler = require('./connectionHandler.js')
let repl = require('repl')

const chatscript_config = {port: process.env.CSPORT || 1024, 
                           host: process.env.CSHOST || 'localhost',
                           defaultUser: 'guest',
                           defaultBot: 'harry'}

let Harry = new ConnectionHandler(chatscript_config)

Harry.chat(':reset')
     .then(botResponse => console.log(botResponse.output))
     .then(bootRepl)
     .catch(response => {
        if(response.error){
          console.log('error: ', response.error)
          console.log('Let me try to start the chatscript server myself')
          Harry.startServer()
          Harry.chat(':reset')
               .then(botResponse => console.log(botResponse.output))
               .then(bootRepl)
               .catch(error => console.log(`I wasn't able to start the server. Received message: ${error}`))
        }
     })

function bootRepl(){
  function myEval(message, context, filename, callback) {
    Harry.chat(message).then( response => callback(response.output))
  }
  repl.start({prompt: '> ', eval: myEval});
}