import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { finalize, timeout } from 'rxjs';
import { Guest, GuestPayload, GuestService } from '../../core/services/guest.service';

const emptyGuestForm: GuestPayload = {
  fullName: '',
  email: '',
  phone: '',
  idNumber: '',
  address: ''
};

@Component({
  selector: 'app-guests',
  imports: [CommonModule, FormsModule],
  templateUrl: './guests.component.html',
  styleUrl: './guests.component.css'
})
export class GuestsComponent implements OnInit, OnDestroy {
  guests: Guest[] = [];
  form: GuestPayload = { ...emptyGuestForm };
  selectedGuestId: string | null = null;
  search = '';
  isLoading = false;
  isSaving = false;
  isDeleting = false;
  showGuestForm = false;
  guestPendingDelete: Guest | null = null;
  errorMessage = '';
  private refreshTimer?: ReturnType<typeof setInterval>;

  constructor(private guestService: GuestService) {}

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
    }

    this.guestService.getGuests(this.search.trim()).pipe(
      timeout(10000),
      finalize(() => {
        this.isLoading = false;
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
      }
    });
  }

  private autoRefresh() {
    if (this.showGuestForm || this.isSaving || this.isLoading) return;
    this.loadGuests(true);
  }

  saveGuest(form: NgForm) {
    if (form.invalid || this.isSaving) {
      form.control.markAllAsTouched();
      return;
    }

    this.isSaving = true;
    this.errorMessage = '';

    const payload: GuestPayload = {
      fullName: this.form.fullName.trim(),
      phone: this.form.phone.trim(),
      email: this.form.email?.trim().toLowerCase() || '',
      idNumber: this.form.idNumber?.trim() || '',
      address: this.form.address?.trim() || ''
    };

    const request = this.selectedGuestId
      ? this.guestService.updateGuest(this.selectedGuestId, payload)
      : this.guestService.createGuest(payload);

    request.pipe(
      timeout(15000),
      finalize(() => {
        this.isSaving = false;
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
  }

  toggleGuestForm() {
    this.showGuestForm = !this.showGuestForm;
    if (!this.showGuestForm) {
      this.resetForm();
    }
  }

  deleteGuest(guest: Guest) {
    this.guestPendingDelete = guest;
  }

  cancelDeleteGuest() {
    if (this.isDeleting) return;
    this.guestPendingDelete = null;
  }

  confirmDeleteGuest() {
    if (!this.guestPendingDelete || this.isDeleting) return;

    this.isDeleting = true;
    this.errorMessage = '';

    this.guestService.deleteGuest(this.guestPendingDelete._id).pipe(
      timeout(15000),
      finalize(() => {
        this.isDeleting = false;
      })
    ).subscribe({
      next: () => {
        this.guestPendingDelete = null;
        this.loadGuests();
      },
      error: (err) => {
        this.errorMessage = err.name === 'TimeoutError'
          ? 'Guest delete timed out. Check that the backend and MongoDB are running, then try again.'
          : err.error?.message || 'Unable to delete guest';
      }
    });
  }

  resetForm() {
    this.selectedGuestId = null;
    this.form = { ...emptyGuestForm };
  }
}
