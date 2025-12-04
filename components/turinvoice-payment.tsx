"use client";

import { motion } from "framer-motion";
import { Check, Clock, ExternalLink, Loader2, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface TurinvoicePaymentProps {
    idOrder: number;
    paymentUrl: string;
    amount: number;
    currency: string;
    onSuccess: () => void;
    onTimeout: () => void;
}

export function TurinvoicePayment({
    idOrder,
    paymentUrl,
    amount,
    currency,
    onSuccess,
    onTimeout,
}: TurinvoicePaymentProps) {
    const t = useTranslations("checkout.turinvoice");
    const [status, setStatus] = useState<"new" | "paying" | "paid" | "timeout">("new");
    const [timeLeft, setTimeLeft] = useState(300); // 5 minutes in seconds
    const [polling, setPolling] = useState(true);

    // Status polling
    useEffect(() => {
        if (!polling || status === "paid" || status === "timeout") {
            return;
        }

        const pollInterval = setInterval(async () => {
            try {
                const response = await fetch(
                    `/api/payment/status/turinvoice?idOrder=${idOrder}`
                );

                if (response.ok) {
                    const data = await response.json();

                    if (data.state === "paid") {
                        setStatus("paid");
                        setPolling(false);
                        onSuccess();
                    } else if (data.state === "paying") {
                        setStatus("paying");
                    }
                }
            } catch (error) {
                console.error("Status polling error:", error);
            }
        }, 2000); // Poll every 2 seconds

        return () => clearInterval(pollInterval);
    }, [idOrder, polling, status, onSuccess]);

    // Timeout countdown
    useEffect(() => {
        if (status === "paid" || status === "timeout") {
            return;
        }

        const countdownInterval = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    setStatus("timeout");
                    setPolling(false);
                    onTimeout();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(countdownInterval);
    }, [status, onTimeout]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, "0")}`;
    };

    const getStatusIcon = () => {
        switch (status) {
            case "new":
                return <Clock className="w-6 h-6 text-blue-500" />;
            case "paying":
                return <Loader2 className="w-6 h-6 text-yellow-500 animate-spin" />;
            case "paid":
                return <Check className="w-6 h-6 text-green-500" />;
            case "timeout":
                return <X className="w-6 h-6 text-red-500" />;
        }
    };

    const getStatusText = () => {
        switch (status) {
            case "new":
                return t("status_new");
            case "paying":
                return t("status_paying");
            case "paid":
                return t("status_paid");
            case "timeout":
                return t("status_timeout");
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <Card className="border-2 border-primary/20">
                <CardHeader className="bg-gradient-to-r from-primary/10 to-transparent">
                    <CardTitle className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                            {getStatusIcon()}
                        </div>
                        {t("title")}
                    </CardTitle>
                </CardHeader>

                <CardContent className="space-y-6 pt-6">
                    {/* Status Alert */}
                    <Alert
                        variant={
                            status === "paid"
                                ? "default"
                                : status === "timeout"
                                    ? "destructive"
                                    : "default"
                        }
                    >
                        <AlertTitle className="flex items-center gap-2">
                            {getStatusIcon()}
                            {getStatusText()}
                        </AlertTitle>
                        {status !== "paid" && status !== "timeout" && (
                            <AlertDescription>
                                {t("time_remaining")}: {formatTime(timeLeft)}
                            </AlertDescription>
                        )}
                    </Alert>

                    {/* Amount Display */}
                    <div className="bg-muted/50 rounded-lg p-4">
                        <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">{t("amount_label")}</span>
                            <span className="text-2xl font-bold text-primary">
                                {amount} {currency}
                            </span>
                        </div>
                    </div>

                    <Separator />

                    {/* Payment Instructions */}
                    {status !== "paid" && status !== "timeout" && (
                        <div className="space-y-4">
                            <div className="text-center space-y-2">
                                <p className="text-sm text-muted-foreground">
                                    {t("instruction_1")}
                                </p>
                                <Button
                                    asChild
                                    size="lg"
                                    className="w-full sm:w-auto"
                                    variant="default"
                                >
                                    <a
                                        href={paymentUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2"
                                    >
                                        <ExternalLink className="w-4 h-4" />
                                        {t("open_payment_page")}
                                    </a>
                                </Button>
                            </div>

                            <div className="text-center text-sm text-muted-foreground">
                                <p>{t("instruction_2")}</p>
                            </div>
                        </div>
                    )}

                    {/* Success Message */}
                    {status === "paid" && (
                        <div className="text-center space-y-2">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                                <Check className="w-8 h-8 text-green-600" />
                            </div>
                            <p className="text-lg font-semibold text-green-600">
                                {t("payment_successful")}
                            </p>
                            <p className="text-sm text-muted-foreground">
                                {t("confirmation_message")}
                            </p>
                        </div>
                    )}

                    {/* Timeout Message */}
                    {status === "timeout" && (
                        <div className="text-center space-y-2">
                            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                                <X className="w-8 h-8 text-red-600" />
                            </div>
                            <p className="text-lg font-semibold text-red-600">
                                {t("payment_timeout")}
                            </p>
                            <p className="text-sm text-muted-foreground">
                                {t("timeout_message")}
                            </p>
                        </div>
                    )}

                    {/* Security Notice */}
                    <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                        <p className="text-xs text-blue-800 dark:text-blue-200 text-center">
                            🔒 {t("security_notice")}
                        </p>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
}
