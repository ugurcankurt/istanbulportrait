"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Bell, Send, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const notificationSchema = z.object({
    title: z.string().min(1, "Title is required"),
    message: z.string().min(1, "Message is required"),
    url: z.string().optional(),
});

type NotificationFormValues = z.infer<typeof notificationSchema>;

export default function NotificationsPage() {
    const [isLoading, setIsLoading] = useState(false);

    const form = useForm<NotificationFormValues>({
        resolver: zodResolver(notificationSchema),
        defaultValues: {
            title: "",
            message: "",
            url: "/",
        },
    });

    async function onSubmit(data: NotificationFormValues) {
        setIsLoading(true);
        try {
            const response = await fetch("/api/push/send", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                throw new Error("Failed to send notifications");
            }

            const result = await response.json();
            toast.success(result.message || "Notifications sent successfully");
            form.reset();
        } catch (error) {
            console.error(error);
            toast.error("Failed to send notifications. Please try again.");
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Push Notifications</h1>
                <p className="text-muted-foreground">
                    Send updates to all subscribed users
                </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Bell className="h-5 w-5" />
                            New Notification
                        </CardTitle>
                        <CardDescription>
                            Create a new push notification to send to all subscribers.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Form {...form}>
                            <form
                                onSubmit={form.handleSubmit(onSubmit)}
                                className="space-y-4"
                            >
                                <FormField
                                    control={form.control}
                                    name="title"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Title</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g. New Blog Post!" {...field} />
                                            </FormControl>
                                            <FormDescription>
                                                The main headline of your notification.
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="message"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Message</FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    placeholder="e.g. Check out our latest photography tips..."
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormDescription>
                                                Keep it short and engaging (approx. 100 characters).
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="url"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Link URL (Optional)</FormLabel>
                                            <FormControl>
                                                <Input placeholder="/blog/new-post" {...field} />
                                            </FormControl>
                                            <FormDescription>
                                                Where users will go when they click the notification.
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <Button type="submit" className="w-full" disabled={isLoading}>
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Sending...
                                        </>
                                    ) : (
                                        <>
                                            <Send className="mr-2 h-4 w-4" />
                                            Send Notification
                                        </>
                                    )}
                                </Button>
                            </form>
                        </Form>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Tips & Preview</CardTitle>
                        <CardDescription>
                            Best practices for higher engagement
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="p-4 border rounded-lg bg-secondary/50">
                            <h4 className="font-semibold mb-2 text-sm">Preview</h4>
                            <div className="bg-background p-3 rounded shadow-sm border flex items-start gap-3">
                                <div className="h-10 w-10 bg-primary/10 rounded flex items-center justify-center text-xl">
                                    📸
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-sm truncate">
                                        {form.watch("title") || "Notification Title"}
                                    </p>
                                    <p className="text-xs text-muted-foreground line-clamp-2">
                                        {form.watch("message") || "Notification message will appear here..."}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2 text-sm text-muted-foreground">
                            <p>🎯 <strong>Be concise:</strong> Mobile screens have limited space.</p>
                            <p>⏰ <strong>Timing matters:</strong> Send notifications when your users are likely to be active.</p>
                            <p>🔗 <strong>Deep linking:</strong> Use specific URLs to take users directly to content.</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
