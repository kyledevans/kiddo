import { useEffect, FunctionComponent, useCallback, useState, useRef } from "react";
import { IIconProps, IContextualMenuProps, IconButton, CommandBarButton, mergeStyleSets, TextField, Icon, Text } from "@fluentui/react";
import { useForm, useFormContext, FormProvider, Controller, SubmitHandler, SubmitErrorHandler, UseFormReset, useFieldArray } from "react-hook-form";

import { LookupTypeType, LookupType, Lookup } from "../api/lookup-type";
import { Api } from "../api/api";
import { useTitle } from "../common/title";
import { AppName } from "../common/constants";
import { AppTheme } from "../common/themes";
import { useSnackbar } from "../common/snackbar";
import { useDndSortOrder } from "../common/dnd-sort-order";
import { ErrorCallout, ErrorCalloutControl } from "../common/error-callout";
import { DirtyProvider, useDirtyReactHookForm } from "../common/dirty";
import { useFormStateRefs, useReactHookFormSubmitHandlers } from "../common/hooks";
import { PolicyType, withRequiredPolicy } from "../common/current-authorization";
import { Toolbar, ToolbarColumn3 } from "../common/toolbar";
import { withRequiredEmailConfirmation } from "../common/current-profile";

/** Index to temp Id and permanent Id mapping.  Key: Index. */
type IndexTempIdMap = Map<number, { permanentId: number, tempId: number }>;

/** Data structure for the values stored in the react-hook-form internal state. */
type PageFormType = { lookups: Lookup[] };

const pageStyles = mergeStyleSets({
  page: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gridAutoRows: "min-content"
  },
  btnAdd: {
    marginRight: 50
  },
  btnSave: {
    paddingRight: 16
  },
  editForm: {
    display: "grid",
    gridAutoRows: "min-content"
  },
  row: {
    display: "grid",
    gridTemplateColumns: "24px 200px 200px 1fr 50px",
    borderBottom: `1px solid ${AppTheme.palette.neutralLighter}`,
    gridColumnGap: 16,
    backgroundColor: "#fff",
    selectors: {
      "&.dnd-placeholder": {
        opacity: 0
      }
    }
  },
  header: [
    AppTheme.fonts.medium,
    { color: AppTheme.palette.neutralDark },
    { borderBottomColor: AppTheme.palette.neutralLight },
    { fontWeight: 600 },
    { lineHeight: 42 },
    { cursor: "default" }
  ],
  cell: {
    display: "grid",
    alignItems: "center"
  },
  hamburger: {
    selectors: {
      "&.ms-DetailsRow-cell": {
        padding: "0",
        display: "grid",
        alignItems: "center"
      }
    }
  },
  sortIcon: {
    cursor: "move",
    fontSize: 32,
    color: "#666"
  }
});

const icons = {
  save: { iconName: "Save" },
  hamburger: { iconName: "MoreVertical" },
  sort: { iconName: "GripperDotsVertical" },
  add: { iconName: "Add" },
  delete: { iconName: "Delete" }
};

const menuIconProps: IIconProps = { hidden: true };

async function initialize(lookupTypeId: number, setType: (newType: LookupType) => void, reset: UseFormReset<PageFormType>) {
  const type = await Api.lookupType.getLookupType(lookupTypeId);

  setType(type);
  reset({ lookups: type.lookups });
}

function useRowContextMenu(index: number, removeLookup: (index: number) => void) {
  const onDeleteMenuItemClick = useCallback(() => { removeLookup(index); }, [removeLookup, index]);

  const [menuProps, setMenuProps] = useState<IContextualMenuProps>({
    items: [
      {
        key: "delete",
        text: "Delete",
        iconProps: icons.delete,
        onClick: onDeleteMenuItemClick
      }
    ],
    directionalHintFixed: true
  });

  useEffect(() => {
    setMenuProps({
      items: [
        {
          key: "delete",
          text: "Delete",
          iconProps: icons.delete,
          onClick: onDeleteMenuItemClick
        }
      ],
      directionalHintFixed: true
    });
  }, [setMenuProps, onDeleteMenuItemClick]);

  return menuProps;
}

