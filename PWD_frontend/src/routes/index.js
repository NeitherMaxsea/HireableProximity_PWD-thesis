import { createRouter, createWebHistory } from 'vue-router'

// AUTH
import LoginPages from '@/module/Authentication/login_pages.vue'    
import register_pages from '@/module/Authentication/register_pages.vue'
import Role_pages from '@/module/Authentication/roled-based-pages.vue'
import ForgetPass from '@/module/Authentication/forgot-password-pages.vue'
import Otpform from '@/module/Authentication/form_otp_email_pages.vue'
import ResetPassword from '@/module/Authentication/reset-password-pages.vue'

// ADMIN
import AdminLayout from '@/module/Admin/layout/adminlayout.vue'
import AdminDashboard from '@/module/Admin/views/Dashboard.vue'
import AdminUsers from '@/module/Admin/views/Users.vue'
import AdminLogs from '@/module/Admin/views/Logs.vue'
import SidebarAdmin from '@/components/sidebar-admin.vue'
import NavbarAdmin from '@/components/navbar-admin.vue'

// EMPLOYER HR
import EmployerLayout from '@/module/Employer/views/layout/EmployerLayout.vue'
import EmployerDashboard from '@/module/Employer/views/HR/dashboard.vue'
import SidebarEmployer from '@/components/sb-employer.vue'
import NavbarEmployer from '@/components/nv-employer.vue'
import Applicant from '@/module/Employer/views/HR/Applicant.vue'
import JobListEmployeer from '@/module/Employer/views/HR/Job-management/Job-list_pages.vue'
import JobPostEmployeer from '@/module/Employer/views/HR/Job-management/Job-post-pages.vue'
import EmployeeRecord from '@/module/Employer/views/HR/EmployeeRecord.vue'
import EmployerProfile from '@/module/Employer/views/HR/Profile.vue'

// EMPLOYER OPERATIONS
import OperationsDashboard from '@/module/Employer/views/Operation/OperationsDashboard.vue'
import AssignmentManagement from '@/module/Employer/views/Operation/AssignmentManagement.vue'
import DeploymentScheduling from '@/module/Employer/views/Operation/DeploymentScheduling.vue'
import TrainingManagement from '@/module/Employer/views/Operation/TrainingManagement.vue'
import TrainingProgress from '@/module/Employer/views/Operation/TrainingProgress.vue'
import WorkAssignment from '@/module/Employer/views/Operation/WorkAssignment.vue'
import ReportsAnalytics from '@/module/Employer/views/Operation/ReportsAnalytics.vue'
import EmployeeOperationsProfile from '@/module/Employer/views/Operation/EmployeeProfile.vue'
import FinanceDashboard from '@/module/Employer/views/Finance/FinanceDashboard.vue'

// COMPANY ADMIN
import CompanyAdminLayout from '@/module/CompanyAdmin/layout/CompanyAdminLayout.vue'
import CompanyAdminDashboard from '@/module/CompanyAdmin/views/Dashboard.vue'
import CompanyAdminAddEmployee from '@/module/CompanyAdmin/views/AddEmployee.vue'
import CompanyAdminLogs from '@/module/CompanyAdmin/views/Logs.vue'

// APPLICANT
import SidebarApplicant from '@/components/sb-applicant.vue'
import ApplicantLayout from '@/module/Applicant/views/layout/ApplicantLayout.vue'
import ApplicantDashboard from '@/module/Applicant/views/job_list.vue'

// LANDING PAGE
import LandingPage from '@/Landingpage.vue'

