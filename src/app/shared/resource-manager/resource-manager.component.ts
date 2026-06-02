import { CommonModule, CurrencyPipe, DatePipe, TitleCasePipe } from '@angular/common';
import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ResourceRecord, ResourceService } from '../../core/services/resource.service';

export type ResourceField = {
  key: string;
  label: string;
  type?: 'text' | 'number' | 'date' | 'select' | 'textarea';
  required?: boolean;
  options?: string[];
};

export type ResourceColumn = {
  key: string;
  label: string;
  type?: 'text' | 'number' | 'currency' | 'date' | 'badge';
};

export type ResourceSummary = {
  label: string;
  value: (records: ResourceRecord[]) => string | number;
};

export type ResourceConfig = {
  title: string;
  description: string;
  endpoint: string;
  createLabel: string;
  emptyLabel: string;
  fields: ResourceField[];
  columns: ResourceColumn[];
  summaries: ResourceSummary[];
};

@Component({
  selector: 'app-resource-manager',
  imports: [CommonModule, CurrencyPipe, DatePipe, FormsModule, TitleCasePipe],
  templateUrl: './resource-manager.component.html',
  styleUrl: './resource-manager.component.css'
})
export class ResourceManagerComponent implements OnInit, OnDestroy {
  @Input({ required: true }) config!: ResourceConfig;

  records: ResourceRecord[] = [];
  form: ResourceRecord = {};
  selectedId: string | null = null;
  showForm = false;
  isLoading = false;
  isSaving = false;
  errorMessage = '';
  private refreshTimer?: ReturnType<typeof setInterval>;

  constructor(private resourceService: ResourceService) {}

  ngOnInit() {
    this.resetForm();
    this.loadRecords();
    this.refreshTimer = setInterval(() => this.autoRefresh(), 15000);
  }

  ngOnDestroy() {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
    }
  }

  loadRecords(silent = false) {
    if (!silent) {
      this.isLoading = true;
      this.errorMessage = '';
    }

    this.resourceService.list(this.config.endpoint).subscribe({
      next: (res) => {
        this.records = res.data;
        this.isLoading = false;
      },
      error: (err) => {
        this.errorMessage = err.error?.message || `Unable to load ${this.config.title.toLowerCase()}`;
        this.isLoading = false;
      }
    });
  }

  private autoRefresh() {
    if (this.showForm || this.isSaving || this.isLoading) return;
    this.loadRecords(true);
  }

  saveRecord() {
    this.isSaving = true;
    this.errorMessage = '';

    const request = this.selectedId
      ? this.resourceService.update(this.config.endpoint, this.selectedId, this.form)
      : this.resourceService.create(this.config.endpoint, this.form);

    request.subscribe({
      next: () => {
        this.isSaving = false;
        this.showForm = false;
        this.resetForm();
        this.loadRecords();
      },
      error: (err) => {
        this.errorMessage = err.error?.message || `Unable to save ${this.config.title.toLowerCase()}`;
        this.isSaving = false;
      }
    });
  }

  editRecord(record: ResourceRecord) {
    this.selectedId = record._id || null;
    this.form = this.config.fields.reduce<ResourceRecord>((acc, field) => {
      acc[field.key] = record[field.key] ?? this.defaultValue(field);
      return acc;
    }, {});
    this.showForm = true;
  }

  deleteRecord(record: ResourceRecord) {
    if (!record._id || !confirm(`Delete ${this.primaryValue(record)}?`)) return;

    this.resourceService.delete(this.config.endpoint, record._id).subscribe({
      next: () => this.loadRecords(),
      error: (err) => {
        this.errorMessage = err.error?.message || `Unable to delete ${this.config.title.toLowerCase()}`;
      }
    });
  }

  toggleForm() {
    this.showForm = !this.showForm;
    if (!this.showForm) this.resetForm();
  }

  resetForm() {
    this.selectedId = null;
    this.form = this.config.fields.reduce<ResourceRecord>((acc, field) => {
      acc[field.key] = this.defaultValue(field);
      return acc;
    }, {});
  }

  defaultValue(field: ResourceField) {
    if (field.type === 'number') return 0;
    if (field.type === 'select') return field.options?.[0] || '';
    return '';
  }

  valueFor(record: ResourceRecord, column: ResourceColumn) {
    return record[column.key] ?? '';
  }

  badgeClass(value: unknown) {
    const normalized = String(value).toLowerCase();
    if (['active', 'success', 'paid', 'received', 'completed', 'delivered', 'in-stock', 'on-duty'].includes(normalized)) return 'success';
    if (['failed', 'cancelled', 'inactive', 'out-of-stock', 'leave', 'urgent'].includes(normalized)) return 'danger';
    return 'pending';
  }

  primaryValue(record: ResourceRecord) {
    const firstColumn = this.config.columns[0];
    return String(record[firstColumn.key] || this.config.emptyLabel);
  }
}
