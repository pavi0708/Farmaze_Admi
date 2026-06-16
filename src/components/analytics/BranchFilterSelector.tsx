import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

/**
 * Branch filter dropdown for analytics pages.
 * Hidden if the client has 0 or 1 branch.
 * "All Branches" = selectedBranch is null.
 */
export default function BranchFilterSelector() {
  const { branches, selectedBranch, setSelectedBranch } = useAuth();

  // Hide for single-branch clients
  if (!branches || branches.length <= 1) {
    return null;
  }

  const handleChange = (value: string) => {
    if (value === "all") {
      setSelectedBranch(null);
    } else {
      const branch = branches.find((b) => b.id === value);
      if (branch) {
        setSelectedBranch(branch);
      }
    }
  };

  return (
    <Select
      value={selectedBranch?.id ?? "all"}
      onValueChange={handleChange}
    >
      <SelectTrigger className="w-[200px] h-9 text-sm">
        <MapPin className="h-4 w-4 mr-1 text-muted-foreground shrink-0" />
        <SelectValue placeholder="All Branches" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Branches</SelectItem>
        {branches.map((branch) => (
          <SelectItem key={branch.id} value={branch.id}>
            {branch.branch_name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
