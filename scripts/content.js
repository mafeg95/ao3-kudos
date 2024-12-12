if (document.readyState !== 'loading') {
    scrapeKudosFromPage()
    addMyKudosToMenu()
    updateUsername()
} else {
    document.addEventListener('DOMContentLoaded', scrapeKudosFromPage);
    document.addEventListener('DOMContentLoaded', addMyKudosToMenu);
    document.addEventListener('DOMContentLoaded', updateUsername);
}

let categoryHeaps = {
    fandoms: new MaxHeap(),
    characters: new MaxHeap(),
    relationships: new MaxHeap(),
    additionalTags: new MaxHeap()
};

chrome.storage.session.get(["categoryHeaps"], function (result) {
    if (result.categoryHeaps) {
        categoryHeaps.fandoms.heap = result.categoryHeaps.fandoms || [];
        categoryHeaps.characters.heap = result.categoryHeaps.characters || [];
        categoryHeaps.relationships.heap = result.categoryHeaps.relationships || [];
        categoryHeaps.additionalTags.heap = result.categoryHeaps.additionalTags || []
    }
});

function updateCategoryHeap(category, items) {
    if (Array.isArray(items)) {
        items.forEach(item => {
            categoryHeaps[category].insertOrUpdate(item, 1);
        });
    } else {
        categoryHeaps[category].insertOrUpdate(items, 1);
    }

    // Save the updated heaps to session storage
    console.log(categoryHeaps)
    chrome.storage.session.set({
        categoryHeaps: {
            fandoms: categoryHeaps.fandoms.heap,
            characters: categoryHeaps.characters.heap,
            relationships: categoryHeaps.relationships.heap,
            additionalTags: categoryHeaps.additionalTags.heap
        }
    });
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

            updateCategoryHeap("fandoms", propertiesObject.ficFandom);
            updateCategoryHeap("characters", propertiesObject.ficCharacters);
            updateCategoryHeap("relationships", propertiesObject.ficRelationships);
            updateCategoryHeap("additionalTags", propertiesObject.ficTags)
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
        newObject["additionalTags"] = tagsObject

        chrome.storage.session.set({ filterObject: newObject});
    })

}

function iterateOrAdd(ficProperties, ficContent, result, ficString, resultString){
    let combinedObj = {}
    let propertyValue = ficProperties[ficString] 

    if (typeof propertyValue === "string"){
        
        combinedObj = addNewFicToObject(propertyValue, ficContent, result, ficString, resultString)
    } else {
        for (let i = 0; i < propertyValue.length; i++) {
            let ficPropertyValue = propertyValue[i]; 
            
            combinedObj = { ...combinedObj, ...addNewFicToObject(ficPropertyValue, ficContent, result, ficString, resultString)}
        }
    }
    return combinedObj
}

function counter(){

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
        fic[ficName] = ficContent 
        resultProperty[ficPropertyValue] = fic 
    }

    chrome.storage.session.get(["counter"]) // {fandom: [{arcane: 1}, {the 100: 2}]} 

    return resultProperty
}

function updateSortByStorage(ficName, ficObject, statsObject){

    chrome.storage.session.get(["sortBy"], function (result) { 
        let newObject = {}
        let elementToAddKudos = {}

        let numberKudos = Number(statsObject["Kudos:"].replace(",", ""))
        elementToAddKudos[ficName] = numberKudos

        if (typeof result.sortBy !== "undefined" && result.sortBy.kudos){
            let newArr = addElementSorted(elementToAddKudos, result.sortBy.kudos)
            newObject["kudos"] = newArr
        } else {
            newObject["kudos"] = [elementToAddKudos]
        }
        
        let elementToAddWordCount = {}
        let wordCount = Number(statsObject["Words:"].replace(",", ""))
        elementToAddWordCount[ficName] = wordCount

        if (typeof result.sortBy !== "undefined" && result.sortBy.words) {
            let newArr = addElementSorted(elementToAddWordCount, result.sortBy.words)
            newObject["words"] = newArr
        } else {
            newObject["words"] = [elementToAddWordCount]
        }

        let elementToAddHits = {}
        let hits = Number(statsObject["Hits:"].replace(",", ""))
        elementToAddHits[ficName] = hits

        if (typeof result.sortBy !== "undefined" && result.sortBy.words) {
            let newArr = addElementSorted(elementToAddHits, result.sortBy.words)
            newObject["hits"] = newArr
        } else {
            newObject["hits"] = [elementToAddHits]
        }


        chrome.storage.session.set({ sortBy: newObject });
    })

}

function addElementSorted(element, array) {
    let loc = Math.abs(binarySearchLocation(array, element, 0, array.length));
    let beginingOfArray = array.splice(0, loc)
    beginingOfArray.push(element)

    return beginingOfArray.concat(array)
}

function binarySearchLocation(array, item, low, high) {
    let itemName = Object.keys(item)[0];
    let itemValue = item[itemName];

    if (high <= low) {
        if (array[low]) {
            let arrayElementName = Object.keys(array[low])[0];
            let elementValue = array[low][arrayElementName];
            // For descending order:
            // If the new item is greater, insert before the current low element.
            return (itemValue > elementValue) ? low : (low + 1);
        } else {
            return low;
        }
    }

    let mid = Math.floor((low + high) / 2);

    let arrayMidElementName = Object.keys(array[mid])[0];
    let elementValue = array[mid][arrayMidElementName];

    if (itemValue === elementValue) {
        // If equal, we insert after the found position to maintain stability.
        return mid + 1;
    }

    // For descending order:
    // If itemValue is greater, move left to find the correct insertion point.
    if (itemValue > elementValue) {
        return binarySearchLocation(array, item, low, mid - 1);
    }

    // If itemValue is smaller, move right.
    return binarySearchLocation(array, item, mid + 1, high);
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