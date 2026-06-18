import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { finalize } from 'rxjs';
import { Guest, GuestPayload, GuestService } from '../../core/services/guest.service';

const createEmptyGuestForm = (): GuestPayload => ({
  fullName: '',
  email: '',
  phone: '',
  idType: 'national-id',
  idNumber: '',
  nationality: 'Cambodian',
  address: '',
  notes: ''
});

@Component({
  selector: 'app-guests',
  standalone: true,
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

  constructor(private guestService: GuestService, private cdr: ChangeDetectorRef) { }

  ngOnInit() {
    this.loadGuests();
    this.refreshTimer = setInterval(() => this.autoRefresh(), 15000);
  }

  ngOnDestroy() {
    if (this.refreshTimer) clearInterval(this.refreshTimer);
  }

  loadGuests(silent = false) {
    if (!silent) {
      this.isLoading = true;
      this.cdr.detectChanges();
    }

    this.guestService.getGuests(this.search.trim()).subscribe({
      next: (res) => {
        this.guests = res.data ?? [];
        this.isLoading = false;
        this.errorMessage = '';
        this.cdr.detectChanges();
      },
      error: (err) => {
        if (!silent) {
          this.errorMessage = err.error?.message || 'Unable to load guests.';
        }
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  private autoRefresh() {
    if (this.showGuestForm || this.isSaving || this.isLoading || this.search.trim().length > 0) return;
    this.loadGuests(true);
  }

  saveGuest(form: NgForm) {
    if (form.invalid) {
      form.control.markAllAsTouched();
      return;
    }

    this.isSaving = true;
    this.errorMessage = '';

    const request = this.selectedGuestId
      ? this.guestService.updateGuest(this.selectedGuestId, this.form)
      : this.guestService.createGuest(this.form);

    request.pipe(
      finalize(() => {
        this.isSaving = false;
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: () => {
        this.resetForm();
        this.loadGuests();
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Unable to save guest.';
        this.cdr.detectChanges();
      }
    });
  }

  editGuest(guest: Guest) {
    this.selectedGuestId = guest._id || null;
    this.form = { ...guest };
    this.showGuestForm = true;
    this.errorMessage = '';
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
    if (!this.guestPendingDelete?._id || this.isDeleting) return;

    const targetId = this.guestPendingDelete._id;
    this.isDeleting = true;
    this.errorMessage = '';

    this.guestService.deleteGuest(targetId).pipe(
      finalize(() => {
        this.isDeleting = false;
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: () => {
        this.guests = this.guests.filter(g => g._id !== targetId);
        this.guestPendingDelete = null;
        this.loadGuests();
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Unable to delete guest.';
        this.cdr.detectChanges();
      }
    });
  }

  resetForm() {
    this.selectedGuestId = null;
    this.form = createEmptyGuestForm();
    this.showGuestForm = false;
    this.errorMessage = '';
  }
}