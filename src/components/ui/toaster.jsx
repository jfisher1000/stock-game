// src/components/ui/toaster.jsx

/**
 * @fileoverview A component that renders toast notifications.
 *
 * This file is adapted from shadcn/ui. The Toaster component is responsible
 * for rendering all toast notifications in the application. It should be
 * placed at the root of the application so that toasts can be displayed
 * from any page or component.
 */

import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast";
// CORRECTED IMPORT PATH: Points to the actual location of the use-toast hook.
import { useToast } from "@/components/ui/use-toast";

export function Toaster() {
  const { toasts } = useToast();

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        return (
          <Toast key={id} {...props}>
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
            </div>
            {action}
            <ToastClose />
          </Toast>
        );
      })}
      <ToastViewport />
    </ToastProvider>
  );
}
