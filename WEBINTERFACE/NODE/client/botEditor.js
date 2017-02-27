HTMLElement.prototype.removeClass = function(targetClass){
    let classList = this.className.split(' ')
    let targetIndex = classList.indexOf(targetClass)
    //whoaaaa that bitwise trick where -1 becomes 0 and 0 becomes 1 and 5 becomes -6 which is also truthy.
    ~targetIndex && (classList[targetIndex] = '')
    classList = classList.filter(value => value) //throw out falsey strings
    this.className = classList.join(' ')
}

HTMLElement.prototype.addClass = function(targetClass){
    if(!this.className.split(' ').includes(targetClass)){
        this.className += (' ' + targetClass)
    }
}

let theCodeMirror = CodeMirror.fromTextArea(document.querySelector('textarea'), {lineNumbers: true})

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
    Array.from(allTheFilenames, li => li.removeClass('active'))
    li.addClass('active')
    fetchDoc(event.target).then(thisDoc => {
        theCodeMirror.swapDoc(thisDoc)
    }).catch(error => {
        alert(`There was a problem fetching the filename. Could be that the filename isn't what the server expected, or it could be that the server is no longer serving.`)
    })
}))
//load the first file on page load
let firstFile = allTheFilenames[0]
firstFile.addClass('active')
fetchDoc(firstFile).then(thisDoc => theCodeMirror.swapDoc(thisDoc))

function fetchDoc(fileNode){
    return new Promise((resolve, reject) => {
        if(getDocFromName.get(fileNode)){
            resolve(getDocFromName.get(fileNode))
        } else {
            let filename = fileNode.textContent //textContent is the filename
            let dirname = fileNode.parentNode.querySelector('.dirname').textContent
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
// Set transparent pixel as the drag image
document.getElementById('chatResize').addEventListener('dragstart', event => {
    let nullimage = document.createElement('img')
    nullimage.src = 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw=='
    event.dataTransfer.setDragImage(nullimage,0,0)
})

document.getElementById('chatResize').addEventListener('drag', event => {
    console.log(document.activeElement)
    let newHeight =  (event.view.window.document.documentElement.clientHeight - event.pageY)
    if(chatBody.style.height != newHeight && event.pageY){ //there's a fritz in chrome where the pageY value is 0 when you stop dragging, so, throw that event out. Also only modify the DOM when there's a good reason.
        chatBody.style.height = newHeight
    }
})


