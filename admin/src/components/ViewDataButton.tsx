import { useState } from 'react';
import { Button } from '@strapi/design-system';
import { Download } from '@strapi/icons';
import { useLocation } from 'react-router-dom';
import { DataModal } from './DataModal';

const ViewDataButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const pathParts = location.pathname.split('/');
  const collectionTypeIndex = pathParts.indexOf('collection-types');
  const uid = collectionTypeIndex !== -1 ? pathParts[collectionTypeIndex + 1] : null;

  if (!uid) {
    return null;
  }

  return (
    <>
      <Button variant="tertiary" startIcon={<Download />} onClick={() => setIsOpen(true)}>
        CSV/Excel
      </Button>
      {isOpen && <DataModal uid={uid} onClose={() => setIsOpen(false)} />}
    </>
  );
};

export { ViewDataButton };
export default ViewDataButton;
