// Listen for kudos updates from other tabs
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action === "refreshKudos") {
        // First refresh filters with new data
        console.log("Refreshing filters with new data");
        console.log(request.data);
        debugger;
        
        // Get relationship data from the message
        const relationshipData = request.data.categoryHeaps.relationshipData;
        console.log('Relationship data:', relationshipData);
        
        // Populate filters with relationship-aware data
        // Populate filters with the pre-sorted data
        if (request.data.categoryHeaps.fandoms) {
            populateFilters('fandom', request.data.categoryHeaps.fandoms);
        }
        if (request.data.categoryHeaps.characters) {
            // Characters already have relationshipCount from content.js
            populateFilters('character', request.data.categoryHeaps.characters);
        }
        if (request.data.categoryHeaps.relationships) {
            populateFilters('relationship', request.data.categoryHeaps.relationships);
        }
        if (request.data.categoryHeaps.additionalTags) {
            populateFilters('freeform', request.data.categoryHeaps.additionalTags);
        }
        
        // Then refresh displayed fics
        chrome.storage.session.get(["storedFics"], function(result) {
            debugger
            if (result.storedFics) {
                displayFics(result.storedFics);
            }
        });
    }
});

// Global reference to the fics container
let fics;

window.addEventListener('load', function () {
    fics = document.getElementById("fics")

    chrome.storage.session.get(["username"], function (result) {
        fixStaticLinks(result.username)
    })

    const clearButton = document.getElementById("clear-filters-button");
    clearButton.addEventListener("click", clearAllFilters);

    // Load stored fics
    chrome.storage.session.get(["storedFics"], function (result) {
        if (typeof result.storedFics !== "undefined" && result.storedFics !== null) {
            displayFics(result.storedFics);
        }
    })

    // Load category heaps and populate filters
    chrome.storage.session.get(["categoryHeaps"], function (result) {
        if (!result.categoryHeaps) return;
        
        // Populate filters with the pre-sorted data
        if (result.categoryHeaps.fandoms) {
            populateFilters('fandom', result.categoryHeaps.fandoms);
        }
        if (result.categoryHeaps.characters) {
            // Characters already have relationshipCount from content.js
            populateFilters('character', result.categoryHeaps.characters);
        }
        if (result.categoryHeaps.relationships) {
            populateFilters('relationship', result.categoryHeaps.relationships);
        }
        if (result.categoryHeaps.additionalTags) {
            populateFilters('freeform', result.categoryHeaps.additionalTags);
        }
    });

    // Add toggle listeners for collapsing/expanding filter sections
    addToggleListeners();
    // Handle filter form submission
    const filterForm = document.getElementById("kudos-filters");
    filterForm.addEventListener("submit", function (e) {
        e.preventDefault();
        applyFilters();
    });

}); // end of 


function clearAllFilters() {
    // Uncheck all filter checkboxes
    const allCheckboxes = document.querySelectorAll("input[type='checkbox'].include_kudos_search_fandom, input[type='checkbox'].include_kudos_search_character, input[type='checkbox'].include_kudos_search_relationship, input[type='checkbox'].include_kudos_search_freeform");

    allCheckboxes.forEach(cb => {
        cb.checked = false;
    });

    // Now re-apply filters with none selected
    applyFilters(); // This should revert to showing all fics or the default view
}

function displayFics(storedFics) {
    fics.innerHTML = "";
    let keys = Object.keys(storedFics)
    keys.forEach(ficName => {
        let createdFic = createElementsFromArray(storedFics[ficName])
        fics.appendChild(createdFic)
    });
}

function applyFilters(mode = "all") {
    // Get selected filters
    let selectedFilters = getSelectedFilters();

    let sortSelect = document.getElementById("kudos_search_sort_column");
    let chosenSort = sortSelect.value;
    // Retrieve filterObject and storedFics from storage
    chrome.storage.session.get(["filterObject", "storedFics", "sortBy", "username"], function (result) {
        const filterObject = result.filterObject || {};
        const ficsObject = result.storedFics || {};
        const sortBy = result.sortBy || {};
        const username = result.username
        // debugger
        let filteredFics;
        if (mode === "all") {
            filteredFics = filterFicsConformToAll(selectedFilters, filterObject, ficsObject);
        } else {
            filteredFics = filterFicsConformToAny(selectedFilters, filterObject, ficsObject);
        }
        // debugger
        if (chosenSort && sortBy[chosenSort]) {
            filteredFics = sortFilteredFics(filteredFics, sortBy[chosenSort]);
        }
        // Update display
        fics.innerHTML = "";
        if (filteredFics.length === 0) {
            const noFicsDiv = document.createElement("h2");
            noFicsDiv.className = "no-fics-message heading";
            noFicsDiv.textContent = `0 Kudos by ${username}`;
            fics.appendChild(noFicsDiv);
        } else {
            filteredFics.forEach(fic => {
                let createdFic = createElementsFromArray(fic);
                fics.appendChild(createdFic);
            });
        }
    });
}

