import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Invoice, InvoiceService } from '../../core/services/invoice.service';

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
  private refreshTimer?: ReturnType<typeof setInterval>;

  constructor(private invoiceService: InvoiceService) {}

  ngOnInit() {
    this.loadInvoices();
    this.refreshTimer = setInterval(() => this.autoRefresh(), 15000);
  }

  ngOnDestroy() {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
    }
  }

  loadInvoices(silent = false) {
    if (!silent) {
      this.isLoading = true;
      this.errorMessage = '';
    }

    const filters = this.statusFilter !== 'all' ? { status: this.statusFilter } : undefined;

    this.invoiceService.getInvoices(filters).subscribe({
      next: (res) => {
        this.invoices = res.data.invoices;
        this.isLoading = false;
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Failed to load invoices';
        this.isLoading = false;
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
    const paymentDate = new Date().toISOString();
    this.invoiceService.updateInvoiceStatus(invoiceId, 'paid', paymentDate).subscribe({
      next: (res) => {
        const index = this.invoices.findIndex(inv => inv._id === invoiceId);
        if (index > -1) {
          this.invoices[index] = res.data;
        }
        this.successMessage = 'Invoice marked as paid';
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Failed to update invoice';
      }
    });
  }

  markAsIssued(invoiceId: string) {
    this.invoiceService.updateInvoiceStatus(invoiceId, 'issued').subscribe({
      next: (res) => {
        const index = this.invoices.findIndex(inv => inv._id === invoiceId);
        if (index > -1) {
          this.invoices[index] = res.data;
        }
        this.successMessage = 'Invoice issued successfully';
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Failed to update invoice';
      }
    });
  }

  deleteInvoice(invoiceId: string) {
    if (confirm('Are you sure you want to delete this invoice?')) {
      this.invoiceService.deleteInvoice(invoiceId).subscribe({
        next: () => {
          this.invoices = this.invoices.filter(inv => inv._id !== invoiceId);
          this.successMessage = 'Invoice deleted successfully';
          setTimeout(() => this.successMessage = '', 3000);
        },
        error: (err) => {
          this.errorMessage = err.error?.message || 'Failed to delete invoice';
        }
      });
    }
  }

  getStatusBadgeClass(status: string): string {
    const statusMap: { [key: string]: string } = {
      'draft': 'badge-info',
      'issued': 'badge-warning',
      'unpaid': 'badge-warning',
      'paid': 'badge-success',
      'cancelled': 'badge-danger',
      'void': 'badge-danger'
    };
    return statusMap[status] || 'badge-default';
  }

  getTotalAmount(): number {
    return this.invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
  }

  getTotalPaid(): number {
    return this.invoices
      .filter(inv => inv.status === 'paid')
      .reduce((sum, inv) => sum + inv.totalAmount, 0);
  }
}
