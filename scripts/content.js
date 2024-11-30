if (document.readyState !== 'loading') {
    scrapeKudosFromPage()
    addMyKudosToMenu()
    updateUsername()
} else {
    document.addEventListener('DOMContentLoaded', scrapeKudosFromPage);
    document.addEventListener('DOMContentLoaded', addMyKudosToMenu);
    document.addEventListener('DOMContentLoaded', updateUsername);
}

function scrapeKudosFromPage(){
    const kudosButton = document.getElementById("kudo_submit")
    
    if (typeof kudosButton !== "undefined" && kudosButton !== null) {
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

function addMyKudosToMenu(){
    const dropdownMenu = document.getElementsByClassName("user navigation actions")[0]
    
    if (typeof dropdownMenu !== "undefined" && dropdownMenu !== null) {
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

function updateUsername(){
    let username = document.querySelector(".icon > a").href.split("/users/")[1]

    chrome.storage.session.set({ username: username });
}