let input = document.querySelector('form')

input.addEventListener('submit', function submit(event){
    event.preventDefault()
    let input = event.target.elements[0]
    disableInput(input, true)
    let thisDataPipe = new WebSocket(`ws://${location.hostname}:2000`)
    thisDataPipe.onopen = () => {
        thisDataPipe.send(input.value || '...') //if user submits an empty string, substitute it with ... so the conversation doesn't restart from a null message
        // thisDataPipe.close()
    }

    thisDataPipe.onmessage = function digest(data){
        // console.log(data)
        botResponse = JSON.parse(data.data)
        let convo = document.getElementById('convo')
        console.log("bot hash:", botResponse.hash)

        let possiblyExtantOutput = document.getElementById(botResponse.hash)
        if(botResponse.input && botResponse.input[0] == ':'){ //I see you just run a command, I know that I'll get a string back.
            convo.prependChild(parseHTML(renderInput(botResponse)))
            convo.prependChild(parseHTML(renderDiagnostics(botResponse)))
            disableInput(input, false) //let the user type again.
            thisDataPipe.close() //Don't expect to hear anymore from you!
        } else if(botResponse.input && possiblyExtantOutput) { 
            newNode = parseHTML(renderOutput(botResponse))
            convo.replaceChild(newNode, possiblyExtantOutput) //use reference to old node to replace it.
        } else { //the node does not yet exist, so:
            convo.prependChild(parseHTML(renderInput(botResponse)))
            thisNode = parseHTML(renderOutput(botResponse))
            convo.prependChild(thisNode)
            disableInput(input, false) //let the user type again.
        }
            //lol this isn't a good strategy if I'm counting on the node to exist by the time an update comes in!
            // setTimeout(()=>{
            //     convo.prependChild(thisNode)
            // },  botResponse.output.length * 5) //The longer the output message, the longer the delay before it's displayed. 
        // } else if(botResponse.update){
        //     //The table is a little more difficult to update, in the case of the terminal messages, the 
        //     console.log("update:",possiblyExtantOutput)
        //     console.log(botResponse.update)
        //     let table = possiblyExtantOutput.querySelector('tbody')
        //     let newHTML = parseTableData(`<tr><td>${botResponse.update.join('</td><td>')}</td></tr>`)
        //     console.log(newHTML)
        //     table.appendChild(newHTML)
        // }

        //could make some determination as to whether the socket should be closed inside those last two flow conditionals
        if( (botResponse.input && !botResponse.type) || botResponse.status == 'done'){
            thisDataPipe.close() //if there was no job to do, or if the job is done, close the websocket.
        }
    }
})


//make bubbles receives the botResponse from the server and determines the html to display
//it renders a new html Node for every socket connection from the server...so by the time an object is passed here it should have all requisite information
// function makeBubbles(botResponse){
//     // let convo = document.getElementById('convo')
//     // convo.prependChild(parseHTML(renderInput(botResponse))) //the input text is prepending ASAP
//     return [parseHTML(renderInput(botResponse)), parseHTML(renderOutput(botResponse))] //render Output will have to do the decision making. It can be a smart template. functions that return htmlsnippets if they're relevant.
// }

function errorBubble(error){
    let convo = document.getElementById('convo')
    convo.prependChild(parseHTML(renderError(error)))
}

function disableInput(inputNode, disabled){
    //check if its already where you want it before 
    if(disabled){
        inputNode.setAttribute('disabled',true)
        inputNode.style.background = 'darkgrey'
    } else {
        inputNode.value = ''   
        inputNode.removeAttribute('disabled')
        inputNode.style.background = 'white'
        inputNode.focus()
    }
}

HTMLDivElement.prototype.prependChild = function(htmlNode){
    this.insertBefore(htmlNode, this.children[1])
}

setInterval(function updateTasks(){
    Array.from(document.querySelectorAll(".timestamp.started"), timeNode => {
        let iso8601 = timeNode.getAttribute('time')
        timeNode.textContent = "Task started " + moment(iso8601).fromNow()
    })
}, 60000) //once every minute