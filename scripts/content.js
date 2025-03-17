// Helper function to check if extension context is valid
// function isExtensionContextValid() {
//     try {
//         // Try to access chrome.runtime
//         return chrome.runtime && chrome.runtime.id;
//     } catch (e) {
//         return false;
//     }
// }

// Helper function to safely execute chrome API calls
// function safeExecuteChromeAPI(operation) {
//     if (!isExtensionContextValid()) {
//         console.warn('Extension context invalid, reloading page...');
//         window.location.reload();
//         return false;
//     }
//     try {
//         operation();
//         return true;
//     } catch (e) {
//         if (e.message.includes('Extension context invalidated')) {
//             console.warn('Extension context invalid, reloading page...');
//             window.location.reload();
//             return false;
//         }
//         console.error('Chrome API error:', e);
//         return false;
//     }
// }

// Initialize category heaps and relationship data structure
const initializeCategoryHeaps = () => {
    const heaps = {
        fandoms: new MaxHeap(),
        characters: new MaxHeap(),
        relationships: new MaxHeap(),
        additionalTags: new MaxHeap(),
        relationshipData: new Map() // Maps cleaned character names to their relationship count
    };

    // Load initial state from storage
    chrome.storage.session.get(['categoryHeaps'], function(result) {
        if (result.categoryHeaps) {
            // Load relationship data from storage
            if (result.categoryHeaps.relationshipData) {
                // Process each character relationship using cleaned names
                Object.entries(result.categoryHeaps.relationshipData || {}).forEach(([charName, count]) => {
                    const cleanedName = extractCharacterName(charName, true);
                    heaps.relationshipData.set(cleanedName, count);
                });
            }
            
            // Then refresh heaps
            heaps.fandoms.refreshFromStorage(result.categoryHeaps.fandoms || []);
            heaps.characters.refreshFromStorage(result.categoryHeaps.characters || []);
            heaps.relationships.refreshFromStorage(result.categoryHeaps.relationships || []);
            heaps.additionalTags.refreshFromStorage(result.categoryHeaps.additionalTags || []);
        }
    });

    return heaps;
};

const categoryHeaps = initializeCategoryHeaps();

// Listen for kudos updates from other tabs
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    // if (!isExtensionContextValid()) return;
    
    if (request.action === "refreshKudos") {
        // safeExecuteChromeAPI(() => {
            // Refresh heaps from the updated data
            // First, update relationship data Map with cleaned character names
            // This needs to happen before refreshing heaps since character heap items
            // will look up their relationship counts from this Map
            if (request.data.relationshipData) {
                Object.entries(request.data.relationshipData).forEach(([charName, count]) => {
                    const cleanedName = extractCharacterName(charName, true);
                    categoryHeaps.relationshipData.set(cleanedName, count);
                });
            }
            
            // Then refresh all heaps - characters will get their relationship counts
            // from the updated relationshipData Map during refresh
            categoryHeaps.fandoms.refreshFromStorage(request.data.categoryHeaps.fandoms);
            categoryHeaps.characters.refreshFromStorage(request.data.categoryHeaps.characters);
            categoryHeaps.relationships.refreshFromStorage(request.data.categoryHeaps.relationships || []);
            categoryHeaps.additionalTags.refreshFromStorage(request.data.categoryHeaps.additionalTags);

            // Save the updated heaps to storage
            chrome.storage.session.set({
                categoryHeaps: {
                    fandoms: categoryHeaps.fandoms.heap,
                    characters: categoryHeaps.characters.heap,
                    relationships: categoryHeaps.relationships.heap,
                    additionalTags: categoryHeaps.additionalTags.heap,
                    relationshipData: Object.fromEntries(categoryHeaps.relationshipData)
                }
            });
        // });
    }
});

if (document.readyState !== 'loading') {
    scrapeKudosFromPage()
    addMyKudosToMenu()
    updateUsername()
} else {
    document.addEventListener('DOMContentLoaded', scrapeKudosFromPage);
    document.addEventListener('DOMContentLoaded', addMyKudosToMenu);
    document.addEventListener('DOMContentLoaded', updateUsername);
}

