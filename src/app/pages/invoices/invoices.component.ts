import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize, timeout } from 'rxjs';
import { AuthService } from '@core/services/auth.service';
import { ROLES } from '@core/services/role.service';
import { InvoiceService } from '@core/services/invoice.service';
import { Invoice, InvoiceStatus } from '@core/models/invoice.model';

@Component({
  selector: 'app-invoices',
  imports: [CommonModule, CurrencyPipe, DatePipe, RouterLink, FormsModule],
  templateUrl: './invoices.component.html',
  styleUrl: './invoices.component.css'
})
export class InvoicesComponent implements OnInit, OnDestroy {
  invoices: Invoice[] = [];
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  statusFilter = 'all';
  selectedInvoice: Invoice | null = null;
  invoicePendingDelete: Invoice | null = null;
  isUpdating = false;
  isDeleting = false;
  private refreshTimer?: ReturnType<typeof setInterval>;

  constructor(
    private invoiceService: InvoiceService,
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.loadInvoices();
    this.refreshTimer = setInterval(() => this.autoRefresh(), 15000);
  }

  ngOnDestroy() {
    clearInterval(this.refreshTimer);
  }

  loadInvoices(silent = false) {
    if (!silent) {
      this.isLoading = true;
      this.errorMessage = '';
      this.cdr.detectChanges();
    }

    const filters = this.statusFilter !== 'all'
      ? { status: this.statusFilter as InvoiceStatus }
      : {};

    this.invoiceService.getAllInvoices(filters).pipe(
      timeout(10000),
      finalize(() => {
        this.isLoading = false;
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: (invoices) => {
        this.invoices = invoices;
      },
      error: (err) => {
        if (err.status === 401) {
          this.authService.logout();
          this.router.navigate(['/login'], { queryParams: { returnUrl: '/invoices' } });
          return;
        }
        if (!silent) {
          this.errorMessage = err.name === 'TimeoutError'
            ? 'Invoice data timed out. Check that the backend and MongoDB are running, then refresh.'
            : err.error?.message || 'Failed to load invoices';
        }
      }
    });
  }

  private autoRefresh() {
    if (this.isLoading) return;
    this.loadInvoices(true);
  }

  onStatusFilterChange() {
    this.loadInvoices();
  }

  markAsPaid(invoiceId: string) {
    if (!this.canManageInvoices || this.isUpdating) return;

    this.isUpdating = true;
    this.invoiceService.updateStatus(invoiceId, {
      status: 'paid',
      paymentDate: new Date().toISOString()
    }).pipe(
      timeout(10000),
      finalize(() => { this.isUpdating = false; })
    ).subscribe({
      next: (updated) => {
        const index = this.invoices.findIndex(inv => inv._id === invoiceId);
        if (index > -1) this.invoices[index] = updated;
        this.successMessage = 'Invoice marked as paid';
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Failed to update invoice';
      }
    });
  }

  markAsIssued(invoiceId: string) {
    if (!this.canManageInvoices || this.isUpdating) return;

    this.isUpdating = true;
    this.invoiceService.updateStatus(invoiceId, { status: 'issued' }).pipe(
      timeout(10000),
      finalize(() => { this.isUpdating = false; })
    ).subscribe({
      next: (updated) => {
        const index = this.invoices.findIndex(inv => inv._id === invoiceId);
        if (index > -1) this.invoices[index] = updated;
        this.successMessage = 'Invoice issued successfully';
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Failed to update invoice';
      }
    });
  }

  deleteInvoice(invoiceId: string) {
    if (!this.canManageInvoices) return;
    this.invoicePendingDelete = this.invoices.find(inv => inv._id === invoiceId) || null;
  }

  cancelDeleteInvoice() {
    if (this.isDeleting) return;
    this.invoicePendingDelete = null;
  }

  confirmDeleteInvoice() {
    if (!this.invoicePendingDelete || this.isDeleting) return;

    const invoiceId = this.invoicePendingDelete._id;
    this.isDeleting = true;

    this.invoiceService.delete(invoiceId).pipe(
      timeout(10000),
      finalize(() => { this.isDeleting = false; })
    ).subscribe({
      next: () => {
        this.invoices = this.invoices.filter(inv => inv._id !== invoiceId);
        this.invoicePendingDelete = null;
        this.successMessage = 'Invoice deleted successfully';
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Failed to delete invoice';
      }
    });
  }

  viewInvoice(invoice: Invoice) { this.selectedInvoice = invoice; }
  closeInvoicePreview() { this.selectedInvoice = null; }
  printInvoice() { window.print(); }

  getStatusBadgeClass(status: InvoiceStatus): string {
    const statusMap: Record<InvoiceStatus, string> = {
      'draft': 'badge-info',
      'issued': 'badge-warning',
      'unpaid': 'badge-warning',
      'paid': 'badge-success',
      'cancelled': 'badge-danger',
      'void': 'badge-danger'
    };
    return statusMap[status] ?? 'badge-default';
  }

  getTotalAmount() { return this.invoices.reduce((sum, inv) => sum + inv.totalAmount, 0); }
  getTotalPaid() { return this.invoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + inv.totalAmount, 0); }

  get canManageInvoices() { return this.authService.isRole([ROLES.SUPER_ADMIN, ROLES.ACCOUNT]); }
}