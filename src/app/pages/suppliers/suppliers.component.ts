import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ResourceConfig, ResourceManagerComponent } from '../../shared/resource-manager/resource-manager.component';

@Component({
  selector: 'app-suppliers',
  standalone: true,
  imports: [CommonModule, ResourceManagerComponent],
  templateUrl: './suppliers.component.html',
  styleUrl: './suppliers.component.css'
})
export class SuppliersComponent {
  config: ResourceConfig = {
    title: 'Suppliers',
    description: 'Manage vendor contacts, purchasing categories, and supplier availability.',
    endpoint: 'suppliers',
    createLabel: 'Add Supplier',
    emptyLabel: 'Supplier',
    fields: [
      { key: 'name', label: 'Supplier Name', required: true },
      { key: 'contactName', label: 'Contact Name' },
      { key: 'phone', label: 'Phone' },
      { key: 'email', label: 'Email' },
      { key: 'category', label: 'Category' },
      { key: 'status', label: 'Status', type: 'select', options: ['active', 'paused', 'inactive'] }
    ],
    columns: [
      { key: 'name', label: 'Supplier' },
      { key: 'contactName', label: 'Contact' },
      { key: 'phone', label: 'Phone' },
      { key: 'category', label: 'Category' },
      { key: 'status', label: 'Status', type: 'badge' }
    ],
    summaries: [
      { label: 'Total Suppliers', value: (records) => records.length },
      { label: 'Active', value: (records) => records.filter((record) => record['status'] === 'active').length },
      { label: 'Paused', value: (records) => records.filter((record) => record['status'] === 'paused').length },
      { label: 'Categories', value: (records) => new Set(records.map((record) => record['category']).filter(Boolean)).size }
    ]
  };
}
