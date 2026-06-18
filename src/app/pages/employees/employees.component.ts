import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { DepartmentService } from '@core/services/department.service';
import { EmployeeService } from '@core/services/employee.service';
import { ResourceConfig, ResourceManagerComponent } from '../../shared/resource-manager/resource-manager.component';

@Component({
  selector: 'app-employees',
  standalone: true,
  imports: [CommonModule, ResourceManagerComponent],
  templateUrl: './employees.component.html',
  styleUrl: './employees.component.css'
})
export class EmployeesComponent implements OnInit {
  config: ResourceConfig = {
    title: 'Employees',
    description: 'Manage staff records, shifts, departments, and on-duty coverage.',
    endpoint: 'employees',
    createLabel: 'Add Employee',
    emptyLabel: 'Employee',
    fields: [],
    columns: [
      { key: 'fullName', label: 'Name' },
      { key: 'departmentId.name', label: 'Department' },
      { key: 'position', label: 'Position/Role' },
      { key: 'shift', label: 'Shift' },
      { key: 'status', label: 'Status', type: 'badge' }
    ],
    summaries: [
      { label: 'Total Staff', value: (records) => records.length },
      { label: 'Active Staff', value: (records) => records.filter((r) => r['status'] === 'active').length },
      {
        label: 'Departments',
        value: (records) => {
          const deptIds = records.map((r) => {
            const dept = r['departmentId'];
            return dept && typeof dept === 'object' ? dept._id : dept;
          });
          return new Set(deptIds.filter(Boolean)).size;
        }
      },
      { label: 'On Leave', value: (records) => records.filter((r) => r['status'] === 'on-leave').length }
    ]
  };

  constructor(
    private departmentService: DepartmentService,
    private employeeService: EmployeeService
  ) { }

  ngOnInit(): void {
    this.fetchFormDependencies();
  }

  private fetchFormDependencies(): void {
    forkJoin({
      departments: this.departmentService.getDepartments().pipe(catchError(() => of([]))),
      employees: this.employeeService.getEmployees().pipe(catchError(() => of([])))
    }).subscribe(({ departments, employees }: any) => {

      const deptArray = Array.isArray(departments) ? departments : (departments?.data || []);
      const empArray = Array.isArray(employees) ? employees : (employees?.data || []);

      const deptOptions = deptArray.map((d: any) => ({
        label: d.name,
        value: d._id ?? null
      }));

      const managerOptions = empArray
        .filter((e: any) => ['General Manager', 'Front Office Manager', 'Housekeeping Supervisor'].includes(e.position))
        .map((m: any) => ({
          label: `${m.fullName} (${m.position})`,
          value: m._id ?? null
        }));

      this.config.fields = [
        { key: 'fullName', label: 'Full Name', required: true },
        {
          key: 'departmentId',
          label: 'Assigned Department',
          type: 'select',
          required: true,
          options: deptOptions
        },
        {
          key: 'managerId',
          label: 'Direct Supervisor / Manager',
          type: 'select',
          required: false,
          options: [{ label: '-- No Supervisor (Top Level) --', value: '' }, ...managerOptions]
        },
        {
          key: 'position',
          label: 'Position/Role',
          type: 'select',
          required: true,
          options: [
            'General Manager', 'Front Office Manager', 'Receptionist',
            'Night Auditor', 'Housekeeping Supervisor', 'Room Attendant',
            'Hotel Accountant', 'Chef', 'Waiter', 'Housekeeping', 'Maintenance / Technical', 'Room Service', 'Luggage / Wake-up Calls'
          ]
        },
        { key: 'shift', label: 'Shift', type: 'select', required: true, options: ['morning', 'afternoon', 'evening', 'night'] },
        { key: 'phone', label: 'Contact Phone Number', required: true },
        { key: 'status', label: 'Status', type: 'select', required: true, options: ['active', 'off-duty', 'on-leave', 'terminated'] }
      ];
    });
  }
}