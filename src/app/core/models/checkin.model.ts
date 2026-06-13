export type CheckInStatus = 'pending' | 'completed' | 'cancelled';

export type CheckIn = {
    _id: string;
    bookingId: string;
    roomId: string;
    employeeId: string;
    actualCheckInTime: string;
    keyIssued: boolean;
    status: CheckInStatus;
    createdAt?: string;
    updatedAt?: string;
};

export type CheckInPayload = {
    bookingId: string;
    roomId: string;
    employeeId: string;
    actualCheckInTime?: string;
    keyIssued?: boolean;
    status?: CheckInStatus;
};