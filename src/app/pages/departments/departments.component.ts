import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ResourceConfig, ResourceManagerComponent } from '../../shared/resource-manager/resource-manager.component';

@Component({
  selector: 'app-departments',
  standalone: true,
  imports: [CommonModule, ResourceManagerComponent],
  templateUrl: './departments.component.html',
  styleUrl: './departments.component.css'
})
export class DepartmentsComponent {
  config: ResourceConfig = {
    title: 'Departments',
    description: 'Organize departments, managers, staffing levels, and budgets.',
    endpoint: 'departments',
    createLabel: 'Add Department',
    emptyLabel: 'Department',
    fields: [
      { key: 'name', label: 'Department Name', required: true },
      { key: 'manager', label: 'Manager' },
      { key: 'staffCount', label: 'Staff Count', type: 'number' },
      { key: 'budget', label: 'Budget', type: 'number' },
      { key: 'status', label: 'Status', type: 'select', options: ['active', 'inactive'] }
    ],
    columns: [
      { key: 'name', label: 'Department' },
      { key: 'manager', label: 'Manager' },
      { key: 'staffCount', label: 'Staff', type: 'number' },
      { key: 'budget', label: 'Budget', type: 'currency' },
      { key: 'status', label: 'Status', type: 'badge' }
    ],
    summaries: [
      { label: 'Departments', value: (records) => records.length },
      { label: 'Active', value: (records) => records.filter((record) => record['status'] === 'active').length },
      { label: 'Total Staff', value: (records) => records.reduce((sum, record) => sum + Number(record['staffCount'] || 0), 0) },
      { label: 'Budget', value: (records) => `$${records.reduce((sum, record) => sum + Number(record['budget'] || 0), 0).toLocaleString()}` }
    ]
  };
}
