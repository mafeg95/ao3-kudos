chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {
        console.log(sender.tab ?
            "from a content script:" + sender.tab.url :
            "from the extension");
        let element = document.createElement("li")
        element.textContent = request.name
        element.className = "stories"
        console.log(element)
        let fics = document.getElementById("fics")
        // console.log(name)
        // console.log(fics)
        fics.appendChild(element)
        console.log('worked')
        console.log(request.name)
        console.log(sendResponse)
        
        // chrome.storage.sync.set(
        //      { name: request.name },
        //     { name: request.name },
        //     () => {
        //         // Update status to let user know options were saved.
        //         const status = document.getElementById('status');
        //         status.textContent = 'Options saved.';
        //         setTimeout(() => {
        //             status.textContent = '';
        //         }, 750);
        //     }
        // );
    }
);

window.addEventListener('load', function(){
    console.log('loading')
    let li = document.createElement("li")
    let fics = document.getElementById("fics")
    console.log(chrome.storage.sync)
    chrome.storage.session.get(['fics'], function (result) {
        console.log(result.toString())
        console.log(result.fics)
        result.fics.forEach(element => {
            li.textContent = element
            fics.appendChild(li)
        });
    })
})

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

// document.addEventListener('DOMContentLoaded', restoreOptions);
// document.getElementById('save').addEventListener('click', saveOptions);

// add links for fics 
// document.addEventListener('DOMContentLoaded', function () {
//     var links = document.getElementsByTagName("a");
//     for (var i = 0; i < links.length; i++) {
//         (function () {
//             var ln = links[i];
//             var location = ln.href;
//             ln.onclick = function () {
//                 chrome.tabs.create({ active: true, url: location });
//             };
//         })();
//     }
// });

// links for fics
// window.addEventListener('click', function (e) {
//     if (e.target.href !== undefined) {
//         chrome.tabs.create({ url: e.target.href })
//     }
// })
