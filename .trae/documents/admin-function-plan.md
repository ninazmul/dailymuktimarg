
# Plan: Admin Function for Dashboard with RBAC

## Summary
We already have most of the RBAC infrastructure in place. Now, we need to create the missing user/roles management pages, update the sidebar to conditionally show items, add client-side permission helpers, and ensure all routes and components respect permissions.

## Files to Modify/Create

### 1. New Pages & Components
- `app/dashboard/users/page.tsx` - Users management server page
- `app/dashboard/users/UsersClient.tsx` - Users management client component
- `app/dashboard/roles/page.tsx` - Roles management server page
- `app/dashboard/roles/RolesClient.tsx` - Roles management client component
- `lib/hooks/use-permissions.ts` - Client-side permission helpers

### 2. Modified Files
- `app/dashboard/layout.tsx` (already good, keep as is)
- `app/dashboard/components/AdminSidebar.tsx` (update to conditionally show menu items)
- Also, review existing dashboard pages to ensure they use permission checks!

## Implementation Steps

### 1. First, let's create Client-Side Permission Hook (`lib/hooks/use-permissions.ts`)
- Create a hook that can be used in client components to check permissions and module access

### 2. Create Users Page
- Create `app/dashboard/users/page.tsx` - server page that fetches users/roles via rbac.actions
- Create `app/dashboard/users/UsersClient.tsx` - client component to manage users, assign roles, toggle status

### 3. Create Roles Page
- Create `app/dashboard/roles/page.tsx` - server page that fetches roles
- Create `app/dashboard/roles/RolesClient.tsx` - client component to create/update/delete roles and manage custom permissions per module

### 4. Update Admin Sidebar
- Modify `app/dashboard/components/AdminSidebar.tsx` to only show menu items user has access to (check `canAccessModule`)

### 5. Review and Test Existing Pages
- Check all existing dashboard pages to ensure they use requireDashboardAccess
- Check that write operations use requirePermission (already good for existing actions)
- Add client-side checks to hide add/edit/delete buttons if user doesn't have write permissions

## Notes
- We already have all the backend logic in `lib/actions/rbac.actions.ts` including seeding, role/user CRUD, and audit logs!
- Super Admin already has all permissions (handled in rbac-rules.ts)
- Clerk email verification is already handled in `getCurrentDashboardAccess` in `lib/auth/rbac.ts`!
