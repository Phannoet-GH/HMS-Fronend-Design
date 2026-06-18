export interface DepartmentManagerPopulated {
    _id: string;
    fullName: string;
    position: string;
    phone?: string;
}

export interface Department {
    _id?: string;
    name: string;
    code: string;
    // Can be a raw string ID, a fully populated object, or null if vacant
    managerId: string | DepartmentManagerPopulated | null;
    budget: number;
    status: 'active' | 'inactive';
    createdAt?: string;
    updatedAt?: string;
}

// Payload schema contract specifically for creation and update form submissions
export interface DepartmentFormPayload {
    name: string;
    code: string;
    managerId: string | null; // Sent as a string ID or null to the backend
    budget: number;
    status: 'active' | 'inactive';
}