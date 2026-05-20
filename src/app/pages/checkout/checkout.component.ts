import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { switchMap } from 'rxjs';
import { Booking, BookingService } from '../../core/services/booking.service';
import { Invoice, InvoiceService } from '../../core/services/invoice.service';

@Component({
  selector: 'app-checkout',
  imports: [CommonModule, FormsModule],
  templateUrl: './checkout.component.html',
  styleUrl: './checkout.component.css',
})
export class CheckoutComponent implements OnInit {
  activeBookings: Booking[] = [];
  invoices: Invoice[] = [];
  selectedBookingId = '';
  searchTerm = '';
  roomCondition = 'Ready for cleaning';
  paymentMethod = 'Credit Card';
  serviceCharge = 0;
  taxPercentage = 0;
  notes = '';
  isLoading = false;
  isSaving = false;
  errorMessage = '';
  successMessage = '';

  constructor(
    private bookingService: BookingService,
    private invoiceService: InvoiceService
  ) {}

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.isLoading = true;
    this.errorMessage = '';

    this.bookingService.getBookings({ status: 'checked_in' }).subscribe({
      next: (res) => {
        this.activeBookings = res.data;
        if (!this.selectedBookingId && this.activeBookings.length > 0) {
          this.selectedBookingId = this.activeBookings[0]._id;
        }
        this.loadInvoices();
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Unable to load active stays';
        this.isLoading = false;
      }
    });
  }

  loadInvoices() {
    this.invoiceService.getInvoices().subscribe({
      next: (res) => {
        this.invoices = res.data.invoices;
        this.isLoading = false;
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Unable to load invoices';
        this.isLoading = false;
      }
    });
  }

  selectBooking(id: string) {
    this.selectedBookingId = id;
    this.successMessage = '';
    this.errorMessage = '';
  }

  completeCheckOut() {
    const booking = this.selectedBooking;
    if (!booking) {
      this.errorMessage = 'Select an active checked-in booking first';
      return;
    }

    this.isSaving = true;
    this.errorMessage = '';
    this.successMessage = '';

    const additionalCharges = this.serviceCharge > 0
      ? [{ description: 'Service Charges', amount: this.serviceCharge }]
      : [];

    this.invoiceService.createInvoice({
      bookingId: booking._id,
      numberOfNights: this.totalNights,
      roomCharges: this.roomCharges,
      additionalCharges,
      taxPercentage: this.taxPercentage,
      notes: this.notes || this.roomCondition
    }).pipe(
      switchMap((res) => this.invoiceService.updateInvoiceStatus(
        res.data._id,
        'paid',
        new Date().toISOString(),
        this.paymentMethod
      )),
      switchMap(() => this.bookingService.updateBookingStatus(booking._id, 'checked_out'))
    ).subscribe({
      next: () => {
        this.successMessage = 'Guest checked out and invoice paid successfully';
        this.resetForm();
        this.loadData();
        this.isSaving = false;
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Unable to complete check-out';
        this.isSaving = false;
      }
    });
  }

  resetForm() {
    this.selectedBookingId = '';
    this.searchTerm = '';
    this.roomCondition = 'Ready for cleaning';
    this.paymentMethod = 'Credit Card';
    this.serviceCharge = 0;
    this.taxPercentage = 0;
    this.notes = '';
  }

  get filteredBookings() {
    const term = this.searchTerm.trim().toLowerCase();
    if (!term) return this.activeBookings;

    return this.activeBookings.filter((booking) => {
      return booking.guest.fullName.toLowerCase().includes(term)
        || booking.room.roomNumber.toLowerCase().includes(term)
        || booking._id.toLowerCase().includes(term);
    });
  }

  get selectedBooking() {
    return this.activeBookings.find((booking) => booking._id === this.selectedBookingId) || null;
  }

  get totalNights() {
    if (!this.selectedBooking) return 0;

    const checkInDate = new Date(this.selectedBooking.checkInDate);
    const checkOutDate = new Date(this.selectedBooking.checkOutDate);
    const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));

    return nights > 0 ? nights : 1;
  }

  get roomCharges() {
    return this.selectedBooking ? this.totalNights * this.selectedBooking.room.pricePerNight : 0;
  }

  get taxAmount() {
    return ((this.roomCharges + this.serviceCharge) * this.taxPercentage) / 100;
  }

  get totalAmount() {
    return this.roomCharges + this.serviceCharge + this.taxAmount;
  }

  get recentCheckOuts() {
    return this.invoices.filter((invoice) => invoice.status === 'paid').slice(0, 5);
  }

  get dueTodayCount() {
    const today = new Date().toDateString();
    return this.activeBookings.filter((booking) => new Date(booking.checkOutDate).toDateString() === today).length;
  }
}
