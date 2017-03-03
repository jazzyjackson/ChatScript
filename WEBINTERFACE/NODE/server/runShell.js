const spawn = require('child_process').spawn
/*
It's important to consider the working directory of the process. child_process.spawn by default execute in the cwd of the node process that called it.
So if app-featured.js is running inside its folder, /NODE/, which calls dispatchTask which calls takeAction which calls executeShell - cwd in /NODE/
so this python script is run in that context.
*/

module.exports = function executeShell(thisJob, ws){
    let commandLine = thisJob.command.split(' ')
    let pipeline = spawn(commandLine.shift(), commandLine)

    pipeline.stdout.on('data', data => {
        let thisChunk =  data.toString('utf8');
        let possibleFileName = thisChunk.match(/[.\w]+.csv/)
        if(possibleFileName){
            if(thisJob.filenames) thisJob.filenames.push(possibleFileName[0]) //push filename if there already exists that prop
            else thisJob.filenames = [possibleFileName[0]] // else assign an array containing the first filename it found.
        }
        thisJob.result || (thisJob.result = '') //create an empty string if its undefiend.
        thisJob.result += thisChunk
        ws.send(JSON.stringify(thisJob))
    })
    
    pipeline.on('close', code => {
        console.log(thisJob.command, 'exited with process code', code)
        thisJob.status = code === 0 ? 'done' : 'error'
        thisJob.jobTime = new Date() - new Date(thisJob.timestamp)
        ws.send(JSON.stringify(thisJob))
    })
    
    //three places errors get spit out
    pipeline.stderr.on('data', writeError)
    pipeline.stderr.on('error', writeError)
    pipeline.on('error', writeError)
    function writeError(error){
        thisJob.type = 'error'
        thisJob.error = error.toString('utf8')
        ws.send(JSON.stringify(thisJob))
    }
}