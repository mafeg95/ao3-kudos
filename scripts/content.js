if (document.readyState !== 'loading') {
    scrapeKudosFromPage()
    addMyKudosToMenu()
    updateUsername()
} else {
    document.addEventListener('DOMContentLoaded', scrapeKudosFromPage);
    document.addEventListener('DOMContentLoaded', addMyKudosToMenu);
    document.addEventListener('DOMContentLoaded', updateUsername);
}

function iterateThroughChildren(htmlCollection){
    let stringArray = []

    for (let i = 0; i < htmlCollection.length; i++) {
        const element = htmlCollection[i];
        stringArray.push(element.textContent)
    }
    return stringArray
}

function buildStatsObj(htmlCollection) {
    let obj = {}
    for (let i = 0; i < htmlCollection.length; i++) {
        const element = htmlCollection[i];
        if (i % 2 === 0) {
            obj[element.textContent] = htmlCollection[i + 1].textContent
        }
    }
    return obj
}

function scrapeKudosFromPage(){
    const kudosButton = document.getElementById("kudo_submit")
    
    if (typeof kudosButton !== "undefined" && kudosButton !== null) {
        kudosButton.addEventListener("click", () => {
            let ficObject = {}
            let propertiesObject = {}
            let statsObject = {}

            let ficName = document.getElementsByClassName("title heading")[0].textContent.trim() || ''

            ficObject["ficWarnings"] = document.querySelector("dd.warning.tags > ul").innerHTML.trim() || ''
            propertiesObject["ficWarnings"] = iterateThroughChildren(document.querySelector("dd.warning.tags > ul").children)

            ficObject["ficCategories"] = document.querySelector("dd.category.tags > ul").innerHTML.trim() || ''
            propertiesObject["ficCategories"] = iterateThroughChildren(document.querySelector("dd.category.tags > ul").children)

            ficObject["ficFandom"] = document.querySelector("dd.fandom.tags > ul").innerHTML.trim() || ''
            propertiesObject["ficFandom"] = iterateThroughChildren(document.querySelector("dd.fandom.tags > ul").children)

            ficObject["ficRelationships"] = document.querySelector("dd.relationship.tags > ul").innerHTML.trim() || ''
            propertiesObject["ficRelationships"] = iterateThroughChildren(document.querySelector("dd.relationship.tags > ul").children)

            ficObject["ficCharacters"] = document.querySelector("dd.character.tags > ul").innerHTML.trim() || ''
            propertiesObject["ficCharacters"] = iterateThroughChildren(document.querySelector("dd.character.tags > ul").children)

            ficObject["ficTags"] = document.querySelector("dd.freeform.tags > ul").innerHTML.trim() || ''
            propertiesObject["ficTags"] = iterateThroughChildren(document.querySelector("dd.freeform.tags > ul").children)

            ficObject["ficLanguage"] = document.querySelector("dd.language").innerHTML.trim() || ''

            ficObject["ficStats"] = document.querySelector("dl.stats").innerHTML.trim() || ''
            statsObject = buildStatsObj(document.querySelector("dl.stats").children)

            ficObject["ficName"] = ficName
            ficObject["ficUrl"] = window.location.href

            ficObject["ficAuthor"] = document.getElementsByClassName("byline heading")[0].innerHTML.trim() || ''

            let ficChapter = document.querySelector("div.chapter")
            if (!ficChapter || ficChapter.getAttribute("id") === "chapter-1") {
                ficObject["ficSummary"] = document.querySelector(".userstuff").innerHTML.trim() || ''
            } else {
                ficObject["ficSummary"] = ""
            }

            updateFicStorage(ficName, ficObject)
            updateFilterStorage(ficObject, propertiesObject)
            // console.log("test")
            updateSortByStorage(ficName, ficObject, statsObject)
        })
    }
}

function updateFicStorage(element, ficObject) {
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

function updateFilterStorage(ficObject, propertiesObject){

    chrome.storage.session.get(["filterObject"], function(result){
        let newObject = {}
        
        let warningsObject = iterateOrAdd(propertiesObject, ficObject, result, "ficWarnings", "warnings")
        newObject["warnings"] = warningsObject

        let fandomObject = iterateOrAdd(propertiesObject, ficObject, result, "ficFandom", "fandoms")
        newObject["fandoms"] = fandomObject

        let relationshipObject = iterateOrAdd(propertiesObject, ficObject, result, "ficRelationships", "relationships")
        newObject["relationships"] = relationshipObject
        
        let categoriesObject = iterateOrAdd(propertiesObject, ficObject, result, "ficCategories", "categories")
        newObject["categories"] = categoriesObject
        
        let charactersObject = iterateOrAdd(propertiesObject, ficObject, result, "ficCharacters", "characters")
        newObject["characters"] = charactersObject

        let tagsObject = iterateOrAdd(propertiesObject, ficObject, result, "ficTags", "tags")
        newObject["tags"] = tagsObject

        chrome.storage.session.set({ filterObject: newObject});
    })

}

function iterateOrAdd(ficProperties, ficContent, result, ficString, resultString){
    let combinedObj = {}
    // console.log("iterateOrAdd")
    let propertyValue = ficProperties[ficString] // arcane // [angst, romance, slow burn]
    if (typeof propertyValue === "string"){
        
        combinedObj = addNewFicToObject(propertyValue, ficContent, result, ficString, resultString)
    } else {
        for (let i = 0; i < propertyValue.length; i++) {
            let ficPropertyValue = propertyValue[i]; // angst // romance // slow burn
            // console.log(ficPropertyValue)
            combinedObj = { ...combinedObj, ...addNewFicToObject(ficPropertyValue, ficContent, result, ficString, resultString)}
            // debugger
        }
    }
    // debugger
    // console.log(combinedObj)
    return combinedObj
}

function addNewFicToObject(ficPropertyValue, ficContent, result, ficString, resultString){
   
    let ficName = ficContent.ficName

    let resultProperty = {}
    if (Object.keys(result).length !== 0 && result.filterObject[resultString]){

        resultProperty = result.filterObject[resultString] // {arcane: fic1, the 100}
        if (resultProperty[ficPropertyValue]){ 
            resultProperty[ficPropertyValue][ficName] = ficContent
        } else {
            let fic = {}
            fic[ficName] = ficContent 
            resultProperty[ficPropertyValue] = fic
        }
        
    } else{
        let fic = {}
        fic[ficName] = ficContent // {name: fic}

        // let property = {}
        resultProperty[ficPropertyValue] = fic // {arcane: {name:fic}} 

    }

    return resultProperty // {fandom: fandom1: fic1} tags: tag1
}

function updateSortByStorage(ficName, ficObject, statsObject){
    // kudos 
    // wordCount

    chrome.storage.session.get(["toSort"], function (result) {
        let newObject = {}

        // result.toSort.kudos

        chrome.storage.session.set({ toSort: newObject });
    })

}

function binarySearch(element, array){

    return sorted 
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