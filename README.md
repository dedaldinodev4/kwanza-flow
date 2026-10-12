# KwanzaFlow

**Understand your money. Control your spending. Plan your future.**

A modern personal finance management application designed for everyday financial life in Angola. KwanzaFlow helps users track income and expenses, manage monthly budgets, monitor savings goals, and understand their financial habits through a clean, accessible, and intuitive interface.

> **Project status:** In development  
> **Project type:** Personal finance management · Frontend MVP  
> **Primary market:** Angola  
> **Currency:** Angolan Kwanza (AOA / Kz)

---

## Overview

Managing personal finances requires more than recording transactions. It requires visibility, consistency, and tools that help people make informed decisions.

KwanzaFlow aims to simplify that process by bringing essential financial activities into one place. The application is being developed with a strong focus on usability, responsive design, maintainable architecture, and reliable financial calculations.

The MVP uses deterministic demo data and browser-based persistence, allowing the core experience to be developed and tested without requiring banking integrations or a backend service.

## Features

### Financial Dashboard

- Overview of income, expenses, balance, and net cash flow.
- Income-versus-expenses visualization.
- Expense breakdown by category.
- Recent transaction activity.
- Monthly budget progress.
- Savings goals overview.
- Period-based financial summaries.

### Transaction Management

- Create, view, edit, and delete transactions.
- Distinguish between income and expenses.
- Search and filter by category, type, and date.
- Sort and paginate transaction records.
- Validate user input before saving.

### Budget Management

- Create monthly budgets by category.
- Track spending against allocated limits.
- Display remaining budget amounts.
- Highlight budgets approaching or exceeding their limits.

### Savings Goals

- Create and manage savings goals.
- Define target amounts and optional deadlines.
- Record contributions.
- Track progress toward financial targets.
- Mark completed goals.

### Personalization

- Light and dark themes.
- User preferences.
- Angolan kwanza currency formatting.
- Responsive layouts for desktop, tablet, and mobile.
- Option to reset demo data.

## Product Principles

KwanzaFlow is guided by five principles:

1. **Clarity over complexity** — financial information should be understandable at a glance.
2. **Local relevance** — currency formatting and product decisions should consider the Angolan context.
3. **Reliable calculations** — financial summaries should be derived from consistent, testable business logic.
4. **Accessibility by default** — interfaces should support keyboard navigation, readable contrast, and meaningful labels.
5. **Maintainability** — features should be organized so the application can evolve without unnecessary complexity.

## Design System

The visual direction combines minimalism with a financial-product identity.

| Token | Value | Purpose |
|---|---|---|
| Forest Green | `#102D26` | Primary brand color |
| Emerald | `#16A36A` | Highlights and positive actions |
| Canvas | `#F7F8F6` | Main background |
| Text | `#202923` | Primary text |
| Border | `#DCE3DE` | Dividers and component borders |
| Expense/Error | `#B54745` | Expense indicators and errors |

The interface uses consistent spacing, clear typography, subtle borders, rounded components, and restrained transitions.

## Technology Stack

The planned stack prioritizes a modern React development workflow and strong TypeScript practices.

| Technology | Purpose |
|---|---|
| Next.js App Router | Application structure and routing |
| React | Component-based UI |
| TypeScript | Static typing and safer refactoring |
| Tailwind CSS | Styling and responsive layouts |
| shadcn/ui + Radix UI | Accessible UI primitives |
| Lucide | Interface icons |
| Recharts | Financial data visualization |
| React Hook Form | Form state management |
| Zod | Input and data validation |
| date-fns | Date manipulation and period calculations |
| Vitest | Unit and component testing |
| React Testing Library | User-oriented component tests |
| Playwright | End-to-end testing |

> The final dependency list should reflect the packages actually installed and used in the repository.

## Architecture

The application follows a feature-oriented structure, separating user interface components, business logic, data access, and shared utilities.

```text
src/
├── app/
│   └── (dashboard)/
│       ├── layout.tsx
│       ├── page.tsx
│       ├── transactions/
│       │   └── page.tsx
│       ├── budgets/
│       │   └── page.tsx
│       ├── goals/
│       │   └── page.tsx
│       └── settings/
│           └── page.tsx
├── components/
│   ├── ui/
│   ├── layout/
│   ├── charts/
│   └── feedback/
├── constants/
│    └── index.ts
├── features/
│   ├── dashboard/
│   ├── transactions/
│   ├── budgets/
│   ├── goals/
│   └── settings/
├── lib/
│   ├── formatters/
│   ├── dates/
│   └── utils.ts
├── providers/
├── mocks/
└── types/
```

This structure is a proposed organizational baseline. Files and directories may evolve as implementation progresses.

### Architectural Decisions

