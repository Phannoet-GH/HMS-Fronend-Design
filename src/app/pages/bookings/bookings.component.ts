import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Booking, BookingPayload, BookingService } from '../../core/services/booking.service';
import { Room, RoomService } from '../../core/services/room.service';

const emptyBookingForm: BookingPayload = {
  guest: {
    fullName: '',
    email: '',
    phone: '',
    idNumber: '',
    address: ''
  },
  roomId: '',
  checkInDate: '',
  checkOutDate: '',
  status: 'confirmed'
};

@Component({
  selector: 'app-bookings',
  imports: [CommonModule, FormsModule],
  templateUrl: './bookings.component.html',
  styleUrl: './bookings.component.css'
})
export class BookingsComponent implements OnInit {
  bookings: Booking[] = [];
  rooms: Room[] = [];
  form: BookingPayload = structuredClone(emptyBookingForm);
  isLoading = false;
  isSaving = false;
  showBookingForm = false;
  errorMessage = '';

  constructor(
    private bookingService: BookingService,
    private roomService: RoomService
  ) {}

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.isLoading = true;
    this.errorMessage = '';

    this.roomService.getRooms().subscribe({
      next: (roomRes) => {
        this.rooms = roomRes.data;
        this.loadBookings();
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Unable to load rooms';
        this.isLoading = false;
      }
    });
  }

  private loadBookings() {
    this.bookingService.getBookings().subscribe({
      next: (bookingRes) => {
        this.bookings = bookingRes.data;
        this.isLoading = false;
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Unable to load bookings';
        this.isLoading = false;
      }
    });
  }

  createBooking() {
    this.isSaving = true;
    this.errorMessage = '';

    this.bookingService.createBooking(this.form).subscribe({
      next: () => {
        this.form = structuredClone(emptyBookingForm);
        this.loadData();
        this.isSaving = false;
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Unable to create booking';
        this.isSaving = false;
      }
    });
  }

  toggleBookingForm() {
    this.showBookingForm = !this.showBookingForm;
  }

  updateStatus(booking: Booking, status: string) {
    this.bookingService.updateBookingStatus(booking._id, status).subscribe({
      next: () => this.loadData(),
      error: (err) => {
        this.errorMessage = err.error?.message || 'Unable to update booking';
      }
    });
  }

  get availableRooms() {
    return this.rooms.filter((room) => room.status === 'available');
  }

  get activeBookings() {
    return this.bookings.filter((booking) => !['checked_out', 'cancelled'].includes(booking.status)).length;
  }
}
