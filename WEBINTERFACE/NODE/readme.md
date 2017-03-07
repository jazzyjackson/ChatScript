About half the size of the ChatScript installation is its git history. To clone the repo without it's history of git commits, use the depth flag like so:

git clone --depth 1 https://github.com/jazzyjackson/ChatScript.git
cd ChatScript/WEBINTERFACE/NODE && node replchat.js

No matter how the server was started (whether as a user initiated terminal process, by the replchat script itself, or from a web server script), replchat allows you to communicate to the server via repl.

Equivelent to running ./ChatScript with a client, except its hackable. Can be extended to run child processes of its own.

You might use replchat and connectionhandler without having chatscript installed on your computer, if you have a host and port to point the program to. Just change the default settings in chatscript_configuration in replchat.js
