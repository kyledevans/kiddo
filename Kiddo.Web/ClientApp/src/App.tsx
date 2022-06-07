import { Suspense, useEffect, lazy, FunctionComponent, MouseEvent, useCallback, MutableRefObject, useRef } from "react";
import { Route, Switch, useHistory, useLocation, BrowserRouter as Router, RouteProps } from "react-router-dom";
import { Callout, ActionButton, IconButton, ThemeProvider, Panel, Text, PanelType, IPanelStyles, IPanelStyleProps, IStyleFunctionOrObject, mergeStyleSets, IIconProps, Customizer, ISettings, LayerHost, Target } from "@fluentui/react";
import { useBoolean } from "@fluentui/react-hooks";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

import { AppTheme, TopToolbarTheme } from "./common/themes";
import { AppSpaConfigurationProvider } from "./common/spa-configuration";
import { AppTitleContextProvider, useTitle } from "./common/title";
import { LookupTypeType } from "./api/lookup-type";
import { Snackbar, AppSnackbarContextProvider } from "./common/snackbar";
import { AppCurrentProfileContextProvider, useCurrentProfile } from "./common/current-profile";
import { AppCurrentAuthorizationContextProvider, useCurrentPolicies } from "./common/current-authorization";
import { AppBrowserSettingsContextProvider } from "./common/browser-settings";
import { AppAuthenticationManagerContextProvider, useAuthenticationManager } from "./common/authentication-react";

const DefaultPage = lazy(() => import("./default-page/default-page"));
const AboutPage = lazy(() => import("./about-page/about-page"));
const AccountsPage = lazy(() => import("./accounts-page/accounts-page"));
const AccountsEntriesPage = lazy(() => import("./accounts-entries-page/accounts-entries-page"));
const AccountsListPage = lazy(() => import("./accounts-list-page/accounts-list-page"));
const AccountsEditPage = lazy(() => import("./accounts-edit-page/accounts-edit-page"));
const LookupsPage = lazy(() => import("./lookups-page/lookups-page"));
const AdminUsersPage = lazy(() => import("./admin/users-page/users-page"));
const AdminUsersEditPage = lazy(() => import("./admin/users-page/users-edit-page"));
const ProfilePage = lazy(() => import("./profile-page/profile-page"));
const LoginsPage = lazy(() => import("./profile-page/logins-page"));
const ProfileNavigation = lazy(() => import("./profile-page/navigator"));
const PasswordLoginPage = lazy(() => import("./password-page/login-page"));
const PasswordRegisterPage = lazy(() => import("./password-page/register-page"));
const PasswordResetPage = lazy(() => import("./password-page/reset-page"));
const AuthenticationPage = lazy(() => import("./authentication-page/authentication-page"));
const AzureAdLoginPage = lazy(() => import("./azure-ad-page/azure-ad-login-page"));
const AzureAdLogoutPage = lazy(() => import("./azure-ad-page/azure-ad-logout-page"));
const EmailConfirmationPage = lazy(() => import("./email-confirmation-page/email-confirmation-page"));
const Error404Page = lazy(() => import("./error-404-page/error-404-page"));

interface AppRouteProps extends RouteProps {
  navigation?: JSX.Element
}

const routes: AppRouteProps[] = [
  { path: "/", exact: true, children: (<Suspense fallback={(<></>)}><DefaultPage /></Suspense>) },
  { path: "/about", children: (<Suspense fallback={(<></>)}><AboutPage /></Suspense>) },
  { path: "/accounts/:accountId/entries", children: (<Suspense fallback={(<></>)}><AccountsEntriesPage /></Suspense>) },
  { path: "/accounts", children: (<Suspense fallback={(<></>)}><AccountsPage /></Suspense>) },
  { path: "/manage/accounts/edit/:accountId", children: (<Suspense fallback={(<></>)}><AccountsEditPage /></Suspense>) },
  { path: "/manage/accounts", children: (<Suspense fallback={(<></>)}><AccountsListPage /></Suspense>) },
  { path: "/manage/currencies", children: (<Suspense fallback={(<></>)}><LookupsPage lookupTypeId={LookupTypeType.Currency} /></Suspense>) },
  { path: "/admin/users/edit/:userId", children: (<Suspense fallback={(<></>)}><AdminUsersEditPage /></Suspense>) },
  { path: "/admin/users", children: (<Suspense fallback={(<></>)}><AdminUsersPage /></Suspense>) },
  { path: "/profile/logins", children: (<Suspense fallback={(<></>)}><LoginsPage /></Suspense>), navigation: <Suspense fallback={(<></>)}><ProfileNavigation /></Suspense> },
  { path: "/profile", children: (<Suspense fallback={(<></>)}><ProfilePage /></Suspense>), navigation: <Suspense fallback={(<></>)}><ProfileNavigation /></Suspense> },
  { path: "/password-login", children: (<Suspense fallback={(<></>)}><PasswordLoginPage /></Suspense>) },
  { path: "/password-register", children: (<Suspense fallback={(<></>)}><PasswordRegisterPage /></Suspense>) },
  { path: "/password-reset", children: (<Suspense fallback={(<></>)}><PasswordResetPage /></Suspense>) },
  { path: "/azure-ad/login", children: (<Suspense fallback={(<></>)}><AzureAdLoginPage /></Suspense>) },
  { path: "/azure-ad/logout", children: (<Suspense fallback={(<></>)}><AzureAdLogoutPage /></Suspense>) },
  { path: "/authentication", children: (<Suspense fallback={(<></>)}><AuthenticationPage /></Suspense>) },
  { path: "/email-confirmation", children: (<Suspense fallback={(<></>)}><EmailConfirmationPage /></Suspense>) },
  { path: "*", children: (<Suspense fallback={(<></>)}><Error404Page /></Suspense>) } // This needs to always be last.
];

