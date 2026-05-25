import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
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
export class GuestsComponent implements OnInit {
  guests: Guest[] = [];
  form: GuestPayload = { ...emptyGuestForm };
  selectedGuestId: string | null = null;
  search = '';
  isLoading = false;
  isSaving = false;
  showGuestForm = false;
  errorMessage = '';

  constructor(private guestService: GuestService) {}

  ngOnInit() {
    this.loadGuests();
  }

  loadGuests() {
    this.isLoading = true;
    this.errorMessage = '';

    this.guestService.getGuests(this.search).subscribe({
      next: (res) => {
        this.guests = res.data;
        this.isLoading = false;
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Unable to load guests';
        this.isLoading = false;
      }
    });
  }

  saveGuest() {
    this.isSaving = true;
    this.errorMessage = '';

    const request = this.selectedGuestId
      ? this.guestService.updateGuest(this.selectedGuestId, this.form)
      : this.guestService.createGuest(this.form);

    request.subscribe({
      next: () => {
        this.resetForm();
        this.loadGuests();
        this.isSaving = false;
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Unable to save guest';
        this.isSaving = false;
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
    if (!confirm(`Delete guest ${guest.fullName}?`)) return;

    this.guestService.deleteGuest(guest._id).subscribe({
      next: () => this.loadGuests(),
      error: (err) => {
        this.errorMessage = err.error?.message || 'Unable to delete guest';
      }
    });
  }

  resetForm() {
    this.selectedGuestId = null;
    this.form = { ...emptyGuestForm };
  }
}
