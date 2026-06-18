
export interface CheckIn {
    _id?: string;
    bookingId: string | any;
    roomId: string | any;
    employeeId: string | any;
    actualCheckInTime: string | Date;
    keyIssued: boolean;
    depositAmount: number;
    paymentMethod: 'cash' | 'card' | 'bank-transfer' | 'qr-code' | 'none';
    baggageCount?: number; // 🟢 FIXED: The '?' means it's no longer strictly required!
    status: 'completed' | 'cancelled';
    notes?: string;
    createdAt?: string;
    updatedAt?: string;
}