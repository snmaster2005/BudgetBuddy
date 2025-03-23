# Teen Budget App

A budget management application designed for teenagers that helps track expenses, manage budgets, and develop financial responsibility.

## Features

- **Expense Tracking**: Log and categorize expenses
- **Budget Management**: Create and monitor category-based budgets
- **UPI Integration**: Simulated UPI payment integration with spending controls
- **Financial Education**: Complete quizzes about financial topics to unlock features
- **Bank Account Monitoring**: Track your bank balance and spending
- **Cross-Category Funds**: Manage funds across different budget categories

## Technology Stack

- **Frontend**: React, TypeScript, TailwindCSS, Shadcn/UI
- **Backend**: Node.js, Express
- **Mobile**: Capacitor for Android/iOS deployment
- **State Management**: TanStack Query
- **Routing**: Wouter
- **Form Handling**: React Hook Form with Zod validation

## Getting Started

### Prerequisites

- Node.js (v18+)
- npm or yarn

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/BudgetBuddy.git
   cd teen-budget-app
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the development server:
   ```
   npm run dev
   ```

### Mobile Development

This project uses Capacitor to enable deployment to Android and iOS:

1. Build the web app:
   ```
   npm run build
   ```

2. Add platforms:
   ```
   npx cap add android
   npx cap add ios
   ```

3. Sync web code to native projects:
   ```
   npx cap sync
   ```

4. Open native IDEs:
   ```
   npx cap open android
   npx cap open ios
   ```

## License

This project is licensed under the MIT License - see the LICENSE file for details.
