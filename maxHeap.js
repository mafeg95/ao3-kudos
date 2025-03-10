class MaxHeap {
    constructor() {
        this.heap = [];
        this.insertionOrder = 0; // Track how many items have been inserted
        this.categories = new Set(); // Track unique categories
        this.characterRelationships = {}; // Track characters in romantic relationships
    }

    // Method to refresh heap from storage
    refreshFromStorage(heapData) {
        if (!Array.isArray(heapData)) return;
        this.heap = heapData;
        this.categories = new Set(heapData.map(item => item.category));
        this.insertionOrder = Math.max(...heapData.map(item => item.order), 0);
    }

    // Process a relationship tag to update character relationship counts
    processRelationship(relationship) {
        if (!relationship || !relationship.includes('/')) return;
        
        // Split and clean up character names
        const characters = relationship.split('/')
            .map(char => char.trim())
            .filter(char => char.length > 0);

        // Update counts for each character
        characters.forEach(char => {
            this.characterRelationships[char] = (this.characterRelationships[char] || 0) + 1;
        });
    }

    // Helper functions
    parent(i) { return Math.floor((i - 1) / 2); }
    left(i) { return 2 * i + 1; }
    right(i) { return 2 * i + 2; }

    // Insert or update an existing item
    insertOrUpdate(category, count, options = {}) {
        if (!category) {
            console.warn('Attempted to insert/update undefined or null category');
            return;
        }

        this.insertionOrder++;
        
        // Check if category exists using Set for O(1) lookup
        if (this.categories.has(category)) {
            // Update existing
            let index = this.heap.findIndex(item => item.category === category);
            const oldCount = this.heap[index].count;
            this.heap[index].count += count;
            // Preserve the type if it was previously set
            if (options.type) {
                this.heap[index].type = options.type;
            }
            this.bubbleUp(index);
            this.bubbleDown(index);
        } else {
            // Insert new
            let newItem = { 
                category, 
                count, 
                order: this.insertionOrder,
                type: options.type // Add type if provided
            };
            this.categories.add(category); // Add to Set
            this.heap.push(newItem);
            this.bubbleUp(this.heap.length - 1);
        }
    }

    bubbleUp(index) {
        while (index > 0) {
            const parentIdx = this.parent(index);
            if (!isGreater(this.heap[index], this.heap[parentIdx], this)) break;
            
            // Swap with parent
            [this.heap[index], this.heap[parentIdx]] = [this.heap[parentIdx], this.heap[index]];
            index = parentIdx;
        }
    }

    bubbleDown(index) {
        let largest = index;
        const left = this.left(index);
        const right = this.right(index);

        // Compare with left child
        if (left < this.heap.length && isGreater(this.heap[left], this.heap[largest], this)) {
            largest = left;
        }
        
        // Compare with right child
        if (right < this.heap.length && isGreater(this.heap[right], this.heap[largest], this)) {
            largest = right;
        }

        // If a child is larger, swap and continue bubbling down
        if (largest !== index) {
            [this.heap[index], this.heap[largest]] = [this.heap[largest], this.heap[index]];
            this.bubbleDown(largest);
        }
    }

    getTopCategory(k) {
        // Return top k elements
        // debugger
        return this.heap.slice(0, k).map(item => {
            // debugger
            return item.category
        });
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
function isGreater(a, b, heap) {
    // For non-character tags, just compare counts
    if (!a.type || a.type !== 'character') {
        if (a.count !== b.count) return a.count > b.count;
        return a.order < b.order;
    }

    // For character tags, factor in relationship appearances
    const aRelCount = heap.characterRelationships[a.category] || 0;
    const bRelCount = heap.characterRelationships[b.category] || 0;

    // First prioritize relationship count
    if (aRelCount !== bRelCount) return aRelCount > bRelCount;

    // If relationship counts are equal, compare kudos counts
    if (a.count !== b.count) return a.count > b.count;

    // If everything is equal, use insertion order (earlier items have priority)
    return a.order < b.order;
}