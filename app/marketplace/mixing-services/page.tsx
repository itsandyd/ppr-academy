"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Filter,
  Grid3x3,
  List as ListIcon,
  Headphones,
  Clock,
  Star,
  Zap,
} from "lucide-react";
import { motion } from "framer-motion";
import Image from "next/image";

const SERVICE_TYPE_OPTIONS = [
  { value: "all", label: "All Services" },
  { value: "mixing", label: "Mixing" },
  { value: "mastering", label: "Mastering" },
  { value: "mix-and-master", label: "Mix & Master" },
  { value: "stem-mixing", label: "Stem Mixing" },
];

const SERVICE_TYPE_ICONS: Record<string, string> = {
  mixing: "🎚️",
  mastering: "🎛️",
  "mix-and-master": "🔊",
  "stem-mixing": "🎹",
};

export default function MixingServicesMarketplacePage() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedServiceType, setSelectedServiceType] = useState<string | undefined>();

  const services =
    useQuery(api.mixingServices.getPublishedMixingServices, {
      serviceType: selectedServiceType && selectedServiceType !== "all" ? (selectedServiceType as any) : undefined,
      searchQuery: searchTerm || undefined,
    }) || [];

  const handleServiceClick = (service: any) => {
    window.location.href = `/marketplace/mixing-services/${service.slug || service._id}`;
  };

  const activeFiltersCount = [
    selectedServiceType && selectedServiceType !== "all",
    searchTerm,
  ].filter(Boolean).length;

  const formatPrice = (price?: number) => {
    if (!price || price === 0) return "Free";
    return `$${price.toFixed(0)}`;
  };

  const getServiceTypeLabel = (serviceType?: string) => {
    const type = SERVICE_TYPE_OPTIONS.find((t) => t.value === serviceType);
    return type?.label || serviceType || "Mixing";
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <section className="border-b border-border bg-gradient-to-br from-purple-500/10 via-violet-500/10 to-indigo-500/10 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="mb-8 space-y-4 text-center">
            <motion.div
              className="mb-4 inline-flex items-center gap-2 rounded-full bg-purple-500/20 px-4 py-2"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <Headphones className="h-5 w-5 text-purple-600" />
              <span className="text-sm font-semibold text-purple-600">Professional Services</span>
            </motion.div>

            <motion.h1
              className="bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 bg-clip-text text-5xl font-bold text-transparent md:text-6xl"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              Mixing Services
            </motion.h1>

            <motion.p
              className="mx-auto max-w-2xl text-xl text-muted-foreground"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              Get your tracks professionally mixed and mastered by expert engineers
            </motion.p>
          </div>

          {/* Search */}
          <div className="relative mx-auto max-w-2xl">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search services, genres, engineers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-14 border-2 border-border bg-background/80 pl-12 pr-4 text-base backdrop-blur-sm transition-all focus:border-purple-500"
            />
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
          {/* Filters Sidebar */}
          <aside className="lg:col-span-1">
            <Card className="sticky top-4 border-border bg-card">
              <CardContent className="space-y-6 p-6">
                <div className="flex items-center justify-between">
                  <h3 className="flex items-center gap-2 font-semibold">
                    <Filter className="h-5 w-5" />
                    Filters
                  </h3>
                  {activeFiltersCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSearchTerm("");
                        setSelectedServiceType(undefined);
                      }}
                      className="text-xs"
                    >
                      Clear ({activeFiltersCount})
                    </Button>
                  )}
                </div>

                {/* Service Type Filter */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Service Type</Label>
                  <Select
                    value={selectedServiceType || "all"}
                    onValueChange={(v) => setSelectedServiceType(v === "all" ? undefined : v)}
                  >
                    <SelectTrigger className="bg-white dark:bg-black">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-black">
                      {SERVICE_TYPE_OPTIONS.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          <span className="flex items-center gap-2">
                            {type.value !== "all" && (
                              <span>{SERVICE_TYPE_ICONS[type.value] || "🎵"}</span>
                            )}
                            {type.label}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Info Card */}
                <Card className="border-purple-500/20 bg-purple-500/5">
                  <CardContent className="p-4">
                    <h4 className="mb-2 flex items-center gap-2 font-semibold text-purple-600">
                      <Star className="h-4 w-4" />
                      How It Works
                    </h4>
                    <ol className="space-y-2 text-xs text-muted-foreground">
                      <li className="flex items-start gap-2">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-purple-500/20 text-[10px] font-bold text-purple-600">1</span>
                        Choose a service and tier
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-purple-500/20 text-[10px] font-bold text-purple-600">2</span>
                        Complete payment
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-purple-500/20 text-[10px] font-bold text-purple-600">3</span>
                        Upload your stems
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-purple-500/20 text-[10px] font-bold text-purple-600">4</span>
                        Receive your mixed track
                      </li>
                    </ol>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
          </aside>

          {/* Main Content */}
          <div className="space-y-6 lg:col-span-3">
            {/* Toolbar */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Available Services</h2>
                <p className="text-sm text-muted-foreground">
                  {services.length} service{services.length !== 1 ? "s" : ""} found
                </p>
              </div>

              {/* View Toggle */}
              <div className="flex rounded-lg border border-border">
                <Button
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                  className="rounded-r-none"
                >
                  <Grid3x3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                  className="rounded-l-none"
                >
                  <ListIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Services Grid */}
            {viewMode === "grid" ? (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {services.map((service: any, index: number) => (
                  <ServiceCard
                    key={service._id}
                    service={service}
                    index={index}
                    onViewDetails={() => handleServiceClick(service)}
                    formatPrice={formatPrice}
                    getServiceTypeLabel={getServiceTypeLabel}
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {services.map((service: any, index: number) => (
                  <ServiceListItem
                    key={service._id}
                    service={service}
                    index={index}
                    onViewDetails={() => handleServiceClick(service)}
                    formatPrice={formatPrice}
                    getServiceTypeLabel={getServiceTypeLabel}
                  />
                ))}
              </div>
            )}

            {services.length === 0 && (
              <Card className="p-12 text-center">
                <Headphones className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
                <h3 className="mb-2 text-xl font-semibold">No services found</h3>
                <p className="text-muted-foreground">Try adjusting your filters or search terms</p>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Service Card Component
function ServiceCard({
  service,
  index,
  onViewDetails,
  formatPrice,
  getServiceTypeLabel,
}: {
  service: any;
  index: number;
  onViewDetails: () => void;
  formatPrice: (price?: number) => string;
  getServiceTypeLabel: (serviceType?: string) => string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
    >
      <Card
        className="group cursor-pointer overflow-hidden border-border bg-card transition-all duration-300 hover:shadow-xl"
        onClick={onViewDetails}
      >
        {/* Cover Image */}
        <div className="relative h-48 bg-gradient-to-br from-purple-500/20 to-indigo-500/20">
          {service.imageUrl && (
            <Image
              src={service.imageUrl}
              alt={service.title}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

          {/* Service Type Badge */}
          <div className="absolute left-3 top-3 flex gap-2">
            <Badge className="bg-purple-500 text-white">
              {SERVICE_TYPE_ICONS[service.serviceType] || "🎚️"} {getServiceTypeLabel(service.serviceType)}
            </Badge>
          </div>

          {/* Starting Price Badge */}
          <div className="absolute right-3 top-3">
            <Badge variant="default" className="bg-black/70 text-white">
              From {formatPrice(service.minPrice)}
            </Badge>
          </div>

          {/* Rush Available Badge */}
          {service.mixingServiceConfig?.rushAvailable && (
            <div className="absolute bottom-3 left-3">
              <Badge variant="secondary" className="gap-1 bg-amber-500/90 text-white">
                <Zap className="h-3 w-3" />
                Rush Available
              </Badge>
            </div>
          )}
        </div>

        <CardContent className="space-y-4 p-5">
          {/* Title */}
          <div>
            <h3 className="line-clamp-1 text-lg font-bold transition-colors group-hover:text-purple-600">
              {service.title}
            </h3>
            <p className="line-clamp-2 text-sm text-muted-foreground">{service.description}</p>
          </div>

          {/* Turnaround Time */}
          {service.mixingServiceConfig?.turnaroundDays && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>{service.mixingServiceConfig.turnaroundDays} day turnaround</span>
            </div>
          )}

          {/* Tags */}
          {service.tags && service.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {service.tags.slice(0, 3).map((tag: string) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {/* Creator */}
          <div className="flex items-center justify-between border-t border-border pt-3">
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={service.creatorAvatar} />
                <AvatarFallback className="bg-gradient-to-r from-purple-500 to-indigo-500 text-xs text-white">
                  {service.creatorName?.charAt(0) || "?"}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm text-muted-foreground">{service.creatorName}</span>
            </div>
            <Button size="sm" variant="ghost" className="gap-1">
              <Headphones className="h-4 w-4" />
              View
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Service List Item
function ServiceListItem({
  service,
  index,
  onViewDetails,
  formatPrice,
  getServiceTypeLabel,
}: {
  service: any;
  index: number;
  onViewDetails: () => void;
  formatPrice: (price?: number) => string;
  getServiceTypeLabel: (serviceType?: string) => string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2, delay: index * 0.03 }}
    >
      <Card
        className="cursor-pointer border-border transition-colors hover:bg-muted/30"
        onClick={onViewDetails}
      >
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="text-3xl">{SERVICE_TYPE_ICONS[service.serviceType] || "🎚️"}</div>
            <div className="min-w-0 flex-1">
              <div className="truncate font-semibold">{service.title}</div>
              <div className="text-sm text-muted-foreground">
                {getServiceTypeLabel(service.serviceType)} • {service.creatorName}
              </div>
            </div>
            {service.mixingServiceConfig?.rushAvailable && (
              <Badge variant="secondary" className="gap-1 bg-amber-500/20 text-amber-600">
                <Zap className="h-3 w-3" />
                Rush
              </Badge>
            )}
            <div className="text-right">
              <div className="text-xl font-bold text-purple-600">From {formatPrice(service.minPrice)}</div>
              {service.mixingServiceConfig?.turnaroundDays && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {service.mixingServiceConfig.turnaroundDays} days
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Label component
function Label({ children, className = "", ...props }: any) {
  return (
    <label className={`text-sm font-medium ${className}`} {...props}>
      {children}
    </label>
  );
}
