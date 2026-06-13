export interface InventoryItem {
    _id: string;
    name: string;
    category: string;
    price: number;
    unit: string;
    quantity: number;
    status: 'available' | 'low-stock' | 'out-of-stock';
    createdAt: string;
    updatedAt: string;
}