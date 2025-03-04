import React, { useState } from 'react';
import {
  DualListSelector,
  DualListSelectorPane,
  DualListSelectorList,
  DualListSelectorControlsWrapper,
  DualListSelectorControl,
  DualListSelectorTree,
  SearchInput,
  EmptyState,
  EmptyStateVariant,
  EmptyStateBody,
  DualListSelectorTreeItemData,
} from '@patternfly/react-core';
import AngleDoubleLeftIcon from '@patternfly/react-icons/dist/esm/icons/angle-double-left-icon';
import AngleLeftIcon from '@patternfly/react-icons/dist/esm/icons/angle-left-icon';
import AngleDoubleRightIcon from '@patternfly/react-icons/dist/esm/icons/angle-double-right-icon';
import AngleRightIcon from '@patternfly/react-icons/dist/esm/icons/angle-right-icon';
import { DndContext, DragEndEvent, useSensor, PointerSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { CSS } from '@dnd-kit/utilities';

interface HospitalNode {
  id: string;
  text: string;
  children?: HospitalNode[];
}

interface ListsProps {
  data: HospitalNode[];
}

// Add a new component for draggable hospital items
const DraggableHospital: React.FC<{
  id: string;
  text: string;
  index: number;
  onOrderChange: (id: string, newPosition: number) => void;
  totalItems: number;
}> = ({ id, text, index }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="flex items-center gap-2 p-2 bg-white border rounded-md mb-2 cursor-move hover:bg-gray-50"
    >
      <span className="w-8 h-8 flex items-center justify-center bg-blue-100 rounded-full text-blue-700 font-semibold">
        {index + 1}
      </span>
      <span>{text}</span>
    </div>
  );
};

