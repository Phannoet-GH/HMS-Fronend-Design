// 1. Declare and export the type explicitly
export type RoomStatus = 'available' | 'occupied' | 'reserved' | 'dirty' | 'cleaning' | 'maintenance';

// 2. Use it inside your main Room interface
export interface Room {
    _id?: string;
    roomNumber: string;
    floorNumber: number;
    type: 'single' | 'double' | 'suite' | 'deluxe';
    pricePerNight: number;
    capacity: number;
    status: RoomStatus; // ✅ Using the custom type here
    description: string;
    createdAt?: string;
    updatedAt?: string;
}