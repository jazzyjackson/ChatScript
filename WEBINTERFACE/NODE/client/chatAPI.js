let input = document.querySelector('form')
let convo = document.getElementById('convo')

input.addEventListener('submit', event => {
    event.preventDefault()
    let input = event.target.elements[0]
    disableInput(input, true)
    fetch('./chat?message=' + encodeURIComponent(input.value || '...')) //if user input is empty, send ... instead, so as not to reset the conversation.
    .then(responseObj => responseObj.json())
    .then(makeBubbles)
    .then(()=>disableInput(input, false))
    .catch(errorBubble)
})

function makeBubbles(botResponse){
    if(!botResponse.output || window.debugmode ){
        convo.prependChild(parseHTML(renderDebug(botResponse)))
    } else {
        let response = parseHTML(renderMessage(botResponse))
        convo.prependChild(response)
        //optional delay, longer message takes longer to pop up.
        //makes it feel a little more realistic, 'the bot is typing'
        //don't delay if the input was a command.
        let delay = botResponse.input[0] == ':' ? 0 : botResponse.output.length * 5;
        setTimeout(()=>{
            response.className.replace('hideOutput','')
        }, delay) //character length * 5ms
    }
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

(location.hash == 'debug') && (window.debugmode = true) //set debug mode if page is loaded with hash.