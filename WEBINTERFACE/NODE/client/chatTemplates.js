//HTML render functions to be placed on the global scope
const renderInput = botResponse => 
`<div class="message">
    <div class="input">
        ${botResponse.input}
    </div>
</div>`

const renderOutput = botResponse => 
`<div class="message">
    <div class="output">
        ${botResponse.output}
    </div>
</div>`

const renderError = error => 
`<div class="message">
    <div class="output error">
        ${error}
    </div>
</div>`

const parseHTML = htmlString => {
    let tempdiv = document.createElement('div')
    tempdiv.innerHTML = htmlString
    return tempdiv.firstChild
}