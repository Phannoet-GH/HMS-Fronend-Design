import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ResourceConfig, ResourceManagerComponent } from '../../shared/resource-manager/resource-manager.component';

@Component({
  selector: 'app-purchase-orders',
  standalone: true,
  imports: [CommonModule, ResourceManagerComponent],
  templateUrl: './purchase-orders.component.html',
  styleUrl: './purchase-orders.component.css'
})
export class PurchaseOrdersComponent {
  config: ResourceConfig = {
    title: 'Purchase Orders',
    description: 'Track supplier orders, expected deliveries, and receiving status.',
    endpoint: 'purchase-orders',
    createLabel: 'New Order',
    emptyLabel: 'Purchase Order',
    fields: [
      { key: 'orderNumber', label: 'Order Number', required: true },
      { key: 'supplier', label: 'Supplier', required: true },
      { key: 'items', label: 'Items', type: 'textarea' },
      { key: 'totalAmount', label: 'Total Amount', type: 'number' },
      { key: 'expectedDate', label: 'Expected Date', type: 'date' },
      { key: 'status', label: 'Status', type: 'select', options: ['draft', 'ordered', 'received', 'cancelled'] }
    ],
    columns: [
      { key: 'orderNumber', label: 'Order' },
      { key: 'supplier', label: 'Supplier' },
      { key: 'totalAmount', label: 'Amount', type: 'currency' },
      { key: 'expectedDate', label: 'Expected', type: 'date' },
      { key: 'status', label: 'Status', type: 'badge' }
    ],
    summaries: [
      { label: 'Total Orders', value: (records) => records.length },
      { label: 'Ordered', value: (records) => records.filter((record) => record['status'] === 'ordered').length },
      { label: 'Received', value: (records) => records.filter((record) => record['status'] === 'received').length },
      { label: 'Order Value', value: (records) => `$${records.reduce((sum, record) => sum + Number(record['totalAmount'] || 0), 0).toLocaleString()}` }
    ]
  };
}
