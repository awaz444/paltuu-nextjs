import React from "react";
import OTPInput, { OTPInputProps } from "react-otp-input";

interface CustomOTPInputProps extends OTPInputProps {
  separator?: React.ReactNode;
}

const CustomOTPInput: React.FC<CustomOTPInputProps> = ({
  separator,
  ...props
}) => {
  // Pass the separator prop (using type assertion if necessary)
  return <OTPInput {...props} separator={separator as any} />;
};

export default CustomOTPInput;
