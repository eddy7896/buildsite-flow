# Core Authentication Schema - Visual Diagrams

## Entity Relationship Diagram (ERD)

### Complete Schema Relationships

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    CORE AUTHENTICATION SCHEMA                               │
└─────────────────────────────────────────────────────────────────────────────┘

                              ┌──────────────┐
                              │    users     │
                              ├──────────────┤
                              │ id (PK)      │
                              │ email        │
                              │ password_hash│
                              │ is_active    │
                              │ created_at   │
                              │ updated_at   │
                              └──────┬───────┘
                                     │
                    ┌────────────────┼────────────────┐
                    │                │                │
                    │ 1:1            │ 1:1            │ 1:N
                    ▼                ▼                ▼
            ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
            │  profiles    │  │employee_     │  │ user_roles   │
            ├──────────────┤  │ details      │  ├──────────────┤
            │ id (PK)      │  ├──────────────┤  │ id (PK)      │
            │ user_id (FK) │  │ id (PK)      │  │ user_id (FK) │
            │ full_name    │  │ user_id (FK) │  │ role         │
            │ phone        │  │ employee_id  │  │ assigned_at  │
            │ department   │  │ first_name   │  │ assigned_by  │
            │ position     │  │ last_name    │  │ agency_id    │
            │ hire_date    │  │ date_of_birth│  └──────────────┘
            │ avatar_url   │  │ ssn (ENC)    │
            │ is_active    │  │ employment_  │
            │ agency_id    │  │ type         │
            │ created_at   │  │ supervisor_id│
            │ updated_at   │  │ skills (JSON)│
            └──────────────┘  │ is_active    │
                              │ agency_id    │
                              │ created_at   │
                              │ updated_at   │
                              └──────┬───────┘
                                     │
                                     │ 1:1
                                     ▼
                              ┌──────────────────┐
                              │employee_salary_  │
                              │details           │
                              ├──────────────────┤
                              │ id (PK)          │
                              │ employee_id (FK) │
                              │ salary           │
                              │ currency         │
                              │ salary_frequency │
                              │ effective_date   │
                              │ agency_id        │
                              │ created_at       │
                              │ updated_at       │
                              └──────────────────┘

                              ┌──────────────────┐
                              │employee_files    │
                              ├──────────────────┤
                              │ id (PK)          │
                              │ employee_id (FK) │
                              │ file_name        │
                              │ file_path        │
                              │ file_type        │
                              │ file_size        │
                              │ category         │
                              │ uploaded_by (FK) │
                              │ created_at       │
                              └──────────────────┘

                              ┌──────────────────┐
                              │audit_logs        │
                              ├──────────────────┤
                              │ id (PK)          │
                              │ table_name       │
                              │ action           │
                              │ user_id (FK)     │
                              │ record_id        │
                              │ old_values (JSON)│
                              │ new_values (JSON)│
                              │ ip_address       │
                              │ user_agent       │
                              │ created_at       │
                              └──────────────────┘
```

---

## Data Flow Diagram

### User Creation Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         USER CREATION FLOW                                  │
└─────────────────────────────────────────────────────────────────────────────┘

1. Application calls:
   INSERT INTO public.users (email, password_hash, raw_user_meta_data)
   
                              ▼
                    
2. PostgreSQL receives INSERT
   
                              ▼
                    
3. Trigger: on_auth_user_created fires (AFTER INSERT)
   
                              ▼
                    
4. Function: handle_new_user() executes
   ├─ Creates profile record
   │  INSERT INTO public.profiles (user_id, full_name)
   │
   └─ Assigns default role
      INSERT INTO public.user_roles (user_id, role)
      VALUES (new_user_id, 'employee')
   
                              ▼
                    
5. Result:
   ✓ User created in users table
   ✓ Profile created in profiles table
   ✓ Default 'employee' role assigned
   ✓ Audit log entry created (if applicable)
```

---

## Role-Based Access Control (RBAC) Flow

### Permission Check Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    ROLE-BASED ACCESS CONTROL FLOW                           │
└─────────────────────────────────────────────────────────────────────────────┘

User attempts to access resource
                              │
                              ▼
