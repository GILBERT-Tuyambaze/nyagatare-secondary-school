# Project Summary
Nyagatare Secondary School is a web application designed to facilitate the management of student enrollment, board member information, and administrative tasks. It aims to provide a streamlined experience for students, parents, and school administrators, enhancing communication and transparency within the school's operations.

# Project Module Description
- **Authentication**: Manages user sessions and permissions for admins and staff.
- **Board Member Management**: Allows admins to add, edit, and delete board member profiles.
- **Student Portal**: Enables students to track their application status and view important information.
- **Admin Dashboard**: Provides insights into applications, events, and donations, with functionalities for managing these aspects.

# Directory Tree
```
/workspace
├── DESIGN_BRIEF.md
├── README.md
├── components.json
├── eslint.config.js
├── index.html
├── package.json
├── pnpm-lock.yaml
├── postcss.config.js
├── public/
│   ├── assets/
│   ├── favicon.svg
│   ├── images/
│   └── robots.txt
├── src/
│   ├── App.css
│   ├── App.tsx
│   ├── components/
│   ├── contexts/
│   ├── hooks/
│   ├── lib/
│   ├── pages/
│   ├── services/
│   ├── types/
│   ├── vite-env.d.ts
│   └── main.tsx
├── tailwind.config.ts
├── template_config.json
└── uploads/
    ├── DATABASE_SCHEMA.sql
    └── shadcn-ui.zip
```

# File Description Inventory
- **DESIGN_BRIEF.md**: Document outlining the project design and objectives.
- **README.md**: General information about the project, setup instructions, and usage.
- **index.html**: Main HTML file for the application.
- **package.json**: Contains project dependencies and scripts.
- **src/**: Contains all source code files, organized by components, contexts, hooks, pages, and services.
- **uploads/**: Directory for SQL schema and other uploaded files.

# Technology Stack
- **Frontend**: React, TypeScript, Tailwind CSS
- **State Management**: Context API
- **Database**: Supabase
- **Routing**: React Router
- **Build Tool**: Vite

# Usage
1. **Install Dependencies**: Run `pnpm install` in the project root.
2. **Build the Project**: Execute `pnpm run build` to create a production build.
3. **Run the Application**: Use `pnpm run start` to run the application.