const ValuesList: FunctionComponent<{ lookupTypeId: number }> = ({ lookupTypeId }) => {
  const { getValues } = useFormContext<PageFormType>();
  const { move, remove } = useFieldArray<PageFormType>({ name: "lookups" });

  const values = getValues();

  return (
    <div>
      <div className={`${pageStyles.row} ${pageStyles.header}`}>
        <div></div>
        <div>Name</div>
        <div>Name (short)</div>
        <div>Description</div>
        <div>Order</div>
      </div>
      {values.lookups.map((l, i) => (<ValueItem key={l.lookupId} lookupTypeId={lookupTypeId} lookup={l} index={i} removeLookup={remove} moveLookup={move} />))}
    </div>
  );
}

const ValueItem: FunctionComponent<{ lookupTypeId: number, lookup: Lookup, index: number, removeLookup: (index: number) => void, moveLookup: (dragIndex: number, hoverIndex: number) => void }> = ({ lookupTypeId, lookup, index, removeLookup, moveLookup }) => {
  const menuProps = useRowContextMenu(index, removeLookup);
  const dnd = useDndSortOrder(`lookup_type_${lookupTypeId}`, lookup.lookupId, index, moveLookup);

  return (
    <div className={`${pageStyles.row} ${dnd.isDragging ? "dnd-placeholder" : ""}`} ref={dnd.previewRef} data-handler-id={dnd.handlerId}>
      <div className={pageStyles.cell}><IconButton iconProps={icons.hamburger} menuProps={menuProps} menuIconProps={menuIconProps} tabIndex={-1} /></div>
      <div className={pageStyles.cell}><Controller name={`lookups.${index}.name`} rules={{ required: true }} render={({ field, fieldState }) => <TextField underlined {...field} value={field.value == null ? "" : field.value} maxLength={4000} errorMessage={fieldState?.error?.type === "required" ? "Required." : ""} />} /></div>
      <div className={pageStyles.cell}><Controller name={`lookups.${index}.nameShort`} rules={{ required: true }} render={({ field, fieldState }) => <TextField underlined {...field} value={field.value == null ? "" : field.value} maxLength={4000} errorMessage={fieldState?.error?.type === "required" ? "Required." : ""} />} /></div>
      <div className={pageStyles.cell}><Controller name={`lookups.${index}.description`} render={({ field }) => <TextField underlined {...field} value={field.value == null ? "" : field.value} maxLength={4000} />} /></div>
      <div className={pageStyles.cell}><div ref={dnd.dragRef}><Icon iconName="GripperDotsVertical" className={pageStyles.sortIcon} /></div></div>
    </div>
  );
}

