export interface InventoryItem {
    _id: string;
    name: string;
    sku?: string;

    category:
    | 'f&b'
    | 'linen-textiles'
    | 'guest-amenities'
    | 'maintenance-repaired'
    | 'cleaning-janitorial'
    | 'office-it';

    quantity: number;
    reorderLevel: number;
    unitCost: number;

    supplierId?: string | null;

    status:
    | 'in-stock'
    | 'low-stock'
    | 'out-of-stock';

    createdAt: string;
    updatedAt: string;
}