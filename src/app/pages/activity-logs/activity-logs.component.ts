import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ResourceConfig, ResourceManagerComponent } from '../../shared/resource-manager/resource-manager.component';

@Component({
  selector: 'app-activity-logs',
  standalone: true,
  imports: [CommonModule, ResourceManagerComponent],
  templateUrl: './activity-logs.component.html',
  styleUrl: './activity-logs.component.css'
})
export class ActivityLogsComponent {
  config: ResourceConfig = {
    title: 'Activity Logs',
    description: 'Trace sensitive actions, authentication events, and system changes.',
    endpoint: 'activity-logs',
    createLabel: 'Add Log',
    emptyLabel: 'Activity Log',
    fields: [
      { key: 'actor', label: 'Actor', required: true },
      { key: 'action', label: 'Action', required: true },
      { key: 'module', label: 'Module', required: true },
      { key: 'details', label: 'Details', type: 'textarea' },
      { key: 'status', label: 'Status', type: 'select', options: ['success', 'warning', 'failed'] }
    ],
    columns: [
      { key: 'createdAt', label: 'Time', type: 'date' },
      { key: 'actor', label: 'Actor' },
      { key: 'action', label: 'Action' },
      { key: 'module', label: 'Module' },
      { key: 'status', label: 'Status', type: 'badge' }
    ],
    summaries: [
      { label: 'Events', value: (records) => records.length },
      { label: 'Warnings', value: (records) => records.filter((record) => record['status'] === 'warning').length },
      { label: 'Failures', value: (records) => records.filter((record) => record['status'] === 'failed').length },
      { label: 'Modules', value: (records) => new Set(records.map((record) => record['module']).filter(Boolean)).size }
    ]
  };
}
