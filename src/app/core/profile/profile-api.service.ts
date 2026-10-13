import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface UserProfile {
  id: number;
  phone: string | null;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  role: string;
  createdAt: string;
}

export interface Address {
  id: number;
  label: string | null;
  firstName: string;
  lastName: string;
  addressLine1: string;
  addressLine2: string | null;
  postalCode: string;
  city: string;
  country: string;
  defaultAddress: boolean;
}

export interface AddressRequest {
  label?: string;
  firstName: string;
  lastName: string;
  addressLine1: string;
  addressLine2?: string;
  postalCode: string;
  city: string;
  country: string;
  defaultAddress: boolean;
}

@Injectable({ providedIn: 'root' })
export class ProfileApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/me`;

  getProfile(): Observable<UserProfile> {
    return this.http.get<UserProfile>(this.baseUrl);
  }

  updateProfile(request: Partial<Pick<UserProfile, 'firstName' | 'lastName' | 'email'>>): Observable<UserProfile> {
    return this.http.patch<UserProfile>(this.baseUrl, request);
  }

  getAddresses(): Observable<Address[]> {
    return this.http.get<Address[]>(`${this.baseUrl}/addresses`);
  }

  createAddress(request: AddressRequest): Observable<Address> {
    return this.http.post<Address>(`${this.baseUrl}/addresses`, request);
  }

  updateAddress(id: number, request: AddressRequest): Observable<Address> {
    return this.http.put<Address>(`${this.baseUrl}/addresses/${id}`, request);
  }

  deleteAddress(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/addresses/${id}`);
  }
}
