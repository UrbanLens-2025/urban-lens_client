# Component Analysis: CreateEventRequestPage

## Overview
**File**: `src/app/dashboard/creator/request/create/page.tsx`  
**Purpose**: Form component for creators to submit event requests with venue selection, dates, and validation documents.

---

## 1. Dependencies Analysis

### External Libraries
- **react-hook-form** - Form state management and validation
- **zod** - Schema validation (used with zodResolver)
- **date-fns** - Date formatting (`format` function)
- **use-debounce** - Debouncing search input for location search
- **@tanstack/react-query** - Data fetching and mutation (via hooks)
- **sonner** - Toast notifications (via `toast`)
- **next/navigation** - Navigation (used in hook, not directly)

### Internal Dependencies

#### UI Components (shadcn/ui)
- `Button`, `Card`, `CardContent`, `CardHeader`, `CardTitle`
- `Form`, `FormField`, `FormItem`, `FormLabel`, `FormControl`, `FormMessage`
- `Input`, `Textarea`, `Switch`
- `Popover`, `PopoverContent`, `PopoverTrigger`
- `Calendar` (from ui/calendar)
- `Command`, `CommandEmpty`, `CommandGroup`, `CommandInput`, `CommandItem`, `CommandList`

#### Shared Components
- `FileUpload` - For uploading event permit documents
- `TagMultiSelect` - Multi-select component for tags
- `DisplayTags` - Display selected tags

#### Custom Hooks
- `useCreateEventRequest` - Mutation hook for submitting event request
- `useBookableLocations` - Fetch available locations for booking
- `useResolvedTags` - Resolve tag IDs to tag objects for display

#### Utilities
- `cn` - Utility for className merging (from `@/lib/utils`)
- `CreateEventRequestPayload` - Type definition (from `@/types`)

#### Icons
- `CalendarIcon`, `Check`, `ChevronsUpDown`, `Loader2` from `lucide-react`

---

## 2. Coding Style Analysis

### ✅ **Strengths**

1. **Type Safety**
   - Uses TypeScript with Zod schema validation
   - Proper type inference (`z.infer<typeof formSchema>`)
   - Strong typing for props (`LocationComboBoxProps`)

2. **Form Management**
   - Uses `react-hook-form` for efficient form state
   - Proper validation with Zod resolver
   - Mode: `onChange` for real-time validation, `onBlur` for re-validation

3. **Component Organization**
   - `LocationComboBox` extracted as separate component (good separation)
   - Clear component structure with logical sections

4. **UX Patterns**
   - Debounced search (300ms) for location fetching
   - Conditional rendering (date pickers only show after location selection)
   - Loading states (`Loader2` spinner)
   - Error handling and validation messages

5. **Accessibility**
   - Uses `role="combobox"` and `aria-expanded`
   - Semantic HTML structure

### ⚠️ **Issues & Concerns**

1. **Mixed Language**
   ```typescript
   // Vietnamese validation messages in schema
   "Tên sự kiện bắt buộc"  // Should be English for consistency
   "Mô tả bắt buộc"
   ```
   **Issue**: Validation error messages are in Vietnamese, inconsistent with English UI labels.

2. **Console.log Statements**
   ```typescript
   console.log(form.formState.errors);  // Line 177
   console.log(payload);  // Line 195
   ```
   **Issue**: Debug code left in production component. Should be removed or wrapped in development-only checks.

3. **Date/Time Input Limitation**
   - Only date selection (no time input)
   - Calendar component uses `mode="single"` - only dates, no time
   - The API expects full ISO datetime strings, but form only collects dates
   - **Critical**: Start/end times are not captured, only dates!

4. **Missing Social Links Input**
   - Schema includes `social` field, but no UI component to input social links
   - Defaults to empty array, but users can't add social links

5. **Location Search Limitation**
   - Comment says "Tải 20 kết quả" but limit is 10
   - No pagination for location results
   - If selected location not in current results, it won't display correctly

6. **Missing Validation**
   - No validation that `endDateTime > startDateTime`
   - `specialRequirements` is optional but schema allows empty string (should allow undefined/null)

7. **Code Comments in Vietnamese**
   ```typescript
   // Fetch locations dựa trên từ khóa search
   // Tải 20 kết quả  (but actually 10)
   ```
   **Issue**: Mixed language in comments.

8. **Unused Import**
   - `toast` is imported but never used in component (only in hook)

9. **Date Transformation Logic**
   - Converting Date objects to ISO strings in `onSubmit`
   - No time component, so times will default to midnight or current time

---

## 3. API Payload Compatibility

### API Expected Body Structure:
```json
{
  "eventName": "string",
  "eventDescription": "string",
  "expectedNumberOfParticipants": 0,
  "allowTickets": true,
  "specialRequirements": "string",
  "tagIds": [1, 2, 3],
  "social": [{
    "platform": "Facebook",
    "url": "http://facebook.com/profile",
    "isMain": true
  }],
  "locationId": "string",
  "dates": [{
    "startDateTime": "2025-11-03T12:10:31.847Z",
    "endDateTime": "2025-11-04T00:10:31.849Z"
  }],
  "eventValidationDocuments": [{
    "documentType": "EVENT_PERMIT",
    "documentImageUrls": ["http://google.com"]
  }]
}
```

