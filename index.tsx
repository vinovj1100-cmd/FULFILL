import React, { useCallback } from "react"; 
import { Alert, Pressable, StyleSheet, Text, View } from "react-native"; 
import { Boxes, Clock3, Download, ShieldAlert, Truck } from "lucide-react
native"; 
import { 
ActivityRow, 
AlertBanner, 
LoadingState, 
MetricCard, 
OrderCard, 
ScreenShell, 
SectionHeader, 
ShipmentRow, 
SurfaceCard, 
TeamRow, 
} from "@/components/ops-ui"; 
import { fulfillmentTheme } from "@/constants/fulfillment-theme"; 
import { useFulfillment } from "@/providers/fulfillment-provider"; 
interface LiveKpiCardProps { 
title: string; 
value: string; 
detail: string; 
accentColor: string; 
icon: React.ReactNode; 
testID: string; 
} 
function LiveKpiCard({ title, value, detail, accentColor, icon, testID }: 
LiveKpiCardProps) { 
return ( 
<View style={styles.liveKpiCard} testID={testID}> 
<View style={[styles.liveKpiGlow, { backgroundColor: accentColor }]} /> 
<View style={styles.liveKpiHeader}> 
<View style={[styles.liveKpiIconWrap, { backgroundColor: 
`${accentColor}20` }]}>{icon}</View> 
<Text style={styles.liveKpiTitle}>{title}</Text> 
</View> 
<Text style={styles.liveKpiValue}>{value}</Text> 
<Text style={styles.liveKpiDetail}>{detail}</Text> 
</View> 
); 
} 
export default function OverviewScreen() { 
const { 
activityFeed, 
activeOrderCount, 
averageEfficiency, 
blockedShipmentCount, 
isLoading, 
metrics, 
openOrderCount, 
orders, 
readyToShipCount, 
shipments, 
team, 
totalUnits, 
urgentCount, 
lowStockCount, 
exportBackup, 
isExportingBackup, 
} = useFulfillment(); 
const handleExportBackup = useCallback(async () => { 
try { 
const result = await exportBackup(); 
const detail = result.mode === "downloaded" 
? `${result.filename} was downloaded to your computer.` 
: result.mode === "shared" 
? `${result.filename} is ready to save from the share sheet.` 
: `${result.filename} was saved locally on this device.`; 
Alert.alert("Backup created", detail); 
} catch (error) { 
console.log("[OverviewScreen] backup export failed", { error }); 
Alert.alert("Backup failed", "We couldn't export your app data. Please try 
again."); 
} 
}, [exportBackup]); 
if (isLoading) { 
return <LoadingState />; 
} 
return ( 
<ScreenShell title="Operations" subtitle="Command center for same-day 
throughput, exception control, and outbound velocity." rightLabel="Live shift"> 
<AlertBanner title={`${urgentCount} urgent orders require intervention`} 
detail={`${lowStockCount} low-stock bins are constraining release volume this 
hour.`} /> 
<Pressable 
onPress={handleExportBackup} 
style={({ pressed }) => [styles.backupCard, pressed ? 
styles.backupCardPressed : undefined]} 
disabled={isExportingBackup} 
testID="overview-export-backup" 
> 
<View style={styles.backupIconWrap}> 
<Download color={fulfillmentTheme.blue} size={18} /> 
</View> 
<View style={styles.backupCopy}> 
<Text style={styles.backupTitle}>{isExportingBackup ? "Preparing 
backup..." : "Save app data locally"}</Text> 
<Text style={styles.backupDetail}>Export the current fulfillment data as a 
JSON backup to your computer or device.</Text> 
</View> 
<View style={styles.backupBadge}> 
<Text style={styles.backupBadgeText}>{isExportingBackup ? "Working" : 
"Export"}</Text> 
</View> 
</Pressable> 
<View style={styles.metricsGrid}> 
{metrics.map((metric) => ( 
<MetricCard key={metric.id} metric={metric} /> 
))} 
</View> 
<SurfaceCard> 
<SectionHeader title="Live floor snapshot" actionLabel="Shared app data" /> 
        <View style={styles.liveKpiGrid}> 
          <LiveKpiCard 
            title="Open queue" 
            value={String(openOrderCount)} 
            detail={`${totalUnits} units across active orders`} 
            accentColor={fulfillmentTheme.blue} 
            icon={<Clock3 color={fulfillmentTheme.blue} size={18} />} 
            testID="overview-open-orders" 
          /> 
          <LiveKpiCard 
            title="In motion" 
            value={String(activeOrderCount)} 
            detail="Currently in pick or pack execution" 
            accentColor={fulfillmentTheme.amber} 
            icon={<Boxes color={fulfillmentTheme.amber} size={18} />} 
            testID="overview-active-orders" 
          /> 
          <LiveKpiCard 
            title="Outbound ready" 
            value={String(readyToShipCount)} 
            detail={`${blockedShipmentCount} shipments blocked at label stage`} 
            accentColor={fulfillmentTheme.green} 
            icon={<Truck color={fulfillmentTheme.green} size={18} />} 
            testID="overview-ready-orders" 
          /> 
          <LiveKpiCard 
            title="Exception risk" 
            value={String(urgentCount)} 
            detail={`${lowStockCount} bins need inventory recovery`} 
            accentColor={fulfillmentTheme.red} 
icon={<ShieldAlert color={fulfillmentTheme.red} size={18} />} 
testID="overview-risk-orders" 
/> 
</View> 
</SurfaceCard> 
<SurfaceCard> 
<SectionHeader title="Shift command" actionLabel="Manager view" /> 
<View style={styles.commandStrip}> 
<View style={styles.commandCard} testID="overview-team-efficiency"> 
<Text style={styles.commandValue}>{averageEfficiency}%</Text> 
<Text style={styles.commandLabel}>Team efficiency</Text> 
</View> 
<View style={styles.commandCard} testID="overview-shipment-loads"> 
<Text style={styles.commandValue}>{shipments.length}</Text> 
<Text style={styles.commandLabel}>Active loads</Text> 
</View> 
<View style={styles.commandCard} testID="overview-priority-orders"> 
<Text style={styles.commandValue}>{orders.filter((order) => 
order.priority === "Critical").length}</Text> 
<Text style={styles.commandLabel}>Critical orders</Text> 
</View> 
</View> 
</SurfaceCard> 
<SurfaceCard> 
<SectionHeader title="Priority queue" actionLabel="Open detail" /> 
<View style={styles.stack}> 
{orders.slice(0, 3).map((order) => ( 
<OrderCard key={order.id} order={order} /> 
))} 
</View> 
</SurfaceCard> 
<SurfaceCard> 
<SectionHeader title="Dock activity" actionLabel="Outbound" /> 
<View style={styles.stack}> 
{shipments.map((shipment) => ( 
<ShipmentRow key={shipment.id} shipment={shipment} /> 
))} 
</View> 
</SurfaceCard> 
<SurfaceCard> 
<SectionHeader title="Shift feed" actionLabel="Real-time" /> 
<View style={styles.stack}> 
{activityFeed.map((event) => ( 
<ActivityRow key={event.id} event={event} /> 
))} 
</View> 
</SurfaceCard> 
<SurfaceCard> 
<SectionHeader title="Top performers" actionLabel="This shift" /> 
<View style={styles.stack}> 
{team.map((member) => ( 
<TeamRow key={member.id} member={member} /> 
))} 
</View> 
</SurfaceCard> 
</ScreenShell> 
); 
} 
const styles = StyleSheet.create({ 
backupCard: { 
flexDirection: "row", 
alignItems: "center", 
gap: 14, 
padding: 16, 
borderRadius: 22, 
borderWidth: 1, 
borderColor: fulfillmentTheme.border, 
backgroundColor: fulfillmentTheme.panel, 
shadowColor: fulfillmentTheme.blue, 
shadowOpacity: 0.16, 
shadowRadius: 20, 
shadowOffset: { width: 0, height: 10 }, 
}, 
backupCardPressed: { 
opacity: 0.86, 
transform: [{ scale: 0.99 }], 
}, 
backupIconWrap: { 
width: 42, 
height: 42, 
borderRadius: 14, 
alignItems: "center", 
justifyContent: "center", 
backgroundColor: "rgba(87, 184, 255, 0.14)", 
}, 
backupCopy: { 
flex: 1, 
gap: 4, 
}, 
backupTitle: { 
color: fulfillmentTheme.text, 
fontSize: 16, 
fontWeight: "800", 
}, 
backupDetail: { 
color: fulfillmentTheme.textMuted, 
fontSize: 13, 
lineHeight: 19, 
}, 
backupBadge: { 
paddingHorizontal: 12, 
paddingVertical: 8, 
borderRadius: 999, 
backgroundColor: "rgba(87, 184, 255, 0.14)", 
}, 
backupBadgeText: { 
color: fulfillmentTheme.blue, 
fontSize: 12, 
fontWeight: "800", 
}, 
metricsGrid: { 
flexDirection: "row", 
flexWrap: "wrap", 
gap: 12, 
}, 
liveKpiGrid: { 
flexDirection: "row", 
flexWrap: "wrap", 
gap: 12, 
marginTop: 14, 
}, 
liveKpiCard: { 
flexGrow: 1, 
minWidth: 150, 
backgroundColor: fulfillmentTheme.panelAlt, 
borderRadius: 18, 
borderWidth: 1, 
borderColor: fulfillmentTheme.border, 
padding: 14, 
gap: 10, 
overflow: "hidden", 
}, 
liveKpiGlow: { 
position: "absolute", 
width: 64, 
height: 64, 
borderRadius: 32, 
opacity: 0.18, 
top: -18, 
right: -18, 
}, 
liveKpiHeader: { 
flexDirection: "row", 
alignItems: "center", 
gap: 10, 
}, 
liveKpiIconWrap: { 
width: 34, 
height: 34, 
borderRadius: 17, 
alignItems: "center", 
justifyContent: "center", 
}, 
liveKpiTitle: { 
flex: 1, 
color: fulfillmentTheme.textMuted, 
fontSize: 13, 
fontWeight: "700", 
}, 
liveKpiValue: { 
color: fulfillmentTheme.text, 
fontSize: 28, 
fontWeight: "800", 
}, 
liveKpiDetail: { 
color: fulfillmentTheme.textMuted, 
fontSize: 12, 
lineHeight: 18, 
}, 
commandStrip: { 
flexDirection: "row", 
flexWrap: "wrap", 
gap: 12, 
marginTop: 14, 
}, 
commandCard: { 
flexGrow: 1, 
minWidth: 100, 
padding: 14, 
borderRadius: 18, 
backgroundColor: "rgba(255,255,255,0.03)", 
borderWidth: 1, 
borderColor: fulfillmentTheme.border, 
gap: 4, 
}, 
commandValue: { 
color: fulfillmentTheme.text, 
fontSize: 24, 
fontWeight: "800", 
}, 
commandLabel: { 
color: fulfillmentTheme.textMuted, 
fontSize: 12, 
fontWeight: "600", 
}, 
stack: { 
gap: 12, 
marginTop: 14, 
}, 
}); 
