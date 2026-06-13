import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { finalize, timeout } from 'rxjs';
import { Invoice, InvoiceService } from '../../core/services/invoice.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-payments',
  imports: [CommonModule],
  templateUrl: './payments.component.html',
  styleUrl: './payments.component.css'
})
export class PaymentsComponent implements OnInit, OnDestroy {
  invoices: Invoice[] = [];
  isLoading = false;
  updatingInvoiceId = '';
  errorMessage = '';
  successMessage = '';
  private refreshTimer?: ReturnType<typeof setInterval>;

  constructor(
    private invoiceService: InvoiceService,
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadPayments();
    this.refreshTimer = setInterval(() => this.autoRefresh(), 15000);
  }

  ngOnDestroy() {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
    }
  }

  loadPayments(silent = false) {
    if (!silent) {
      this.isLoading = true;
      this.errorMessage = '';
      this.cdr.detectChanges();
    }

    this.invoiceService.getInvoices({ limit: 100 }).pipe(
      timeout(10000),
      finalize(() => {
        this.isLoading = false;
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: (res) => {
        this.invoices = Array.isArray(res.data?.invoices) ? res.data.invoices : [];
        this.errorMessage = '';
      },
      error: (err) => {
        if (err.status === 401) {
          this.authService.logout();
          this.router.navigate(['/login'], {
            queryParams: { returnUrl: '/payments' }
          });
          return;
        }

        if (!silent) {
          this.errorMessage = err.name === 'TimeoutError'
            ? 'Payment data timed out. Check that the backend and MongoDB are running, then refresh.'
            : err.error?.message || 'Unable to load payments';
        }
      }
    });
  }

  private autoRefresh() {
    if (this.isLoading) return;
    this.loadPayments(true);
  }

  markPaid(invoice: Invoice) {
    if (this.updatingInvoiceId) return;

    this.updatingInvoiceId = invoice._id;
    this.errorMessage = '';
    this.successMessage = '';

    this.invoiceService.updateInvoiceStatus(
      invoice._id,
      'paid',
      new Date().toISOString(),
      invoice.paymentMethod || 'Cash'
    ).pipe(
      timeout(15000),
      finalize(() => {
        this.updatingInvoiceId = '';
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: () => {
        this.successMessage = 'Payment marked as paid';
        this.loadPayments();
      },
      error: (err) => {
        if (err.status === 401) {
          this.authService.logout();
          this.router.navigate(['/login'], {
            queryParams: { returnUrl: '/payments' }
          });
          return;
        }

        this.errorMessage = err.name === 'TimeoutError'
          ? 'Payment update timed out. Check that the backend and MongoDB are running, then try again.'
          : err.error?.message || 'Unable to update payment';
      }
    });
  }

  get paidInvoices() {
    return this.invoices.filter((invoice) => invoice.status === 'paid');
  }

  get pendingInvoices() {
    return this.invoices.filter((invoice) => !['paid', 'cancelled', 'void'].includes(invoice.status));
  }

  canMarkPaid(invoice: Invoice) {
    return !['paid', 'cancelled', 'void'].includes(invoice.status);
  }

  guestName(invoice: Invoice) {
    return (invoice as any).guest?.fullName || 'Guest unavailable';
  }

  statusClass(invoice: Invoice) {
    return {
      success: invoice.status === 'paid',
      danger: invoice.status === 'cancelled' || invoice.status === 'void',
      pending: invoice.status !== 'paid' && invoice.status !== 'cancelled' && invoice.status !== 'void'
    };
  }

  get totalCollected() {
    return this.paidInvoices.reduce((sum, invoice) => sum + invoice.totalAmount, 0);
  }

  get totalPending() {
    return this.pendingInvoices.reduce((sum, invoice) => sum + invoice.totalAmount, 0);
  }
}
