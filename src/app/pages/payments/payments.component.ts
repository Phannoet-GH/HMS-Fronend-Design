import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Invoice, InvoiceService } from '../../core/services/invoice.service';

@Component({
  selector: 'app-payments',
  imports: [CommonModule],
  templateUrl: './payments.component.html',
  styleUrl: './payments.component.css'
})
export class PaymentsComponent implements OnInit {
  invoices: Invoice[] = [];
  isLoading = false;
  errorMessage = '';

  constructor(private invoiceService: InvoiceService) {}

  ngOnInit() {
    this.loadPayments();
  }

  loadPayments() {
    this.isLoading = true;
    this.errorMessage = '';

    this.invoiceService.getInvoices().subscribe({
      next: (res) => {
        this.invoices = res.data;
        this.isLoading = false;
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Unable to load payments';
        this.isLoading = false;
      }
    });
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
