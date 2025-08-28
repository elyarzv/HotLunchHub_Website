# HotLunchHub - Expo React Native App

A comprehensive meal delivery system built with Expo (React Native) that connects employees, cooks, and drivers within companies.

## 🏗️ Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── common/         # Common components (buttons, loading, etc.)
│   ├── forms/          # Form-specific components
│   └── ui/             # UI-specific components
├── constants/           # App constants and configuration
├── context/             # React Context for state management
├── hooks/               # Custom React hooks
├── navigation/          # Navigation setup and configuration
├── screens/             # App screens organized by user role
│   ├── auth/           # Authentication screens (login, signup)
│   ├── employee/       # Employee-specific screens
│   ├── cook/           # Cook-specific screens
│   ├── driver/         # Driver-specific screens
│   └── admin/          # Admin-specific screens
├── services/            # API and external service integrations
├── types/               # Type definitions and schemas
└── utils/               # Utility functions and helpers
```

## 🚀 Features

### User Roles & Access
- **Employee**: Order meals, view order status, manage profile
- **Cook**: View assigned orders, update meal preparation status
- **Driver**: View delivery assignments, mark deliveries as completed
- **Admin**: Full access to manage users, meals, and orders

### Core Functionality
- 🔐 Secure authentication with Supabase
- 🍽️ Meal ordering and management
- 📋 Order tracking and status updates
- 🚚 Delivery management
- 👥 User role-based access control
- 🏢 Company-specific data isolation

## 🛠️ Technology Stack

- **Frontend**: React Native with Expo
- **Navigation**: React Navigation v6
- **State Management**: React Context + Hooks
- **Backend**: Supabase (PostgreSQL + Auth + Real-time)
- **UI Components**: Custom components with React Native
- **Authentication**: Supabase Auth

## 📱 Screens Overview

### Authentication
- **LoginScreen**: User authentication with email/password
- **SignUpScreen**: New user registration

### Employee Screens
- **EmployeeHomeScreen**: Dashboard with meals and recent orders
- **EmployeeOrdersScreen**: View all employee orders
- **EmployeeOrderMealsScreen**: Place new meal orders
- **EmployeeProfileScreen**: Profile management

### Cook Screens
- **CookHomeScreen**: Kitchen dashboard
- **CookOrdersScreen**: Manage meal preparation
- **CookProfileScreen**: Cook profile settings

### Driver Screens
- **DriverHomeScreen**: Delivery dashboard
- **DriverDeliveriesScreen**: Manage deliveries
- **DriverProfileScreen**: Driver profile settings

### Admin Screens
- **AdminHomeScreen**: System overview dashboard
- **AdminUsersScreen**: User management
- **AdminMealsScreen**: Meal management
- **AdminOrdersScreen**: Order management
- **AdminProfileScreen**: Admin profile settings

## 🔧 Setup & Installation

### Prerequisites
- Node.js (v16 or higher)
- Expo CLI
- iOS Simulator or Android Emulator (or physical device)

### Installation Steps

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure Supabase**
   - Update `src/constants/config.js` with your Supabase credentials
   - Replace `SUPABASE_ANON_KEY` with your actual anon key

3. **Start the development server**
   ```bash
   npm start
   ```

4. **Run on device/simulator**
   - Press `i` for iOS simulator
   - Press `a` for Android emulator
   - Scan QR code with Expo Go app on physical device

## 🔐 Configuration

### Supabase Setup
The app requires a Supabase backend with the following tables:
- `companies` - Company information
- `employees` - Employee profiles
- `cooks` - Cook profiles  
- `drivers` - Driver profiles
- `meals` - Available meals
- `orders` - Meal orders

### Environment Variables
Update the configuration in `src/constants/config.js`:
```javascript
export const CONFIG = {
  SUPABASE_URL: 'your-supabase-url',
  SUPABASE_ANON_KEY: 'your-anon-key',
  // ... other config
};
```

## 📱 App Flow

1. **Authentication**: Users sign in with email/password
2. **Role Detection**: App determines user role from database
3. **Navigation**: Role-specific navigation is loaded
4. **Data Access**: Users can only access data relevant to their role
5. **Real-time Updates**: Order status changes are reflected in real-time

## 🎨 UI/UX Features

- **Responsive Design**: Optimized for mobile devices
- **Role-based Theming**: Different color schemes for each role
- **Modern Components**: Clean, accessible UI components
- **Loading States**: Proper loading indicators and error handling
- **Pull-to-Refresh**: Swipe down to refresh data
- **Tab Navigation**: Intuitive bottom tab navigation

## 🔒 Security Features

- **Row Level Security (RLS)**: Database-level access control
- **Role-based Access**: Users can only access their role's data
- **Company Isolation**: Users can only see data from their company
- **Secure Authentication**: Supabase Auth with JWT tokens

## 🚀 Development

### Adding New Screens
1. Create screen component in appropriate role folder
2. Add screen to navigation in `src/navigation/AppNavigator.js`
3. Update navigation types if needed

### Adding New Components
1. Create component in `src/components/`
2. Follow existing component patterns
3. Add proper TypeScript types if using TypeScript

### API Integration
- Use services in `src/services/` for API calls
- Follow existing patterns for error handling
- Implement proper loading states

## 📊 State Management

The app uses React Context for global state management:
- **AuthContext**: Manages authentication state and user information
- **Local State**: Component-level state for UI interactions
- **API State**: Service-level state for data fetching

## 🧪 Testing

To run tests (when implemented):
```bash
npm test
```

## 📦 Building for Production

### iOS
```bash
expo build:ios
```

### Android
```bash
expo build:android
```

## 🤝 Contributing

1. Follow the existing code structure and patterns
2. Add proper comments and documentation
3. Test on both iOS and Android
4. Ensure proper error handling
5. Follow React Native best practices

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Check the documentation
- Review existing code examples
- Create an issue in the repository

## 🔮 Future Enhancements

- Push notifications for order updates
- Offline support with data synchronization
- Advanced analytics and reporting
- Multi-language support
- Dark mode theme
- Advanced order customization
- Payment integration
- Rating and review system
