"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface PhoneInputProps
  extends Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    "onChange" | "value"
  > {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  required?: boolean;
}

export function PhoneInput({
  value,
  onChange,
  label,
  required = false,
  placeholder = "Enter 10-digit mobile number",
  ...props
}: PhoneInputProps) {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    // Remove all non-digits
    const cleanValue = inputValue.replace(/\D/g, "");
    // Limit to 10 digits
    const limitedValue = cleanValue.substring(0, 10);
    onChange(limitedValue);
  };

  return (
    <div className="space-y-2">
      {label && (
        <Label
          htmlFor={props.id}
          className={
            required
              ? "after:content-['*'] after:text-destructive after:ml-1"
              : ""
          }
        >
          {label}
        </Label>
      )}

      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">
          +91
        </div>
        <Input
          {...props}
          type="tel"
          value={value}
          onChange={handleInputChange}
          placeholder={placeholder}
          className="pl-12"
          maxLength={10}
        />
      </div>

      {value && value.length === 10 && (
        <p className="text-xs text-green-600">
          ✓ Valid mobile number: +91 {value}
        </p>
      )}

      {value && value.length > 0 && value.length < 10 && (
        <p className="text-xs text-muted-foreground">
          Enter {10 - value.length} more digits
        </p>
      )}
    </div>
  );
}
