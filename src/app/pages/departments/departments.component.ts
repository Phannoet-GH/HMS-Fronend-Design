import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { EmployeeService } from '@core/services/employee.service';
import { ResourceConfig, ResourceManagerComponent } from '../../shared/resource-manager/resource-manager.component';

@Component({
  selector: 'app-departments',
  standalone: true,
  imports: [CommonModule, ResourceManagerComponent],
  templateUrl: './departments.component.html',
  styleUrl: './departments.component.css'
})
export class DepartmentsComponent implements OnInit {
  config: ResourceConfig = {
    title: 'Departments',
    description: 'Organize departments, managers, staffing levels, and budgets.',
    endpoint: 'departments',
    createLabel: 'Add Department',
    emptyLabel: 'Department',
    fields: [],
    columns: [
      { key: 'code', label: 'Code' },
      { key: 'name', label: 'Department' },
      { key: 'managerId.fullName', label: 'Assigned Manager' },
      { key: 'staffCount', label: 'Dynamic Headcount', type: 'number' },
      { key: 'budget', label: 'Budget', type: 'currency' },
      { key: 'status', label: 'Status', type: 'badge' }
    ],
    summaries: [
      { label: 'Departments', value: (records) => records.length },
      { label: 'Active', value: (records) => records.filter((r) => r['status'] === 'active').length },
      { label: 'Total Staff', value: (records) => records.reduce((sum, r) => sum + Number(r['staffCount'] || 0), 0) },
      { label: 'Budget Limit Pool', value: (records) => `$${records.reduce((sum, r) => sum + Number(r['budget'] || 0), 0).toLocaleString()}` }
    ]
  };

  constructor(private employeeService: EmployeeService) { }

  ngOnInit(): void {
    this.loadManagementStaffOptions();
  }

  private loadManagementStaffOptions(): void {
    this.employeeService.getEmployees().pipe(
      catchError(() => of([]))
    ).subscribe((res: any) => {

      // Defensively check for array structure wrapping elements 
      const employeeArray = Array.isArray(res) ? res : (res?.data || []);

      const eligibleManagers = employeeArray
        .filter((emp: any) => ['General Manager', 'Front Office Manager', 'Housekeeping Supervisor', 'Night Auditor'].includes(emp.position))
        .map((mgr: any) => ({
          label: `${mgr.fullName} (${mgr.position})`,
          value: mgr._id ?? null
        }));

      this.config.fields = [
        { key: 'code', label: 'Department Code (e.g., FO, HK)', required: true },
        { key: 'name', label: 'Department Name', required: true },
        {
          key: 'managerId',
          label: 'Designated Manager Profile Link',
          type: 'select',
          required: false,
          options: [{ label: '-- Currently Vacant --', value: '' }, ...eligibleManagers]
        },
        { key: 'budget', label: 'Allocated Operations Budget', type: 'number', required: true },
        { key: 'status', label: 'Status State', type: 'select', required: true, options: ['active', 'inactive'] }
      ];
    });
  }
}