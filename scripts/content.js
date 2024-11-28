
// function addMyKudosToMenu() {
//     const dropdownMenu = document.getElementsByClassName("user navigation actions")[0]
//     console.log("content loaded")
//     console.log(dropdownMenu)
//     if (dropdownMenu) {
//         console.log(dropdownMenu)
//         dropdownMenu.addEventListener('mouseover', function () {
//             let li = document.createElement("li")
//             let a = document.createElement("a")

//             a.className = "my-kudos"
//             a.textContent = "My Kudos"
//             li.className = "my-kudos"
//             li.appendChild(a)
//             let index = this.children[0].children[1].children.length - 1

//             if (this.children[0].children[1].children[index].textContent !== "My Kudos") {
//                 this.children[0].children[1].appendChild(li)
//                 a.addEventListener('click', function () {
//                     chrome.runtime.sendMessage({ action: "MyKudos" })
//                 })
//             }
//         });
//     }
// }

if (document.readyState !== 'loading') {
    scrapeKudosFromPage()
} else {
    document.addEventListener('DOMContentLoaded', scrapeKudosFromPage);
}

function scrapeKudosFromPage(){
    const kudosButton = document.getElementById("kudo_submit")
    
    if (kudosButton !== null) {
        kudosButton.addEventListener("click", () => {
            let ficObject = {}
            let ficName = document.getElementsByClassName("title heading")[0].textContent.trim() || ''

            ficObject["ficWarnings"] = document.querySelector("dd.warning.tags > ul > li").innerHTML.trim() || ''

            ficObject["ficCategories"] = document.querySelector("dd.category.tags > ul").innerHTML.trim() || ''

            ficObject["ficFandom"] = document.querySelector("dd.fandom.tags > ul > li").innerHTML.trim() || ''

            ficObject["ficRelationships"] = document.querySelector("dd.relationship.tags > ul").innerHTML.trim() || ''

            ficObject["ficCharacters"] = document.querySelector("dd.character.tags > ul").innerHTML.trim() || ''

            ficObject["ficTags"] = document.querySelector("dd.freeform.tags > ul").innerHTML.trim() || ''

            ficObject["ficLanguage"] = document.querySelector("dd.language").innerHTML.trim() || ''

            ficObject["ficStats"] = document.querySelector("dl.stats").innerHTML.trim() || ''

            ficObject["ficName"] = ficName
            ficObject["ficUrl"] = window.location.href

            ficObject["ficAuthor"] = document.getElementsByClassName("byline heading")[0].innerHTML.trim() || ''

            let ficChapter = document.querySelector("div.chapter")
            if (!ficChapter || ficChapter.getAttribute("id") === "chapter-1") {
                ficObject["ficSummary"] = document.querySelector(".userstuff").innerHTML.trim() || ''
            } else {
                ficObject["ficSummary"] = ""
            }

            console.log(ficObject)
            updateStorage('fics', ficName, ficObject)
        })
    }
}

function updateStorage(ficsObject, element, ficObject) {
    let objArray = {}
    objArray[element] = ficObject 

    chrome.storage.session.get(["storedFics"], function (result) {
        let combinedArray = {}
        if (result !== undefined) {
            combinedArray = {...objArray, ...result.storedFics}
        } else {
            combinedArray = objArray
        }
        
        chrome.storage.session.set({storedFics: combinedArray });
    })
}

// document.addEventListener('DOMContentLoaded', function () {
//     const dropdownMenu = document.getElementsByClassName("user navigation actions")[0]
//     console.log("content loaded")
//     console.log(dropdownMenu)
//     if (dropdownMenu){
//         console.log(dropdownMenu)
//         dropdownMenu.addEventListener('mouseover', function () {
//             let li = document.createElement("li")
//             let a = document.createElement("a")

//             a.className = "my-kudos"
//             a.textContent = "My Kudos"
//             li.className = "my-kudos"
//             li.appendChild(a)
//             let index = this.children[0].children[1].children.length - 1

//             if (this.children[0].children[1].children[index].textContent !== "My Kudos") {
//                 this.children[0].children[1].appendChild(li)
//                 a.addEventListener('click', function () {
//                     chrome.runtime.sendMessage({ action: "MyKudos" })
//                 })
//             }
//         });
//     }
// })
function addMyKudosToMenu(){
    const dropdownMenu = document.getElementsByClassName("user navigation actions")[0]
    console.log("content loaded")
    console.log(dropdownMenu)
    if (dropdownMenu) {
        console.log(dropdownMenu)
        dropdownMenu.addEventListener('mouseover', function () {
            let li = document.createElement("li")
            let a = document.createElement("a")

            a.className = "my-kudos"
            a.textContent = "My Kudos"
            li.className = "my-kudos"
            li.appendChild(a)
            let index = this.children[0].children[1].children.length - 1

            if (this.children[0].children[1].children[index].textContent !== "My Kudos") {
                this.children[0].children[1].appendChild(li)
                a.addEventListener('click', function () {
                    chrome.runtime.sendMessage({ action: "MyKudos" })
                })
            }
        });
    }
}

if (document.readyState !== 'loading') {
    addMyKudosToMenu()
} else {
    document.addEventListener('DOMContentLoaded', addMyKudosToMenu);
}


// const mykudosButton = document.getElementsByClassName("my-kudos")[0]

// if (mykudosButton){
//     mykudosButton.addEventListener('click', function () {
//         console.log("worked")
//         chrome.runtime.sendMessage({ action: "MyKudos"})
//         chrome.tabs.create({ 'url': chrome.extension.getURL('popup.html'), 'selected': true });
//     })
// }


// function openTab(filename) {
//     var myid = chrome.i18n.getMessage("@@extension_id");
//     chrome.windows.getCurrent(function (win) {
//         chrome.tabs.query({ 'windowId': win.id }, function (tabArray) {
//             for (var i in tabArray) {
//                 if (tabArray[i].url == "chrome-extension://" + myid + "/" + filename) { // 
//                     console.log("already opened");
//                     chrome.tabs.update(tabArray[i].id, { active: true }); 
//                     return;
//                 }
//             }
//             chrome.tabs.create({ url: chrome.extension.getURL(filename) });
//         });
//     });
// }