import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin, finalize, switchMap, timeout } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { Booking, BookingService } from '../../core/services/booking.service';
import { Invoice, InvoiceService } from '../../core/services/invoice.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-checkout',
  imports: [CommonModule, FormsModule],
  templateUrl: './checkout.component.html',
  styleUrl: './checkout.component.css',
})
export class CheckoutComponent implements OnInit, OnDestroy {
  activeBookings: Booking[] = [];
  invoices: Invoice[] = [];
  selectedBookingId = '';
  searchTerm = '';
  roomCondition = 'Ready for cleaning';
  paymentMethod = 'card';
  serviceCharge = 0;
  taxPercentage = 0;
  notes = '';
  isLoading = false;
  isSaving = false;
  checkoutInvoice: Invoice | null = null;
  errorMessage = '';
  successMessage = '';
  private requestedBookingId = '';
  private refreshTimer?: ReturnType<typeof setInterval>;

  constructor(
    private bookingService: BookingService,
    private invoiceService: InvoiceService,
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.requestedBookingId = this.route.snapshot.queryParamMap.get('bookingId') || '';
    this.loadData();
    this.refreshTimer = setInterval(() => this.autoRefresh(), 15000);
  }

  ngOnDestroy() {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
    }
  }

  loadData(silent = false) {
    if (!silent) {
      this.isLoading = true;
      this.errorMessage = '';
      this.cdr.detectChanges();
    }

    forkJoin({
      bookings: this.bookingService.getBookings({ status: 'checked-in' }),
      invoices: this.invoiceService.getInvoices({ limit: 100 })
    }).pipe(
      timeout(10000),
      finalize(() => {
        this.isLoading = false;
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: ({ bookings, invoices }) => {
        this.activeBookings = Array.isArray(bookings.data) ? bookings.data : [];
        this.invoices = Array.isArray(invoices.data?.invoices) ? invoices.data.invoices : [];

        if (this.requestedBookingId && this.activeBookings.some((booking) => booking._id === this.requestedBookingId)) {
          this.selectedBookingId = this.requestedBookingId;
          this.requestedBookingId = '';
        } else if (!this.selectedBookingId && this.activeBookings.length > 0) {
          this.selectedBookingId = this.activeBookings[0]._id;
        }
      },
      error: (err) => {
        this.handleLoadError(err, silent);
      }
    });
  }

  private autoRefresh() {
    if (this.isSaving || this.isLoading) return;
    this.loadData(true);
  }

  private handleLoadError(err: any, silent = false) {
    if (err.status === 401) {
      this.authService.logout();
      this.router.navigate(['/login'], {
        queryParams: { returnUrl: '/checkout' }
      });
      return;
    }

    if (!silent) {
      this.errorMessage = err.name === 'TimeoutError'
        ? 'Checkout data timed out. Check that the backend and MongoDB are running, then refresh.'
        : err.error?.message || 'Unable to load checkout data';
    }
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

    if (!booking.room) {
      this.errorMessage = 'This booking is missing its room record and cannot be checked out';
      return;
    }

    this.isSaving = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.checkoutInvoice = null;

    const additionalCharges = this.serviceCharge > 0
      ? [{ description: 'Service Charges', amount: this.serviceCharge }]
      : [];

    const existingInvoice = this.getInvoiceForBooking(booking._id);
    const invoicePayload = {
      numberOfNights: this.totalNights,
      roomCharges: this.roomCharges,
      additionalCharges,
      taxPercentage: this.taxPercentage,
      notes: this.notes || this.roomCondition
    };

    const invoiceRequest = existingInvoice
      ? this.invoiceService.updateInvoice(existingInvoice._id, invoicePayload)
      : this.invoiceService.createInvoice({
          bookingId: booking._id,
          ...invoicePayload
        });

    invoiceRequest.pipe(
      timeout(15000),
      switchMap((invoiceRes) => this.invoiceService.updateInvoiceStatus(
        invoiceRes.data._id,
        'paid',
        new Date().toISOString(),
        this.paymentMethod
      )),
      switchMap((paidInvoiceRes) => {
        this.checkoutInvoice = paidInvoiceRes.data;
        return this.bookingService.updateBookingStatus(booking._id, 'checked-out');
      }),
      finalize(() => {
        this.isSaving = false;
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: () => {
        this.successMessage = 'Guest checked out, invoice settled, and room released';
        this.resetForm();
        this.loadData();
      },
      error: (err) => {
        if (err.status === 401) {
          this.authService.logout();
          this.router.navigate(['/login'], {
            queryParams: { returnUrl: '/checkout' }
          });
          return;
        }

        this.errorMessage = err.name === 'TimeoutError'
          ? 'Check-out timed out. Check that the backend and MongoDB are running, then try again.'
          : err.error?.message || 'Unable to complete check-out';
      }
    });
  }

  resetForm() {
    this.selectedBookingId = '';
    this.searchTerm = '';
    this.roomCondition = 'Ready for cleaning';
    this.paymentMethod = 'card';
    this.serviceCharge = 0;
    this.taxPercentage = 0;
    this.notes = '';
  }

  closeReceipt() {
    this.checkoutInvoice = null;
  }

  printReceipt() {
    window.print();
  }

  get filteredBookings() {
    const term = this.searchTerm.trim().toLowerCase();
    if (!term) return this.activeBookings;

    return this.activeBookings.filter((booking) => {
      return booking.guest.fullName.toLowerCase().includes(term)
        || (booking.room?.roomNumber || '').toLowerCase().includes(term)
        || booking._id.toLowerCase().includes(term);
    });
  }

  get selectedBooking() {
    return this.activeBookings.find((booking) => booking._id === this.selectedBookingId) || null;
  }

  get selectedInvoice() {
    return this.selectedBooking ? this.getInvoiceForBooking(this.selectedBooking._id) : null;
  }

  getInvoiceForBooking(bookingId: string) {
    return this.invoices.find((invoice) => {
      const booking = invoice.booking as any;
      return booking === bookingId || booking?._id === bookingId;
    }) || null;
  }

  get selectedRoomLabel() {
    const room = this.selectedBooking?.room;
    return room ? `${room.roomNumber} - ${room.type}` : '';
  }

  get selectedStaySummary() {
    const room = this.selectedBooking?.room;
    return room ? `${this.totalNights} nights in ${room.type}, room ${room.roomNumber}` : '';
  }

  get totalNights() {
    if (!this.selectedBooking) return 0;

    const checkInDate = new Date(this.selectedBooking.checkInDate);
    const checkOutDate = new Date(this.selectedBooking.checkOutDate);
    const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));

    return nights > 0 ? nights : 1;
  }

  get roomCharges() {
    return this.selectedBooking?.room ? this.totalNights * this.selectedBooking.room.pricePerNight : 0;
  }

  get taxAmount() {
    return ((this.roomCharges + this.serviceCharge) * this.taxPercentage) / 100;
  }

  get totalAmount() {
    return this.roomCharges + this.serviceCharge + this.taxAmount;
  }

  get amountDue() {
    return this.selectedInvoice?.status === 'paid' ? 0 : this.totalAmount;
  }

  get recentCheckOuts() {
    return this.invoices.filter((invoice) => invoice.status === 'paid').slice(0, 5);
  }

  get dueTodayCount() {
    const today = new Date().toDateString();
    return this.activeBookings.filter((booking) => new Date(booking.checkOutDate).toDateString() === today).length;
  }
}