export const HospitalLists: React.FC<ListsProps> = ({ data }) => {
  const [checkedLeafIds, setCheckedLeafIds] = useState<string[]>([]);
  const [selectedHospitals, setSelectedHospitals] = useState<string[]>([]);
  const [chosenFilter, setChosenFilter] = useState<string>('');
  const [availableFilter, setAvailableFilter] = useState<string>('');

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  const buildTextById = (node: HospitalNode): { [key: string]: string } => {
    let textById: { [key: string]: string } = {};
    if (!node) return textById;
    textById[node.id] = node.text;
    if (node.children) {
      node.children.forEach((child) => {
        textById = { ...textById, ...buildTextById(child) };
      });
    }
    return textById;
  };

  const getLeafIds = (node: HospitalNode): string[] => {
    if (!node.children) return [node.id];
    return node.children.flatMap(getLeafIds);
  };

  const { allLeafIds } = React.useMemo(() => {
    let texts = {};
    let leafIds: string[] = [];
    data.forEach((node) => {
      texts = { ...texts, ...buildTextById(node) };
      leafIds = [...leafIds, ...getLeafIds(node)];
    });
    return { nodeTexts: texts, allLeafIds: leafIds };
  }, [data]);

  const handleCheck = (
    _event: React.MouseEvent | React.ChangeEvent<HTMLInputElement> | React.KeyboardEvent,
    isChecked: boolean,
    node: HospitalNode
  ) => {
    if (!node.children) {
      if (isChecked) {
        setCheckedLeafIds((prev) => [...prev, node.id]);
      } else {
        setCheckedLeafIds((prev) => prev.filter((id) => id !== node.id));
      }
    }
  };

  const handleMove = (toChosen: boolean) => {
    if (toChosen) {
      setSelectedHospitals((prev) => {
        const newItems = checkedLeafIds.filter((id) => !prev.includes(id));
        return [...prev, ...newItems];
      });
    } else {
      setSelectedHospitals((prev) => prev.filter((id) => !checkedLeafIds.includes(id)));
    }
    setCheckedLeafIds([]);
  };

  const handleMoveAll = (toChosen: boolean) => {
    if (toChosen) {
      setSelectedHospitals((prev) => {
        const newItems = allLeafIds.filter((id) => !prev.includes(id));
        return [...prev, ...newItems];
      });
    } else {
      setSelectedHospitals([]);
    }
    setCheckedLeafIds([]);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = selectedHospitals.indexOf(active.id as string);
      const newIndex = selectedHospitals.indexOf(over.id as string);

      const newOrder = [...selectedHospitals];
      newOrder.splice(oldIndex, 1);
      newOrder.splice(newIndex, 0, active.id as string);

      setSelectedHospitals(newOrder);
    }
  };

  const handleOrderChange = (id: string, newPosition: number) => {
    setSelectedHospitals((prev) => {
      const newOrder = [...prev];
      const oldPosition = newOrder.indexOf(id);
      newOrder.splice(oldPosition, 1); // Remove from old position
      newOrder.splice(newPosition, 0, id); // Insert at new position
      return newOrder;
    });
  };

  const buildSearchInput = (isChosen: boolean) => (
    <SearchInput
      value={isChosen ? chosenFilter : availableFilter}
      onChange={(_event, value) => (isChosen ? setChosenFilter(value) : setAvailableFilter(value))}
      onClear={() => (isChosen ? setChosenFilter('') : setAvailableFilter(''))}
    />
  );

  const buildTreeOptions = (
    isChosen: boolean,
    nodes: HospitalNode[]
  ): DualListSelectorTreeItemData[] => {
    if (isChosen) {
      return selectedHospitals.map((id) => {
        const hospitalNode = findHospitalById(id, nodes);
        return {
          id: hospitalNode?.id || id,
          text: hospitalNode?.text || id,
          isChecked: checkedLeafIds.includes(id),
        };
      });
    }

    // Filter out selected hospitals from the available list
    const filterSelectedHospitals = (node: HospitalNode): HospitalNode | null => {
      if (!node.children) {
        // For hospital nodes, only include if not selected
        return selectedHospitals.includes(node.id) ? null : node;
      }

      // For non-hospital nodes (cities and institutes), filter their children
      const filteredChildren = node.children
        .map(filterSelectedHospitals)
        .filter((n): n is HospitalNode => n !== null);

      // Only include non-hospital nodes if they have remaining children
      return filteredChildren.length > 0 ? { ...node, children: filteredChildren } : null;
    };

    const availableNodes = nodes
      .map(filterSelectedHospitals)
      .filter((n): n is HospitalNode => n !== null);

    const mapToTreeItemData = (node: HospitalNode): DualListSelectorTreeItemData => ({
      id: node.id,
      text: node.text,
      isChecked: !node.children && checkedLeafIds.includes(node.id),
      checkProps: {
        'aria-label': `Select ${node.text}`,
        disabled: !!node.children,
      },
      children: node.children ? node.children.map(mapToTreeItemData) : undefined,
      defaultExpanded: true,
    });

    return availableNodes.map(mapToTreeItemData);
  };

  const findHospitalById = (id: string, nodes: HospitalNode[]): HospitalNode | undefined => {
    for (const node of nodes) {
      if (node.id === id) return node;
      if (node.children) {
        const found = findHospitalById(id, node.children);
        if (found) return found;
      }
    }
    return undefined;
  };

  const buildPane = (isChosen: boolean) => {
    const options = buildTreeOptions(isChosen, data);
    const visibleIds = isChosen
      ? selectedHospitals
      : allLeafIds.filter((id) => !selectedHospitals.includes(id));
    const numSelected = checkedLeafIds.filter((id) =>
      isChosen ? selectedHospitals.includes(id) : !selectedHospitals.includes(id)
    ).length;

    return (
      <DualListSelectorPane
        title={isChosen ? 'المستشفيات المختارة' : 'المستشفيات المتاحة'}
        searchInput={buildSearchInput(isChosen)}
        status={`${numSelected} of ${visibleIds.length} selected`}
        isChosen={isChosen}
        className="min-h-[600px] border rounded-lg shadow-sm bg-white"
      >
        <DualListSelectorList className="h-[500px] overflow-y-auto p-4">
          {isChosen ? (
            selectedHospitals.length === 0 ? (
              <EmptyState variant={EmptyStateVariant.sm} className="p-8">
                <EmptyStateBody className="text-gray-500">
                  قم باختيار المستشفيات من القائمة المتاحة
                </EmptyStateBody>
              </EmptyState>
            ) : (
              <DndContext
                sensors={sensors}
                modifiers={[restrictToVerticalAxis]}
                onDragEnd={handleDragEnd}
              >
                <SortableContext items={selectedHospitals} strategy={verticalListSortingStrategy}>
                  {selectedHospitals.map((id, index) => {
                    const hospital = findHospitalById(id, data);
                    return (
                      <DraggableHospital
                        key={id}
                        id={id}
                        text={hospital?.text || id}
                        index={index}
                        onOrderChange={handleOrderChange}
                        totalItems={selectedHospitals.length}
                      />
                    );
                  })}
                </SortableContext>
              </DndContext>
            )
          ) : (
            <DualListSelectorTree
              data={options}
              onOptionCheck={(e, checked, item) => handleCheck(e, checked, item)}
              className="p-2"
            />
          )}
        </DualListSelectorList>
      </DualListSelectorPane>
    );
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <DualListSelector isTree className="gap-8">
        {buildPane(false)}
        <DualListSelectorControlsWrapper className="flex flex-col gap-4 justify-center items-center bg-white p-4 rounded-lg shadow-sm">
          <DualListSelectorControl
            onClick={() => handleMove(true)}
            isDisabled={!checkedLeafIds.length}
            aria-label="Add selected"
            icon={<AngleRightIcon />}
            className="hover:bg-blue-50 transition-colors"
          />
          <DualListSelectorControl
            onClick={() => handleMoveAll(true)}
            isDisabled={selectedHospitals.length === allLeafIds.length}
            aria-label="Add all"
            icon={<AngleDoubleRightIcon />}
            className="hover:bg-blue-50 transition-colors"
          />
          <DualListSelectorControl
            onClick={() => handleMoveAll(false)}
            isDisabled={!selectedHospitals.length}
            aria-label="Remove all"
            icon={<AngleDoubleLeftIcon />}
            className="hover:bg-blue-50 transition-colors"
          />
          <DualListSelectorControl
            onClick={() => handleMove(false)}
            isDisabled={!checkedLeafIds.length}
            aria-label="Remove selected"
            icon={<AngleLeftIcon />}
            className="hover:bg-blue-50 transition-colors"
          />
        </DualListSelectorControlsWrapper>
        {buildPane(true)}
      </DualListSelector>
    </div>
  );
};
