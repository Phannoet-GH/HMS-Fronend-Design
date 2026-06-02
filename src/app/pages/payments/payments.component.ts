import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Invoice, InvoiceService } from '../../core/services/invoice.service';

@Component({
  selector: 'app-payments',
  imports: [CommonModule],
  templateUrl: './payments.component.html',
  styleUrl: './payments.component.css'
})
export class PaymentsComponent implements OnInit, OnDestroy {
  invoices: Invoice[] = [];
  isLoading = false;
  errorMessage = '';
  private refreshTimer?: ReturnType<typeof setInterval>;

  constructor(private invoiceService: InvoiceService) {}

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
    }

    this.invoiceService.getInvoices().subscribe({
      next: (res) => {
        this.invoices = res.data.invoices;
        this.isLoading = false;
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Unable to load payments';
        this.isLoading = false;
      }
    });
  }

  private autoRefresh() {
    if (this.isLoading) return;
    this.loadPayments(true);
  }

  markPaid(invoice: Invoice) {
    this.invoiceService.updateInvoiceStatus(
      invoice._id,
      'paid',
      new Date().toISOString(),
      invoice.paymentMethod || 'Cash'
    ).subscribe({
      next: () => this.loadPayments(),
      error: (err) => {
        this.errorMessage = err.error?.message || 'Unable to update payment';
      }
    });
  }

  get paidInvoices() {
    return this.invoices.filter((invoice) => invoice.status === 'paid');
  }

  get pendingInvoices() {
    return this.invoices.filter((invoice) => !['paid', 'cancelled', 'void'].includes(invoice.status));
  }

  get totalCollected() {
    return this.paidInvoices.reduce((sum, invoice) => sum + invoice.totalAmount, 0);
  }

  get totalPending() {
    return this.pendingInvoices.reduce((sum, invoice) => sum + invoice.totalAmount, 0);
  }
}
