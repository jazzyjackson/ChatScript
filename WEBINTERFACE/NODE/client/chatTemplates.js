//HTML render functions to be placed on the global scope
const renderInput = botResponse => 
`<div class="message">
    <div class="input">
        <h3>${botResponse.input}</h3>
    </div>
 </div>
`
const renderDiagnostics = botResponse => 
`<div class="message">
    <div class="output diagnostics">
        <pre><code>${botResponse.output}</code></pre>
    </div>
</div>`


const renderOutput = botResponse => 
`<div id="${botResponse.hash}" class="message">
    <div class="output">
        <h3>${botResponse.output.trim()}</h3>
        ${botResponse.type == 'shell' ? renderCode(botResponse) : '' }
        ${botResponse.type == 'sql' ? renderTable(botResponse) : '' }
        ${botResponse.type == 'image' ? `<img src='./static/img/${botResponse.command}'/>` : '' }
        ${botResponse.type == 'error' ? `<div class="error">${botResponse.error}</div>` : '' }
        ${renderTimestamp(botResponse)}
        ${renderAttachments(botResponse)}
    </div>
 </div>
`


/* sub components */
/* this should render the table but right now its serverside so just spit out the result. */
const renderTable = botResponse => 
`${botResponse.result ? (botResponse.result) : '' }
`

const renderCode = botResponse => 
`${botResponse.result ? `<pre><code>${botResponse.result}</pre></code>` : ``}
`

/* sub sub components */

const renderTimestamp = botResponse => 
`${botResponse.status == 'started' ? `<div class="timestamp started" time="${botResponse.timestamp}">
                                        Task started ${moment(botResponse.timestamp).fromNow()}
                                    </div>` : '' }
 ${botResponse.status == 'done' ? `<div class="timestamp finished" title="${new Date(botResponse.timestamp).toString()}">
                                        This task took ${convertMillisec(botResponse.jobTime)} 
                                    </div>` : '' }

`
//the unmentioned case is if botResponse.status is undefined, then this will return an empty string, which is fine.

const renderAttachments = botResponse => 
    botResponse.filenames ? `<div class="attachments">
                                <span>Files attached:</span>${botResponse.filenames.map(filename => 
                                    `<a href="./csv/${filename}">
                                        ${filename}
                                    </a>`).join('')}
                                </div>`
                           : `` //if there are filenames, map over them, create links... else, return empty string



/* helper functions */
function convertMillisec(numberOfmilliseconds){
    if(numberOfmilliseconds < 1000) return `${numberOfmilliseconds} ms`
    else if(numberOfmilliseconds < 120000) return `${(numberOfmilliseconds / 1000).toPrecision(4)} seconds`
    else return `${(numberOfmilliseconds / 60000).toPrecision(3)} minutes`
}

const parseHTML = htmlString => {
    let tempdiv = document.createElement('div')
    tempdiv.innerHTML = htmlString
    return tempdiv.firstChild
}
const parseTableData = htmlString => {
    let tempdiv = document.createElement('tbody')
    tempdiv.innerHTML = htmlString
    return tempdiv.firstChild
}