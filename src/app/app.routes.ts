import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';
import { permissionGuard } from './core/auth/access.guard';
import { AppLayoutComponent } from './core/layout/app-layout.component';

export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./core/auth/login.component').then(m => m.LoginComponent) },
  {
    path: '',
    component: AppLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      { path: 'dashboard', loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent) },
      { path: 'members', loadComponent: () => import('./features/members/members.component').then(m => m.MembersComponent) },
      { path: 'activities', loadComponent: () => import('./features/activities/activities.component').then(m => m.ActivitiesComponent) },
      { path: 'commissions', loadComponent: () => import('./features/commissions/commissions.component').then(m => m.CommissionsComponent) },
      { path: 'students', loadComponent: () => import('./features/students/students.component').then(m => m.StudentsComponent) },
      { path: 'students/:id', loadComponent: () => import('./features/students/student-detail.component').then(m => m.StudentDetailComponent) },
      {
  path: 'teachers',
  loadComponent: () =>
    import('./features/teachers/teacher-list.component')
      .then(m => m.TeacherListComponent),
  data: { title: 'Enseignants' }
},
      
{
  path: 'groups',
  loadComponent: () =>
    import('./features/groups/group-list.component')
      .then(m => m.GroupListComponent),
  data: { title: 'Classes' }
},      
      
      { path: 'attendance', loadComponent: () => import('./features/attendance/attendance.component').then(m => m.AttendanceComponent) },
      { path: 'pedagogical-tracking', pathMatch: 'full', redirectTo: 'attendance' },
      { path: 'shop', loadComponent: () => import('./features/shop/shop.component').then(m => m.ShopComponent) },
      { path: 'shop/cart', loadComponent: () => import('./features/shop/shop-cart.component').then(m => m.ShopCartComponent) },
      { path: 'shop/products/:id', loadComponent: () => import('./features/shop/shop-product-detail.component').then(m => m.ShopProductDetailComponent) },
      { path: 'shop/sales', loadComponent: () => import('./features/shop/shop-sales.component').then(m => m.ShopSalesComponent) },
      { path: 'payments', loadComponent: () => import('./features/payments/payments.component').then(m => m.PaymentsComponent) },
      { path: 'profile', loadComponent: () => import('./features/profile/profile.component').then(m => m.ProfileComponent) },
      { path: 'orders', loadComponent: () => import('./features/profile/my-orders.component').then(m => m.MyOrdersComponent) },
      { path: 'administration/access', canActivate: [permissionGuard], data: { permissions: ['ROLE_MANAGE', 'PERMISSION_MANAGE'] }, loadComponent: () => import('./features/admin/access-management.component').then(m => m.AccessManagementComponent) }
    ]
  },
  { path: '**', redirectTo: '' }
];
