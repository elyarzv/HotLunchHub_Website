w// Type definitions for HotLunchHub app
// These types represent the database schema and API responses

// User authentication and profile types
export const USER_ROLES = {
  EMPLOYEE: 'employee',
  COOK: 'cook',
  DRIVER: 'driver',
  ADMIN: 'admin'
};

// Company type
export const Company = {
  company_id: Number,
  name: String,
  logo_url: String,
  lunch_time: String, // Time in HH:MM:SS format
  created_at: String,
  updated_at: String
};

// Employee type
export const Employee = {
  employee_id: Number,
  auth_id: String, // UUID
  company_id: Number,
  name: String,
  employee_code: String,
  email: String,
  phone: String,
  created_at: String,
  updated_at: String
};

// Cook type
export const Cook = {
  cook_id: Number,
  auth_id: String, // UUID
  name: String,
  phone: String,
  email: String,
  address_line1: String,
  address_line2: String,
  city: String,
  postal_code: String,
  created_at: String,
  updated_at: String
};

// Driver type
export const Driver = {
  driver_id: Number,
  name: String,
  phone: String,
  email: String,
  created_at: String,
  updated_at: String,
  auth_id: String // UUID
};

// Meal type
export const Meal = {
  meal_id: Number,
  name: String,
  description: String,
  price: Number, // Decimal as number
  is_weekly_special: Boolean,
  created_at: String,
  updated_at: String
};

// Order type
export const Order = {
  order_id: Number,
  employee_id: Number,
  auth_id: String, // UUID
  meal_id: Number,
  company_id: Number,
  order_date: String, // Date in YYYY-MM-DD format
  plan_type: String, // 'weekly' or 'monthly'
  status: String, // 'pending', 'prepared', 'delivered'
  quantity: Number,
  created_at: String,
  updated_at: String
};

// Admin type
export const Admin = {
  admin_id: Number,
  auth_id: String, // UUID
  name: String,
  admin_code: String,
  email: String,
  phone: String,
  created_at: String,
  updated_at: String
};

// User profile type (combines auth with role-specific data)
export const UserProfile = {
  id: String, // UUID from auth
  email: String,
  role: String, // One of USER_ROLES
  company_id: Number,
  name: String,
  code: String, // employee_code, cook_code, driver_code, or admin_code
  phone: String,
  created_at: String,
  status: String,
  roleDetails: Object // Role-specific details from respective tables
};

// Authentication types
export const AuthState = {
  user: UserProfile || null,
  session: Object || null,
  loading: Boolean,
  error: String || null
};

// API response types
export const ApiResponse = {
  data: Array || Object || null,
  error: String || null,
  success: Boolean
};

// Navigation types
export const RootStackParamList = {
  Auth: undefined,
  Main: undefined,
  EmployeeTabs: undefined,
  CookTabs: undefined,
  DriverTabs: undefined,
  AdminTabs: undefined
};

export const EmployeeTabParamList = {
  EmployeeHome: undefined,
  EmployeeOrders: undefined,
  EmployeeProfile: undefined
};

export const CookTabParamList = {
  CookHome: undefined,
  CookOrders: undefined,
  CookProfile: undefined
};

export const DriverTabParamList = {
  DriverHome: undefined,
  DriverDeliveries: undefined,
  DriverProfile: undefined
};

export const AdminTabParamList = {
  AdminHome: undefined,
  AdminUsers: undefined,
  AdminMeals: undefined,
  AdminOrders: undefined,
  AdminProfile: undefined
};
