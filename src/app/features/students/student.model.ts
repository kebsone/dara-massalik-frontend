

export interface StudentRequest {
  firstName: string;
  lastName: string;
  birthDate: string | null;
  phone: string | null;
  parentName: string | null;
  parentPhone: string | null;
  groupId: number | null;
}

export interface SchoolGroup {
  id: number;
  name: string;
  teacherId: number | null;
  teacherName: string | null;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first?: boolean;
  last?: boolean;
}
