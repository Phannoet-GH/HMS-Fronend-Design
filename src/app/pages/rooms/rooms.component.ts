import { CommonModule, CurrencyPipe } from '@angular/common';
import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize, timeout } from 'rxjs';
import { RoomService } from '@core/services/room.service';
import { Room } from '@core/models/room.model';
import { AuthService } from '@core/services/auth.service';
import { ROLES } from '@core/services/role.service';

// 🟢 Updated Payload shape to support crucial floor placement sorting
export interface RoomPayload {
  roomNumber: string;
  floorNumber: number;
  type: 'single' | 'double' | 'suite' | 'deluxe';
  pricePerNight: number;
  capacity: number;
  status: 'available' | 'occupied' | 'reserved' | 'dirty' | 'cleaning' | 'maintenance';
  description: string;
}

const createEmptyRoomForm = (): RoomPayload => ({
  roomNumber: '',
  floorNumber: 1, // Defaulting to the ground floor
  type: 'single',
  pricePerNight: 0,
  capacity: 1,
  status: 'available',
  description: ''
});

@Component({
  selector: 'app-rooms',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, FormsModule],
  templateUrl: './rooms.component.html',
  styleUrl: './rooms.component.css',
})
export class RoomsComponent implements OnInit, OnDestroy {
  rooms: Room[] = [];
  searchTerm = '';           // 🟢 Add this
  form: RoomPayload = createEmptyRoomForm();
  selectedRoomId: string | null = null;
  isLoading = false;
  isSaving = false;
  isDeleting = false;
  showRoomForm = false;
  roomPendingDelete: Room | null = null;
  errorMessage = '';
  private refreshTimer?: ReturnType<typeof setInterval>;

  // 🟢 Comprehensive structural constants matching your Mongoose strict enums
  readonly roomTypes: RoomPayload['type'][] = ['single', 'double', 'suite', 'deluxe'];
  readonly roomStatuses: RoomPayload['status'][] = ['available', 'occupied', 'reserved', 'dirty', 'cleaning', 'maintenance'];

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
  applyFilter() {
    const term = this.searchTerm.toLowerCase().trim();
    // 🟢 Safety check: Always use (this.rooms || []) to prevent 'filter of undefined'
    this.rooms = (this.rooms || []).filter(room =>
      room.roomNumber.toLowerCase().includes(term) ||
      room.type.toLowerCase().includes(term) ||
      room.status.toLowerCase().includes(term)
    );
  }

  loadRooms(silent = false) {
    // ... existing loading logic ...
    this.roomService.getRooms().pipe(
      timeout(8000),
      finalize(() => { this.isLoading = false; this.cdr.detectChanges(); })
    ).subscribe({
      next: (res: any) => {
        // 🟢 FIX: Check if the response is the array itself, or an object containing the array
        // If your API returns { data: [] }, use res.data
        // If your API returns [], use res
        this.rooms = Array.isArray(res) ? res : (res.data || []);

        this.errorMessage = '';
        this.cdr.detectChanges();
      },
      // ...
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
      floorNumber: Number(this.form.floorNumber || 1), // Enforces numeric stability
      type: this.form.type,
      pricePerNight: Number(this.form.pricePerNight),
      capacity: Number(this.form.capacity),
      status: this.form.status,
      description: this.form.description?.trim() || ''
    };

    // 🟢 FIXED: Updated endpoint maps targeting .updateRoom() and .createRoom() data services
    const request = this.selectedRoomId
      ? this.roomService.updateRoom(this.selectedRoomId, payload)
      : this.roomService.createRoom(payload);

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
    this.selectedRoomId = room._id || null;
    this.form = {
      roomNumber: room.roomNumber,
      floorNumber: room.floorNumber || 1, // Appends property payload tracking values safely
      type: room.type,
      pricePerNight: room.pricePerNight,
      capacity: room.capacity,
      status: room.status,
      description: room.description || ''
    };
    this.showRoomForm = true;
    this.errorMessage = '';
    this.cdr.detectChanges();
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

    // 🟢 FIXED: Target mapped to call .deleteRoom() explicitly
    this.roomService.deleteRoom(id).pipe(
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
    this.form = createEmptyRoomForm();
    this.errorMessage = '';
    this.cdr.detectChanges();
  }


  // 🟢 DASHBOARD METRICS: Cleaned up logic to explicitly cover housekeeping states
  get availableCount() {
    // 🟢 Add a safety check: (this.rooms || [])
    return (this.rooms || []).filter(r => r.status === 'available').length;
  }

  get occupiedCount() {
    return (this.rooms || []).filter(r => r.status === 'occupied' || r.status === 'reserved').length;
  }
  get cleaningCount() { return this.rooms.filter(r => r.status === 'dirty' || r.status === 'cleaning').length; }
  get maintenanceCount() { return this.rooms.filter(r => r.status === 'maintenance').length; }
  get canManageRooms() { return this.authService.isRole([ROLES.SUPER_ADMIN, ROLES.MANAGER]); }
}