Application sets context:
SET LOCAL app.current_user_id = 'user-id'
                              │
                              ▼
Query executes with RLS policies
                              │
                              ▼
RLS Policy evaluates:
has_role(current_user_id(), 'admin'::app_role)
                              │
                    ┌─────────┴─────────┐
                    │                   │
                    ▼                   ▼
                  TRUE              FALSE
                    │                   │
                    ▼                   ▼
            Access GRANTED      Access DENIED
            (return data)       (return empty)
                    │                   │
                    └─────────┬─────────┘
                              ▼
            Audit log entry created
            (if sensitive table)
```

---

## Encryption/Decryption Flow

### SSN Encryption Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    SSN ENCRYPTION/DECRYPTION FLOW                           │
└─────────────────────────────────────────────────────────────────────────────┘

ENCRYPTION:
───────────

Plain SSN: "123-45-6789"
           │
           ▼
Function: encrypt_ssn(ssn, key)
           │
           ├─ Check if NULL
           │
           ├─ Use pgcrypto AES encryption
           │  encrypt(ssn::bytea, key::bytea, 'aes')
           │
           ├─ Encode to base64
           │  encode(..., 'base64')
           │
           ▼
Encrypted: "A1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6"
           │
           ▼
Store in database


DECRYPTION:
───────────

Encrypted: "A1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6"
           │
           ▼
Function: decrypt_ssn(encrypted, key)
           │
           ├─ Check if NULL
           │
           ├─ Check user role
           │  ├─ admin? ──────────────┐
           │  ├─ hr? ────────────────┐│
           │  └─ super_admin? ──────┐││
           │                        │││
           │                    ┌───┴┴┴─────┐
           │                    │            │
           │                    ▼            ▼
           │                  YES           NO
           │                    │            │
           │                    ▼            ▼
           │              Decrypt      Return masked
           │              using key    "***-**-****"
           │                    │            │
           │                    └────┬───────┘
           │                         ▼
           ▼
Return: "123-45-6789" or "***-**-****"
```

---

## Audit Logging Flow

### Change Tracking Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         AUDIT LOGGING FLOW                                  │
└─────────────────────────────────────────────────────────────────────────────┘

User updates employee_details record
                              │
                              ▼
UPDATE query executes
                              │
                              ▼
Trigger: audit_employee_details fires (AFTER UPDATE)
                              │
                              ▼
Function: audit_trigger_function() executes
                              │
                    ┌─────────┴─────────┐
                    │                   │
                    ▼                   ▼
            Check table name    Is it sensitive?
            (employee_details,  (employee_details,
             employee_salary_   employee_salary_
             details,           details,
             user_roles)        user_roles)
                    │                   │
                    ├─ YES ────────────┐│
                    │                  ││
                    ▼                  ▼▼
            Insert audit log entry:
            ├─ table_name: 'employee_details'
            ├─ action: 'UPDATE'
            ├─ user_id: current_user_id()
            ├─ record_id: updated_record_id
            ├─ old_values: to_jsonb(OLD)
            ├─ new_values: to_jsonb(NEW)
            ├─ ip_address: (from application)
            ├─ user_agent: (from application)
            └─ created_at: now()
                    │
                    ▼
            Audit log entry stored
                    │
                    ▼
            Only admins can view
            (RLS policy enforced)
```

---

## Multi-Tenancy Isolation Flow

### Agency Isolation Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    MULTI-TENANCY ISOLATION FLOW                             │
└─────────────────────────────────────────────────────────────────────────────┘

User from Agency A logs in
                              │
                              ▼
Application sets context:
SET LOCAL app.current_user_id = 'user-id'
                              │
                              ▼
Query: SELECT * FROM profiles
                              │
                              ▼
RLS Policy evaluates:
agency_id = get_user_agency_id()
                              │
                              ▼
Function: get_user_agency_id()
                              │
                              ├─ SELECT agency_id FROM profiles
                              │  WHERE user_id = current_user_id()
                              │
                              ▼
Returns: 'agency-a-id'
                              │
                              ▼
RLS Policy filters:
WHERE agency_id = 'agency-a-id'
                              │
                              ▼
Result: Only Agency A profiles returned
        Agency B profiles hidden
        Agency C profiles hidden
                              │
                              ▼
User sees only their agency data
```

