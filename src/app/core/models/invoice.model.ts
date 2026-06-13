export type InvoiceStatus = 'draft' | 'issued' | 'unpaid' | 'paid' | 'cancelled' | 'void';

export type Invoice = {
    _id: string;
    invoiceNumber: string;
    booking: {
        _id: string;
        guest: {
            fullName: string;
            email: string;
            phone: string;
        };
        room: {
            roomNumber: string;
            type: string;
        };
        checkInDate: string;
        checkOutDate: string;
    };
    guest: {
        fullName: string;
        email: string;
        phone: string;
        address?: string;
    };
    room: {
        roomNumber: string;
        type: string;
        pricePerNight: number;
    };
    checkInDate: string;
    checkOutDate: string;
    numberOfNights: number;
    roomCharges: number;
    additionalCharges: Array<{
        description: string;
        amount: number;
    }>;
    subtotal: number;
    discount: number;
    taxPercentage: number;
    taxAmount: number;
    totalAmount: number;
    amount: number;
    status: InvoiceStatus;
    issueDate: string;
    dueDate?: string;
    paymentDate?: string;
    paymentMethod?: string;
    notes?: string;
    createdAt: string;
    updatedAt: string;
};

export type InvoicePayload = {
    bookingId: string;
    numberOfNights: number;
    roomCharges: number;
    additionalCharges?: Array<{
        description: string;
        amount: number;
    }>;
    discount?: number;
    taxPercentage?: number;
    notes?: string;
};

export interface InvoiceQueryParams {
    status?: InvoiceStatus;
    bookingId?: string;
    skip?: number;
    limit?: number;
}

export type InvoiceListResponse = {
    invoices: Invoice[];
    total: number;
};

export type UpdateInvoiceStatusPayload = {
    status: InvoiceStatus;
    paymentDate?: string;
    paymentMethod?: string;
};