function sortFilteredFics(filteredFics, sortArray) {
    // Create a map from ficName -> ficObject for quick lookups
    let ficMap = {};
    filteredFics.forEach(fic => {
        ficMap[fic.ficName] = fic;
    });

    let sortedFiltered = [];
    for (let entry of sortArray) {
        let ficName = Object.keys(entry)[0];
        if (ficMap[ficName]) {
            sortedFiltered.push(ficMap[ficName]);
        }
    }

    return sortedFiltered;
}

// Gathers all checked checkboxes from each category
function getSelectedFilters() {
    console.log('=== Getting Selected Filters ===');
    
    const categories = ["fandom", "character", "relationship", "freeform"];
    const selected = {
        fandoms: [],
        characters: [],
        relationships: [],
        additionalTags: []
    };
    
    categories.forEach(cat => {
        const checkboxes = document.querySelectorAll(`input.include_kudos_search_${cat}:checked`);
        console.log(`Found ${checkboxes.length} selected ${cat} filters`);
        
        checkboxes.forEach(cb => {
            // Use the checkbox's value which contains the original tag
            const value = cb.value;
            
            // For characters, we need to use the base name for comparison
            if (cat === "character") {
                const baseName = extractCharacterName(value, true);
                console.log(`Character filter: ${value} -> ${baseName}`);
                selected.characters.push(baseName);
            } else {
                // For other categories, use the value as is
                if (cat === "fandom") selected.fandoms.push(value);
                if (cat === "relationship") selected.relationships.push(value);
                if (cat === "freeform") selected.additionalTags.push(value);
                console.log(`${cat} filter:`, value);
            }
        });
    });
    
    console.log('Selected filters:', selected);
    return selected;
}

// Filter functions
function filterFicsConformToAll(selectedFilters, filterObject, ficsObject) {
    // Convert each selected filter array into sets of ficNames
    // Then intersect them
    let sets = [];
    // Each category in filterObject: fandoms, characters, relationships, additionalTags
    // filterObject structure: {fandoms: { "Arcane": { "ficName": ficObject, ...}, ...}, ...}
    // debugger
    for (let category of Object.keys(selectedFilters)) {
        let values = selectedFilters[category];
        if (values.length > 0 && filterObject[category]) {
            let categorySet = new Set();
            values.forEach(val => {
                if (filterObject[category][val]) {
                    Object.keys(filterObject[category][val]).forEach(ficName => {
                        categorySet.add(ficName);
                    });
                }
            });
            sets.push(categorySet);
        }
    }

    // Start intersection with all fics if no filters selected (then no restriction)
    let allFics = new Set(Object.keys(ficsObject));
    let intersection = (sets.length > 0) ? sets.reduce((acc, s) => {
        return new Set([...acc].filter(x => s.has(x)));
    }, sets[0]) : allFics;

    return Array.from(intersection).map(ficName => ficsObject[ficName]);
}

function filterFicsConformToAny(selectedFilters, filterObject, ficsObject) {
    let unionSet = new Set();
    // debugger
    for (let category of Object.keys(selectedFilters)) {
        let values = selectedFilters[category];
        if (values.length > 0 && filterObject[category]) {
            values.forEach(val => {
                if (filterObject[category][val]) {
                    Object.keys(filterObject[category][val]).forEach(ficName => {
                        unionSet.add(ficName);
                    });
                }
            });
        }
    }

    // If no filters selected, return all fics
    if (unionSet.size === 0 && noFiltersSelected(selectedFilters)) {
        return Object.values(ficsObject);
    }

    return Array.from(unionSet).map(ficName => ficsObject[ficName]);
}

function noFiltersSelected(selectedFilters) {
    return Object.values(selectedFilters).every(arr => arr.length === 0);
}

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

