import React from "react";
import { Drawer, Button } from "@medusajs/ui";

export type DrawerItem = {
  label: string;
  value: React.ReactNode;
};

type DetailDrawerProps = {
  open: boolean;
  onClose: () => void;
  data: DrawerItem[];
  title?: string;
};

const DetailDrawer: React.FC<DetailDrawerProps> = ({
  open,
  onClose,
  data,
  title = "Review Details",
}) => {
  return (
    <Drawer open={open} onOpenChange={isOpen => !isOpen && onClose()}>
      <Drawer.Content>
        <Drawer.Header>
          <Drawer.Title>
            <div className="font-sans font-medium h1-core">{title}</div>
          </Drawer.Title>
        </Drawer.Header>

        <Drawer.Body>
          <div className="max-h-[calc(100vh-160px)] overflow-y-auto pr-2 txt-compact-small">
            {data.map((item, idx) => (
              <div key={idx} className="flex items-start  py-2 border-b border-ui-border-base">
                <div className="text-ui-fg-subtle font-medium font-sans  w-1/3">{item.label}</div>
                <div className="text-ui-fg-muted whitespace-pre-wrap w-2/3 ">{item.value}</div>
              </div>
            ))}
          </div>
        </Drawer.Body>

        <Drawer.Footer>
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </Drawer.Footer>
      </Drawer.Content>
    </Drawer>
  );
};

export default DetailDrawer;
