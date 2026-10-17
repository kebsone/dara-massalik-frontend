import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PageResponse, StudentRequest } from '../../features/students/student.model';
import { StudentResponse } from './generated';

export interface StudentListParams {
  search?: string;
  groupId?: number | null;
  page: number;
  size: number;
}

@Injectable({ providedIn: 'root' })
export class StudentApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/students`;

  list(params: StudentListParams): Observable<PageResponse<StudentResponse>> {
    let httpParams = new HttpParams()
      .set('page', String(params.page))
      .set('size', String(params.size))
      .set('sort', 'lastName,asc');

    const search = params.search?.trim();
    if (search) httpParams = httpParams.set('search', search);
    if (params.groupId != null) httpParams = httpParams.set('groupId', String(params.groupId));

    return this.http.get<PageResponse<StudentResponse>>(this.baseUrl, { params: httpParams });
  }

  getById(id: number): Observable<StudentResponse> {
    return this.http.get<StudentResponse>(`${this.baseUrl}/${id}`);
  }

  create(request: StudentRequest): Observable<StudentResponse> {
    return this.http.post<StudentResponse>(this.baseUrl, request);
  }

  update(id: number, request: StudentRequest): Observable<StudentResponse> {
    return this.http.put<StudentResponse>(`${this.baseUrl}/${id}`, request);
  }

  deactivate(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
