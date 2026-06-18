import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize, forkJoin, timeout } from 'rxjs';
import { API_BASE_URL } from '../../core/api.config';
import { AuthService } from '../../core/services/auth.service';
import { Booking, BookingService } from '../../core/services/booking.service';
import { ResourceRecord, ResourceService } from '../../core/services/resource.service';
import { Room, RoomService } from '../../core/services/room.service';

type ServiceRequest = ResourceRecord & {
  roomId: string | Room;
  roomNumber: string;
  guestName?: string;
  type: 'housekeeping' | 'maintenance' | 'room-service' | 'luggage' | 'wake-up-call' | 'other';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  notes: string;
  status: 'open' | 'in-progress' | 'completed' | 'cancelled';
  assignedTo?: { fullName?: string; username?: string; email?: string } | string | null;
  createdAt: string;
};

@Component({
  selector: 'app-service-requests',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './service-requests.component.html',
  styleUrl: './service-requests.component.css'
})
export class ServiceRequestsComponent implements OnInit, OnDestroy {
  requests: ServiceRequest[] = [];
  rooms: Room[] = [];
  bookings: Booking[] = [];
  selectedRoomId = '';
  type: ServiceRequest['type'] = 'housekeeping';
  priority: ServiceRequest['priority'] = 'normal';
  status: ServiceRequest['status'] = 'open';
  notes = '';
  isLoading = false;
  isSaving = false;
  updatingRequestId = '';
  errorMessage = '';
  successMessage = '';
  private refreshTimer?: ReturnType<typeof setInterval>;

  constructor(
    private http: HttpClient,
    private resourceService: ResourceService,
    private roomService: RoomService,
    private bookingService: BookingService,
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadData();
    this.refreshTimer = setInterval(() => this.autoRefresh(), 15000);
  }

  ngOnDestroy() {
    if (this.refreshTimer) clearInterval(this.refreshTimer);
  }

