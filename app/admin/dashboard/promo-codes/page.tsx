"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Edit2, Ticket, Save, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { format } from "date-fns";
import type { PromoCodeDB } from "@/lib/promo-service";

export default function PromoCodesPage() {
  const [promos, setPromos] = useState<PromoCodeDB[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    code: "",
    discount_percentage: "15",
    is_active: false,
    max_uses: "",
    start_date: "",
    end_date: "",
  });

  const fetchPromos = async () => {
    try {
      const res = await fetch("/api/admin/promo-codes");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setPromos(data);
    } catch (error) {
      toast.error("Failed to load promo codes.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPromos();
  }, []);

  const handleSave = async () => {
    if (!formData.code.trim()) return toast.error("Promo code is required");
    
    // Server requires values between 0 and 100 for percentage
    const percentageVal = Number(formData.discount_percentage);
    if (percentageVal <= 0 || percentageVal >= 100) return toast.error("Discount must be between 1 and 99 percentage");

    setIsLoading(true);
    try {
      const url = editingId ? `/api/admin/promo-codes/${editingId}` : "/api/admin/promo-codes";
      const method = editingId ? "PATCH" : "POST";
      
      const payload = {
        code: formData.code.trim().toUpperCase(),
        discount_percentage: percentageVal,
        is_active: formData.is_active,
        max_uses: formData.max_uses ? parseInt(formData.max_uses) : null,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to save promo code");
      
      toast.success(editingId ? "Promo code updated" : "Promo code created");
      setIsFormOpen(false);
      setEditingId(null);
      setFormData({ code: "", discount_percentage: "15", is_active: false, max_uses: "", start_date: "", end_date: "" });
      fetchPromos();
    } catch (e) {
      toast.error("An error occurred. Check if the code is already used.");
      setIsLoading(false);
    }
  };

  const handleEdit = (p: PromoCodeDB) => {
    setFormData({
      code: p.code,
      discount_percentage: String(p.discount_percentage),
      is_active: p.is_active,
      max_uses: p.max_uses !== null ? String(p.max_uses) : "",
      start_date: p.start_date ? p.start_date.split("T")[0] : "",
      end_date: p.end_date ? p.end_date.split("T")[0] : "",
    });
    setEditingId(p.id);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this promo code?")) return;
    try {
      const res = await fetch(`/api/admin/promo-codes/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      toast.success("Promo code deleted");
      fetchPromos();
    } catch (e) {
      toast.error("Failed to delete promo code");
    }
  };

  const handleToggleActive = async (id: string, currentlyActive: boolean) => {
    try {
      const res = await fetch(`/api/admin/promo-codes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !currentlyActive }),
      });
      if (!res.ok) throw new Error("Failed to toggle");
      toast.success("Promo code status updated");
      fetchPromos();
    } catch (e) {
      toast.error("Failed to update status");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Promo Codes</h1>
          <p className="text-muted-foreground mt-2">
            Create completely custom discount codes (e.g. SPRING20) that users can apply at checkout.
          </p>
        </div>
        {!isFormOpen && (
          <Button onClick={() => setIsFormOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Add Promo Code
          </Button>
        )}
      </div>

      {isFormOpen && (
        <div className="p-6 bg-muted/30 border rounded-lg space-y-4 max-w-2xl">
          <h2 className="text-xl font-bold">{editingId ? "Edit Promo Code" : "New Promo Code"}</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold mb-1 block">Code (Letters/Numbers only)</label>
                <Input 
                  placeholder="e.g. SUMMER26" 
                  value={formData.code} 
                  onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })} 
                />
              </div>
              <div>
                <label className="text-sm font-semibold mb-1 block">Discount Percentage (%)</label>
                <Input 
                  type="number" 
                  min="1" 
                  max="99" 
                  placeholder="15" 
                  value={formData.discount_percentage} 
                  onChange={e => setFormData({ ...formData, discount_percentage: e.target.value })} 
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold mb-1 block">Max Allowed Uses (Leave empty for unlimited)</label>
              <Input 
                type="number" 
                min="1"
                placeholder="Unlimited" 
                value={formData.max_uses} 
                onChange={e => setFormData({ ...formData, max_uses: e.target.value })} 
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
                <Save className="w-4 h-4 mr-2" /> Save Code
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
              <th className="px-6 py-4">Promo Code</th>
              <th className="px-6 py-4">Discount</th>
              <th className="px-6 py-4">Usage</th>
              <th className="px-6 py-4">Valid Dates</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {promos.length === 0 && !isLoading && (
              <tr><td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">No promo codes found.</td></tr>
            )}
            {promos.map(p => (
              <tr key={p.id} className="hover:bg-muted/5 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <Switch 
                       checked={p.is_active}
                       onCheckedChange={() => handleToggleActive(p.id, p.is_active)}
                    />
                    {p.is_active ? (
                      <span className="text-success font-semibold px-2 py-1 bg-success/10 rounded-md text-xs">ACTIVE</span>
                    ) : (
                      <span className="text-muted-foreground font-semibold px-2 py-1 bg-muted rounded-md text-xs">OFF</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 font-bold text-base flex items-center gap-2 tracking-wide">
                  <Ticket className="w-4 h-4 text-primary" />
                  {p.code}
                </td>
                <td className="px-6 py-4 font-bold text-lg text-primary">
                  %{p.discount_percentage}
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="font-semibold">{p.current_uses} used</span>
                    <span className="text-xs text-muted-foreground">
                      / {p.max_uses !== null ? `${p.max_uses} limit` : "Unlimited"}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 text-muted-foreground">
                  {p.start_date || p.end_date ? (
                    <div className="text-xs">
                      <div>{p.start_date ? format(new Date(p.start_date), "dd MMM yyyy") : "Any"} -</div>
                      <div>{p.end_date ? format(new Date(p.end_date), "dd MMM yyyy") : "Any"}</div>
                    </div>
                  ) : "Always Valid"}
                </td>
                <td className="px-6 py-4 text-right space-x-2">
                  <Button variant="ghost" size="sm" onClick={() => handleEdit(p)}>
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(p.id)} className="text-red-500 hover:text-red-600 hover:bg-red-50">
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
