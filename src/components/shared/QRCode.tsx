"use client";
import { QRCodeSVG } from "qrcode.react";

interface Props {
  /** The string encoded into the QR — typically the public verification URL. */
  value: string;
  size?: number;
  fg?: string;
}

/**
 * Real, scannable QR code. Encodes `value` (e.g. a pass verification URL) so
 * any phone camera can open it. Replaces the previous decorative seed pattern.
 */
export function QRCode({ value, size = 160, fg = "#0A0608" }: Props) {
  return (
    <QRCodeSVG
      value={value || " "}
      size={size}
      level="M"
      fgColor={fg}
      bgColor="#ffffff"
    />
  );
}
