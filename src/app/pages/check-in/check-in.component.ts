import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Booking, BookingPayload, BookingService } from '../../core/services/booking.service';
import { Room, RoomService } from '../../core/services/room.service';

const today = new Date().toISOString().slice(0, 10);

@Component({
  selector: 'app-check-in',
  imports: [CommonModule, FormsModule],
  templateUrl: './check-in.component.html',
  styleUrl: './check-in.component.css',
})
export class CheckInComponent implements OnInit {
  rooms: Room[] = [];
  bookings: Booking[] = [];
  isLoading = false;
  isSaving = false;
  errorMessage = '';
  successMessage = '';

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
    status: 'checked_in',
    guests: 1,
    notes: '',
    paymentStatus: 'pending'
  };

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
      next: (res) => {
        this.rooms = res.data;
        this.loadBookings();
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Unable to load rooms';
        this.isLoading = false;
      }
    });
  }

  loadBookings() {
    this.bookingService.getBookings().subscribe({
      next: (res) => {
        this.bookings = res.data;
        this.isLoading = false;
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Unable to load bookings';
        this.isLoading = false;
      }
    });
  }

  completeCheckIn() {
    if (!this.form.guest.fullName || !this.form.guest.phone || !this.form.roomId || !this.form.checkOutDate) {
      this.errorMessage = 'Guest name, phone, room, and check-out date are required';
      return;
    }

    this.isSaving = true;
    this.errorMessage = '';
    this.successMessage = '';

    const payload: BookingPayload = {
      guest: this.form.guest,
      roomId: this.form.roomId,
      checkInDate: this.form.checkInDate,
      checkOutDate: this.form.checkOutDate,
      status: 'checked_in'
    };

    this.bookingService.createBooking(payload).subscribe({
      next: () => {
        this.successMessage = 'Guest checked in successfully';
        this.resetForm();
        this.loadData();
        this.isSaving = false;
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Unable to complete check-in';
        this.isSaving = false;
      }
    });
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
      status: 'checked_in',
      guests: 1,
      notes: '',
      paymentStatus: 'pending'
    };
  }

  get availableRooms() {
    return this.rooms.filter((room) => room.status === 'available');
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

  get totalAmount() {
    return (this.selectedRoom?.pricePerNight || 0) * this.totalNights;
  }

  get recentCheckIns() {
    return this.bookings.filter((booking) => booking.status === 'checked_in').slice(0, 5);
  }
}
