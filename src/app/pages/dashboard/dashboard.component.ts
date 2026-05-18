import { CommonModule, CurrencyPipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Booking, BookingService } from '../../core/services/booking.service';
import { Room, RoomService } from '../../core/services/room.service';
import { StatCardComponent } from '../../shared/stat-card/stat-card.component';
import { OccupancyChartComponent } from '../../shared/occupancy-chart/occupancy-chart.component';
import { RevenueChartComponent } from '../../shared/revenue-chart/revenue-chart.component';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, CurrencyPipe, RouterLink, StatCardComponent, OccupancyChartComponent, RevenueChartComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  rooms: Room[] = [];
  bookings: Booking[] = [];
  isLoading = false;
  errorMessage = '';

  constructor(
    private roomService: RoomService,
    private bookingService: BookingService
  ) {}

  ngOnInit() {
    this.loadDashboard();
  }

  loadDashboard() {
    this.isLoading = true;
    this.errorMessage = '';

    this.roomService.getRooms().subscribe({
      next: (roomRes) => {
        this.rooms = roomRes.data;
        this.loadBookings();
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Unable to load dashboard';
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
      error: () => {
        this.bookings = [];
        this.isLoading = false;
      }
    });
  }

  // Core Metrics
  get totalRooms() {
    return this.rooms.length;
  }

  get availableRooms() {
    return this.rooms.filter((room) => room.status === 'available').length;
  }

  get occupiedRooms() {
    return this.rooms.filter((room) => room.status === 'occupied').length;
  }

  get reservedRooms() {
    return this.rooms.filter((room) => room.status === 'reserved').length;
  }

  get maintenanceRooms() {
    return this.rooms.filter((room) => room.status === 'maintenance').length;
  }

  get occupancyRate() {
    if (this.totalRooms === 0) return 0;
    return Math.round(((this.occupiedRooms + this.reservedRooms) / this.totalRooms) * 100);
  }

  // Booking Metrics
  get totalBookings() {
    return this.bookings.length;
  }

  get activeBookings() {
    return this.bookings.filter((booking) => !['checked_out', 'cancelled'].includes(booking.status)).length;
  }

  get todayCheckIns() {
    const today = new Date().toDateString();
    return this.bookings.filter((booking) => new Date(booking.checkInDate).toDateString() === today).length;
  }

  get todayCheckOuts() {
    const today = new Date().toDateString();
    return this.bookings.filter((booking) => new Date(booking.checkOutDate).toDateString() === today).length;
  }

  // Revenue Metrics
  get projectedRevenue() {
    return this.bookings.reduce((total, booking) => total + booking.totalAmount, 0);
  }

  get projectedRevenueLabel() {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(this.projectedRevenue);
  }

  get averageRoomPrice() {
    if (this.totalRooms === 0) return 0;
    const sum = this.rooms.reduce((total, room) => total + room.pricePerNight, 0);
    return Math.round(sum / this.totalRooms);
  }

  // Recent Data
  get recentBookings() {
    return this.bookings.slice(0, 5);
  }

  get roomStatusList() {
    return this.rooms.slice(0, 8);
  }

  // Status badge styling
  getStatusBadgeClass(status: string): string {
    const statusMap: { [key: string]: string } = {
      'available': 'badge-success',
      'occupied': 'badge-warning',
      'maintenance': 'badge-danger',
      'reserved': 'badge-info'
    };
    return statusMap[status] || 'badge-default';
  }

  getBookingStatusBadgeClass(status: string): string {
    const statusMap: { [key: string]: string } = {
      'confirmed': 'badge-success',
      'checked_in': 'badge-warning',
      'checked_out': 'badge-success',
      'cancelled': 'badge-danger',
      'pending': 'badge-info'
    };
    return statusMap[status] || 'badge-default';
  }

  // Chart Data Generation
  get revenueChartData(): number[] {
    const last7Days: number[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toDateString();
      const dayRevenue = this.bookings
        .filter(booking => new Date(booking.checkInDate).toDateString() <= dateStr && 
                           new Date(booking.checkOutDate).toDateString() >= dateStr)
        .reduce((sum, booking) => sum + booking.totalAmount, 0);
      last7Days.push(dayRevenue);
    }
    return last7Days;
  }

  get revenueChartLabels(): string[] {
    const labels: string[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
    }
    return labels;
  }
}
