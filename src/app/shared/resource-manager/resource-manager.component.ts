import { CommonModule, CurrencyPipe, DatePipe, TitleCasePipe } from '@angular/common';
import { ChangeDetectorRef, Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize, timeout } from 'rxjs';
import { ResourceRecord, ResourceService } from '@core/services/resource.service';
import { AuthService } from '@core/services/auth.service';

export interface SelectOption {
  label: string;
  value: string | number | null | undefined;
}

export type ResourceField = {
  key: string;
  label: string;
  type?: 'text' | 'number' | 'date' | 'select' | 'textarea';
  required?: boolean;
  options?: (string | SelectOption)[];
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
  standalone: true,
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

  /**
   * 🟢 TYPE GUARD HELPER: Used in HTML to safely filter string lists vs select option data structures
   */
  isSelectOption(option: any): option is { label: string; value: any } {
    return option !== null && typeof option === 'object' && 'label' in option;
  }

  getOptionValue(option: string | SelectOption): string | number {
    if (this.isSelectOption(option)) {
      return option.value !== null && option.value !== undefined ? String(option.value) : '';
    }
    return option;
  }

  getOptionLabel(option: string | SelectOption): string {
    return this.isSelectOption(option) ? option.label : option;
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
      next: (res: any) => {
        // 🟢 FIXED: Extract the array from res.data if it exists, otherwise fall back to raw res
        this.records = res && res.data ? res.data : (Array.isArray(res) ? res : []);
        this.errorMessage = '';
        this.cdr.detectChanges();
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

    this.form = this.config.fields.reduce((acc, field) => {
      let value = record[field.key];

      // Handle unassigned relationship elements safely
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        const obj = value as Record<string, any>;
        value = obj['_id'] ?? obj['id'] ?? value;
      }

      const finalValue = value ?? this.defaultValue(field);

      acc[field.key] = field.type === 'date' && finalValue
        ? String(finalValue).slice(0, 10)
        : finalValue;

      return acc;
    }, {} as ResourceRecord);

    this.showForm = true;
  }
  // Inside ResourceManagerComponent class
  searchTerm = '';

  // 🟢 NEW: Computed getter for filtered records
  get filteredRecords(): ResourceRecord[] {
    if (!this.searchTerm.trim()) return this.records;

    const term = this.searchTerm.toLowerCase();
    return this.records.filter(record =>
      Object.values(record).some(val =>
        String(val).toLowerCase().includes(term)
      )
    );
  }

  // 1. Triggered by the table button
  deleteRecord(record: ResourceRecord) {
    console.log("Delete triggered for:", record._id); // 🟢 Does this log appear?
    this.recordPendingDelete = record;
  }

  // 2. Triggered by "Yes, Delete" in the modal
  confirmDelete() {
    if (!this.recordPendingDelete?._id || this.isDeleting) return;

    this.isDeleting = true;
    this.resourceService.delete(this.config.endpoint, this.recordPendingDelete._id)
      .pipe(finalize(() => { this.isDeleting = false; }))
      .subscribe({
        next: () => {
          this.recordPendingDelete = null; // Close modal
          this.loadRecords();             // Refresh table
        },
        error: (err) => console.error("API Delete failed:", err)
      });
  }

  // 3. Triggered by "Cancel"
  cancelDelete() {
    this.recordPendingDelete = null;
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
    if (field.type === 'number') {
      return 0;
    }
    if (field.type === 'select') {
      const first = field.options?.[0];
      if (!first) return '';
      return typeof first === 'string' ? first : first.value;
    }
    return '';
  }

  /**
   * 🟢 FIXED: Safe Payload Assembler
   */
  private buildPayload(): ResourceRecord {
    return this.config.fields.reduce((payload, field) => {
      let value = this.form[field.key];
      // 🟢 NEW: Extract _id if the field is a selected object (e.g., from a dropdown)
      if (value && typeof value === 'object' && value.hasOwnProperty('_id')) {
        value = value['_id'];
      }

      if (value === '' || value === undefined) {
        value = null;
      }

      if (field.type === 'number') {
        // Fall back explicitly to 0 instead of dropping out fields entirely
        payload[field.key] = (value !== null && value !== undefined) ? Number(value) : 0;
      } else if (field.type === 'date') {
        if (value) payload[field.key] = value;
      } else if (typeof value === 'string') {
        payload[field.key] = value.trim();
      } else {
        payload[field.key] = value;
      }

      return payload;
    }, {} as ResourceRecord);
  }

  /**
   * 🟢 FIXED: Nested Dot-Notation Extraction Engine
   */
  valueFor(record: ResourceRecord, column: ResourceColumn): any {
    if (!record) return '';

    let value: any;

    // Check if the column configuration specifies a path containing dot notation (e.g., managerId.fullName)
    if (column.key.includes('.')) {
      value = column.key.split('.').reduce((acc: any, part: string) => {
        return acc && acc[part] !== undefined ? acc[part] : null;
      }, record);
    } else {
      value = record[column.key];
    }

    // Unravel standalone populated object models if they fall back to objects inside primitive layouts
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      const obj = value as Record<string, any>;
      return (
        obj['name'] ??
        obj['fullName'] ??
        obj['roomNumber'] ??
        obj['title'] ??
        obj['label'] ??
        obj['number'] ??
        obj['email'] ??
        obj['_id'] ??
        ''
      );
    }

    return value ?? '';
  }

  badgeClass(value: unknown) {
    const normalized = String(value).toLowerCase();
    if (['active', 'success', 'paid', 'received', 'completed', 'delivered', 'in-stock', 'on-duty'].includes(normalized)) return 'success';
    if (['failed', 'cancelled', 'inactive', 'out-of-stock', 'on-leave', 'leave', 'terminated', 'urgent'].includes(normalized)) return 'danger';
    return 'pending';
  }

  primaryValue(record: ResourceRecord): string {
    const firstColumn = this.config.columns[0];
    return String(this.valueFor(record, firstColumn) || this.config.emptyLabel);
  }
}