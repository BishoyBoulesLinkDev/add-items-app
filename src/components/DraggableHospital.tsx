import React, { useState } from 'react';
import { NumberInput } from '@patternfly/react-core';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface DraggableHospitalProps {
  id: string;
  text: string;
  index: number;
  onOrderChange: (id: string, newPosition: number) => void;
  totalItems: number;
}

export const DraggableHospital: React.FC<DraggableHospitalProps> = ({
  id,
  text,
  index,
  onOrderChange,
  totalItems,
}) => {
  const [isEditing, setIsEditing] = useState(false);
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

  const handleNumberChange = (value: number) => {
    if (value >= 1 && value <= totalItems) {
      onOrderChange(id, value - 1); // Convert to 0-based index
      setIsEditing(false);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="flex items-center gap-2 p-2 bg-white border rounded-md mb-2 cursor-move hover:bg-gray-50"
    >
      <div
        className="w-8 h-8 relative flex items-center justify-center bg-blue-100 rounded-full"
        onClick={(e) => {
          e.stopPropagation();
          setIsEditing(true);
        }}
      >
        {isEditing ? (
          <NumberInput
            className="absolute inset-0 w-full h-full text-center bg-transparent"
            min={1}
            max={totalItems}
            value={index + 1}
            onChange={(event) => {
              const value = parseInt((event.target as HTMLInputElement).value, 10);
              if (!isNaN(value)) {
                handleNumberChange(value);
              }
            }}
            onBlur={() => setIsEditing(false)}
            autoFocus
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span className="text-blue-700 font-semibold">{index + 1}</span>
        )}
      </div>
      <span>{text}</span>
    </div>
  );
};
