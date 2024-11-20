const kudosButton = document.getElementById("kudo_submit")

console.log(kudosButton)
kudosButton.addEventListener("click", () => {
    console.log("test")
    let name = document.getElementsByClassName("title heading")[0].innerHTML.trim()
    
    chrome.runtime.sendMessage({ name: name })

    console.log('saving')
    updateStorage('fics', name)
})

function updateStorage(key, element) {
    objArray = []

    chrome.storage.session.get(key, function (result) {
        console.log("updateStorage")
        console.log(key)
        if (result[key]) {
            console.log("inside if")
            console.log(result[key])
            objArray = result[key]
        }
        console.log("objArray")
        console.log(objArray)
        objArray.push(element)
        console.log("objArray 2")
        console.log(key)
        chrome.storage.session.set({ key: objArray }, function () {
            console.log('Updated myObjArray in storage');
        });
    })
}

document.getElementsByClassName("user navigation actions")[0].addEventListener('mouseover', function () {
    let li = document.createElement("li")
    let a = document.createElement("a")
    // a.href = chrome.tabs.create({
    //     url: chrome.extension.getURL("hello.html")
    // });
    // a.href = chrome.tabs.create({ url:  chrome.extension.getURL('popup.html') });
    a.className = "my-kudos"
    a.textContent = "My Kudos"
    li.appendChild(a)
    let index = this.children[0].children[1].children.length - 1

    if (this.children[0].children[1].children[index].textContent !== "My Kudos") {
        this.children[0].children[1].appendChild(li)
        a.addEventListener('click', function () {
            console.log("worked")
            chrome.runtime.sendMessage({ action: "MyKudos" })
            // chrome.tabs.create({ 'url': chrome.extension.getURL('popup.html'), 'selected': true });
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