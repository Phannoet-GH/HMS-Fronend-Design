import { CommonModule, CurrencyPipe } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Room, RoomPayload, RoomService, RoomStatus, RoomType } from '../../core/services/room.service';

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
  showRoomForm = false;
  errorMessage = '';
  private refreshTimer?: ReturnType<typeof setInterval>;

  readonly roomTypes: RoomType[] = ['single', 'double', 'suite', 'deluxe'];
  readonly roomStatuses: RoomStatus[] = ['available', 'occupied', 'maintenance', 'reserved'];

  constructor(private roomService: RoomService) {}

  ngOnInit() {
    this.loadRooms();
    this.refreshTimer = setInterval(() => this.autoRefresh(), 15000);
  }

  ngOnDestroy() {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
    }
  }

  loadRooms(silent = false) {
    if (!silent) {
      this.isLoading = true;
      this.errorMessage = '';
    }

    this.roomService.getRooms().subscribe({
      next: (res) => {
        this.rooms = res.data;
        this.isLoading = false;
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Unable to load rooms';
        this.isLoading = false;
      }
    });
  }

  private autoRefresh() {
    if (this.showRoomForm || this.isSaving || this.isLoading) return;
    this.loadRooms(true);
  }

  saveRoom() {
    this.isSaving = true;
    this.errorMessage = '';

    const request = this.selectedRoomId
      ? this.roomService.updateRoom(this.selectedRoomId, this.form)
      : this.roomService.createRoom(this.form);

    request.subscribe({
      next: () => {
        this.resetForm();
        this.loadRooms();
        this.isSaving = false;
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Unable to save room';
        this.isSaving = false;
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
    this.showRoomForm = !this.showRoomForm;
    if (!this.showRoomForm) {
      this.resetForm();
    }
  }

  deleteRoom(room: Room) {
    if (!confirm(`Delete room ${room.roomNumber}?`)) return;

    this.roomService.deleteRoom(room._id).subscribe({
      next: () => this.loadRooms(),
      error: (err) => {
        this.errorMessage = err.error?.message || 'Unable to delete room';
      }
    });
  }

  resetForm() {
    this.selectedRoomId = null;
    this.form = { ...emptyRoomForm };
  }

  get availableCount() {
    return this.rooms.filter((room) => room.status === 'available').length;
  }

  get occupiedCount() {
    return this.rooms.filter((room) => room.status === 'occupied' || room.status === 'reserved').length;
  }

  get maintenanceCount() {
    return this.rooms.filter((room) => room.status === 'maintenance').length;
  }
}
