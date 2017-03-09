//HTML render functions to be placed on the global scope
const renderMessage = botResponse => 
`<div class="message hideOutput">
    ${renderInput(botResponse)}
    ${botResponse.error ? renderError(botResponse) : renderOutput(botResponse)}
</div>`

const renderDebug = botResponse => 
`<div class="message debug">
    ${botResponse.input ? renderInput(botResponse) : ''}
    ${botResponse.output ? renderOutput(botResponse) : ''}
    <div class="rawJSON">
        <pre><code>${JSON.stringify(botResponse, null, 2)}</code></pre>
    </div>
</div>
`

const renderInput = botResponse => 
`<div class="input">
    ${botResponse.input}
</div>`

const renderOutput = botResponse => 
`<div class="output">
    ${botResponse.output}
</div>`

const renderError = error => 
`<div class="output error">
    ${error}
</div>`


const parseHTML = htmlString => {
    let tempdiv = document.createElement('div')
    tempdiv.innerHTML = htmlString
    return tempdiv.firstChild
}