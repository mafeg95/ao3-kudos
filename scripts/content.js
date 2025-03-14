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

// Listen for kudos updates from other tabs
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    // if (!isExtensionContextValid()) return;
    
    if (request.action === "refreshKudos") {
        // safeExecuteChromeAPI(() => {
            // Refresh heaps from the updated data
            categoryHeaps.fandoms.refreshFromStorage(request.data.categoryHeaps.fandoms);
            categoryHeaps.characters.refreshFromStorage(request.data.categoryHeaps.characters);
            categoryHeaps.additionalTags.refreshFromStorage(request.data.categoryHeaps.additionalTags);
            
            // Handle relationships data
            if (request.data.relationshipData) {
                // Update relationship data first
                categoryHeaps.relationships.characterRelationships = request.data.relationshipData.characterRelationships;
                // Then refresh the heap with the full data
                categoryHeaps.relationships.refreshFromStorage(request.data.relationshipData.heap);
            } else if (request.data.categoryHeaps.relationships) {
                // Fallback to just refreshing the heap if no relationship data
                categoryHeaps.relationships.refreshFromStorage(request.data.categoryHeaps.relationships);
            } else {
                console.warn('No relationship data received');
                categoryHeaps.relationships.refreshFromStorage([]);
            }
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

let categoryHeaps = {
    fandoms: new MaxHeap(),
    characters: new MaxHeap(),
    relationships: new MaxHeap(),
    additionalTags: new MaxHeap(),
    relationshipData: {
        characterRelationships: {}
    }
};

// Load initial heap data from storage
// if (isExtensionContextValid()) {
//     safeExecuteChromeAPI(() => {
        chrome.storage.session.get(["categoryHeaps"], function (result) {
            if (result.categoryHeaps) {
                // Load each heap's data
                categoryHeaps.fandoms.refreshFromStorage(result.categoryHeaps.fandoms || []);
                categoryHeaps.characters.refreshFromStorage(result.categoryHeaps.characters || []);
                categoryHeaps.additionalTags.refreshFromStorage(result.categoryHeaps.additionalTags || []);
                
                // Handle relationships and relationship data separately
                if (result.categoryHeaps.relationshipData) {
                    // Load relationship data
                    categoryHeaps.relationshipData = result.categoryHeaps.relationshipData;
                }
                
                // Load relationships heap
                if (result.categoryHeaps.relationships) {
                    categoryHeaps.relationships.refreshFromStorage(result.categoryHeaps.relationships);
                }
            }
        });
//     });
// }

function updateCategoryHeap(category, items, options = {}) {
    console.log(`\n=== UPDATING ${category.toUpperCase()} HEAP ===`);
    console.log('Items to process:', items);
    console.log('Current heap state:', categoryHeaps[category].heap);
    if (category === 'characters') {
        console.log('Current relationships state:', categoryHeaps.relationshipData.characterRelationships);
    }

    if (!Array.isArray(items)) {
        console.warn(`updateCategoryHeap received non-array items for category: ${category}`, items);
        return;
    }

    if (items.length === 0) {
        console.warn(`updateCategoryHeap received empty array for category: ${category}`);
        return;
    }

    // Process items based on category
    if (category === 'relationships') {
        // For relationships, first update the heap and then update character relationship counts
        if (!Array.isArray(items)) {
            console.error('Invalid items array for relationships:', items);
            return;
        }

        // Initialize or reset relationship data for this update
        if (!categoryHeaps.relationshipData) {
            categoryHeaps.relationshipData = { characterRelationships: {} };
        }

        console.log('Processing relationships:', items);
        items.forEach(item => {
            // Convert string items to proper format
            const relationship = typeof item === 'string' ? { tag: item, count: 1 } : item;
            
            // Skip invalid relationships
            if (!relationship.tag || typeof relationship.tag !== 'string') {
                console.warn('Invalid relationship:', relationship);
                return;
            }

            // Add to relationships heap
            categoryHeaps[category].insertOrUpdate(relationship, 1, options);

            // Process character relationships
            if (relationship.tag.includes('/')) {
                const characters = relationship.tag.split('/')
                    .map(char => char.trim())
                    .filter(char => char.length > 0);
                
                console.log(`Found characters in relationship '${relationship.tag}':`, characters);
                
                characters.forEach(char => {
                    // Get the cleaned character name
                    const cleanedName = extractCharacterName(char);
                    
                    // Find matching character in heap or use original
                    let characterTag = char;
                    const existingChar = categoryHeaps.characters.heap.find(c => 
                        extractCharacterName(c.tag) === cleanedName
                    );
                    
                    if (existingChar) {
                        characterTag = existingChar.tag;
                        console.log(`Using existing character tag: ${characterTag}`);
                    }
                    
                    // Update relationship count
                    if (!categoryHeaps.relationshipData.characterRelationships[characterTag]) {
                        categoryHeaps.relationshipData.characterRelationships[characterTag] = 0;
                    }
                    categoryHeaps.relationshipData.characterRelationships[characterTag]++;
                    
                    console.log(`Updated relationship count for '${characterTag}':`, 
                        categoryHeaps.relationshipData.characterRelationships[characterTag]);
                });
            }
        });
    } else if (category === 'characters') {
        // For characters, include relationship count in the sorting
        items.forEach(item => {
            // Convert string items to proper format
            const character = typeof item === 'string' ? { tag: item, count: 1 } : item;
            
            // Skip invalid characters
            if (!character.tag || typeof character.tag !== 'string') {
                console.warn('Invalid character:', character);
                return;
            }
            
            console.log(`Processing character: ${character.tag}`);
            
            // Clean the character name
            const cleanedName = extractCharacterName(character.tag);
            
            // Get relationship count for this character
            const relationshipCount = categoryHeaps.relationshipData?.characterRelationships[character.tag] || 0;
            
            // Calculate total score (relationships weighted heavily)
            const totalScore = (relationshipCount * 1000) + (character.count || 1);
            
            // Create character item with all metadata
            const characterItem = {
                ...character,
                count: character.count || 1,
                relationshipCount,
                totalScore,
                cleanedName
            };
            
            console.log('Character data:', {
                tag: character.tag,
                cleanedName,
                kudos: characterItem.count,
                relationships: relationshipCount,
                totalScore
            });
            
            // Add to characters heap
            categoryHeaps[category].insertOrUpdate(characterItem, 1, options);
        });
    } else {
        // For other categories, just update normally
        items.forEach(item => {
            console.log(`\nProcessing ${category} item: ${item.tag}`);
            categoryHeaps[category].insertOrUpdate(item, 1, options);
        });
    }

    console.log('\nAfter processing:');
    console.log('Updated heap:', categoryHeaps[category].heap);
    if (category === 'character') {
        console.log('Updated relationships:', categoryHeaps.relationshipData.characterRelationships);
    }

    // // Save the updated heaps and relationship data to session storage
    // if (isExtensionContextValid()) {
    //     safeExecuteChromeAPI(() => {
            // Prepare the data to store and send
            const heapData = {
                fandoms: categoryHeaps.fandoms.heap,
                characters: categoryHeaps.characters.heap.map(char => {
                    // Include all relationship counts from character variants
                    const cleanedName = extractCharacterName(char.tag);
                    const variants = categoryHeaps.characters.heap
                        .filter(variant => extractCharacterName(variant.tag) === cleanedName);
                    const totalRelationships = variants.reduce((total, variant) => 
                        total + (categoryHeaps.relationshipData.characterRelationships[variant.tag] || 0), 0);
                    
                    return {
                        ...char,
                        cleanedName,
                        relationshipCount: totalRelationships
                    };
                }),
                relationships: categoryHeaps.relationships.heap,
                additionalTags: categoryHeaps.additionalTags.heap,
                relationshipData: categoryHeaps.relationshipData
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

    console.log('=== UPDATE COMPLETE ===\n');
}


function extractCharacterName(text, forComparison = true) {
    if (!text || typeof text !== 'string') return '';
    
    console.log('\n=== Processing Character Name ===');
    console.log('Original:', text);
    
    // Fix encoding issues - replace common corrupted characters
    text = text.replace(/0ðÝ|0δY|[\u0000-\u001F]/g, '') // Remove control chars and corrupted UTF-8
             .replace(/[\u2013\u2014\u2015]/g, '-')      // Normalize dashes
             .replace(/[\uFFFD]/g, '');                   // Remove replacement character
    
    // Normalize whitespace and trim
    text = text.replace(/\s+/g, ' ').trim();
    
    // If we just want the display name, do minimal cleaning
    if (!forComparison) {
        return text.trim();
    }
    
    // For comparison, extract just the base character name
    let baseName = text;
    
    // Remove everything after first parenthesis (including the parenthesis)
    const parenIndex = baseName.indexOf('(');
    if (parenIndex !== -1) {
        baseName = baseName.substring(0, parenIndex).trim();
        console.log('After removing parenthetical:', baseName);
    }
    
    // Remove everything after first bracket
    const bracketIndex = baseName.indexOf('[');
    if (bracketIndex !== -1) {
        baseName = baseName.substring(0, bracketIndex).trim();
        console.log('After removing brackets:', baseName);
    }
    
    // Remove fandom prefix (e.g., "League of Legends: Vi" -> "Vi")
    if (baseName.includes(':')) {
        baseName = baseName.split(':').pop().trim();
        console.log('After removing prefix:', baseName);
    }
    
    // Remove everything after a dash or pipe
    const separatorIndex = Math.min(
        baseName.indexOf(' - ') !== -1 ? baseName.indexOf(' - ') : Infinity,
        baseName.indexOf(' | ') !== -1 ? baseName.indexOf(' | ') : Infinity
    );
    if (separatorIndex !== Infinity) {
        baseName = baseName.substring(0, separatorIndex).trim();
        console.log('After removing suffix:', baseName);
    }
    
    // Special case: if we have multiple words, check if the last word could be the base name
    if (baseName.includes(' ')) {
        const words = baseName.split(' ');
        const lastWord = words[words.length - 1];
        
        // Only check against the raw tag values to avoid recursion
        const simpleVersionExists = categoryHeaps.characters.heap
            .some(item => {
                // Simple pattern matching instead of recursive cleaning
                const itemTag = item.tag;
                return itemTag === lastWord || 
                       itemTag.startsWith(lastWord + ' (') || 
                       itemTag.startsWith(lastWord + ' [') || 
                       itemTag.includes(': ' + lastWord);
            });
        
        if (simpleVersionExists) {
            baseName = lastWord;
            console.log(`Found simpler version, using: ${baseName}`);
        }
    }
    
    console.log(`Final result: ${text} -> ${baseName}`);
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
    console.log('=== Starting Kudos Processing ===');
    const kudosButton = document.getElementById("kudo_submit")
    
    if (typeof kudosButton !== "undefined" && kudosButton !== null) {
        kudosButton.addEventListener("click", () => {
            console.log('\n=== Kudos Button Clicked ===');
            let ficObject = {}
            let propertiesObject = {}
            let statsObject = {}

            let ficName = document.getElementsByClassName("title heading")[0].textContent.trim() || ''
            console.log('Processing fic:', ficName);

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

            console.log('\n=== Scraping Fic Data ===');
            // Process each selector
            Object.entries(selectors).forEach(([key, selector]) => {
                const element = getElement(selector);
                ficObject[key] = element ? element.innerHTML.trim() : '';
                propertiesObject[key] = iterateThroughChildren(element?.children, selector);
                console.log(`${key}:`, propertiesObject[key]);
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

                    console.log('\n=== Updating Storage ===');
                    // Wait for all storage operations to complete
                    await Promise.all([
                        updateFicStorage(ficName, ficObject),
                        updateFilterStorage(ficObject, propertiesObject),
                        updateSortByStorage(ficName, ficObject, statsObject)
                    ]);

                    console.log('\n=== Processing Categories ===');
                    console.log('Current heaps state:', {
                        relationships: categoryHeaps.relationships.heap.length,
                        characters: categoryHeaps.characters.heap.length,
                        fandoms: categoryHeaps.fandoms.heap.length,
                        additionalTags: categoryHeaps.additionalTags.heap.length
                    });
                    
                    // Process relationships first to build relationship data
                    console.log('\nProcessing relationships...');
                    console.log('Relationships to process:', propertiesObject.ficRelationships);
                    updateCategoryHeap('relationships', propertiesObject.ficRelationships, { type: 'relationship' });
                    
                    // Then process characters with updated relationship data
                    console.log('\nProcessing characters...');
                    console.log('Characters to process:', propertiesObject.ficCharacters);
                    console.log('Current relationship data:', categoryHeaps.relationshipData.characterRelationships);
                    updateCategoryHeap('characters', propertiesObject.ficCharacters, { type: 'character' });
                    
                    // Process remaining categories
                    console.log('\nProcessing fandoms...');
                    updateCategoryHeap('fandoms', propertiesObject.ficFandom, { type: 'fandom' });
                    
                    console.log('\nProcessing additional tags...');
                    updateCategoryHeap('additionalTags', propertiesObject.ficTags, { type: 'tag' });
                    
                    console.log('\n=== Saving to Storage ===');
                    
                    // Prepare the data update once
                    const heapData = {
                        fandoms: categoryHeaps.fandoms.heap,
                        characters: categoryHeaps.characters.heap,
                        relationships: categoryHeaps.relationships.heap,
                        additionalTags: categoryHeaps.additionalTags.heap
                    };
                    
                    const relationshipData = {
                        heap: categoryHeaps.relationships.heap,
                        characterRelationships: categoryHeaps.relationships.characterRelationships
                    };
                    
                    // Log final state
                    console.log('Final character heap:', categoryHeaps.characters.heap);
                    console.log('Final relationship data:', relationshipData);
                    
                    // Store everything in a single operation
                    await chrome.storage.session.set({
                        categoryHeaps: {
                            ...heapData,
                            relationshipData  // Store full relationship data
                        }
                    });

                    // Notify other tabs with the same data structure
                    chrome.runtime.sendMessage({
                        action: "kudosUpdated",
                        data: {
                            ficName,
                            categoryHeaps: heapData,
                            relationshipData // Keep relationship data separate for popup
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