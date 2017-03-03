const {mysql_config, psql_config} = require('./credentials')
const path = require('path')
db = require('mysql')
fs = require('fs')

function executeSQL(parcel, ws){
    let queryString = parcel.command
    let connection = db.createConnection(mysql_config)
    let csvfilename = require('crypto').createHash('md5').update(queryString).digest("hex").slice(0,12) + '.csv'
    let pathToFile = path.join(__dirname, '..', 'sqlresults', csvfilename)
    let fileStream = fs.createWriteStream(pathToFile, {defaultEncoding: 'utf8', mode: 0o777})
    thisQuery = connection.query(queryString)
    thisQuery.on('fields', fields => {
        let fieldsBlob = Array.from(fields, fieldPacket => {
            let result = {}
            let {name} = fieldPacket // object deconstruction. name is now a variable containing, for instance, "Tables in Analysis"
            result[name] = name;     //
            return result          
        }).reduce((blob, each) => Object.assign(blob, each))    // reduce Object.assign rolls all the individual objects with unique names for keys and turns it into one big object containing all the names 
        parcel.result = `<table><tbody><tr><td>${Object.keys(fieldsBlob).join('</td><td>')}</td></tr>` //trusting the browser to close tbody and table when it gets a chance...
        ws.send(JSON.stringify(parcel))
        fileStream.write(Object.keys(fieldsBlob).join(', ') + '\n')
    })
    thisQuery.on('result', eachRow => {
        parcel.result += `<tr><td>${Object.entries(eachRow).join('</td><td>')}</td></tr>`
        ws.send(JSON.stringify(parcel))
        fileStream.write(Object.entries(eachRow).join(', ') + '\n')
    })
    //FYI errors are fired before the connection is closed. on END is the last event fired. If there's not an error by then there never will be.

    thisQuery.on('error', error => {
        fileStream.close()
        fs.unlink(pathToFile, () => console.log('deleted empty file'))
        console.log(`error executing ${queryString}`)
        parcel.type = 'error'
        parcel.error = error.code
        parcel.status = 'done'
    })

    thisQuery.on('end', () => { 
        parcel.jobTime = new Date() - new Date(parcel.timestamp)
        parcel.status = 'done'
        parcel.result && (parcel.result += '</tbody></table>')
        if(!parcel.error) parcel.filenames = [csvfilename];
        ws.send(JSON.stringify(parcel))
        ws.close()
    })
    ws.send(JSON.stringify(parcel))        
}

// const mysql = require('node-psql')
function executePSQL(parcel, ws){
    parcel.result = "I don't know how to do PSQL yet"
    parcel.status = "done"
    ws.send(JSON.stringify(parcel))    
}

// The opposite of Object.keys. Actually exists in the browser, but not in node, so just a little helper func.
Object.entries = function(anObj){
    let result = []
        for(key in anObj){
            result.push(anObj[key])
        }
    return result;
}

module.exports = {mysql: executeSQL, psql: executePSQL}