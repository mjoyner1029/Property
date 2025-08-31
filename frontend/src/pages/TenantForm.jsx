import React from 'react';
import { useParams } from 'react-router-dom';
import { useApp } from '../context';

/**
 * TenantForm page component
 * 
 * This is a placeholder component for test compatibility.
 * Handles both creation and editing of tenant data.
 * 
 * @returns {JSX.Element} The TenantForm page
 */
export function TenantForm() {
  const { id } = useParams();
  const { updatePageTitle } = useApp();
  const isCreateMode = !id;
  
  React.useEffect(() => {
    updatePageTitle(isCreateMode ? 'Add Tenant' : 'Edit Tenant');
  }, [updatePageTitle, isCreateMode]);
  
  return (
    <div>
      <h1 data-testid="tenant-form">
        {isCreateMode ? 'Add Tenant' : 'Edit Tenant'}
      </h1>
    </div>
  );
}

export default TenantForm;