- Keep financial calculations independent of UI components.
- Use Server Components by default and Client Components where interactivity or browser APIs require them.
- Encapsulate browser persistence behind a repository abstraction.
- Validate forms and persisted data.
- Derive dashboard metrics from the underlying transaction records.
- Avoid unnecessary abstractions and dependencies.

### Data Persistence

The MVP uses browser-based persistence for demonstration purposes.

The intended data flow is:

```text
UI Components
     ↓
Feature Hooks
     ↓
Business Services
     ↓
Repository Interface
     ↓
Browser Storage Adapter
```

This approach keeps storage details separate from business logic and provides a possible path toward a future backend implementation.

**Important:** browser storage is intended for demo data, not sensitive real-world financial information.

## Financial Data Integrity

Financial applications require particular care when handling amounts and calculations.

KwanzaFlow aims to:

- Represent monetary values using integer units at a documented scale rather than relying on floating-point arithmetic.
- Apply consistent date ranges and month boundaries.
- Calculate balances, spending totals, and budget progress from a single source of truth.
- Validate transaction amounts and required fields.
- Test financial calculations independently of the interface.
- Format monetary values according to the application's currency and locale settings.

## Getting Started

### Prerequisites

- Node.js LTS
- npm
- Git

### Installation

Clone the repository:

```bash
git clone https://github.com/dedaldinodev4/kwanza-flow
cd kwanzaflow
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Available Scripts

The following scripts are examples of the intended development workflow. Their availability depends on the current `package.json`.

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run test
```

Check the project's scripts before running commands that have not yet been configured.

## Testing Strategy

Testing should cover both individual financial rules and complete user workflows.

### Unit Tests

- Balance and cash-flow calculations.
- Category totals.
- Budget progress and limit handling.
- Savings goal progress.
- Currency formatting and date boundaries.

### Component Tests

- Form validation and submission.
- Transaction filtering and sorting.
- Empty states and feedback messages.
- Theme and preference interactions.

### End-to-End Tests

- Create and edit a transaction.
- Verify dashboard metrics after a transaction changes.
- Create a monthly budget and record spending.
- Create a savings goal and add a contribution.
- Verify persistence after reloading the application.

## Accessibility and Responsive Design

The interface targets WCAG 2.2 AA accessibility practices.

- Semantic HTML and accessible form labels.
- Keyboard navigation and visible focus indicators.
- Sufficient text and interface contrast.
- Reduced-motion support.
- Responsive layouts for small and large screens.
- Meaningful alternatives for charts and visual indicators.
- Clear validation, empty, error, and success states.

These are implementation goals and should be verified through actual testing.

## Development Roadmap

- [ ] Establish the design system and responsive application shell.
- [ ] Implement dashboard components and financial calculations.
- [ ] Build transaction management and browser persistence.
- [ ] Implement monthly budgets.
- [ ] Implement savings goals and contributions.
- [ ] Add settings and theme preferences.
- [ ] Write unit and component tests.
- [ ] Add end-to-end tests for critical workflows.
- [ ] Audit accessibility, responsive behavior, and performance.
- [ ] Prepare screenshots, documentation, and deployment.

## Scope and Limitations

The initial version is focused on demonstrating the core personal finance experience.

### Included in the MVP

- Demo financial data.
- Transaction management.
- Budget tracking.
- Savings goals.
- Browser-based persistence.
- Dashboard analytics.

### Outside the Initial Scope

- Direct bank connections.
- Real payments and money transfers.
- Automatic bank statement imports.
- Investment management.
- Shared financial accounts.
- AI-generated financial recommendations.
- Production backend and authentication.

These limitations may change as the project evolves.

## Future Improvements

Potential future directions include:

- Backend API and database integration.
- Authentication and secure multi-user data isolation.
- Data export and import.
- Financial reports with custom date ranges.
- Recurring transactions.
- Improved offline support.
- Deployment automation and continuous integration.

Future improvements will depend on user needs, technical priorities, and security requirements.

## Contributing

This project is being developed as a learning and portfolio initiative. Suggestions, issue reports, and constructive feedback are welcome.

1. Fork the repository.
2. Create a feature branch.
3. Make focused changes.
4. Run the available checks.
5. Submit a pull request describing the change.

## Disclaimer

KwanzaFlow is an educational and portfolio project. It is not a banking service, does not connect to financial institutions, and does not provide professional financial advice.

All sample financial data is for demonstration purposes.

## Author

**Dedaldino Daniel**

Software Engineer focused on frontend engineering, application architecture, and building practical digital products.

- GitHub: [GitHub Profile](https://github.com/dedaldinodev4)
- LinkedIn: [LinkedIn Profile](https://www.linkedin.com/in/dedaldino-daniel04/)

---

**KwanzaFlow — Make every kwanza count.**
