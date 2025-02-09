import { createBrowserRouter } from "react-router-dom";
import Error404Page from "./error-404-page/error-404-page";
import App from "./App";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: App,
    children: [
      {
        path: "",
        lazy: async () => ({
          Component: (await import("./default-page/default-page")).default,
        }),
      },
      {
        path: "about",
        lazy: async () => ({
          Component: (await import("./about-page/about-page")).default,
        }),
      },
      {
        path: "/accounts/:accountId/entries",
        lazy: async () => ({
          Component: (await import("./accounts-entries-page/accounts-entries-page")).default,
        }),
      },
      {
        path: "/accounts",
        lazy: async () => ({
          Component: (await import("./accounts-page/accounts-page")).default,
        }),
      },
      {
        path: "/manage/accounts/edit/:accountId",
        lazy: async () => ({
          Component: (await import("./accounts-edit-page/accounts-edit-page")).default,
        }),
      },
      {
        path: "/manage/accounts",
        lazy: async () => ({
          Component: (await import("./accounts-list-page/accounts-list-page")).default,
        }),
      },
      {
        path: "/manage/currencies",
        lazy: async () => ({
          Component: (await import("./lookups-page/currencies-page")).default,
        }),
      },
      {
        path: "/admin/users/edit/:userId/logins",
        lazy: async () => ({
          Component: (await import("./admin/users-page/users-edit-logins-page")).default,
          navigation: (await import("./admin/users-page/users-edit-navigation")).default,
        }),
      },
      {
        path: "/admin/users/edit/:userId",
        lazy: async () => ({
          Component: (await import("./admin/users-page/users-edit-page")).default,
          navigation: (await import("./admin/users-page/users-edit-navigation")).default,
        }),
      },
      {
        path: "/admin/users",
        lazy: async () => ({
          Component: (await import("./admin/users-page/users-page")).default,
        }),
      },
      {
        path: "/profile/logins",
        lazy: async () => ({
          Component: (await import("./profile-page/logins-page")).default,
          navigation: (await import("./profile-page/navigator")).default,
        }),
      },
      {
        path: "/profile",
        lazy: async () => ({
          Component: (await import("./profile-page/profile-page")).default,
          navigation: (await import("./profile-page/navigator")).default,
        }),
      },
      {
        path: "/password-login",
        lazy: async () => ({
          Component: (await import("./password-page/login-page")).default,
        }),
      },
      {
        path: "/password-register",
        lazy: async () => ({
          Component: (await import("./password-page/register-page")).default,
        }),
      },
      {
        path: "/password-reset",
        lazy: async () => ({
          Component: (await import("./password-page/reset-page")).default,
        }),
      },
      {
        path: "/azure-ad/login",
        lazy: async () => ({
          Component: (await import("./azure-ad-page/azure-ad-login-page")).default,
        }),
      },
      {
        path: "/azure-ad/logout",
        lazy: async () => ({
          Component: (await import("./azure-ad-page/azure-ad-logout-page")).default,
        }),
      },
      {
        path: "/authentication",
        lazy: async () => ({
          Component: (await import("./authentication-page/authentication-page")).default,
        }),
      },
      {
        path: "/email-confirmation",
        lazy: async () => ({
          Component: (await import("./email-confirmation-page/email-confirmation-page")).default,
        }),
      },
    ],
    ErrorBoundary: Error404Page,
  },
]);
