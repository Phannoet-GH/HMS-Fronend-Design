export interface ServiceRequest {
    _id?: string;

    roomId: string | {
        _id: string;
        roomNumber: string;
    };

    roomNumber: string;

    type:
    | 'housekeeping'
    | 'maintenance'
    | 'room-service'
    | 'luggage'
    | 'wake-up-call'
    | 'other';

    priority:
    | 'low'
    | 'normal'
    | 'high'
    | 'urgent';

    assignedTo?: string | {
        _id: string;
        fullName: string;
    } | null;

    notes?: string;

    status:
    | 'open'
    | 'in-progress'
    | 'completed'
    | 'cancelled';

    createdAt?: string;
    updatedAt?: string;
}