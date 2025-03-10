chrome.storage.session.setAccessLevel({ accessLevel: 'TRUSTED_AND_UNTRUSTED_CONTEXTS' });

chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {
        if (request.action === "MyKudos") {
            openTab("popup.html")
        } else if (request.action === "kudosUpdated") {
            // Only broadcast to AO3 tabs and extension pages
            chrome.tabs.query({}, function(tabs) {
                tabs.forEach(function(tab) {
                    if (tab.url && (tab.url.includes('archiveofourown.org') || tab.url.includes('chrome-extension://'))) {
                        chrome.tabs.sendMessage(tab.id, {
                            action: "refreshKudos",
                            data: request.data
                        }).catch(() => {});
                    }
                });
            });
        }
    }
);

function openTab(filename) {
    var myid = chrome.i18n.getMessage("@@extension_id");
    chrome.windows.getCurrent(function (win) {
        chrome.tabs.query({ 'windowId': win.id }, function (tabArray) {
            for (var i in tabArray) {
                if (tabArray[i].url == "chrome-extension://" + myid + "/" + filename) { // 
                    chrome.tabs.update(tabArray[i].id, { active: true }); 
                    return;
                }
            }
            chrome.tabs.create({ url: chrome.runtime.getURL(filename), 'selected': true });
        });
    });
}