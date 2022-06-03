import { useState, useCallback, FunctionComponent, useMemo, FormEvent, createContext, ComponentType, Dispatch, SetStateAction, useContext, Context } from "react";

export type IdentityType = number | string;
export type CheckedEntitiesContext<T extends IdentityType> = [checkedIds: T[], setAllCheckedIds: Dispatch<SetStateAction<T[]>>];
export type AllCheckableEntitiesContext<T extends IdentityType> = [allEntityIds: T[], setAllEntityIds: Dispatch<SetStateAction<T[]>>];

const CheckedListToken = createContext<CheckedEntitiesContext<IdentityType>>([
  [],
  () => { throw new Error("Checkable lists requires encapulation in withCheckableList() HOC."); }
]);

const AllCheckableListToken = createContext<AllCheckableEntitiesContext<IdentityType>>([
  [],
  () => { throw new Error("Checkable lists requires encapulation in withCheckableList() HOC."); }
]);

const CheckableListProvider: FunctionComponent = (props) => {
  const newCheckedContext = useState<IdentityType[]>([]);
  const newAllEntitiesContext = useState<IdentityType[]>([]);

  return (
    <>
      <AllCheckableListToken.Provider value={newCheckedContext}>
        <CheckedListToken.Provider value={newAllEntitiesContext}>
          {props.children}
        </CheckedListToken.Provider>
      </AllCheckableListToken.Provider>
    </>
  );
}

export function withCheckableList<T>(ListComponent: ComponentType<T>) {
  return (props: T) => (
    <>
      <CheckableListProvider>
        <ListComponent {...props} />
      </CheckableListProvider>
    </>
  );
}

export function useCheckableManager<T extends IdentityType>(): { checkedIds: T[] } {
  const [checkedIds] = useContext((CheckedListToken as unknown) as Context<CheckedEntitiesContext<T>>);

  return { checkedIds };
}

export function useCheckAllControl<T extends IdentityType>(): [isAllChecked: boolean, isAllIndeterminate: boolean, callbacks: { onCheckAllChange: (ev: FormEvent<HTMLElement | HTMLInputElement> | undefined, checked?: boolean | undefined) => void, setEntityIds: (newEntityIds: T[]) => void }] {
  const [checkedIds, setCheckedIds] = useContext(CheckedListToken);
  const [entityIds, setEntityIdsInternal] = useContext(AllCheckableListToken);

  const isAllChecked = useMemo(() => {
    return checkedIds.length > 0 && checkedIds.length === entityIds.length;
  }, [entityIds, checkedIds]);

  const isAllIndeterminate = useMemo(() => {
    return checkedIds.length > 0 && checkedIds.length < entityIds.length;
  }, [entityIds, checkedIds]);

  const onCheckAllChange = useCallback((_ev: FormEvent<HTMLElement | HTMLInputElement> | undefined, checked?: boolean | undefined) => {
    const newChecked: IdentityType[] = checked === true ? [...entityIds] : [];

    setCheckedIds(newChecked);
  }, [setCheckedIds, entityIds]);

  const setEntityIds = useCallback((newEntityIds: IdentityType[]) => {
    setEntityIdsInternal(newEntityIds);

    // Retain any checked entries that exist in the new entityIds list.
    setCheckedIds((prevChecked) => {
      const newChecked: IdentityType[] = [];

      newEntityIds.forEach(entityId => {
        if (prevChecked.indexOf(entityId) >= 0) {
          newChecked.push(entityId);
        }
      });

      return newChecked;
    });
  }, [setEntityIdsInternal, setCheckedIds]);

  return [isAllChecked, isAllIndeterminate, { onCheckAllChange, setEntityIds }];
}

export function useCheckEntityControl<T extends IdentityType>(entityId: T): [isChecked: boolean, callbacks: { onEntityCheckChange: (ev: FormEvent<HTMLElement | HTMLInputElement> | undefined, checked?: boolean | undefined) => void }] {
  const [checkedIds, setCheckedIds] = useContext(CheckedListToken);

  const onChange = useCallback((_ev: FormEvent<HTMLElement | HTMLInputElement> | undefined, checked?: boolean | undefined) => {
    setCheckedIds((prev) => {
      const newList: IdentityType[] = [...prev];
      const newChecked = checked ?? false;
      let isChanged = false;

      if (newChecked) {
        if (newList.indexOf(entityId) < 0) {
          newList.push(entityId);
          isChanged = true;
        }
      } else {
        let existingIndex = newList.indexOf(entityId);
        if (existingIndex >= 0) {
          newList.splice(existingIndex, 1);
          isChanged = true;
        }
      }

      return isChanged ? newList : prev;
    });
  }, [entityId, setCheckedIds]);

  const isChecked = useMemo(() => {
    return checkedIds.indexOf(entityId) >= 0;
  }, [entityId, checkedIds]);

  return [isChecked, { onEntityCheckChange: onChange }];
}
