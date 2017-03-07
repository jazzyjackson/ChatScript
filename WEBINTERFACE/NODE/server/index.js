module.exports = props =>
    `<head>
        <title>${props.botname}</title>
        <link rel="stylesheet" type="text/css" href="./static/style.css">
        <script defer src="./static/chatTemplates.js"></script>
        <script defer src="./static/chatAPI.js"></script>
        <script defer src="./moment/moment.js"></script>
    </head>
    <body>
        <div id="convo">
            <form>
                <input type="text" placeholder="say something"></input>
            </form>
            <div class="message">
                <div class="output">
                    <p>${props.botResponse.output}</p>
                </div>
            </div>
        </div>
  
    </body>`
