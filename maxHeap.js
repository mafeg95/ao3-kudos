class MaxHeap {
    constructor() {
        this.heap = [];
        this.insertionOrder = 0; // Track how many items have been inserted
    }

    // Helper functions
    parent(i) { return Math.floor((i - 1) / 2); }
    left(i) { return 2 * i + 1; }
    right(i) { return 2 * i + 2; }

    // Insert or update an existing fandom
    insertOrUpdate(category, count) {
        this.insertionOrder++;
        let index = this.heap.findIndex(item => item.category === category);

        if (index !== -1) {
            // Update existing
            this.heap[index].count += count;
            // No need to change order since it was inserted before
            this.bubbleUp(index);
            this.bubbleDown(index);
        } else {
            // Insert new
            let newItem = { category, count, order: this.insertionOrder };
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