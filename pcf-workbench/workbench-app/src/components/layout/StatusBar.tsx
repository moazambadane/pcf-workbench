import React from "react";
import { useWorkbenchStore } from "../../store/workbenchStore";
import { useLogStore } from "../../store/logStore";
import dayjs from "dayjs";

export const StatusBar: React.FC = () => {
  const { loadedControl, mockSettings, apiCallCount, lastUpdated, statusMessage } = useWorkbenchStore();
  const { apiLog } = useLogStore();

  const errorCount = apiLog.filter((e) => e.status === "error").length;
  const pendingCount = apiLog.filter((e) => e.status === "pending").length;

  return (
    <div className="flex items-center gap-4 px-3 h-6 bg-wb-bg border-t border-wb-border text-[10px] text-wb-muted shrink-0 overflow-hidden">
      {/* Control info */}
      {loadedControl ? (
        <>
          <StatusItem label="Control" value={`${loadedControl.manifest.namespace}.${loadedControl.manifest.constructor}`} />
          <Divider />
          <StatusItem label="Version" value={loadedControl.manifest.version} />
          <Divider />
          <StatusItem label="Type" value={loadedControl.manifest.controlType} />
        </>
      ) : (
        <span className="text-[#444]">No control loaded</span>
      )}
      <Divider />
      <StatusItem
        label="Mode"
        value={mockSettings.isOffline ? "Offline" : "Online"}
        valueClass={mockSettings.isOffline ? "text-[#f59e0b]" : "text-[#22c55e]"}
      />
      <Divider />
      <StatusItem label="Org" value={mockSettings.organizationName} />
      <Divider />
      <StatusItem label="User" value={mockSettings.userName} />
      <Divider />
      <StatusItem label="API Calls" value={String(apiCallCount)} />
      {errorCount > 0 && (
        <>
          <Divider />
          <StatusItem label="Errors" value={String(errorCount)} valueClass="text-[#ef4444]" />
        </>
      )}
      {pendingCount > 0 && (
        <>
          <Divider />
          <StatusItem label="Pending" value={String(pendingCount)} valueClass="text-[#f59e0b]" />
        </>
      )}
      {lastUpdated && (
        <>
          <Divider />
          <StatusItem label="Updated" value={dayjs(lastUpdated).format("HH:mm:ss")} />
        </>
      )}
      <div className="flex-1" />
      <span className="text-[#444]">{statusMessage}</span>
    </div>
  );
};

const Divider: React.FC = () => (
  <span className="text-[wb-border]">|</span>
);

const StatusItem: React.FC<{ label: string; value: string; valueClass?: string }> = ({ label, value, valueClass }) => (
  <span className="flex items-center gap-1">
    <span className="text-[#444]">{label}:</span>
    <span className={valueClass ?? "text-[#666]"}>{value}</span>
  </span>
);
