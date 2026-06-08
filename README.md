# New More Advanced CRM

This CRM is built to manage student inquiries from first contact to follow-up, assignment, discussion history, and final status. It is designed for admission teams where many employees may view an inquiry, but only permitted or assigned users can update the working details.

The system currently focuses on these core modules:

- Employee
- Inquiry
- Stream
- Program
- Campus

## Main Use Case

The CRM helps an institute collect student inquiries, assign them to employees, track every follow-up discussion, and manage inquiry progress by status.

Typical flow:

1. A Super Admin creates employees and assigns roles/permissions.
2. Programs and campuses are created in their own management modules.
3. Inquiries are added manually or imported from a CSV file.
4. Before CSV import is submitted, the user can review the inquiry rows in a table.
5. A Super Admin or permitted manager assigns inquiries to employees.
6. The assigned employee follows the inquiry, updates status, department, next follow-up date, and discussion stream.
7. Other permitted employees can view inquiry detail and add stream discussion when needed, especially when the assigned employee is absent.
8. Inquiry history remains available under the inquiry so the team can understand the last discussion and full communication record.

## Employee Module

Employees are application users. They are created and managed by Super Admin or users with employee management permission.

Employees are used to control who can view, create, assign, update, and manage inquiries.

Required or important employee fields:

- First Name
- Last Name
- Father's Name
- CNIC
- Date of Birth
- Gender
- Religion
- Blood Group
- Marital Status
- Nationality
- Domicile
- Phone / Mobile No.
- Personal Email
- Official Email
- City
- Address
- Department
- Designation
- Role
- Permissions
- Image
- Campus
- Emergency Contact Name
- Emergency Contact Relationship
- Emergency Contact Number

### Employee Use Cases

- Create staff accounts for admission, academics, accounts, or admin work.
- Assign roles such as Super Admin, Admin, or User.
- Give custom permissions when one employee needs special access.
- Control which employee can manage inquiries, programs, campuses, or other users.

## Roles And Permissions

Roles are managed through enums in the code so they stay consistent across the project.

Available roles:

- Super Admin
- Admin
- User

Available permissions:

- Manage users
- View users
- View inquiries
- Create inquiries
- Import inquiries
- Manage all inquiries
- Update assigned inquiries
- Add inquiry streams
- Manage programs
- Manage campuses

### Role Behavior

Super Admin:

- Has all permissions.
- Can create and manage employees.
- Can assign and reassign inquiries.
- Can manage programs and campuses.
- Can manage all inquiry records.

Admin:

- Can view users.
- Can create, import, manage, and update inquiries.
- Can add stream discussion.
- Can manage programs and campuses.

User:

- Can view inquiries.
- Can create new inquiries.
- Can update assigned inquiries.
- Can add stream discussion.
- Cannot manage employees, programs, campuses, imports, or all inquiries unless custom permission is granted.

Note: if a user has custom permissions saved, those custom permissions override the default role permissions.

## Inquiry Module

Inquiry is the main student lead record. It stores student contact information, program interest, campus, source, assignment, status, department, and follow-up date.

Important inquiry fields:

- Name
- Phone
- Email
- City
- Address
- Source
- Program
- Previous Program
- Campus
- Status
- Assigned User
- Department
- Next Follow-Up Date
- Message

### Inquiry Use Cases

- Add a new student inquiry manually from a modal.
- Import many inquiries from a CSV file.
- Review CSV rows before submitting import.
- Search inquiries by student detail or discussion.
- Filter inquiries by status, user, program, campus, source, and date range.
- Assign or reassign inquiries from the table.
- View inquiry detail from the table action button.
- Track last discussion with a read-more option.
- Update status to show progress or close/transfer the query.

### Inquiry Assignment Rules

- Super Admin can assign inquiries to users.
- Super Admin can reassign inquiries when needed.
- Assigned users can update the working details of their own inquiries.
- Other users can view details and add discussion stream if they have permission.

## Stream Module

Stream is the discussion history of an inquiry. Each stream records what was discussed by an employee.

Important stream fields:

- Inquiry ID
- Response
- Employee/User ID
- Follow-up date, handled through inquiry next follow-up update
- Created date and time

### Stream Use Cases

- Add a new discussion after calling or messaging a student.
- Keep history when the assigned user is absent.
- Show all employee discussions under the inquiry.
- Understand the last discussion without opening the full inquiry.
- Audit who said what and when.

## Program Module

Program stores the courses or academic programs that can be selected in an inquiry.

Important program fields:

- Program ID
- Program Name
- Duration
- Fee

### Program Use Cases

- Create available programs.
- Update duration or fee.
- Connect inquiries with a selected program.
- Keep program data reusable and clean instead of typing it again for every inquiry.

## Campus Module

Campus stores institute campuses or branches. Inquiry records can be linked with a campus.

Important campus fields:

- Campus Name
- City
- Address

### Campus Use Cases

- Create and manage campuses from the Campuses page.
- Select campus when adding an inquiry.
- Import campus data from CSV by campus name.
- Filter inquiry table by campus.
- Keep campus values categorized and consistent.

## CSV Inquiry Import

The project includes a sample CSV file:

`sample-inquiries-upload.csv`

CSV import supports inquiry fields such as:

- name
- phone
- email
- city
- address
- source
- program
- previous_program
- campus
- status
- assigned_user
- department
- next_follow_up_at
- message

Import behavior:

- User selects a CSV file.
- System reads the rows and shows a review table before final submit.
- User confirms the import.
- Matching programs, campuses, and assigned users are connected when possible.
- Campus names from CSV can create or connect to managed campus records.

## Dashboard And Data Table

The dashboard/inquiry table is the daily working area.

Table features:

- Search bar at the top.
- Filters for status, assigned user, program, campus, source, and date range.
- Checkbox selection for assignment actions.
- View action button beside the checkbox.
- Last discussion preview with read-more option.
- Bottom inquiry table for quick working.
- Light and dark theme toggle.

## Status And Soft Closing

Inquiry status is used to track the lifecycle of the query.

Examples:

- Pending
- Interested
- Call back
- Will visit
- Visited
- Not interested
- Not eligible
- Not responding
- Admission fee paid

Queries can be transferred by reassignment or effectively closed by status. A future improvement can add formal soft delete or archive screens if the team wants separated closed records.

## Current Limitations

- Follow-up date is stored on the inquiry, not as a separate stream field.
- Soft delete/archive workflow is not fully separated yet.
- Employee image and campus assignment may need frontend form completion depending on final HR requirements.
- Notifications/reminders for next follow-up are not yet automated.
- Stream tabs by employee can be improved further into a dedicated tabbed history UI.
- CSV import depends on clean column names and matching data.

## Suggested Next Module Plan

Recommended next improvements:

1. Add a dedicated follow-up schedule module with reminders.
2. Add stream history tabs grouped by employee.
3. Add inquiry archive/soft-delete workflow.
4. Add employee image upload and campus assignment in employee forms.
5. Add notification alerts for overdue follow-ups.
6. Add reporting for inquiry source, campus, program, employee performance, and conversion status.
7. Add export to CSV/Excel for filtered inquiry data.

## Developer Notes

Technology stack:

- Laravel
- Inertia.js
- React
- TypeScript
- Vite
- MySQL
- Docker

Useful commands:

```bash
docker compose up -d
docker compose exec php php artisan migrate --force
docker compose exec php php artisan test
npm run types:check
npm run build
```

The codebase is organized around Laravel models, controllers, requests, policies, enums, and Inertia React pages. Forms are designed as modals so users can work without leaving the current page.
