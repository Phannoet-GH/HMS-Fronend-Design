import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize, forkJoin, timeout } from 'rxjs';
import { BookingService } from '@core/services/booking.service';
import { InvoiceService } from '@core/services/invoice.service';
import { RoomService } from '@core/services/room.service';
import { EmployeeService } from '@core/services/employee.service';
import { CheckInService } from '@core/services/checkin.service';
import { AuthService } from '@core/services/auth.service';
import { Booking, BookingPayload } from '@core/models/booking.model';
import { Invoice } from '@core/models/invoice.model';
import { Room } from '@core/models/room.model';
import { Employee } from '@core/models/employee.model';

const today = new Date().toISOString().slice(0, 10);

// 🟢 FIXED: Converted from an object evaluation assignment block into a valid Type Interface blueprint
export interface CheckInPayload {
  bookingId: string;
  roomId: string;
  employeeId: string;
  actualCheckInTime: string;
  keyIssued: boolean;
  depositAmount: number;
  paymentMethod: 'cash' | 'card' | 'bank-transfer' | 'qr-code' | 'none';
  baggageCount: number;
  status: 'completed';
  notes: string;
}
// Add this interface to your component file
interface LoadDataResponse {
  rooms: Room[] | { data: Room[] };
  bookings: Booking[] | { data: Booking[] };
  employees: Employee[] | { data: Employee[] };
}

@Component({
  selector: 'app-check-in',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './check-in.component.html',
  styleUrl: './check-in.component.css',
})
export class CheckInComponent implements OnInit, OnDestroy {
  rooms: Room[] = [];
  bookings: Booking[] = [];
  employees: Employee[] = [];
  isLoading = false;
  isSaving = false;
  isCreatingInvoice = false;
  isCreatingCheckIn = false;
  createdInvoice: Invoice | null = null;
  errorMessage = '';
  successMessage = '';
  private refreshTimer?: ReturnType<typeof setInterval>;

  form: BookingPayload & {
    guests: number;
    notes: string;
    paymentStatus: string;
    employeeId: string;
    keyIssued: boolean;
    actualCheckInTime: string;
    depositAmount: number;
    paymentMethod: 'cash' | 'card' | 'bank-transfer' | 'qr-code' | 'none';
  } = {
      guest: { fullName: '', phone: '', email: '', address: '' },
      roomId: '',
      checkInDate: today,
      checkOutDate: '',
      status: 'checked_in',
      guests: 1,
      notes: '',
      paymentStatus: 'pending',
      employeeId: '',
      keyIssued: false,
      actualCheckInTime: new Date().toISOString().slice(0, 16),
      depositAmount: 0,
      paymentMethod: 'none'
    };

  constructor(
    private bookingService: BookingService,
    private invoiceService: InvoiceService,
    private roomService: RoomService,
    private employeeService: EmployeeService,
    private checkInService: CheckInService,
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.loadData();
    this.refreshTimer = setInterval(() => this.autoRefresh(), 15000);
  }

  ngOnDestroy() {
    clearInterval(this.refreshTimer);
  }

  loadData(silent = false) {
    if (!silent) {
      this.isLoading = true;
      this.errorMessage = '';
      this.cdr.detectChanges();
    }

    forkJoin({
      rooms: this.roomService.getRooms(),
      bookings: this.bookingService.getBookings(),
      employees: this.employeeService.getEmployees()
    }).pipe(
      timeout(10000),
      finalize(() => {
        this.isLoading = false;
        this.cdr.detectChanges();
      })
    ).subscribe({
      // 🟢 Explicitly type the response here
      next: (res: LoadDataResponse) => {
        // Use a helper to extract the array, keeping code clean
        const extract = <T>(val: T[] | { data: T[] }): T[] =>
          Array.isArray(val) ? val : (val as { data: T[] }).data || [];

        this.rooms = extract(res.rooms);
        this.bookings = extract(res.bookings);
        this.employees = extract(res.employees).filter(e => e.status !== 'terminated');

        if (!this.form.employeeId && this.employees.length > 0) {
          this.form.employeeId = this.employees[0]._id || '';
        }
        this.errorMessage = '';
        this.cdr.detectChanges();
      },
      error: (err) => this.handleLoadError(err, silent)
    });
  }

  private autoRefresh() {
    if (this.isSaving || this.isLoading) return;
    this.loadData(true);
  }

  private handleLoadError(err: any, silent = false) {
    if (err.status === 401) {
      this.authService.logout();
      this.router.navigate(['/login'], { queryParams: { returnUrl: '/checkin' } });
      return;
    }
    if (!silent) {
      this.errorMessage = err.name === 'TimeoutError'
        ? 'Check-in data timed out. Check that the backend and MongoDB are running, then refresh.'
        : err.error?.message || 'Unable to load check-in data';
    }
  }

