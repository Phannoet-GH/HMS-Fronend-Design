import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { finalize, timeout } from 'rxjs';
import { Guest, GuestPayload, GuestService } from '../../core/services/guest.service';

// Factory function to prevent mutation tracking across components
const createEmptyGuestForm = (): GuestPayload => ({
  fullName: '',
  email: '',
  phone: '',
  idNumber: '',
  address: ''
});

@Component({
  selector: 'app-guests',
  imports: [CommonModule, FormsModule],
  templateUrl: './guests.component.html',
  styleUrl: './guests.component.css'
})
export class GuestsComponent implements OnInit, OnDestroy {
  guests: Guest[] = [];
  form: GuestPayload = createEmptyGuestForm();
  selectedGuestId: string | null = null;
  search = '';
  isLoading = false;
  isSaving = false;
  isDeleting = false;
  showGuestForm = false;
  guestPendingDelete: Guest | null = null;
  errorMessage = '';
  private refreshTimer?: ReturnType<typeof setInterval>;

  constructor(
    private guestService: GuestService,
    private cdr: ChangeDetectorRef // Added for secure rendering
  ) { }

  ngOnInit() {
    this.loadGuests();
    this.refreshTimer = setInterval(() => this.autoRefresh(), 15000);
  }

  ngOnDestroy() {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
    }
  }

  loadGuests(silent = false) {
    if (!silent) {
      this.isLoading = true;
      this.errorMessage = '';
      this.cdr.detectChanges();
    }

    this.guestService.getGuests(this.search.trim()).pipe(
      timeout(10000),
      finalize(() => {
        this.isLoading = false;
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: (res) => {
        this.guests = Array.isArray(res.data) ? res.data : [];
        this.errorMessage = '';
      },
      error: (err) => {
        if (!silent) {
          this.errorMessage = err.name === 'TimeoutError'
            ? 'Guest data timed out. Check that the backend and MongoDB are running, then refresh.'
            : err.error?.message || 'Unable to load guests';
        }
        this.cdr.detectChanges();
      }
    });
  }

  private autoRefresh() {
    // FIX: Do not auto-refresh if the user has typed text inside the search bar
    if (this.showGuestForm || this.isSaving || this.isLoading || this.search.trim().length > 0) return;
    this.loadGuests(true);
  }

  saveGuest(form: NgForm) {
    if (form.invalid || this.isSaving) {
      form.control.markAllAsTouched();
      return;
    }

    this.isSaving = true;
    this.errorMessage = '';
    this.cdr.detectChanges();

    const payload: GuestPayload = {
      fullName: this.form.fullName.trim(),
      phone: this.form.phone.trim(),
      email: this.form.email?.trim().toLowerCase() || '',
      idNumber: this.form.idNumber?.trim() || '',
      address: this.form.address?.trim() || ''
    };

    // NOTE: Ensure your backend routing verb handles PUT vs PATCH identically here
    const request = this.selectedGuestId
      ? this.guestService.updateGuest(this.selectedGuestId, payload)
      : this.guestService.createGuest(payload);

    request.pipe(
      timeout(15000),
      finalize(() => {
        this.isSaving = false;
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: () => {
        this.resetForm();
        this.showGuestForm = false;
        this.loadGuests();
      },
      error: (err) => {
        this.errorMessage = err.name === 'TimeoutError'
          ? 'Guest save timed out. Check that the backend and MongoDB are running, then try again.'
          : err.error?.message || 'Unable to save guest';
        this.cdr.detectChanges();
      }
    });
  }

  editGuest(guest: Guest) {
    this.selectedGuestId = guest._id;
    this.form = {
      fullName: guest.fullName,
      email: guest.email || '',
      phone: guest.phone,
      idNumber: guest.idNumber || '',
      address: guest.address || ''
    };
    this.showGuestForm = true;
    this.errorMessage = '';
    this.cdr.detectChanges();
  }

  toggleGuestForm() {
    this.showGuestForm = !this.showGuestForm;
    if (!this.showGuestForm) {
      this.resetForm();
    }
    this.cdr.detectChanges();
  }

  deleteGuest(guest: Guest) {
    this.guestPendingDelete = guest;
    this.cdr.detectChanges();
  }

  cancelDeleteGuest() {
    if (this.isDeleting) return;
    this.guestPendingDelete = null;
    this.cdr.detectChanges();
  }

  confirmDeleteGuest() {
    if (!this.guestPendingDelete || this.isDeleting) return;

    const targetId = this.guestPendingDelete._id;
    this.isDeleting = true;
    this.errorMessage = '';
    this.cdr.detectChanges();

    this.guestService.deleteGuest(targetId).pipe(
      timeout(15000),
      finalize(() => {
        this.isDeleting = false;
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: () => {
        // FIX: Optimistically slice out item from array instantly for immediate UI updates
        this.guests = this.guests.filter(g => g._id !== targetId);
        this.guestPendingDelete = null;
        this.loadGuests();
      },
      error: (err) => {
        this.errorMessage = err.name === 'TimeoutError'
          ? 'Guest delete timed out. Check that the backend and MongoDB are running, then try again.'
          : err.error?.message || 'Unable to delete guest';
        this.cdr.detectChanges();
      }
    });
  }

  resetForm() {
    this.selectedGuestId = null;
    this.form = createEmptyGuestForm();
    this.errorMessage = '';
    this.cdr.detectChanges();
  }
}