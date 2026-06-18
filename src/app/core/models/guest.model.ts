export interface Guest {
    _id?: string;
    fullName: string;
    email?: string;
    phone: string;
    idType: 'passport' | 'national-id' | 'driver-license' | 'other';
    idNumber?: string;
    nationality?: string;
    address?: string;
    notes?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface GuestPayload {
    fullName: string;
    email?: string;
    phone: string;
    idType?: 'passport' | 'national-id' | 'driver-license' | 'other';
    idNumber?: string;
    nationality?: string;
    address?: string;
    notes?: string;
}