### Component Payload Generation:
```typescript
const payload: CreateEventRequestPayload = {
  ...rest,  // Contains: eventName, eventDescription, expectedNumberOfParticipants, 
            // allowTickets, specialRequirements, tagIds, social, locationId, 
            // eventValidationDocuments
  social: values.social || [],
  dates: [{
    startDateTime: startDateTime.toISOString(),
    endDateTime: endDateTime.toISOString(),
  }],
};
```

### ✅ **Compatible Fields**
- ✅ `eventName` - Form field matches
- ✅ `eventDescription` - Form field matches
- ✅ `expectedNumberOfParticipants` - Form field matches
- ✅ `allowTickets` - Switch field matches
- ✅ `specialRequirements` - Optional textarea matches
- ✅ `tagIds` - Array from TagMultiSelect matches
- ✅ `locationId` - UUID from LocationComboBox matches
- ✅ `dates` - Array with startDateTime/endDateTime matches
- ✅ `eventValidationDocuments` - Array with documentType and imageUrls matches

### ⚠️ **Issues**

1. **Missing Social Links Input**
   - Field exists in schema and payload, but no UI to add social links
   - Defaults to `[]`, but users cannot input social media links

2. **Date/Time Issue**
   - Form only captures **dates**, not **times**
   - `startDateTime.toISOString()` will use current time or midnight
   - API expects specific times, but user cannot specify them
   - **This is a critical UX/functionality gap**

3. **specialRequirements Handling**
   - If empty string `""`, it will be sent (should be omitted if empty)
   - Type definition allows `string | undefined`, but form sends empty string

---

## 4. Navigation & Post-Submit Behavior

### Current Implementation:
```typescript
// In useCreateEventRequest hook
onSuccess: () => {
  toast.success("Event request submitted successfully!");
  queryClient.invalidateQueries({ queryKey: ['eventRequests'] });
  router.push('/dashboard/creator/event-requests');  // ← Navigates here
}
```

### Navigation Destination:
- **Current**: `/dashboard/creator/event-requests`
- **Expected**: Should navigate to events dashboard after submission

### Route Structure:
Based on file structure:
- `/dashboard/creator/request` - Event requests list page ✅ (where it goes)
- `/dashboard/creator/events` - Events dashboard (user mentioned "events dashboard")
- `/dashboard/creator/request/create` - Current create page

### ✅ **Navigation is Working**
The hook correctly navigates to `/dashboard/creator/event-requests` after successful submission. However, user mentioned "events dashboard" - this might be `/dashboard/creator/events` instead.

### ⚠️ **Potential Issue**
User mentioned: "After that, it should go to the events dashboard (I don't know if it's done here)."

**Current**: Goes to `/dashboard/creator/event-requests` (event requests list)  
**Might need**: `/dashboard/creator/events` (events dashboard)

**Action Required**: Clarify if navigation should go to:
- `/dashboard/creator/event-requests` (current - shows pending requests)
- `/dashboard/creator/events` (shows approved/published events)

---

## 5. Missing Features & Recommendations

### Critical Issues

1. **Time Input Missing**
   - Add time pickers or datetime inputs
   - Currently only dates are captured

2. **Social Links Input**
   - Add UI to input social media links
   - Include platform dropdown, URL input, "isMain" checkbox

3. **Date Validation**
   - Ensure `endDateTime > startDateTime`
   - Add validation message if invalid

### Recommended Improvements

1. **Remove Debug Code**
   ```typescript
   // Remove these:
   console.log(form.formState.errors);
   console.log(payload);
   ```

2. **Standardize Language**
   - Change Vietnamese validation messages to English
   - Update comments to English

3. **Improve Location Selection**
   - Fix comment (20 vs 10)
   - Handle case where selected location not in search results
   - Add pagination or "load more" for locations

4. **Better Error Handling**
   - Show specific error messages from API
   - Handle network errors gracefully

5. **UX Enhancements**
   - Add loading state during submission
   - Disable form during submission
   - Show success feedback before navigation
   - Add "Cancel" button to go back

6. **Code Quality**
   - Remove unused `toast` import
   - Add JSDoc comments for complex functions
   - Extract date formatting logic

---

## 6. Component Flow

```
1. User fills form:
   - Event name, description, participants
   - Special requirements (optional)
   - Toggle allow tickets
   - Select location (searchable combo box)
   - Select start/end dates (only if location selected)
   - Select tags (multi-select)
   - Upload event permit documents

2. Form validation:
   - Zod schema validates on change
   - Errors shown below each field
   - Submit button disabled if invalid

3. On submit:
   - Transform dates to ISO strings
   - Create payload matching API structure
   - Call mutation hook

4. After successful submission:
   - Show success toast
   - Invalidate queries
   - Navigate to event requests page
```

---

## 7. Summary

### ✅ What's Working
- Form structure and validation
- Location selection with search
- Tag selection
- Document upload
- API payload structure matches
- Navigation after submission

### ⚠️ Needs Attention
- **Critical**: Add time inputs for start/end times
- Missing social links input UI
- Remove debug console.logs
- Standardize language (Vietnamese → English)
- Fix date validation (end > start)
- Clarify navigation destination

### 📋 Action Items
1. Add datetime pickers (not just date)
2. Add social links input component
3. Remove console.log statements
4. Translate validation messages to English
5. Add end date > start date validation
6. Confirm navigation destination
7. Handle empty specialRequirements properly
8. Remove unused imports

