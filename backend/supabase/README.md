# HotLunchHub Database Setup Guide

## Database Schema Overview

The HotLunchHub application uses the following database structure:

### Core Tables

#### 1. `profiles` Table
- **Purpose**: Central user management table
- **Columns**:
  - `id` (uuid, primary key) - Links to `auth.users.id`
  - `role` (user_role enum) - 'employee', 'driver', 'cook', 'admin'
  - `full_name` (text) - User's full name
  - `status` (text) - 'active', 'inactive', etc.
  - `created_at` (timestamp with time zone)
  - `updated_at` (timestamp with time zone)
  - `admin_metadata` (jsonb) - Additional admin-specific data

#### 2. `admins` Table
- **Purpose**: Admin-specific details
- **Columns**:
  - `admin_id` (integer, primary key)
  - `auth_id` (uuid) - Links to `auth.users.id`
  - `name` (varchar) - Admin name
  - `admin_code` (varchar) - Unique admin code
  - `email` (varchar) - Admin email
  - `phone` (varchar) - Admin phone
  - `created_at`, `updated_at` (timestamps)

#### 3. `employees` Table
- **Purpose**: Employee-specific details
- **Columns**:
  - `employee_id` (integer, primary key)
  - `auth_id` (uuid) - Links to `auth.users.id`
  - `company_id` (integer) - Links to `companies.company_id`
  - `name` (varchar) - Employee name
  - `employee_code` (varchar) - Unique employee code
  - `email` (varchar) - Employee email
  - `phone` (varchar) - Employee phone
  - `created_at`, `updated_at` (timestamps)

#### 4. `cooks` Table
- **Purpose**: Cook-specific details
- **Columns**:
  - `cook_id` (integer, primary key)
  - `auth_id` (uuid) - Links to `auth.users.id`
  - `name` (varchar) - Cook name
  - `email` (varchar) - Cook email
  - `phone` (varchar) - Cook phone
  - `address_line1`, `address_line2` (varchar) - Address
  - `city`, `postal_code` (varchar) - Location
  - `created_at`, `updated_at` (timestamps)

#### 5. `drivers` Table
- **Purpose**: Driver-specific details
- **Columns**:
  - `driver_id` (integer, primary key)
  - `name` (varchar) - Driver name
  - `email` (varchar) - Driver email
  - `phone` (varchar) - Driver phone
  - `created_at`, `updated_at` (timestamps)
  - `auth_id` (uuid) - Links to `auth.users.id`

#### 6. `companies` Table
- **Purpose**: Company information
- **Columns**:
  - `company_id` (integer, primary key)
  - `name` (varchar) - Company name
  - `logo_url` (text) - Company logo URL
  - `lunch_time` (time) - Company lunch time
  - `created_at`, `updated_at` (timestamps)

#### 7. `meals` Table
- **Purpose**: Available meals
- **Columns**:
  - `meal_id` (integer, primary key)
  - `name` (varchar) - Meal name
  - `description` (text) - Meal description
  - `price` (numeric) - Meal price
  - `is_weekly_special` (boolean) - Weekly special flag
  - `created_at`, `updated_at` (timestamps)

#### 8. `orders` Table
- **Purpose**: Meal orders
- **Columns**:
  - `order_id` (integer, primary key)
  - `employee_id` (integer) - Links to `employees.employee_id`
  - `meal_id` (integer) - Links to `meals.meal_id`
  - `company_id` (integer) - Links to `companies.company_id`
  - `order_date` (date) - Order date
  - `plan_type` (varchar) - 'weekly' or 'monthly'
  - `status` (varchar) - 'pending', 'prepared', 'delivered'
  - `quantity` (integer) - Order quantity
  - `auth_id` (uuid) - Links to `auth.users.id`
  - `created_at`, `updated_at` (timestamps)

## Setup Instructions

### 1. Run Migrations
```bash
# Apply the initial schema
supabase db reset

# Apply the profiles table fixes
supabase db push
```

### 2. Create Initial Admin User
```sql
-- Insert admin profile
INSERT INTO profiles (id, role, full_name, status) 
VALUES ('your-auth-user-id', 'admin', 'Admin User', 'active');

-- Insert admin details
INSERT INTO admins (auth_id, name, admin_code, email) 
VALUES ('your-auth-user-id', 'Admin User', 'ADM001', 'admin@example.com');
```

### 3. Verify RLS Policies
All tables have Row Level Security enabled with appropriate policies:
- **profiles**: Select all, insert authenticated, update own, delete admin
- **admins**: Admin access only
- **employees**: Admin access + own profile
- **cooks**: Admin access + own profile
- **drivers**: Admin access + own profile
- **companies**: Admin access only
- **meals**: Admin manage, public select
- **orders**: Role-based access (admin, cook, driver, own)

## Key Relationships

1. **User Authentication**: `auth.users.id` → `profiles.id`
2. **Role Details**: `profiles.id` → `admins.auth_id`, `employees.auth_id`, etc.
3. **Company Association**: `employees.company_id` → `companies.company_id`
4. **Order Flow**: `orders.employee_id` → `employees.employee_id`

## Frontend Integration

The frontend code has been updated to:
- Query `profiles` table first for user role
- Fetch role-specific details from respective tables
- Handle missing email fields (email is in role-specific tables, not profiles)
- Support the actual database schema structure

## Troubleshooting

### Common Issues:
1. **Missing RLS policies**: Run the migration to add profiles table policies
2. **Foreign key constraints**: Ensure all referenced tables exist
3. **Column mismatches**: Verify column names match the schema exactly
4. **Permission errors**: Check that RLS policies allow the required operations

### Testing:
```sql
-- Test profiles table access
SELECT * FROM profiles LIMIT 5;

-- Test admin creation
INSERT INTO profiles (id, role, full_name, status) 
VALUES (gen_random_uuid(), 'admin', 'Test Admin', 'active');
```
