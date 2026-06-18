import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize, forkJoin, timeout } from 'rxjs';
import { Booking, BookingPayload, BookingService } from '../../core/services/booking.service';
import { Invoice, InvoiceService } from '../../core/services/invoice.service';
import { Room, RoomService } from '../../core/services/room.service';
import { AuthService } from '../../core/services/auth.service';

const today = new Date().toISOString().slice(0, 10);

@Component({
  selector: 'app-check-in',
  imports: [CommonModule, FormsModule],
  templateUrl: './check-in.component.html',
  styleUrl: './check-in.component.css',
})
export class CheckInComponent implements OnInit, OnDestroy {
  rooms: Room[] = [];
  bookings: Booking[] = [];
  isLoading = false;
  isSaving = false;
  isCreatingInvoice = false;
  createdInvoice: Invoice | null = null;
  errorMessage = '';
  successMessage = '';
  private refreshTimer?: ReturnType<typeof setInterval>;

  form: BookingPayload & { guests: number; notes: string; paymentStatus: string } = {
    guest: {
      fullName: '',
      phone: '',
      email: '',
      address: ''
    },
    roomId: '',
    checkInDate: today,
    checkOutDate: '',
    status: 'checked-in',
    guests: 1,
    notes: '',
    paymentStatus: 'pending'
  };

