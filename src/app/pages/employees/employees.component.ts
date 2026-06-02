import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ResourceConfig, ResourceManagerComponent } from '../../shared/resource-manager/resource-manager.component';

@Component({
  selector: 'app-employees',
  standalone: true,
  imports: [CommonModule, ResourceManagerComponent],
  templateUrl: './employees.component.html',
  styleUrl: './employees.component.css'
})
export class EmployeesComponent {
  config: ResourceConfig = {
    title: 'Employees',
    description: 'Manage staff records, shifts, departments, and on-duty coverage.',
    endpoint: 'employees',
    createLabel: 'Add Employee',
    emptyLabel: 'Employee',
    fields: [
      { key: 'fullName', label: 'Full Name', required: true },
      { key: 'department', label: 'Department', required: true },
      { key: 'role', label: 'Role', required: true },
      { key: 'shift', label: 'Shift', type: 'select', options: ['morning', 'afternoon', 'night', 'flex'] },
      { key: 'phone', label: 'Phone' },
      { key: 'status', label: 'Status', type: 'select', options: ['on-duty', 'off-duty', 'leave'] }
    ],
    columns: [
      { key: 'fullName', label: 'Name' },
      { key: 'department', label: 'Department' },
      { key: 'role', label: 'Role' },
      { key: 'shift', label: 'Shift' },
      { key: 'status', label: 'Status', type: 'badge' }
    ],
    summaries: [
      { label: 'Total Staff', value: (records) => records.length },
      { label: 'On Duty', value: (records) => records.filter((record) => record['status'] === 'on-duty').length },
      { label: 'Departments', value: (records) => new Set(records.map((record) => record['department']).filter(Boolean)).size },
      { label: 'On Leave', value: (records) => records.filter((record) => record['status'] === 'leave').length }
    ]
  };
}