function updateCategoryHeap(category, items, options = {}) {
    // Initialize relationship data if needed
    
    // Initialize relationship data if needed
    if (!categoryHeaps.relationshipData) {
        categoryHeaps.relationshipData = new Map();
    }

    // Ensure items is an array
    if (!Array.isArray(items)) {
        console.warn(`Items is not an array for category ${category}:`, items);
        return;
    }

    if (items.length === 0) {
        console.warn(`updateCategoryHeap received empty array for category: ${category}`);
        return;
    }
    
    // Convert items to proper format if they're strings
    const formattedItems = items.map(item => {
        // Handle string items
        if (typeof item === 'string') {
            return {
                tag: item,
                count: 1,
                type: options.type || category
            };
        }
        
        // Handle object items - ensure they have a tag
        if (!item || !item.tag) {
            console.warn('Invalid item object:', item);
            return null;
        }
        
        return {
            ...item,
            type: options.type || category,
            tag: item.tag // Ensure tag is preserved
        };
    }).filter(item => item !== null); // Remove invalid items

    // Process items based on category
    if (category === 'relationships') {
        // For relationships, first update the heap and then update character relationship counts
        if (!Array.isArray(items)) {
            console.error('Invalid items array for relationships:', items);
            return;
        }

        // Initialize or reset relationship data for this update
        if (!categoryHeaps.relationshipData) {
            categoryHeaps.relationshipData = new Map();
        }

        items.forEach(item => {
            // Convert string items to proper format
            const relationship = typeof item === 'string' ? { tag: item, count: 1 } : item;
            
            // Skip invalid relationships
            if (!relationship.tag || typeof relationship.tag !== 'string') {
                console.warn('Invalid relationship:', relationship);
                return;
            }

            // Process character relationships first
            if (relationship.tag.includes('/')) {
                const characters = relationship.tag.split('/')
                    .map(char => char.trim())
                    .filter(char => char.length > 0);
                
                characters.forEach(char => {
                    // Always use forComparison=true for consistency
                    const cleanedName = extractCharacterName(char, true);
                    
                    // Update relationship count using cleaned name as key
                    const currentCount = categoryHeaps.relationshipData.get(cleanedName) || 0;
                    categoryHeaps.relationshipData.set(cleanedName, currentCount + 1);
                    console.log(`Updated relationship count for ${cleanedName}: ${currentCount + 1}`);
                });
            }

            // Add to relationships heap after processing characters
            categoryHeaps[category].insertOrUpdate(relationship.tag, relationship.count || 1, {
                type: 'relationship'
            });
        });
    } else if (category === 'characters') {
        // For characters, include relationship count in the sorting
        items.forEach(item => {
            // Convert string items to proper format
            const character = typeof item === 'string' ? { tag: item } : item;
            
            // Skip invalid characters
            if (!character.tag || typeof character.tag !== 'string') {
                console.warn('Invalid character:', character);
                return;
            }
            
            // Always use forComparison=true for consistency
            const cleanedName = extractCharacterName(character.tag, true);
            
            // Get relationship count using cleaned name
            const relationshipCount = categoryHeaps.relationshipData.get(cleanedName) || 0;
            console.log(`Character ${cleanedName} has ${relationshipCount} relationships`);
            
            // Add character to heap
            console.log(`Processing character: ${character.tag} (cleaned: ${cleanedName}) with relationships: ${relationshipCount}`);
            categoryHeaps[category].insertOrUpdate(character.tag, null, {
                type: 'character',
                relationshipCount,
                cleanedName
            });
        });
    } else {
        // For other categories (fandoms, additional tags)
        formattedItems.forEach(item => {
            categoryHeaps[category].insertOrUpdate(item.tag, null, {
                type: category
            });
        });
    }



    // // Save the updated heaps and relationship data to session storage
    // if (isExtensionContextValid()) {
    //     safeExecuteChromeAPI(() => {
            // Prepare the data to store and send
    const heapData = {
        fandoms: categoryHeaps.fandoms.heap,
        characters: categoryHeaps.characters.heap,
        relationships: categoryHeaps.relationships.heap,
        additionalTags: categoryHeaps.additionalTags.heap,
        relationshipData: Object.fromEntries(categoryHeaps.relationshipData)
    };

    // Store in session storage
    chrome.storage.session.set({
        categoryHeaps: heapData
    }, () => {
        // After saving, notify the popup to refresh with the same data
        chrome.runtime.sendMessage({
            action: "refreshKudos",
            data: {
                categoryHeaps: heapData
            }
        });
    });
    //     });
    // }


}


