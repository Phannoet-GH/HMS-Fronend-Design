import { CommonModule, CurrencyPipe } from '@angular/common';
import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { finalize, forkJoin, timeout } from 'rxjs';
import { BookingService } from '@core/services/booking.service';
import { RoomService } from '@core/services/room.service';
import { AuthService } from '@core/services/auth.service';
import { StatCardComponent } from '../../shared/stat-card/stat-card.component';
import { OccupancyChartComponent } from '../../shared/occupancy-chart/occupancy-chart.component';
import { RevenueChartComponent } from '../../shared/revenue-chart/revenue-chart.component';
import { Room, RoomStatus } from '@core/models/room.model';
import { Booking, BookingStatus } from '@core/models/booking.model';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, CurrencyPipe, RouterLink, StatCardComponent, OccupancyChartComponent, RevenueChartComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit, OnDestroy {
  rooms: Room[] = [];
  bookings: Booking[] = [];
  isLoading = false;
  errorMessage = '';
  private refreshTimer?: ReturnType<typeof setInterval>;

  constructor(
    private roomService: RoomService,
    private bookingService: BookingService,
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.loadDashboard();
    this.refreshTimer = setInterval(() => this.autoRefresh(), 15000);
  }

  ngOnDestroy() {
    clearInterval(this.refreshTimer);
  }

  loadDashboard(silent = false) {
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
        this.rooms = rooms;
        this.bookings = bookings;
        this.errorMessage = '';
      },
      error: (err) => {
        if (err.status === 401) {
          this.authService.logout();
          this.router.navigate(['/login'], { queryParams: { returnUrl: '/dashboard' } });
          return;
        }
        if (!silent) {
          this.errorMessage = err.name === 'TimeoutError'
            ? 'Dashboard data timed out. Check that the backend and MongoDB are running, then refresh.'
            : err.error?.message || 'Unable to load dashboard';
        }
      }
    });
  }

  private autoRefresh() {
    if (this.isLoading) return;
    this.loadDashboard(true);
  }

  // Room metrics
  get totalRooms() { return this.rooms.length; }
  get availableRooms() { return this.rooms.filter(r => r.status === 'available').length; }
  get occupiedRooms() { return this.rooms.filter(r => r.status === 'occupied').length; }
  get reservedRooms() { return this.rooms.filter(r => r.status === 'reserved').length; }
  get maintenanceRooms() { return this.rooms.filter(r => r.status === 'maintenance').length; }

  get occupancyRate() {
    if (this.totalRooms === 0) return 0;
    return Math.round(((this.occupiedRooms + this.reservedRooms) / this.totalRooms) * 100);
  }

  // Booking metrics
  get totalBookings() { return this.bookings.length; }
  get activeBookings() { return this.bookings.filter(b => !(['checked_out', 'cancelled'] as BookingStatus[]).includes(b.status)).length; }

  get todayCheckIns() {
    const today = new Date().toDateString();
    return this.bookings.filter(b => new Date(b.checkInDate).toDateString() === today).length;
  }

  get todayCheckOuts() {
    const today = new Date().toDateString();
    return this.bookings.filter(b => new Date(b.checkOutDate).toDateString() === today).length;
  }

  // Revenue metrics
  get projectedRevenue() {
    return this.bookings.reduce((total, b) => total + b.totalAmount, 0);
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
    return Math.round(this.rooms.reduce((total, r) => total + r.pricePerNight, 0) / this.totalRooms);
  }

  // Recent data
  get recentBookings() {
    return [...this.bookings]
      .sort((a, b) => new Date(b.checkInDate).getTime() - new Date(a.checkInDate).getTime())
      .slice(0, 5);
  }

  get roomStatusList() { return this.rooms.slice(0, 8); }

  // Badge helpers
  getStatusBadgeClass(status: RoomStatus): string {
    // Using Partial allows you to safely omit keys without TS compiler errors
    const statusMap: Partial<Record<RoomStatus, string>> = {
      'available': 'badge-success',
      'occupied': 'badge-warning',
      'maintenance': 'badge-danger',
      'reserved': 'badge-info'
    };

    return statusMap[status] ?? 'badge-default';
  }

  getBookingStatusBadgeClass(status: BookingStatus): string {
    const statusMap: Record<BookingStatus, string> = {
      'confirmed': 'badge-success',
      'checked_in': 'badge-warning',
      'checked_out': 'badge-success',
      'cancelled': 'badge-danger',
      'no_show': 'badge-danger'
    };
    return statusMap[status] ?? 'badge-default';
  }

  // Chart data
  get revenueChartData(): number[] {
    const last7Days: number[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayStart = new Date(date); dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(date); dayEnd.setHours(23, 59, 59, 999);
      const dayRevenue = this.bookings
        .filter(b => new Date(b.checkInDate) <= dayEnd && new Date(b.checkOutDate) >= dayStart)
        .reduce((sum, b) => sum + b.totalAmount, 0);
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