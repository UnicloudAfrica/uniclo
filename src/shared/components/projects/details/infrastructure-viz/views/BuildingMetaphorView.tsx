/**
 * BuildingMetaphorView.tsx
 *
 * Interactive 2D building illustration that maps cloud infrastructure
 * resources to physical building elements:
 *
 *   VPC              = The entire building outline
 *   Network ACLs     = Perimeter fence (dashed border)
 *   Internet Gateway  = Main entrance door at the bottom
 *   Subnets          = Floors of the building (stacked horizontally)
 *   Instances         = Rooms on the floors
 *   Security Groups   = Shield icons on room doors
 *   Route Tables      = Directory sign in the lobby
 *   NAT Gateway       = Mail room (one-way outbound)
 *   Load Balancer     = Reception desk at the entrance
 *   Elastic IPs       = Permanent phone labels on rooms
 *   Network Interfaces = Ethernet jack icons inside rooms
 *   VPC Peering       = Skybridge going off to the right
 *
 * Built with Tailwind CSS divs + framer-motion for animations.
 */
import React, { useCallback } from "react";
import { motion } from "framer-motion";
import {
  Building2,
  DoorOpen,
  Server,
  Shield,
  Route,
  Globe,
  Globe2,
  Cable,
  Zap,
  ShieldCheck,
  GitMerge,
  Network,
  Phone,
  Mail,
  ArrowRight,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { RESOURCE_EXPLANATIONS } from "../resourceExplanations";
import type { ResourceTypeId } from "../resourceExplanations";
import type { ViewProps } from "../InfrastructureVisualization.types";
import { isFeatureSupported } from "@/utils/featureGating";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getResourceCount(data: ViewProps["data"], typeId: ResourceTypeId): number {
  if (typeId === "instances") return data.instanceStats.total;
  return (data.resourceCounts[typeId] as number) ?? 0;
}

// ---------------------------------------------------------------------------
// ResourceChip - small clickable pill for each resource
// ---------------------------------------------------------------------------

interface ResourceChipProps {
  typeId: ResourceTypeId;
  icon: LucideIcon;
  label: string;
  count: number;
  isHighlighted: boolean;
  isSelected: boolean;
  onClick: () => void;
  /** Optional extra icon to show after the label */
  extraIcon?: LucideIcon;
  /** Compact mode hides the label text, only shows icon + count */
  compact?: boolean;
  className?: string;
}

const ResourceChip: React.FC<ResourceChipProps> = ({
  typeId,
  icon: Icon,
  label,
  count,
  isHighlighted,
  isSelected,
  onClick,
  extraIcon: ExtraIcon,
  compact = false,
  className = "",
}) => {
  const res = RESOURCE_EXPLANATIONS[typeId];
  const ringClass = isSelected
    ? "ring-2 ring-blue-500 shadow-md"
    : isHighlighted
      ? "ring-2 ring-blue-400 animate-pulse"
      : "ring-1 ring-gray-200/80";

  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ scale: 1.05, y: -1 }}
      whileTap={{ scale: 0.97 }}
      className={[
        "relative flex items-center gap-1.5 rounded-lg bg-white px-2 py-1.5",
        "cursor-pointer transition-shadow duration-150",
        "hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400",
        ringClass,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      title={`${label} (${count})`}
    >
      {/* Icon */}
      <div
        className={[
          "flex shrink-0 items-center justify-center rounded-md",
          res.bgColor,
          "h-6 w-6",
        ].join(" ")}
      >
        <Icon className={`${res.color} h-3.5 w-3.5`} />
      </div>

      {/* Label + count */}
      {!compact && (
        <span className="truncate text-[10px] font-semibold leading-tight text-gray-700 max-w-[72px]">
          {label}
        </span>
      )}

      {/* Extra icon */}
      {ExtraIcon && <ExtraIcon className="h-3 w-3 text-gray-400 shrink-0" />}

      {/* Count badge */}
      <span className="inline-flex items-center rounded bg-gray-100 px-1 text-[9px] font-bold tabular-nums text-gray-600 shrink-0">
        {count}
      </span>
    </motion.button>
  );
};

