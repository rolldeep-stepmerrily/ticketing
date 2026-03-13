export const AuthRouter = {
  Root: 'auth',
  HttpApiTags: 'Auth',
  Http: {
    Register: 'register',
    Login: 'login',
    Logout: 'logout',
    Refresh: 'refresh',
  },
} as const;
