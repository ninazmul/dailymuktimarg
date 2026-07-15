
# Plan to Remove Site Name, Logo, Favicon from Settings

## Summary
This plan outlines how to remove siteName, logo, favicon from the settings model, actions, and all dependent components, and replace them with hardcoded values.

## Files to Modify

1. `lib/database/models/setting.model.ts` - Remove fields from model and interface
2. `lib/actions/setting.actions.ts` - Remove fields from update action
3. `types/index.ts` - Remove fields from SettingFormParams type
4. `app/dashboard/settings/SettingsClient.tsx` - Remove UI inputs for those fields
5. `app/(root)/layout.tsx` - Remove siteName and logo props
6. `components/shared/Header.tsx` - Remove siteName and logo props
7. `components/shared/Footer.tsx` - Remove siteName prop
8. `app/feed.xml/route.ts` - Replace siteName with hardcoded value

## Steps

### 1. Update the Setting Model and Interface (`lib/database/models/setting.model.ts`)
   - Remove `siteName`, `logo`, and `favicon` from `ISetting` interface
   - Remove corresponding fields from `SettingSchema`

### 2. Update Setting Actions (`lib/actions/setting.actions.ts`)
   - Update `updateSetting` function
     - Remove `siteName`, `logo`, `favicon` handling
   - Update `getSetting` (no changes needed, just pass through)

### 3. Update Types (`types/index.ts`)
   - Remove `siteName`, `logo`, `favicon` from `SettingFormParams` type

### 4. Update Settings UI (`app/dashboard/settings/SettingsClient.tsx`)
   - Remove state variables: `siteName`, `logo`, `favicon`
   - Remove corresponding UI inputs (site name, logo URL, favicon URL
   - Remove media library integration for logo/favicon

### 5. Update Layout (`app/(root)/layout.tsx`)
   - Remove `siteName` and `logo` props from `Header`
   - Remove `siteName` prop from `Footer`

### 6. Update Header Component (`components/shared/Header.tsx`)
   - Update `HeaderProps` interface
   - Hardcode site name to "Daily Muktimarg"
   - Remove logo handling
   - Remove site name and logo from UI

### 7. Update Footer Component (`components/shared/Footer.tsx`)
   - Update `FooterProps` interface
   - Hardcode site name to "Daily Muktimarg"

### 8. Update Feed XML Route (`app/feed.xml/route.ts`)
   - Replace siteName variable with hardcoded "Daily Muktimarg"
