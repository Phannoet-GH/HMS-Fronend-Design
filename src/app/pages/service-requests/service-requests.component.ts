import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin } from 'rxjs';
import { ResourceConfig, ResourceManagerComponent } from '../../shared/resource-manager/resource-manager.component';
import { RoomService } from '@core/services/room.service';
import { EmployeeService } from '@core/services/employee.service';
// Ensure the path matches your project structure
import { Room } from '@core/models/room.model';
import { Employee } from '@core/models/employee.model';
import { __values } from 'tslib';
// 1. Create a map of Service Type -> Required Position
const serviceToPositionMap: Record<string, string> = {
  'housekeeping': 'housekeeping',
  'maintenance': 'maintenance',
  'food-&-beverage': 'room-service',
  'luggage': 'bellhop',
  'wake-up-call': 'receptionist'
};

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
      // 🟢 FIXED: Lowercase values to match standard backend enum patterns
      { key: 'type', label: 'Request Type', required: true, type: 'select', options: ['housekeeping', 'maintenance', 'food-&-beverage', 'technical', 'other'] },
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
      rooms: this.roomService.getRooms(),
      employees: this.employeeService.getEmployees()
    }).pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          // 🟢 Robust extraction: handle both raw arrays and { data: [...] } objects
          const rooms = Array.isArray(res.rooms) ? res.rooms : (res.rooms as any)?.data ?? [];
          const employees = Array.isArray(res.employees) ? res.employees : (res.employees as any)?.data ?? [];

          // Update room selection
          const roomField = this.config.fields.find(f => f.key === 'roomNumber');
          if (roomField) {
            roomField.options = rooms.map((r: Room) => String(r.roomNumber));
          }

          // Update employee assignment selection
          const assignedField = this.config.fields.find(f => f.key === 'assignedTo');
          if (assignedField) {
            assignedField.options = [
              {
                label: 'Unassigned', value: null
              },
              ...employees // 🟢 Now using the extracted array
                .filter((e: Employee) => e?.status === 'active')
                .map((e: Employee) => ({
                  label: `${e.fullName}`,
                  value: e._id // 🟢 Store the actual ObjectId here!
                }))
            ];
          }
        },
        error: (err) => {
          this.loadError = true;
          console.error('[ServiceRequestsComponent] Failed to load options:', err);
        }
      });
  }
}