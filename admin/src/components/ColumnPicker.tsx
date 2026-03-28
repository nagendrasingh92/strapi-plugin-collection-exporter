import { useState, useRef } from 'react';
import {
  Button,
  Popover,
  Checkbox,
  Typography,
  Flex,
  Box,
  Divider,
} from '@strapi/design-system';
import { Filter } from '@strapi/icons';

interface ColumnPickerProps {
  allColumns: string[];
  selectedColumns: string[];
  onChange: (columns: string[]) => void;
}

const ColumnPicker = ({ allColumns, selectedColumns, onChange }: ColumnPickerProps) => {
  const [open, setOpen] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const dragNode = useRef<HTMLDivElement | null>(null);

  const handleToggle = (col: string) => {
    if (selectedColumns.includes(col)) {
      if (selectedColumns.length > 1) {
        onChange(selectedColumns.filter((c) => c !== col));
      }
    } else {
      onChange([...selectedColumns, col]);
    }
  };

  const handleSelectAll = () => {
    onChange([...allColumns]);
  };

  const handleDeselectAll = () => {
    onChange([allColumns[0]]);
  };

  const handleDragStart = (index: number, e: React.DragEvent<HTMLDivElement>) => {
    setDragIndex(index);
    dragNode.current = e.currentTarget;
    e.dataTransfer.effectAllowed = 'move';
    // Make the drag image slightly transparent
    if (e.currentTarget) {
      e.currentTarget.style.opacity = '0.4';
    }
  };

  const handleDragEnter = (index: number) => {
    if (dragIndex === null || dragIndex === index) return;
    setOverIndex(index);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragEnd = () => {
    if (dragNode.current) {
      dragNode.current.style.opacity = '1';
    }
    if (dragIndex !== null && overIndex !== null && dragIndex !== overIndex) {
      const reordered = [...selectedColumns];
      const [moved] = reordered.splice(dragIndex, 1);
      reordered.splice(overIndex, 0, moved);
      onChange(reordered);
    }
    setDragIndex(null);
    setOverIndex(null);
    dragNode.current = null;
  };

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <Button variant="tertiary" startIcon={<Filter />} style={{ height: '40px' }}>
          Columns ({selectedColumns.length}/{allColumns.length})
        </Button>
      </Popover.Trigger>
      <Popover.Content
        sideOffset={4}
        style={{
          maxHeight: '400px',
          overflow: 'auto',
          width: '280px',
          zIndex: 1000,
        }}
      >
        <Box padding={3}>
          <Flex justifyContent="space-between" alignItems="center" paddingBottom={2}>
            <Typography variant="sigma" textColor="neutral600">
              Displayed fields
            </Typography>
            <Flex gap={1}>
              <Button variant="tertiary" size="S" onClick={handleSelectAll}>
                All
              </Button>
              <Button variant="tertiary" size="S" onClick={handleDeselectAll}>
                None
              </Button>
            </Flex>
          </Flex>
          <Divider />
          <Typography variant="pi" textColor="neutral500" style={{ display: 'block', paddingTop: '8px', paddingBottom: '4px' }}>
            Drag to reorder columns
          </Typography>
          <Box>
            {selectedColumns.map((col, index) => (
              <Box
                key={col}
                draggable
                onDragStart={(e: React.DragEvent<HTMLDivElement>) => handleDragStart(index, e)}
                onDragEnter={() => handleDragEnter(index)}
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
                style={{
                  padding: '6px 4px',
                  cursor: 'grab',
                  borderRadius: '4px',
                  borderTop: overIndex === index && dragIndex !== null && dragIndex > index ? '2px solid #4945FF' : '2px solid transparent',
                  borderBottom: overIndex === index && dragIndex !== null && dragIndex < index ? '2px solid #4945FF' : '2px solid transparent',
                  background: dragIndex === index ? '#f0f0ff' : 'transparent',
                }}
              >
                <Flex alignItems="center" gap={2}>
                  <Typography variant="pi" textColor="neutral400" style={{ cursor: 'grab', userSelect: 'none' }}>
                    ⠿
                  </Typography>
                  <Checkbox
                    checked={true}
                    onCheckedChange={() => handleToggle(col)}
                  >
                    <Typography variant="omega">
                      {col === 'documentId' ? 'ID' : col}
                    </Typography>
                  </Checkbox>
                </Flex>
              </Box>
            ))}
          </Box>
          {/* Unselected columns */}
          {allColumns.filter((col) => !selectedColumns.includes(col)).length > 0 && (
            <>
              <Divider style={{ marginTop: '8px', marginBottom: '8px' }} />
              <Typography variant="pi" textColor="neutral500" style={{ display: 'block', paddingBottom: '4px' }}>
                Hidden fields
              </Typography>
              <Box>
                {allColumns
                  .filter((col) => !selectedColumns.includes(col))
                  .map((col) => (
                    <Box key={col} style={{ padding: '6px 4px' }}>
                      <Flex alignItems="center" gap={2}>
                        <Typography variant="pi" textColor="transparent" style={{ userSelect: 'none' }}>
                          ⠿
                        </Typography>
                        <Checkbox
                          checked={false}
                          onCheckedChange={() => handleToggle(col)}
                        >
                          <Typography variant="omega" textColor="neutral500">
                            {col === 'documentId' ? 'ID' : col}
                          </Typography>
                        </Checkbox>
                      </Flex>
                    </Box>
                  ))}
              </Box>
            </>
          )}
        </Box>
      </Popover.Content>
    </Popover.Root>
  );
};

export { ColumnPicker };
export default ColumnPicker;
