//HTML render functions to be placed on the global scope
const renderInput = botResponse => 
`<div class="input">
    ${botResponse.input}
</div>`

const renderOutput = botResponse => 
`<div class="output">
    ${botResponse.output}
</div>`

const renderError = error => 
`<div class="error">
    ${error}
</div>`

const parseHTML = htmlString => {
    let tempdiv = document.createElement('div')
    tempdiv.innerHTML = htmlString
    return tempdiv.firstChild
}