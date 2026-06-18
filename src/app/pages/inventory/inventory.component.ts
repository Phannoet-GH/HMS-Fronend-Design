import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ResourceConfig, ResourceManagerComponent } from '../../shared/resource-manager/resource-manager.component';

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [CommonModule, ResourceManagerComponent],
  templateUrl: './inventory.component.html',
  styleUrl: './inventory.component.css'
})
export class InventoryComponent {
  config: ResourceConfig = {
    title: 'Inventory',
    description: 'Monitor hotel supplies, stock levels, reorder points, and usage.',
    endpoint: 'inventory',
    createLabel: 'Add Item',
    emptyLabel: 'Inventory Item',

    fields: [
      {
        key: 'name',
        label: 'Item Name',
        required: true
      },
      {
        key: 'sku',
        label: 'SKU'
      },
      {
        key: 'category',
        label: 'Category',
        required: true,
        type: 'select',
        options: [
          'f&b',
          'linen-textiles',
          'guest-amenities',
          'maintenance-repaired',
          'cleaning-janitorial',
          'office-it'
        ]
      },
      {
        key: 'quantity',
        label: 'Quantity',
        type: 'number',
        required: true
      },
      {
        key: 'reorderLevel',
        label: 'Reorder Level',
        type: 'number'
      },
      {
        key: 'unitCost',
        label: 'Unit Cost',
        type: 'number'
      },
      {
        key: 'supplierId',
        label: 'Supplier'
      },
      {
        key: 'status',
        label: 'Status',
        type: 'select',
        options: ['in-stock', 'low-stock', 'out-of-stock']
      }
    ],

    columns: [
      { key: 'name', label: 'Item' },
      { key: 'sku', label: 'SKU' },
      { key: 'category', label: 'Category' },
      { key: 'quantity', label: 'On Hand', type: 'number' },
      { key: 'reorderLevel', label: 'Reorder At', type: 'number' },
      { key: 'unitCost', label: 'Unit Cost', type: 'currency' },
      { key: 'status', label: 'Status', type: 'badge' }
    ],

    summaries: [
      {
        label: 'Total Items',
        value: items => items.length
      },
      {
        label: 'Low Stock',
        value: items =>
          items.filter(item => item['status'] === 'low-stock').length
      },
      {
        label: 'Out of Stock',
        value: items =>
          items.filter(item => item['status'] === 'out-of-stock').length
      },
      {
        label: 'Stock Value',
        value: items =>
          `$${items
            .reduce(
              (sum, item) =>
                sum +
                Number(item['quantity'] || 0) *
                Number(item['unitCost'] || 0),
              0
            )
            .toLocaleString()}`
      }
    ]
  };
}