---

## Authentication Context Flow

### Application Integration Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                  APPLICATION INTEGRATION FLOW                               │
└─────────────────────────────────────────────────────────────────────────────┘

1. User logs in
   ├─ Email: user@example.com
   └─ Password: password123
                              │
                              ▼
2. Application verifies credentials
   SELECT * FROM public.users
   WHERE email = 'user@example.com'
   AND password_hash = crypt('password123', password_hash)
                              │
                              ▼
3. If valid, generate JWT token
   {
     "userId": "user-id-here",
     "email": "user@example.com",
     "exp": 1234567890
   }
                              │
                              ▼
4. Return token to client
   Client stores in localStorage/sessionStorage
                              │
                              ▼
5. For each API request
   ├─ Client sends: Authorization: Bearer <token>
   │
   ├─ Server verifies token
   │
   ├─ Extract userId from token
   │
   ├─ Set database context:
   │  SET LOCAL app.current_user_id = 'user-id-here'
   │
   └─ Execute query with RLS policies
                              │
                              ▼
6. Database enforces RLS
   ├─ Check user role
   ├─ Check agency isolation
   ├─ Return only authorized data
   └─ Log access to audit_logs
                              │
                              ▼
7. Return results to client
```

---

## Table Relationships Diagram

### Dependency Graph

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      TABLE DEPENDENCY GRAPH                                 │
└─────────────────────────────────────────────────────────────────────────────┘

                            ┌─────────────┐
                            │   users     │
                            │  (PRIMARY)  │
                            └──────┬──────┘
                                   │
                    ┌──────────────┼──────────────┐
                    │              │              │
                    ▼              ▼              ▼
            ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
            │  profiles    │ │employee_     │ │ user_roles   │
            │ (1:1)        │ │ details      │ │ (N:M)        │
            │              │ │ (1:1)        │ │              │
            └──────────────┘ └──────┬───────┘ └──────────────┘
                                    │
                                    ▼
                            ┌──────────────────┐
                            │employee_salary_  │
                            │details           │
                            │ (1:1)            │
                            └──────────────────┘

                            ┌──────────────────┐
                            │employee_files    │
                            │ (N:1)            │
                            └──────────────────┘

                            ┌──────────────────┐
                            │audit_logs        │
                            │ (N:1)            │
                            └──────────────────┘

Legend:
  1:1 = One-to-One relationship
  N:M = Many-to-Many relationship
  N:1 = Many-to-One relationship
```

---

## Security Layers Diagram

### Defense in Depth

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        SECURITY LAYERS                                      │
└─────────────────────────────────────────────────────────────────────────────┘

Layer 1: Application Level
┌─────────────────────────────────────────────────────────────────────────────┐
│ • Authentication (JWT tokens)                                               │
│ • Authorization checks                                                      │
│ • Input validation                                                          │
│ • HTTPS/TLS encryption                                                      │
└─────────────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
Layer 2: Database Connection
┌─────────────────────────────────────────────────────────────────────────────┐
│ • SSL/TLS connection                                                        │
│ • User authentication (password)                                            │
│ • Connection pooling                                                        │
└─────────────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
Layer 3: Row-Level Security (RLS)
┌─────────────────────────────────────────────────────────────────────────────┐
│ • Role-based policies                                                       │
│ • Agency isolation                                                          │
│ • User-specific data access                                                 │
│ • Sensitive data masking                                                    │
└─────────────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
Layer 4: Data Encryption
┌────────────────────────────────────────────────────────────────────���────────┐
│ • SSN encryption (AES)                                                      │
│ • Password hashing (bcrypt)                                                 │
│ • Sensitive field protection                                                │
└─────────────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
Layer 5: Audit & Monitoring
┌─────────────────────────────────────────────────────────────────────────────┐
│ • Audit logging                                                             │
│ • Change tracking                                                           │
│ • Access logging                                                            │
│ • Compliance reporting                                                      │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Query Execution Flow

