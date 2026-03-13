"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { usePrintsCartStore } from "@/stores/prints-cart-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2, Trash2, MapPin, CreditCard, ShieldCheck, Minus, Plus, UploadCloud } from "lucide-react";
import { Country, State } from "country-state-city";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { trackPrintBeginCheckout } from "@/lib/analytics";

interface PrintCheckoutFormProps {
    sku?: string;
    initialProduct?: any;
}

export function PrintCheckoutForm({ sku, initialProduct }: PrintCheckoutFormProps) {
    const locale = useLocale();
    const t = useTranslations("prints");
    const router = useRouter();
    const { items, getTotalPrice, updatePrintQuantity, removePrintFromCart, clearPrintsCart, addPrintToCart } = usePrintsCartStore();

    // Auto-add product if SKU is provided and it's not in cart
    useEffect(() => {
        if (sku && initialProduct && items.length === 0) {
            addPrintToCart({
                productId: initialProduct.sku,
                sku: initialProduct.sku,
                name: initialProduct.description,
                price: initialProduct.pricing?.eur || 0,
                currency: "EUR",
                quantity: 1,
                uploadUrl: "", // Draft state: requires upload in checkout
                attributes: {}, // default
            });
            toast.info(t("upload_photo"));
        }
    }, [sku, initialProduct, addPrintToCart, items.length, t]);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isUploading, setIsUploading] = useState<string | null>(null); // Track which item is uploading by ID
    const [shippingOptions, setShippingOptions] = useState<any[]>([]);
    const [selectedMethodIndex, setSelectedMethodIndex] = useState<number | null>(null);
    const [isCalculatingShipping, setIsCalculatingShipping] = useState(false);

    const [shippingDetails, setShippingDetails] = useState({
        firstName: "",
        lastName: "",
        email: "",
        addressLine1: "",
        addressLine2: "",
        city: "",
        stateOrCounty: "",
        postalOrZipCode: "",
        countryCode: "US", // default
        phone: "",
    });

    const [paymentDetails, setPaymentDetails] = useState({
        cardHolderName: "",
        cardNumber: "",
        expireMonth: "",
        expireYear: "",
        cvc: "",
    });

    const [acceptedTerms, setAcceptedTerms] = useState(false);

    // Tracking: GA4 Begin Checkout
    useEffect(() => {
        if (items.length > 0) {
            trackPrintBeginCheckout(
                items.map(item => ({
                    sku: item.sku,
                    name: item.name,
                    category: "Print", // Simple category for group
                    price: item.price,
                    quantity: item.quantity
                })),
                getTotalPrice()
            );
        }
    }, [items, getTotalPrice]);

    const countries = Country.getAllCountries();
    const states = State.getStatesOfCountry(shippingDetails.countryCode);
    const requiresState = ["US", "CA", "AU"].includes(shippingDetails.countryCode);

    // Dynamic Shipping Quote Calculation
    useEffect(() => {
        const fetchQuote = async () => {
            if (items.length === 0 || !shippingDetails.countryCode) {
                setShippingOptions([]);
                setSelectedMethodIndex(null);
                return;
            }

            setIsCalculatingShipping(true);
            try {
                const response = await fetch("/api/prints/quote", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        items,
                        destinationCountryCode: shippingDetails.countryCode,
                        city: shippingDetails.city,
                        postalCode: shippingDetails.postalOrZipCode,
                        stateOrCounty: shippingDetails.stateOrCounty
                    }),
                });

                const data = await response.json();
                if (response.ok && data.shippingOptions?.length > 0) {
                    setShippingOptions(data.shippingOptions);
                    // Default to Budget or first option if Budget not found
                    const budgetIndex = data.shippingOptions.findIndex((o: any) => o.method === "Budget");
                    setSelectedMethodIndex(budgetIndex !== -1 ? budgetIndex : 0);
                } else {
                    setShippingOptions([]);
                    setSelectedMethodIndex(null);
                }
            } catch (error) {
                console.error("Failed to fetch shipping/tax quote:", error);
                setShippingOptions([]);
                setSelectedMethodIndex(null);
            } finally {
                setIsCalculatingShipping(false);
            }
        };

        // Debounce quote fetches slightly if typing, but here it's mostly driven by Country Select change
        fetchQuote();
    }, [shippingDetails.countryCode, shippingDetails.city, shippingDetails.postalOrZipCode, shippingDetails.stateOrCounty, items]);

    const handleCheckout = async (e: React.FormEvent) => {
        e.preventDefault();

        if (items.length === 0) {
            toast.error(t("empty_cart"));
            return;
        }

        if (selectedMethodIndex === null) {
            toast.error(t("select_shipping_toast"));
            return;
        }

        if (!acceptedTerms) {
            toast.error(t("accept_terms_toast"));
            return;
        }

        if (!paymentDetails.cardHolderName || !paymentDetails.cardNumber || !paymentDetails.expireMonth || !paymentDetails.expireYear || !paymentDetails.cvc) {
            toast.error(t("fill_payment_toast"));
            return;
        }

        if (items.some(item => !item.uploadUrl)) {
            toast.error(t("upload_photo"));
            return;
        }

        setIsSubmitting(true);

        const selectedOption = shippingOptions[selectedMethodIndex!];
        const cartTotal = getTotalPrice();

        // Calculate tax based on retail prices (including markup)
        // using the effective rate from Prodigi
        const retailShipping = selectedOption.shippingCost + selectedOption.shippingTax;
        const retailTax = (cartTotal + selectedOption.shippingCost) * selectedOption.effectiveTaxRate;

        const finalTotal = cartTotal + selectedOption.shippingCost + retailTax;

        try {
            // STEP 1: Initialize Iyzico Payment
            const paymentResponse = await fetch("/api/prints/payment/initialize", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    paymentData: paymentDetails,
                    shippingDetails,
                    amount: finalTotal,
                    shippingCost: selectedOption.shippingCost,
                    taxCost: retailTax,
                    items,
                    locale
                }),
            });

            const paymentResult = await paymentResponse.json();

            if (!paymentResponse.ok || paymentResult.status !== "success") {
                throw new Error(paymentResult.errorMessage || paymentResult.error?.message || "Payment initialization failed.");
            }

            // STEP 2: Create structural order using Prodigi and Store in DB
            const response = await fetch("/api/prints/create-order", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    items,
                    shipping: shippingDetails,
                    shippingMethod: selectedOption.method,
                    paymentId: paymentResult.paymentId,
                    conversationId: paymentResult.conversationId,
                    totalAmount: finalTotal,
                    shippingCost: selectedOption.shippingCost,
                    taxCost: retailTax,
                    locale
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || "Payment succeeded but failed to create print order.");
            }

            toast.success(t("order_success_toast"));
            clearPrintsCart();
            router.push(`/${locale}/prints/checkout/success?orderId=${result.order?.id || result.order?.order?.id || 'success'}`);

        } catch (error: any) {
            console.error("Checkout Error:", error);
            toast.error(error.message || "Something went wrong.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (items.length === 0) {
        return (
            <Card className="text-center p-12">
                <CardContent>
                    <h2 className="text-2xl font-bold mb-4">{t("empty_cart")}</h2>
                    <Button onClick={() => router.push(`/${locale}/prints`)}>{t("browse_prints")}</Button>
                </CardContent>
            </Card>
        );
    }

    const cartTotal = getTotalPrice();
    const selectedOption = selectedMethodIndex !== null ? shippingOptions[selectedMethodIndex] : null;

    // Calculate display totals
    const retailTax = selectedOption ? (cartTotal + selectedOption.shippingCost) * selectedOption.effectiveTaxRate : 0;
    const finalTotal = cartTotal + (selectedOption?.shippingCost || 0) + retailTax;

    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 lg:py-12 max-w-6xl">
            <div className="animate-fade-in-up">
                <Card className="border-0 shadow-xl">
                    <CardHeader className="text-center p-6 sm:p-8 bg-gradient-to-r from-primary/5 via-background to-primary/5">
                        <div className="flex items-center justify-center mb-4">
                            <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center text-2xl text-primary-foreground">
                                🔒
                            </div>
                        </div>
                        <CardTitle className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                            {t("checkout_title") || "Secure Checkout"}
                        </CardTitle>
                        <p className="text-base sm:text-lg text-muted-foreground mt-2 max-w-2xl mx-auto">
                            {t("payment_description") || "Your high quality prints are just a few steps away. Securely complete your order below."}
                        </p>
                        <div className="flex items-center justify-center gap-4 mt-4 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                                <span className="w-2 h-2 bg-success rounded-full"></span>
                                {t("ssl_encrypted")}
                            </div>
                            <div className="flex items-center gap-1">
                                <span className="w-2 h-2 bg-success rounded-full"></span>
                                {t("secure_payment")}
                            </div>
                            <div className="flex items-center gap-1">
                                <span className="w-2 h-2 bg-success rounded-full"></span>
                                {t("pci_compliant")}
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="p-3 sm:p-6">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <div className="lg:col-span-2 space-y-6">
                                <Card className="border-2 border-primary/5">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2 text-lg">
                                            <MapPin className="w-5 h-5 text-primary" />
                                            {t("shipping_details")}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <form id="print-checkout-form" onSubmit={handleCheckout} className="space-y-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <label className="text-sm font-medium">{t("first_name")}</label>
                                                    <Input required value={shippingDetails.firstName} onChange={e => setShippingDetails({ ...shippingDetails, firstName: e.target.value })} />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-sm font-medium">{t("last_name")}</label>
                                                    <Input required value={shippingDetails.lastName} onChange={e => setShippingDetails({ ...shippingDetails, lastName: e.target.value })} />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium">{t("email_address")}</label>
                                                <Input type="email" required value={shippingDetails.email} onChange={e => setShippingDetails({ ...shippingDetails, email: e.target.value })} />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium">{t("phone_number")}</label>
                                                <PhoneInput
                                                    value={shippingDetails.phone}
                                                    onChange={val => setShippingDetails({ ...shippingDetails, phone: val as string })}
                                                    defaultCountry="US"
                                                    placeholder={t("phone_number")}
                                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium">{t("billing_address")}</label>
                                                <Input required value={shippingDetails.addressLine1} onChange={e => setShippingDetails({ ...shippingDetails, addressLine1: e.target.value })} />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium">{t("address_line_2")}</label>
                                                <Input value={shippingDetails.addressLine2} onChange={e => setShippingDetails({ ...shippingDetails, addressLine2: e.target.value })} />
                                            </div>

                                            {/* Dynamic Location Selection */}
                                            <div className={`grid grid-cols-1 ${requiresState && states.length > 0 ? "sm:grid-cols-2" : ""} gap-4`}>
                                                <div className="space-y-2">
                                                    <label className="text-sm font-medium">{t("country")}</label>
                                                    <select
                                                        required
                                                        className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                                        value={shippingDetails.countryCode}
                                                        onChange={e => setShippingDetails({
                                                            ...shippingDetails,
                                                            countryCode: e.target.value,
                                                            stateOrCounty: "", // Reset state when country changes
                                                            city: "" // Reset city when country changes
                                                        })}
                                                    >
                                                        <option value="" disabled>{t("select_country")}</option>
                                                        {countries.map(country => (
                                                            <option key={country.isoCode} value={country.isoCode}>{country.name}</option>
                                                        ))}
                                                    </select>
                                                </div>

                                                {requiresState && states.length > 0 && (
                                                    <div className="space-y-2">
                                                        <label className="text-sm font-medium">{t("state_province")}</label>
                                                        <select
                                                            required
                                                            className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                                            value={shippingDetails.stateOrCounty}
                                                            onChange={e => setShippingDetails({
                                                                ...shippingDetails,
                                                                stateOrCounty: e.target.value
                                                            })}
                                                        >
                                                            <option value="" disabled>{t("select_state")}</option>
                                                            {states.map(s => (
                                                                <option key={s.isoCode} value={s.isoCode}>{s.name}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                )}

                                                <div className="space-y-2">
                                                    <label className="text-sm font-medium">{t("city")}</label>
                                                    <Input
                                                        required
                                                        placeholder={t("enter_city")}
                                                        value={shippingDetails.city}
                                                        onChange={e => setShippingDetails({ ...shippingDetails, city: e.target.value })}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-sm font-medium">{t("postal_code")}</label>
                                                    <Input required value={shippingDetails.postalOrZipCode} onChange={e => setShippingDetails({ ...shippingDetails, postalOrZipCode: e.target.value })} />
                                                </div>
                                            </div>
                                        </form>
                                    </CardContent>
                                </Card>

                                {/* Iyzico Payment Form */}
                                <Card className="border-2 border-primary/5">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2 text-lg">
                                            <CreditCard className="w-5 h-5 text-primary" />
                                            {t("payment_details")}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-2 mb-4 text-sm text-success font-medium">
                                                <ShieldCheck className="w-4 h-4" />
                                                {t("secure_ssl_payment")}
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-sm font-medium">{t("card_holder")}</label>
                                                <Input
                                                    required
                                                    className="uppercase"
                                                    placeholder="Card Holder Name"
                                                    value={paymentDetails.cardHolderName}
                                                    onChange={e => setPaymentDetails({ ...paymentDetails, cardHolderName: e.target.value })}
                                                    form="print-checkout-form"
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-sm font-medium">{t("card_number")}</label>
                                                <Input
                                                    required
                                                    type="tel"
                                                    maxLength={19}
                                                    placeholder="0000 0000 0000 0000"
                                                    className="font-mono tracking-wider"
                                                    value={paymentDetails.cardNumber ? paymentDetails.cardNumber.replace(/(\d{4})(?=\d)/g, "$1 ") : ""}
                                                    onChange={e => {
                                                        const value = e.target.value.replace(/\D/g, "");
                                                        setPaymentDetails({ ...paymentDetails, cardNumber: value.slice(0, 16) });
                                                    }}
                                                    form="print-checkout-form"
                                                />
                                            </div>

                                            <div className="grid grid-cols-3 gap-4">
                                                <div className="space-y-2">
                                                    <label className="text-sm font-medium">{t("month")}</label>
                                                    <Select
                                                        required
                                                        value={paymentDetails.expireMonth}
                                                        onValueChange={v => setPaymentDetails({ ...paymentDetails, expireMonth: v })}
                                                    >
                                                        <SelectTrigger className="w-full h-10">
                                                            <SelectValue placeholder="MM" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0')).map(m => (
                                                                <SelectItem key={m} value={m}>{m}</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    {/* Workaround for native form validation blocking select */}
                                                    <input type="hidden" form="print-checkout-form" required value={paymentDetails.expireMonth} />
                                                </div>

                                                <div className="space-y-2">
                                                    <label className="text-sm font-medium">{t("year")}</label>
                                                    <Select
                                                        required
                                                        value={paymentDetails.expireYear}
                                                        onValueChange={v => setPaymentDetails({ ...paymentDetails, expireYear: v })}
                                                    >
                                                        <SelectTrigger className="w-full h-10">
                                                            <SelectValue placeholder="YY" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {Array.from({ length: 11 }, (_, i) => String(new Date().getFullYear() + i).slice(-2)).map(y => (
                                                                <SelectItem key={y} value={y}>{y}</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    <input type="hidden" form="print-checkout-form" required value={paymentDetails.expireYear} />
                                                </div>

                                                <div className="space-y-2">
                                                    <label className="text-sm font-medium">{t("cvc")}</label>
                                                    <Input
                                                        required
                                                        type="tel"
                                                        maxLength={4}
                                                        placeholder="123"
                                                        className="font-mono"
                                                        value={paymentDetails.cvc}
                                                        onChange={e => {
                                                            const value = e.target.value.replace(/\D/g, "");
                                                            setPaymentDetails({ ...paymentDetails, cvc: value });
                                                        }}
                                                        form="print-checkout-form"
                                                    />
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2 mt-6 pt-4 border-t">
                                                <input
                                                    type="checkbox"
                                                    id="terms-checkbox"
                                                    required
                                                    className="w-4 h-4 rounded border-gray-300"
                                                    checked={acceptedTerms}
                                                    onChange={e => setAcceptedTerms(e.target.checked)}
                                                    form="print-checkout-form"
                                                />
                                                <label htmlFor="terms-checkbox" className="text-sm text-muted-foreground">
                                                    {t("terms_agreement")}
                                                </label>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            <div className="lg:col-span-1">
                                <Card className="sticky top-24 border-2 border-primary/5">
                                    <CardHeader>
                                        <CardTitle className="text-lg">{t("order_summary")}</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="max-h-[300px] overflow-y-auto space-y-4 pr-2">
                                            {items.map((item) => (
                                                <div key={item.id} className="flex gap-4 items-start pb-4 border-b">
                                                    <div className="w-16 h-16 relative bg-muted rounded overflow-hidden flex-shrink-0">
                                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                                        <img src={item.uploadUrl} alt={item.name} className="object-cover w-full h-full" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <h4 className="font-medium text-sm line-clamp-2">{item.name}</h4>
                                                        {!item.uploadUrl ? (
                                                            <div className="mt-2">
                                                                <Label className="text-[10px] text-destructive font-bold uppercase mb-1 block">
                                                                    {t("upload_photo")}
                                                                </Label>
                                                                <div className="relative border-2 border-dashed border-primary/20 rounded-lg p-3 text-center hover:bg-primary/5 transition-colors cursor-pointer group">
                                                                    <input
                                                                        type="file"
                                                                        accept="image/jpeg, image/png"
                                                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                                                        onChange={async (e) => {
                                                                            const file = e.target.files?.[0];
                                                                            if (!file) return;
                                                                            setIsUploading(item.id);
                                                                            try {
                                                                                const urlRes = await fetch("/api/prints/upload", {
                                                                                    method: "POST",
                                                                                    headers: { "Content-Type": "application/json" },
                                                                                    body: JSON.stringify({ fileName: file.name, fileType: file.type }),
                                                                                });
                                                                                const { signedUrl, publicUrl } = await urlRes.json();
                                                                                await fetch(signedUrl, { method: "PUT", body: file, headers: { "Content-Type": file.type } });

                                                                                // Update the item in cart with the uploaded URL
                                                                                const updatedItems = items.map(it => it.id === item.id ? { ...it, uploadUrl: publicUrl } : it);
                                                                                usePrintsCartStore.setState({ items: updatedItems });
                                                                                toast.success(t("quality_approved"));
                                                                            } catch (err) {
                                                                                toast.error(t("upload_failed_toast"));
                                                                            } finally {
                                                                                setIsUploading(null);
                                                                            }
                                                                        }}
                                                                    />
                                                                    {isUploading === item.id ? (
                                                                        <Loader2 className="w-5 h-5 animate-spin mx-auto text-primary" />
                                                                    ) : (
                                                                        <div className="flex flex-col items-center">
                                                                            <UploadCloud className="w-5 h-5 text-primary mb-1 group-hover:scale-110 transition-transform" />
                                                                            <span className="text-[10px] font-medium">{t("drag_drop")}</span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="flex items-center justify-between mt-2">
                                                                <div className="flex items-center border rounded-md h-7 px-1 bg-background">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => updatePrintQuantity(item.id, item.quantity - 1)}
                                                                        disabled={item.quantity <= 1}
                                                                        className="p-1 hover:text-primary disabled:opacity-30 transition-colors"
                                                                    >
                                                                        <Minus className="h-3 w-3" />
                                                                    </button>
                                                                    <span className="w-8 text-center text-xs font-bold tabular-nums">
                                                                        {item.quantity}
                                                                    </span>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => updatePrintQuantity(item.id, item.quantity + 1)}
                                                                        className="p-1 hover:text-primary transition-colors"
                                                                    >
                                                                        <Plus className="h-3 w-3" />
                                                                    </button>
                                                                </div>
                                                                <span className="font-bold text-primary">€{(item.price * item.quantity).toFixed(2)}</span>
                                                                <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive shrink-0" onClick={() => removePrintFromCart(item.id)} aria-label={t("remove_item")}>
                                                                    <Trash2 className="w-4 h-4" />
                                                                </Button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="pt-2 space-y-4">
                                            <div className="space-y-2">
                                                <span className="text-sm font-medium text-muted-foreground">{t("shipping_method")}</span>
                                                {isCalculatingShipping ? (
                                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                        {t("calculating_rates")}
                                                    </div>
                                                ) : shippingOptions.length > 0 ? (
                                                    <RadioGroup
                                                        value={selectedMethodIndex?.toString()}
                                                        onValueChange={(v) => setSelectedMethodIndex(parseInt(v))}
                                                        className="space-y-1"
                                                    >
                                                        {shippingOptions.map((option, idx) => (
                                                            <div key={option.method} className="flex items-center space-x-2 rounded-md border p-2 hover:bg-muted/50 transition-colors">
                                                                <RadioGroupItem value={idx.toString()} id={`method-${idx}`} />
                                                                <Label htmlFor={`method-${idx}`} className="flex-1 cursor-pointer flex justify-between items-center text-xs">
                                                                    <span className="font-medium">{option.method}</span>
                                                                    <span>€{(option.shippingCost + option.shippingTax).toFixed(2)}</span>
                                                                </Label>
                                                            </div>
                                                        ))}
                                                    </RadioGroup>
                                                ) : (
                                                    <p className="text-xs text-muted-foreground italic">{t("enter_address_for_options")}</p>
                                                )}
                                            </div>

                                            <div className="border-t pt-4 space-y-2">
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-muted-foreground">{t("subtotal")}</span>
                                                    <span>€{cartTotal.toFixed(2)}</span>
                                                </div>
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-muted-foreground">{t("shipping_tax")}</span>
                                                    <span>
                                                        {selectedOption ? `€${(selectedOption.shippingCost + selectedOption.shippingTax).toFixed(2)}` : "—"}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-muted-foreground">{t("taxes")}</span>
                                                    <span>
                                                        {selectedOption ? `€${(retailTax - selectedOption.shippingTax).toFixed(2)}` : "—"}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex justify-between font-bold text-lg pt-2 border-t mt-2">
                                                <span>{t("total")}</span>
                                                <span className="text-primary">
                                                    {isCalculatingShipping ? "..." : `€${finalTotal.toFixed(2)}`}
                                                </span>
                                            </div>
                                        </div>

                                        <Button
                                            type="submit"
                                            form="print-checkout-form"
                                            className="w-full h-12 text-base font-semibold mt-6"
                                            disabled={isSubmitting || isCalculatingShipping || selectedMethodIndex === null || items.some(it => !it.uploadUrl) || isUploading !== null}
                                        >
                                            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
                                            {isSubmitting ? t("processing") : t("complete_order")}
                                        </Button>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
