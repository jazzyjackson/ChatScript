module.exports = topics_object_array => 
`<html>
    <head>
        <link rel="stylesheet" type="text/css" href="/static/editor.css">
        <link rel="stylesheet" href="/codemirror/codemirror.css" defer>
		<script src="/codemirror/codemirror.js" defer></script>
		<script src="/static/botEditor.js" defer></script>
    </head>
    <body>
        <div id="dirTree">
            ${directoryString(topics_object_array)}
        </div>
        <div id="editorBody">
            <textarea> Nothing to see here </textarea>
        </div>
        <div id="chatBody">
            <iframe src="/">
        </div>
    </body>
</html>`

function directoryString(topics_object_array){
    return topics_object_array.map(topic_object => 
        `<ul>
            <li class="dirname">${topic_object.dirname}</li>
            ${topic_object.files.map(filename => `<li class="filename">${filename}</li>`).join('')}
        </ul>`).join('')
}