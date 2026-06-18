import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { API_BASE_URL } from '../api.config';
import { ApiResponse } from './room.service';

export type Invoice = {
  _id: string;
  invoiceNumber: string;
  booking: {
    _id: string;
    guest: {
      fullName: string;
      email: string;
      phone: string;
    };
    room: {
      roomNumber: string;
      type: string;
    };
    checkInDate: string;
    checkOutDate: string;
  };
  guest: {
    fullName: string;
    email: string;
    phone: string;
    address?: string;
  };
  room: {
    roomNumber: string;
    type: string;
    pricePerNight: number;
  };
  checkInDate: string;
  checkOutDate: string;
  numberOfNights: number;
  roomCharges: number;
  additionalCharges: Array<{
    description: string;
    amount: number;
  }>;
  subtotal: number;
  discount: number;
  taxPercentage: number;
  taxAmount: number;
  totalAmount: number;
  amount: number;
  status: 'draft' | 'issued' | 'unpaid' | 'paid' | 'cancelled' | 'void';
  issueDate: string;
  dueDate?: string;
  paymentDate?: string;
  paymentMethod?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

export type InvoicePayload = {
  bookingId: string;
  numberOfNights: number;
  roomCharges: number;
  additionalCharges?: Array<{
    description: string;
    amount: number;
  }>;
  discount?: number;
  taxPercentage?: number;
  notes?: string;
};

@Injectable({ providedIn: 'root' })
export class InvoiceService {
  private readonly baseUrl = `${API_BASE_URL}/invoices`;

  constructor(private http: HttpClient) { }

  createInvoice(data: InvoicePayload) {
    return this.http.post<ApiResponse<Invoice>>(this.baseUrl, data);
  }

  getInvoices(filters?: { status?: string; bookingId?: string; skip?: number; limit?: number }) {
    let url = this.baseUrl;
    if (filters) {
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.bookingId) params.append('bookingId', filters.bookingId);
      if (filters.skip !== undefined) params.append('skip', String(filters.skip));
      if (filters.limit !== undefined) params.append('limit', String(filters.limit));
      const queryString = params.toString();
      if (queryString) url += '?' + queryString;
    }
    return this.http.get<ApiResponse<{ invoices: Invoice[]; total: number }>>(url);
  }

  getInvoiceById(id: string) {
    return this.http.get<ApiResponse<Invoice>>(`${this.baseUrl}/${id}`);
  }

  updateInvoiceStatus(id: string, status: string, paymentDate?: string, paymentMethod?: string) {
    const data: any = { status };
    if (paymentDate) data.paymentDate = paymentDate;
    if (paymentMethod) data.paymentMethod = paymentMethod;
    return this.http.put<ApiResponse<Invoice>>(`${this.baseUrl}/${id}/status`, data);
  }

  updateInvoice(id: string, data: Partial<InvoicePayload>) {
    return this.http.patch<ApiResponse<Invoice>>(`${this.baseUrl}/${id}`, data);
  }

  deleteInvoice(id: string) {
    return this.http.delete<ApiResponse<null>>(`${this.baseUrl}/${id}`);
  }
}
