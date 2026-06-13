export interface Employee {
    _id: string;
    fullName: string;
    department: string;
    role: 'manager' | 'staff';
    shift: 'morning' | 'afternoon' | 'evening' | 'night';
    phone: string;
    status: 'active' | 'off-duty' | 'on-leave' | 'terminated';
    createdAt: string;
    updatedAt: string;
}

export type EmployeeStatus = Employee['status'];
export type EmployeeShift = Employee['shift'];