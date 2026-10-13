import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { SchoolGroup } from '../../features/students/student.model';

@Injectable({ providedIn: 'root' })
export class GroupApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/groups`;

  list(): Observable<SchoolGroup[]> {
    return this.http.get<SchoolGroup[]>(this.baseUrl);
  }
}
