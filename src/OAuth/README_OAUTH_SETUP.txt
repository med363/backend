Google OAuth2 is now scaffolded in backend/src/OAuth with Passport.js integration.

You must set the following environment variables in your .env file:

GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/redirect

- The OAuth module is ready for integration with User, Artisana, and Etablissement entities.
- Implement the logic in OAuthService.validateOAuthLogin to link Google profiles to your entities.
- Use the GoogleAuthGuard from utils/Guard.ts to protect routes if needed.
- The controller exposes /auth/google and /auth/google/redirect endpoints for login and callback.

Dependencies installed:
- @nestjs/passport
- passport
- passport-google-oauth20

See the code in backend/src/OAuth for details.