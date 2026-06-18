import { CommonModule, CurrencyPipe } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration } from 'chart.js';
import { finalize, forkJoin, timeout } from 'rxjs';
import { BookingService, Booking } from '../../core/services/booking.service';
import { RoomService, Room } from '../../core/services/room.service';
import { InvoiceService, Invoice } from '../../core/services/invoice.service';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, FormsModule, BaseChartDirective],
  templateUrl: './reports.component.html',
  styleUrl: './reports.component.css'
})
export class ReportsComponent implements OnInit, OnDestroy {
  bookings: Booking[] = [];
  rooms: Room[] = [];
  invoices: Invoice[] = [];
  isLoading = false;
  errorMessage = '';
  selectedDateRange = '30days';
  private refreshTimer?: ReturnType<typeof setInterval>;

  // Chart configurations
  occupancyTrendChart: ChartConfiguration<'line'> = {
    type: 'line',
    data: { labels: [], datasets: [] },
    options: {}
  };

  revenueByMonthChart: ChartConfiguration<'bar'> = {
    type: 'bar',
    data: { labels: [], datasets: [] },
    options: {}
  };

  bookingStatusChart: ChartConfiguration<'doughnut'> = {
    type: 'doughnut',
    data: { labels: [], datasets: [] },
    options: {}
  };

  constructor(
    private bookingService: BookingService,
    private roomService: RoomService,
    private invoiceService: InvoiceService
  ) {}

  ngOnInit() {
    this.loadReportData();
    this.refreshTimer = setInterval(() => this.autoRefresh(), 15000);
  }

  ngOnDestroy() {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
    }
  }

  loadReportData(silent = false) {
    if (!silent) {
      this.isLoading = true;
      this.errorMessage = '';
    }

    forkJoin({
      bookings: this.bookingService.getBookings(),
      rooms: this.roomService.getRooms(),
      invoices: this.invoiceService.getInvoices()
    }).pipe(
      timeout(10000),
      finalize(() => {
        this.isLoading = false;
      })
    ).subscribe({
      next: ({ bookings, rooms, invoices }) => {
        this.bookings = Array.isArray(bookings.data) ? bookings.data : [];
        this.rooms = Array.isArray(rooms.data) ? rooms.data : [];
        this.invoices = Array.isArray(invoices.data?.invoices) ? invoices.data.invoices : [];
        this.errorMessage = '';
        this.initializeCharts();
      },
      error: (err) => {
        if (!silent) {
          this.errorMessage = err.name === 'TimeoutError'
            ? 'Report data timed out. Check that the backend and MongoDB are running, then refresh.'
            : err.error?.message || 'Unable to load reports';
        }
      }
    });
  }

  private autoRefresh() {
    if (this.isLoading) return;
    this.loadReportData(true);
  }

  private initializeCharts() {
    this.initializeOccupancyTrend();
    this.initializeRevenueByMonth();
    this.initializeBookingStatusChart();
  }

  private initializeOccupancyTrend() {
    const last30Days: { date: string; occupancy: number }[] = [];

    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      const occupiedCount = this.bookings.filter(b =>
        new Date(b.checkInDate) <= date && new Date(b.checkOutDate) >= date
      ).length;

      const occupancyRate = this.rooms.length > 0 ? (occupiedCount / this.rooms.length) * 100 : 0;
      last30Days.push({ date: dateStr, occupancy: Math.round(occupancyRate) });
    }

    this.occupancyTrendChart = {
      type: 'line',
      data: {
        labels: last30Days.map(d => d.date),
        datasets: [
          {
            label: 'Occupancy Rate (%)',
            data: last30Days.map(d => d.occupancy),
            borderColor: '#f59e0b',
            backgroundColor: 'rgba(245, 158, 11, 0.1)',
            borderWidth: 3,
            fill: true,
            pointRadius: 4,
            pointBackgroundColor: '#f59e0b',
            tension: 0.4
          }
        ]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: true, position: 'top' },
          tooltip: { mode: 'index', intersect: false }
        },
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
            ticks: {
              callback: (value) => value + '%'
            }
          }
        }
      }
    };
  }

  private initializeRevenueByMonth() {
    const months: { month: string; revenue: number }[] = [];

    for (let i = 11; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthStr = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });

      const monthRevenue = this.invoices
        .filter(inv => {
          const invDate = new Date(inv.issueDate);
          return invDate.getMonth() === date.getMonth() && invDate.getFullYear() === date.getFullYear();
        })
        .reduce((sum, inv) => sum + inv.totalAmount, 0);

      months.push({ month: monthStr, revenue: monthRevenue });
    }

    this.revenueByMonthChart = {
      type: 'bar',
      data: {
        labels: months.map(m => m.month),
        datasets: [
          {
            label: 'Revenue',
            data: months.map(m => m.revenue),
            backgroundColor: '#10b981',
            borderRadius: 6,
            borderSkipped: false
          }
        ]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: true, position: 'top' }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: (value) => '$' + value.toLocaleString()
            }
          }
        }
      }
    };
  }

  private initializeBookingStatusChart() {
    const confirmed = this.bookings.filter(b => b.status === 'confirmed').length;
    const checkedIn = this.bookings.filter(b => b.status === 'checked-in').length;
    const checkedOut = this.bookings.filter(b => b.status === 'checked-out').length;
    const cancelled = this.bookings.filter(b => b.status === 'cancelled').length;

    this.bookingStatusChart = {
      type: 'doughnut',
      data: {
        labels: ['Confirmed', 'Checked In', 'Checked Out', 'Cancelled'],
        datasets: [
          {
            data: [confirmed, checkedIn, checkedOut, cancelled],
            backgroundColor: ['#06b6d4', '#f59e0b', '#10b981', '#ef4444'],
            borderWidth: 2
          }
        ]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'bottom' }
        }
      }
    };
  }

  // Report Metrics
  get totalBookings() {
    return this.bookings.length;
  }

  get averageStayDuration() {
    if (this.bookings.length === 0) return 0;
    const totalDays = this.bookings.reduce((sum, b) => {
      const checkIn = new Date(b.checkInDate);
      const checkOut = new Date(b.checkOutDate);
      return sum + Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
    }, 0);
    return Math.round(totalDays / this.bookings.length);
  }

  get totalRevenue() {
    return this.invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
  }

  get averageRevenuePerBooking() {
    return this.bookings.length > 0 ? Math.round(this.totalRevenue / this.bookings.length) : 0;
  }

  get roomUtilizationRate() {
    if (this.rooms.length === 0) return 0;
    const occupiedRooms = this.rooms.filter(r => r.status === 'occupied').length;
    return Math.round((occupiedRooms / this.rooms.length) * 100);
  }

  get cancelledBookingsRate() {
    if (this.bookings.length === 0) return 0;
    const cancelled = this.bookings.filter(b => b.status === 'cancelled').length;
    return Math.round((cancelled / this.bookings.length) * 100);
  }

  get outstandingInvoices() {
    return this.invoices
      .filter(inv => inv.status === 'issued' || inv.status === 'unpaid')
      .reduce((sum, inv) => sum + inv.totalAmount, 0);
  }
}
