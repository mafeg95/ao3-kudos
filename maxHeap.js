class MaxHeap {
    constructor() {
        this.heap = [];
        this.insertionOrder = 0; // Track how many items have been inserted
        this.categories = new Set(); // Track unique categories
    }

    // Method to refresh heap from storage
    refreshFromStorage(heapData) {
        if (!Array.isArray(heapData)) return;
        this.heap = heapData;
        this.categories = new Set(heapData.map(item => item.category));
        this.insertionOrder = Math.max(...heapData.map(item => item.order), 0);
    }

    // Helper functions
    parent(i) { return Math.floor((i - 1) / 2); }
    left(i) { return 2 * i + 1; }
    right(i) { return 2 * i + 2; }

    // Insert or update an existing fandom
    insertOrUpdate(category, count) {
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
            console.log(`Updating count for ${category}: ${oldCount} -> ${this.heap[index].count}`);
            this.bubbleUp(index);
            this.bubbleDown(index);
        } else {
            // Insert new
            let newItem = { category, count, order: this.insertionOrder };
            console.log(`Adding new category ${category} with count ${count}`);
            this.categories.add(category); // Add to Set
            this.heap.push(newItem);
            this.bubbleUp(this.heap.length - 1);
        }
    }

    bubbleUp(index) {
        while (index > 0 && isGreater(this.heap[index], this.heap[this.parent(index)])) {
            [this.heap[index], this.heap[this.parent(index)]] =
                [this.heap[this.parent(index)], this.heap[index]];
            index = this.parent(index);
        }
    }

    bubbleDown(index) {
        let largest = index;
        const left = this.left(index);
        const right = this.right(index);

        if (left < this.heap.length && isGreater(this.heap[left], this.heap[largest])) {
            largest = left;
        }
        if (right < this.heap.length && isGreater(this.heap[right], this.heap[largest])) {
            largest = right;
        }
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

function isGreater(a, b) {
    if (a.count > b.count) return true;
    if (a.count < b.count) return false;
    // If counts are equal, check order
    return a.order < b.order; // Earlier inserted is considered "greater"
}