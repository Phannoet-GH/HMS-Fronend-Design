import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin } from 'rxjs';
import { ResourceConfig, ResourceManagerComponent } from '../../shared/resource-manager/resource-manager.component';
import { RoomService } from '@core/services/room.service';
import { Room } from '@core/models/room.model';
import { EmployeeService } from '@core/services/employee.service';
import { Employee } from '@core/models/employee.model';
import { ApiResponse } from '@core/models/api-response.model';

@Component({
  selector: 'app-service-requests',
  standalone: true,
  imports: [CommonModule, ResourceManagerComponent],
  templateUrl: './service-requests.component.html',
  styleUrl: './service-requests.component.css'
})
export class ServiceRequestsComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly roomService = inject(RoomService);
  private readonly employeeService = inject(EmployeeService);

  loadError = false;

  config: ResourceConfig = {
    title: 'Service Requests',
    description: 'Track guest and room requests from intake through completion.',
    endpoint: 'service-requests',
    createLabel: 'New Request',
    emptyLabel: 'Service Request',
    fields: [
      { key: 'roomNumber', label: 'Room Number', required: true, type: 'select', options: [] },
      { key: 'type', label: 'Request Type', required: true },
      { key: 'priority', label: 'Priority', type: 'select', options: ['low', 'normal', 'high', 'urgent'] },
      { key: 'assignedTo', label: 'Assigned To', type: 'select', options: [] },
      { key: 'notes', label: 'Notes', type: 'textarea' },
      { key: 'status', label: 'Status', type: 'select', options: ['open', 'in-progress', 'completed', 'cancelled'] }
    ],
    columns: [
      { key: 'roomNumber', label: 'Room' },
      { key: 'type', label: 'Type' },
      { key: 'priority', label: 'Priority', type: 'badge' },
      { key: 'assignedTo', label: 'Assigned To' },
      { key: 'status', label: 'Status', type: 'badge' }
    ],
    summaries: [
      { label: 'Open', value: (records) => records.filter(r => r['status'] === 'open').length },
      { label: 'In Progress', value: (records) => records.filter(r => r['status'] === 'in-progress').length },
      { label: 'Urgent', value: (records) => records.filter(r => r['priority'] === 'urgent').length },
      { label: 'Completed', value: (records) => records.filter(r => r['status'] === 'completed').length }
    ]
  };

  ngOnInit(): void {
    this.fetchFormOptions();
  }

  private fetchFormOptions(): void {
    forkJoin({
      rooms: this.roomService.getAll({ status: 'available' }),
      employees: this.employeeService.getAll({ status: 'active' })
    }).pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ rooms, employees }) => {
          const roomList: Room[] = (rooms as unknown as ApiResponse<Room[]>).data ?? rooms as any;
          const employeeList: Employee[] = Array.isArray(employees)
            ? employees
            : (employees as ApiResponse<Employee[]>).data;

          const roomField = this.config.fields.find(f => f.key === 'roomNumber');
          if (roomField) {
            roomField.options = roomList.map(r => `${r.roomNumber} - ${r.type}`);
          }

          const assignedField = this.config.fields.find(f => f.key === 'assignedTo');
          if (assignedField) {
            assignedField.options = [
              'Unassigned',
              ...employeeList.map(e => `${e.fullName} (${e.department})`)
            ];
          }
        },
        error: (err) => {
          this.loadError = true;
          console.error('[ServiceRequestsComponent] Failed to load form options', err);
        }
      });
  }
}