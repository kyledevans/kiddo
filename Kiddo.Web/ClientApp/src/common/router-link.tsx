import { FunctionComponent, useCallback, MouseEvent } from "react";
import { useHistory } from "react-router-dom";
import { History, LocationState } from "history";
import { Link as FluentLink, DefaultButton, IIconProps, PrimaryButton, CompoundButton, CommandBarButton } from "@fluentui/react";

type OnNavLinkClickHandler = (e: MouseEvent<HTMLAnchorElement | HTMLButtonElement | HTMLElement>) => void;

function navigateLink(e: MouseEvent<HTMLAnchorElement | HTMLButtonElement | HTMLElement>, history: History<LocationState>) {
  // Handle normal link clicks by using the react router to navigate, otherwise clicking on an <a> tag will cause a full page load.
  // This enables SPA navigation while retaining the ability for the user to right click an <a> element and "Open Link in New Tab".

  let href = e.currentTarget.getAttribute("href");  // This needs to get the actual "href" attribute on the anchor tag, not the property.  Because the property will automatically convert to the full absolute url (including the http://website.com/).

  if (typeof href === "string") {
    e.preventDefault();
    history.push(href);
  }
}

export const RouterLink: FunctionComponent<{ to: string }> = (props) => {
  const history: History<unknown> = useHistory();
  const onLinkClick: OnNavLinkClickHandler = useCallback((e) => navigateLink(e, history), [history]);

  return (
    <FluentLink href={props.to} onClick={onLinkClick}>{props.children}</FluentLink>
  );
}

export const RouterDefaultLinkButton: FunctionComponent<{ to: string, iconProps?: IIconProps | undefined, className?: string | undefined, tabIndex?: number | undefined, disabled?: boolean | undefined }> = (props) => {
  const history = useHistory();
  const onLinkClick: OnNavLinkClickHandler = useCallback((e) => navigateLink(e, history), [history]);

  return (
    <DefaultButton className={props.className} href={props.to} onClick={onLinkClick} iconProps={props.iconProps} tabIndex={props.tabIndex} disabled={props.disabled}>{props.children}</DefaultButton>
  );
}

export const RouterPrimaryLinkButton: FunctionComponent<{ to: string, iconProps?: IIconProps | undefined, className?: string | undefined }> = (props) => {
  const history = useHistory();
  const onLinkClick: OnNavLinkClickHandler = useCallback((e) => navigateLink(e, history), [history]);

  return (
    <PrimaryButton className={props.className} href={props.to} onClick={onLinkClick} iconProps={props.iconProps}>{props.children}</PrimaryButton>
  );
}

export const RouterCompoundButton: FunctionComponent<{ to: string, primary?: boolean, secondaryText?: string, className?: string }> = ({ to, primary, children, secondaryText, className }) => {
  const history = useHistory();
  const onLinkClick: OnNavLinkClickHandler = useCallback((e) => navigateLink(e, history), [history]);

  return (<CompoundButton className={className} primary={primary} href={to} onClick={onLinkClick} secondaryText={secondaryText}>{children}</CompoundButton>);
}

export const RouterCommandBarButton: FunctionComponent<{ to: string, tabIndex?: number, iconProps?: IIconProps | undefined, secondaryText?: string, className?: string }> = ({ to, tabIndex, iconProps, children, secondaryText, className }) => {
  const history = useHistory();
  const onLinkClick: OnNavLinkClickHandler = useCallback((e) => navigateLink(e, history), [history]);

  return (<CommandBarButton className={className} tabIndex={tabIndex} iconProps={iconProps} href={to} onClick={onLinkClick}>{children}</CommandBarButton>);
}
