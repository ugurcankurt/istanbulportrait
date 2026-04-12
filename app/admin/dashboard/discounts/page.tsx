"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Edit2, CheckCircle2, TicketPercent, Save, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { format } from "date-fns";
import type { DiscountDB } from "@/lib/discount-service";

export default function DiscountsPage() {
  const [discounts, setDiscounts] = useState<DiscountDB[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    discount_percentage: "20", // Store as whole number for UI
    is_active: false,
    start_date: "",
    end_date: "",
  });

  const fetchDiscounts = async () => {
    try {
      const res = await fetch("/api/admin/discounts");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setDiscounts(data);
    } catch (error) {
      toast.error("Failed to load discounts.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDiscounts();
  }, []);

  const handleSave = async () => {
    if (!formData.name.trim()) return toast.error("Campaign name is required");
    
    const percentageVal = Number(formData.discount_percentage) / 100;
    if (percentageVal <= 0 || percentageVal >= 1) return toast.error("Discount must be between 1 and 99 percentage");

    setIsLoading(true);
    try {
      const url = editingId ? `/api/admin/discounts/${editingId}` : "/api/admin/discounts";
      const method = editingId ? "PATCH" : "POST";
      
      const payload = {
        name: formData.name,
        discount_percentage: percentageVal,
        is_active: formData.is_active,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to save discount");
      
      toast.success(editingId ? "Campaign updated successfully" : "Campaign created successfully");
      setIsFormOpen(false);
      setEditingId(null);
      setFormData({ name: "", discount_percentage: "20", is_active: false, start_date: "", end_date: "" });
      fetchDiscounts();
    } catch (e) {
      toast.error("An error occurred");
      setIsLoading(false);
    }
  };

  const handleEdit = (d: DiscountDB) => {
    setFormData({
      name: d.name,
      discount_percentage: String(Math.round(d.discount_percentage * 100)),
      is_active: d.is_active,
      start_date: d.start_date ? d.start_date.split("T")[0] : "",
      end_date: d.end_date ? d.end_date.split("T")[0] : "",
    });
    setEditingId(d.id);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this campaign?")) return;
    try {
      const res = await fetch(`/api/admin/discounts/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      toast.success("Campaign deleted");
      fetchDiscounts();
    } catch (e) {
      toast.error("Failed to delete campaign");
    }
  };

  const handleToggleActive = async (id: string, currentlyActive: boolean) => {
    try {
      const res = await fetch(`/api/admin/discounts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !currentlyActive }),
      });
      if (!res.ok) throw new Error("Failed to toggle");
      toast.success("Campaign status updated");
      fetchDiscounts();
    } catch (e) {
      toast.error("Failed to update status");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Seasonal Campaigns</h1>
          <p className="text-muted-foreground mt-2">
            Manage your site-wide seasonal discounts (e.g. Winter Sale %20). Only ONE campaign can be active at a time.
          </p>
        </div>
        {!isFormOpen && (
          <Button onClick={() => setIsFormOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Add Campaign
          </Button>
        )}
      </div>

      {isFormOpen && (
        <div className="p-6 bg-muted/30 border rounded-lg space-y-4 max-w-2xl">
          <h2 className="text-xl font-bold">{editingId ? "Edit Campaign" : "New Campaign"}</h2>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-semibold mb-1 block">Campaign Name</label>
              <Input 
                placeholder="e.g. Winter Sale, Valentine's Special" 
                value={formData.name} 
                onChange={e => setFormData({ ...formData, name: e.target.value })} 
              />
            </div>
            <div>
              <label className="text-sm font-semibold mb-1 block">Discount Percentage (%)</label>
              <Input 
                type="number" 
                min="1" 
                max="99" 
                placeholder="20" 
                value={formData.discount_percentage} 
                onChange={e => setFormData({ ...formData, discount_percentage: e.target.value })} 
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold mb-1 block">Start Date (Optional)</label>
                <Input 
                  type="date" 
                  value={formData.start_date} 
                  onChange={e => setFormData({ ...formData, start_date: e.target.value })} 
                />
              </div>
              <div>
                <label className="text-sm font-semibold mb-1 block">End Date (Optional)</label>
                <Input 
                  type="date" 
                  value={formData.end_date} 
                  onChange={e => setFormData({ ...formData, end_date: e.target.value })} 
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Switch 
                checked={formData.is_active} 
                onCheckedChange={(c) => setFormData({ ...formData, is_active: c })} 
              />
              <label className="text-sm font-semibold">Activate immediately</label>
            </div>
            <div className="flex gap-3 pt-2">
              <Button onClick={handleSave} disabled={isLoading}>
                <Save className="w-4 h-4 mr-2" /> Save Campaign
              </Button>
              <Button variant="outline" onClick={() => { setIsFormOpen(false); setEditingId(null); }}>
                <X className="w-4 h-4 mr-2" /> Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* List */}
      <div className="border rounded-lg bg-card overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-muted text-muted-foreground uppercase font-semibold">
            <tr>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Campaign Name</th>
              <th className="px-6 py-4">Discount</th>
              <th className="px-6 py-4">Valid Dates</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {discounts.length === 0 && !isLoading && (
              <tr><td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">No campaigns found.</td></tr>
            )}
            {discounts.map(d => (
              <tr key={d.id} className="hover:bg-muted/5 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <Switch 
                       checked={d.is_active}
                       onCheckedChange={() => handleToggleActive(d.id, d.is_active)}
                    />
                    {d.is_active ? (
                      <span className="text-success font-semibold px-2 py-1 bg-success/10 rounded-md text-xs">ACTIVE</span>
                    ) : (
                      <span className="text-muted-foreground font-semibold px-2 py-1 bg-muted rounded-md text-xs">OFF</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 font-bold text-base flex items-center gap-2">
                  <TicketPercent className="w-4 h-4 text-primary" />
                  {d.name}
                </td>
                <td className="px-6 py-4 font-bold text-lg text-primary">
                  %{Math.round(d.discount_percentage * 100)}
                </td>
                <td className="px-6 py-4 text-muted-foreground">
                  {d.start_date || d.end_date ? (
                    <div className="text-xs">
                      <div>{d.start_date ? format(new Date(d.start_date), "dd MMM yyyy") : "Any"} -</div>
                      <div>{d.end_date ? format(new Date(d.end_date), "dd MMM yyyy") : "Any"}</div>
                    </div>
                  ) : "Always Valid"}
                </td>
                <td className="px-6 py-4 text-right space-x-2">
                  <Button variant="ghost" size="sm" onClick={() => handleEdit(d)}>
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(d.id)} className="text-red-500 hover:text-red-600 hover:bg-red-50">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
