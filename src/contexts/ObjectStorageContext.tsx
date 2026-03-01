import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { ReactNode } from "react";
import objectStorageApi from "../services/objectStorageApi";
import ToastUtils from "../utils/toastUtil";
import useAdminAuthStore from "../stores/adminAuthStore";
import useClientAuthStore from "../stores/clientAuthStore";
import useTenantAuthStore from "../stores/tenantAuthStore";

const STORAGE_KEY = "uc_object_storage_orders_v1";

type AccountQueryState = {
  page: number;
  per_page: number;
};

type AccountQueryOverrides = Partial<AccountQueryState> & {
  force?: boolean;
};

type ObjectStorageAccount = Record<string, unknown> & {
  id?: string | number;
};

type ObjectStorageBucket = Record<string, unknown> & {
  id?: string | number;
  name?: string;
};

type OrderTimelineEntry = {
  id: string;
  status: string;
  note: string;
  timestamp: string;
};

type OrderBilling = {
  unitPrice: number;
  subtotal: number;
  tax: number;
  total: number;
};

type ObjectStorageOrder = {
  id: string;
  label: string;
  customerType: string;
  customerName: string;
  customerEmail: string;
  countryCode: string;
  currencyCode: string;
  region: string;
  tierId: string;
  tierName: string;
  quantity: number;
  months: number;
  billing: OrderBilling;
  paymentMethod: string;
  paymentStatus: string;
  status: string;
  timeline: OrderTimelineEntry[];
  notes: string;
  createdBy: string;
  reviewer: string | null;
  createdAt: string;
  updatedAt: string;
  timelineNote?: string;
};

type CreateOrderPayload = Partial<
  Omit<ObjectStorageOrder, "id" | "billing" | "timeline" | "createdAt" | "updatedAt">
> & {
  billing?: Partial<OrderBilling>;
  timelineNote?: string;
};

type OrderUpdatePayload = Partial<ObjectStorageOrder> & {
  timelineNote?: string;
};

type ObjectStorageContextValue = {
  orders: ObjectStorageOrder[];
  createOrder: (payload: CreateOrderPayload) => string;
  updateOrder: (
    id: string,
    updater: OrderUpdatePayload | ((order: ObjectStorageOrder) => OrderUpdatePayload)
  ) => void;
  fastTrackOrder: (payload: CreateOrderPayload) => string;
  accounts: ObjectStorageAccount[];
  accountsLoading: boolean;
  accountsError: string | null;
  accountsMeta: Record<string, unknown> | null;
  accountQuery: AccountQueryState;
  refreshAccounts: () => Promise<void>;
  changeAccountsPage: (page: number | string) => Promise<void>;
  changeAccountsPerPage: (perPage: number | string) => Promise<void>;
  accountBuckets: Record<string, ObjectStorageBucket[]>;
  bucketLoading: Record<string, boolean>;
  bucketErrors: Record<string, string | null>;
  loadBuckets: (
    accountId: string | number,
    options?: { force?: boolean }
  ) => Promise<ObjectStorageBucket[]>;
  createBucket: (accountId: string | number, payload: Record<string, unknown>) => Promise<unknown>;
  deleteBucket: (accountId: string | number, bucketId: string | number) => Promise<void>;
};

const ObjectStorageContext = createContext<ObjectStorageContextValue | undefined>(undefined);

const randomId = (): string =>
  (globalThis.window.crypto?.randomUUID?.() ?? `order_${Date.now()}_${Math.random()}`)
    .toString()
    .replace(/-/g, "");

const createTimelineEntry = (status: string, note: string): OrderTimelineEntry => ({
  id: randomId(),
  status,
  note,
  timestamp: new Date().toISOString(),
});

const normalizeCurrency = (code?: string) => (code || "USD").toUpperCase().trim() || "USD";

const normalizeCountry = (code?: string) => (code || "US").toUpperCase().trim() || "US";

type ObjectStorageProviderProps = {
  children: ReactNode;
};

