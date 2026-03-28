import createContextHook from "@nkzw/create-context-hook"; 
import { useMutation, useQuery } from "@tanstack/react-query"; 
import React, { useCallback, useMemo, useState } from "react"; 
import { exportFulfillmentBackup } from "@/utils/backup"; 
import { 
activityFeed, 
inventory, 
metrics, 
orders, 
shipments, 
team, 
} from "@/mocks/fulfillment-data"; 
import type { Order, OrderStatus } from "@/types/fulfillment"; 
interface FulfillmentSnapshot { 
metrics: typeof metrics; 
orders: Order[]; 
inventory: typeof inventory; 
shipments: typeof shipments; 
activityFeed: typeof activityFeed; 
team: typeof team; 
} 
const snapshot: FulfillmentSnapshot = { 
metrics, 
orders, 
inventory, 
shipments, 
activityFeed, 
team, 
}; 
function createFulfillmentSnapshot(orderState: Order[]): FulfillmentSnapshot { 
return { 
metrics, 
orders: orderState, 
inventory, 
shipments, 
activityFeed, 
team, 
}; 
} 
export const [FulfillmentProvider, useFulfillment] = createContextHook(() => { 
const [selectedOrderId, setSelectedOrderId] = useState<string>(orders[0]?.id ?? 
""); 
const [simulatedScanCount, setSimulatedScanCount] = useState<number>(2); 
const [orderState, setOrderState] = useState<Order[]>(orders); 
const snapshotQuery = useQuery<FulfillmentSnapshot>({ 
queryKey: ["fulfillment-snapshot"], 
queryFn: async () => { 
console.log("[FulfillmentProvider] loading fulfillment snapshot"); 
return snapshot; 
}, 
initialData: snapshot, 
}); 
const updateOrderMutation = useMutation({ 
mutationFn: async ({ orderId, status, progress }: { orderId: string; status: 
OrderStatus; progress?: number }) => { 
console.log("[FulfillmentProvider] updating order", { orderId, status, progress 
}); 
return { orderId, status, progress }; 
}, 
onSuccess: ({ orderId, status, progress }) => { 
setOrderState((current) => 
current.map((order) => 
order.id === orderId 
? { 
...order, 
status, 
progress: progress ?? order.progress, 
} 
: order, 
), 
); 
}, 
}); 
const exportBackupMutation = useMutation({ 
mutationFn: async () => { 
const nextSnapshot = createFulfillmentSnapshot(orderState); 
console.log("[FulfillmentProvider] exporting fulfillment backup", { 
orderCount: nextSnapshot.orders.length, 
inventoryCount: nextSnapshot.inventory.length, 
shipmentCount: nextSnapshot.shipments.length, 
}); 
return exportFulfillmentBackup(nextSnapshot); 
}, 
}); 
const selectedOrder = useMemo(() => { 
return orderState.find((order) => order.id === selectedOrderId) ?? orderState[0] 
?? null; 
}, [orderState, selectedOrderId]); 
const urgentCount = useMemo(() => { 
return orderState.filter((order) => order.priority === "Critical" || order.status 
=== "Exception").length; 
}, [orderState]); 
const openOrderCount = useMemo(() => { 
return orderState.filter((order) => order.status !== "Shipped").length; 
}, [orderState]); 
const activeOrderCount = useMemo(() => { 
return orderState.filter((order) => order.status === "Picking" || order.status === 
"Packing").length; 
}, [orderState]); 
const readyToShipCount = useMemo(() => { 
return orderState.filter((order) => order.status === "Ready" || order.status === 
"Shipped").length; 
}, [orderState]); 
const totalUnits = useMemo(() => { 
return orderState.reduce((sum, order) => sum + order.items.reduce((itemSum, 
item) => itemSum + item.quantity, 0), 0); 
}, [orderState]); 
const averageEfficiency = useMemo(() => { 
if (team.length === 0) { 
return 0; 
} 
return Math.round(team.reduce((sum, member) => sum + member.efficiency, 0) 
/ team.length); 
}, []); 
const totalTasksCompleted = useMemo(() => { 
return team.reduce((sum, member) => sum + member.tasksCompleted, 0); 
}, []); 
const lowStockCount = useMemo(() => { 
return inventory.filter((item) => item.stock - item.reserved < 20).length; 
}, []); 
const blockedShipmentCount = useMemo(() => { 
return shipments.filter((shipment) => !shipment.labelReady).length; 
}, []); 
const advanceSelectedOrder = useCallback(() => { 
if (!selectedOrder) { 
console.log("[FulfillmentProvider] no selected order to advance"); 
return; 
} 
const nextStatusMap: Record<OrderStatus, OrderStatus> = { 
Queued: "Picking", 
Picking: "Packing", 
Packing: "Ready", 
Ready: "Shipped", 
Shipped: "Shipped", 
Exception: "Picking", 
}; 
const nextStatus = nextStatusMap[selectedOrder.status]; 
const nextProgress = Math.min(selectedOrder.progress + 26, 100); 
updateOrderMutation.mutate({ 
orderId: selectedOrder.id, 
status: nextStatus, 
progress: nextProgress, 
}); 
}, [selectedOrder, updateOrderMutation]); 
const simulateScan = useCallback(() => { 
console.log("[FulfillmentProvider] simulate barcode scan"); 
setSimulatedScanCount((current) => current + 1); 
}, []); 
return useMemo(() => ({ 
metrics: snapshotQuery.data?.metrics ?? [], 
orders: orderState, 
inventory: snapshotQuery.data?.inventory ?? [], 
shipments: snapshotQuery.data?.shipments ?? [], 
activityFeed: snapshotQuery.data?.activityFeed ?? [], 
team: snapshotQuery.data?.team ?? [], 
selectedOrder, 
selectedOrderId, 
setSelectedOrderId, 
advanceSelectedOrder, 
simulateScan, 
simulatedScanCount, 
exportBackup: exportBackupMutation.mutateAsync, 
urgentCount, 
openOrderCount, 
activeOrderCount, 
readyToShipCount, 
totalUnits, 
averageEfficiency, 
totalTasksCompleted, 
lowStockCount, 
blockedShipmentCount, 
isLoading: snapshotQuery.isLoading, 
isUpdatingOrder: updateOrderMutation.isPending, 
isExportingBackup: exportBackupMutation.isPending, 
}), [ 
advanceSelectedOrder, 
activeOrderCount, 
averageEfficiency, 
blockedShipmentCount, 
exportBackupMutation.isPending, 
exportBackupMutation.mutateAsync, 
lowStockCount, 
openOrderCount, 
orderState, 
readyToShipCount, 
selectedOrder, 
selectedOrderId, 
simulatedScanCount, 
simulateScan, 
snapshotQuery.data, 
snapshotQuery.isLoading, 
totalTasksCompleted, 
totalUnits, 
updateOrderMutation.isPending, 
urgentCount, 
]); 
}); 
