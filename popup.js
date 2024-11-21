// chrome.runtime.onMessage.addListener(
//     function (request, sender, sendResponse) {
//         console.log(sender.tab ?
//             "from a content script:" + sender.tab.url :
//             "from the extension");
//         let element = document.createElement("li")
//         element.textContent = request.name
//         element.className = "stories"
//         console.log(element)
//         let fics = document.getElementById("fics")
//         // console.log(name)
//         // console.log(fics)
//         fics.appendChild(element)
//         console.log('worked')
//         console.log(request.name)
//         console.log(sendResponse)
        
//         // chrome.storage.sync.set(
//         //      { name: request.name },
//         //     { name: request.name },
//         //     () => {
//         //         // Update status to let user know options were saved.
//         //         const status = document.getElementById('status');
//         //         status.textContent = 'Options saved.';
//         //         setTimeout(() => {
//         //             status.textContent = '';
//         //         }, 750);
//         //     }
//         // );
//     }
// );

window.addEventListener('load', function(){

    let fics = document.getElementById("fics")

    chrome.storage.sync.get({ ficKeys2: 'fics'}, function (result) {
        console.log("storage")
        console.log(result)
        let keys = Object.keys(result.ficKeys2)
        console.log(result.ficKeys2)
        keys.forEach(fic => {
            console.log(fic)
            let createdFic = createElementsFromArray(result.ficKeys2[fic])
            fics.appendChild(createdFic)
        });
    })
})


function createElementsFromArray(fic){
    
    let mainDiv = document.createElement("div")
    mainDiv.className = "fic-wrapper"

    // Header components
    let header = document.createElement("div")
    header.className = "fic-header"

    let mainHeader = document.createElement("div")
    mainHeader.className = "name-and-author"

    let ficName = document.createElement("a")
    ficName.innerHTML = fic.ficName
    ficName.href = fic.ficUrl
    ficName.className = "fic-name"

    let ficAuthor = document.createElement("div")
    ficAuthor.innerHTML = fic.ficAuthor
    ficAuthor.className = "fic-author"

    mainHeader.appendChild(ficName)
    // mainHeader.textContent += "by"
    mainHeader.appendChild(ficAuthor)

    header.appendChild(mainHeader)

    let ficFandom = document.createElement("div")
    ficFandom.innerHTML = fic.ficFandom
    ficFandom.className = "fic-fandom"

    header.appendChild(ficFandom)
    
    mainDiv.appendChild(header)

    // Tags
    let tagsWrapper = document.createElement("div")
    tagsWrapper.innerHTML = fic.ficWarnings + fic.ficRelationships + fic.ficCharacters + fic.ficTags
    tagsWrapper.className = "tags-wrapper"
    
    mainDiv.appendChild(tagsWrapper)

    // Summary
    let summaryWrapper = document.createElement("div")    
    summaryWrapper.innerHTML = fic.ficSummary
    summaryWrapper.className = "summary-wrapper"

    mainDiv.appendChild(summaryWrapper)

    // Stats
    let statsWrapper = document.createElement("div")
    statsWrapper.innerHTML = fic.ficLanguage + fic.ficStats
    statsWrapper.className = "stats-wrapper"
    
    mainDiv.appendChild(statsWrapper)

    console.log(mainDiv)

    fixLinks(mainDiv)
    return mainDiv
}

// add links for fics 
function fixLinks(mainDiv){
    var links = mainDiv.getElementsByTagName("a");
    for (var i = 0; i < links.length; i++) {
        
        var ln = links[i];
        var location = ln.href.split('/').slice(3).join('/');

        if (location.indexOf("https://archiveofourown.org/") === -1) {
            location = "https://archiveofourown.org/" + location
        }
        console.log(location)
        ln.onclick = function () {
            chrome.tabs.create({ active: true, url: location });
        };
       
    }
};

// links for fics
// window.addEventListener('click', function (e) {
//     if (e.target.href !== undefined) {
//         chrome.tabs.create({ url: e.target.href })
//     }
// })

// function updateStorage(key, element){
//     objArray = []
//     chrome.storage.sync.get(key, function(result){
//         if (result) {
//             objArray = result[key]
//         }

//         objArray.push(element)

//         chrome.storage.sync.set({ key: objArray }, function () {
//             console.log('Updated myObjArray in storage');
//         });
//     })
// }
// var popupWindow = window.open(
//     chrome.extension.getURL("normal_popup.html"),
//     "exampleName",
//     "width=400,height=400"
// );
// window.close();

// const restoreOptions = () => {
//     chrome.storage.sync.get(
//         { favoriteColor: 'red' },
//         (items) => {
//             document.getElementById('color').value = items.favoriteColor;
//         }
//     );
// };