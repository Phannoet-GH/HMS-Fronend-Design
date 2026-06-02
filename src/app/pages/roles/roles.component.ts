import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ResourceConfig, ResourceManagerComponent } from '../../shared/resource-manager/resource-manager.component';

@Component({
  selector: 'app-roles',
  standalone: true,
  imports: [CommonModule, ResourceManagerComponent],
  templateUrl: './roles.component.html',
  styleUrl: './roles.component.css'
})
export class RolesComponent {
  config: ResourceConfig = {
    title: 'Roles & Permissions',
    description: 'Review role capabilities and keep access aligned with operations.',
    endpoint: 'roles',
    createLabel: 'Create Role',
    emptyLabel: 'Role',
    fields: [
      { key: 'roleId', label: 'Role ID', required: true },
      { key: 'name', label: 'Role Name', required: true }
    ],
    columns: [
      { key: 'roleId', label: 'Role ID' },
      { key: 'name', label: 'Role Name' },
      { key: 'createdAt', label: 'Created', type: 'date' }
    ],
    summaries: [
      { label: 'Roles', value: (records) => records.length },
      { label: 'System Roles', value: (records) => records.filter((record) => String(record['roleId']).startsWith('r')).length },
      { label: 'Custom Roles', value: (records) => records.filter((record) => !String(record['roleId']).startsWith('r')).length },
      { label: 'Access Reviews', value: () => 0 }
    ]
  };
}