const routes = [

  { path: '/', redirect: '/landingpage' },

  // ================= LANDING =================
  {
    path: '/landingpage',
    name: 'LandingPage',
    component: LandingPage,
    meta: { title: "PWD Job Portal | Home" }
  },
  {
    path: '/find-jobs',
    redirect: '/applicant/job_list'
  },

  // ================= AUTH =================
  {
    path: '/login',
    name: 'Login',
    component: LoginPages,
    meta: { title: "PWD Job Portal | Login" }
  },
  {
    path: '/register',
    name: 'Register',
    component: register_pages,
    meta: { title: "PWD Job Portal | Register" }
  },
  {
    path: '/role',
    name: 'Role',
    component: Role_pages,
    meta: { title: "PWD Job Portal | Role Selection" }
  },
  {
    path: '/auth/forget-password',
    name: 'ForgetPassword',
    component: ForgetPass,
    meta: { title: "PWD Job Portal | Forget Password" }
  },
  {
    path: '/auth/otp',
    name: 'OtpForm',
    component: Otpform,
    meta: { title: "PWD Job Portal | OTP Verification" }
  },
  {
    path: '/auth/reset-password',
    name: 'ResetPassword',
    component: ResetPassword,
    meta: { title: "PWD Job Portal | Reset Password" }
  },

  // ================= ADMIN =================
  {
    path: '/sidebar-admin',
    component: SidebarAdmin
  },
  {
    path: '/navbar-admin',
    component: NavbarAdmin
  },
  {
    path: '/admin',
    component: AdminLayout,
    children: [
      {
        path: 'dashboard',
        name: 'AdminDashboard',
        component: AdminDashboard
      },
      {
        path: 'users',
        name: 'AdminUsers',
        component: AdminUsers,
        meta: { title: "PWD Job Portal | Admin Users" }
      },
      {
        path: 'logs',
        name: 'AdminLogs',
        component: AdminLogs,
        meta: { title: "PWD Job Portal | Admin Logs" }
      }
    ]
  },

  // ================= EMPLOYER HR =================
  {
    path: '/employer/HR',
    component: EmployerLayout,
    children: [
      {
        path: 'dashboard',
        name: 'EmployerDashboard',
        component: EmployerDashboard,
        meta: { title: "PWD Job Portal | Employer Dashboard" }
      },
      {
        path: 'applicant-lists',
        name: 'Applicant',
        component: Applicant,
        meta: { title: "PWD Job Portal | Applicant Lists" }
      },
      {
        path: 'employer-records',
        alias: 'Employer-records',
        name: 'EmployeeRecord',
        component: EmployeeRecord,
        meta: { title: "PWD Job Portal | Employee Records" }
      },
      
      {
        path: 'job-management/job-list',
        name: 'JobListEmployeer',
        component: JobListEmployeer,
        meta: { title: "PWD Job Portal | Job List" }
      },
      {
        path: 'job-management/job-post',
        name: 'JobPostEmployeer',
        component: JobPostEmployeer,
        meta: { title: "PWD Job Portal | Post a Job" }
      },
      {
        path: 'profile',
        name: 'EmployerProfile',
        component: EmployerProfile,
        meta: { title: "PWD Job Portal | Employer Profile" }
      }
    ]
  },
  {
    path: '/employer/operation',
    children: [
      {
        path: 'dashboard',
        name: 'OperationsDashboard',
        component: OperationsDashboard,
        meta: { title: "PWD Job Portal | Operations Dashboard" }
      },
      {
        path: 'assignment-management',
        name: 'AssignmentManagement',
        component: AssignmentManagement,
        meta: { title: "PWD Job Portal | Assignment Management" }
      },
      {
        path: 'deployment-scheduling',
        name: 'DeploymentScheduling',
        component: DeploymentScheduling,
        meta: { title: "PWD Job Portal | Deployment Scheduling" }
      },
      {
        path: 'training-management',
        name: 'TrainingManagement',
        component: TrainingManagement,
        meta: { title: "PWD Job Portal | Training Management" }
      },
      {
        path: 'training-progress',
        name: 'TrainingProgress',
        component: TrainingProgress,
        meta: { title: "PWD Job Portal | Training Progress" }
      },
      {
        path: 'work-assignment',
        name: 'WorkAssignment',
        component: WorkAssignment,
        meta: { title: "PWD Job Portal | Work Assignment" }
      },
      {
        path: 'reports-analytics',
        name: 'ReportsAnalytics',
        component: ReportsAnalytics,
        meta: { title: "PWD Job Portal | Reports & Analytics" }
      },
      {
        path: 'employee-profile',
        name: 'EmployeeOperationsProfile',
        component: EmployeeOperationsProfile,
        meta: { title: "PWD Job Portal | Employee Profile" }
      }
    ]
  },
  {
    path: '/employer/finance',
    children: [
      {
        path: 'dashboard',
        name: 'FinanceDashboard',
        component: FinanceDashboard,
        meta: { title: "PWD Job Portal | Finance Dashboard" }
      }
    ]
  },

  // ================= COMPANY ADMIN =================
  {
    path: '/company-admin',
    component: CompanyAdminLayout,
    children: [
      {
        path: 'dashboard',
        name: 'CompanyAdminDashboard',
        component: CompanyAdminDashboard,
        meta: { title: "PWD Job Portal | Company Admin Dashboard" }
      },
      {
        path: 'add-employee',
        name: 'CompanyAdminAddEmployee',
        component: CompanyAdminAddEmployee,
        meta: { title: "PWD Job Portal | Add Employee" }
      },
      {
        path: 'logs',
        name: 'CompanyAdminLogs',
        component: CompanyAdminLogs,
        meta: { title: "PWD Job Portal | Company Admin Logs" }
      }
    ]
  },

  // ================= APPLICANT =================
  {
    path: '/sidebar-applicant',
    component: SidebarApplicant
  },
  {
    path: '/applicant',
    component: ApplicantLayout,
    children: [
      {
        path: 'job_list',
        name: 'ApplicantDashboard',
        component: ApplicantDashboard,
        meta: { title: "PWD Job Portal | Applicant Dashboard" }
      },
      {
        path: 'profile',
        name: 'ApplicantProfile',
        component: EmployerProfile,
        meta: { title: "PWD Job Portal | Applicant Profile" }
      }
    ]
  }

]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  document.title = to.meta.title || "PWD Job Portal"
  next()
})

export default router
