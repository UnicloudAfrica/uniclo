import { useCallback, useMemo } from "react";
import useUnifiedAuthStore from "../stores/unifiedAuthStore";
import useMultiTenantAuthStore from "../stores/multiTenantAuthStore";

/**
 * Shared hook for checking cloud roles and abilities across auth stores.
 */
export const useCloudAccess = () => {
  const unifiedHasCloudAbility = useUnifiedAuthStore((state) => state.hasCloudAbility);
  const unifiedHasCloudRole = useUnifiedAuthStore((state) => state.hasCloudRole);
  const unifiedCloudAbilities = useUnifiedAuthStore((state) => state.cloudAbilities);
  const unifiedCloudRoles = useUnifiedAuthStore((state) => state.cloudRoles);

  const multiHasCloudAbility = useMultiTenantAuthStore((state) => state.hasCloudAbility);
  const multiHasCloudRole = useMultiTenantAuthStore((state) => state.hasCloudRole);
  const multiCloudAbilities = useMultiTenantAuthStore((state) => state.cloudAbilities);
  const multiCloudRoles = useMultiTenantAuthStore((state) => state.cloudRoles);


  const testers = useMemo(() => {
    const t = {
      hasCloudAbility: [],
      hasCloudRole: [],
    };

    if (unifiedHasCloudAbility) {
      t.hasCloudAbility.push(unifiedHasCloudAbility);
    }
    if (multiHasCloudAbility) {
      t.hasCloudAbility.push(multiHasCloudAbility);
    }

    if (unifiedHasCloudRole) {
      t.hasCloudRole.push(unifiedHasCloudRole);
    }
    if (multiHasCloudRole) {
      t.hasCloudRole.push(multiHasCloudRole);
    }

    return t;
  }, [
    unifiedHasCloudAbility,
    multiHasCloudAbility,
    unifiedHasCloudRole,
    multiHasCloudRole,
  ]);

  const abilities =
    (Array.isArray(unifiedCloudAbilities) && unifiedCloudAbilities.length > 0
      ? unifiedCloudAbilities
      : multiCloudAbilities) ?? [];

  const roles =
    (Array.isArray(unifiedCloudRoles) && unifiedCloudRoles.length > 0
      ? unifiedCloudRoles
      : multiCloudRoles) ?? [];

  const hasAbility = useCallback(
    (abilityKey) => {
      if (!abilityKey) {
        return true;
      }
      if (!testers.hasCloudAbility.length) {
        return true;
      }
      return testers.hasCloudAbility.some((fn) => {
        try {
          return fn(abilityKey);
        } catch {
          return false;
        }
      });
    },
    [testers.hasCloudAbility]
  );

  const hasRole = useCallback(
    (roleKey) => {
      if (!roleKey) {
        return true;
      }
      if (!testers.hasCloudRole.length) {
        return true;
      }
      return testers.hasCloudRole.some((fn) => {
        try {
          return fn(roleKey);
        } catch {
          return false;
        }
      });
    },
    [testers.hasCloudRole]
  );

  return {
    abilities,
    roles,
    hasAbility,
    hasRole,
  };
};

export default useCloudAccess;
