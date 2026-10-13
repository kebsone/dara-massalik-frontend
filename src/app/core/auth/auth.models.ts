export type UserRole = 'ADMIN' | 'TEACHER' | 'TREASURER' | 'MEMBER' | 'STUDENT' | 'CUSTOMER' | 'PARENT';

export type Permission =
  | 'DASHBOARD_VIEW'
  | 'MEMBER_MANAGE'
  | 'ACTIVITY_MANAGE'
  | 'COMMISSION_MANAGE'
  | 'STUDENT_MANAGE'
  | 'TEACHER_MANAGE'
  | 'GROUP_MANAGE'
  | 'ATTENDANCE_MANAGE'
  | 'PEDAGOGICAL_TRACKING_MANAGE'
  | 'PRODUCT_MANAGE' | 'STOCK_WRITE'
  | 'ORDER_READ' | 'ORDER_MANAGE'
  | 'PAYMENT_MANAGE'
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
