import { CommonModule, CurrencyPipe } from '@angular/common';
import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize, timeout } from 'rxjs';
import { RoomService } from '@core/services/room.service';
import { Room, RoomPayload, RoomStatus, RoomType } from '@core/models/room.model';
import { AuthService } from '@core/services/auth.service';
import { ROLES } from '@core/services/role.service';

const emptyRoomForm: RoomPayload = {
  roomNumber: '',
  type: 'single',
  pricePerNight: 0,
  capacity: 1,
  status: 'available',
  description: ''
};

@Component({
  selector: 'app-rooms',
  imports: [CommonModule, CurrencyPipe, FormsModule],
  templateUrl: './rooms.component.html',
  styleUrl: './rooms.component.css',
})
export class RoomsComponent implements OnInit, OnDestroy {
  rooms: Room[] = [];
  form: RoomPayload = { ...emptyRoomForm };
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
      finalize(() => { this.isSaving = false; })
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
      }
    });
  }

  editRoom(room: Room) {
    this.selectedRoomId = room._id;
    this.form = {
      roomNumber: room.roomNumber,
      type: room.type,
      pricePerNight: room.pricePerNight,
      capacity: room.capacity,
      status: room.status,
      description: room.description || ''
    };
    this.showRoomForm = true;
  }

  toggleRoomForm() {
    if (!this.canManageRooms) {
      this.errorMessage = 'You do not have permission to manage rooms';
      return;
    }
    this.showRoomForm = !this.showRoomForm;
    if (!this.showRoomForm) this.resetForm();
  }

  deleteRoom(room: Room) {
    if (!this.canManageRooms) {
      this.errorMessage = 'You do not have permission to manage rooms';
      return;
    }
    this.roomPendingDelete = room;
  }

  cancelDeleteRoom() {
    if (this.isDeleting) return;
    this.roomPendingDelete = null;
  }

  confirmDeleteRoom() {
    if (!this.roomPendingDelete || this.isDeleting) return;

    this.isDeleting = true;
    this.errorMessage = '';

    this.roomService.delete(this.roomPendingDelete._id).pipe(
      timeout(15000),
      finalize(() => { this.isDeleting = false; })
    ).subscribe({
      next: () => {
        this.roomPendingDelete = null;
        this.loadRooms();
      },
      error: (err) => {
        this.errorMessage = err.name === 'TimeoutError'
          ? 'Room delete timed out. Check that the backend and MongoDB are running, then try again.'
          : err.error?.message || 'Unable to delete room';
      }
    });
  }

  resetForm() {
    this.selectedRoomId = null;
    this.form = { ...emptyRoomForm };
  }

  get availableCount() { return this.rooms.filter(r => r.status === 'available').length; }
  get occupiedCount() { return this.rooms.filter(r => r.status === 'occupied' || r.status === 'reserved').length; }
  get maintenanceCount() { return this.rooms.filter(r => r.status === 'maintenance').length; }
  get canManageRooms() { return this.authService.isRole([ROLES.SUPER_ADMIN, ROLES.MANAGER]); }
}