  completeCheckIn(form: NgForm) {
    if (form.invalid || this.isSaving) {
      form.control.markAllAsTouched();
      return;
    }

    if (!this.form.guest.fullName.trim() || !this.form.guest.phone.trim() || !this.form.roomId || !this.form.checkOutDate) {
      this.errorMessage = 'Guest name, phone, room, and check-out date are required';
      return;
    }

    if (!this.form.employeeId) {
      this.errorMessage = 'Please assign a staff member to this check-in';
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
      status: 'confirmed'
    };

    const invoiceNights = this.totalNights;
    const invoiceRoomCharges = this.totalAmount;

    this.bookingService.createBooking(payload).pipe(
      timeout(15000),
      finalize(() => {
        if (!this.isCreatingInvoice && !this.isCreatingCheckIn) {
          this.isSaving = false;
        }
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: (booking) => this.createInvoiceForCheckIn(booking, invoiceNights, invoiceRoomCharges),
      error: (err) => {
        if (err.status === 401) {
          this.authService.logout();
          this.router.navigate(['/login'], { queryParams: { returnUrl: '/checkin' } });
          return;
        }
        this.isSaving = false;
        this.errorMessage = err.name === 'TimeoutError'
          ? 'Check-in timed out. Check that the backend and MongoDB are running, then try again.'
          : err.error?.message || 'Unable to complete check-in';
        this.cdr.detectChanges();
      }
    });
  }

  private createInvoiceForCheckIn(booking: Booking, numberOfNights: number, roomCharges: number) {
    this.isCreatingInvoice = true;

    this.invoiceService.create({
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
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: (invoice) => {
        this.createdInvoice = invoice;
        this.createCheckInRecord(booking);
      },
      error: (err) => {
        this.isSaving = false;
        this.successMessage = 'Guest checked in successfully';
        this.errorMessage = err.name === 'TimeoutError'
          ? 'Check-in succeeded, but invoice creation timed out. Create the invoice from Invoices Management.'
          : err.error?.message || 'Check-in succeeded, but invoice creation failed';
        this.resetForm();
        this.loadData();
        this.cdr.detectChanges();
      }
    });
  }

  private createCheckInRecord(booking: Booking) {
    this.isCreatingCheckIn = true;

    // 🟢 Payload object matches CheckInPayload type layout contract securely
    const payload: CheckInPayload = {
      bookingId: booking._id ?? '',
      roomId: this.form.roomId,
      employeeId: this.form.employeeId,
      actualCheckInTime: this.form.actualCheckInTime
        ? new Date(this.form.actualCheckInTime).toISOString()
        : new Date().toISOString(),
      keyIssued: this.form.keyIssued,
      depositAmount: Number(this.form.depositAmount || 0),
      paymentMethod: this.form.paymentMethod || 'none',
      baggageCount: 0,
      status: 'completed' as const,
      notes: this.form.notes?.trim() || ''
    };

    this.checkInService.createCheckIn(payload).pipe(
      timeout(15000),
      finalize(() => {
        this.isCreatingCheckIn = false;
        this.isSaving = false;
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: (record) => {
        console.log('✅ Check-in transaction verified:', record);
        this.successMessage = 'Guest checked in, invoice created, and check-in record saved';
        this.resetForm();
        this.loadData();
      },
      error: (err) => {
        console.error('❌ Check-in transaction failed:', err);
        this.successMessage = 'Guest checked in and invoice created';
        this.errorMessage = 'Transaction saved safely, but check-in operations log could not be updated.';
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

  resetForm() {
    this.form = {
      guest: { fullName: '', phone: '', email: '', address: '' },
      roomId: '',
      checkInDate: today,
      checkOutDate: '',
      status: 'checked_in',
      guests: 1,
      notes: '',
      paymentStatus: 'pending',
      employeeId: this.employees[0]?._id ?? '',
      keyIssued: false,
      actualCheckInTime: new Date().toISOString().slice(0, 16),
      depositAmount: 0,
      paymentMethod: 'none'
    };
    this.cdr.detectChanges();
  }

  selectRoom(roomId: string) {
    this.form.roomId = roomId;
    this.errorMessage = '';
  }

  get availableRooms() { return this.rooms.filter(r => r.status === 'available'); }
  get selectedRoom() { return this.rooms.find(r => r._id === this.form.roomId) || null; }
  get isBusy() { return this.isSaving || this.isCreatingInvoice || this.isCreatingCheckIn; }

  get totalNights() {
    if (!this.form.checkInDate || !this.form.checkOutDate) return 0;
    const nights = Math.ceil(
      (new Date(this.form.checkOutDate).getTime() - new Date(this.form.checkInDate).getTime())
      / (1000 * 60 * 60 * 24)
    );
    return nights > 0 ? nights : 0;
  }

  get totalAmount() { return (this.selectedRoom?.pricePerNight || 0) * this.totalNights; }
  get recentCheckIns() { return this.bookings.filter(b => b.status === 'checked_in').slice(0, 5); }
  get selectedEmployee() {
    return this.employees.find(e => e._id === this.form.employeeId) || null;
  }
  get availableCount() { return (this.rooms || []).filter(r => r.status === 'available').length; }
  get occupiedCount() { return (this.rooms || []).filter(r => ['occupied', 'reserved'].includes(r.status)).length; }
  get cleaningCount() { return (this.rooms || []).filter(r => ['dirty', 'cleaning'].includes(r.status)).length; }
  get maintenanceCount() { return (this.rooms || []).filter(r => r.status === 'maintenance').length; }
}