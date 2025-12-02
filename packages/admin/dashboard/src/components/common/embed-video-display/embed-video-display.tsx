import { useEffect, useRef } from "react";

interface EmbedVideoDisplayProps {
  embedCode: string;
  className?: string;
}

export const EmbedVideoDisplay = ({ embedCode, className = "" }: EmbedVideoDisplayProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current && embedCode) {
      // Clear the container
      containerRef.current.innerHTML = "";

      // Create a temporary div to parse the embed code
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = embedCode;

      // Get the iframe or embed element
      const embedElement = tempDiv.querySelector("iframe, embed, video");

      if (embedElement) {
        // Clone the element to avoid modifying the original
        const clonedElement = embedElement.cloneNode(true) as HTMLElement;

        // Set responsive styles
        clonedElement.style.width = "100%";
        clonedElement.style.height = "100%";
        clonedElement.style.border = "none";
        clonedElement.style.borderRadius = "8px";

        // Append to container
        containerRef.current.appendChild(clonedElement);
      }
    }
  }, [embedCode]);

  return (
    <div
      ref={containerRef}
      className={`w-full h-full min-h-[400px] min-w-[600px] aspect-video ${className}`}
    />
  );
};
