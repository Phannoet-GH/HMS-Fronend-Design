import { CommonModule, CurrencyPipe } from '@angular/common';
import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize, timeout } from 'rxjs';
import { RoomService } from '@core/services/room.service';
import { Room, RoomPayload, RoomStatus, RoomType } from '@core/models/room.model';
import { AuthService } from '@core/services/auth.service';
import { ROLES } from '@core/services/role.service';

// 1. Turned into a Factory Function to avoid state mutation reference sharing
const createEmptyRoomForm = (): RoomPayload => ({
  roomNumber: '',
  type: 'single',
  pricePerNight: 0,
  capacity: 1,
  status: 'available',
  description: ''
});

@Component({
  selector: 'app-rooms',
  imports: [CommonModule, CurrencyPipe, FormsModule],
  templateUrl: './rooms.component.html',
  styleUrl: './rooms.component.css',
})
export class RoomsComponent implements OnInit, OnDestroy {
  rooms: Room[] = [];
  form: RoomPayload = createEmptyRoomForm(); // Initialized via factory
  selectedRoomId: string | null = null;
  isLoading = false;
  isSaving = false;
  isDeleting = false;
  showRoomForm = false;
  roomPendingDelete: Room | null = null;
  errorMessage = '';
  private refreshTimer?: ReturnType<typeof setInterval>;

  readonly roomTypes: RoomType[] = ['single', 'double', 'suite', 'deluxe'];
  readonly roomStatuses: RoomStatus[] = ['available', 'occupied', 'maintenance', 'reserved'];

  constructor(
    private roomService: RoomService,
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.loadRooms();
    this.refreshTimer = setInterval(() => this.autoRefresh(), 15000);
  }

  ngOnDestroy() {
    clearInterval(this.refreshTimer);
  }

  loadRooms(silent = false) {
    if (!silent) {
      this.isLoading = true;
      this.errorMessage = '';
      this.cdr.detectChanges();
    }

    this.roomService.getAll().pipe(
      timeout(8000),
      finalize(() => {
        this.isLoading = false;
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: (rooms) => {
        this.rooms = rooms;
        this.errorMessage = '';
        this.cdr.detectChanges();
      },
      error: (err) => {
        if (err.status === 401) {
          this.authService.logout();
          this.errorMessage = 'Your login expired. Please login again to load room data.';
          this.cdr.detectChanges();
          this.router.navigate(['/login'], { queryParams: { returnUrl: '/rooms' } });
          return;
        }
        if (!silent) {
          this.errorMessage = err.name === 'TimeoutError'
            ? 'Room data timed out. Check that the backend is running, then refresh.'
            : err.error?.message || 'Unable to load rooms';
        }
        this.cdr.detectChanges();
      }
    });
  }

  private autoRefresh() {
    if (this.showRoomForm || this.isSaving || this.isLoading) return;
    this.loadRooms(true);
  }

  saveRoom(form: NgForm) {
    if (!this.canManageRooms) {
      this.errorMessage = 'You do not have permission to manage rooms';
      return;
    }

    if (form.invalid || this.isSaving) {
      form.control.markAllAsTouched();
      return;
    }

    this.isSaving = true;
    this.errorMessage = '';
    this.cdr.detectChanges();

    const payload: RoomPayload = {
      roomNumber: this.form.roomNumber.trim(),
      type: this.form.type,
      pricePerNight: Number(this.form.pricePerNight),
      capacity: Number(this.form.capacity),
      status: this.form.status,
      description: this.form.description?.trim() || ''
    };

    const request = this.selectedRoomId
      ? this.roomService.update(this.selectedRoomId, payload)
      : this.roomService.create(payload);

    request.pipe(
      timeout(15000),
      finalize(() => {
        this.isSaving = false;
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: () => {
        this.resetForm();
        this.showRoomForm = false;
        this.loadRooms();
      },
      error: (err) => {
        this.errorMessage = err.name === 'TimeoutError'
          ? 'Room save timed out. Check that the backend and MongoDB are running, then try again.'
          : err.error?.message || 'Unable to save room';
        this.cdr.detectChanges();
      }
    });
  }

  editRoom(room: Room) {
    this.selectedRoomId = room._id;
    // Direct value assignment decoupling
    this.form = {
      roomNumber: room.roomNumber,
      type: room.type,
      pricePerNight: room.pricePerNight,
      capacity: room.capacity,
      status: room.status,
      description: room.description || ''
    };
    this.showRoomForm = true;
    this.errorMessage = '';
    this.cdr.detectChanges(); // Ensure fields populate immediately
  }

  toggleRoomForm() {
    if (!this.canManageRooms) {
      this.errorMessage = 'You do not have permission to manage rooms';
      return;
    }
    this.showRoomForm = !this.showRoomForm;
    if (!this.showRoomForm) this.resetForm();
    this.cdr.detectChanges();
  }

  deleteRoom(room: Room) {
    if (!this.canManageRooms) {
      this.errorMessage = 'You do not have permission to manage rooms';
      return;
    }
    this.roomPendingDelete = room;
    this.cdr.detectChanges();
  }

  cancelDeleteRoom() {
    if (this.isDeleting) return;
    this.roomPendingDelete = null;
    this.cdr.detectChanges();
  }

  confirmDeleteRoom() {
    if (!this.roomPendingDelete?._id || this.isDeleting) return;

    const id = this.roomPendingDelete._id;
    this.isDeleting = true;
    this.errorMessage = '';
    this.cdr.detectChanges();

    this.roomService.delete(id).pipe(
      timeout(15000),
      finalize(() => {
        this.isDeleting = false;
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: () => {
        this.rooms = this.rooms.filter(r => r._id !== id);
        this.roomPendingDelete = null;
        this.loadRooms();
      },
      error: (err) => {
        this.errorMessage = err.name === 'TimeoutError'
          ? 'Room delete timed out. Check that the backend and MongoDB are running, then try again.'
          : err.error?.message || 'Unable to delete room';
        this.cdr.detectChanges();
      }
    });
  }

  resetForm() {
    this.selectedRoomId = null;
    this.form = createEmptyRoomForm(); // Safely clear using factory values
    this.errorMessage = '';
    this.cdr.detectChanges(); // Sync view template updates
  }

  get availableCount() { return this.rooms.filter(r => r.status === 'available').length; }
  get occupiedCount() { return this.rooms.filter(r => r.status === 'occupied' || r.status === 'reserved').length; }
  get maintenanceCount() { return this.rooms.filter(r => r.status === 'maintenance').length; }
  get canManageRooms() { return this.authService.isRole([ROLES.SUPER_ADMIN, ROLES.MANAGER]); }
}