import { Room } from './room.model';

export type BookingStatus = 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled' | 'no_show';

export type Booking = {
    _id: string;
    guest: {
        fullName: string;
        email?: string;
        phone: string;
    };
    room: Room | null;
    checkInDate: string;
    checkOutDate: string;
    status: BookingStatus;
    totalAmount: number;
};

export type BookingPayload = {
    guest: {
        fullName: string;
        email?: string;
        phone: string;
        idNumber?: string;
        address?: string;
    };
    roomId: string;
    checkInDate: string;
    checkOutDate: string;
    status?: BookingStatus;
};

export interface BookingQueryParams {
    status?: BookingStatus;
    room?: string;
}