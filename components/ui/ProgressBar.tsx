"use client";
import { AppProgressBar } from "next-nprogress-bar";

export default function ProgressBar() {
  return (
    <AppProgressBar
      height="3px"
      color="var(--ap-blue)"
      options={{ showSpinner: false }}
      shallowRouting
    />
  );
}
