import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ResourceConfig, ResourceManagerComponent } from '../../shared/resource-manager/resource-manager.component';

@Component({
  selector: 'app-service-requests',
  standalone: true,
  imports: [CommonModule, ResourceManagerComponent],
  templateUrl: './service-requests.component.html',
  styleUrl: './service-requests.component.css'
})
export class ServiceRequestsComponent {
  config: ResourceConfig = {
    title: 'Service Requests',
    description: 'Track guest and room requests from intake through completion.',
    endpoint: 'service-requests',
    createLabel: 'New Request',
    emptyLabel: 'Service Request',
    fields: [
      { key: 'roomNumber', label: 'Room Number', required: true },
      { key: 'guestName', label: 'Guest Name', required: true },
      { key: 'type', label: 'Request Type', required: true },
      { key: 'priority', label: 'Priority', type: 'select', options: ['low', 'normal', 'high', 'urgent'] },
      { key: 'assignedTo', label: 'Assigned To' },
      { key: 'notes', label: 'Notes', type: 'textarea' },
      { key: 'status', label: 'Status', type: 'select', options: ['open', 'in-progress', 'completed', 'cancelled'] }
    ],
    columns: [
      { key: 'roomNumber', label: 'Room' },
      { key: 'guestName', label: 'Guest' },
      { key: 'type', label: 'Type' },
      { key: 'priority', label: 'Priority', type: 'badge' },
      { key: 'assignedTo', label: 'Assigned To' },
      { key: 'status', label: 'Status', type: 'badge' }
    ],
    summaries: [
      { label: 'Open', value: (records) => records.filter((record) => record['status'] === 'open').length },
      { label: 'In Progress', value: (records) => records.filter((record) => record['status'] === 'in-progress').length },
      { label: 'Urgent', value: (records) => records.filter((record) => record['priority'] === 'urgent').length },
      { label: 'Completed', value: (records) => records.filter((record) => record['status'] === 'completed').length }
    ]
  };
}
