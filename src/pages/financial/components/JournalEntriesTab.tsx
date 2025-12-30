/**
 * Journal Entries Tab Component
 * Displays and manages journal entries
 */

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, FileText } from "lucide-react";
import { getStatusColor } from '../utils/financialFormatters';
import { formatCurrencySymbol } from '../utils/financialFormatters';

interface JournalEntriesTabProps {
  journalEntries: any[];
  loading: boolean;
  searchTerm: string;
  statusFilter: string;
  dateRange: { start: string; end: string };
  pageSize: number;
  onNewEntry: () => void;
  onEditEntry: (entry: any) => void;
  onDeleteEntry: (entry: any) => void;
  deleteLoading: boolean;
}

export const JournalEntriesTab = ({
  journalEntries,
  loading,
  searchTerm,
  statusFilter,
  dateRange,
  pageSize,
  onNewEntry,
  onEditEntry,
  onDeleteEntry,
  deleteLoading,
}: JournalEntriesTabProps) => {
  const [currentPage, setCurrentPage] = useState(1);

  const filteredEntries = useMemo(() => {
    return journalEntries.filter(entry => {
      const matchesSearch = (entry.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (entry.entry_number || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || entry.status === statusFilter;
      const matchesDateRange = (!dateRange.start || new Date(entry.entry_date) >= new Date(dateRange.start)) &&
        (!dateRange.end || new Date(entry.entry_date) <= new Date(dateRange.end));
      return matchesSearch && matchesStatus && matchesDateRange;
    });
  }, [journalEntries, searchTerm, statusFilter, dateRange]);

  const paginatedEntries = useMemo(() => {
    return filteredEntries.slice(
      (currentPage - 1) * pageSize,
      currentPage * pageSize
    );
  }, [filteredEntries, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredEntries.length / pageSize);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Journal Entries</h3>
        <Button variant="outline" onClick={onNewEntry}>
          <Plus className="h-4 w-4 mr-2" />
          New Entry
        </Button>
      </div>
      
      {loading ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="mt-2 text-muted-foreground">Loading journal entries...</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredEntries.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">No journal entries found</p>
                <p>Create your first journal entry to record financial transactions.</p>
              </CardContent>
            </Card>
          ) : (
            paginatedEntries.map((entry) => (
              <Card key={entry.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{entry.entry_number}</CardTitle>
                      <p className="text-sm text-muted-foreground">{entry.description}</p>
                    </div>
                    <Badge className={getStatusColor(entry.status)}>
                      {entry.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Entry Date</p>
                      <p className="font-medium">{new Date(entry.entry_date).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Reference</p>
                      <p className="font-medium">{entry.reference || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Debit</p>
                      <p className="font-semibold">{formatCurrencySymbol(entry.total_debit || 0)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Credit</p>
                      <p className="font-semibold">{formatCurrencySymbol(entry.total_credit || 0)}</p>
                    </div>
                  </div>
                  <div className="mt-4 flex justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={() => onEditEntry(entry)}>
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => onDeleteEntry(entry)}
                      disabled={deleteLoading}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
      {totalPages > 1 && (
        <div className="flex items-center justify-between p-4 border-t">
          <div className="text-sm text-muted-foreground">
            Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, filteredEntries.length)} of {filteredEntries.length} entries
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <div className="text-sm">Page {currentPage} of {totalPages}</div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

