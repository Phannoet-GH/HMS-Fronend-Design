import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize, forkJoin, timeout } from 'rxjs';
import { API_BASE_URL } from '../../core/api.config';
import { AuthService } from '../../core/services/auth.service';
import { Booking, BookingService } from '../../core/services/booking.service';
import { ResourceRecord, ResourceService } from '../../core/services/resource.service';
import { Room, RoomService } from '../../core/services/room.service';
import { HttpClient } from '@angular/common/http';

type InventoryItem = ResourceRecord & {
  name: string;
  quantity: number;
  unitCost: number;
  status: string;
};

type RoomServiceLine = {
  inventoryItemId: string;
  itemName: string;
  quantity: number;
  price: number;
};

type RoomServiceStatus = 'requested' | 'preparing' | 'delivered' | 'cancelled' | 'ordered';

type RoomServiceOrder = ResourceRecord & {
  roomId: string | Room;
  roomNumber: string;
  guestName?: string;
  items: RoomServiceLine[];
  totalAmount: number;
  status: RoomServiceStatus;
  notes?: string;
  createdAt: string;
};

@Component({
  selector: 'app-room-services',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './room-services.component.html',
  styleUrl: './room-services.component.css'
})
export class RoomServicesComponent implements OnInit, OnDestroy {
  orders: RoomServiceOrder[] = [];
  rooms: Room[] = [];
  bookings: Booking[] = [];
  inventory: InventoryItem[] = [];
  selectedRoomId = '';
  guestName = '';
  notes = '';
  status: RoomServiceStatus = 'requested';
  lines: RoomServiceLine[] = [this.emptyLine()];
  isLoading = false;
  isSaving = false;
  updatingOrderId = '';
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
      orders: this.resourceService.list<RoomServiceOrder>('room-services'),
      rooms: this.roomService.getRooms(),
      bookings: this.bookingService.getBookings({ status: 'checked-in' }),
      inventory: this.resourceService.list<InventoryItem>('inventory')
    }).pipe(
      timeout(10000),
      finalize(() => {
        this.isLoading = false;
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: ({ orders, rooms, bookings, inventory }) => {
        this.orders = Array.isArray(orders.data) ? orders.data : [];
        this.rooms = Array.isArray(rooms.data) ? rooms.data : [];
        this.bookings = Array.isArray(bookings.data) ? bookings.data : [];
        this.inventory = Array.isArray(inventory.data) ? inventory.data : [];
        this.errorMessage = '';
      },
      error: (err) => this.handleError(err, 'Unable to load room service data', silent)
    });
  }

  private autoRefresh() {
    if (this.isSaving || this.isLoading) return;
    this.loadData(true);
  }

  private handleError(err: any, fallbackMessage: string, silent = false) {
    if (err.status === 401) {
      this.authService.logout();
      this.router.navigate(['/login'], { queryParams: { returnUrl: '/room-services' } });
      return;
    }

    if (!silent) {
      this.errorMessage = err.name === 'TimeoutError'
        ? 'Room service request timed out. Check that the backend and MongoDB are running, then try again.'
        : err.error?.message || fallbackMessage;
    }
  }

  createOrder(form: NgForm) {
    if (this.isSaving) return;

    if (form.invalid || !this.canCreateOrder) {
      form.control.markAllAsTouched();
      this.errorMessage = this.orderDisabledReason || 'Complete the room service order';
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
      guestName: this.guestName.trim(),
      items: this.validLines,
      totalAmount: this.totalAmount,
      status: this.status,
      notes: this.notes.trim()
    };

    this.resourceService.create<RoomServiceOrder>('room-services', payload as RoomServiceOrder).pipe(
      timeout(15000),
      finalize(() => {
        this.isSaving = false;
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: () => {
        this.successMessage = 'Room service order created';
        this.resetForm();
        this.loadData();
      },
      error: (err) => this.handleError(err, 'Unable to create room service order')
    });
  }

  updateStatus(order: RoomServiceOrder, status: RoomServiceStatus) {
    if (!order._id || this.updatingOrderId) return;
    this.updatingOrderId = order._id;
    this.errorMessage = '';
    this.successMessage = '';

    this.http.put(`${API_BASE_URL}/room-services/${order._id}`, { status }).pipe(
      timeout(15000),
      finalize(() => {
        this.updatingOrderId = '';
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: () => {
        this.successMessage = `Order marked ${status}`;
        this.loadData();
      },
      error: (err) => this.handleError(err, 'Unable to update room service order')
    });
  }

  selectRoom(roomId: string) {
    this.selectedRoomId = roomId;
    const booking = this.bookings.find((entry) => entry.room?._id === roomId);
    this.guestName = booking?.guest.fullName || 'Walk-in guest';
    this.errorMessage = '';
  }

  addLine() {
    this.lines = [...this.lines, this.emptyLine()];
  }

  removeLine(index: number) {
    if (this.lines.length === 1) {
      this.lines = [this.emptyLine()];
      return;
    }
    this.lines = this.lines.filter((_, lineIndex) => lineIndex !== index);
  }

  selectItem(index: number, inventoryItemId: string) {
    const item = this.inventory.find((entry) => entry._id === inventoryItemId);
    if (!item) return;

    this.lines[index] = {
      inventoryItemId,
      itemName: item.name,
      quantity: Math.max(1, Number(this.lines[index].quantity) || 1),
      price: Number(item.unitCost || 0)
    };
  }

  resetForm() {
    this.selectedRoomId = '';
    this.guestName = '';
    this.notes = '';
    this.status = 'requested';
    this.lines = [this.emptyLine()];
  }

  private emptyLine(): RoomServiceLine {
    return { inventoryItemId: '', itemName: '', quantity: 1, price: 0 };
  }

  get serviceRooms() {
    const checkedInRoomIds = new Set(this.bookings.map((booking) => booking.room?._id).filter(Boolean));
    const occupiedRooms = this.rooms.filter((room) => room.status === 'occupied' || checkedInRoomIds.has(room._id));
    return occupiedRooms.length > 0 ? occupiedRooms : this.rooms;
  }

  get availableInventory() {
    return this.inventory.filter((item) => item.status !== 'out-of-stock' && Number(item.quantity ?? 1) > 0);
  }

  get selectedRoom() {
    return this.rooms.find((room) => room._id === this.selectedRoomId) || null;
  }

  get validLines() {
    return this.lines
      .filter((line) => line.inventoryItemId && line.itemName && Number(line.quantity) > 0)
      .map((line) => ({
        ...line,
        quantity: Number(line.quantity),
        price: Number(line.price || 0)
      }));
  }

  get totalAmount() {
    return this.validLines.reduce((sum, line) => sum + (line.quantity * line.price), 0);
  }

  itemSummary(order: RoomServiceOrder) {
    if (!Array.isArray(order.items) || order.items.length === 0) {
      return order.notes?.trim() || 'Legacy/manual order';
    }

    const summary = order.items
      .map((item) => {
        const quantity = Number(item.quantity || 0);
        const name = item.itemName || 'Item';
        return quantity > 0 ? `${quantity}x ${name}` : name;
      })
      .join(', ');

    return summary || 'Legacy/manual order';
  }

  orderTotal(order: RoomServiceOrder) {
    if (Number(order.totalAmount) > 0) return Number(order.totalAmount);
    if (!Array.isArray(order.items)) return 0;

    return order.items.reduce((sum, item) => sum + (Number(item.quantity || 0) * Number(item.price || 0)), 0);
  }

  displayStatus(order: RoomServiceOrder) {
    return order.status === 'ordered' ? 'requested' : order.status;
  }

  canPrepare(order: RoomServiceOrder) {
    return ['requested', 'ordered'].includes(order.status);
  }

  canDeliver(order: RoomServiceOrder) {
    return ['requested', 'preparing', 'ordered'].includes(order.status);
  }

  canCancel(order: RoomServiceOrder) {
    return !['delivered', 'cancelled'].includes(order.status);
  }

  isLegacyOrder(order: RoomServiceOrder) {
    return !Array.isArray(order.items) || order.items.length === 0 || order.items.some((item) => !item.itemName);
  }

  get canCreateOrder() {
    return !!this.selectedRoomId && this.validLines.length > 0 && this.totalAmount >= 0;
  }

  get orderDisabledReason() {
    if (this.isSaving) return 'Saving order...';
    if (!this.selectedRoomId) return 'Select a room';
    if (this.validLines.length === 0) return 'Add at least one item';
    return '';
  }

  get requestedCount() {
    return this.orders.filter((order) => ['requested', 'ordered'].includes(order.status)).length;
  }

  get preparingCount() {
    return this.orders.filter((order) => order.status === 'preparing').length;
  }

  get deliveredCount() {
    return this.orders.filter((order) => order.status === 'delivered').length;
  }

  get revenueTotal() {
    return this.orders.reduce((sum, order) => sum + this.orderTotal(order), 0);
  }

  get queueOrders() {
    const rank: Record<string, number> = {
      requested: 1,
      ordered: 1,
      preparing: 2,
      delivered: 3,
      cancelled: 4
    };

    return [...this.orders].sort((a, b) => {
      const statusRank = (rank[a.status] || 9) - (rank[b.status] || 9);
      if (statusRank !== 0) return statusRank;
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    });
  }
}
