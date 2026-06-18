import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize, timeout } from 'rxjs';
import { API_BASE_URL } from '../../core/api.config';
import { AuthService } from '../../core/services/auth.service';
import { ResourceRecord, ResourceService } from '../../core/services/resource.service';

type InventoryCategory =
  | 'f&b'
  | 'linen-textiles'
  | 'guest-amenities'
  | 'maintenance-repaired'
  | 'cleaning-janitorial'
  | 'office-it';

type InventoryStatus = 'in-stock' | 'low-stock' | 'out-of-stock';

type InventoryItem = ResourceRecord & {
  name: string;
  sku?: string;
  category: InventoryCategory;
  quantity: number;
  reorderLevel: number;
  unitCost: number;
  supplier?: string;
  status: InventoryStatus;
  updatedAt?: string;
};

type InventoryForm = {
  name: string;
  sku: string;
  category: InventoryCategory;
  quantity: number;
  reorderLevel: number;
  unitCost: number;
  supplier: string;
};

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './inventory.component.html',
  styleUrl: './inventory.component.css'
})
export class InventoryComponent implements OnInit, OnDestroy {
  items: InventoryItem[] = [];
  form: InventoryForm = this.emptyForm();
  selectedId = '';
  isLoading = false;
  isSaving = false;
  isDeleting = false;
  deletingItem: InventoryItem | null = null;
  errorMessage = '';
  successMessage = '';
  private refreshTimer?: ReturnType<typeof setInterval>;

  readonly categories: InventoryCategory[] = [
    'f&b',
    'linen-textiles',
    'guest-amenities',
    'maintenance-repaired',
    'cleaning-janitorial',
    'office-it'
  ];

  constructor(
    private http: HttpClient,
    private resourceService: ResourceService,
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadItems();
    this.refreshTimer = setInterval(() => this.autoRefresh(), 15000);
  }

  ngOnDestroy() {
    if (this.refreshTimer) clearInterval(this.refreshTimer);
  }

  loadItems(silent = false) {
    if (!silent) {
      this.isLoading = true;
      this.errorMessage = '';
      this.cdr.detectChanges();
    }

    this.resourceService.list<InventoryItem>('inventory').pipe(
      timeout(10000),
      finalize(() => {
        this.isLoading = false;
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: (res) => {
        this.items = Array.isArray(res.data) ? res.data : [];
        this.errorMessage = '';
      },
      error: (err) => this.handleError(err, 'Unable to load inventory')
    });
  }

  private autoRefresh() {
    if (this.isSaving || this.isLoading || this.selectedId) return;
    this.loadItems(true);
  }

  saveItem(form: NgForm) {
    if (form.invalid || this.isSaving) {
      form.control.markAllAsTouched();
      this.errorMessage = 'Complete the required inventory fields';
      return;
    }

    this.isSaving = true;
    this.errorMessage = '';
    this.successMessage = '';

    const payload = this.buildPayload();
    const request = this.selectedId
      ? this.http.put(`${API_BASE_URL}/inventory/${this.selectedId}`, payload)
      : this.resourceService.create<InventoryItem>('inventory', payload as InventoryItem);

    request.pipe(
      timeout(15000),
      finalize(() => {
        this.isSaving = false;
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: () => {
        this.successMessage = this.selectedId ? 'Inventory item updated' : 'Inventory item added';
        this.resetForm();
        this.loadItems();
      },
      error: (err) => this.handleError(err, 'Unable to save inventory item')
    });
  }

  editItem(item: InventoryItem) {
    this.selectedId = item._id || '';
    this.form = {
      name: item.name || '',
      sku: item.sku || '',
      category: item.category || 'guest-amenities',
      quantity: Number(item.quantity || 0),
      reorderLevel: Number(item.reorderLevel ?? 5),
      unitCost: Number(item.unitCost || 0),
      supplier: item.supplier || ''
    };
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  requestDelete(item: InventoryItem) {
    this.deletingItem = item;
  }

  cancelDelete() {
    if (this.isDeleting) return;
    this.deletingItem = null;
  }

  confirmDelete() {
    if (!this.deletingItem?._id || this.isDeleting) return;

    this.isDeleting = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.resourceService.delete('inventory', this.deletingItem._id).pipe(
      timeout(15000),
      finalize(() => {
        this.isDeleting = false;
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: () => {
        this.successMessage = 'Inventory item deleted';
        this.deletingItem = null;
        this.loadItems();
      },
      error: (err) => this.handleError(err, 'Unable to delete inventory item')
    });
  }

  resetForm() {
    this.selectedId = '';
    this.form = this.emptyForm();
  }

  categoryLabel(category: string) {
    if (category === 'f&b') return 'F&B';
    return category.replace(/-/g, ' ');
  }

  stockPercent(item: InventoryItem) {
    const base = Math.max(Number(item.reorderLevel || 0) * 2, Number(item.quantity || 0), 1);
    return Math.min(100, Math.round((Number(item.quantity || 0) / base) * 100));
  }

  get sortedItems() {
    const statusRank: Record<InventoryStatus, number> = {
      'out-of-stock': 1,
      'low-stock': 2,
      'in-stock': 3
    };

    return [...this.items].sort((a, b) => {
      const statusDiff = statusRank[a.status] - statusRank[b.status];
      if (statusDiff !== 0) return statusDiff;
      return a.name.localeCompare(b.name);
    });
  }

  get totalItems() {
    return this.items.length;
  }

  get lowStockCount() {
    return this.items.filter((item) => item.status === 'low-stock').length;
  }

  get outOfStockCount() {
    return this.items.filter((item) => item.status === 'out-of-stock').length;
  }

  get stockValue() {
    return this.items.reduce((sum, item) => sum + Number(item.quantity || 0) * Number(item.unitCost || 0), 0);
  }

  private buildPayload() {
    return {
      name: this.form.name.trim(),
      sku: this.form.sku.trim(),
      category: this.form.category,
      quantity: Number(this.form.quantity || 0),
      reorderLevel: Number(this.form.reorderLevel || 0),
      unitCost: Number(this.form.unitCost || 0),
      supplier: this.form.supplier.trim()
    };
  }

  private emptyForm(): InventoryForm {
    return {
      name: '',
      sku: '',
      category: 'guest-amenities',
      quantity: 0,
      reorderLevel: 5,
      unitCost: 0,
      supplier: ''
    };
  }

  private handleError(err: any, fallbackMessage: string) {
    if (err.status === 401) {
      this.authService.logout();
      this.router.navigate(['/login'], { queryParams: { returnUrl: '/inventory' } });
      return;
    }

    this.errorMessage = err.name === 'TimeoutError'
      ? 'Inventory request timed out. Check that the backend and MongoDB are running, then try again.'
      : err.error?.message || fallbackMessage;
  }
}
