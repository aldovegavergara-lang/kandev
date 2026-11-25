"use client";

import type { ReactNode } from "react";
import { SettingsGroup } from "./settings-group";

type SettingsSectionProps = {
  icon?: ReactNode;
  title: string;
  titleTestId?: string;
  titleAccessory?: ReactNode;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  discoveryTargetId?: string;
  framed?: boolean;
  /**
   * Add breathing room below the heading when the section is the page.
   */
  divided?: boolean;
};

export function SettingsSection({
  icon,
  title,
  titleTestId,
  titleAccessory,
  description,
  action,
  children,
  discoveryTargetId,
  framed = true,
  divided = false,
}: SettingsSectionProps) {
  return (
    <SettingsGroup
      title={
        <span className="flex items-center gap-2">
          {icon}
          {title}
        </span>
      }
      titleTestId={titleTestId}
      titleAccessory={titleAccessory}
      description={description}
      action={action}
      discoveryTargetId={discoveryTargetId}
      frame={framed ? "card" : "none"}
      contentClassName={divided ? "pt-4" : undefined}
    >
      {children}
    </SettingsGroup>
  );
}
