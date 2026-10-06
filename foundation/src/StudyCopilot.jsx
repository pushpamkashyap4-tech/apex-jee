import React from "react";
import { Bot } from "lucide-react";
import ModulePlaceholder from "./ModulePlaceholder.jsx";

export default function StudyCopilot() {
  return (
    <ModulePlaceholder
      icon={Bot}
      title="Study Copilot is coming in Part 2"
      description="The navigation and app state are ready. AI chat and text-to-speech endpoints are placeholders until the next build part."
    />
  );
}
