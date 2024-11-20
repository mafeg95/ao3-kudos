// chrome.runtime.onInstalled.addListener(() => {
//     chrome.action.setBadgeText({
//         text: "OFF",
//     });
// });

chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {
        console.log(sender.tab ?
            "from a content script:" + sender.tab.url :
            "from the extension");
    //     let element = document.createElement("li")
    //     element.textContent = request.name
    //     element.className = "stories"
    //     console.log(element)
    //     // let fics = document.getElementById("fics")
    //     // console.log(name)
    // // console.log(fics)
    //     console.log('worked')
        console.log(request.action)
        console.log(sendResponse)
        console.log(sender.action)
        if (request.action === "MyKudos"){
            openTab("popup.html")
        }
    }
);

function openTab(filename) {
    var myid = chrome.i18n.getMessage("@@extension_id");
    chrome.windows.getCurrent(function (win) {
        chrome.tabs.query({ 'windowId': win.id }, function (tabArray) {
            for (var i in tabArray) {
                if (tabArray[i].url == "chrome-extension://" + myid + "/" + filename) { // 
                    console.log("already opened");
                    chrome.tabs.update(tabArray[i].id, { active: true }); 
                    return;
                }
            }
            chrome.tabs.create({ url: chrome.runtime.getURL(filename), 'selected': true });
        });
    });
}