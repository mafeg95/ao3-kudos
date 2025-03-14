class MaxHeap {
    constructor() {
        this.heap = [];
        this.insertionOrder = 0; // Track how many items have been inserted
        this.items = new Set(); // Track unique items
        this.characterRelationships = {}; // Only used by relationships heap
    }

    // Method to refresh heap from storage
    refreshFromStorage(heapData) {
        if (heapData === null || heapData === undefined) return;
        
        // Reset heap state
        this.heap = [];
        this.items = new Set();
        this.insertionOrder = 0;
        
        // Function to efficiently bulk add items
        const bulkAddItems = (items) => {
            // First, collect all items without heapifying
            items.forEach(item => {
                const tag = item.tag || item.category;
                if (!tag || typeof tag !== 'string') return;
                
                const itemCount = item.count || 1;
                const isCharacter = item.type === 'character';
                const relationshipCount = isCharacter ? (item.relationshipCount || 0) : 0;
                const totalScore = isCharacter ? (relationshipCount * 1000 + itemCount) : itemCount;
                
                const heapItem = {
                    tag,
                    count: itemCount,
                    type: item.type,
                    order: item.order || ++this.insertionOrder,
                    relationshipCount,
                    totalScore
                };
                
                this.heap.push(heapItem);
                this.items.add(tag);
            });
            
            // Then heapify the entire array at once - O(n) operation
            for (let i = Math.floor(this.heap.length / 2); i >= 0; i--) {
                this.bubbleDown(i);
            }
        };
        
        if (Array.isArray(heapData)) {
            // For non-relationship heaps
            bulkAddItems(heapData);
        } else if (heapData.heap) {
            // For relationships heap
            bulkAddItems(heapData.heap);
            
            // Restore relationship counts
            if (heapData.characterRelationships) {
                this.characterRelationships = heapData.characterRelationships;
            }
        }
    }

    // Process a relationship tag to update character relationship counts
    processRelationship(relationship) {
        if (!relationship || typeof relationship !== 'string' || !relationship.includes('/')) {
            console.warn('Invalid relationship:', relationship);
            return;
        }
        
        console.log('Processing relationship:', relationship);
        
        // Split relationship into character tags
        const characters = relationship.split('/')
            .map(char => char.trim())
            .filter(char => char.length > 0);

        if (characters.length < 2) {
            console.warn('Invalid relationship format:', relationship);
            return;
        }

        console.log('Found characters:', characters);

        // Initialize characterRelationships if needed
        if (!this.characterRelationships) {
            this.characterRelationships = {};
        }

        // Update counts for each character
        characters.forEach(char => {
            if (!this.characterRelationships[char]) {
                this.characterRelationships[char] = 0;
            }
            this.characterRelationships[char]++;
            
            console.log('Updated relationship count:', {
                character: char,
                newCount: this.characterRelationships[char]
            });
        });
    }

    // Helper functions
    parent(i) { return Math.floor((i - 1) / 2); }
    left(i) { return 2 * i + 1; }
    right(i) { return 2 * i + 2; }

    // Insert or update an existing item
    insertOrUpdate(item, count = 1, options = {}) {
        // Handle both string and object inputs
        const tag = typeof item === 'string' ? item : item.tag;
        const itemCount = typeof item === 'string' ? count : (item.count || count);
        
        if (!tag || typeof tag !== 'string') {
            console.warn('Invalid tag:', item);
            return;
        }
        
        console.log('=== INSERT/UPDATE ===');
        console.log('Input:', { item, count, options });
        
        this.insertionOrder++;
        
        // For characters, handle relationship counts
        const isCharacter = options.type === 'character';
        const relationshipCount = isCharacter ? (options.relationshipCount || 0) : 0;
        const totalScore = isCharacter ? (relationshipCount * 1000 + itemCount) : itemCount;
        
        // For relationships, process character relationships
        if (options.type === 'relationship' && tag.includes('/')) {
            const characters = tag.split('/')
                .map(char => char.trim())
                .filter(char => char.length > 0);
            
            console.log('Processing relationship characters:', characters);
            
            // Update relationship counts for each character
            characters.forEach(char => {
                if (!this.characterRelationships[char]) {
                    this.characterRelationships[char] = 0;
                }
                this.characterRelationships[char]++;
                console.log(`Updated relationship count for ${char}: ${this.characterRelationships[char]}`);
            });
        }
        
        // Check if tag exists
        if (this.items.has(tag)) {
            console.log('Updating existing tag:', tag);
            let index = this.heap.findIndex(item => item.tag === tag);
            
            // Update counts
            const oldCount = this.heap[index].count || 0;
            this.heap[index].count = (oldCount + itemCount);
            
            // Update character-specific data
            if (isCharacter) {
                this.heap[index].relationshipCount = relationshipCount;
                this.heap[index].totalScore = totalScore;
            }
            
            // Update type if provided
            if (options.type) {
                this.heap[index].type = options.type;
            }
            
            console.log('Updated item:', this.heap[index]);
            
            // Rebalance heap
            this.bubbleUp(index);
            this.bubbleDown(index);
        } else {
            console.log('Inserting new tag:', tag);
            
            // Create new item
            const newItem = { 
                tag,
                count: itemCount,
                order: this.insertionOrder,
                type: options.type
            };
            
            // Add character-specific data
            if (isCharacter) {
                newItem.relationshipCount = relationshipCount;
                newItem.totalScore = totalScore;
            }
            
            console.log('New item:', newItem);
            
            // Add to heap
            this.items.add(tag);
            this.heap.push(newItem);
            this.bubbleUp(this.heap.length - 1);
        }
        
        console.log('=== UPDATE COMPLETE ===');
        console.log('Final heap state:', {
            size: this.heap.length,
            items: this.items.size,
            relationships: Object.keys(this.characterRelationships).length
        });
    }

    bubbleUp(index) {
        while (index > 0) {
            const parentIdx = this.parent(index);
            // For max heap, if current node is greater than parent, swap them
            if (!isGreater(this.heap[index], this.heap[parentIdx], this)) break;
            
            // Swap with parent
            [this.heap[index], this.heap[parentIdx]] = [this.heap[parentIdx], this.heap[index]];
            index = parentIdx;
        }
    }

    bubbleDown(index) {
        const size = this.heap.length;
        let current = index;

        while (true) {
            let largest = current;
            const left = this.left(current);
            const right = this.right(current);

            // For max heap, find the largest among current, left and right
            if (left < size && isGreater(this.heap[left], this.heap[largest], this)) {
                largest = left;
            }
            if (right < size && isGreater(this.heap[right], this.heap[largest], this)) {
                largest = right;
            }

            if (largest === current) break;

            [this.heap[current], this.heap[largest]] = [this.heap[largest], this.heap[current]];
            current = largest;
        }
    }

    getTopTags(k) {
        // Return top k elements with both tag and count
        return this.heap.slice(0, k).map(item => ({
            tag: item.tag,
            count: item.count,
            type: item.type
        }));
    }

    extractMax() {
        if (this.heap.length === 0) return null;
        const max = this.heap[0];
        const end = this.heap.pop();
        if (this.heap.length > 0) {
            this.heap[0] = end;
            this.bubbleDown(0);
        }
        return max;
    }
}

// Helper function to compare heap items
function isGreater(a, b) {
    console.log('\n=== COMPARING ===');
    console.log(`Comparing ${a.tag} vs ${b.tag}`);
    
    // For character tags, use totalScore which includes both kudos and relationships
    if (a.type === 'character' && b.type === 'character') {
        if (a.totalScore !== b.totalScore) {
            console.log(`Deciding by total score: ${a.totalScore} vs ${b.totalScore}`);
            return a.totalScore > b.totalScore;
        }
    } else {
        // For non-character tags, just compare counts
        if (a.count !== b.count) {
            console.log(`Deciding by count: ${a.count} vs ${b.count}`);
            return a.count > b.count;
        }
    }

    // If scores/counts are equal, use insertion order (earlier items have priority)
    console.log(`Deciding by insertion order: ${a.order} vs ${b.order}`);
    return a.order < b.order;
}