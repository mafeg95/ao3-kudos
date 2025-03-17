class MaxHeap {
    constructor() {
        this.heap = [];
        this.insertionOrder = 0; // Track how many items have been inserted
        this.items = new Set(); // Track unique items
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
                
                const heapItem = {
                    tag,
                    count: itemCount,
                    type: item.type,
                    order: item.order || ++this.insertionOrder
                };
                
                // For characters, get their current relationship count
                if (isCharacter) {
                    // Use provided relationship count or default to stored count
                    const cleanedName = extractCharacterName(tag, true);
                    heapItem.relationshipCount = item.relationshipCount || (categoryHeaps.relationshipData.get(cleanedName) || 0);
                }
                
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

        }
    }

    // Process a relationship tag to update character relationship counts
    processRelationship(relationship) {
        if (!relationship || typeof relationship !== 'string' || !relationship.includes('/')) {
            console.warn('Invalid relationship:', relationship);
            return;
        }
        
        // Split relationship into character tags
        const characters = relationship.split('/')
            .map(char => char.trim())
            .filter(char => char.length > 0);

        if (characters.length < 2) {
            console.warn('Invalid relationship format:', relationship);
            return;
        }

        // Update relationship counts in the global Map
        characters.forEach(char => {
            const cleanedName = extractCharacterName(char, true);
            const currentCount = categoryHeaps.relationshipData.get(cleanedName) || 0;
            categoryHeaps.relationshipData.set(cleanedName, currentCount + 1);
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
        
        // Check if tag exists
        if (this.items.has(tag)) {
            let index = this.heap.findIndex(item => item.tag === tag);
            
            // Save old state for comparison
            const oldItem = { ...this.heap[index] };
            
            // Increment count by 1 for any tag we see again
            this.heap[index].count++;
            console.log(`Tag ${tag} seen again - count now ${this.heap[index].count}`);
            
            // Update character-specific data if needed
            if (options.type === 'character') {
                const cleanedName = extractCharacterName(tag, true);
                this.heap[index].relationshipCount = categoryHeaps.relationshipData.get(cleanedName) || 0;
            }
            
            // Update type if provided
            if (options.type) {
                this.heap[index].type = options.type;
            }
            
            // Compare with old state to determine rebalancing direction
            console.log('Comparing old and new:', oldItem, this.heap[index]);
            if (isGreater(this.heap[index], oldItem)) {
                // Priority increased, bubble up
                this.bubbleUp(index);
            } else if (isGreater(oldItem, this.heap[index])) {
                // Priority decreased, bubble down
                this.bubbleDown(index);
            }
        } else {
            
            // Only increment insertionOrder for new items
            this.insertionOrder++;
            
            // Create new item - all tags start with count=1
            const newItem = { 
                tag,
                count: 1,  // All tags start at 1 when first seen
                order: this.insertionOrder,  // Use the new insertion order
                type: options.type
            };
            
            // Add character-specific data
            if (options.type === 'character') {
                // Get relationship count from the global Map
                const cleanedName = extractCharacterName(tag, true);
                newItem.relationshipCount = categoryHeaps.relationshipData.get(cleanedName) || 0;
                console.log(`New character ${tag} with count=1 and relationships=${newItem.relationshipCount}`);
            }
            
            // Add to heap
            this.items.add(tag);
            this.heap.push(newItem);
            this.bubbleUp(this.heap.length - 1);
        }
    }

    // Find equal-valued nodes that should be compared
    findEqualNodes(index) {
        const current = this.heap[index];
        const equalNodes = [];
        
        // Find all nodes with equal kudos and relationship counts
        for (let i = 0; i < this.heap.length; i++) {
            if (i !== index && 
                current.count === this.heap[i].count && 
                (current.relationshipCount || 0) === (this.heap[i].relationshipCount || 0)) {
                equalNodes.push(i);
            }
        }
        
        return equalNodes;
    }

    bubbleUp(index) {
        let currentIndex = index;
        while (currentIndex > 0) {
            const parentIdx = this.parent(currentIndex);
            
            if (!isGreater(this.heap[currentIndex], this.heap[parentIdx])) {
                break;
            }
            
            // Swap with parent and continue up
            [this.heap[currentIndex], this.heap[parentIdx]] = [this.heap[parentIdx], this.heap[currentIndex]];
            currentIndex = parentIdx;
        }
    }

    bubbleDown(index) {
        const size = this.heap.length;
        let current = index;

        while (true) {
            const left = this.left(current);
            const right = this.right(current);
            let largest = current;

            if (left < size && isGreater(this.heap[left], this.heap[largest])) {
                largest = left;
            }
            if (right < size && isGreater(this.heap[right], this.heap[largest])) {
                largest = right;
            }

            if (largest === current) break;

            // Swap with largest child and continue down
            [this.heap[current], this.heap[largest]] = [this.heap[largest], this.heap[current]];
            current = largest;
        }
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
    console.log('Comparing:', a, b)
    
    // For character tags, use special comparison logic
    if (a.type === 'character' && b.type === 'character') {
        const cleanNameA = extractCharacterName(a.tag, true);
        const cleanNameB = extractCharacterName(b.tag, true);
        
        // Get relationship counts from the global relationship data
        const relationshipsA = categoryHeaps.relationshipData.get(cleanNameA) || 0;
        const relationshipsB = categoryHeaps.relationshipData.get(cleanNameB) || 0;
        
        // First compare by appearance count
        if (a.count !== b.count) {
            return a.count > b.count;
        }
        
        // If counts are equal, characters with relationships go first
        if ((relationshipsA > 0) !== (relationshipsB > 0)) {
            return relationshipsA > 0;
        }
        
        // If both have relationships, compare by relationship count
        if (relationshipsA !== relationshipsB) {
            return relationshipsA > relationshipsB;
        }
        
        // If everything else is equal, use insertion order
        return a.order < b.order;
    } else {
        // For non-character tags, just compare appearance counts
        if (a.count !== b.count) {
            return a.count > b.count;
        }
        return a.order < b.order;  // Use order for equal non-character tags too
    }
}