import { LookupTypeType } from "../api/lookup-type";
import LookupsPage from "./base-lookups";

export default function CurrenciesPage() {
  return <LookupsPage lookupTypeId={LookupTypeType.Currency} />;
}
