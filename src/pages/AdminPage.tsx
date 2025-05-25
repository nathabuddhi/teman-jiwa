import { useState } from "react";
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
import { RefreshCw, Search } from "lucide-react";

export default function ExpertsTable({ experts, loading, onRefresh }) {
    const [searchTerm, setSearchTerm] = useState("");

    const filteredExperts = experts.filter(
        (expert) =>
            expert.full_name
                ?.toLowerCase()
                .includes(searchTerm.toLowerCase()) ||
            expert.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            expert.specialization
                ?.toLowerCase()
                .includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="relative w-full max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search experts..."
                        className="pl-8"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <Button
                    variant="outline"
                    size="icon"
                    onClick={onRefresh}
                    disabled={loading}>
                    <RefreshCw
                        className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
                    />
                    <span className="sr-only">Refresh</span>
                </Button>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Specialization</TableHead>
                            <TableHead>ID</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell
                                    colSpan={4}
                                    className="text-center py-8">
                                    Loading experts...
                                </TableCell>
                            </TableRow>
                        ) : filteredExperts.length === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={4}
                                    className="text-center py-8">
                                    {searchTerm
                                        ? "No experts match your search"
                                        : "No experts found"}
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredExperts.map((expert) => (
                                <TableRow key={expert.id}>
                                    <TableCell className="font-medium">
                                        {expert.full_name || "N/A"}
                                    </TableCell>
                                    <TableCell>
                                        {expert.email || "N/A"}
                                    </TableCell>
                                    <TableCell>
                                        {expert.specialization || "N/A"}
                                    </TableCell>
                                    <TableCell className="font-mono text-xs">
                                        {expert.id}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
            <div className="text-sm text-muted-foreground">
                Total: {filteredExperts.length} expert
                {filteredExperts.length !== 1 ? "s" : ""}
            </div>
        </div>
    );
}
