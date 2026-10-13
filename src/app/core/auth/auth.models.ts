export type UserRole = 'ADMIN' | 'TEACHER' | 'TREASURER' | 'MEMBER' | 'STUDENT' | 'CUSTOMER' | 'PARENT';

export type Permission =
  | 'DASHBOARD_VIEW'
  | 'MEMBER_READ' | 'MEMBER_WRITE'
  | 'ACTIVITY_READ' | 'ACTIVITY_WRITE'
  | 'COMMISSION_READ' | 'COMMISSION_WRITE'
  | 'STUDENT_READ' | 'STUDENT_WRITE'
  | 'TEACHER_READ' | 'TEACHER_WRITE'
  | 'GROUP_READ' | 'GROUP_WRITE'
  | 'ATTENDANCE_READ' | 'ATTENDANCE_WRITE'
  | 'PEDAGOGICAL_TRACKING_READ' | 'PEDAGOGICAL_TRACKING_WRITE'
  | 'PRODUCT_READ' | 'PRODUCT_WRITE' | 'STOCK_WRITE'
  | 'ORDER_READ' | 'ORDER_MANAGE'
  | 'PAYMENT_READ' | 'PAYMENT_WRITE'
  | 'USER_MANAGE' | 'ROLE_MANAGE' | 'PERMISSION_MANAGE';

export interface AuthUser {
  id: number;
  phone: string | null;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  role: UserRole | null;
  roles: UserRole[];
  permissions: Permission[];
}

export interface AuthResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  refreshToken: string;
  user: AuthUser;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RequestOtpResponse {
  challengeId: string;
  expiresInSeconds: number;
  existingUser: boolean;
  debugCode: string | null;
}

export interface VerifyOtpRequest {
  challengeId: string;
  phoneNumber: string;
  code: string;
  firstName?: string;
  lastName?: string;
  email?: string;
}

export interface RefreshResponse extends AuthResponse {}