### RLS Policy Enforcement

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    QUERY EXECUTION WITH RLS                                 │
└─────────────────────────────────────────────────────────────────────────────┘

1. Application sends query:
   SELECT * FROM public.employee_details WHERE employee_id = 'EMP-001'
                              │
                              ▼
2. PostgreSQL receives query
                              │
                              ▼
3. Check if RLS is enabled on table
   ├─ YES: Continue to step 4
   └─ NO: Execute query as-is
                              │
                              ▼
4. Get current user context
   current_user_id = 'user-id-here'
                              │
                              ▼
5. Evaluate RLS policies
   ├─ Policy 1: Users can view their own details
   │  WHERE user_id = current_user_id()
   │
   ├─ Policy 2: Admins can view all details
   │  WHERE has_role(current_user_id(), 'admin')
   │
   └─ Policy 3: HR can view all details
      WHERE has_role(current_user_id(), 'hr')
                              │
                              ▼
6. Combine policies with OR logic
   WHERE (user_id = current_user_id())
      OR (has_role(current_user_id(), 'admin'))
      OR (has_role(current_user_id(), 'hr'))
                              │
                              ▼
7. Apply to original query
   SELECT * FROM public.employee_details
   WHERE employee_id = 'EMP-001'
     AND ((user_id = current_user_id())
          OR (has_role(current_user_id(), 'admin'))
          OR (has_role(current_user_id(), 'hr')))
                              │
                              ▼
8. Execute modified query
                              │
                              ▼
9. Return results
   ├─ If user authorized: Return data
   └─ If user not authorized: Return empty result set
                              │
                              ▼
10. Log access (if applicable)
    INSERT INTO audit_logs (...)
```

---

## Index Usage Diagram

### Query Optimization

```
┌────────��────────────────────────────────────────────────────────────────────┐
│                        INDEX USAGE PATTERNS                                 │
└─────────────────────────────────────────────────────────────────────────────┘

Common Queries and Their Indexes:

1. Find user by email
   Query: SELECT * FROM users WHERE email = 'user@example.com'
   Index: idx_users_email ✓ USED
   
2. Get active users
   Query: SELECT * FROM users WHERE is_active = true
   Index: idx_users_is_active ✓ USED
   
3. Get user's profile
   Query: SELECT * FROM profiles WHERE user_id = 'user-id'
   Index: idx_profiles_user_id ✓ USED
   
4. Get user's roles
   Query: SELECT * FROM user_roles WHERE user_id = 'user-id'
   Index: idx_user_roles_user_id ✓ USED
   
5. Get employee by ID
   Query: SELECT * FROM employee_details WHERE employee_id = 'EMP-001'
   Index: idx_employee_details_employee_id ✓ USED
   
6. Get employee's supervisor
   Query: SELECT * FROM employee_details WHERE supervisor_id = 'user-id'
   Index: idx_employee_details_supervisor_id �� USED
   
7. Get agency employees
   Query: SELECT * FROM employee_details WHERE agency_id = 'agency-id'
   Index: idx_employee_details_agency_id ✓ USED
   
8. Get employee files
   Query: SELECT * FROM employee_files WHERE employee_id = 'emp-id'
   Index: idx_employee_files_employee_id ✓ USED
   
9. Get audit logs by table
   Query: SELECT * FROM audit_logs WHERE table_name = 'employee_details'
   Index: idx_audit_logs_table_name ✓ USED
   
10. Get recent changes
    Query: SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 10
    Index: idx_audit_logs_created_at ✓ USED