function extractCharacterName(text, forComparison = true) {
    if (!text || typeof text !== 'string') {
        console.warn('Invalid input to extractCharacterName:', text);
        return '';
    }
    
    // Fix encoding issues and normalize whitespace first
    text = text.replace(/0ðÝ|0δY|[\u0000-\u001F]/g, '') // Remove control chars and corrupted UTF-8
             .replace(/[\u2013\u2014\u2015]/g, '-')      // Normalize dashes
             .replace(/[\uFFFD]/g, '')                    // Remove replacement character
             .replace(/\s+/g, ' ')                       // Normalize whitespace
             .trim();
    
    // If we just want the display name, do minimal cleaning
    if (!forComparison) {
        return text;
    }
    
    // For comparison, extract just the base character name
    let baseName = text;
    
    // Log the initial name
    console.log(`Processing character name: '${text}'`);
    
    // Common patterns to clean - order matters!
    const patterns = [
        // Remove fandom in parentheses at end (e.g., "Caitlyn (League of Legends)" -> "Caitlyn")
        /\s*\([^)]*\)\s*$/g,
        
        // Remove fandom prefix with colon (e.g., "League of Legends: Caitlyn" -> "Caitlyn")
        /^[^:]+:\s*/,
        
        // Remove fandom in square brackets (e.g., "Caitlyn [LoL]" -> "Caitlyn")
        /\s*\[[^\]]*\]\s*/g,
        
        // Remove nicknames in quotes (e.g., 'Caitlyn "Cupcake" Kiramman' -> 'Caitlyn Kiramman')
        /\s+['"].*['"]\s*/g,
        
        // Clean up any remaining parentheses or brackets
        /[\[\]\(\)\{\}]/g,
        
        // Normalize spaces
        /\s+/g
    ];
    
    // Apply each cleaning pattern and log changes
    patterns.forEach(pattern => {
        const oldName = baseName;
        baseName = baseName.replace(pattern, ' ').trim();
        
        if (oldName !== baseName) {
            console.log(`  ${oldName} -> ${baseName}`);
        }
    });
    
    console.log(`Final cleaned name: '${baseName}'`);
    

    // Keep multi-part names intact after cleaning
    if (baseName.includes(' ')) {
        const parts = baseName.split(' ').filter(part => part.length > 0);
        console.log(`Keeping full name with multiple parts: ${parts.join(' ')}`);
        return parts.join(' ');
    }
    console.log(`Character name cleaned: '${text}' -> '${baseName}'`);
    return baseName;
}

function iterateThroughChildren(htmlCollection, selector){
    let stringArray = []

    if (!htmlCollection) {
        console.warn(`Query selector returned null/undefined: ${selector}`);
        return stringArray;
    }

    if (htmlCollection.length === 0) {
        console.warn(`Query selector returned empty collection: ${selector}`);
        return stringArray;
    }

    for (let i = 0; i < htmlCollection.length; i++) {
        const element = htmlCollection[i];
        const text = element.textContent;
        stringArray.push(text.trim());
    }
    return stringArray;
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

            const selectors = {
                ficWarnings: "dd.warning.tags > ul",
                ficCategories: "dd.category.tags > ul",
                ficFandom: "dd.fandom.tags > ul",
                ficRelationships: "dd.relationship.tags > ul",
                ficCharacters: "dd.character.tags > ul",
                ficTags: "dd.freeform.tags > ul"
            };

            // Helper to get element and handle potential null
            const getElement = (selector) => {
                const element = document.querySelector(selector);
                return element || null;
            };

            // Process each selector
            Object.entries(selectors).forEach(([key, selector]) => {
                const element = getElement(selector);
                ficObject[key] = element ? element.innerHTML.trim() : '';
                propertiesObject[key] = iterateThroughChildren(element?.children, selector);
            });

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

            // Check if fic is already kudosed and handle all updates
            // if (!isExtensionContextValid()) {
            //     console.warn('Extension context invalid during kudos, reloading...');
            //     window.location.reload();
            //     return;
            // }

            chrome.storage.session.get(["storedFics"], async function(result) {
                if (result.storedFics && result.storedFics[ficName]) {
                    console.log('Fic already kudosed:', ficName);
                    return;
                }

                try {
                    // if (!isExtensionContextValid()) throw new Error('Extension context invalidated');

                    // Wait for all storage operations to complete
                    await Promise.all([
                        updateFicStorage(ficName, ficObject),
                        updateFilterStorage(ficObject, propertiesObject),
                        updateSortByStorage(ficName, ficObject, statsObject)
                    ]);
                    
                    // Process relationships first to build relationship data
                    updateCategoryHeap('relationships', propertiesObject.ficRelationships, { type: 'relationship' });
                    
                    // Then process characters with updated relationship data
                    updateCategoryHeap('characters', propertiesObject.ficCharacters, { type: 'character' });
                    
                    // Update top 10 characters cache
                    const top10 = getTop10Characters(categoryHeaps.characters);
                    await chrome.storage.local.set({ 'cachedTop10Characters': top10 });
                    
                    // Process remaining categories
                    updateCategoryHeap('fandoms', propertiesObject.ficFandom, { type: 'fandom' });
                    
                    updateCategoryHeap('additionalTags', propertiesObject.ficTags, { type: 'tag' });
                    
                    // Prepare the data update once
                    const heapData = {
                        fandoms: categoryHeaps.fandoms.heap,
                        characters: categoryHeaps.characters.heap,
                        relationships: categoryHeaps.relationships.heap,
                        additionalTags: categoryHeaps.additionalTags.heap
                    };
                    
                    // Convert Map to object for storage
                    const relationshipData = Object.fromEntries(categoryHeaps.relationshipData);
                    
                    // Store everything in a single operation
                    await chrome.storage.session.set({
                        categoryHeaps: {
                            ...heapData,
                            relationshipData
                        }
                    });

                    // Notify other tabs with the same data structure
                    chrome.runtime.sendMessage({
                        action: "refreshKudos",
                        data: {
                            ficName,
                            categoryHeaps: heapData,
                            relationshipData
                        }
                    });
                } catch (error) {
                    console.error('Error updating kudos:', error);
                }
            });
        })
    }
}

