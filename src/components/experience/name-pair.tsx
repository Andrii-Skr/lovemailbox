import { cn } from "@/lib/utils";

type Props = {
  senderName: string;
  recipientName: string;
  className?: string;
  heartClassName?: string;
  layout?: "inline" | "stacked";
};

export function NamePair({ senderName, recipientName, className, heartClassName, layout = "inline" }: Props) {
  return (
    <span
      className={cn("name-pair", className)}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: layout === "stacked" ? "column" : "row",
        gap: layout === "stacked" ? ".08em" : ".55em",
        whiteSpace: "nowrap",
      }}
    >
      <span>{senderName}</span>
      <svg
        aria-hidden="true"
        className={cn("name-pair-heart", heartClassName)}
        viewBox="0 0 24 22"
        fill="currentColor"
        width="12"
        height="11"
        style={{ display: "block", flex: "0 0 .85em", width: ".85em", height: ".8em", maxWidth: "16px", maxHeight: "15px" }}
      >
        <path d="M12 21S1 14.8 1 7.2C1 3.7 3.5 1.3 6.8 1.3c2.2 0 4 1.1 5.2 3 1.2-1.9 3-3 5.2-3 3.3 0 5.8 2.4 5.8 5.9C23 14.8 12 21 12 21Z" />
      </svg>
      <span>{recipientName}</span>
    </span>
  );
}
