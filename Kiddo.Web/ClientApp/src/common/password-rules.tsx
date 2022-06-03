import { FunctionComponent } from "react";
import { mergeStyleSets, Label } from "@fluentui/react";

import { PasswordValidationRules } from "../api/identity";
import { AppTheme } from "./themes";

const styles = mergeStyleSets({
  rules: {
    border: `1px solid ${AppTheme.palette.neutralLight}`,
    padding: 16,
    marginTop: 48
  }
});

export const PasswordRules: FunctionComponent<{ rules: PasswordValidationRules | null }> = ({ rules }) => {
  if (rules == null) return null;

  return (
    <div className={styles.rules}>
      {rules.requiredLength > 0 && (<Label>At least {rules.requiredLength} character{rules.requiredLength === 1 ? "" : "s"}</Label>)}
      {rules.requiredUniqueChars > 1 && (<Label>At least {rules.requiredUniqueChars} unique characters</Label>)}
      {rules.requireUppercase && (<Label>Uppercase letter</Label>)}
      {rules.requireLowercase && (<Label>Lowercase letter</Label>)}
      {rules.requireDigit && (<Label>Number</Label>)}
      {rules.requireNonAlphanumeric && (<Label>Special character</Label>)}
    </div>
  );
}
