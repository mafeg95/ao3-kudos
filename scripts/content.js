const kudosButton = document.getElementById("kudo_submit")

console.log(kudosButton)
if (kudosButton !== null){
    kudosButton.addEventListener("click", () => {
        let ficObject = {}
        let ficName = document.getElementsByClassName("title heading")[0].textContent.trim()

        ficObject["ficWarnings"] = document.querySelector("dd.warning.tags > ul > li").innerHTML.trim()

        ficObject["ficCategories"] = document.querySelector("dd.category.tags > ul").innerHTML.trim()

        ficObject["ficFandom"] = document.querySelector("dd.fandom.tags > ul > li").innerHTML.trim()

        ficObject["ficRelationships"] = document.querySelector("dd.relationship.tags > ul").innerHTML.trim()

        ficObject["ficCharacters"] = document.querySelector("dd.character.tags > ul").innerHTML.trim()

        ficObject["ficTags"] = document.querySelector("dd.freeform.tags > ul").innerHTML.trim()

        ficObject["ficLanguage"] = document.querySelector("dd.language").innerHTML.trim()

        ficObject["ficStats"] = document.querySelector("dl.stats").innerHTML.trim()

        ficObject["ficName"] = ficName
        ficObject["ficUrl"] = window.location.href

        ficObject["ficAuthor"] = document.getElementsByClassName("byline heading")[0].innerHTML.trim()

        ficObject["ficSummary"] = document.querySelector(".summary.module").innerHTML.trim()

        updateStorage('fics', ficName, ficObject)
    })
}


// function updateStorage(ficsObject, element, ficObject) {
//     objArray = {}

//     chrome.storage.sync.get({ ficKeys3: ficsObject}, function (result) {
//         console.log("keys")
//         console.log(ficObject)
//         // console.log(key)
//         // console.log(ficKeys2)
//         console.log("inside of get")
//         console.log(result)
//         // console.log(result.key)
//         // console.log(result.fics)
//         console.log(element)
//         console.log("end results")
//         if (typeof result.ficKeys2 !== "string"){
//             objArray = result.ficKeys2 // this is a string for some reason, how do I change that 
//         }
        
//         // console.log(results['fics'])
//         console.log("objArray")
//         console.log(objArray)
//         objArray[element] = ficObject
//         console.log("after setting")
//         console.log(objArray)
//         chrome.storage.sync.set({ ficKeys2: objArray }, function (result) {
//             console.log('Updated myObjArray in storage');
//             console.log(result)
//         });
//     })
// }

function updateStorage(ficsObject, element, ficObject) {
    let objArray = {}
    objArray[element] = ficObject // {fic3name: fic3obj}
    // chrome.storage.sync.clear()
    chrome.storage.session.get(["ficKeys6"], function (result) {
                              // ficKeys3: "fics"
        console.log("keys")
        console.log(ficObject) 
        // console.log(key)
        // console.log(ficKeys3)
        console.log("inside of get")
        console.log(result) // for some reason, this is returning as {fic1: fic1, fic3:fic3}, when it should just be {fic1: fic1, fic2: fic2} and fic3 merged bellow
        // console.log(result.key)
        // console.log(result.fics)
        console.log(element)
        console.log("end results")

        let combinedArray = {}
        if (result !== undefined) {
            combinedArray = {...objArray, ...result.ficKeys6}
        } else {
            combinedArray = objArray
        }
        console.log("combinedArray was created")
        // console.log("chrome storage", chrome.storage.sync.get({ ficKeys3: ficsObject }));
        console.log("chrome storage", chrome.storage.session.get(["ficKeys6"]))
        // console.log("chrome storage", chrome.storage.sync.get(["ficKeys3"]))
        // console.log("chrome storage", chrome.storage.sync.get(test))
        // console.log("chrome storage", chrome.storage.sync.get({test: "fics"}))
        console.log("objArray")
        console.log(objArray)
        // objArray[element] = ficObject
        
        // objectArray[ele] -> off 
        // combinedArray
        console.log("after setting")
        console.log(combinedArray)
        // let combinedArray = {}
        console.log({ "ficKeys6": combinedArray })

        // console.log("chrome storage", chrome.storage.sync.get({ ficKeys6: ficsObject }));

        // chrome.storage.sync.set("ficsKey6", combinedArray);

        // console.log("chrome storage right setting latest fic", chrome.storage.sync.get("ficsKey6"));
        chrome.storage.session.set({ficKeys6: combinedArray });
        // chrome.storage.session.set({ ficKeys6: ficsObject }, combinedArray);
        console.log("chrome storage right setting latest fic", chrome.storage.session.get("ficKeys6"));
        // console.log("chrome storage right setting latest fic", chrome.storage.session.get("ficKeys5"));
        // console.log("chrome storage right setting latest fic", chrome.storage.session.get("ficKeys7"));
    })
}

document.getElementsByClassName("user navigation actions")[0].addEventListener('mouseover', function () {
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