import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize, forkJoin, timeout } from 'rxjs';
import { BookingService } from '../../core/services/booking.service';
import { RoomService } from '../../core/services/room.service';
import { AuthService } from '../../core/services/auth.service';
import { Booking, BookingPayload } from '../../core/models/booking.model';
import { Room } from '../../core/models/room.model';

const today = new Date().toISOString().slice(0, 10);
// Explicitly type this so TypeScript knows status can be any valid BookingStatus
const emptyBookingForm: BookingPayload = {
  guest: {
    fullName: '',
    email: '',
    phone: '',
    idNumber: '',
    address: ''
  },
  roomId: '',
  checkInDate: today,
  checkOutDate: '',
  status: 'confirmed' // Initial value is confirmed, but type is wide
};

@Component({
  selector: 'app-bookings',
  imports: [CommonModule, FormsModule],
  templateUrl: './bookings.component.html',
  styleUrl: './bookings.component.css'
})

export class BookingsComponent implements OnInit, OnDestroy {
  bookings: Booking[] = [];
  rooms: Room[] = [];
  form: BookingPayload = structuredClone(emptyBookingForm);
  isLoading = false;
  isSaving = false;
  showBookingForm = false;
  updatingBookingId = '';
  errorMessage = '';
  successMessage = '';
  private refreshTimer?: ReturnType<typeof setInterval>;

  constructor(
    private bookingService: BookingService,
    private roomService: RoomService,
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) { }

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

    // Changed exclusively to .getAll() to match your working CheckIn architecture
    forkJoin({
      rooms: this.roomService.getAll(),
      bookings: this.bookingService.getBookings()
    }).pipe(
      timeout(10000),
      finalize(() => {
        this.isLoading = false;
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: (res: any) => {
        // Safe-check wrapper extraction: handles both raw arrays and unified envelope objects ({ data: [...] })
        this.rooms = Array.isArray(res.rooms) ? res.rooms : (res.rooms && Array.isArray(res.rooms.data) ? res.rooms.data : []);
        this.bookings = Array.isArray(res.bookings) ? res.bookings : (res.bookings && Array.isArray(res.bookings.data) ? res.bookings.data : []);
        this.errorMessage = '';
      },
      error: (err) => {
        this.handleError(err, 'Unable to load bookings data', silent);
      }
    });
  }

  private autoRefresh() {
    if (this.showBookingForm || this.isSaving || this.isLoading) return;
    this.loadData(true);
  }

  private handleError(err: any, fallbackMessage: string, silent = false) {
    if (err.status === 401) {
      this.authService.logout();
      this.router.navigate(['/login'], {
        queryParams: { returnUrl: '/bookings' }
      });
      return;
    }

    if (!silent) {
      this.errorMessage = err.name === 'TimeoutError'
        ? 'Booking data timed out. Check that the backend and MongoDB are running, then refresh.'
        : err.error?.message || fallbackMessage;
    }
  }

  createBooking(form: NgForm) {
    if (form.invalid || this.isSaving) {
      form.control.markAllAsTouched();
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
        idNumber: this.form.guest.idNumber?.trim() || '',
        address: this.form.guest.address?.trim() || ''
      },
      roomId: this.form.roomId,
      checkInDate: this.form.checkInDate,
      checkOutDate: this.form.checkOutDate,
      status: this.form.status
    };

    this.bookingService.createBooking(payload).pipe(
      timeout(15000),
      finalize(() => {
        this.isSaving = false;
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: () => {
        this.form = structuredClone(emptyBookingForm);
        this.showBookingForm = false;
        this.successMessage = 'Booking created successfully';
        this.loadData();
      },
      error: (err) => {
        this.handleError(err, 'Unable to create booking');
      }
    });
  }

  toggleBookingForm() {
    this.showBookingForm = !this.showBookingForm;
  }

  updateStatus(booking: Booking, status: string) {
    if (this.updatingBookingId) return;

    this.updatingBookingId = booking._id;
    this.errorMessage = '';
    this.successMessage = '';

    this.bookingService.updateBookingStatus(booking._id, status).pipe(
      timeout(15000),
      finalize(() => {
        this.updatingBookingId = '';
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: () => {
        this.successMessage = 'Booking status updated';
        this.loadData();
      },
      error: (err) => {
        this.handleError(err, 'Unable to update booking');
      }
    });
  }

  openCheckout(booking: Booking) {
    this.router.navigate(['/checkout'], {
      queryParams: { bookingId: booking._id }
    });
  }

  get availableRooms() {
    return this.rooms.filter((room) => room.status === 'available');
  }

  get activeBookings() {
    return this.bookings.filter((booking) => !['checked_out', 'cancelled'].includes(booking.status)).length;
  }

  get selectedRoom() {
    return this.rooms.find((room) => room._id === this.form.roomId) || null;
  }

  get totalNights() {
    if (!this.form.checkInDate || !this.form.checkOutDate) return 0;

    const checkInDate = new Date(this.form.checkInDate);
    const checkOutDate = new Date(this.form.checkOutDate);
    const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));

    return nights > 0 ? nights : 0;
  }

  get estimatedTotal() {
    return (this.selectedRoom?.pricePerNight || 0) * this.totalNights;
  }

  statusClass(status: string) {
    return {
      pending: status === 'pending',
      confirmed: status === 'confirmed',
      active: status === 'checked_in',
      success: status === 'checked_out',
      danger: status === 'cancelled'
    };
  }
  // Inside your BookingsComponent class:
  canCheckIn(booking: Booking): boolean {
    const currentStatus = booking.status as string;
    return currentStatus === 'confirmed' || currentStatus === 'pending';
  }
}