const LookupsPageInner: FunctionComponent<{ lookupTypeId: LookupTypeType }> = ({ lookupTypeId }) => {
  const [type, setType] = useState<LookupType | null>(null);
  const [, setAppTitle] = useTitle();
  const [nextTempId, setNextTempId] = useState<number>(-1);
  const isDirty = useDirtyReactHookForm();
  const { handleSubmit, reset, getValues } = useFormContext<PageFormType>();
  const { append } = useFieldArray({ name: "lookups" });
  const { isSubmitting, isValidating } = useFormStateRefs();
  const saveErrorDlg = useRef<ErrorCalloutControl | null>(null);
  const snackbar = useSnackbar();

  useEffect(() => { initialize(lookupTypeId, setType, reset); }, [lookupTypeId, setType, reset]);

  useEffect(() => { setAppTitle(type == null ? AppName : type.name); }, [setAppTitle, type, type?.name]);

  const onAddClick = useCallback(() => {
    append({ lookupId: nextTempId, name: "", nameShort: "", description: null, isActive: true, sortOrder: 0 });
    setNextTempId(nextTempId - 1);
  }, [nextTempId, setNextTempId, append]);

  const onSubmitValid: SubmitHandler<PageFormType> = useCallback(async ({ lookups }) => {
    if (type == null) throw new Error("type cannot be null or undefined.");

    // Store a mapping between the current index for each lookup value and their lookupIds.  This allows us
    // to re-assign the tempIds that are generated on the client with the real lookupIds that are returned
    // from the server.
    const lookupIdMaps: IndexTempIdMap = new Map();
    lookups.forEach((l, i) => {
      if (l.lookupId <= 0) lookupIdMaps.set(i, { permanentId: 0, tempId: l.lookupId });
    });

    const saved = await Api.lookupType.updateLookupType({ ...type, lookups: lookups });

    // Determine how to map any newly created lookups from their tempId to their actual permanent lookupId.
    saved.lookups.forEach((l, i) => {
      const lookupIdMap = lookupIdMaps.get(i);
      if (lookupIdMap != null) {
        lookupIdMap.permanentId = l.lookupId;
      }
    });

    // Overwrite any tempIds that have been replaced by permanent LookupIds.
    const currentLookups = getValues("lookups");
    lookupIdMaps.forEach((lookupIdMap) => {
      const currentLookupIndex = currentLookups.findIndex(l => lookupIdMap.tempId === l.lookupId);
      if (currentLookupIndex != null && currentLookups[currentLookupIndex].lookupId !== lookupIdMap.permanentId) {
        currentLookups[currentLookupIndex].lookupId = lookupIdMap.permanentId;
      }
    });

    setType(saved);
    reset({ lookups: currentLookups });
    snackbar.open(`Saved.`);
  }, [type, getValues, reset, snackbar]);

  const onSubmitInvalid: SubmitErrorHandler<PageFormType> = useCallback((errors, _ev) => {
    if (type == null) throw new Error("type cannot be null or undefined.");

    saveErrorDlg.current?.open(5000);
  }, [type]);

  const onSubmit = useReactHookFormSubmitHandlers(onSubmitValid, onSubmitInvalid);

  return (
    <form className={pageStyles.page} onSubmit={onSubmit} noValidate autoComplete="off" autoCorrect="off" autoCapitalize="none" spellCheck="false">
      <Toolbar>
        <ToolbarColumn3>
          <CommandBarButton className={pageStyles.btnAdd} text="Add" onClick={onAddClick} iconProps={icons.add} tabIndex={-1} />
          <CommandBarButton className={pageStyles.btnSave} id="btnSave" text="Save" type="submit" disabled={!isDirty} iconProps={icons.save} tabIndex={-1} />
          <ErrorCallout target="#btnSave" control={saveErrorDlg}><Text variant="small">Error: Unable to save.</Text></ErrorCallout>
        </ToolbarColumn3>
      </Toolbar>
      <div>
        <div className="toolbar-left"></div>
        <div className="toolbar-middle"></div>
        <div className="toolbar-right"></div>
      </div>
      <div className={pageStyles.editForm}>
        {type != null && (<ValuesList lookupTypeId={type.lookupTypeId} />)}
      </div>
    </form>
  );
}

const LookupsPageDeps: FunctionComponent<{ lookupTypeId: LookupTypeType }> = ({ lookupTypeId }) => {
  const formMethods = useForm<PageFormType>({
    defaultValues: { lookups: [] }
  });

  return (
    <DirtyProvider>
      <FormProvider {...formMethods}>
        <LookupsPageInner lookupTypeId={lookupTypeId} />
      </FormProvider>
    </DirtyProvider>
  );
};

let LookupsPage = withRequiredPolicy(LookupsPageDeps, PolicyType.Administrator);
LookupsPage = withRequiredEmailConfirmation(LookupsPage);

export default LookupsPage;
