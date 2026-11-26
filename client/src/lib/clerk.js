// Clerk is used only for "Continue with Google". After Google sign-in, the
// Clerk session token is exchanged at POST /api/auth/clerk for our own
// httpOnly session cookie, so the rest of the app keeps one auth system.
// Publishable keys are public by design (they ship in every Clerk frontend).
export const CLERK_PUBLISHABLE_KEY =
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || 'pk_test_YWxlcnQtb3J5eC05NDE0LmNsZXJrLmFjY291bnRzLmRldiQ'