  constructor(
    private bookingService: BookingService,
    private invoiceService: InvoiceService,
    private roomService: RoomService,
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
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
      rooms: this.roomService.getRooms(),
      bookings: this.bookingService.getBookings()
    }).pipe(
      timeout(10000),
      finalize(() => {
        this.isLoading = false;
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: ({ rooms, bookings }) => {
        this.rooms = Array.isArray(rooms.data) ? rooms.data : [];
        this.bookings = Array.isArray(bookings.data) ? bookings.data : [];
        this.errorMessage = '';
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
        queryParams: { returnUrl: '/checkin' }
      });
      return;
    }

    if (!silent) {
      this.errorMessage = err.name === 'TimeoutError'
        ? 'Check-in data timed out. Check that the backend and MongoDB are running, then refresh.'
        : err.error?.message || 'Unable to load check-in data';
    }
  }

  completeCheckIn(form: NgForm) {
    if (this.isSaving) {
      return;
    }

    if (form.invalid) {
      form.control.markAllAsTouched();
      this.errorMessage = this.checkInDisabledReason || 'Complete the required check-in fields';
      return;
    }

    if (!this.form.guest.fullName.trim() || !this.form.guest.phone.trim() || !this.form.roomId || !this.form.checkOutDate) {
      this.errorMessage = 'Guest name, phone, room, and check-out date are required';
      return;
    }

    if (this.totalNights <= 0) {
      this.errorMessage = 'Check-out date must be after check-in date';
      return;
    }

    this.isSaving = true;
    this.errorMessage = '';
    this.successMessage = '';

    const payload: BookingPayload = {
      guest: {
        fullName: this.form.guest.fullName.trim(),
        phone: this.form.guest.phone.trim(),
        email: this.form.guest.email?.trim().toLowerCase() || '',
        address: this.form.guest.address?.trim() || ''
      },
      roomId: this.form.roomId,
      checkInDate: this.form.checkInDate,
      checkOutDate: this.form.checkOutDate,
      status: 'checked-in'
    };

    const invoiceNights = this.totalNights;
    const invoiceRoomCharges = this.totalAmount;

    this.bookingService.createBooking(payload).pipe(
      timeout(15000),
      finalize(() => {
        if (!this.isCreatingInvoice) {
          this.isSaving = false;
        }
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: (res) => this.createInvoiceForCheckIn(res.data, invoiceNights, invoiceRoomCharges),
      error: (err) => {
        if (err.status === 401) {
          this.authService.logout();
          this.router.navigate(['/login'], {
            queryParams: { returnUrl: '/checkin' }
          });
          return;
        }

        this.errorMessage = err.name === 'TimeoutError'
          ? 'Check-in timed out. Check that the backend and MongoDB are running, then try again.'
          : err.error?.message || 'Unable to complete check-in';
      }
    });
  }

  private createInvoiceForCheckIn(booking: Booking, numberOfNights: number, roomCharges: number) {
    this.isCreatingInvoice = true;

    this.invoiceService.createInvoice({
      bookingId: booking._id,
      numberOfNights,
      roomCharges,
      additionalCharges: [],
      discount: 0,
      taxPercentage: 0,
      notes: this.form.notes?.trim() || 'Created automatically from check-in'
    }).pipe(
      timeout(15000),
      finalize(() => {
        this.isCreatingInvoice = false;
        this.isSaving = false;
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: (res) => {
        this.createdInvoice = res.data;
        this.successMessage = 'Guest checked in and invoice created successfully';
        this.resetForm();
        this.loadData();
        this.printCreatedInvoice();
      },
      error: (err) => {
        this.successMessage = 'Guest checked in successfully';
        this.errorMessage = err.name === 'TimeoutError'
          ? 'Check-in succeeded, but invoice creation timed out. Create the invoice from Invoices Management.'
          : err.error?.message || 'Check-in succeeded, but invoice creation failed';
        this.resetForm();
        this.loadData();
      }
    });
  }

  closeInvoicePreview() {
    this.createdInvoice = null;
  }

  printInvoice() {
    window.print();
  }

  private printCreatedInvoice() {
    setTimeout(() => window.print(), 250);
  }

  resetForm() {
    this.form = {
      guest: {
        fullName: '',
        phone: '',
        email: '',
        address: ''
      },
      roomId: '',
      checkInDate: today,
      checkOutDate: '',
      status: 'checked-in',
      guests: 1,
      notes: '',
      paymentStatus: 'pending'
    };
  }

  selectRoom(roomId: string) {
    this.form.roomId = roomId;
    this.errorMessage = '';
  }

  setPaymentStatus(status: string) {
    this.form.paymentStatus = status;
  }

  adjustGuests(change: number) {
    this.form.guests = Math.max(1, (Number(this.form.guests) || 1) + change);
  }

  get availableRooms() {
    return this.rooms.filter((room) => room.status === 'available');
  }

  get selectedRoom() {
    return this.rooms.find((room) => room._id === this.form.roomId) || null;
  }

  get minCheckOutDate() {
    if (!this.form.checkInDate) return today;

    const checkInDate = new Date(this.form.checkInDate);
    checkInDate.setDate(checkInDate.getDate() + 1);

    return checkInDate.toISOString().slice(0, 10);
  }

  get canCompleteCheckIn() {
    return !!this.form.guest.fullName.trim()
      && !!this.form.guest.phone.trim()
      && !!this.form.roomId
      && !!this.form.checkInDate
      && !!this.form.checkOutDate
      && this.totalNights > 0;
  }

  get checkInDisabledReason() {
    if (this.isSaving) return 'Saving check-in...';
    if (!this.form.guest.fullName.trim()) return 'Enter the guest full name';
    if (!this.form.guest.phone.trim()) return 'Enter the guest phone number';
    if (!this.form.roomId) return 'Select an available room';
    if (!this.form.checkOutDate) return 'Select a check-out date';
    if (this.totalNights <= 0) return 'Check-out date must be after check-in date';
    return '';
  }

  get totalNights() {
    if (!this.form.checkInDate || !this.form.checkOutDate) return 0;

    const checkInDate = new Date(this.form.checkInDate);
    const checkOutDate = new Date(this.form.checkOutDate);
    const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));

    return nights > 0 ? nights : 0;
  }

  get totalAmount() {
    return (this.selectedRoom?.pricePerNight || 0) * this.totalNights;
  }

  get recentCheckIns() {
    return this.bookings.filter((booking) => ['checked-in', 'checked_in'].includes(booking.status)).slice(0, 5);
  }
}
