import { useState } from "react";
import { HttpTypes } from "@medusajs/types";
import { Button, Container, Heading, Text, toast } from "@medusajs/ui";
import { sdk } from "../../../../lib/client";

type OrderInvoiceSectionProps = {
  order: HttpTypes.AdminOrder;
};

export const OrderInvoiceSection = ({ order }: OrderInvoiceSectionProps) => {
  const [isDownloading, setIsDownloading] = useState(false);

  const downloadInvoice = async () => {
    setIsDownloading(true);

    try {
      const response = (await sdk.client.fetch(`/admin/orders/${order.id}/invoices`, {
        method: "GET",
        headers: {
          accept: "application/pdf",
        },
      })) as Response;

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `invoice-${order.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success("Invoice downloaded successfully");
    } catch (error) {
      console.error("Failed to download invoice:", error);
      toast.error("Failed to download invoice");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <Heading level="h2">Invoice</Heading>
          <Text size="small" className="text-ui-fg-subtle">
            Generate invoice for the order
          </Text>
        </div>
        <Button
          variant="secondary"
          disabled={isDownloading}
          onClick={downloadInvoice}
          isLoading={isDownloading}
        >
          Download Invoice
        </Button>
      </div>
    </Container>
  );
};