function updateFicStorage(element, ficObject) {
    return new Promise((resolve, reject) => {
        let objArray = {}
        objArray[element] = ficObject 

        chrome.storage.session.get(["storedFics"], function (result) {
            let combinedArray = {}
            if (result !== undefined) {
                combinedArray = {...objArray, ...result.storedFics}
            } else {
                combinedArray = objArray
            }
            
            chrome.storage.session.set({storedFics: combinedArray }, () => {
                if (chrome.runtime.lastError) {
                    reject(chrome.runtime.lastError);
                } else {
                    resolve();
                }
            });
        });
    });
}

function updateFilterStorage(ficObject, propertiesObject) {
    return new Promise((resolve, reject) => {
        chrome.storage.session.get(["filterObject"], function(result) {
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

            chrome.storage.session.set({ filterObject: newObject}, () => {
                if (chrome.runtime.lastError) {
                    reject(chrome.runtime.lastError);
                } else {
                    resolve();
                }
            });
        });
    });
}

function iterateOrAdd(ficProperties, ficContent, result, ficString, resultString) {
    // Initialize result property from existing data or create new
    let resultProperty = (result && result.filterObject && result.filterObject[resultString]) || {};
    
    // Get property values (could be string or array)
    let propertyValues = ficProperties[ficString];
    if (!propertyValues) return resultProperty;
    
    // Convert to array if string
    if (typeof propertyValues === "string") {
        propertyValues = [propertyValues];
    }
    
    // Process each value
    for (let value of propertyValues) {
        // Skip empty values
        if (!value) continue;
        
        // Clean character names for comparison
        let propertyKey = value;
        if (resultString === 'characters') {
            propertyKey = extractCharacterName(value, true);
        }
        
        // Add or update fic reference
        if (!resultProperty[propertyKey]) {
            resultProperty[propertyKey] = {};
        }
        resultProperty[propertyKey][ficContent.ficName] = ficContent;
    }
    
    return resultProperty;
}

function updateSortByStorage(ficName, ficObject, statsObject) {
    return new Promise((resolve, reject) => {
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

            if (typeof result.sortBy !== "undefined" && result.sortBy.hits) {
                let newArr = addElementSorted(elementToAddHits, result.sortBy.hits)
                newObject["hits"] = newArr
            } else {
                newObject["hits"] = [elementToAddHits]
            }

            chrome.storage.session.set({sortBy: newObject}, () => {
                if (chrome.runtime.lastError) {
                    reject(chrome.runtime.lastError);
                } else {
                    resolve();
                }
            });
        });
    });
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

// Get top 10 characters from a heap while preserving the original data
function getTop10Characters(heapData) {
    // Create a temporary heap
    const tempHeap = new MaxHeap();
    
    // Deep copy the heap data to avoid modifying the original
    tempHeap.heap = heapData.heap.map(item => ({ ...item }));
    
    // Extract top 10 characters
    const top10 = [];
    for (let i = 0; i < 10; i++) {
        const max = tempHeap.extractMax();
        if (!max) break;
        top10.push(max);
    }
    
    return top10;
}

function addMyKudosToMenu(){
    const dropdownMenu = document.getElementsByClassName("user navigation actions")[0]
    
    if (typeof dropdownMenu !== "undefined" && dropdownMenu !== null) {
        dropdownMenu.addEventListener('mouseover', function () {
            // if (!isExtensionContextValid()) {
            //     console.warn('Extension context invalid during menu interaction, reloading...');
            //     window.location.reload();
            //     return;
            // }

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
                    // if (!isExtensionContextValid()) {
                    //     console.warn('Extension context invalid during kudos menu click, reloading...');
                    //     window.location.reload();
                    //     return;
                    // }
                    // safeExecuteChromeAPI(() => {
                        chrome.runtime.sendMessage({ action: "MyKudos" })
                    // });
                })
            }
        });
    }
}

function updateUsername(){
    let username = document.querySelector(".icon > a").href.split("/users/")[1]

    chrome.storage.session.set({ username: username });
}