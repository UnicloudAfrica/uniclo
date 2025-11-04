import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

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

const normalizeCurrency = (code) =>
  (code || "USD").toUpperCase().trim() || "USD";

const normalizeCountry = (code) =>
  (code || "US").toUpperCase().trim() || "US";

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

  const createOrder = useCallback(
    (payload) => {
      const id = randomId();
      const now = new Date().toISOString();
      const countryCode = normalizeCountry(payload.countryCode);
      const currencyCode = normalizeCurrency(payload.currencyCode);

      const baseStatus =
        payload.status ||
        (payload.paymentStatus === "paid"
          ? "payment_confirmed"
          : "pending_payment");

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
        timeline: [
          createTimelineEntry(baseStatus, payload.timelineNote || "Order created"),
        ],
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
        const updates =
          typeof updater === "function" ? updater(order) : updater || {};
        const nextOrder = {
          ...order,
          ...updates,
          updatedAt: new Date().toISOString(),
        };

        if (updates.status && updates.status !== order.status) {
          nextOrder.timeline = [
            ...(order.timeline || []),
            createTimelineEntry(
              updates.status,
              updates.timelineNote || "Status updated"
            ),
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

  const value = useMemo(
    () => ({
      orders,
      createOrder,
      updateOrder,
      fastTrackOrder,
    }),
    [orders, createOrder, updateOrder, fastTrackOrder]
  );

  return (
    <ObjectStorageContext.Provider value={value}>
      {children}
    </ObjectStorageContext.Provider>
  );
};

export const useObjectStorage = () => {
  const context = useContext(ObjectStorageContext);
  if (!context) {
    throw new Error(
      "useObjectStorage must be used within an ObjectStorageProvider"
    );
  }
  return context;
};

export default ObjectStorageProvider;
