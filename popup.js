window.addEventListener('load', function(){

    let fics = document.getElementById("fics")


    chrome.storage.session.get(["username"], function (result) { 
        fixStaticLinks(result.username)
    })

    chrome.storage.session.get(["storedFics"], function (result) { // not quite working
        if (typeof result.storedFics !== "undefined" && result.storedFics !== null){
            let keys = Object.keys(result.storedFics)
            keys.forEach(fic => {
                let createdFic = createElementsFromArray(result.storedFics[fic])
                fics.appendChild(createdFic)
            });
        }
    })
    
    // chrome.storage.session.get(['fandoms'], function (result) {
    //     debugger
    //     if (result.fandomHeap) populateFilters('fandom', result.fandomHeap);
    //     if (result.characterHeap) populateFilters('characters', result.characterHeap);
    //     if (result.relationshipHeap) populateFilters('relationships', result.relationshipHeap);
    //     if (result.tagHeap) populateFilters('freeforms', result.tagHeap);
    // });

    chrome.storage.session.get(["categoryHeaps"], function (result) {
        // debugger
        // result.categoryHeaps.fandoms
        if (result.categoryHeaps.fandoms) populateFilters('fandom', result.categoryHeaps.fandoms);
        if (result.categoryHeaps.characters) populateFilters('character', result.categoryHeaps.characters);
        if (result.categoryHeaps.relationships) populateFilters('relationship', result.categoryHeaps.relationships);
        if (result.categoryHeaps.additionalTags) populateFilters('freeform', result.categoryHeaps.additionalTags);
    });

    addToggleListeners();
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
    
    mainHeader.appendChild(ficNameEl)
    mainHeader.innerHTML += " by " + fic.ficAuthor

    header.appendChild(mainHeader)

    let ficFandom = document.createElement("h5")
    ficFandom.innerHTML = fic.ficFandom
    ficFandom.className = "fic-fandom fandom"

    header.appendChild(ficFandom)
    
    mainDiv.appendChild(header)

    // Tags
    let tagsWrapper = document.createElement("ul")
    let strongFicWarnings = document.createElement("strong")
    strongFicWarnings.innerHTML = fic.ficWarnings

    tagsWrapper.appendChild(strongFicWarnings)

    tagsWrapper.innerHTML += " " + fic.ficRelationships + fic.ficCharacters + fic.ficTags
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

    mainDiv.appendChild(statsWrapper)

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

function fixStaticLinks(user) {
    var links = document.getElementsByTagName("a");

    for (var i = 0; i < links.length; i++) {
        var ln = links[i];
        var location = ln.href.replace("username", user);

        ln.href = location
    }
    
    // change the text of the dropdown menu
    let dropdown = document.querySelector(".dropdown > a")
    dropdown.textContent = dropdown.textContent.replace("username", user)
}

{/* <li>
    <label for="include_kudos_search_fandom">
        <input type="checkbox" name="include_bookmark_search[fandom_ids][]"
            id="include_kudos_search_fandom" />
        <span class="indicator" aria-hidden="true"></span><span>Harry Potter - J. K. Rowling
            (50)</span>
    </label>
</li> */}


function populateFilters(category, heap, limit = 10) {
    // Get the corresponding list element
    // debugger
    const filterList = document.querySelector(`dd.expandable.${category} > ul`);
    // debugger
    // Extract the top 'limit' items from the heap
    const topCategories = [];
    for (let i = 0; i < limit && heap.length > 0; i++) {
        topCategories.push(heap.pop()); // Remove the max element
    }

    // Populate the filter list
    topCategories.forEach(item => {
        // debugger
        const [name, count] = [item.category, item.count];
        const listItem = document.createElement('li');
        const label = document.createElement('label');
        const span = document.createElement('span');
        const indicator = document.createElement('span');

        // label.href = `#`; // Replace with the actual filter logic URL
        const input = document.createElement('input');
        input.type = "checkbox"
        input.className = `include_kudos_search_${category}`

        indicator.className = "indicator"
        // indicator.setAttribute("aria-hidden", true) 
            // < span class="indicator" aria - hidden="true" ></span >
        span.textContent = `${name} (${count})`;
        label.appendChild(input)
        label.appendChild(indicator)
        label.appendChild(span)

        listItem.appendChild(label);
        filterList.appendChild(listItem);
        
    });

}

function addToggleListeners(){
    // debugger
    let buttons = document.getElementsByClassName("filter-toggle")

    for (let i = 0; i < buttons.length; i++) {
        const button = buttons[i];
        // debugger
        button.addEventListener("click", function () {
            // debugger
            let value = button.querySelector("span").getAttribute("value")
            let list = document.querySelector(`.${value} > ul`)
            // debugger
            if (list.className.indexOf("hidden") !== -1) {
                // debugger
                list.className = list.className.replace("hidden", "shown")
                button.className = button.className.replace("collapsed", "expanded")
            } else {
                list.className = list.className.replace("shown", "hidden")
                button.className = button.className.replace("expanded", "collapsed")
            }
            // debugger
        })
    }

}