import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import objectStorageApi from "../services/objectStorageApi";
import ToastUtils from "../utils/toastUtil.ts";
import useAdminAuthStore from "../stores/adminAuthStore";
import useClientAuthStore from "../stores/clientAuthStore";
import useTenantAuthStore from "../stores/tenantAuthStore";

const STORAGE_KEY = "uc_object_storage_orders_v1";

const ObjectStorageContext = createContext(undefined);

const randomId = () =>
  (window.crypto?.randomUUID?.() ?? `order_${Date.now()}_${Math.random()}`)
    .toString()
    .replace(/-/g, "");

const createTimelineEntry = (status, note) => ({
  id: randomId(),
  status,
  note,
  timestamp: new Date().toISOString(),
});

const normalizeCurrency = (code) => (code || "USD").toUpperCase().trim() || "USD";

const normalizeCountry = (code) => (code || "US").toUpperCase().trim() || "US";

export const ObjectStorageProvider = ({ children }) => {
  const [orders, setOrders] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return [];
      const parsed = JSON.parse(stored);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.error("Failed to read stored object storage orders", error);
      return [];
    }
  });

  const pendingProvisionTimeouts = useRef({});
  const isAdminAuthenticated = useAdminAuthStore((state) => state.isAuthenticated);
  const isClientAuthenticated = useClientAuthStore((state) => state.isAuthenticated);
  const isTenantAuthenticated = useTenantAuthStore((state) => state.isAuthenticated);
  const isAuthenticated = isAdminAuthenticated || isClientAuthenticated || isTenantAuthenticated;
  const [accounts, setAccounts] = useState([]);
  const [accountsLoading, setAccountsLoading] = useState(false);
  const [accountsError, setAccountsError] = useState(null);
  const [accountsMeta, setAccountsMeta] = useState(null);
  const [accountQueryState, setAccountQueryState] = useState({
    page: 1,
    per_page: 10,
  });
  const [accountBuckets, setAccountBuckets] = useState({});
  const [bucketLoading, setBucketLoading] = useState({});
  const [bucketErrors, setBucketErrors] = useState({});
  const accountBucketsRef = useRef({});
  const accountQueryRef = useRef(accountQueryState);

  useEffect(() => {
    accountBucketsRef.current = accountBuckets;
  }, [accountBuckets]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
    } catch (error) {
      console.error("Failed to persist object storage orders", error);
    }
  }, [orders]);

  useEffect(
    () => () => {
      Object.values(pendingProvisionTimeouts.current).forEach((timeoutId) => {
        clearTimeout(timeoutId);
      });
    },
    []
  );

  const appendOrder = useCallback((order) => {
    setOrders((prev) => [...prev, order]);
  }, []);

  const syncAccountQuery = useCallback((nextQuery) => {
    accountQueryRef.current = nextQuery;
    setAccountQueryState((prev) => {
      if (prev.page === nextQuery.page && prev.per_page === nextQuery.per_page) {
        return prev;
      }
      return nextQuery;
    });
  }, []);

  const loadAccounts = useCallback(
    async (overrides = {}) => {
      if (accountsLoading && !overrides?.force) {
        return;
      }
      if (!isAuthenticated) {
        setAccounts([]);
        setAccountsMeta(null);
        setAccountsLoading(false);
        return;
      }
      setAccountsLoading(true);
      setAccountsError(null);
      try {
        const nextQuery = {
          ...accountQueryRef.current,
          ...overrides,
        };
        const hasOverride = Object.keys(overrides || {}).length > 0;
        if (hasOverride) {
          syncAccountQuery(nextQuery);
        }
        const { items, meta } = await objectStorageApi.fetchAccounts(nextQuery);
        setAccounts(Array.isArray(items) ? items : []);
        setAccountsMeta(meta ?? null);
      } catch (error) {
        const message = error?.message || "Unable to load object storage accounts.";
        setAccountsError(message);
        ToastUtils.error(message);
      } finally {
        setAccountsLoading(false);
      }
    },
    [isAuthenticated, syncAccountQuery]
  );

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        if (isAuthenticated) {
          await loadAccounts();
        }
      } catch (error) {
        if (isMounted) {
          // loadAccounts already handles state/toast
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [loadAccounts, isAuthenticated]);

  const loadBuckets = useCallback(
    async (accountId, { force = false } = {}) => {
      if (!accountId) {
        return [];
      }

      if (!isAuthenticated) {
        return accountBucketsRef.current[accountId] ?? [];
      }

      if (!force && accountBucketsRef.current[accountId]) {
        return accountBucketsRef.current[accountId];
      }

      setBucketLoading((prev) => ({ ...prev, [accountId]: true }));
      setBucketErrors((prev) => ({ ...prev, [accountId]: null }));

      try {
        const data = await objectStorageApi.fetchBuckets(accountId);
        setAccountBuckets((prev) => ({ ...prev, [accountId]: data }));
        return data;
      } catch (error) {
        const message = error?.message || "Unable to load buckets.";
        setBucketErrors((prev) => ({ ...prev, [accountId]: message }));
        ToastUtils.error(message);
        throw error;
      } finally {
        setBucketLoading((prev) => ({ ...prev, [accountId]: false }));
      }
    },
    [isAuthenticated]
  );

  const createBucket = useCallback(
    async (accountId, payload) => {
      if (!accountId) {
        throw new Error("Account ID is required.");
      }
      if (!isAuthenticated) {
        throw new Error("Missing authentication session. Please sign in again.");
      }
      try {
        const response = await objectStorageApi.createBucket(accountId, payload);
        await loadBuckets(accountId, { force: true });
        await loadAccounts();
        ToastUtils.success(response?.message || "Bucket created successfully.");
        return response;
      } catch (error) {
        const message = error?.message || "Unable to create bucket.";
        ToastUtils.error(message);
        throw error;
      }
    },
    [isAuthenticated, loadAccounts, loadBuckets]
  );

  const deleteBucket = useCallback(
    async (accountId, bucketId) => {
      if (!accountId || !bucketId) {
        throw new Error("Account and bucket identifiers are required.");
      }
      if (!isAuthenticated) {
        throw new Error("Missing authentication session. Please sign in again.");
      }
      try {
        await objectStorageApi.deleteBucket(accountId, bucketId);
        await loadBuckets(accountId, { force: true });
        await loadAccounts();
        ToastUtils.success("Bucket deleted successfully.");
      } catch (error) {
        const message = error?.message || "Unable to delete bucket.";
        ToastUtils.error(message);
        throw error;
      }
    },
    [isAuthenticated, loadAccounts, loadBuckets]
  );

  const createOrder = useCallback(
    (payload) => {
      const id = randomId();
      const now = new Date().toISOString();
      const countryCode = normalizeCountry(payload.countryCode);
      const currencyCode = normalizeCurrency(payload.currencyCode);

      const baseStatus =
        payload.status ||
        (payload.paymentStatus === "paid" ? "payment_confirmed" : "pending_payment");

      const order = {
        id,
        label: payload.label || `Object storage plan`,
        customerType: payload.customerType || "tenant",
        customerName: payload.customerName || "Unknown tenant",
        customerEmail: payload.customerEmail || "",
        countryCode,
        currencyCode,
        region: payload.region || "",
        tierId: payload.tierId || "",
        tierName: payload.tierName || "Custom tier",
        quantity: Number(payload.quantity ?? 1),
        months: Number(payload.months ?? 1),
        billing: {
          unitPrice: Number(payload.billing?.unitPrice ?? 0),
          subtotal: Number(payload.billing?.subtotal ?? 0),
          tax: Number(payload.billing?.tax ?? 0),
          total: Number(payload.billing?.total ?? 0),
        },
        paymentMethod: payload.paymentMethod || "invoice",
        paymentStatus: payload.paymentStatus || "pending",
        status: baseStatus,
        timeline: [createTimelineEntry(baseStatus, payload.timelineNote || "Order created")],
        notes: payload.notes || "",
        createdBy: payload.createdBy || "system",
        reviewer: payload.reviewer || null,
        createdAt: now,
        updatedAt: now,
      };

      appendOrder(order);
      return id;
    },
    [appendOrder]
  );

  const updateOrder = useCallback((id, updater) => {
    setOrders((prev) =>
      prev.map((order) => {
        if (order.id !== id) return order;
        const updates = typeof updater === "function" ? updater(order) : updater || {};
        const nextOrder = {
          ...order,
          ...updates,
          updatedAt: new Date().toISOString(),
        };

        if (updates.status && updates.status !== order.status) {
          nextOrder.timeline = [
            ...(order.timeline || []),
            createTimelineEntry(updates.status, updates.timelineNote || "Status updated"),
          ];
        }

        return nextOrder;
      })
    );
  }, []);

  const scheduleProvisioning = useCallback(
    (orderId) => {
      const startId = setTimeout(() => {
        updateOrder(orderId, {
          status: "provisioning",
          timelineNote: "Provisioning in progress",
        });

        const finishId = setTimeout(() => {
          updateOrder(orderId, {
            status: "active",
            paymentStatus: "paid",
            timelineNote: "Provisioning completed",
          });
          delete pendingProvisionTimeouts.current[orderId];
        }, 1200);

        pendingProvisionTimeouts.current[orderId] = finishId;
      }, 400);

      pendingProvisionTimeouts.current[orderId] = startId;
    },
    [updateOrder]
  );

  const fastTrackOrder = useCallback(
    (payload) => {
      const id = createOrder({
        ...payload,
        paymentStatus: "admin_approved",
        status: "provisioning",
        timelineNote: "Fast-track approval granted",
      });
      scheduleProvisioning(id);
      return id;
    },
    [createOrder, scheduleProvisioning]
  );

  const refreshAccounts = useCallback(async () => {
    await loadAccounts({});
  }, [loadAccounts]);

  const changeAccountsPage = useCallback(
    async (page) => {
      const pageNumber = Number(page) || 1;
      await loadAccounts({ page: Math.max(1, pageNumber) });
    },
    [loadAccounts]
  );

  const changeAccountsPerPage = useCallback(
    async (perPage) => {
      const parsed = Number(perPage) || accountQueryRef.current.per_page || 10;
      await loadAccounts({ per_page: parsed, page: 1 });
    },
    [loadAccounts]
  );

  const value = useMemo(
    () => ({
      orders,
      createOrder,
      updateOrder,
      fastTrackOrder,
      accounts,
      accountsLoading,
      accountsError,
      accountsMeta,
      accountQuery: accountQueryState,
      refreshAccounts,
      changeAccountsPage,
      changeAccountsPerPage,
      accountBuckets,
      bucketLoading,
      bucketErrors,
      loadBuckets,
      createBucket,
      deleteBucket,
    }),
    [
      orders,
      createOrder,
      updateOrder,
      fastTrackOrder,
      accounts,
      accountsLoading,
      accountsError,
      refreshAccounts,
      accountsMeta,
      accountQueryState,
      changeAccountsPage,
      changeAccountsPerPage,
      accountBuckets,
      bucketLoading,
      bucketErrors,
      loadBuckets,
      createBucket,
      deleteBucket,
    ]
  );

  return <ObjectStorageContext.Provider value={value}>{children}</ObjectStorageContext.Provider>;
};

export const useObjectStorage = () => {
  const context = useContext(ObjectStorageContext);
  if (!context) {
    throw new Error("useObjectStorage must be used within an ObjectStorageProvider");
  }
  return context;
};

export default ObjectStorageProvider;
