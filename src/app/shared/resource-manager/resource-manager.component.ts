import { CommonModule, CurrencyPipe, DatePipe, TitleCasePipe } from '@angular/common';
import { ChangeDetectorRef, Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize, timeout } from 'rxjs';
import { ResourceRecord, ResourceService } from '@core/services/resource.service';
import { AuthService } from '@core/services/auth.service';

export type ResourceField = {
  key: string;
  label: string;
  type?: 'text' | 'number' | 'date' | 'select' | 'textarea';
  required?: boolean;
  options?: string[];
  onFieldChange?: (value: string, form: ResourceRecord) => Partial<ResourceRecord>;
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
  isDeleting = false;
  recordPendingDelete: ResourceRecord | null = null;
  errorMessage = '';
  private refreshTimer?: ReturnType<typeof setInterval>;

  constructor(
    private resourceService: ResourceService,
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.resetForm();
    this.loadRecords();
    this.refreshTimer = setInterval(() => this.autoRefresh(), 15000);
  }

  ngOnDestroy() {
    clearInterval(this.refreshTimer);
  }

  loadRecords(silent = false) {
    if (!silent) {
      this.isLoading = true;
      this.errorMessage = '';
      this.cdr.detectChanges();
    }

    this.resourceService.list(this.config.endpoint).pipe(
      timeout(10000),
      finalize(() => {
        this.isLoading = false;
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: (records) => {
        this.records = records;
        this.errorMessage = '';
      },
      error: (err) => {
        if (err.status === 401) {
          this.authService.logout();
          this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
          return;
        }
        if (!silent) {
          this.errorMessage = err.name === 'TimeoutError'
            ? `${this.config.title} data timed out. Check that the backend and MongoDB are running, then refresh.`
            : err.error?.message || `Unable to load ${this.config.title.toLowerCase()}`;
        }
      }
    });
  }
  onFieldChange(field: ResourceField, value: string) {
    if (field.onFieldChange) {
      const updates = field.onFieldChange(value, this.form);
      Object.assign(this.form, updates);
      this.cdr.detectChanges();
    }
  }
  private autoRefresh() {
    if (this.showForm || this.isSaving || this.isLoading) return;
    this.loadRecords(true);
  }

  saveRecord(form: NgForm) {
    if (form.invalid || this.isSaving) {
      form.control.markAllAsTouched();
      return;
    }

    this.isSaving = true;
    this.errorMessage = '';
    const payload = this.buildPayload();

    const request = this.selectedId
      ? this.resourceService.update(this.config.endpoint, this.selectedId, payload)
      : this.resourceService.create(this.config.endpoint, payload);

    request.pipe(
      timeout(15000),
      finalize(() => {
        this.isSaving = false;
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: () => {
        this.showForm = false;
        this.resetForm();
        this.loadRecords();
      },
      error: (err) => {
        if (err.status === 401) {
          this.authService.logout();
          this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
          return;
        }
        this.errorMessage = err.name === 'TimeoutError'
          ? `${this.config.emptyLabel} save timed out. Check that the backend and MongoDB are running, then try again.`
          : err.error?.message || `Unable to save ${this.config.title.toLowerCase()}`;
      }
    });
  }

  editRecord(record: ResourceRecord) {
    this.selectedId = record._id || null;
    this.form = this.config.fields.reduce<ResourceRecord>((acc, field) => {
      const value = record[field.key] ?? this.defaultValue(field);
      acc[field.key] = field.type === 'date' && value ? String(value).slice(0, 10) : value;
      return acc;
    }, {});
    this.showForm = true;
  }

  deleteRecord(record: ResourceRecord) {
    if (!record._id) return;
    this.recordPendingDelete = record;
  }

  cancelDelete() {
    if (this.isDeleting) return;
    this.recordPendingDelete = null;
  }

  confirmDelete() {
    if (!this.recordPendingDelete?._id || this.isDeleting) return;

    this.isDeleting = true;
    this.errorMessage = '';

    this.resourceService.delete(this.config.endpoint, this.recordPendingDelete._id).pipe(
      timeout(15000),
      finalize(() => {
        this.isDeleting = false;
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: () => {
        this.recordPendingDelete = null;
        this.loadRecords();
      },
      error: (err) => {
        if (err.status === 401) {
          this.authService.logout();
          this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
          return;
        }
        this.errorMessage = err.name === 'TimeoutError'
          ? `${this.config.emptyLabel} delete timed out. Check that the backend and MongoDB are running, then try again.`
          : err.error?.message || `Unable to delete ${this.config.title.toLowerCase()}`;
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

  private buildPayload() {
    return this.config.fields.reduce<ResourceRecord>((payload, field) => {
      const value = this.form[field.key];
      if (field.type === 'number') {
        payload[field.key] = Number(value || 0);
      } else if (field.type === 'date') {
        if (value) payload[field.key] = value;
      } else if (typeof value === 'string') {
        payload[field.key] = value.trim();
      } else {
        payload[field.key] = value;
      }
      return payload;
    }, {});
  }

  valueFor(record: ResourceRecord, column: ResourceColumn) { return record[column.key] ?? ''; }

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