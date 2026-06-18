export interface Supplier {
    _id: string;
    name: string;
    contactName?: string;
    phone?: string;
    email?: string;

    category:
    | 'f&b'
    | 'linen-textiles'
    | 'guest-amenities'
    | 'maintenance-repaired'
    | 'cleaning-janitorial'
    | 'office-it';

    status: 'active' | 'paused' | 'inactive';

    createdAt?: string;
    updatedAt?: string;
}