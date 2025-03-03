import React from 'react';
import { ListItem } from '@patternfly/react-core';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface DraggableHospitalProps {
  id: string;
  hospital: string;
}

export const DraggableHospital: React.FC<DraggableHospitalProps> = ({ id, hospital }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    cursor: 'grab',
    padding: '0.5rem',
    margin: '0.25rem 0',
    backgroundColor: 'white',
    borderRadius: '0.25rem',
    border: '1px solid #d2d2d2',
  };

  return (
    <ListItem ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {hospital}
    </ListItem>
  );
};
