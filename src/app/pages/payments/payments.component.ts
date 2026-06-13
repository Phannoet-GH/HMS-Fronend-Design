import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { finalize, timeout } from 'rxjs';
import { AuthService } from '@core/services/auth.service';
import { InvoiceService } from '@core/services/invoice.service';
import { Invoice } from '@core/models/invoice.model';

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
  ) { }

  ngOnInit() {
    this.loadPayments();
    this.refreshTimer = setInterval(() => this.autoRefresh(), 15000);
  }

  ngOnDestroy() {
    clearInterval(this.refreshTimer);
  }

  loadPayments(silent = false) {
    if (!silent) {
      this.isLoading = true;
      this.errorMessage = '';
      this.cdr.detectChanges();
    }

    this.invoiceService.getAllInvoices({ limit: 100 }).pipe(
      timeout(10000),
      finalize(() => {
        this.isLoading = false;
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: (invoices) => {
        this.invoices = invoices;
        this.errorMessage = '';
      },
      error: (err) => {
        if (err.status === 401) {
          this.authService.logout();
          this.router.navigate(['/login'], { queryParams: { returnUrl: '/payments' } });
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

    this.invoiceService.updateStatus(invoice._id, {
      status: 'paid',
      paymentDate: new Date().toISOString(),
      paymentMethod: invoice.paymentMethod || 'Cash'
    }).pipe(
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
          this.router.navigate(['/login'], { queryParams: { returnUrl: '/payments' } });
          return;
        }
        this.errorMessage = err.name === 'TimeoutError'
          ? 'Payment update timed out. Check that the backend and MongoDB are running, then try again.'
          : err.error?.message || 'Unable to update payment';
      }
    });
  }

  get paidInvoices() { return this.invoices.filter(inv => inv.status === 'paid'); }
  get pendingInvoices() { return this.invoices.filter(inv => !['paid', 'cancelled', 'void'].includes(inv.status)); }
  get totalCollected() { return this.paidInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0); }
  get totalPending() { return this.pendingInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0); }

  canMarkPaid(invoice: Invoice) {
    return !['paid', 'cancelled', 'void'].includes(invoice.status);
  }

  guestName(invoice: Invoice) {
    return invoice.guest?.fullName || 'Guest unavailable';
  }

  statusClass(invoice: Invoice) {
    const inactive = invoice.status === 'cancelled' || invoice.status === 'void';
    const active = invoice.status === 'paid';
    return {
      success: active,
      danger: inactive,
      pending: !active && !inactive
    };
  }
}