const appStyles = mergeStyleSets({
  app: {
    display: "grid",
    gridTemplateColumns: "min-content 1fr",
    gridTemplateRows: "min-content min-content 1fr",
    overflow: "hidden"
  },
  topToolbar: {
    display: "grid",
    gridTemplateColumns: "min-content 1fr min-content",
    gridColumn: "1 / span 2"
  },
  toolbarTitle: {
    padding: "0 16px 0 50px",
    display: "flex",
    alignItems: "center",
    userSelect: "none"
  },
  navigationRouterOutput: {
    borderRight: `1px solid ${TopToolbarTheme.palette.neutralLight}`
  },
  navigationLinksContainer: {
    width: 175,
    display: "grid",
    gridTemplateColumns: "1fr",
    gridAutoRows: "32px"
  },
  primaryRouterOutput: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gridTemplateRows: "1fr",
    overflow: "hidden"
  },
  settingsButton: {
    whiteSpace: "nowrap"
  },
  profileButton: {
    height: 32
  },
  profileCallout: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gridAutoRows: "min-content",
    minWidth: 200
  },
  divider: {
    height: 1,
    backgroundColor: AppTheme.palette.neutralLighter
  }
});

const navPanelStyles: IStyleFunctionOrObject<IPanelStyleProps, IPanelStyles> = {
  contentInner: {
    display: "grid"
  },
  scrollableContent: {
    display: "grid",
    gridAutoRows: "min-content"
  },
  content: {
    display: "grid",
    gridAutoRows: "min-content",
    gridTemplateColumns: "1fr",
    padding: 0
  }
};

const icons: { hamburger: IIconProps, accountSettings: IIconProps, home: IIconProps, profile: IIconProps, logout: IIconProps } = {
  hamburger: { iconName: "CollapseMenu" },
  accountSettings: { iconName: "Contact" },
  home: { iconName: "HomeSolid" },
  profile: { iconName: "ContactInfo" },
  logout: { iconName: "Leave" }
};

const scopedSettings: ISettings = {
  Layer: { hostId: "layer-host" }
};

const NavLink: FunctionComponent<{ to: string, iconProps?: IIconProps | undefined }> = ({ to, iconProps, children }) => {
  const history = useHistory();

  // Handle normal link clicks by using the react router to navigate, otherwise clicking on an <a> tag will cause a full page load.
  // This enables SPA navigation while retaining the ability for the user to right click an <a> element and "Open Link in New Tab".
  const navLinkClick = useCallback((e: MouseEvent<HTMLAnchorElement>) => {
    let href = e.currentTarget.getAttribute("href");  // This needs to get the actual "href" attribute on the anchor tag, not the property.  Because the property will automatically convert to the full absolute url (including the http://website.com/).

    if (typeof href === "string") {
      e.preventDefault();
      history.push(href);
    }
  }, [history]);

  return (
    <ActionButton href={to} onClick={navLinkClick} iconProps={iconProps}>{children}</ActionButton>
  );
}

const NavPanel: FunctionComponent<{ isOpen: boolean, dismissPanel: () => void }> = ({ isOpen, dismissPanel }) => {
  const location = useLocation();
  const [policies] = useCurrentPolicies();

  useEffect(() => {
    dismissPanel();
  }, [location, dismissPanel]);

  if (policies == null) return (<></>);

  return (
    <Panel isLightDismiss isOpen={isOpen} onDismiss={dismissPanel} type={PanelType.smallFixedNear} styles={navPanelStyles}>
      <NavLink to="/">Home</NavLink>
      {(policies.isReadOnlyUser) && (<NavLink to="/accounts">Accounts</NavLink>)}
      {(policies.isAdministrator) && (<NavLink to="/manage/accounts">Manage</NavLink>)}
      {(policies.isSuperAdministrator) && (<NavLink to="/manage/currencies">Currencies</NavLink>)}
      {(policies.isSuperAdministrator) && (<NavLink to="/admin/users">Users</NavLink>)}
      <NavLink to="/about">About</NavLink>
    </Panel>
  );
}