// ---------------------------------------------------------------------------
// FloorSection - a single floor in the building
// ---------------------------------------------------------------------------

interface FloorSectionProps {
  title: string;
  subtitle?: string;
  bgClass?: string;
  borderClass?: string;
  children: React.ReactNode;
}

const FloorSection: React.FC<FloorSectionProps> = ({
  title,
  subtitle,
  bgClass = "bg-white/60",
  borderClass = "border-gray-200",
  children,
}) => (
  <div className={["rounded-lg border px-3 py-2", bgClass, borderClass].join(" ")}>
    <div className="flex items-center gap-2 mb-1.5">
      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{title}</span>
      {subtitle && <span className="text-[9px] text-gray-400 font-normal">{subtitle}</span>}
    </div>
    <div className="flex flex-wrap gap-1.5">{children}</div>
  </div>
);

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

const BuildingMetaphorView: React.FC<ViewProps> = ({
  data,
  selectedResource,
  onSelectResource,
  highlightedTypes,
}) => {
  const handleSelect = useCallback(
    (typeId: ResourceTypeId) => {
      onSelectResource({ typeId });
    },
    [onSelectResource]
  );

  const isHighlighted = (typeId: ResourceTypeId) => highlightedTypes.includes(typeId);
  const isSelected = (typeId: ResourceTypeId) => selectedResource?.typeId === typeId;

  // Provider feature flags
  const provider = data.provider;
  const showVpc = isFeatureSupported(provider, "vpcs");
  const showSubnets = isFeatureSupported(provider, "subnets");
  const showRt = isFeatureSupported(provider, "route_tables");
  const showNat = isFeatureSupported(provider, "nat_gateways");
  const showAcl = isFeatureSupported(provider, "network_acls");
  const showPeering = isFeatureSupported(provider, "vpc_peering");
  const showIgw = isFeatureSupported(provider, "internet_gateways");
  const showLb = isFeatureSupported(provider, "load_balancers");
  const showEip = isFeatureSupported(provider, "elastic_ips");
  const showEni = isFeatureSupported(provider, "network_interfaces");

  // Counts
  const vpcCount = getResourceCount(data, "vpcs");
  const subnetCount = getResourceCount(data, "subnets");
  const igwCount = getResourceCount(data, "internet_gateways");
  const instanceCount = getResourceCount(data, "instances");
  const sgCount = getResourceCount(data, "security_groups");
  const rtCount = getResourceCount(data, "route_tables");
  const natCount = getResourceCount(data, "nat_gateways");
  const lbCount = getResourceCount(data, "load_balancers");
  const aclCount = getResourceCount(data, "network_acls");
  const eipCount = getResourceCount(data, "elastic_ips");
  const eniCount = getResourceCount(data, "network_interfaces");
  const peerCount = getResourceCount(data, "vpc_peering");

  // Simplified view for providers without VPC support (e.g. Nobus)
  if (!showVpc) {
    return (
      <div className="w-full h-full overflow-auto bg-gradient-to-b from-emerald-50 to-slate-50 p-3 sm:p-4">
        <div className="max-w-2xl mx-auto space-y-3">
          <div className="text-center mb-4">
            <h3 className="text-sm font-bold text-emerald-700">Cloud Resources</h3>
            <p className="text-[10px] text-gray-500">Click any resource to learn more</p>
          </div>

          {/* Compute section */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.4 }}
          >
            <FloorSection
              title="Compute"
              subtitle="Your servers and workloads"
              bgClass="bg-purple-50/50"
              borderClass="border-purple-200"
            >
              {instanceCount > 0 && (
                <ResourceChip
                  typeId="instances"
                  icon={Server}
                  label="Instances"
                  count={instanceCount}
                  isHighlighted={isHighlighted("instances")}
                  isSelected={isSelected("instances")}
                  onClick={() => handleSelect("instances")}
                />
              )}
              {sgCount > 0 && (
                <ResourceChip
                  typeId="security_groups"
                  icon={Shield}
                  label="Security Groups"
                  count={sgCount}
                  isHighlighted={isHighlighted("security_groups")}
                  isSelected={isSelected("security_groups")}
                  onClick={() => handleSelect("security_groups")}
                />
              )}
              {instanceCount === 0 && sgCount === 0 && (
                <span className="text-[10px] text-gray-400 italic py-1">No resources deployed</span>
              )}
            </FloorSection>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full overflow-auto bg-gradient-to-b from-sky-100 via-sky-50 to-green-50 p-3 sm:p-4">
      {/* Sky with clouds */}
      <div className="relative max-w-2xl mx-auto">
        {/* Decorative clouds */}
        <div className="absolute -top-1 left-[10%] w-16 h-5 bg-white/60 rounded-full blur-sm" />
        <div className="absolute -top-0.5 left-[12%] w-10 h-4 bg-white/80 rounded-full blur-[2px]" />
        <div className="absolute top-0 right-[20%] w-12 h-4 bg-white/50 rounded-full blur-sm" />

        {/* ============================================================
				     NETWORK ACL - Outer perimeter fence
				     ============================================================ */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="relative"
        >
          <div
            className={[
              "relative rounded-2xl p-2 sm:p-3 transition-all duration-200",
              showAcl ? "border-2 border-dashed" : "",
              showAcl
                ? isSelected("network_acls")
                  ? "border-amber-500 bg-amber-50/30"
                  : isHighlighted("network_acls")
                    ? "border-amber-400 bg-amber-50/20 animate-pulse"
                    : "border-amber-300/60 bg-transparent"
                : "bg-transparent",
            ].join(" ")}
          >
            {/* ACL label */}
            {showAcl && (
              <button
                type="button"
                onClick={() => handleSelect("network_acls")}
                className="absolute -top-2.5 left-4 flex items-center gap-1 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5 text-[9px] font-bold text-amber-700 uppercase tracking-wider cursor-pointer hover:bg-amber-100 transition-colors z-10"
              >
                <ShieldCheck className="h-3 w-3" />
                Perimeter Fence (NACLs)
                <span className="bg-amber-200 text-amber-800 rounded px-1 text-[8px] font-bold ml-0.5">
                  {aclCount}
                </span>
              </button>
            )}

            {/* ============================================================
						     VPC - The Building
						     ============================================================ */}
            <div
              className={[
                "relative rounded-xl border-2 overflow-hidden transition-all duration-200",
                isSelected("vpcs")
                  ? "border-indigo-500 shadow-lg shadow-indigo-100"
                  : isHighlighted("vpcs")
                    ? "border-indigo-400 shadow-md shadow-indigo-50 animate-pulse"
                    : "border-indigo-300 shadow-sm",
              ].join(" ")}
            >
              {/* --- Roof (CSS triangle) --- */}
              <div className="relative">
                <div className="w-full h-8 bg-gradient-to-b from-slate-600 to-slate-500 relative overflow-hidden">
                  {/* Roof peak shape */}
                  <div
                    className="absolute inset-x-0 top-0 h-full"
                    style={{
                      clipPath: "polygon(0% 100%, 50% 0%, 100% 100%)",
                      background: "linear-gradient(180deg, #475569 0%, #64748b 100%)",
                    }}
                  />
                  {/* Roof ridge line */}
                  <div className="absolute top-0 inset-x-0 flex justify-center">
                    <div className="w-0 h-0 border-l-[50%] border-r-[50%] border-b-[32px] border-l-transparent border-r-transparent border-b-slate-500" />
                  </div>
                </div>

                {/* VPC Building title bar */}
                <button
                  type="button"
                  onClick={() => handleSelect("vpcs")}
                  className={[
                    "w-full flex items-center justify-center gap-2 py-1.5 px-3 cursor-pointer transition-colors",
                    "bg-gradient-to-r from-indigo-100 via-indigo-50 to-indigo-100",
                    "hover:from-indigo-200 hover:via-indigo-100 hover:to-indigo-200",
                  ].join(" ")}
                >
                  <Building2 className="h-4 w-4 text-indigo-500" />
                  <span className="text-xs font-bold text-indigo-700 tracking-wide">
                    VPC Building
                  </span>
                  <span className="bg-indigo-200 text-indigo-800 rounded px-1.5 py-0.5 text-[9px] font-bold">
                    {vpcCount}
                  </span>
                </button>
              </div>

              {/* --- Building Body --- */}
              <div className="bg-gradient-to-b from-stone-50 to-stone-100 px-2 sm:px-3 py-2 space-y-2">
                {/* ==========================================
								     UPPER FLOOR: Private Subnet Area
								     ========================================== */}
                <motion.div
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15, duration: 0.4 }}
                >
                  <FloorSection
                    title="Upper Floor"
                    subtitle="Private Subnet Zone"
                    bgClass="bg-cyan-50/50"
                    borderClass={
                      isSelected("subnets")
                        ? "border-cyan-500"
                        : isHighlighted("subnets")
                          ? "border-cyan-400"
                          : "border-cyan-200"
                    }
                  >
                    {/* Instances (rooms) */}
                    {instanceCount > 0 && (
                      <ResourceChip
                        typeId="instances"
                        icon={Server}
                        label="Rooms"
                        count={instanceCount}
                        isHighlighted={isHighlighted("instances")}
                        isSelected={isSelected("instances")}
                        onClick={() => handleSelect("instances")}
                      />
                    )}

                    {/* Security Groups (shields on doors) */}
                    {sgCount > 0 && (
                      <ResourceChip
                        typeId="security_groups"
                        icon={Shield}
                        label="Guards"
                        count={sgCount}
                        isHighlighted={isHighlighted("security_groups")}
                        isSelected={isSelected("security_groups")}
                        onClick={() => handleSelect("security_groups")}
                        extraIcon={Shield}
                      />
                    )}

                    {/* NAT Gateway (mail room) */}
                    {showNat && natCount > 0 && (
                      <ResourceChip
                        typeId="nat_gateways"
                        icon={Globe2}
                        label="Mail Room"
                        count={natCount}
                        isHighlighted={isHighlighted("nat_gateways")}
                        isSelected={isSelected("nat_gateways")}
                        onClick={() => handleSelect("nat_gateways")}
                        extraIcon={Mail}
                      />
                    )}

                    {/* Network Interfaces (ethernet jacks) */}
                    {showEni && eniCount > 0 && (
                      <ResourceChip
                        typeId="network_interfaces"
                        icon={Cable}
                        label="Jacks"
                        count={eniCount}
                        isHighlighted={isHighlighted("network_interfaces")}
                        isSelected={isSelected("network_interfaces")}
                        onClick={() => handleSelect("network_interfaces")}
                      />
                    )}

                    {instanceCount === 0 && sgCount === 0 && natCount === 0 && eniCount === 0 && (
                      <span className="text-[10px] text-gray-400 italic py-1">
                        No private resources deployed
                      </span>
                    )}
                  </FloorSection>
                </motion.div>

                {/* Floor divider */}
                <div className="flex items-center gap-2 px-1">
                  <div className="flex-1 border-t border-stone-300 border-dashed" />
                  <span className="text-[8px] text-stone-400 font-bold uppercase tracking-widest">
                    Floor Divider
                  </span>
                  <div className="flex-1 border-t border-stone-300 border-dashed" />
                </div>

                {/* ==========================================
								     GROUND FLOOR: Public Subnet Area
								     ========================================== */}
                <motion.div
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.25, duration: 0.4 }}
                >
                  <FloorSection
                    title="Ground Floor"
                    subtitle="Public Subnet Zone"
                    bgClass="bg-sky-50/50"
                    borderClass={
                      isSelected("subnets")
                        ? "border-sky-500"
                        : isHighlighted("subnets")
                          ? "border-sky-400"
                          : "border-sky-200"
                    }
                  >
                    {/* Load Balancer (reception desk) */}
                    {showLb && lbCount > 0 && (
                      <ResourceChip
                        typeId="load_balancers"
                        icon={Zap}
                        label="Reception"
                        count={lbCount}
                        isHighlighted={isHighlighted("load_balancers")}
                        isSelected={isSelected("load_balancers")}
                        onClick={() => handleSelect("load_balancers")}
                      />
                    )}

                    {/* Route Tables (directory sign) */}
                    {showRt && rtCount > 0 && (
                      <ResourceChip
                        typeId="route_tables"
                        icon={Route}
                        label="Directory"
                        count={rtCount}
                        isHighlighted={isHighlighted("route_tables")}
                        isSelected={isSelected("route_tables")}
                        onClick={() => handleSelect("route_tables")}
                      />
                    )}

                    {/* Elastic IPs (phone labels) */}
                    {showEip && eipCount > 0 && (
                      <ResourceChip
                        typeId="elastic_ips"
                        icon={Globe}
                        label="Phone #"
                        count={eipCount}
                        isHighlighted={isHighlighted("elastic_ips")}
                        isSelected={isSelected("elastic_ips")}
                        onClick={() => handleSelect("elastic_ips")}
                        extraIcon={Phone}
                      />
                    )}

                    {/* Subnets chip */}
                    {showSubnets && (
                      <ResourceChip
                        typeId="subnets"
                        icon={Network}
                        label="Floors"
                        count={subnetCount}
                        isHighlighted={isHighlighted("subnets")}
                        isSelected={isSelected("subnets")}
                        onClick={() => handleSelect("subnets")}
                      />
                    )}
                  </FloorSection>
                </motion.div>

                {/* Floor divider + Lobby / Entrance: Internet Gateway */}
                {showIgw && (
                  <>
                    <div className="flex items-center gap-2 px-1">
                      <div className="flex-1 border-t border-stone-300 border-dashed" />
                      <span className="text-[8px] text-stone-400 font-bold uppercase tracking-widest">
                        Lobby
                      </span>
                      <div className="flex-1 border-t border-stone-300 border-dashed" />
                    </div>

                    <motion.div
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.35, duration: 0.4 }}
                    >
                      <div
                        className={[
                          "rounded-lg border px-3 py-2 transition-all duration-200",
                          "bg-gradient-to-r from-sky-50/80 via-white to-sky-50/80",
                          isSelected("internet_gateways")
                            ? "border-sky-500 shadow-md"
                            : isHighlighted("internet_gateways")
                              ? "border-sky-400 animate-pulse"
                              : "border-sky-200",
                        ].join(" ")}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                              Entrance
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 mt-1.5">
                          {/* IGW - Main Door */}
                          <motion.button
                            type="button"
                            onClick={() => handleSelect("internet_gateways")}
                            whileHover={{ scale: 1.05, y: -1 }}
                            whileTap={{ scale: 0.97 }}
                            className={[
                              "flex items-center gap-2 rounded-lg bg-white px-3 py-2 cursor-pointer transition-shadow",
                              "hover:shadow-md focus:outline-none",
                              isSelected("internet_gateways")
                                ? "ring-2 ring-blue-500 shadow-md"
                                : isHighlighted("internet_gateways")
                                  ? "ring-2 ring-blue-400 animate-pulse"
                                  : "ring-1 ring-sky-200",
                            ].join(" ")}
                            title="Internet Gateway - Main entrance to the building"
                          >
                            <div className="relative">
                              <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-sky-100">
                                <DoorOpen className="h-4 w-4 text-sky-600" />
                              </div>
                              {igwCount > 0 && (
                                <motion.div
                                  animate={{ opacity: [1, 0.4, 1] }}
                                  transition={{ repeat: Infinity, duration: 2 }}
                                  className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-green-400 rounded-full border border-white"
                                />
                              )}
                            </div>
                            <div className="flex flex-col items-start">
                              <span className="text-[10px] font-semibold text-gray-700">
                                Main Door
                              </span>
                              <span className="text-[9px] text-gray-400">Internet Gateway</span>
                            </div>
                            <span className="bg-sky-100 text-sky-700 rounded px-1 text-[9px] font-bold ml-1">
                              {igwCount}
                            </span>
                          </motion.button>

                          {/* Load balancer reception desk hint */}
                          {showLb && lbCount > 0 && (
                            <div className="flex items-center gap-1 text-[9px] text-gray-400">
                              <ArrowRight className="h-3 w-3" />
                              <span>to Reception</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  </>
                )}
              </div>

              {/* --- Building Foundation --- */}
              <div className="h-2 bg-gradient-to-r from-stone-400 via-stone-300 to-stone-400" />
            </div>

            {/* ============================================================
						     VPC PEERING - Skybridge going off to the right
						     ============================================================ */}
            {showPeering && peerCount > 0 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5, duration: 0.4 }}
                className="absolute -right-1 top-1/2 -translate-y-1/2 flex items-center gap-0"
              >
                {/* Bridge connector */}
                <div className="flex items-center">
                  <div className="w-4 h-0.5 bg-pink-300" />
                  <div className="w-3 h-0.5 bg-pink-300 border-t border-dashed border-pink-400" />
                </div>
                <motion.button
                  type="button"
                  onClick={() => handleSelect("vpc_peering")}
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.95 }}
                  className={[
                    "flex items-center gap-1 rounded-lg bg-white border px-2 py-1.5 cursor-pointer transition-all",
                    "hover:shadow-md",
                    isSelected("vpc_peering")
                      ? "ring-2 ring-blue-500 shadow-md border-pink-400"
                      : isHighlighted("vpc_peering")
                        ? "ring-2 ring-blue-400 animate-pulse border-pink-300"
                        : "border-pink-200",
                  ].join(" ")}
                  title="VPC Peering - Skybridge to another building"
                >
                  <div className="flex items-center justify-center h-6 w-6 rounded bg-pink-50">
                    <GitMerge className="h-3.5 w-3.5 text-pink-500" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] font-semibold text-gray-700 leading-none">
                      Skybridge
                    </span>
                    <span className="text-[8px] text-gray-400 leading-none mt-0.5">VPC Peer</span>
                  </div>
                  <span className="bg-pink-100 text-pink-700 rounded px-1 text-[8px] font-bold">
                    {peerCount}
                  </span>
                </motion.button>
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* ============================================================
				     GROUND / GRASS
				     ============================================================ */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="relative mt-0 mx-1"
        >
          {/* Grass strip */}
          <div className="h-3 bg-gradient-to-b from-green-400/70 to-green-500/50 rounded-b-xl" />
          <div className="h-1.5 bg-gradient-to-b from-green-500/40 to-transparent" />

          {/* Ground-level label */}
          <div className="flex items-center justify-center gap-3 mt-1">
            <span className="text-[8px] text-green-600/60 font-medium uppercase tracking-widest">
              Public Internet
            </span>
            <div className="w-8 h-px bg-green-300/60" />
            <Globe className="h-3 w-3 text-green-400/60" />
            <div className="w-8 h-px bg-green-300/60" />
            <span className="text-[8px] text-green-600/60 font-medium uppercase tracking-widest">
              Cloud Provider
            </span>
          </div>
        </motion.div>

        {/* ============================================================
				     LEGEND (compact, at the bottom)
				     ============================================================ */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55, duration: 0.4 }}
          className="mt-3 flex flex-wrap items-center justify-center gap-x-3 gap-y-1"
        >
          {[
            showVpc && {
              icon: Building2,
              label: "VPC = Building",
              color: "text-indigo-400",
            },
            showSubnets && {
              icon: Network,
              label: "Subnet = Floor",
              color: "text-cyan-400",
            },
            {
              icon: Server,
              label: "Instance = Room",
              color: "text-purple-400",
            },
            showIgw && {
              icon: DoorOpen,
              label: "IGW = Door",
              color: "text-sky-400",
            },
            {
              icon: Shield,
              label: "SG = Guard",
              color: "text-red-400",
            },
            showAcl && {
              icon: ShieldCheck,
              label: "NACL = Fence",
              color: "text-amber-400",
            },
          ]
            .filter(Boolean)
            .map(({ icon: LIcon, label, color }) => (
              <span key={label} className="flex items-center gap-1 text-[8px] text-gray-400">
                <LIcon className={`h-2.5 w-2.5 ${color}`} />
                {label}
              </span>
            ))}
        </motion.div>
      </div>
    </div>
  );
};

export default BuildingMetaphorView;