// Clean character names consistently across the extension
function extractCharacterName(text, forComparison = true) {
    if (!text) return '';
    
    // Fix encoding issues
    text = text.replace(/0ðÝ|0δY|[\u0000-\u001F]/g, '') // Remove control chars and corrupted UTF-8
             .replace(/[\u2013\u2014\u2015]/g, '-')      // Normalize dashes
             .replace(/[\uFFFD]/g, '');                   // Remove replacement character
    
    // Normalize whitespace
    text = text.replace(/\s+/g, ' ').trim();
    
    // If we just want the display name, return the cleaned text
    if (!forComparison) {
        return text;
    }
    
    // For comparison, get just the base name (before any parentheses)
    const parenIndex = text.indexOf('(');
    if (parenIndex !== -1) {
        return text.substring(0, parenIndex).trim();
    }
    
    return text;
}

function populateFilters(category, array, limit = 10) {
    console.log('\n=== Populating Filters ===');
    console.log('Category:', category);
    console.log('Data received:', array);
    
    // Get the corresponding list element
    const filterList = document.querySelector(`dd.expandable.${category} > ul`);
    if (!filterList) {
        console.warn(`Filter list not found for category: ${category}`);
        return;
    }

    // Clear existing filters
    filterList.innerHTML = '';

    // Items are already sorted in content.js, just take the top N
    const topItems = array.slice(0, limit);
    console.log(`Top ${limit} items:`, topItems);

    // Save current filter states before clearing
    const selectedFilters = Array.from(filterList.querySelectorAll('input[type="checkbox"]'))
        .filter(input => input.checked)
        .map(input => input.getAttribute('data-compare-value'));
    
    console.log('Previously selected filters:', selectedFilters);

    // Populate the filter list
    topItems.forEach((item, index) => {
        const listItem = document.createElement('li');
        const label = document.createElement('label');
        const span = document.createElement('span');
        const indicator = document.createElement('span');
        const input = document.createElement('input');

        // Setup input
        input.type = "checkbox";
        input.className = `include_kudos_search_${category}`;
        
        // Handle display value and comparison value
        let displayValue = item.tag;
        let compareValue = item.tag;
        
        if (category === 'character') {
            // Keep full name for display, but get base name for comparison
            displayValue = extractCharacterName(item.tag, false); // Keep fandom info
            compareValue = extractCharacterName(item.tag, true);  // Just base name
            
            console.log('Character processing:', {
                original: item.tag,
                display: displayValue,
                compare: compareValue
            });
        }
        
        // Store both the full tag and comparison value
        input.value = compareValue;  // Use cleaned value for filtering
        input.setAttribute('data-original-tag', item.tag);  // Store original for reference
        input.setAttribute('data-compare-value', compareValue);  // Store comparison value
        
        // Restore checked state using the comparison value
        input.checked = selectedFilters.includes(compareValue);
        
        // Setup indicator
        indicator.className = "indicator";
        
        // Create separate spans for name and stats
        const nameSpan = document.createElement('span');
        nameSpan.className = 'name';
        nameSpan.textContent = displayValue;
        
        const statsSpan = document.createElement('span');
        statsSpan.className = 'stats';
        
        // Format stats display - only show kudos count
        statsSpan.textContent = ` (${item.count})`;
        if (category === 'character' && typeof item.relationshipCount !== 'undefined') {
            console.log('Stats:', {
                character: displayValue,
                kudos: item.count,
                relationships: item.relationshipCount
            });
        }
        
        // Add spans to the main span
        span.appendChild(nameSpan);
        span.appendChild(statsSpan);
        
        // Assemble the elements
        label.appendChild(input);
        label.appendChild(indicator);
        label.appendChild(span);
        listItem.appendChild(label);
        filterList.appendChild(listItem);
    });

    // If any filters were selected, reapply them
    if (selectedFilters.length > 0) {
        console.log('Reapplying filters:', selectedFilters);
        applyFilters();
    }
}

function addToggleListeners(){
    let buttons = document.getElementsByClassName("filter-toggle")

    for (let i = 0; i < buttons.length; i++) {
        const button = buttons[i];
        button.addEventListener("click", function () {
            let value = button.querySelector("span").getAttribute("value")
            let list = document.querySelector(`.${value} > ul`)
            if (list.className.indexOf("hidden") !== -1) {
                list.className = list.className.replace("hidden", "shown")
                button.className = button.className.replace("collapsed", "expanded")
            } else {
                list.className = list.className.replace("shown", "hidden")
                button.className = button.className.replace("expanded", "collapsed")
            }
        })
    }

}

function onSubmitFilter(){
    let selectedFilters = getSelectedFilters()
    applyFilters(selectedFilters)   
}

function filterFics(){
    // document.getElementsByClassName('include_kudos_search_character')[0].checked
}