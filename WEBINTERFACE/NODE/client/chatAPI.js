let input = document.querySelector('form')
input.addEventListener('submit', event => {
    event.preventDefault()
    let input = event.target.elements[0]
    disableInput(input, true)
    fetch('./chat?message=' + encodeURIComponent(input.value))
    .then(responseObj => responseObj.json())
    .then(makeBubbles)
    .then(()=>disableInput(input, false))
    .catch(errorBubble)
})

function makeBubbles(botResponse){
    let convo = document.getElementById('convo')
    convo.prependChild(parseHTML(renderInput(botResponse)))
    //optional delay, longer message takes longer to pop up.
    //makes it feel a little more realistic, 'the bot is typing'
    //don't delay if the input was a command.
    let delay = botResponse.input[0] == ':' ? 0 : botResponse.output.length * 5;
    setTimeout(()=>{
        convo.prependChild(parseHTML(renderOutput(botResponse)))
    }, delay) //character length * 5ms
}

function errorBubble(error){
    let convo = document.getElementById('convo')
    convo.prependChild(parseHTML(renderError(error)))
}

function disableInput(inputNode, disabled){
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

let clientSocket = new WebSocket(`ws://${location.host}`)
// clientSocket.on('')