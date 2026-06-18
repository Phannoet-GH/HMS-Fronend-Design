import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin } from 'rxjs';
import { ResourceConfig, ResourceManagerComponent } from '../../shared/resource-manager/resource-manager.component';
import { BookingService } from '@core/services/booking.service';
import { InventoryService } from '@core/services/inventory.service';
import { Booking } from '@core/models/booking.model';

@Component({
  selector: 'app-room-services',
  standalone: true,
  imports: [CommonModule, ResourceManagerComponent],
  templateUrl: './room-services.component.html',
  styleUrl: './room-services.component.css'
})
export class RoomServicesComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly bookingService = inject(BookingService);
  private readonly inventoryService = inject(InventoryService);

  private inventoryMap = new Map<string, number>();
  private roomGuestMap = new Map<string, string>();

  loadError = false;
  config!: ResourceConfig;

  ngOnInit(): void {
    this.config = this.buildConfig();
    this.fetchFormOptions();
  }

  private buildConfig(): ResourceConfig {
    return {
      title: 'Room Services',
      description: 'Manage in-room dining and amenity delivery orders.',
      endpoint: 'room-services',
      createLabel: 'New Order',
      emptyLabel: 'Room Service Order',
      fields: [
        {
          key: 'roomNumber',
          label: 'Room Number',
          required: true,
          type: 'select',
          options: [],
          onFieldChange: (value: string) => {
            return { guestName: this.roomGuestMap.get(value) || '' };
          }
        },
        { key: 'guestName', label: 'Guest Name', required: true, type: 'select', options: [] },
        {
          key: 'items',
          label: 'Items',
          required: true,
          type: 'select',
          options: [],
          onFieldChange: (value: string) => {
            return { totalAmount: this.inventoryMap.get(value) ?? 0 };
          }
        },
        { key: 'totalAmount', label: 'Total Amount', required: true, type: 'number' },
        { key: 'status', label: 'Status', type: 'select', options: ['requested', 'preparing', 'delivered', 'cancelled'] },
        { key: 'notes', label: 'Notes', type: 'textarea' }
      ],
      columns: [
        { key: 'roomNumber', label: 'Room' },
        { key: 'guestName', label: 'Guest' },
        { key: 'items', label: 'Items' },
        { key: 'totalAmount', label: 'Amount', type: 'currency' },
        { key: 'requestedAt', label: 'Requested', type: 'date' },
        { key: 'status', label: 'Status', type: 'badge' }
      ],
      summaries: [
        { label: 'Orders', value: (records) => records.length },
        { label: 'Preparing', value: (records) => records.filter(r => r['status'] === 'preparing').length },
        { label: 'Delivered', value: (records) => records.filter(r => r['status'] === 'delivered').length },
        { label: 'Revenue', value: (records) => `$${records.reduce((sum, r) => sum + Number(r['totalAmount'] || 0), 0).toLocaleString()}` }
      ]
    };
  }

  private fetchFormOptions(): void {
    forkJoin({
      bookings: this.bookingService.getBookings({ status: 'checked_in' }),
      inventory: this.inventoryService.getAll({ status: 'in-stock' })
    }).pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          const bookings = Array.isArray(res.bookings) ? res.bookings : (res.bookings as any)?.data ?? [];
          const inventory = Array.isArray(res.inventory) ? res.inventory : (res.inventory as any)?.data ?? [];

          // 1. Sync Room and Guest
          this.roomGuestMap.clear();
          bookings.forEach((b: Booking) => {
            if (b.room?.roomNumber) {
              this.roomGuestMap.set(String(b.room.roomNumber), b.guest?.fullName || 'Unknown');
            }
          });

          // 2. Update Field Options
          const roomField = this.config.fields.find(f => f.key === 'roomNumber');
          if (roomField) roomField.options = Array.from(this.roomGuestMap.keys());

          const guestField = this.config.fields.find(f => f.key === 'guestName');
          if (guestField) guestField.options = [...new Set(Array.from(this.roomGuestMap.values()))];

          // 3. Map Inventory Items
          this.inventoryMap.clear();
          inventory.forEach((item: any) => {
            const price = Number(item.price ?? item.unitCost ?? 0);
            const label = `${item.name} ($${price.toFixed(2)})`;
            this.inventoryMap.set(label, price);
          });

          const itemsField = this.config.fields.find(f => f.key === 'items');
          if (itemsField) itemsField.options = Array.from(this.inventoryMap.keys());
        },
        error: (err) => {
          this.loadError = true;
          console.error('[RoomServicesComponent] Failed to load data', err);
        }
      });
  }
}