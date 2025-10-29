/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useMemo, useEffect, Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PlusCircle, Pencil, MapPin, Building, ArrowUpDown, Search, Loader2, ArrowUp, ArrowDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useProvinces } from "@/hooks/addresses/useProvinces";
import { useWards } from "@/hooks/addresses/useWards";
import { createProvinces, updateProvince, createWards, updateWard } from "@/api/addresses";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { Province, Ward } from "@/types";
import { useSearchParams, useRouter } from "next/navigation";

function AddressesManagementContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("tab") || "provinces";

  const [isProvinceDialogOpen, setIsProvinceDialogOpen] = useState(false);
  const [isWardDialogOpen, setIsWardDialogOpen] = useState(false);
  const [editingProvince, setEditingProvince] = useState<Province | null>(null);
  const [editingWard, setEditingWard] = useState<Ward | null>(null);
  
  const [provinceForm, setProvinceForm] = useState({
    code: "",
    name: "",
    administrativeLevel: "",
    isVisible: true,
  });
  
  const [wardForm, setWardForm] = useState({
    code: "",
    name: "",
    administrativeLevel: "",
    provinceCode: "",
    isVisible: true,
  });

  // Pagination states
  const [provincePage, setProvincePage] = useState(1);
  const [wardPage, setWardPage] = useState(1);
  const itemsPerPage = 10;

  // Search states
  const [provinceSearch, setProvinceSearch] = useState("");
  const [wardSearch, setWardSearch] = useState("");

  // Debounced search states
  const [debouncedProvinceSearch, setDebouncedProvinceSearch] = useState("");
  const [debouncedWardSearch, setDebouncedWardSearch] = useState("");

  // Debounce search inputs (300ms delay)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedProvinceSearch(provinceSearch);
    }, 300);
    return () => clearTimeout(timer);
  }, [provinceSearch]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedWardSearch(wardSearch);
    }, 300);
    return () => clearTimeout(timer);
  }, [wardSearch]);

  // Filter states
  const [wardProvinceFilter, setWardProvinceFilter] = useState<string>("");

  // Sort states
  const [provinceSort, setProvinceSort] = useState<{
    field: "code" | "name";
    direction: "asc" | "desc";
  }>({ field: "code", direction: "asc" });
  
  const [wardSort, setWardSort] = useState<{
    field: "code" | "name";
    direction: "asc" | "desc";
  }>({ field: "code", direction: "asc" });

  // Query client for invalidating queries
  const queryClient = useQueryClient();

  // Build sortBy parameter for API
  const provinceSortBy = useMemo(() => {
    return `${provinceSort.field}:${provinceSort.direction.toUpperCase()}`;
  }, [provinceSort]);

  const wardSortBy = useMemo(() => {
    return `${wardSort.field}:${wardSort.direction.toUpperCase()}`;
  }, [wardSort]);

  // Fetch provinces from API
  const {
    data: provincesData,
    isLoading: isLoadingProvinces,
    error: provincesError,
  } = useProvinces({
    page: provincePage,
    limit: itemsPerPage,
    search: debouncedProvinceSearch || undefined,
    sortBy: provinceSortBy,
  });

  // Fetch all provinces for ward filter dropdown (no pagination)
  const { data: allProvincesData } = useProvinces({
    page: 1,
    limit: 1000, // Get all provinces for filter
  });

  // Fetch wards from API
  const {
    data: wardsData,
    isLoading: isLoadingWards,
    error: wardsError,
  } = useWards({
    page: wardPage,
    limit: itemsPerPage,
    search: debouncedWardSearch || undefined,
    sortBy: wardSortBy,
    provinceCode: wardProvinceFilter || undefined,
  });

  // Mutations
  const createProvinceMutation = useMutation({
    mutationFn: createProvinces,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["provinces"] });
      toast.success("Province created successfully");
      setIsProvinceDialogOpen(false);
      setProvinceForm({
        code: "",
        name: "",
        administrativeLevel: "",
        isVisible: true,
      });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to create province");
    },
  });

  const updateProvinceMutation = useMutation({
    mutationFn: ({ code, payload }: { code: string; payload: any }) =>
      updateProvince(code, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["provinces"] });
      toast.success("Province updated successfully");
      setIsProvinceDialogOpen(false);
      setEditingProvince(null);
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to update province");
    },
  });

  // Ward mutations
  const createWardMutation = useMutation({
    mutationFn: createWards,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wards"] });
      toast.success("Ward created successfully");
      setIsWardDialogOpen(false);
      setWardForm({
        code: "",
        name: "",
        administrativeLevel: "",
        provinceCode: "",
        isVisible: true,
      });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to create ward");
    },
  });

  const updateWardMutation = useMutation({
    mutationFn: ({ code, payload }: { code: string; payload: any }) =>
      updateWard(code, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wards"] });
      toast.success("Ward updated successfully");
      setIsWardDialogOpen(false);
      setEditingWard(null);
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to update ward");
    },
  });

  // Provinces from API - use meta data from API response
  const provinces = provincesData?.data || [];
  const provinceTotalPages = provincesData?.meta?.totalPages || 1;
  const provinceCurrentPage = provincesData?.meta?.currentPage || provincePage;
  const provinceTotalItems = provincesData?.meta?.totalItems || 0;
  const provinceItemsPerPage = provincesData?.meta?.itemsPerPage || itemsPerPage;
  const provinceSortByApi = provincesData?.meta?.sortBy?.[0] || null; // e.g., ["name", "DESC"]

  // All provinces for filter dropdown
  const allProvinces = allProvincesData?.data || [];

  // Wards from API - use meta data from API response
  const wards = wardsData?.data || [];
  const wardTotalPages = wardsData?.meta?.totalPages || 1;
  const wardCurrentPage = wardsData?.meta?.currentPage || wardPage;
  const wardTotalItems = wardsData?.meta?.totalItems || 0;
  const wardSortByApi = wardsData?.meta?.sortBy?.[0] || null; // e.g., ["name", "DESC"]

  // Parse sortBy from API response
  const parseProvinceSort = useMemo(() => {
    if (!provinceSortByApi) return null;
    const [field, direction] = provinceSortByApi;
    return { field: field.toLowerCase(), direction: direction.toLowerCase() };
  }, [provinceSortByApi]);

  const parseWardSort = useMemo(() => {
    if (!wardSortByApi) return null;
    const [field, direction] = wardSortByApi;
    return { field: field.toLowerCase(), direction: direction.toLowerCase() };
  }, [wardSortByApi]);

  // Sort icon components
  const ProvinceSortIcon = ({ field }: { field: "code" | "name" }) => {
    if (!parseProvinceSort || parseProvinceSort.field !== field) {
      return <ArrowUpDown className="h-4 w-4 opacity-50" />;
    }
    return parseProvinceSort.direction === "asc" ? (
      <ArrowUp className="h-4 w-4" />
    ) : (
      <ArrowDown className="h-4 w-4" />
    );
  };

  const WardSortIcon = ({ field }: { field: "code" | "name" }) => {
    if (!parseWardSort || parseWardSort.field !== field) {
      return <ArrowUpDown className="h-4 w-4 opacity-50" />;
    }
    return parseWardSort.direction === "asc" ? (
      <ArrowUp className="h-4 w-4" />
    ) : (
      <ArrowDown className="h-4 w-4" />
    );
  };

  // Handlers
  const handleOpenProvinceDialog = (province?: Province) => {
    if (province) {
      setEditingProvince(province);
      setProvinceForm({
        code: province.code,
        name: province.name,
        administrativeLevel: province.administrativeLevel,
        isVisible: province.isVisible,
      });
    } else {
      setEditingProvince(null);
      setProvinceForm({
        code: "",
        name: "",
        administrativeLevel: "",
        isVisible: true,
      });
    }
    setIsProvinceDialogOpen(true);
  };

  const handleOpenWardDialog = (ward?: Ward) => {
    if (ward) {
      setEditingWard(ward);
      setWardForm({
        code: ward.code,
        name: ward.name,
        administrativeLevel: ward.administrativeLevel,
        provinceCode: ward.provinceCode,
        isVisible: ward.isVisible,
      });
    } else {
      setEditingWard(null);
      setWardForm({
        code: "",
        name: "",
        administrativeLevel: "",
        provinceCode: "",
        isVisible: true,
      });
    }
    setIsWardDialogOpen(true);
  };

  const handleSaveProvince = () => {
    if (editingProvince) {
      // Update existing province
      updateProvinceMutation.mutate({
        code: editingProvince.code,
        payload: {
          name: provinceForm.name,
          administrativeLevel: provinceForm.administrativeLevel,
          isVisible: provinceForm.isVisible,
        },
      });
    } else {
      // Create new province
      createProvinceMutation.mutate({
        values: [
          {
            code: provinceForm.code,
            name: provinceForm.name,
            administrativeLevel: provinceForm.administrativeLevel,
            isVisible: provinceForm.isVisible,
          },
        ],
      });
    }
  };

  const handleSaveWard = () => {
    if (editingWard) {
      // Update existing ward
      updateWardMutation.mutate({
        code: editingWard.code,
        payload: {
          name: wardForm.name,
          administrativeLevel: wardForm.administrativeLevel,
          provinceCode: wardForm.provinceCode,
          isVisible: wardForm.isVisible,
        },
      });
    } else {
      // Create new ward
      createWardMutation.mutate({
        values: [
          {
            code: wardForm.code,
            name: wardForm.name,
            administrativeLevel: wardForm.administrativeLevel,
            provinceCode: wardForm.provinceCode,
            isVisible: wardForm.isVisible,
          },
        ],
      });
    }
  };

  const toggleProvinceSort = (field: "code" | "name") => {
    setProvinceSort((prev) => ({
      field,
      direction: prev.field === field && prev.direction === "asc" ? "desc" : "asc",
    }));
    setProvincePage(1); // Reset to first page when sorting changes
  };

  const toggleWardSort = (field: "code" | "name") => {
    setWardSort((prev) => ({
      field,
      direction: prev.field === field && prev.direction === "asc" ? "desc" : "asc",
    }));
    setWardPage(1); // Reset to first page when sorting changes
  };

  return (
    <>
      {/* Province Dialog */}
      <Dialog open={isProvinceDialogOpen} onOpenChange={setIsProvinceDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingProvince ? "Edit Province" : "Add New Province"}
            </DialogTitle>
            <DialogDescription>
              {editingProvince
                ? "Update the province information below."
                : "Add a new province or municipality to the system."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="provinceCode">Province Code</Label>
              <Input
                id="provinceCode"
                value={provinceForm.code}
                onChange={(e) =>
                  setProvinceForm({ ...provinceForm, code: e.target.value })
                }
                placeholder="e.g., HN"
                maxLength={16}
                disabled={!!editingProvince}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="provinceName">Province Name</Label>
              <Input
                id="provinceName"
                value={provinceForm.name}
                onChange={(e) =>
                  setProvinceForm({ ...provinceForm, name: e.target.value })
                }
                placeholder="e.g., Hanoi"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="provinceLevel">Administrative Level</Label>
              <Input
                id="provinceLevel"
                value={provinceForm.administrativeLevel}
                onChange={(e) =>
                  setProvinceForm({
                    ...provinceForm,
                    administrativeLevel: e.target.value,
                  })
                }
                placeholder="e.g., Municipality, Province"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="provinceVisible"
                checked={provinceForm.isVisible}
                onCheckedChange={(checked) =>
                  setProvinceForm({ ...provinceForm, isVisible: checked })
                }
              />
              <Label htmlFor="provinceVisible">Is Visible</Label>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsProvinceDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSaveProvince}
              disabled={createProvinceMutation.isPending || updateProvinceMutation.isPending}
            >
              {(createProvinceMutation.isPending || updateProvinceMutation.isPending) ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {editingProvince ? "Updating..." : "Creating..."}
                </>
              ) : (
                <>
                  {editingProvince ? "Update" : "Add"} Province
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Ward Dialog */}
      <Dialog open={isWardDialogOpen} onOpenChange={setIsWardDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingWard ? "Edit Ward/District" : "Add New Ward/District"}
            </DialogTitle>
            <DialogDescription>
              {editingWard
                ? "Update the ward/district information below."
                : "Add a new ward or district to a province."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="wardCode">Ward Code</Label>
              <Input
                id="wardCode"
                value={wardForm.code}
                onChange={(e) =>
                  setWardForm({ ...wardForm, code: e.target.value })
                }
                placeholder="e.g., HN001"
                maxLength={16}
                disabled={!!editingWard}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="wardName">Ward Name</Label>
              <Input
                id="wardName"
                value={wardForm.name}
                onChange={(e) =>
                  setWardForm({ ...wardForm, name: e.target.value })
                }
                placeholder="e.g., Ba Dinh"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="wardLevel">Administrative Level</Label>
              <Input
                id="wardLevel"
                value={wardForm.administrativeLevel}
                onChange={(e) =>
                  setWardForm({
                    ...wardForm,
                    administrativeLevel: e.target.value,
                  })
                }
                placeholder="e.g., District, Ward"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="wardProvinceCode">Province</Label>
              <Select
                value={wardForm.provinceCode}
                onValueChange={(value) =>
                  setWardForm({ ...wardForm, provinceCode: value })
                }
              >
                <SelectTrigger id="wardProvinceCode">
                  <SelectValue placeholder="Select a province" />
                </SelectTrigger>
                <SelectContent>
                  {allProvinces.map((province) => (
                    <SelectItem key={province.code} value={province.code}>
                      {province.name} ({province.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="wardVisible"
                checked={wardForm.isVisible}
                onCheckedChange={(checked) =>
                  setWardForm({ ...wardForm, isVisible: checked })
                }
              />
              <Label htmlFor="wardVisible">Is Visible</Label>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsWardDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSaveWard}
              disabled={createWardMutation.isPending || updateWardMutation.isPending}
            >
              {(createWardMutation.isPending || updateWardMutation.isPending) ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {editingWard ? "Updating..." : "Creating..."}
                </>
              ) : (
                <>
                  {editingWard ? "Update" : "Add"} Ward
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Addresses Management</h1>
          <p className="text-muted-foreground">
            Manage provinces and wards (districts) for location addressing
          </p>
        </div>

        <Tabs 
          value={activeTab} 
          onValueChange={(value) => {
            router.push(`/admin/addresses?tab=${value}`);
          }}
          className="w-full"
        >
          <TabsList className="w-full justify-start h-auto p-1">
            <TabsTrigger value="provinces" className="flex-1 sm:flex-none">
              <Building className="mr-2 h-4 w-4" />
              Provinces
            </TabsTrigger>
            <TabsTrigger value="wards" className="flex-1 sm:flex-none">
              <MapPin className="mr-2 h-4 w-4" />
              Wards/Districts
            </TabsTrigger>
          </TabsList>

          <TabsContent value="provinces" className="mt-6">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="relative flex-1 w-full sm:max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search provinces by name..."
                      value={provinceSearch}
                      onChange={(e) => {
                        setProvinceSearch(e.target.value);
                        setProvincePage(1);
                      }}
                      className="pl-8"
                    />
                  </div>
                  <Button onClick={() => handleOpenProvinceDialog()} className="w-full sm:w-auto">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Province
                  </Button>
                </div>
              </CardHeader>

              <CardContent>
                {isLoadingProvinces ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : provincesError ? (
                  <div className="flex items-center justify-center py-8">
                    <p className="text-destructive">
                      Failed to load provinces. Please try again.
                    </p>
                  </div>
                ) : (
                  <>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>
                            <Button
                              variant="ghost"
                              onClick={() => toggleProvinceSort("code")}
                              className="flex items-center gap-1"
                            >
                              Code
                              <ProvinceSortIcon field="code" />
                            </Button>
                          </TableHead>
                          <TableHead>
                            <Button
                              variant="ghost"
                              onClick={() => toggleProvinceSort("name")}
                              className="flex items-center gap-1"
                            >
                              Name
                              <ProvinceSortIcon field="name" />
                            </Button>
                          </TableHead>
                          <TableHead>Administrative Level</TableHead>
                          <TableHead>Is Visible</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {provinces.length > 0 ? (
                          provinces.map((province) => (
                            <TableRow key={province.code}>
                              <TableCell className="font-mono">
                                {province.code}
                              </TableCell>
                              <TableCell className="font-medium">
                                {province.name}
                              </TableCell>
                              <TableCell>{province.administrativeLevel}</TableCell>
                              <TableCell>
                                {province.isVisible ? (
                                  <Badge variant="default">Visible</Badge>
                                ) : (
                                  <Badge variant="secondary">Hidden</Badge>
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleOpenProvinceDialog(province)}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center py-8">
                              <p className="text-muted-foreground">
                                {provinceSearch
                                  ? "No provinces found matching your search."
                                  : "No provinces found. Add your first province to get started."}
                              </p>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>

                    {provinceTotalPages > 1 && (
                      <div className="flex items-center justify-between border-t pt-4 mt-4">
                        <div className="text-sm text-muted-foreground">
                          Showing {provinces.length} of {provinceTotalItems} provinces
                          {" • "}
                          Page {provinceCurrentPage} of {provinceTotalPages}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setProvincePage((p) => Math.max(1, p - 1))}
                            disabled={provinceCurrentPage === 1}
                          >
                            Previous
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setProvincePage((p) => Math.min(provinceTotalPages, p + 1))
                            }
                            disabled={provinceCurrentPage === provinceTotalPages}
                          >
                            Next
                          </Button>
                        </div>
                      </div>
                    )}
                    
                    {provinceTotalPages === 1 && provinceTotalItems > 0 && (
                      <div className="flex items-center justify-center border-t pt-4 mt-4">
                        <div className="text-sm text-muted-foreground">
                          Showing all {provinceTotalItems} provinces
                        </div>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="wards" className="mt-6">
            <Card>
              <CardHeader>
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="relative flex-1 w-full sm:max-w-sm">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search wards by name..."
                        value={wardSearch}
                        onChange={(e) => {
                          setWardSearch(e.target.value);
                          setWardPage(1);
                        }}
                        className="pl-8"
                      />
                    </div>
                    <Button onClick={() => handleOpenWardDialog()} className="w-full sm:w-auto">
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Add Ward
                    </Button>
                  </div>
                  <div className="flex gap-4 items-center">
                    <Label htmlFor="wardProvinceFilter" className="whitespace-nowrap">
                      Filter by Province:
                    </Label>
                    <Select
                      value={wardProvinceFilter || "all"}
                      onValueChange={(value) => {
                        setWardProvinceFilter(value === "all" ? "" : value);
                        setWardPage(1);
                      }}
                    >
                      <SelectTrigger id="wardProvinceFilter" className="w-full sm:w-[200px]">
                        <SelectValue placeholder="All provinces" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All provinces</SelectItem>
                        {allProvinces.map((province) => (
                          <SelectItem key={province.code} value={province.code}>
                            {province.name} ({province.code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                {isLoadingWards ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : wardsError ? (
                  <div className="flex items-center justify-center py-8">
                    <p className="text-destructive">
                      Failed to load wards. Please try again.
                    </p>
                  </div>
                ) : (
                  <>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>
                            <Button
                              variant="ghost"
                              onClick={() => toggleWardSort("code")}
                              className="flex items-center gap-1"
                            >
                              Code
                              <WardSortIcon field="code" />
                            </Button>
                          </TableHead>
                          <TableHead>
                            <Button
                              variant="ghost"
                              onClick={() => toggleWardSort("name")}
                              className="flex items-center gap-1"
                            >
                              Name
                              <WardSortIcon field="name" />
                            </Button>
                          </TableHead>
                          <TableHead>Administrative Level</TableHead>
                          <TableHead>Province Code</TableHead>
                          <TableHead>Is Visible</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {wards.length > 0 ? (
                          wards.map((ward) => (
                            <TableRow key={ward.code}>
                              <TableCell className="font-mono">{ward.code}</TableCell>
                              <TableCell className="font-medium">
                                {ward.name}
                              </TableCell>
                              <TableCell>{ward.administrativeLevel}</TableCell>
                              <TableCell className="font-mono">
                                {ward.provinceCode}
                              </TableCell>
                              <TableCell>
                                {ward.isVisible ? (
                                  <Badge variant="default">Visible</Badge>
                                ) : (
                                  <Badge variant="secondary">Hidden</Badge>
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleOpenWardDialog(ward)}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-8">
                              <p className="text-muted-foreground">
                                {wardSearch || wardProvinceFilter
                                  ? "No wards found matching your filters."
                                  : "No wards found. Add your first ward to get started."}
                              </p>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>

                    {wardTotalPages > 1 && (
                      <div className="flex items-center justify-between border-t pt-4 mt-4">
                        <div className="text-sm text-muted-foreground">
                          Showing {wards.length} of {wardTotalItems} wards
                          {" • "}
                          Page {wardCurrentPage} of {wardTotalPages}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setWardPage((p) => Math.max(1, p - 1))}
                            disabled={wardCurrentPage === 1}
                          >
                            Previous
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setWardPage((p) => Math.min(wardTotalPages, p + 1))
                            }
                            disabled={wardCurrentPage === wardTotalPages}
                          >
                            Next
                          </Button>
                        </div>
                      </div>
                    )}
                    
                    {wardTotalPages === 1 && wardTotalItems > 0 && (
                      <div className="flex items-center justify-center border-t pt-4 mt-4">
                        <div className="text-sm text-muted-foreground">
                          Showing all {wardTotalItems} wards
                        </div>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}

export default function AddressesManagementPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    }>
      <AddressesManagementContent />
    </Suspense>
  );
}

