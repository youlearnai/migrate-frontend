import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useModalStore } from "@/hooks/use-modal-store";

export default function KeyboardModal() {
  const { isOpen, onClose, type } = useModalStore();
  const isModalOpen = isOpen && type === "keyboard";

  const shortcuts = [
    { action: "Open new chat", keys: ["⌘", "Shift", "O"] },
    { action: "Focus chat input", keys: ["Shift", "Esc"] },
    { action: "Copy last code block", keys: ["⌘", "Shift", ";"] },
    { action: "Copy last response", keys: ["⌘", "Shift", "C"] },
    { action: "Set custom instructions", keys: ["⌘", "Shift", "I"] },
    { action: "Toggle sidebar", keys: ["⌘", "Shift", "S"] },
    { action: "Delete chat", keys: ["⌘", "Shift", "⌫"] },
    { action: "Show shortcuts", keys: ["⌘", "/"] },
  ];

  return (
    <Dialog open={isModalOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            Keyboard shortcuts
          </DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4">
          {shortcuts.map((shortcut, index) => (
            <div key={index} className="flex justify-between items-center">
              <span className="text-sm">{shortcut.action}</span>
              <div className="flex gap-1">
                {shortcut.keys.map((key, keyIndex) => (
                  <span
                    key={keyIndex}
                    className="px-2 py-1 text-xs rounded border"
                  >
                    {key}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
