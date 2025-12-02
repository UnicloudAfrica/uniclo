import { useState, useMemo } from 'react';
import { useFetchTenants } from './tenantHooks';
import { useFetchClients } from './clientHooks';
import { useSharedClients } from '../sharedCalculatorHooks';

export const useCustomerContext = (options = {}) => {
    const { enabled = true } = options;
    const [contextType, setContextType] = useState('unassigned'); // 'unassigned', 'tenant', 'user'
    const [selectedTenantId, setSelectedTenantId] = useState('');
    const [selectedUserId, setSelectedUserId] = useState('');

    // Fetch data
    const { data: tenants = [], isFetching: isTenantsFetching } = useFetchTenants({
        enabled: enabled
    });

    // Fetch all admin clients (direct users)
    const { data: adminClients = [], isFetching: isAdminClientsFetching } = useFetchClients({
        enabled: enabled
    });

    // Fetch tenant clients (sub-users) if a tenant is selected
    const { data: tenantClients = [], isFetching: isTenantClientsFetching } = useSharedClients(selectedTenantId, {
        enabled: enabled && !!selectedTenantId
    });

    // Determine which user pool to show
    const userPool = useMemo(() => {
        if (contextType !== 'user') return [];

        if (selectedTenantId) {
            // If tenant is selected, show only that tenant's users
            return tenantClients;
        } else {
            // If no tenant selected, show users WITHOUT a tenant_id (direct users)
            return adminClients.filter(user => !user.tenant_id);
        }
    }, [contextType, selectedTenantId, tenantClients, adminClients]);

    const isUsersFetching = selectedTenantId ? isTenantClientsFetching : isAdminClientsFetching;

    // Reset dependent fields when context changes
    const handleContextTypeChange = (type) => {
        setContextType(type);
        if (type === 'unassigned') {
            setSelectedTenantId('');
            setSelectedUserId('');
        } else if (type === 'tenant') {
            setSelectedUserId('');
        } else if (type === 'user') {
            // Keep tenant selection if switching from tenant to user, but clear user
            // If switching from unassigned to user, clear everything
            if (contextType === 'unassigned') {
                setSelectedTenantId('');
            }
            setSelectedUserId('');
        }
    };

    const handleTenantChange = (tenantId) => {
        setSelectedTenantId(tenantId);
        // If we are in 'user' mode, clearing tenant should reset user selection too
        // But if we change tenant, we definitely need to reset user selection as the pool changes
        setSelectedUserId('');
    };

    return {
        contextType,
        setContextType: handleContextTypeChange,
        selectedTenantId,
        setSelectedTenantId: handleTenantChange,
        selectedUserId,
        setSelectedUserId,
        tenants,
        isTenantsFetching,
        userPool,
        isUsersFetching,
    };
};