export const ObjectStorageProvider = ({ children }: ObjectStorageProviderProps): JSX.Element => {
  const [orders, setOrders] = useState<ObjectStorageOrder[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return [];
      const parsed = JSON.parse(stored);
      return Array.isArray(parsed) ? (parsed as ObjectStorageOrder[]) : [];
    } catch (error) {
      console.error("Failed to read stored Silo Storage orders", error);
      return [];
    }
  });

  const pendingProvisionTimeouts = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const isAdminAuthenticated = useAdminAuthStore((state) => state.isAuthenticated);
  const isClientAuthenticated = useClientAuthStore((state) => state.isAuthenticated);
  const isTenantAuthenticated = useTenantAuthStore((state) => state.isAuthenticated);
  const isAuthenticated = isAdminAuthenticated || isClientAuthenticated || isTenantAuthenticated;
  const [accounts, setAccounts] = useState<ObjectStorageAccount[]>([]);
  const [accountsLoading, setAccountsLoading] = useState(false);
  const [accountsError, setAccountsError] = useState<string | null>(null);
  const [accountsMeta, setAccountsMeta] = useState<Record<string, unknown> | null>(null);
  const accountsLoadingRef = useRef(false);
  const [accountQueryState, setAccountQueryState] = useState<AccountQueryState>({
    page: 1,
    per_page: 10,
  });
  const [accountBuckets, setAccountBuckets] = useState<Record<string, ObjectStorageBucket[]>>({});
  const [bucketLoading, setBucketLoading] = useState<Record<string, boolean>>({});
  const [bucketErrors, setBucketErrors] = useState<Record<string, string | null>>({});
  const accountBucketsRef = useRef<Record<string, ObjectStorageBucket[]>>({});
  const accountQueryRef = useRef(accountQueryState);

  useEffect(() => {
    accountBucketsRef.current = accountBuckets;
  }, [accountBuckets]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
    } catch (error) {
      console.error("Failed to persist Silo Storage orders", error);
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

  const appendOrder = useCallback((order: ObjectStorageOrder) => {
    setOrders((prev) => [...prev, order]);
  }, []);

  const syncAccountQuery = useCallback((nextQuery: AccountQueryState) => {
    accountQueryRef.current = nextQuery;
    setAccountQueryState((prev) => {
      if (prev.page === nextQuery.page && prev.per_page === nextQuery.per_page) {
        return prev;
      }
      return nextQuery;
    });
  }, []);

  const loadAccounts = useCallback(
    async (overrides: AccountQueryOverrides = {}) => {
      const { force, ...queryOverrides } = overrides;
      if (!isAuthenticated) {
        setAccounts([]);
        setAccountsMeta(null);
        setAccountsLoading(false);
        accountsLoadingRef.current = false;
        return;
      }
      if (accountsLoadingRef.current && !force) {
        return;
      }
      accountsLoadingRef.current = true;
      setAccountsLoading(true);
      setAccountsError(null);
      try {
        const nextQuery = {
          ...accountQueryRef.current,
          ...queryOverrides,
        };
        const hasOverride = Object.keys(queryOverrides).length > 0;
        if (hasOverride) {
          syncAccountQuery(nextQuery);
        }
        const { items, meta } = await objectStorageApi.fetchAccounts(nextQuery);
        setAccounts(Array.isArray(items) ? items : []);
        setAccountsMeta(meta ?? null);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unable to load Silo Storage accounts.";
        setAccountsError(message);
        ToastUtils.error(message);
      } finally {
        accountsLoadingRef.current = false;
        setAccountsLoading(false);
      }
    },
    [isAuthenticated, syncAccountQuery]
  );

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        await loadAccounts();
      } catch {
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
    async (accountId: string | number, { force = false } = {}) => {
      if (!accountId) {
        return [];
      }

      const accountKey = String(accountId);
      if (!isAuthenticated) {
        return accountBucketsRef.current[accountKey] ?? [];
      }

      if (!force && accountBucketsRef.current[accountKey]) {
        return accountBucketsRef.current[accountKey];
      }

      setBucketLoading((prev) => ({ ...prev, [accountKey]: true }));
      setBucketErrors((prev) => ({ ...prev, [accountKey]: null }));

      try {
        const data = await objectStorageApi.fetchBuckets(accountId);
        setAccountBuckets((prev) => ({ ...prev, [accountKey]: data }));
        return data;
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unable to load silos.";
        setBucketErrors((prev) => ({ ...prev, [accountKey]: message }));
        ToastUtils.error(message);
        throw error;
      } finally {
        setBucketLoading((prev) => ({ ...prev, [accountKey]: false }));
      }
    },
    [isAuthenticated]
  );

  const createBucket = useCallback(
    async (accountId: string | number, payload: Record<string, unknown>) => {
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
        ToastUtils.success(response?.message || "Silo created successfully.");
        return response;
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unable to create silo.";
        ToastUtils.error(message);
        throw error;
      }
    },
    [isAuthenticated, loadAccounts, loadBuckets]
  );

  const deleteBucket = useCallback(
    async (accountId: string | number, bucketId: string | number) => {
      if (!accountId || !bucketId) {
        throw new Error("Account and silo identifiers are required.");
      }
      if (!isAuthenticated) {
        throw new Error("Missing authentication session. Please sign in again.");
      }
      try {
        await objectStorageApi.deleteBucket(accountId, bucketId);
        await loadBuckets(accountId, { force: true });
        await loadAccounts();
        ToastUtils.success("Silo deleted successfully.");
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unable to delete silo.";
        ToastUtils.error(message);
        throw error;
      }
    },
    [isAuthenticated, loadAccounts, loadBuckets]
  );

  const createOrder = useCallback(
    (payload: CreateOrderPayload) => {
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
      } satisfies ObjectStorageOrder;

      appendOrder(order);
      return id;
    },
    [appendOrder]
  );

  const updateOrder = useCallback(
    (
      id: string,
      updater: OrderUpdatePayload | ((order: ObjectStorageOrder) => OrderUpdatePayload)
    ) => {
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
    },
    []
  );

  const scheduleProvisioning = useCallback(
    (orderId: string) => {
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
    (payload: CreateOrderPayload) => {
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
    async (page: number | string) => {
      const pageNumber = Number(page) || 1;
      await loadAccounts({ page: Math.max(1, pageNumber) });
    },
    [loadAccounts]
  );

  const changeAccountsPerPage = useCallback(
    async (perPage: number | string) => {
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
