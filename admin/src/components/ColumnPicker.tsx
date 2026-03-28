import { useState } from 'react';
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

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <Button variant="tertiary" startIcon={<Filter />}>
          Columns ({selectedColumns.length}/{allColumns.length})
        </Button>
      </Popover.Trigger>
      <Popover.Content
        sideOffset={4}
        style={{
          maxHeight: '400px',
          overflow: 'auto',
          width: '260px',
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
          <Box paddingTop={2}>
            {allColumns.map((col) => (
              <Box key={col} paddingTop={1} paddingBottom={1}>
                <Checkbox
                  checked={selectedColumns.includes(col)}
                  onCheckedChange={() => handleToggle(col)}
                >
                  <Typography variant="omega">
                    {col === 'documentId' ? 'ID' : col}
                  </Typography>
                </Checkbox>
              </Box>
            ))}
          </Box>
        </Box>
      </Popover.Content>
    </Popover.Root>
  );
};

export { ColumnPicker };
export default ColumnPicker;
