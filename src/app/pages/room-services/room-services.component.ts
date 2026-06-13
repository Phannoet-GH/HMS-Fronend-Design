import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ResourceConfig, ResourceManagerComponent } from '../../shared/resource-manager/resource-manager.component';

@Component({
  selector: 'app-room-services',
  standalone: true,
  imports: [CommonModule, ResourceManagerComponent],
  templateUrl: './room-services.component.html',
  styleUrl: './room-services.component.css'
})
export class RoomServicesComponent {
  config: ResourceConfig = {
    title: 'Room Services',
    description: 'Manage in-room dining and amenity delivery orders.',
    endpoint: 'room-services',
    createLabel: 'New Order',
    emptyLabel: 'Room Service Order',
    fields: [
      { key: 'roomNumber', label: 'Room Number', required: true },
      { key: 'guestName', label: 'Guest Name', required: true },
      { key: 'items', label: 'Items', type: 'textarea', required: true },
      { key: 'totalAmount', label: 'Total Amount', type: 'number', required: true },
      { key: 'status', label: 'Status', type: 'select', options: ['requested', 'preparing', 'delivered', 'cancelled'] },
      { key: 'notes', label: 'Notes', type: 'textarea' }
    ],
    columns: [
      { key: 'roomNumber', label: 'Room' },
      { key: 'guestName', label: 'Guest' },
      { key: 'items', label: 'Items' },
      { key: 'totalAmount', label: 'Amount', type: 'currency' },
      { key: 'requestedAt', label: 'Requested', type: 'date' },
      { key: 'status', label: 'Status', type: 'badge' }
    ],
    summaries: [
      { label: 'Orders', value: (records) => records.length },
      { label: 'Preparing', value: (records) => records.filter((record) => record['status'] === 'preparing').length },
      { label: 'Delivered', value: (records) => records.filter((record) => record['status'] === 'delivered').length },
      { label: 'Revenue', value: (records) => `$${records.reduce((sum, record) => sum + Number(record['totalAmount'] || 0), 0).toLocaleString()}` }
    ]
  };
}
