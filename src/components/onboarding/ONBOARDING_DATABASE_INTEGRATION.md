# Agency Onboarding Wizard - Database Integration Requirements

## Overview

This document outlines the database tables, columns, and API endpoints required to fully integrate the redesigned Agency Onboarding Wizard with the backend.

## Form Data Structure

The onboarding wizard collects the following data:

```typescript
interface OnboardingFormData {
  // Step 1: Agency Identity
  agencyName: string;           // Required - Agency display name
  domain: string;               // Required - Subdomain slug (e.g., "acme-corp")
  domainSuffix: string;         // Required - TLD (e.g., ".app", ".io")
  tagline: string;              // Optional - Agency tagline/slogan
  
  // Step 2: Business Profile
  industry: string;             // Required - Industry category
  companySize: string;          // Required - Team size range
  primaryFocus: string;         // Optional - Primary use case
  country: string;              // Optional - Country code
  timezone: string;             // Optional - Timezone identifier
  
  // Step 3: Admin Account
  adminName: string;            // Required - Super Admin full name
  adminEmail: string;           // Required - Super Admin email
  adminPassword: string;        // Required - Super Admin password
  confirmPassword: string;      // Required - Password confirmation (client-side only)
  
  // Step 4: Review & Launch
  agreeToTerms: boolean;        // Required - Terms acceptance
  enableGST: boolean;           // Optional - GST/Tax enabled
  subscriptionPlan: string;     // Required - Selected plan
}
```

## Database Schema Requirements

### 1. Agencies Table

```sql
CREATE TABLE agencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  domain VARCHAR(255) UNIQUE NOT NULL,
  tagline VARCHAR(500),
  industry VARCHAR(100),
  company_size VARCHAR(50),
  primary_focus VARCHAR(100),
  country VARCHAR(10) DEFAULT 'IN',
  timezone VARCHAR(100) DEFAULT 'Asia/Kolkata',
  subscription_plan VARCHAR(50) DEFAULT 'professional',
  enable_gst BOOLEAN DEFAULT true,
  status VARCHAR(50) DEFAULT 'active',
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_agencies_slug ON agencies(slug);
CREATE INDEX idx_agencies_domain ON agencies(domain);
CREATE INDEX idx_agencies_status ON agencies(status);
```

### 2. Agency Admin Users Table (or extend existing users table)

```sql
-- If using separate agency_admins table:
CREATE TABLE agency_admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  role VARCHAR(50) DEFAULT 'super_admin',
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_agency_admins_agency ON agency_admins(agency_id);
CREATE INDEX idx_agency_admins_user ON agency_admins(user_id);
```

### 3. Industry Options Table (Optional - for dynamic industry list)

```sql
CREATE TABLE industry_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  value VARCHAR(100) UNIQUE NOT NULL,
  label VARCHAR(255) NOT NULL,
  icon VARCHAR(50),
  description VARCHAR(500),
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true
);
```

## API Endpoints Required

### 1. Check Domain Availability

**Endpoint:** `GET /api/agencies/check-domain`

**Query Parameters:**
- `domain` (string, required): The subdomain to check

**Response:**
```json
{
  "available": true,
  "domain": "acme-corp",
  "suggestions": ["acme-corp-1", "acme-corporation"]
}
```

### 2. Create Agency

**Endpoint:** `POST /api/agencies/create`

**Request Body:**
```json
{
  "agencyName": "Acme Corporation",
  "domain": "acme-corp.app",
  "adminName": "John Smith",
  "adminEmail": "john@acme.com",
  "adminPassword": "SecurePass123!",
  "industry": "technology",
  "companySize": "11-50",
  "primaryFocus": "projects",
  "country": "IN",
  "timezone": "Asia/Kolkata",
  "enableGST": true,
  "subscriptionPlan": "professional"
}
```

**Response:**
```json
{
  "success": true,
  "agency": {
    "id": "uuid",
    "name": "Acme Corporation",
    "domain": "acme-corp.app",
    "slug": "acme-corp"
  },
  "admin": {
    "id": "uuid",
    "email": "john@acme.com"
  }
}
```

### 3. Validate Agency Name (Optional)

**Endpoint:** `POST /api/agencies/validate-name`

**Request Body:**
```json
{
  "name": "Acme Corporation"
}
```

**Response:**
```json
{
  "valid": true,
  "suggestions": []
}
```

## Backend Implementation Checklist

- [ ] Create/update `agencies` table schema
- [ ] Create/update `agency_admins` table schema  
- [ ] Implement domain availability check endpoint
- [ ] Implement agency creation endpoint with:
  - [ ] Domain uniqueness validation
  - [ ] Admin user creation in auth system
  - [ ] Initial agency settings configuration
  - [ ] Welcome email sending
  - [ ] Default modules/features setup
- [ ] Add RLS policies for agency isolation
- [ ] Create database triggers for `updated_at` timestamps
- [ ] Set up proper error handling and validation

## Security Considerations

1. **Password Requirements:**
   - Minimum 8 characters
   - Must contain at least one letter
   - Must contain at least one number
   - Special characters recommended

2. **Domain Validation:**
   - Only lowercase letters, numbers, and hyphens
   - 3-30 characters length
   - Cannot start or end with hyphen
   - Must be unique across all agencies

3. **Rate Limiting:**
   - Domain check: 10 requests/minute
   - Agency creation: 3 requests/minute per IP

4. **Data Sanitization:**
   - Strip HTML from all text inputs
   - Validate email format
   - Normalize domain to lowercase

## Initial Setup Data

After agency creation, the following should be auto-configured:

1. **Default Departments:** General, Sales, Operations
2. **Default Roles:** Super Admin, Admin, Manager, Employee
3. **Default Settings:** Currency based on country, Date format based on timezone
4. **Feature Flags:** Based on subscription plan and primary focus

## Migration Notes

If migrating from the old onboarding system:

1. The form data structure has changed - update any localStorage keys
2. Old draft key: `agency_onboarding_draft`
3. New draft key: `onboarding_draft_v2`
4. Clear old drafts on successful migration

## Testing Checklist

- [ ] Test domain availability check
- [ ] Test duplicate domain handling
- [ ] Test invalid domain formats
- [ ] Test password validation
- [ ] Test email validation
- [ ] Test agency creation flow
- [ ] Test auto-login after creation
- [ ] Test form persistence (draft saving)
- [ ] Test form restoration from draft
- [ ] Test error handling and display
