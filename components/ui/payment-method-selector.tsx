"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertCircle,
  CreditCard,
  Smartphone,
  Building2,
  Banknote,
} from "lucide-react";

interface PaymentSettings {
  upiId: string;
  upiMobile: string;
  bankAccountName: string;
  bankAccountNumber: string;
  bankName: string;
  ifscCode: string;
  branchName: string;
  qrCodeUrl: string | null;
}

interface PaymentMethodSelectorProps {
  value: string;
  onChange: (value: string) => void;
  paymentSettings?: PaymentSettings | null;
  amount: number;
}

const paymentMethods = [
  { id: "UPI", label: "UPI Payment", icon: Smartphone },
  { id: "BANK_TRANSFER", label: "Bank Transfer", icon: Building2 },
  { id: "ONLINE", label: "Online Banking", icon: CreditCard },
  { id: "CASH", label: "Cash Payment", icon: Banknote },
];

export function PaymentMethodSelector({
  value,
  onChange,
  paymentSettings,
  amount,
}: PaymentMethodSelectorProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {paymentMethods.map((method) => {
          const Icon = method.icon;
          const isSelected = value === method.id;

          return (
            <Button
              key={method.id}
              type="button"
              variant={isSelected ? "default" : "outline"}
              onClick={() => onChange(method.id)}
              className="flex items-center gap-2"
            >
              <Icon className="h-4 w-4" />
              {method.label}
            </Button>
          );
        })}
      </div>

      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">Amount:</span>
        <Badge variant="outline" className="text-lg font-semibold">
          ₹{amount.toLocaleString()}
        </Badge>
      </div>

      {/* Payment Details */}
      {value === "UPI" && paymentSettings?.upiId && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              UPI Payment Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium">UPI ID:</span>
                <span className="text-sm font-mono">
                  {paymentSettings.upiId}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">Mobile:</span>
                <span className="text-sm font-mono">
                  +91 {paymentSettings.upiMobile}
                </span>
              </div>
            </div>

            {paymentSettings.qrCodeUrl && (
              <div className="text-center">
                <p className="text-sm font-medium mb-2">Scan QR Code to Pay</p>
                <img
                  src={paymentSettings.qrCodeUrl}
                  alt="UPI QR Code"
                  className="w-32 h-32 mx-auto border rounded"
                />
              </div>
            )}

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                After payment, keep the transaction screenshot for verification.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}

      {value === "BANK_TRANSFER" && paymentSettings?.bankAccountName && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Bank Transfer Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="grid gap-2 text-sm">
              <div className="flex justify-between">
                <span className="font-medium">Account Name:</span>
                <span className="font-mono">
                  {paymentSettings.bankAccountName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Account Number:</span>
                <span className="font-mono">
                  {paymentSettings.bankAccountNumber}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Bank:</span>
                <span>{paymentSettings.bankName}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">IFSC:</span>
                <span className="font-mono">{paymentSettings.ifscCode}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Branch:</span>
                <span>{paymentSettings.branchName}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {value === "ONLINE" && (
        <Alert>
          <CreditCard className="h-4 w-4" />
          <AlertDescription>
            Online banking payment link will be provided after registration.
          </AlertDescription>
        </Alert>
      )}

      {value === "CASH" && (
        <Alert>
          <Banknote className="h-4 w-4" />
          <AlertDescription>
            Cash payment can be made at the venue or during team meetup.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