```

---

## Trigger Execution Timeline

### Automatic Actions

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      TRIGGER EXECUTION TIMELINE                             │
└─────────────────────────────────────────────────────────────────────────────┘

INSERT INTO users (email, password_hash, ...)
                              │
                              ▼
        ┌───��─────────────────────────────────┐
        │ BEFORE INSERT Triggers              │
        │ (None defined)                      │
        └─────────────────────────────────────┘
                              │
                              ▼
        ┌─────────────────────────────────────┐
        │ INSERT executes                     │
        │ Row inserted into users table       │
        └─────────────────────────────────────┘
                              │
                              ▼
        ┌─────────────────────────────────────┐
        │ AFTER INSERT Triggers               │
        │ 1. on_auth_user_created             │
        │    ├─ Create profile                │
        │    └─ Assign employee role          │
        └─────────────────────────────────────┘
                              │
                              ▼
        ┌─────────────────────────────��───────┐
        │ Result:                             │
        │ ✓ User created                      │
        │ ✓ Profile created                   │
        │ ✓ Role assigned                     │
        │ ✓ Audit log entry created          │
        └─────────────────────────────────────┘


UPDATE employee_details SET salary = 75000 WHERE id = 'emp-id'
                              │
                              ▼
        ┌─────────────────────────────────────┐
        │ BEFORE UPDATE Triggers              │
        │ 1. update_employee_details_updated_at│
        │    └─ Set updated_at = now()        │
        └─────────────────────────────────────┘
                              │
                              ▼
        ┌─────────────────────────────────────┐
        │ UPDATE executes                     │
        │ Row updated in employee_details     │
        └───────────────────────────────���─────┘
                              │
                              ▼
        ┌─��───────────────────────────────────┐
        │ AFTER UPDATE Triggers               │
        │ 1. audit_employee_details           │
        │    └─ Log change to audit_logs      │
        └─────────────────────────────────────┘
                              │
                              ▼
        ┌─────────────────────────────────────┐
        │ Result:                             │
        │ ✓ Row updated                       │
        │ ✓ Timestamp updated                 │
        │ ✓ Change logged                     │
        └─────────────────────────────────────┘
```

---

## Performance Optimization Diagram

### Query Performance Path

```
┌───────────────────────────────────────────────────────────��─────────────────┐
│                    QUERY PERFORMANCE OPTIMIZATION                           │
└─────────────────────────────────────────────────────────────────────────────┘

Slow Query (No Index):
┌─────────────────────────────────────────────────────────────────────────────┐
│ SELECT * FROM users WHERE email = 'user@example.com'                        │
│                                                                              │
│ Execution Plan:                                                              │
│ ├─ Seq Scan on users (Full table scan)                                      │
│ │  └─ Check every row                                                       │
│ │     └─ Time: O(n) - Linear                                                │
│ │        └─ 1,000,000 rows = 1,000,000 checks                               │
│ └─ Result: SLOW ✗                                                            │
└─────────────────────────────────────────────────────────────────────────────┘

Fast Query (With Index):
┌─────────────────────────────────────────────────────────────────────────────┐
│ CREATE INDEX idx_users_email ON users(email)                                │
│                                                                              │
│ SELECT * FROM users WHERE email = 'user@example.com'                        │
│                                                                              │
│ Execution Plan:                                                              │
│ ├─ Index Scan on idx_users_email (B-tree search)                            │
│ │  └─ Binary search through index                                           │
│ │     └─ Time: O(log n) - Logarithmic                                       │
│ │        └─ 1,000,000 rows = ~20 checks                                     │
│ └─ Result: FAST ✓                                                            │
└─────────────────────────────────────────────────────────────────────────────┘

Performance Improvement:
  Without Index: 1,000,000 checks
  With Index:    ~20 checks
  Speedup:       ~50,000x faster
```

---

## Summary

These diagrams illustrate:

1. **ERD** - Complete table relationships and structure
2. **Data Flow** - How data moves through the system
3. **RBAC Flow** - Permission checking process
4. **Encryption Flow** - SSN encryption/decryption
5. **Audit Flow** - Change tracking
6. **Multi-Tenancy** - Agency isolation
7. **Auth Context** - Application integration
8. **Dependencies** - Table relationships
9. **Security Layers** - Defense in depth
10. **Query Execution** - RLS enforcement
11. **Index Usage** - Query optimization
12. **Triggers** - Automatic actions
13. **Performance** - Optimization benefits

---

**For more details, see:**
- CORE_AUTH_SCHEMA_DOCUMENTATION.md
- CORE_AUTH_SCHEMA_QUICK_REFERENCE.md
- supabase/migrations/00_core_auth_schema.sql

---

**Last Updated:** 2025-01-15  
**Status:** Ready for Reference