  loadData(silent = false) {
    if (!silent) {
      this.isLoading = true;
      this.errorMessage = '';
      this.cdr.detectChanges();
    }

    forkJoin({
      requests: this.resourceService.list<ServiceRequest>('service-requests'),
      rooms: this.roomService.getRooms(),
      bookings: this.bookingService.getBookings({ status: 'checked-in' })
    }).pipe(
      timeout(10000),
      finalize(() => {
        this.isLoading = false;
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: ({ requests, rooms, bookings }) => {
        this.requests = Array.isArray(requests.data) ? requests.data : [];
        this.rooms = Array.isArray(rooms.data) ? rooms.data : [];
        this.bookings = Array.isArray(bookings.data) ? bookings.data : [];
        this.errorMessage = '';
      },
      error: (err) => this.handleError(err, 'Unable to load service requests', silent)
    });
  }

  private autoRefresh() {
    if (this.isSaving || this.isLoading) return;
    this.loadData(true);
  }

  private handleError(err: any, fallbackMessage: string, silent = false) {
    if (err.status === 401) {
      this.authService.logout();
      this.router.navigate(['/login'], { queryParams: { returnUrl: '/service-requests' } });
      return;
    }

    if (!silent) {
      this.errorMessage = err.name === 'TimeoutError'
        ? 'Service request timed out. Check that the backend and MongoDB are running, then try again.'
        : err.error?.message || fallbackMessage;
    }
  }

  createRequest(form: NgForm) {
    if (this.isSaving) return;

    if (form.invalid || !this.canCreateRequest) {
      form.control.markAllAsTouched();
      this.errorMessage = this.requestDisabledReason || 'Complete the service request';
      return;
    }

    const room = this.selectedRoom;
    if (!room) {
      this.errorMessage = 'Select a valid room';
      return;
    }

    this.isSaving = true;
    this.errorMessage = '';
    this.successMessage = '';

    const payload = {
      roomId: room._id,
      roomNumber: room.roomNumber,
      guestName: this.guestForRoom(room.roomNumber),
      type: this.type,
      priority: this.priority,
      status: this.status,
      notes: this.notes.trim()
    };

    this.resourceService.create<ServiceRequest>('service-requests', payload as ServiceRequest).pipe(
      timeout(15000),
      finalize(() => {
        this.isSaving = false;
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: () => {
        this.successMessage = 'Service request created';
        this.resetForm();
        this.loadData();
      },
      error: (err) => this.handleError(err, 'Unable to create service request')
    });
  }

  updateStatus(request: ServiceRequest, status: ServiceRequest['status']) {
    if (!request._id || this.updatingRequestId) return;

    this.updatingRequestId = request._id;
    this.errorMessage = '';
    this.successMessage = '';

    this.http.put(`${API_BASE_URL}/service-requests/${request._id}`, { status }).pipe(
      timeout(15000),
      finalize(() => {
        this.updatingRequestId = '';
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: () => {
        this.successMessage = `Request marked ${status}`;
        this.loadData();
      },
      error: (err) => this.handleError(err, 'Unable to update service request')
    });
  }

  resetForm() {
    this.selectedRoomId = '';
    this.type = 'housekeeping';
    this.priority = 'normal';
    this.status = 'open';
    this.notes = '';
  }

  guestForRoom(roomNumber: string) {
    return this.bookings.find((booking) => booking.room?.roomNumber === roomNumber)?.guest.fullName || 'Walk-in guest';
  }

  assignedLabel(request: ServiceRequest) {
    if (!request.assignedTo) return 'Unassigned';
    if (typeof request.assignedTo === 'string') return request.assignedTo;
    return request.assignedTo.fullName || request.assignedTo.username || request.assignedTo.email || 'Assigned';
  }

  typeLabel(request: ServiceRequest) {
    return request.type.replace(/-/g, ' ');
  }

  canStart(request: ServiceRequest) {
    return request.status === 'open';
  }

  canComplete(request: ServiceRequest) {
    return request.status === 'open' || request.status === 'in-progress';
  }

  canCancel(request: ServiceRequest) {
    return request.status !== 'completed' && request.status !== 'cancelled';
  }

  get serviceRooms() {
    const checkedInRoomIds = new Set(this.bookings.map((booking) => booking.room?._id).filter(Boolean));
    const activeRooms = this.rooms.filter((room) => room.status === 'occupied' || checkedInRoomIds.has(room._id));
    return activeRooms.length > 0 ? activeRooms : this.rooms;
  }

  get selectedRoom() {
    return this.rooms.find((room) => room._id === this.selectedRoomId) || null;
  }

  get canCreateRequest() {
    return !!this.selectedRoomId && !!this.type && !!this.priority && !!this.status;
  }

  get queueRequests() {
    const statusRank: Record<ServiceRequest['status'], number> = {
      open: 1,
      'in-progress': 2,
      completed: 3,
      cancelled: 4
    };
    const priorityRank: Record<ServiceRequest['priority'], number> = {
      urgent: 1,
      high: 2,
      normal: 3,
      low: 4
    };

    return [...this.requests].sort((a, b) => {
      const statusDiff = statusRank[a.status] - statusRank[b.status];
      if (statusDiff !== 0) return statusDiff;

      const priorityDiff = priorityRank[a.priority] - priorityRank[b.priority];
      if (priorityDiff !== 0) return priorityDiff;

      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    });
  }

  get requestDisabledReason() {
    if (this.isSaving) return 'Saving request...';
    if (!this.selectedRoomId) return 'Select a room';
    return '';
  }

  get openCount() {
    return this.requests.filter((request) => request.status === 'open').length;
  }

  get inProgressCount() {
    return this.requests.filter((request) => request.status === 'in-progress').length;
  }

  get urgentCount() {
    return this.requests.filter((request) => request.priority === 'urgent').length;
  }

  get completedCount() {
    return this.requests.filter((request) => request.status === 'completed').length;
  }
}
