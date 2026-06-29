"use client";
import { ToastContainer, useToast } from "@/components/ui/Toast";
import LoadingOverlay from "@/components/ui/LoadingOverlay";
import { useAppStore } from "@/lib/store";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const { isLoading } = useAppStore();
  const { toasts, removeToast } = useToast();

  return (
    <>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      <LoadingOverlay isLoading={isLoading} />
    </>
  );
}