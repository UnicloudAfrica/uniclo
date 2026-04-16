/**
 * EngineIcon — Renders a database engine icon.
 *
 * When the API provides an `icon_url` (from StaqDB), uses the actual logo.
 * Otherwise falls back to a color-coded Lucide Database icon.
 */
import React, { useState } from "react";
import { Database } from "lucide-react";
import type { DatabaseEngine } from "@/types/managedDatabase";

interface EngineIconProps {
  engine: DatabaseEngine | string;
  iconUrl?: string | null;
  size?: number;
  className?: string;
  showLabel?: boolean;
}

const ENGINE_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
  // Relational
  postgresql: { label: "PostgreSQL", color: "text-blue-600", bgColor: "bg-blue-100" },
  mysql: { label: "MySQL", color: "text-orange-600", bgColor: "bg-orange-100" },
  mariadb: { label: "MariaDB", color: "text-sky-600", bgColor: "bg-sky-100" },
  cockroachdb: { label: "CockroachDB", color: "text-indigo-600", bgColor: "bg-indigo-100" },
  tidb: { label: "TiDB", color: "text-rose-600", bgColor: "bg-rose-100" },
  yugabytedb: { label: "YugabyteDB", color: "text-violet-600", bgColor: "bg-violet-100" },
  // Time-series
  timescaledb: { label: "TimescaleDB", color: "text-amber-600", bgColor: "bg-amber-100" },
  influxdb: { label: "InfluxDB", color: "text-purple-600", bgColor: "bg-purple-100" },
  questdb: { label: "QuestDB", color: "text-fuchsia-600", bgColor: "bg-fuchsia-100" },
  victoriametrics: { label: "VictoriaMetrics", color: "text-red-600", bgColor: "bg-red-100" },
  prometheus: { label: "Prometheus", color: "text-orange-600", bgColor: "bg-orange-100" },
  // Document
  mongodb: { label: "MongoDB", color: "text-green-600", bgColor: "bg-green-100" },
  couchdb: { label: "CouchDB", color: "text-red-600", bgColor: "bg-red-100" },
  couchbase: { label: "Couchbase", color: "text-rose-600", bgColor: "bg-rose-100" },
  arangodb: { label: "ArangoDB", color: "text-emerald-600", bgColor: "bg-emerald-100" },
  surrealdb: { label: "SurrealDB", color: "text-fuchsia-600", bgColor: "bg-fuchsia-100" },
  ferretdb: { label: "FerretDB", color: "text-lime-600", bgColor: "bg-lime-100" },
  rethinkdb: { label: "RethinkDB", color: "text-teal-600", bgColor: "bg-teal-100" },
  // Key-Value / Cache
  redis: { label: "Redis", color: "text-red-600", bgColor: "bg-red-100" },
  valkey: { label: "Valkey", color: "text-red-500", bgColor: "bg-red-100" },
  dragonflydb: { label: "DragonflyDB", color: "text-cyan-600", bgColor: "bg-cyan-100" },
  keydb: { label: "KeyDB", color: "text-pink-600", bgColor: "bg-pink-100" },
  memcached: { label: "Memcached", color: "text-gray-600", bgColor: "bg-gray-100" },
  // Wide-column
  cassandra: { label: "Cassandra", color: "text-sky-600", bgColor: "bg-sky-100" },
  scylladb: { label: "ScyllaDB", color: "text-blue-600", bgColor: "bg-blue-100" },
  // Search
  elasticsearch: { label: "Elasticsearch", color: "text-yellow-600", bgColor: "bg-yellow-100" },
  opensearch: { label: "OpenSearch", color: "text-blue-600", bgColor: "bg-blue-100" },
  meilisearch: { label: "Meilisearch", color: "text-violet-600", bgColor: "bg-violet-100" },
  // Vector
  milvus: { label: "Milvus", color: "text-blue-600", bgColor: "bg-blue-100" },
  qdrant: { label: "Qdrant", color: "text-amber-600", bgColor: "bg-amber-100" },
  weaviate: { label: "Weaviate", color: "text-green-600", bgColor: "bg-green-100" },
  chromadb: { label: "ChromaDB", color: "text-orange-600", bgColor: "bg-orange-100" },
  // Graph
  neo4j: { label: "Neo4j", color: "text-blue-600", bgColor: "bg-blue-100" },
  dgraph: { label: "Dgraph", color: "text-rose-600", bgColor: "bg-rose-100" },
  // Messaging
  kafka: { label: "Kafka", color: "text-gray-800", bgColor: "bg-gray-200" },
  rabbitmq: { label: "RabbitMQ", color: "text-orange-600", bgColor: "bg-orange-100" },
  nats: { label: "NATS", color: "text-green-600", bgColor: "bg-green-100" },
  // Analytics / Infrastructure
  clickhouse: { label: "ClickHouse", color: "text-yellow-600", bgColor: "bg-yellow-100" },
  etcd: { label: "etcd", color: "text-sky-600", bgColor: "bg-sky-100" },
  consul: { label: "Consul", color: "text-pink-600", bgColor: "bg-pink-100" },
  minio: { label: "MinIO", color: "text-red-600", bgColor: "bg-red-100" },
  foundationdb: { label: "FoundationDB", color: "text-blue-600", bgColor: "bg-blue-100" },
  // Commercial
  mssql_express: { label: "SQL Server Express", color: "text-red-600", bgColor: "bg-red-100" },
  mssql_developer: { label: "SQL Server Developer", color: "text-red-600", bgColor: "bg-red-100" },
  mssql_standard: { label: "SQL Server Standard", color: "text-red-700", bgColor: "bg-red-100" },
  mssql_enterprise: { label: "SQL Server Enterprise", color: "text-red-800", bgColor: "bg-red-100" },
  oracle_xe: { label: "Oracle XE", color: "text-red-600", bgColor: "bg-red-100" },
  oracle_enterprise: { label: "Oracle Enterprise", color: "text-red-700", bgColor: "bg-red-100" },
  db2_community: { label: "Db2 Community", color: "text-blue-600", bgColor: "bg-blue-100" },
};

const EngineIcon: React.FC<EngineIconProps> = ({
  engine,
  iconUrl,
  size = 20,
  className = "",
  showLabel = false,
}) => {
  const [imgFailed, setImgFailed] = useState(false);
  const config = ENGINE_CONFIG[engine] ?? {
    label: engine,
    color: "text-gray-600",
    bgColor: "bg-gray-100",
  };

  const useLogo = iconUrl && !imgFailed;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className={`inline-flex items-center justify-center rounded-lg p-1.5 ${useLogo ? "bg-white dark:bg-gray-800" : config.bgColor}`}>
        {useLogo ? (
          <img
            src={iconUrl}
            alt={config.label}
            width={size}
            height={size}
            className="object-contain"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <Database size={size} className={config.color} />
        )}
      </div>
      {showLabel && (
        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{config.label}</span>
      )}
    </div>
  );
};

export const getEngineLabel = (engine: string): string => ENGINE_CONFIG[engine]?.label ?? engine;

export const getEngineColor = (engine: string): string =>
  ENGINE_CONFIG[engine]?.color ?? "text-gray-600";

export default EngineIcon;
