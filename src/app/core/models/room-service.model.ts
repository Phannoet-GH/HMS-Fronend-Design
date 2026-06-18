export type RoomServiceStatus = 'requested' | 'preparing' | 'delivered' | 'cancelled';

export interface RoomServiceItem {
    inventoryItemId: string;
    itemName: string;
    quantity: number;
    price: number;
}

export interface RoomServiceOrder {
    _id?: string;
    roomId: string;
    roomNumber: string;
    guestId?: string | null;
    guestName?: string;
    items: RoomServiceItem[];
    totalAmount: number;
    status: RoomServiceStatus;
    notes?: string;
    createdAt?: string;
    updatedAt?: string;
}

export type RoomServicePayload = Omit<RoomServiceOrder, '_id' | 'createdAt' | 'updatedAt'>;

export interface RoomServiceQueryParams {
    status?: RoomServiceStatus;
    roomId?: string;
}