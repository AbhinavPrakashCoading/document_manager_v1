# DocKit Redirection Architecture

## Overview
DocKit is a product application under the Rythmiq company umbrella. Authentication and user onboarding happen on the main Rythmiq website, then users are redirected to DocKit for document processing.

## Architecture Flow

```
🌐 Rythmiq Website (rythmiq.com)
    ↓ User Registration/Login
📱 Authentication & Session Creation
    ↓ Generate JWT Token
🚀 Redirect to DocKit
    ↓ dockit.rythmiq.com/?token=xxx&mode=user|guest
📊 DocKit Entry Point (/)
    ├── Validate Rythmiq token
    ├── Establish local session
    └── Route to dashboard
```

## URL Parameters

### From Rythmiq → DocKit
- `token` - JWT token from Rythmiq authentication
- `mode` - User type: `user` (authenticated) or `guest`
- `redirect` - Optional deep link (default: `/dashboard`)

### Example URLs
```
# Authenticated user
https://dockit.rythmiq.com/?token=eyJ0eXAi...&mode=user

# Guest user
https://dockit.rythmiq.com/?token=guest_token&mode=guest

# Deep link to upload
https://dockit.rythmiq.com/?token=eyJ0eXAi...&mode=user&redirect=/upload
```

## Implementation Details

### Entry Point (`/src/app/page.tsx`)
- Receives users from Rythmiq website
- Validates authentication tokens
- Handles session establishment
- Routes to appropriate dashboard

### Removed Components
- ❌ Landing page marketing content
- ❌ Sign-up/Sign-in pages
- ❌ Authentication forms
- ✅ Kept: Callback handlers for NextAuth

### Core Features Preserved
- ✅ Dashboard with analytics
- ✅ Document upload with AI validation
- ✅ Exam selection system
- ✅ 10 Autonomous API endpoints
- ✅ Guest mode functionality

## Integration Points

### Rythmiq Website Responsibilities
1. User registration/authentication
2. JWT token generation
3. User role/permission management
4. Redirect to DocKit with proper parameters

### DocKit Responsibilities
1. Token validation
2. Session management
3. Document processing workflows
4. AI-powered features
5. User dashboard and analytics

## Security Considerations

### Token Validation
```typescript
// Validate token with Rythmiq API
const validateToken = async (token: string) => {
  const response = await fetch('https://api.rythmiq.com/validate', {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.json();
};
```

### Session Management
- Store Rythmiq token securely
- Maintain local session state
- Handle token expiration
- Provide seamless re-authentication flow

## Development Setup

### Environment Variables
```env
NEXTAUTH_URL=https://dockit.rythmiq.com
RYTHMIQ_API_URL=https://api.rythmiq.com
RYTHMIQ_CLIENT_ID=dockit_client_id
```

### Testing Locally
```bash
# Simulate Rythmiq redirect
http://localhost:3000/?token=test_token&mode=user

# Test guest mode
http://localhost:3000/?token=guest_token&mode=guest
```

## Future Enhancements

1. **SSO Integration** - Single sign-on across all Rythmiq products
2. **Cross-Product Navigation** - Seamless movement between Rythmiq products
3. **Unified User Profile** - Shared user data across the ecosystem
4. **Analytics Integration** - Combined usage analytics for the Rythmiq platform