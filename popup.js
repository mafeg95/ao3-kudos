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
    
    chrome.storage.session.get(["ficKeys6"], function (result) { // not quite working
        console.log("storage")
        console.log(result)
        let keys = Object.keys(result.ficKeys6)
        console.log(result.ficKeys6)
        keys.forEach(fic => {
            console.log(fic)
            let createdFic = createElementsFromArray(result.ficKeys6[fic])
            fics.appendChild(createdFic)
        });
    })
})


function createElementsFromArray(fic){ // working - needs css
    
    let mainDiv = document.createElement("li")
    mainDiv.className = "fic-wrapper blurb"

    // Header components
    let header = document.createElement("div")
    header.className = "header module"

    let mainHeader = document.createElement("h4")
    mainHeader.className = "name-and-author heading"
    

    let ficNameEl = document.createElement("a")
    ficNameEl.textContent = fic.ficName
    ficNameEl.href = fic.ficUrl
    ficNameEl.className = "fic-name"
    console.log(`${ficNameEl}`)
    console.log(`${ficNameEl.innerHTML}`)
    // let ficAuthor = document.createElement("a")
    // ficAuthor.innerHTML = fic.ficAuthor
    // ficAuthor.className = "fic-author"
    // let ficNameElString = ""
    mainHeader.appendChild(ficNameEl)
    mainHeader.innerHTML += " by " + fic.ficAuthor
    console.log(mainHeader)
    // mainHeader.textContent += "by"
    // mainHeader.appendChild(ficAuthor)

    header.appendChild(mainHeader)

    let ficFandom = document.createElement("h5")
    ficFandom.innerHTML = fic.ficFandom
    ficFandom.className = "fic-fandom fandom"

    header.appendChild(ficFandom)
    
    mainDiv.appendChild(header)

    // Tags
    let tagsWrapper = document.createElement("ul")
    tagsWrapper.innerHTML = fic.ficWarnings + fic.ficRelationships + fic.ficCharacters + fic.ficTags
    tagsWrapper.className = "tags-wrapper tags commas"
    
    mainDiv.appendChild(tagsWrapper)

    // Summary
    let summaryWrapper = document.createElement("div")    
    summaryWrapper.innerHTML = fic.ficSummary
    summaryWrapper.className = "summary-wrapper summary"

    mainDiv.appendChild(summaryWrapper)

    // Stats
    let statsWrapper = document.createElement("dl")
    statsWrapper.innerHTML = fic.ficLanguage + fic.ficStats
    statsWrapper.className = "stats-wrapper stats"
    console.log(statsWrapper)
    mainDiv.appendChild(statsWrapper)

    console.log(mainDiv)

    fixLinks(mainDiv)
    return mainDiv
}

// add links for fics // working
function fixLinks(mainDiv){
    var links = mainDiv.getElementsByTagName("a");
    for (var i = 0; i < links.length; i++) {
        
        var ln = links[i];
        var location = ln.href.split('/').slice(3).join('/');

        if (location.indexOf("https://archiveofourown.org/") === -1) {
            location = "https://archiveofourown.org/" + location
        }

        ln.href = location;
       
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