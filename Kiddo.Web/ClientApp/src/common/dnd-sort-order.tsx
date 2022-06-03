import { useEffect, useRef, MutableRefObject } from "react";
import { useDrag, useDrop, DropTargetMonitor } from "react-dnd";
import { XYCoord, Identifier } from "dnd-core";

export interface DndSortOrder {
  dragRef: MutableRefObject<HTMLDivElement | null>;
  previewRef: MutableRefObject<HTMLDivElement | null>;
  handlerId: Identifier | null;
  isDragging: boolean;
}

interface DragItem {
  /** The Id for the record being sorted.  So if this is used on a Lookup then it will be the LookupId. */
  entityId: number;
  index: number;
}

export function useDndSortOrder(dndType: string, entityId: number, index: number, moveItem: (dragIndex: number, hoverIndex: number) => void): DndSortOrder {
  const dragRef = useRef<HTMLDivElement | null>(null);
  const previewRef = useRef<HTMLDivElement | null>(null);
  const hoverItemRef = useRef<DragItem>({ entityId, index });

  useEffect(() => {
    hoverItemRef.current = { entityId, index };
  }, [hoverItemRef, entityId, index]);

  const [{ isDragging }, drag, preview] = useDrag<DragItem, any, { isDragging: boolean }>({
    type: dndType,
    item: () => {
      return hoverItemRef.current;
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }, [dndType, hoverItemRef]);

  const [{ handlerId }, drop] = useDrop<DragItem, any, { handlerId: Identifier | null }>({
    accept: dndType,
    collect(monitor) {
      return {
        handlerId: monitor.getHandlerId(),
      };
    },
    hover(item, monitor: DropTargetMonitor) {
      if (!previewRef.current) return;

      const dragId = item.entityId;
      const hoverId = hoverItemRef.current.entityId;
      const hoverIndex = hoverItemRef.current.index;

      // Don't replace items with themselves
      if (dragId === hoverId) return;

      // Find where the item is being dragged
      const hoverBoundingRect = previewRef.current?.getBoundingClientRect();        // Determine rectangle on screen
      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;  // Get vertical middle
      const clientOffset = monitor.getClientOffset();                               // Determine mouse position
      const hoverClientY = (clientOffset as XYCoord).y - hoverBoundingRect.top;     // Get pixels to the top

      // Only perform the move when the mouse has crossed half of the items height
      // When dragging downwards, only move when the cursor is below 50%
      // When dragging upwards, only move when the cursor is above 50%
      if (dragId < hoverId && hoverClientY < hoverMiddleY) return;  // Dragging downwards
      if (dragId > hoverId && hoverClientY > hoverMiddleY) return;  // Dragging upwards

      // Time to actually perform the action
      moveItem(item.index, hoverIndex);

      // Note: we're mutating the monitor item here!
      // Generally it's better to avoid mutations,
      // but it's good here for the sake of performance
      // to avoid expensive index searches.
      item.index = hoverIndex;  // Update the index of the dropped item.
    },
  }, [dndType, previewRef, hoverItemRef]);

  drag(dragRef);
  drop(preview(previewRef));

  return {
    dragRef,
    previewRef,
    handlerId,
    isDragging
  };
}
