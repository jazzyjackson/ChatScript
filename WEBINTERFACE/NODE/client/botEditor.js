let theCodeMirror = CodeMirror.fromTextArea(document.querySelector('textarea'), {lineNumbers: true})

/*mark edited documents with a star. If changes were undone, undo the star.
on change: check isClean, then grab the doc object, compare it to the values of the allTheDocs object to get the corresponding key / filename.

Find the LI that contains that filename, and mark class edited or not.

When 'save all' is clicked, grab querySelectorAll('edited') and save those.

*/
theCodeMirror.on('change', codemirror => {
    //when a change is made, check if the change put the document to its original state or an edited state. Reassign the classname of the LI node accordingly so an 'edited' indicator can be displayed, and the 'save all' function can know what files to save. 
    let thisDoc = codemirror.getDoc()
    let thisName = getNameFromDoc.get(thisDoc)
    if(thisDoc.isClean()){
        thisName.className = thisName.className.replace(/\sedited/, '')
    } else if(!thisName.className.includes('edited')){
        thisName.className += ' edited'
    }
})

let getDocFromName = new Map()
let getNameFromDoc = new Map()

function joinPath(){
    return Array.from(arguments).join('/').replace(/\/+/g, '/' ) //to replace groups of duplicate slashes with single slashes
}

//When a filename is clicked, the document might already exist in docObj, or it may need to be fetched from the server. The function that fires on click and handles the codemirror's swapdoc shouldn't need to worry about whether the document exists yet, so we'll have a promise that resolves once the doc exists.

let allTheFilenames = document.querySelectorAll('.filename')
Array.from(allTheFilenames, li => li.addEventListener('click', event => {
    fetchDoc(event.target).then(thisDoc => {
        theCodeMirror.swapDoc(thisDoc)
    })
}))

function fetchDoc(fileNode){
    return new Promise((resolve, reject) => {
        if(getDocFromName.get(fileNode)){
            resolve(getDocFromName.get(fileNode))
        } else {
            let filename = event.target.textContent //textContent is the filename
            let dirname = event.target.parentNode.querySelector('.dirname').textContent
            let fullpath = joinPath(dirname, filename)
            fetch(`/document?fullpath=${encodeURIComponent(fullpath)}`)
            .then(response => response.text())
            .then(plaintext => {
                let theDoc = CodeMirror.Doc(plaintext)
                getDocFromName.set(fileNode, theDoc)
                getNameFromDoc.set(theDoc, fileNode)
                resolve(theDoc)
            })
            .catch(error => reject(error))
        }
    })
}