interface ProfileCalloutControl {
  dismiss: () => void;
  open: () => void;
}

const ProfileCallout: FunctionComponent<{ target: Target, control: MutableRefObject<ProfileCalloutControl | null> }> = ({ target, control }) => {
  const [isVisible, { setTrue: setIsVisible, setFalse: setIsHidden }] = useBoolean(false);
  //const onLogoutClick = useLogoutCallback();
  const authManager = useAuthenticationManager();

  const onLogoutClick = useCallback(async () => {
    if (authManager != null) {
      await authManager.logout();
      window.location.reload();
    }
  }, [authManager]);

  useEffect(() => {
    control.current = {
      dismiss: setIsHidden,
      open: setIsVisible
    };
  }, [control, setIsHidden, setIsVisible]);

  return (
    <>
      {isVisible && (
        <Callout theme={AppTheme} dismissOnTargetClick={true} target={target} onDismiss={setIsHidden} onClick={setIsHidden} isBeakVisible={false}>
          <div className={appStyles.profileCallout}>
            <NavLink to="/profile" iconProps={icons.profile}>Profile</NavLink>
            <div className={appStyles.divider} />
            <ActionButton onClick={onLogoutClick} iconProps={icons.logout}>Logout</ActionButton>
          </div>
        </Callout>
      )}
    </>
  );
}

function AppInner() {
  const [isOpen, { setTrue: openPanel, setFalse: dismissPanel }] = useBoolean(false);
  const [me] = useCurrentProfile();
  const profileCalloutRef = useRef<ProfileCalloutControl | null>(null);
  const [title] = useTitle();

  const profileConfigClick = useCallback(() => { profileCalloutRef.current?.open(); }, [profileCalloutRef]);

  return (
    <div className={appStyles.app}>
      {(me != null && me !== "Anonymous" && me !== "Unregistered") ? (<>
        <ThemeProvider theme={TopToolbarTheme} className={appStyles.topToolbar}>
          <div><IconButton iconProps={icons.hamburger} onClick={openPanel} tabIndex={-1} /></div>
          <div className={appStyles.toolbarTitle}><Text block variant="large" styles={{ root: { color: AppTheme.palette.neutralDark } }}>{title}</Text></div>
          <div><ActionButton id="btnProfileConfig" className={appStyles.profileButton} tabIndex={-1} menuIconProps={icons.accountSettings} onClick={profileConfigClick}><span className={appStyles.settingsButton}>{me.displayName}</span></ActionButton></div><ProfileCallout control={profileCalloutRef} target="#btnProfileConfig" />
        </ThemeProvider>
      </>) : null}
      <Snackbar />
      {(me != null && me !== "Anonymous" && me !== "Unregistered") ? (<>
        <NavPanel isOpen={isOpen} dismissPanel={dismissPanel} />
      </>) : null}
      <ThemeProvider theme={AppTheme} className={appStyles.navigationRouterOutput}>
        <Switch>
          {routes.map((route, index) => (
            <Route key={index} path={route.path} exact={route.exact}>
              {route.navigation == null ? (<></>) : (<div className={appStyles.navigationLinksContainer}>{route.navigation}</div>)}
            </Route>
          ))}
        </Switch>
      </ThemeProvider>
      <ThemeProvider theme={AppTheme} className={appStyles.primaryRouterOutput}>
        <Switch>
          {routes.map((route, index) => (
            <Route key={index} path={route.path} exact={route.exact} children={route.children} />
          ))}
        </Switch>
      </ThemeProvider>
    </div>
  );
}

export default function App() {
  return (
    <>
      <Router>
        <AppBrowserSettingsContextProvider>
          <AppSpaConfigurationProvider>
            <AppTitleContextProvider>
              <Customizer scopedSettings={scopedSettings}>
                <AppSnackbarContextProvider>
                  <DndProvider backend={HTML5Backend}>
                    <AppAuthenticationManagerContextProvider>
                      <AppCurrentProfileContextProvider>
                        <AppCurrentAuthorizationContextProvider>
                          <AppInner />
                        </AppCurrentAuthorizationContextProvider>
                      </AppCurrentProfileContextProvider>
                    </AppAuthenticationManagerContextProvider>
                  </DndProvider>
                  <LayerHost id={scopedSettings.Layer.hostId} />
                </AppSnackbarContextProvider>
              </Customizer>
            </AppTitleContextProvider>
          </AppSpaConfigurationProvider>
        </AppBrowserSettingsContextProvider>
      </Router>
    </>
  );
}
