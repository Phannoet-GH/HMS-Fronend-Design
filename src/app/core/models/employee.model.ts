export interface Employee {
    _id?: string; // Optional for creation, present for database entries
    fullName: string;
    userId: string | any | null; // Can hold a User Object ID string or populated User model
    position:
    | 'General Manager'
    | 'Front Office Manager'
    | 'Receptionist'
    | 'Night Auditor'
    | 'Housekeeping Supervisor'
    | 'Room Attendant'
    | 'Hotel Accountant'
    | 'Chef'
    | 'Waiter'
    | 'Housekeeping'
    | 'Maintenance / Technical'
    | 'Room Service'
    | 'Luggage / Wake-up Calls'
    departmentId: string | any | null; // Populated or plain reference ID string
    managerId: string | null;
    shift: 'morning' | 'afternoon' | 'evening' | 'night';
    phone: string;
    status: 'active' | 'off-duty' | 'on-leave' | 'terminated';
    createdAt?: string;
    updatedAt?: string;
}