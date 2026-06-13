export interface Room {
    _id: string;
    roomNumber: string;
    type: 'single' | 'double' | 'suite' | 'deluxe';
    pricePerNight: number;
    capacity: number;
    status: 'available' | 'occupied' | 'maintenance' | 'reserved';
    description: string;
    createdAt: string;
    updatedAt: string;
}

export type RoomStatus = Room['status'];
export type RoomType = Room['type'];
// Add to core/models/room.model.ts
export type RoomPayload = Omit<Room, '_id' | 'createdAt' | 'updatedAt'>;
// core/models/room.model.ts — add at the bottom
export interface RoomQueryParams {
    status?: RoomStatus;
    type?: RoomType;
    minPrice?: number;
    maxPrice?: number;
    capacity?: number;
}